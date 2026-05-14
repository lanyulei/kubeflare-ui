import {
  ClusterOutlined,
  CodeOutlined,
  DownloadOutlined,
  DownOutlined,
  FileTextOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  UpOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Empty,
  Input,
  Modal,
  Pagination,
  Popover,
  Spin,
  Tooltip,
} from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getClusterNodePodContainerLogs } from '@/services/kubeflare/cluster/node';
import SectionTitle from '../SectionTitle';
import { openContainerTerminalWindow } from './terminal';

const useStyles = createStyles(({ token }) => ({
  pods: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,

    '@media (max-width: 576px)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
  search: {
    width: 260,

    '@media (max-width: 576px)': {
      width: '100%',
    },
  },
  refreshButton: {
    flex: '0 0 auto',
    color: token.colorTextSecondary,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  item: {
    overflow: 'hidden',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,
    color: token.colorText,
    lineHeight: 1.5,
    transition: `background-color ${token.motionDurationMid}`,

    '&:hover': {
      backgroundColor: token.colorFillSecondary,
    },
  },
  itemHeader: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(220px, 1fr) minmax(136px, 172px) minmax(160px, 0.8fr) 40px',
    alignItems: 'center',
    columnGap: token.marginMD,
    minHeight: 62,
    padding: `0 ${token.paddingMD}px`,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
      rowGap: token.marginXS,
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
    },
  },
  main: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginMD,
  },
  icon: {
    position: 'relative',
    flex: '0 0 auto',
    width: 42,
    height: 42,
    color: token.colorTextSecondary,
    fontSize: 34,
    lineHeight: '42px',
    textAlign: 'center',
  },
  iconBadge: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 13,
    height: 13,
    border: `2px solid ${token.colorBgContainer}`,
    borderRadius: '50%',
    backgroundColor: token.colorSuccess,
  },
  content: {
    minWidth: 0,
  },
  name: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    marginTop: 3,
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  ip: {
    minWidth: 0,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      paddingLeft: 50,
    },
  },
  ipValue: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  ipLabel: {
    marginTop: 3,
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  action: {
    justifySelf: 'end',
    color: token.colorTextSecondary,
  },
  expandedSummary: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(220px, 1fr) minmax(136px, 172px) minmax(160px, 0.8fr) 40px',
    alignItems: 'center',
    columnGap: token.marginMD,
    minHeight: 62,
    padding: `0 ${token.paddingMD}px`,
    backgroundColor: '#1f2937',
    color: '#fff',

    '.ant-btn': {
      color: 'rgba(255, 255, 255, 0.72)',
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
      rowGap: token.marginXS,
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
    },
  },
  expandedName: {
    color: '#fff',
  },
  expandedMeta: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  expandedIp: {
    minWidth: 0,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      paddingLeft: 50,
    },
  },
  expandedIpValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  expandedIpLabel: {
    marginTop: 3,
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 13,
    lineHeight: 1.5,
  },
  podStats: {
    display: 'grid',
    gridTemplateColumns: '48px minmax(72px, 112px)',
    minWidth: 0,
    gap: token.marginSM,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      paddingLeft: 50,
    },

    '@media (max-width: 576px)': {
      gridTemplateColumns: '48px minmax(72px, 112px)',
    },
  },
  podMetric: {
    minWidth: 0,
  },
  podMetricValue: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  podMetricLabel: {
    marginTop: 3,
    color: token.colorTextTertiary,
    fontSize: 12,
    lineHeight: 1.5,
  },
  expandedPodMetricValue: {
    color: '#fff',
  },
  expandedPodMetricLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  containerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginXS,
    padding: token.paddingSM,
    backgroundColor: token.colorFillAlter,
  },
  containerItem: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(220px, 1fr) minmax(90px, 140px) minmax(90px, 140px) minmax(130px, 180px)',
    alignItems: 'center',
    gap: token.marginMD,
    minHeight: 64,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorBgContainer,

    '@media (max-width: 992px)': {
      gridTemplateColumns: 'minmax(0, 1fr) minmax(110px, 1fr)',
    },

    '@media (max-width: 576px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: token.marginSM,
    },
  },
  containerMain: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginMD,
  },
  containerIcon: {
    position: 'relative',
    flex: '0 0 auto',
    width: 38,
    height: 38,
    color: token.colorTextSecondary,
    fontSize: 28,
    lineHeight: '38px',
    textAlign: 'center',
  },
  containerStatusBadge: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 10,
    height: 10,
    border: `2px solid ${token.colorBgContainer}`,
    borderRadius: '50%',
    backgroundColor: token.colorSuccess,
  },
  containerContent: {
    minWidth: 0,
  },
  containerTitle: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginXS,
  },
  containerName: {
    minWidth: 0,
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  probeTrigger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 22,
    borderRadius: token.borderRadiusSM,
    backgroundColor: '#1f2937',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    padding: `0 3px`,
  },
  containerTriggers: {
    display: 'inline-flex',
    alignItems: 'center',
    flex: '0 0 auto',
    gap: 2,
  },
  containerTrigger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 22,
    padding: 0,
    border: 0,
    borderRadius: token.borderRadiusSM,
    backgroundColor: 'transparent',
    color: token.colorTextSecondary,
    cursor: 'pointer',
    fontSize: 13,
    lineHeight: 1,
    transition: `color ${token.motionDurationMid}, background-color ${token.motionDurationMid}`,

    '&:hover': {
      backgroundColor: token.colorFillSecondary,
      color: token.colorText,
    },

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 1,
    },
  },
  image: {
    marginTop: 3,
    color: token.colorTextTertiary,
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metricValue: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
  },
  containerPorts: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metricLabel: {
    marginTop: 3,
    color: token.colorTextTertiary,
    fontSize: 13,
  },
  probePopover: {
    width: 330,
  },
  probeItem: {
    '& + &': {
      marginTop: token.marginSM,
      paddingTop: token.paddingSM,
      borderTop: `1px solid ${token.colorBorderSecondary}`,
    },
  },
  probeTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
  },
  probeType: {
    display: 'inline-flex',
    alignItems: 'center',
    height: 22,
    padding: `0 ${token.paddingXXS}px`,
    borderRadius: token.borderRadiusSM,
    backgroundColor: token.colorSuccessBg,
    color: token.colorSuccessText,
    fontSize: 12,
  },
  probeTypeWarning: {
    backgroundColor: token.colorWarningBg,
    color: token.colorWarningText,
  },
  probeTypeInfo: {
    backgroundColor: token.colorInfoBg,
    color: token.colorInfoText,
  },
  probeMeta: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: 13,
  },
  probeDetail: {
    marginTop: token.marginXS,
    color: token.colorText,
    fontSize: 13,
  },
  logModal: {
    '.ant-modal-content': {
      padding: 0,
      overflow: 'hidden',
    },

    '.ant-modal-header': {
      margin: 0,
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
    },

    '.ant-modal-body': {
      padding: token.paddingSM,
      backgroundColor: token.colorBgLayout,
    },

    '.ant-modal-close': {
      top: 14,
      right: 18,
      width: 32,
      height: 32,
      borderRadius: token.borderRadius,
      backgroundColor: '#1f2937',
      color: '#fff',

      '&:hover': {
        backgroundColor: '#111827',
        color: '#fff',
      },
    },
  },
  logViewer: {
    position: 'relative',
    height: 'calc(100vh - 180px)',
    minHeight: 420,
    overflow: 'hidden',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: '#1f2937',

    '.ant-spin-nested-loading, .ant-spin-container': {
      height: '100%',
    },
  },
  logActions: {
    position: 'absolute',
    top: token.paddingMD,
    right: token.paddingMD,
    zIndex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    padding: `4px ${token.paddingXS}px`,
    borderRadius: 18,
    backgroundColor: 'rgba(71, 85, 105, 0.72)',
    backdropFilter: 'blur(8px)',

    '.ant-btn': {
      color: 'rgba(255, 255, 255, 0.86)',

      '&:hover': {
        color: '#fff',
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
      },

      '&[disabled]': {
        color: 'rgba(255, 255, 255, 0.34)',
      },
    },
  },
  logDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  logContent: {
    height: '100%',
    margin: 0,
    padding: `${token.paddingMD}px ${token.paddingLG}px`,
    overflow: 'auto',
    color: '#dbe4f0',
    fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.7,
    whiteSpace: 'pre',
  },
  logEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'rgba(255, 255, 255, 0.64)',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: token.paddingXXS,
    color: token.colorTextTertiary,
    fontSize: 13,

    '.ant-pagination-simple-pager input': {
      border: 0,
      boxShadow: 'none',
    },

    '.ant-pagination-prev .ant-pagination-item-link, .ant-pagination-next .ant-pagination-item-link':
      {
        border: 0,
        boxShadow: 'none',
      },

    '@media (max-width: 768px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      gap: token.marginSM,
    },
  },
}));

