import {
  CodeOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Input,
  Modal,
  Space,
  Spin,
  Tooltip,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { openContainerTerminalWindow } from '@/components/ClusterPodList/terminal';
import { getClusterNamespacePodList } from '@/services/kubeflare/cluster/namespace';
import { getClusterNodePodContainerLogs } from '@/services/kubeflare/cluster/node';

const LOG_TAIL_LINES = 500;
const LOG_FOLLOW_INTERVAL = 5000;
const DEFAULT_PAGE_SIZE = 10;

type ContainerReplicaRow = {
  id: string;
  pod: API.ClusterNodePodItem;
  container: API.ClusterNodePodContainer;
};

type ContainerReplicasProps = {
  workload?: API.ClusterWorkloadItem;
};

const useStyles = createStyles(({ token }) => ({
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  statusDotDefault: {
    backgroundColor: token.colorTextQuaternary,
    boxShadow: `0 0 0 3px ${token.colorFillSecondary}`,
  },
  statusDotError: {
    backgroundColor: token.colorError,
    boxShadow: `0 0 0 3px ${token.colorErrorBg}`,
  },
  statusDotSuccess: {
    backgroundColor: token.colorSuccess,
    boxShadow: `0 0 0 3px ${token.colorSuccessBg}`,
  },
  statusDotWarning: {
    backgroundColor: token.colorWarning,
    boxShadow: `0 0 0 3px ${token.colorWarningBg}`,
  },
  logModal: {
    '.ant-modal-content': {
      padding: 0,
      overflow: 'hidden',
    },
    '.ant-modal-header': {
      margin: 0,
      padding: `${token.paddingLG}px ${token.paddingLG}px ${token.paddingMD}px`,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
    },
    '.ant-modal-body': {
      padding: 0,
    },
  },
  logViewer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 520,
    backgroundColor: token.colorBgLayout,
  },
  logActions: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    padding: `${token.paddingSM}px ${token.paddingLG}px`,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    backgroundColor: token.colorBgContainer,
  },
  logDivider: {
    width: 1,
    height: 18,
    backgroundColor: token.colorBorderSecondary,
  },
  logContent: {
    boxSizing: 'border-box',
    height: 520,
    margin: 0,
    padding: token.paddingLG,
    overflow: 'auto',
    backgroundColor: '#0f172a',
    color: '#e5e7eb',
    fontSize: token.fontSizeSM,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  emptyLog: {
    padding: token.paddingLG,
    color: token.colorTextTertiary,
  },
  search: {
    width: 260,
  },
}));

const getLabelSelector = (selector?: Record<string, string>) =>
  Object.entries(selector || {})
    .filter(([key, value]) => key && value)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');

const statusLabelMap: Record<string, string> = {
  running: '运行中',
  pending: '等待中',
  succeeded: '已完成',
  failed: '失败',
  unknown: '未知',
  terminating: '删除中',
  waiting: '等待中',
  terminated: '已终止',
  crashloopbackoff: '崩溃循环',
  error: '异常',
  completed: '已完成',
  运行中: '运行中',
  等待中: '等待中',
  删除中: '删除中',
  已完成: '已完成',
  已终止: '已终止',
  崩溃循环: '崩溃循环',
  失败: '失败',
  未知: '未知',
  异常: '异常',
};

const getStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (!normalizedStatus) {
    return '-';
  }

  return statusLabelMap[normalizedStatus] || status || '-';
};

const getStatusType = (
  status?: string,
): 'default' | 'error' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'running' || normalizedStatus === '运行中') {
    return 'success';
  }
  if (
    normalizedStatus === 'waiting' ||
    normalizedStatus === 'pending' ||
    normalizedStatus === 'terminating' ||
    normalizedStatus === '等待中' ||
    normalizedStatus === '删除中'
  ) {
    return 'warning';
  }
  if (
    normalizedStatus === 'terminated' ||
    normalizedStatus === 'failed' ||
    normalizedStatus === 'crashloopbackoff' ||
    normalizedStatus === 'error' ||
    normalizedStatus === '未知' ||
    normalizedStatus === '异常'
  ) {
    return 'error';
  }
  return 'default';
};

const getLogDownloadFileName = (
  pod?: API.ClusterNodePodItem,
  container?: API.ClusterNodePodContainer,
) =>
  `${pod?.namespace || 'default'}-${pod?.name || 'pod'}-${
    container?.name || 'container'
  }.log`.replace(/[^\w.-]+/g, '-');

