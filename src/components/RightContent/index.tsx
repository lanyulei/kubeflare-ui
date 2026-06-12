import {
  CheckOutlined,
  ClusterOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { SelectLang as UmiSelectLang, useIntl } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Spin, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAiConnectionStatus } from '@/services/kubeflare/ai/chat';
import { getClusterList } from '@/services/kubeflare/cluster/info';
import {
  AGENT_DIAGNOSE_EVENT,
  type AgentDiagnoseRequest,
} from '../AgentDiagnoseButton';
import ChatWindow from '../ChatWindow';
import { HeaderActionButton, HeaderActionDrawer } from '../HeaderAction';
import HeaderDropdown from '../HeaderDropdown';

export type SiderTheme = 'light' | 'dark';

const CURRENT_CLUSTER_STORAGE_KEY = 'kubeflare.currentClusterId';
const CURRENT_CLUSTER_CHANGE_EVENT = 'kubeflare:currentClusterChange';

const useStyles = createStyles(({ token }) => ({
  clusterSwitch: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: token.marginXXS,
    maxWidth: 188,
    minHeight: 26,
    padding: 4,
    border: 0,
    color: 'inherit',
    cursor: 'pointer',
    background: 'transparent',
    borderRadius: token.borderRadius,
    transition: `background-color ${token.motionDurationMid}`,
    fontSize: 18,
    lineHeight: 1,
    '&:hover': {
      backgroundColor: token.colorBgTextHover,
    },
  },
  clusterIcon: {
    fontSize: 18,
  },
  clusterName: {
    maxWidth: 136,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
  },
  chatTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    minWidth: 0,
  },
  chatStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    fontWeight: 400,
    lineHeight: 1,
  },
  chatStatusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
    backgroundColor: token.colorTextQuaternary,
  },
  chatStatusConnected: {
    backgroundColor: token.colorSuccess,
  },
  chatStatusConnecting: {
    backgroundColor: token.colorInfo,
  },
  chatStatusDisconnected: {
    backgroundColor: token.colorTextQuaternary,
  },
  chatStatusFailed: {
    backgroundColor: token.colorError,
  },
}));

const AI_CONNECTION_STATUS_LABEL: Record<API.AiConnectionStatus, string> = {
  connected: '已连接',
  connecting: '连接中',
  disconnected: '未连接',
  failed: '连接失败',
};

const getStoredClusterId = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.localStorage.getItem(CURRENT_CLUSTER_STORAGE_KEY) || undefined;
};

const setStoredClusterId = (clusterId: string, cluster?: API.ClusterItem) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CURRENT_CLUSTER_STORAGE_KEY, clusterId);
  window.dispatchEvent(
    new CustomEvent(CURRENT_CLUSTER_CHANGE_EVENT, {
      detail: {
        clusterId,
        cluster,
      },
    }),
  );
};

const getClusterName = (cluster: API.ClusterItem) =>
  cluster.alias || cluster.name || String(cluster.id);