export type ClusterPodListProps = {
  dataSource?: API.ClusterNodePodItem[];
  loading?: boolean;
  pageSize?: number;
  searchPlaceholder?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
  onContainerLog?: (
    pod: API.ClusterNodePodItem,
    container: API.ClusterNodePodContainer,
  ) => void;
  onContainerTerminal?: (
    pod: API.ClusterNodePodItem,
    container: API.ClusterNodePodContainer,
  ) => void;
};

const DEFAULT_PAGE_SIZE = 10;
const LOG_TAIL_LINES = 500;
const LOG_FOLLOW_INTERVAL = 5000;

const getProbeTypeClassName = (
  type: string | undefined,
  styles: ReturnType<typeof useStyles>['styles'],
) => {
  if (type === '存活探针') {
    return `${styles.probeType} ${styles.probeTypeWarning}`;
  }
  if (type === '启动探针') {
    return `${styles.probeType} ${styles.probeTypeInfo}`;
  }
  return styles.probeType;
};

const formatCreateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : value;
};

const getPodStats = (pod: API.ClusterNodePodItem) => [
  {
    label: '就绪',
    value: pod.ready || '-',
  },
  {
    label: '状态',
    value: pod.status || pod.phase || '-',
  },
];

const getPodKeywordValues = (pod: API.ClusterNodePodItem) => [
  pod.name,
  pod.namespace,
  pod.pod_ip,
  pod.status,
  pod.phase,
];

