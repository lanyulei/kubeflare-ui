import { AppstoreOutlined } from '@ant-design/icons';
import { Button, Empty, Modal, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { SegmentedTabs } from '@/components';
import { getClusterWorkloadList } from '@/services/kubeflare/cluster/workload';

const WORKLOAD_TABS: { label: string; value: API.ClusterWorkloadType }[] = [
  { label: '部署', value: 'Deployment' },
  { label: '有状态副本集', value: 'StatefulSet' },
  { label: '守护进程集', value: 'DaemonSet' },
];

const useStyles = createStyles(({ token }) => ({
  hint: {
    marginBottom: token.marginSM,
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  tabs: {
    marginBottom: token.marginSM,
  },
  list: {
    minHeight: 188,
    maxHeight: 280,
    overflow: 'auto',
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    width: '100%',
    padding: `${token.paddingXS}px ${token.paddingSM}px`,
    border: 0,
    borderRadius: token.borderRadiusSM,
    background: 'transparent',
    color: token.colorText,
    cursor: 'pointer',
    textAlign: 'left',

    '&:hover': {
      background: token.colorFillQuaternary,
    },
  },
  selectedItem: {
    '&&': {
      background: token.colorPrimaryBg,
      color: token.colorPrimaryText,
    },
  },
  icon: {
    color: '#36435C',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
}));

type WorkloadSelectorModalProps = {
  namespace?: string;
  open: boolean;
  onCancel: () => void;
  onOk: (workload: API.ClusterWorkloadItem) => void;
};

const WorkloadSelectorModal = ({
  namespace,
  open,
  onCancel,
  onOk,
}: WorkloadSelectorModalProps) => {
  const { styles, cx } = useStyles();
  const [activeType, setActiveType] =
    useState<API.ClusterWorkloadType>('Deployment');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<API.ClusterWorkloadItem[]>([]);
  const [selected, setSelected] = useState<API.ClusterWorkloadItem>();

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelected(undefined);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;
    setLoading(true);
    getClusterWorkloadList({
      namespace,
      type: activeType,
    })
      .then((res) => {
        if (!ignore) {
          setItems(res.data.items || []);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeType, namespace, open]);

  return (
    <Modal
      destroyOnHidden
      footer={
        <div className={styles.footer}>
          <Button onClick={onCancel}>取消</Button>
          <Button
            disabled={!selected}
            type="primary"
            onClick={() => selected && onOk(selected)}
          >
            确定
          </Button>
        </div>
      }
      open={open}
      title="指定工作负载"
      width={520}
      onCancel={onCancel}
    >
      <div className={styles.hint}>使用工作负载的标签作为选择器。</div>
      <SegmentedTabs
        className={styles.tabs}
        items={WORKLOAD_TABS}
        value={activeType}
        width="100%"
        onChange={setActiveType}
      />
      <div className={styles.list}>
        <Spin spinning={loading}>
          {!items.length && !loading ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
          ) : (
            items.map((item) => (
              <button
                className={cx(
                  styles.item,
                  selected?.id === item.id && styles.selectedItem,
                )}
                key={item.id || `${item.namespace}-${item.name}`}
                type="button"
                onClick={() => setSelected(item)}
              >
                <AppstoreOutlined className={styles.icon} />
                <span>{item.name}</span>
              </button>
            ))
          )}
        </Spin>
      </div>
    </Modal>
  );
};

export default WorkloadSelectorModal;
