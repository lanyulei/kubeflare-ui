import { Link } from '@umijs/max';
import { Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { getClusterPodList } from '@/services/kubeflare/cluster/resource';
import ClusterResourceListPage, {
  createStatusColumn,
  getClusterResourceDetailPath,
} from '../../resource';

const POD_NAME_COLUMN_WIDTH = 300;
const POD_NAMESPACE_COLUMN_WIDTH = 180;
const POD_STATUS_COLUMN_WIDTH = 160;
const POD_NODE_COLUMN_WIDTH = 240;
const POD_TIME_COLUMN_WIDTH = 180;
const POD_TABLE_SCROLL_X =
  POD_NAME_COLUMN_WIDTH +
  POD_NAMESPACE_COLUMN_WIDTH +
  POD_STATUS_COLUMN_WIDTH +
  POD_NODE_COLUMN_WIDTH +
  POD_TIME_COLUMN_WIDTH * 2;

const useStyles = createStyles(({ token }) => ({
  resourceSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  primaryText: {
    lineHeight: token.lineHeight,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  secondaryText: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

type ResourceSummaryProps = {
  primary: ReactNode;
  primaryTitle?: string;
  secondary?: string;
};

const ResourceSummary = ({
  primary,
  primaryTitle,
  secondary,
}: ResourceSummaryProps) => {
  const { styles } = useStyles();
  const primaryContent = <div className={styles.primaryText}>{primary}</div>;
  const secondaryContent = (
    <div className={styles.secondaryText}>{secondary || '-'}</div>
  );

  return (
    <div className={styles.resourceSummary}>
      {primaryTitle ? (
        <Tooltip title={primaryTitle}>{primaryContent}</Tooltip>
      ) : (
        primaryContent
      )}
      {secondary ? (
        <Tooltip title={secondary}>{secondaryContent}</Tooltip>
      ) : (
        secondaryContent
      )}
    </div>
  );
};

const Pods = () => (
  <ClusterResourceListPage<API.ClusterPodItem>
    titleId="menu.cluster.clusterWorkloads.clusterWorkloadsPods"
    defaultTitle="容器组"
    searchPlaceholder="搜索容器组名称 / 命名空间 / 节点 / IP 地址"
    showNamespaceFilter
    request={getClusterPodList}
    tableScroll={{ x: POD_TABLE_SCROLL_X }}
    columns={[
      {
        title: '名称',
        dataIndex: 'name',
        width: POD_NAME_COLUMN_WIDTH,
        render: (_, record) => (
          <ResourceSummary
            primary={
              <Link
                to={getClusterResourceDetailPath(
                  'Pod',
                  record.name,
                  record.namespace,
                )}
              >
                {record.name || '-'}
              </Link>
            }
            primaryTitle={record.name}
            secondary={record.pod_ip}
          />
        ),
      },
      {
        title: '命名空间',
        dataIndex: 'namespace',
        ellipsis: true,
        width: POD_NAMESPACE_COLUMN_WIDTH,
        renderText: (_, record) => record.namespace || '-',
      },
      createStatusColumn<API.ClusterPodItem>('状态', {
        ellipsis: true,
        width: POD_STATUS_COLUMN_WIDTH,
      }),
      {
        title: '节点',
        dataIndex: 'node_name',
        width: POD_NODE_COLUMN_WIDTH,
        render: (_, record) => (
          <ResourceSummary
            primary={record.node_name || '-'}
            primaryTitle={record.node_name}
            secondary={record.node_ip}
          />
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'create_time',
        valueType: 'dateTime',
        width: POD_TIME_COLUMN_WIDTH,
      },
      {
        title: '更新时间',
        dataIndex: 'update_time',
        valueType: 'dateTime',
        width: POD_TIME_COLUMN_WIDTH,
      },
    ]}
  />
);

export default Pods;
