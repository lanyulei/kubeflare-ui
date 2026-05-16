import {
  DownOutlined,
  EditOutlined,
  PlayCircleOutlined,
  StopOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { App, Button, Card, Dropdown, Tabs } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type { TaintEditorItem, TaintEffect } from '@/components/TaintEditor';
import {
  getClusterNodeList,
  updateClusterNodeLabels,
  updateClusterNodeScheduling,
  updateClusterNodeTaints,
} from '@/services/kubeflare/cluster/node';
import BasicInfo from './components/BasicInfo';
import EventTable from './components/EventTable';
import LabelModal from './components/LabelModal';
import NodeMetadata from './components/Metadata';
import Pods from './components/Pods';
import RunningStatus from './components/RunningStatus';
import TaintModal from './components/TaintModal';
import { decodeNodeName, getTaintEffect } from './helpers';
import useStyles from './styles';

const ClusterNodeDetail = () => {
  const { message, modal } = App.useApp();
  const { styles } = useStyles();
  const params = useParams<{ name?: string }>();
  const nodeName = useMemo(() => decodeNodeName(params.name), [params.name]);
  const labelRowIdRef = useRef(0);
  const taintRowIdRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelSaving, setLabelSaving] = useState(false);
  const [labelRows, setLabelRows] = useState<KeyValueEditorItem[]>([]);
  const [taintModalOpen, setTaintModalOpen] = useState(false);
  const [taintSaving, setTaintSaving] = useState(false);
  const [taintRows, setTaintRows] = useState<TaintEditorItem[]>([]);
  const [node, setNode] = useState<API.ClusterNodeItem>();

  const createLabelRow = useCallback((keyName = '', value = '') => {
    const nextId = labelRowIdRef.current;
    labelRowIdRef.current += 1;

    return {
      id: `label-${nextId}`,
      keyName,
      value,
    };
  }, []);

  const createTaintRow = useCallback(
    (keyName = '', value = '', effect: TaintEffect = 'NoSchedule') => {
      const nextId = taintRowIdRef.current;
      taintRowIdRef.current += 1;

      return {
        id: `taint-${nextId}`,
        keyName,
        value,
        effect,
      };
    },
    [],
  );

  const fetchNode = useCallback(async () => {
    if (!nodeName) {
      setNode(undefined);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterNodeList({ keyword: nodeName });
      const items = res.data.items || [];
      const nextNode =
        items.find((item) => item.name === nodeName) ||
        items.find((item) => item.name?.includes(nodeName));

      setNode(nextNode);
    } finally {
      setLoading(false);
    }
  }, [nodeName]);

  useEffect(() => {
    fetchNode();
  }, [fetchNode]);

  const isSchedulingDisabled =
    node?.unschedulable || node?.status?.toLowerCase() === 'schedulingdisabled';
  const openLabelModal = () => {
    const rows = Object.entries(node?.labels || {}).map(([keyName, value]) =>
      createLabelRow(keyName, value),
    );

    setLabelRows(rows);
    setLabelModalOpen(true);
  };
  const handleSaveLabels = async () => {
    if (!nodeName) {
      return;
    }

    const nextLabels: Record<string, string> = {};
    const labelKeys = new Set<string>();

    for (const row of labelRows) {
      const keyName = row.keyName.trim();

      if (!keyName) {
        message.warning('标签 Key 不能为空');
        return;
      }
      if (labelKeys.has(keyName)) {
        message.warning('标签 Key 不能重复');
        return;
      }

      labelKeys.add(keyName);
      nextLabels[keyName] = row.value.trim();
    }

    const labelsPatch: Record<string, string | null> = {};
    Object.keys(node?.labels || {}).forEach((keyName) => {
      if (!labelKeys.has(keyName)) {
        labelsPatch[keyName] = null;
      }
    });
    Object.entries(nextLabels).forEach(([keyName, value]) => {
      labelsPatch[keyName] = value;
    });

    setLabelSaving(true);
    try {
      await updateClusterNodeLabels(nodeName, { labels: labelsPatch });
      message.success('节点标签已更新');
      setLabelModalOpen(false);
      await fetchNode();
    } finally {
      setLabelSaving(false);
    }
  };
  const openTaintModal = () => {
    const rows = (node?.taints || []).map((taint) =>
      createTaintRow(
        taint.key || '',
        taint.value || '',
        getTaintEffect(taint.effect),
      ),
    );

    setTaintRows(rows);
    setTaintModalOpen(true);
  };
  const handleSaveTaints = async () => {
    if (!nodeName) {
      return;
    }

    const taintKeys = new Set<string>();
    const taints: API.ClusterNodeTaint[] = [];

    for (const row of taintRows) {
      const keyName = row.keyName.trim();

      if (!keyName) {
        message.warning('污点 Key 不能为空');
        return;
      }

      const taintKey = `${keyName}:${row.effect}`;
      if (taintKeys.has(taintKey)) {
        message.warning('相同 Key 和调度规则的污点不能重复');
        return;
      }

      taintKeys.add(taintKey);
      taints.push({
        key: keyName,
        value: row.value.trim(),
        effect: row.effect,
      });
    }

    setTaintSaving(true);
    try {
      await updateClusterNodeTaints(nodeName, { taints });
      message.success('节点污点已更新');
      setTaintModalOpen(false);
      await fetchNode();
    } finally {
      setTaintSaving(false);
    }
  };
  const handleToggleScheduling = () => {
    if (!nodeName) {
      return;
    }

    const nextUnschedulable = !isSchedulingDisabled;
    const actionText = nextUnschedulable ? '停止调度' : '启用调度';

    modal.confirm({
      title: `确认${actionText}该节点吗？`,
      content: nextUnschedulable
        ? '停止调度后，新的容器组将不会被调度到该节点。'
        : '启用调度后，新的容器组可以继续被调度到该节点。',
      okText: actionText,
      cancelText: '取消',
      onOk: async () => {
        setSchedulingLoading(true);
        try {
          await updateClusterNodeScheduling(nodeName, {
            unschedulable: nextUnschedulable,
          });
          message.success(`节点已${actionText}`);
          await fetchNode();
        } finally {
          setSchedulingLoading(false);
        }
      },
    });
  };
  const nodeActionItems = [
    {
      key: 'toggleScheduling',
      icon: isSchedulingDisabled ? <PlayCircleOutlined /> : <StopOutlined />,
      label: isSchedulingDisabled ? '启用调度' : '停止调度',
    },
    {
      key: 'editLabels',
      icon: <TagOutlined />,
      label: '编辑标签',
    },
    {
      key: 'editTaints',
      icon: <EditOutlined />,
      label: '编辑污点',
    },
  ];
  const moreInfoTabItems = [
    {
      key: 'status',
      label: '运行状态',
      children: <RunningStatus node={node} />,
    },
    {
      key: 'pods',
      label: '容器组',
      children: <Pods nodeName={nodeName} />,
    },
    {
      key: 'metadata',
      label: '元数据',
      children: <NodeMetadata node={node} />,
    },
    {
      key: 'events',
      label: '事件',
      children: <EventTable nodeName={nodeName} />,
    },
  ];

  return (
    <PageContainer
      title={nodeName || '节点详情'}
      onBack={() => history.back()}
      extra={[
        <Dropdown
          disabled={!node}
          key="node-actions"
          menu={{
            items: nodeActionItems,
            onClick: ({ key }) => {
              if (key === 'toggleScheduling') {
                handleToggleScheduling();
              }
              if (key === 'editLabels') {
                openLabelModal();
              }
              if (key === 'editTaints') {
                openTaintModal();
              }
            },
          }}
          trigger={['click']}
        >
          <Button disabled={!node} loading={schedulingLoading}>
            操作
            <DownOutlined />
          </Button>
        </Dropdown>,
      ]}
    >
      <BasicInfo loading={loading} node={node} />
      <div className={styles.moreInfo}>
        <Card className={styles.moreInfoCard}>
          <Tabs items={moreInfoTabItems} />
        </Card>
      </div>
      <LabelModal
        open={labelModalOpen}
        rows={labelRows}
        saving={labelSaving}
        onAddBlocked={() => message.warning('请先填写已有标签的 Key')}
        onCancel={() => setLabelModalOpen(false)}
        onChange={setLabelRows}
        onCreateItem={() => createLabelRow()}
        onOk={handleSaveLabels}
      />
      <TaintModal
        open={taintModalOpen}
        rows={taintRows}
        saving={taintSaving}
        onAddBlocked={() => message.warning('请先填写已有污点的 Key')}
        onCancel={() => setTaintModalOpen(false)}
        onChange={setTaintRows}
        onCreateItem={() => createTaintRow()}
        onOk={handleSaveTaints}
      />
    </PageContainer>
  );
};

export default ClusterNodeDetail;