const formatContainerPorts = (ports?: API.ClusterNodePodContainerPort[]) =>
  ports && ports.length > 0
    ? ports
        .map(
          (port) =>
            `${port.container_port || '-'}${
              port.protocol ? `/${port.protocol}` : ''
            }`,
        )
        .join('，')
    : '-';

const getLogDownloadFileName = (
  pod?: API.ClusterNodePodItem,
  container?: API.ClusterNodePodContainer,
) =>
  `${pod?.namespace || 'default'}-${pod?.name || 'pod'}-${
    container?.name || 'container'
  }.log`.replace(/[^\w.-]+/g, '-');

const ClusterPodList = ({
  dataSource = [],
  loading = false,
  pageSize = DEFAULT_PAGE_SIZE,
  searchPlaceholder = '搜索容器组名称 / 命名空间 / IP 地址',
  showRefresh = true,
  onRefresh,
  onContainerLog,
  onContainerTerminal,
}: ClusterPodListProps) => {
  const { message } = App.useApp();
  const { styles } = useStyles();
  const [keyword, setKeyword] = useState('');
  const [current, setCurrent] = useState(1);
  const [expandedPodId, setExpandedPodId] = useState<string>();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<{
    pod: API.ClusterNodePodItem;
    container: API.ClusterNodePodContainer;
  }>();
  const [logContent, setLogContent] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  const [logFollowing, setLogFollowing] = useState(true);
  const logContentRef = useRef<HTMLPreElement>(null);

  const filteredPods = useMemo(() => {
    const nextKeyword = keyword.trim().toLowerCase();

    if (!nextKeyword) {
      return dataSource;
    }

    return dataSource.filter((pod) =>
      getPodKeywordValues(pod)
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(nextKeyword)),
    );
  }, [dataSource, keyword]);

  const pagedPods = useMemo(() => {
    const start = (current - 1) * pageSize;
    return filteredPods.slice(start, start + pageSize);
  }, [current, filteredPods, pageSize]);

  useEffect(() => {
    setCurrent(1);
  }, [keyword, pageSize]);

  const toggleExpanded = (pod: API.ClusterNodePodItem) => {
    const podId = pod.id || pod.name;
    setExpandedPodId((value) => (value === podId ? undefined : podId));
  };

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

  const openContainerLog = (
    pod: API.ClusterNodePodItem,
    container: API.ClusterNodePodContainer,
  ) => {
    onContainerLog?.(pod, container);
    setLogTarget({ pod, container });
    setLogContent('');
    setLogFollowing(true);
    setLogModalOpen(true);
  };

  const openContainerTerminal = (
    pod: API.ClusterNodePodItem,
    container: API.ClusterNodePodContainer,
  ) => {
    const result = openContainerTerminalWindow({
      namespace: pod.namespace,
      podName: pod.name,
      containerName: container.name,
    });

    if (!result.ok) {
      message.warning(
        result.reason === 'popup-blocked'
          ? '浏览器已阻止新窗口，请允许弹窗后重试'
          : '容器终端参数不完整',
      );
      return;
    }

    onContainerTerminal?.(pod, container);
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

  const renderProbePopover = (probes?: API.ClusterNodePodContainerProbe[]) => (
    <div className={styles.probePopover}>
      {probes && probes.length > 0 ? (
        probes.map((probe) => (
          <div className={styles.probeItem} key={probe.type}>
            <div className={styles.probeTitle}>
              <span className={getProbeTypeClassName(probe.type, styles)}>
                {probe.type}
              </span>
              <span>{probe.handler}</span>
            </div>
            <div className={styles.probeMeta}>
              {probe.initial_delay_seconds || 0}s 初始延迟，
              {probe.timeout_seconds || 0}s 超时时间
            </div>
            <div className={styles.probeDetail}>{probe.detail}</div>
          </div>
        ))
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无探针" />
      )}
    </div>
  );

  const renderPodHeader = (pod: API.ClusterNodePodItem, expanded: boolean) => (
    <div className={expanded ? styles.expandedSummary : styles.itemHeader}>
      <div className={styles.main}>
        <div className={styles.icon}>
          <ClusterOutlined />
          <span className={styles.iconBadge} />
        </div>
        <div className={styles.content}>
          <Tooltip title={pod.name} placement="topLeft">
            <div className={expanded ? styles.expandedName : styles.name}>
              {pod.name}
            </div>
          </Tooltip>
          <div className={expanded ? styles.expandedMeta : styles.meta}>
            创建于 {formatCreateTime(pod.create_time)}
          </div>
        </div>
      </div>
      <div className={styles.podStats}>
        {getPodStats(pod).map((item) => (
          <div className={styles.podMetric} key={item.label}>
            <Tooltip title={item.value}>
              <div
                className={`${styles.podMetricValue} ${
                  expanded ? styles.expandedPodMetricValue : ''
                }`}
              >
                {item.value}
              </div>
            </Tooltip>
            <div
              className={`${styles.podMetricLabel} ${
                expanded ? styles.expandedPodMetricLabel : ''
              }`}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
      <div className={expanded ? styles.expandedIp : styles.ip}>
        <Tooltip title={pod.pod_ip || '-'} placement="topLeft">
          <div className={expanded ? styles.expandedIpValue : styles.ipValue}>
            {pod.pod_ip || '-'}
          </div>
        </Tooltip>
        <div className={expanded ? styles.expandedIpLabel : styles.ipLabel}>
          容器组 IP 地址
        </div>
      </div>
      <Button
        aria-label={expanded ? '收起容器组详情' : '展开容器组详情'}
        className={styles.action}
        icon={expanded ? <UpOutlined /> : <DownOutlined />}
        onClick={() => toggleExpanded(pod)}
        type="text"
      />
    </div>
  );

  const renderContainers = (pod: API.ClusterNodePodItem) => (
    <div className={styles.containerList}>
      <SectionTitle color={'#36435C'} fontSize={12} style={{ marginBottom: 0 }}>
        容器
      </SectionTitle>
      {pod.containers && pod.containers.length > 0 ? (
        pod.containers.map((container) => (
          <div className={styles.containerItem} key={container.name}>
            <div className={styles.containerMain}>
              <div className={styles.containerIcon}>
                <ClusterOutlined />
                <span className={styles.containerStatusBadge} />
              </div>
              <div className={styles.containerContent}>
                <div className={styles.containerTitle}>
                  <Tooltip title={container.name || '-'}>
                    <div className={styles.containerName}>
                      {container.name || '-'}
                    </div>
                  </Tooltip>
                  <span className={styles.containerTriggers}>
                    <Tooltip title="容器日志">
                      <button
                        aria-label={`查看 ${container.name || '容器'} 日志`}
                        className={styles.containerTrigger}
                        onClick={() => openContainerLog(pod, container)}
                        type="button"
                      >
                        <FileTextOutlined />
                      </button>
                    </Tooltip>
                    <Tooltip title="终端">
                      <button
                        aria-label={`打开 ${container.name || '容器'} 终端`}
                        className={styles.containerTrigger}
                        onClick={() => openContainerTerminal(pod, container)}
                        type="button"
                      >
                        <CodeOutlined />
                      </button>
                    </Tooltip>
                  </span>
                  {container.probes && container.probes.length > 0 ? (
                    <Popover
                      content={renderProbePopover(container.probes)}
                      placement="topLeft"
                      trigger="hover"
                    >
                      <span className={styles.probeTrigger}>探针</span>
                    </Popover>
                  ) : null}
                </div>
                <Tooltip title={container.image || '-'}>
                  <div className={styles.image}>
                    镜像：{container.image || '-'}
                  </div>
                </Tooltip>
              </div>
            </div>
            <div>
              <div className={styles.metricValue}>
                {container.status || '-'}
              </div>
              <div className={styles.metricLabel}>状态</div>
            </div>
            <div>
              <div className={styles.metricValue}>
                {container.restart_count || 0}
              </div>
              <div className={styles.metricLabel}>重启次数</div>
            </div>
            <div>
              <Tooltip title={formatContainerPorts(container.ports)}>
                <div
                  className={`${styles.metricValue} ${styles.containerPorts}`}
                >
                  {formatContainerPorts(container.ports)}
                </div>
              </Tooltip>
              <div className={styles.metricLabel}>端口</div>
            </div>
          </div>
        ))
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无容器" />
      )}
    </div>
  );

  return (
    <div className={styles.pods}>
      <div className={styles.toolbar}>
        <Input
          allowClear
          className={styles.search}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={searchPlaceholder}
          suffix={<SearchOutlined />}
          value={keyword}
        />
        {showRefresh ? (
          <Tooltip title="刷新">
            <Button
              aria-label="刷新容器组"
              className={styles.refreshButton}
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onRefresh}
              type="text"
            />
          </Tooltip>
        ) : null}
      </div>
      <Spin spinning={loading}>
        {filteredPods.length > 0 ? (
          <div className={styles.list}>
            {pagedPods.map((pod) => {
              const expanded = expandedPodId === (pod.id || pod.name);

              return (
                <div className={styles.item} key={pod.id || pod.name}>
                  {renderPodHeader(pod, expanded)}
                  {expanded ? renderContainers(pod) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
      <div className={styles.footer}>
        <span>总数：{filteredPods.length}</span>
        <Pagination
          current={current}
          pageSize={pageSize}
          showSizeChanger={false}
          total={filteredPods.length}
          onChange={setCurrent}
          size="small"
        />
      </div>
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
              <div className={styles.logEmpty}>暂无日志</div>
            )}
          </Spin>
        </div>
      </Modal>
    </div>
  );
};

export default ClusterPodList;
