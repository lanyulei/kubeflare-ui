import {
  CheckOutlined,
  ClusterOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { SelectLang as UmiSelectLang, useIntl } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Spin } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useMemo, useState } from 'react';
import { getClusterList } from '@/services/kubeflare/cluster/info';
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
}));

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

export const Question: React.FC = () => {
  return (
    <a
      href="https://github.com/kubeflare/kubeflare"
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'inline-flex',
        padding: '4px',
        fontSize: '18px',
        color: 'inherit',
      }}
    >
      <QuestionCircleOutlined />
    </a>
  );
};
