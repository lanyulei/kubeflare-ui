import {
  ApartmentOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Link } from '@umijs/max';
import { Button, Empty, Spin, Tag } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getClusterHorizontalPodAutoscalerList,
  getClusterNetworkPolicyList,
  getClusterPodDisruptionBudgetList,
  getClusterVerticalPodAutoscalerList,
} from '@/services/kubeflare/cluster/resource';

const useStyles = createStyles(({ token }) => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: token.marginMD,

    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  item: {
    minWidth: 0,
    padding: token.paddingLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorBgContainer,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginSM,
    color: token.colorText,
    fontWeight: 600,
  },
  icon: {
    color: token.colorPrimary,
    fontSize: 18,
  },
  description: {
    minHeight: 44,
    marginTop: token.marginSM,
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  names: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: token.marginXS,
    marginTop: token.marginSM,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: token.marginMD,
  },
}));

type GovernancePolicy = {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
  names: string[];
};

type WorkloadGovernanceOverviewProps = {
  workload?: API.ClusterWorkloadItem;
};

const selectorMatches = (
  workloadSelector?: Record<string, string>,
  selectorText?: string,
) => {
  const entries = Object.entries(workloadSelector || {});

  if (entries.length === 0 || !selectorText) {
    return false;
  }

  return entries.every(([key, value]) =>
    selectorText.includes(`${key}=${value}`),
  );
};

const WorkloadGovernanceOverview = ({
  workload,
}: WorkloadGovernanceOverviewProps) => {
  const { styles } = useStyles();
  const [loading, setLoading] = useState(false);
  const [hpas, setHpas] = useState<API.ClusterHorizontalPodAutoscalerItem[]>(
    [],
  );
  const [vpas, setVpas] = useState<API.ClusterVerticalPodAutoscalerItem[]>([]);
  const [pdbs, setPdbs] = useState<API.ClusterPodDisruptionBudgetItem[]>([]);
  const [networkPolicies, setNetworkPolicies] = useState<
    API.ClusterNetworkPolicyItem[]
  >([]);

  const fetchPolicies = useCallback(async () => {
    if (!workload?.namespace || !workload.name) {
      setHpas([]);
      setVpas([]);
      setPdbs([]);
      setNetworkPolicies([]);
      return;
    }

    setLoading(true);
    try {
      const [hpaRes, vpaRes, pdbRes, networkPolicyRes] = await Promise.all([
        getClusterHorizontalPodAutoscalerList({
          namespace: workload.namespace,
          keyword: workload.name,
        }),
        getClusterVerticalPodAutoscalerList({
          namespace: workload.namespace,
          keyword: workload.name,
        }),
        getClusterPodDisruptionBudgetList({
          namespace: workload.namespace,
        }),
        getClusterNetworkPolicyList({
          namespace: workload.namespace,
        }),
      ]);
      setHpas(
        (hpaRes.data.items || []).filter(
          (item) =>
            item.target_kind === workload.type &&
            item.target_name === workload.name,
        ),
      );
      setVpas(
        (vpaRes.data.items || []).filter(
          (item) =>
            item.target_kind === workload.type &&
            item.target_name === workload.name,
        ),
      );
      setPdbs(
        (pdbRes.data.items || []).filter((item) =>
          selectorMatches(workload.selector, item.selector),
        ),
      );
      setNetworkPolicies(
        (networkPolicyRes.data.items || []).filter((item) =>
          selectorMatches(workload.selector, item.pod_selector),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [workload]);

  useEffect(() => {
    void fetchPolicies();
  }, [fetchPolicies]);

  const policies = useMemo<GovernancePolicy[]>(
    () => [
      {
        key: 'hpa',
        title: '弹性伸缩',
        description: '按 CPU、内存或自定义指标自动调整副本数。',
        icon: <ThunderboltOutlined className={styles.icon} />,
        path: '/cluster/policies/autoscaling',
        names: hpas.map((item) => item.name),
      },
      {
        key: 'vpa',
        title: '资源建议',
        description: '观察或自动调整容器 CPU、内存请求值。',
        icon: <ThunderboltOutlined className={styles.icon} />,
        path: '/cluster/policies/vertical-pod-autoscalers',
        names: vpas.map((item) => item.name),
      },
      {
        key: 'pdb',
        title: '可用性保护',
        description: '限制维护或驱逐时允许同时中断的副本数量。',
        icon: <SafetyCertificateOutlined className={styles.icon} />,
        path: '/cluster/policies/availability',
        names: pdbs.map((item) => item.name),
      },
      {
        key: 'network',
        title: '网络策略',
        description: '控制该应用 Pod 的入站、出站访问范围。',
        icon: <ApartmentOutlined className={styles.icon} />,
        path: '/cluster/policies/network',
        names: networkPolicies.map((item) => item.name),
      },
    ],
    [hpas, networkPolicies, pdbs, styles.icon, vpas],
  );

  if (!workload) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Spin spinning={loading}>
      <div className={styles.grid}>
        {policies.map((item) => (
          <div className={styles.item} key={item.key}>
            <div className={styles.header}>
              <div className={styles.title}>
                {item.icon}
                <span>{item.title}</span>
              </div>
              <Tag color={item.names.length > 0 ? 'success' : 'default'}>
                {item.names.length > 0 ? '已配置' : '未配置'}
              </Tag>
            </div>
            <div className={styles.description}>{item.description}</div>
            <div className={styles.names}>
              {item.names.length > 0 ? (
                item.names.map((name) => <Tag key={name}>{name}</Tag>)
              ) : (
                <Tag>暂无策略</Tag>
              )}
            </div>
            <div className={styles.footer}>
              <Link to={item.path}>
                <Button size="small">
                  {item.names.length > 0 ? '查看策略' : '去配置'}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Spin>
  );
};

export default WorkloadGovernanceOverview;