export const ClusterSwitch: React.FC = () => {
  const { styles } = useStyles();
  const intl = useIntl();
  const [clusters, setClusters] = useState<API.ClusterItem[]>([]);
  const [value, setValue] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadClusters = async () => {
      setLoading(true);
      try {
        const res = await getClusterList(undefined, {
          skipErrorHandler: true,
        });
        if (!mounted) {
          return;
        }

        const items = res.data?.items || [];
        const storedClusterId = getStoredClusterId();
        const selectedCluster =
          items.find((item) => String(item.id) === storedClusterId) ||
          items.find((item) => item.status === 1) ||
          items[0];

        setClusters(items);
        if (selectedCluster) {
          const selectedClusterId = String(selectedCluster.id);
          setValue(selectedClusterId);
          if (storedClusterId !== selectedClusterId) {
            setStoredClusterId(selectedClusterId, selectedCluster);
          }
        } else {
          setValue(undefined);
        }
      } catch (_error) {
        if (mounted) {
          setClusters([]);
          setValue(undefined);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadClusters();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedCluster = useMemo(
    () => clusters.find((cluster) => String(cluster.id) === value),
    [clusters, value],
  );

  const menuItems = useMemo<NonNullable<MenuProps['items']>>(
    () =>
      clusters.map((cluster) => {
        const clusterName = getClusterName(cluster);
        return {
          key: String(cluster.id),
          disabled: cluster.status !== 1,
          icon:
            String(cluster.id) === value ? (
              <CheckOutlined />
            ) : (
              <ClusterOutlined />
            ),
          label:
            cluster.status === 1
              ? clusterName
              : intl.formatMessage(
                  {
                    id: 'component.globalHeader.cluster.disabled',
                    defaultMessage: '{name}（停用）',
                  },
                  { name: clusterName },
                ),
        };
      }),
    [clusters, intl, value],
  );

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const clusterId = String(key);
    const selectedCluster = clusters.find(
      (cluster) => String(cluster.id) === clusterId,
    );
    setValue(clusterId);
    setStoredClusterId(clusterId, selectedCluster);
  };

  return (
    <HeaderDropdown
      menu={{
        items:
          menuItems.length > 0
            ? menuItems
            : [
                {
                  disabled: true,
                  key: 'empty',
                  label: intl.formatMessage({
                    id: 'component.globalHeader.cluster.empty',
                    defaultMessage: '暂无集群',
                  }),
                },
              ],
        onClick: handleMenuClick,
        selectedKeys: value ? [value] : [],
      }}
      placement="bottomRight"
      trigger={['click']}
    >
      <button
        aria-label={intl.formatMessage({
          id: 'component.globalHeader.cluster.select',
          defaultMessage: '切换集群',
        })}
        title={
          selectedCluster
            ? getClusterName(selectedCluster)
            : intl.formatMessage({
                id: 'component.globalHeader.cluster.select',
                defaultMessage: '切换集群',
              })
        }
        type="button"
        className={styles.clusterSwitch}
      >
        {loading ? (
          <Spin size="small" />
        ) : (
          <ClusterOutlined className={styles.clusterIcon} />
        )}
        <span className={styles.clusterName}>
          {selectedCluster
            ? getClusterName(selectedCluster)
            : intl.formatMessage({
                id: 'component.globalHeader.cluster.placeholder',
                defaultMessage: '选择集群',
              })}
        </span>
      </button>
    </HeaderDropdown>
  );
};

export const SelectLang: React.FC = () => {
  return (
    <UmiSelectLang
      style={{
        padding: 4,
      }}
    />
  );
};

export const ChatDrawerAction: React.FC = () => {
  const intl = useIntl();
  const { styles, cx } = useStyles();
  const [connectionStatus, setConnectionStatus] =
    useState<API.AiConnectionStatus>('connecting');
  const [agentRequest, setAgentRequest] = useState<AgentDiagnoseRequest>();
  const [open, setOpen] = useState(false);
  const title = intl.formatMessage({
    id: 'component.globalHeader.chat',
    defaultMessage: 'AI 智能助手',
  });
  const statusLabel = AI_CONNECTION_STATUS_LABEL[connectionStatus];

  const loadConnectionStatus = useCallback(async () => {
    setConnectionStatus('connecting');
    try {
      const res = await getAiConnectionStatus({
        skipErrorHandler: true,
      });
      setConnectionStatus(res.data?.status || 'disconnected');
    } catch (_error) {
      setConnectionStatus('failed');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadInitialConnectionStatus = async () => {
      setConnectionStatus('connecting');
      try {
        const res = await getAiConnectionStatus({
          skipErrorHandler: true,
        });
        if (!mounted) {
          return;
        }
        setConnectionStatus(res.data?.status || 'disconnected');
      } catch (_error) {
        if (mounted) {
          setConnectionStatus('failed');
        }
      }
    };

    void loadInitialConnectionStatus();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleAgentDiagnose = (event: Event) => {
      const detail = (event as CustomEvent<AgentDiagnoseRequest>).detail;

      setAgentRequest(detail || {});
      setOpen(true);
    };

    window.addEventListener(AGENT_DIAGNOSE_EVENT, handleAgentDiagnose);
    return () => {
      window.removeEventListener(AGENT_DIAGNOSE_EVENT, handleAgentDiagnose);
    };
  }, []);

  const drawerTitle = (
    <span className={styles.chatTitle}>
      <span>{title}</span>
      <Tooltip title={statusLabel}>
        <span className={styles.chatStatus}>
          <span
            aria-hidden="true"
            className={cx(
              styles.chatStatusDot,
              connectionStatus === 'connected' && styles.chatStatusConnected,
              connectionStatus === 'connecting' && styles.chatStatusConnecting,
              connectionStatus === 'disconnected' &&
                styles.chatStatusDisconnected,
              connectionStatus === 'failed' && styles.chatStatusFailed,
            )}
          />
          <span>{statusLabel}</span>
        </span>
      </Tooltip>
    </span>
  );

  return (
    <HeaderActionDrawer
      drawerProps={{
        afterOpenChange: (open) => {
          if (open) {
            void loadConnectionStatus();
          }
        },
        destroyOnHidden: false,
        keyboard: false,
        maskClosable: false,
        styles: {
          body: {
            height: '100%',
            padding: 0,
            overflow: 'hidden',
          },
        },
        width: '80%',
      }}
      icon={<MessageOutlined />}
      label={title}
      open={open}
      title={drawerTitle}
      onOpenChange={setOpen}
    >
      <ChatWindow
        agentRequest={agentRequest}
        connectionStatus={connectionStatus}
        onAgentRequestConsumed={() => setAgentRequest(undefined)}
        onConnectionStatusChange={setConnectionStatus}
      />
    </HeaderActionDrawer>
  );
};

export const Question: React.FC = () => {
  const intl = useIntl();
  const title = intl.formatMessage({
    id: 'component.globalHeader.help',
    defaultMessage: '使用文档',
  });

  return (
    <HeaderActionButton
      href="https://github.com/kubeflare/kubeflare"
      label={title}
      rel="noreferrer"
      target="_blank"
    >
      <QuestionCircleOutlined />
    </HeaderActionButton>
  );
};
