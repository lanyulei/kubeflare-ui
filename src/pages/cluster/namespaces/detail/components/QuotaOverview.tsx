import {
  ClusterOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  HddOutlined,
} from '@ant-design/icons';
import { Spin } from 'antd';
import { SectionTitle } from '@/components';
import {
  formatQuotaValue,
  getQuotaUsagePercent,
  parseCpuQuantity,
  parseMemoryQuantity,
} from './helpers';
import useStyles from './styles';

type QuotaOverviewProps = {
  loading: boolean;
  quotaSummary: API.ClusterNamespaceQuotaSummary;
};

const QuotaOverview = ({ loading, quotaSummary }: QuotaOverviewProps) => {
  const { styles } = useStyles();
  const defaultQuotaItems = [
    {
      key: 'cpu',
      icon: <DatabaseOutlined />,
      request: quotaSummary.defaultContainer.cpuRequest,
      requestLabel: 'CPU 预留',
      limit: quotaSummary.defaultContainer.cpuLimit,
      limitLabel: 'CPU 限制',
    },
    {
      key: 'memory',
      icon: <HddOutlined />,
      request: quotaSummary.defaultContainer.memoryRequest,
      requestLabel: '内存预留',
      limit: quotaSummary.defaultContainer.memoryLimit,
      limitLabel: '内存上限',
    },
  ];
  const projectQuotaItems = [
    {
      key: 'cpuLimit',
      icon: <DatabaseOutlined />,
      title: 'CPU 上限',
      quota: quotaSummary.project.cpuLimit,
      parser: parseCpuQuantity,
    },
    {
      key: 'memoryLimit',
      icon: <HddOutlined />,
      title: '内存上限',
      quota: quotaSummary.project.memoryLimit,
      parser: parseMemoryQuantity,
    },
    {
      key: 'pods',
      icon: <ClusterOutlined />,
      title: '容器组',
      quota: quotaSummary.project.pods,
    },
    {
      key: 'deployments',
      icon: <DeploymentUnitOutlined />,
      title: '部署',
      quota: quotaSummary.project.deployments,
    },
    {
      key: 'persistentVolumeClaims',
      icon: <HddOutlined />,
      title: '持久卷声明',
      quota: quotaSummary.project.persistentVolumeClaims,
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className={styles.quotaPanel}>
        <div>
          <SectionTitle color={'#36435C'} fontSize={12}>
            默认容器配额
          </SectionTitle>
          <div className={styles.defaultQuota}>
            {defaultQuotaItems.map((item) => (
              <div className={styles.defaultQuotaGroup} key={item.key}>
                <div className={styles.quotaIcon}>{item.icon}</div>
                <div className={styles.quotaMetric}>
                  <div className={styles.quotaMetricValue}>
                    {item.request || '无预留'}
                  </div>
                  <div className={styles.quotaMetricLabel}>
                    {item.requestLabel}
                  </div>
                </div>
                <div className={styles.quotaMetric}>
                  <div className={styles.quotaMetricValue}>
                    {formatQuotaValue(item.limit)}
                  </div>
                  <div className={styles.quotaMetricLabel}>
                    {item.limitLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle color={'#36435C'} fontSize={12}>
            项目配额
          </SectionTitle>
          <div className={styles.projectQuota}>
            {projectQuotaItems.map((item) => {
              const usagePercent = getQuotaUsagePercent(
                item.quota.used,
                item.quota.hard,
                item.parser,
              );

              return (
                <div className={styles.projectQuotaItem} key={item.key}>
                  <div className={styles.quotaIcon}>{item.icon}</div>
                  <div className={styles.quotaMetric}>
                    <div className={styles.quotaMetricValue}>{item.title}</div>
                    <div className={styles.quotaMetricLabel}>资源类型</div>
                  </div>
                  <div className={styles.quotaMetric}>
                    <div className={styles.quotaMetricValue}>
                      {item.quota.used || '0'}
                    </div>
                    <div className={styles.quotaMetricLabel}>已使用</div>
                  </div>
                  <div className={styles.quotaMetric}>
                    <div className={styles.quotaMetricValue}>
                      {formatQuotaValue(item.quota.hard)}
                    </div>
                    <div className={styles.quotaMetricLabel}>配额</div>
                  </div>
                  <div className={styles.quotaUsage}>
                    <div className={styles.usageHeader}>
                      <span className={styles.usageTitle}>用量</span>
                      <span>已使用：{usagePercent}%</span>
                    </div>
                    <div className={styles.usageBar}>
                      <div
                        className={styles.usageBarInner}
                        style={{ width: `${usagePercent}%` }}
                      />
                      <span className={styles.usageLimit}>
                        {formatQuotaValue(item.quota.hard)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Spin>
  );
};

export default QuotaOverview;