const getRowKeywordValues = (row: ContainerReplicaRow) => [
  row.pod.name,
  row.pod.namespace,
  row.pod.pod_ip,
  row.pod.node_ip,
  row.pod.node_name,
  row.pod.status,
  row.pod.phase,
  row.container.name,
  row.container.status,
  getStatusLabel(row.pod.status || row.pod.phase),
  getStatusLabel(row.container.status),
];

const ContainerReplicas = ({ workload }: ContainerReplicasProps) => {
  const { message } = App.useApp();
  const { styles } = useStyles();
  const logContentRef = useRef<HTMLPreElement>(null);
  const [loading, setLoading] = useState(false);
  const [pods, setPods] = useState<API.ClusterNodePodItem[]>([]);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<{
    pod: API.ClusterNodePodItem;
    container: API.ClusterNodePodContainer;
  }>();
  const [logContent, setLogContent] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  const [logFollowing, setLogFollowing] = useState(true);
  const [keyword, setKeyword] = useState('');
  const labelSelector = useMemo(
    () => getLabelSelector(workload?.selector),
    [workload?.selector],
  );
  const rows = useMemo(
    () =>
      pods.flatMap((pod) =>
        (pod.containers || []).map((container) => ({
          id: `${pod.id || pod.name}-${container.name}`,
          pod,
          container,
        })),
      ),
    [pods],
  );
  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return rows;
    }

    return rows.filter((row) =>
      getRowKeywordValues(row)
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedKeyword)),
    );
  }, [keyword, rows]);
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };

  const fetchPods = useCallback(async () => {
    if (!workload?.namespace || !labelSelector) {
      setPods([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterNamespacePodList({
        namespace: workload.namespace,
        labelSelector,
      });
      setPods(res.data.items || []);
    } finally {
      setLoading(false);
    }
  }, [labelSelector, workload?.namespace]);

  const fetchContainerLogs = useCallback(async () => {
    if (!logTarget) {
      return;
    }

    const { pod, container } = logTarget;

    if (!pod.namespace || !pod.name || !container.name) {
      message.error('容器日志参数不完整');
      return;
    }

    setLogLoading(true);
    try {
      const logs = await getClusterNodePodContainerLogs(
        {
          namespace: pod.namespace,
          podName: pod.name,
          container: container.name,
          tailLines: LOG_TAIL_LINES,
          timestamps: true,
        },
        {
          skipErrorHandler: true,
        },
      );
      setLogContent(String(logs || ''));
    } catch (_error) {
      message.error('容器日志获取失败');
    } finally {
      setLogLoading(false);
    }
  }, [logTarget, message]);

  const openContainerLog = (row: ContainerReplicaRow) => {
    setLogTarget({
      pod: row.pod,
      container: row.container,
    });
    setLogContent('');
    setLogFollowing(true);
    setLogModalOpen(true);
  };

  const openContainerTerminal = (row: ContainerReplicaRow) => {
    const result = openContainerTerminalWindow({
      namespace: row.pod.namespace,
      podName: row.pod.name,
      containerName: row.container.name,
    });

    if (!result.ok) {
      message.warning(
        result.reason === 'popup-blocked'
          ? '浏览器已阻止新窗口，请允许弹窗后重试'
          : '容器终端参数不完整',
      );
    }
  };

  const closeContainerLog = () => {
    setLogModalOpen(false);
    setLogFollowing(false);
  };

  const downloadContainerLogs = () => {
    if (!logContent) {
      message.warning('暂无可下载的日志');
      return;
    }

    const blob = new Blob([logContent], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getLogDownloadFileName(
      logTarget?.pod,
      logTarget?.container,
    );
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchPods();
  }, [fetchPods]);

  useEffect(() => {
    if (logModalOpen && logTarget) {
      void fetchContainerLogs();
    }
  }, [fetchContainerLogs, logModalOpen, logTarget]);

  useEffect(() => {
    if (!logModalOpen || !logFollowing) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void fetchContainerLogs();
    }, LOG_FOLLOW_INTERVAL);

    return () => window.clearInterval(timer);
  }, [fetchContainerLogs, logFollowing, logModalOpen]);

  useEffect(() => {
    const logContentElement = logContentRef.current;
    if (logContentElement) {
      logContentElement.scrollTop = logContentElement.scrollHeight;
    }
  }, [logContent]);

  const renderStatus = (status?: string) => {
    const statusType = getStatusType(status);

    return (
      <span className={styles.status}>
        <span
          className={[styles.statusDot, statusDotClassNames[statusType]].join(
            ' ',
          )}
        />
        <span>{getStatusLabel(status)}</span>
      </span>
    );
  };

  const columns: ProColumns<ContainerReplicaRow>[] = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 72,
      search: false,
      renderText: (_, _record, index) => index + 1,
    },
    {
      title: '名称',
      dataIndex: ['pod', 'name'],
      ellipsis: true,
      render: (_, record) => {
        if (!record.pod.name) {
          return '-';
        }

        return (
          <Typography.Text copyable={{ text: record.pod.name }} ellipsis>
            {record.pod.name}
          </Typography.Text>
        );
      },
    },
    {
      title: 'IP 地址',
      dataIndex: ['pod', 'pod_ip'],
      ellipsis: true,
      renderText: (_, record) => record.pod.pod_ip || '-',
    },
    {
      title: '状态',
      dataIndex: ['pod', 'status'],
      render: (_, record) =>
        renderStatus(record.pod.status || record.pod.phase),
    },
    {
      title: '重启次数',
      dataIndex: ['container', 'restart_count'],
      width: 96,
      renderText: (_, record) => record.container.restart_count || 0,
    },
    {
      title: '容器状态',
      dataIndex: ['container', 'status'],
      render: (_, record) => renderStatus(record.container.status),
    },
    {
      title: '节点 IP',
      dataIndex: ['pod', 'node_ip'],
      ellipsis: true,
      renderText: (_, record) => record.pod.node_ip || '-',
    },
    {
      title: '节点名称',
      dataIndex: ['pod', 'node_name'],
      ellipsis: true,
      renderText: (_, record) => record.pod.node_name || '-',
    },

    {
      title: '创建时间',
      dataIndex: ['pod', 'create_time'],
      valueType: 'dateTime',
      width: 180,
      renderText: (_, record) => record.pod.create_time || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 132,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="容器日志">
            <Button
              aria-label={`查看 ${record.container.name || '容器'} 日志`}
              icon={<FileTextOutlined />}
              onClick={() => openContainerLog(record)}
              type="text"
            />
          </Tooltip>
          <Tooltip title="终端">
            <Button
              aria-label={`打开 ${record.container.name || '容器'} 终端`}
              icon={<CodeOutlined />}
              onClick={() => openContainerTerminal(record)}
              type="text"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<ContainerReplicaRow>
        rowKey="id"
        search={false}
        loading={loading}
        columns={columns}
        dataSource={filteredRows}
        pagination={{
          defaultPageSize: DEFAULT_PAGE_SIZE,
          showSizeChanger: true,
        }}
        headerTitle={
          <Input
            allowClear
            className={styles.search}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索容器组名称 / IP / 节点 / 状态"
            suffix={<SearchOutlined />}
            value={keyword}
          />
        }
        options={{
          reload: fetchPods,
        }}
      />
      <Modal
        className={styles.logModal}
        footer={null}
        onCancel={closeContainerLog}
        open={logModalOpen}
        title="容器日志"
        width="calc(100vw - 48px)"
      >
        <div className={styles.logViewer}>
          <div className={styles.logActions}>
            <Tooltip title={logFollowing ? '暂停自动追踪' : '启动自动追踪'}>
              <Button
                aria-label={logFollowing ? '暂停自动追踪' : '启动自动追踪'}
                icon={
                  logFollowing ? (
                    <PauseCircleOutlined />
                  ) : (
                    <PlayCircleOutlined />
                  )
                }
                onClick={() => setLogFollowing((value) => !value)}
                type="text"
              />
            </Tooltip>
            <div className={styles.logDivider} />
            <Tooltip title="刷新当前日志">
              <Button
                aria-label="刷新当前日志"
                icon={<ReloadOutlined />}
                loading={logLoading}
                onClick={() => void fetchContainerLogs()}
                type="text"
              />
            </Tooltip>
            <div className={styles.logDivider} />
            <Tooltip title="下载当前容器日志">
              <Button
                aria-label="下载当前容器日志"
                disabled={!logContent}
                icon={<DownloadOutlined />}
                onClick={downloadContainerLogs}
                type="text"
              />
            </Tooltip>
          </div>
          <Spin spinning={logLoading && !logContent}>
            {logContent ? (
              <pre className={styles.logContent} ref={logContentRef}>
                {logContent}
              </pre>
            ) : (
              <div className={styles.emptyLog}>暂无日志</div>
            )}
          </Spin>
        </div>
      </Modal>
    </>
  );
};

export default ContainerReplicas;
