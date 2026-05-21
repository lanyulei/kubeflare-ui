import { ClusterOutlined } from '@ant-design/icons';
import { Checkbox, Empty, Modal, Spin, message } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import {
  getNodeIp,
  getNodeRoleLabel,
  getNodeRoles,
  getNodeStatusLabel,
  getNodeStatusType,
} from '@/pages/cluster/node/detail/helpers';
import { getClusterNodeList } from '@/services/kubeflare/cluster/node';

const NODE_PAGE_SIZE = 100;
const MAX_NODE_PAGE_COUNT = 20;

const useStyles = createStyles(({ token }) => ({
  description: {
    marginBottom: token.marginSM,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  list: {
    maxHeight: 360,
    overflowY: 'auto',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  nodeItem: {
    display: 'grid',
    gridTemplateColumns:
      '28px 28px minmax(160px, 1.2fr) minmax(100px, 0.8fr) minmax(120px, 0.8fr)',
    alignItems: 'center',
    gap: token.marginSM,
    width: '100%',
    minHeight: 58,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',

    '& + &': {
      borderTop: `1px solid ${token.colorBorderSecondary}`,
    },

    '&:hover': {
      background: token.colorFillQuaternary,
    },

    '@media (max-width: 576px)': {
      gridTemplateColumns: '28px 28px minmax(0, 1fr)',
    },
  },
  nodeItemDisabled: {
    cursor: 'not-allowed',
    opacity: 0.58,

    '&:hover': {
      background: 'transparent',
    },
  },
  nodeIcon: {
    color: '#36435C',
    fontSize: 16,
  },
  nodeName: {
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    gap: 2,
  },
  nodeNameText: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nodeIp: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  field: {
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    gap: 2,

    '@media (max-width: 576px)': {
      gridColumn: '3 / -1',
    },
  },
  statusValue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    flex: '0 0 auto',
    borderRadius: '50%',
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
  fieldLabel: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  roleValue: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: `${token.paddingXL}px 0`,
  },
}));

type NodeSelectorModalProps = {
  open: boolean;
  selectedNodeNames?: string[];
  onCancel: () => void;
  onOk: (nodeNames: string[]) => void;
};

type NodeStatusType = ReturnType<typeof getNodeStatusType>;

const getSelectableNodeName = (node: API.ClusterNodeItem) =>
  node.name && node.name !== '-' ? node.name : '';

const NodeSelectorModal = ({
  open,
  selectedNodeNames = [],
  onCancel,
  onOk,
}: NodeSelectorModalProps) => {
  const { styles } = useStyles();
  const [nodes, setNodes] = useState<API.ClusterNodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [draftSelectedNodeNames, setDraftSelectedNodeNames] =
    useState<string[]>(selectedNodeNames);
  const statusDotClassNames: Record<NodeStatusType, string> = {
    default: styles.statusDotDefault,
    error: styles.statusDotError,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;

    const loadNodes = async () => {
      setLoading(true);
      setDraftSelectedNodeNames(selectedNodeNames);

      try {
        const nextNodes: API.ClusterNodeItem[] = [];
        let continueToken = '';

        for (let page = 0; page < MAX_NODE_PAGE_COUNT; page += 1) {
          const res = await getClusterNodeList({
            limit: NODE_PAGE_SIZE,
            continue: continueToken || undefined,
          });

          nextNodes.push(...(res.data.items || []));
          continueToken = res.data.continue || '';

          if (!continueToken) {
            break;
          }
        }

        if (!ignore) {
          setNodes(nextNodes);
        }
      } catch {
        if (!ignore) {
          message.error('获取节点列表失败');
          setNodes([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadNodes();

    return () => {
      ignore = true;
    };
  }, [open, selectedNodeNames]);

  const toggleNode = (nodeName: string, checked: boolean) => {
    setDraftSelectedNodeNames((current) =>
      checked
        ? Array.from(new Set([...current, nodeName]))
        : current.filter((item) => item !== nodeName),
    );
  };

  const renderNodeItem = (node: API.ClusterNodeItem) => {
    const nodeName = getSelectableNodeName(node);
    const statusType = getNodeStatusType(node.status);
    const disabled = !nodeName || statusType !== 'success';
    const checked = draftSelectedNodeNames.includes(nodeName);
    const roles = getNodeRoles(node.roles).map(getNodeRoleLabel);
    const checkboxId = `node-selector-${String(node.id || node.name).replace(
      /[^a-zA-Z0-9_-]/g,
      '-',
    )}`;

    return (
      <label
        className={[
          styles.nodeItem,
          disabled ? styles.nodeItemDisabled : '',
        ].join(' ')}
        htmlFor={checkboxId}
        key={node.id || node.name}
      >
        <Checkbox
          checked={checked}
          disabled={disabled}
          id={checkboxId}
          onChange={(event) => toggleNode(nodeName, event.target.checked)}
        />
        <ClusterOutlined className={styles.nodeIcon} />
        <span className={styles.nodeName}>
          <span className={styles.nodeNameText}>{node.name}</span>
          <span className={styles.nodeIp}>{getNodeIp(node)}</span>
        </span>
        <span className={styles.field}>
          <span className={styles.statusValue}>
            <span
              className={[
                styles.statusDot,
                statusDotClassNames[statusType],
              ].join(' ')}
            />
            {getNodeStatusLabel(node.status)}
          </span>
          <span className={styles.fieldLabel}>状态</span>
        </span>
        <span className={styles.field}>
          <span className={styles.roleValue}>
            {roles.length > 0 ? roles.join('、') : '-'}
          </span>
          <span className={styles.fieldLabel}>角色</span>
        </span>
      </label>
    );
  };

  return (
    <Modal
      destroyOnHidden
      cancelText="取消"
      okText="确定"
      open={open}
      title="指定节点"
      width={600}
      onCancel={onCancel}
      onOk={() => onOk(draftSelectedNodeNames)}
    >
      <div className={styles.description}>将容器副本分配给特定节点。</div>
      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>
            <Spin />
          </div>
        ) : nodes.length > 0 ? (
          nodes.map(renderNodeItem)
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </Modal>
  );
};

export type { NodeSelectorModalProps };
export default NodeSelectorModal;
