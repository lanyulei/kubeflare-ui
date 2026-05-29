import {
  ApartmentOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Link } from '@umijs/max';
import { Button, Empty, Spin } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getClusterHorizontalPodAutoscalerList,
  getClusterNetworkPolicyList,
  getClusterPodDisruptionBudgetList,
  getClusterVerticalPodAutoscalerList,
} from '@/services/kubeflare/cluster/resource';
import { getClusterResourceDetailPath } from '../../../../resource';

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
    position: 'relative',
    minWidth: 0,
    padding: `${token.padding}px ${token.padding}px 48px`,
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
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    padding: `0 ${token.paddingXS}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    color: token.colorTextSecondary,
    backgroundColor: token.colorFillQuaternary,
    fontSize: token.fontSizeSM,
    lineHeight: '22px',
    whiteSpace: 'nowrap',
  },
  statusBadgeSuccess: {
    borderColor: token.colorSuccessBorder,
    color: token.colorSuccess,
    backgroundColor: token.colorSuccessBg,
  },
  nameBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: '100%',
    height: 24,
    padding: `0 ${token.paddingXS}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    color: token.colorTextSecondary,
    backgroundColor: token.colorFillQuaternary,
    fontSize: token.fontSizeSM,
    lineHeight: '22px',

    '&:hover': {
      color: token.colorPrimary,
      borderColor: token.colorPrimaryBorder,
      backgroundColor: token.colorPrimaryBg,
    },
  },
  emptyPolicy: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    width: '100%',
    color: token.colorTextQuaternary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    position: 'absolute',
    right: token.padding,
    bottom: token.paddingSM,
  },
}));

type GovernancePolicy = {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
  resources: GovernancePolicyResource[];
  supportedKinds: API.ClusterWorkloadType[];
};

type GovernancePolicyResource = {
  name: string;
  namespace?: string;
  type: API.ClusterResourceCreateType;
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

const isScalableGovernanceKind = (type?: API.ClusterWorkloadType) =>
  type === 'Deployment' || type === 'StatefulSet';

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
      const scalableGovernance = isScalableGovernanceKind(workload.type);
      const [hpaRes, vpaRes, pdbRes, networkPolicyRes] = await Promise.all([
        scalableGovernance
          ? getClusterHorizontalPodAutoscalerList({
              namespace: workload.namespace,
              keyword: workload.name,
            })
          : Promise.resolve({ data: { items: [] } }),
        scalableGovernance
          ? getClusterVerticalPodAutoscalerList({
              namespace: workload.namespace,
              keyword: workload.name,
            })
          : Promise.resolve({ data: { items: [] } }),
        scalableGovernance
          ? getClusterPodDisruptionBudgetList({
              namespace: workload.namespace,
            })
          : Promise.resolve({ data: { items: [] } }),
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
        supportedKinds: ['Deployment', 'StatefulSet'],
        resources: hpas.map((item) => ({
          name: item.name,
          namespace: item.namespace,
          type: 'HorizontalPodAutoscaler',
        })),
      },
      {
        key: 'vpa',
        title: '资源建议',
        description: '观察或自动调整容器 CPU、内存请求值。',
        icon: <ThunderboltOutlined className={styles.icon} />,
        path: '/cluster/policies/vertical-pod-autoscalers',
        supportedKinds: ['Deployment', 'StatefulSet'],
        resources: vpas.map((item) => ({
          name: item.name,
          namespace: item.namespace,
          type: 'VerticalPodAutoscaler',
        })),
      },
      {
        key: 'pdb',
        title: '可用性保护',
        description: '限制维护或驱逐时允许同时中断的副本数量。',
        icon: <SafetyCertificateOutlined className={styles.icon} />,
        path: '/cluster/policies/availability',
        supportedKinds: ['Deployment', 'StatefulSet'],
        resources: pdbs.map((item) => ({
          name: item.name,
          namespace: item.namespace,
          type: 'PodDisruptionBudget',
        })),
      },
      {
        key: 'network',
        title: '网络策略',
        description: '控制该应用 Pod 的入站、出站访问范围。',
        icon: <ApartmentOutlined className={styles.icon} />,
        path: '/cluster/policies/network',
        supportedKinds: ['Deployment', 'StatefulSet', 'DaemonSet'],
        resources: networkPolicies.map((item) => ({
          name: item.name,
          namespace: item.namespace,
          type: 'NetworkPolicy',
        })),
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
        {policies
          .filter((item) =>
            workload.type ? item.supportedKinds.includes(workload.type) : false,
          )
          .map((item) => (
            <div className={styles.item} key={item.key}>
              <div className={styles.header}>
                <div className={styles.title}>
                  {item.icon}
                  <span>{item.title}</span>
                </div>
                <span
                  className={[
                    styles.statusBadge,
                    item.resources.length > 0 ? styles.statusBadgeSuccess : '',
                  ].join(' ')}
                >
                  {item.resources.length > 0 ? '已配置' : '未配置'}
                </span>
              </div>
              <div className={styles.description}>{item.description}</div>
              <div className={styles.names}>
                {item.resources.length > 0 ? (
                  item.resources.map((resource) => (
                    <Link
                      className={styles.nameBadge}
                      key={`${resource.type}-${resource.namespace}-${resource.name}`}
                      to={getClusterResourceDetailPath(
                        resource.type,
                        resource.name,
                        resource.namespace,
                      )}
                    >
                      {resource.name}
                    </Link>
                  ))
                ) : (
                  <div className={styles.emptyPolicy}>暂无策略</div>
                )}
              </div>
              <div className={styles.footer}>
                <Link to={item.path}>
                  <Button size="small" type="text">
                    配置
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
