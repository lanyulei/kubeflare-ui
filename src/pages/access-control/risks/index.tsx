import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Select, Space, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useRef, useState } from 'react';
import { ClusterTableSearch } from '@/components';
import { getRbacRiskList } from '@/services/kubeflare/cluster/rbac';
import RbacRiskDetailDrawer, {
  splitRiskReasons,
} from '../components/RbacRiskDetailDrawer';
import RbacRiskSummary, {
  type RiskLevelFilter,
} from '../components/RbacRiskSummary';
import RiskLevelTag from '../components/RiskLevelTag';
import { RISK_LEVEL_TEXT, TABLE_DEFAULT_PAGE_SIZE } from '../constants';

const useStyles = createStyles(({ token }) => ({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: token.marginSM,
  },
  levelSelect: {
    width: 150,
  },
  search: {
    width: 320,
    maxWidth: '100%',
  },
  resource: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    minWidth: 0,
  },
  resourceName: {
    minWidth: 0,
  },
  reasonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  reason: {
    maxWidth: '100%',
  },
}));

const getResourceParts = (resource?: string) => {
  const [type, ...names] = (resource || '').split('/');

  return {
    name: names.join('/') || resource || '-',
    type: type || '-',
  };
};

const filterItemsByLevel = (
  items: API.RbacAuditItem[],
  level: RiskLevelFilter,
) => {
  if (level === 'all') {
    return items;
  }

  return items.filter((item) => item.risk_level === level);
};

const Risks = () => {
  const { styles } = useStyles();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const levelRef = useRef<RiskLevelFilter>('all');
  const [riskItems, setRiskItems] = useState<API.RbacAuditItem[]>([]);
  const [levelValue, setLevelValue] = useState<RiskLevelFilter>('all');
  const [detailItem, setDetailItem] = useState<API.RbacAuditItem>();

  const handleLevelChange = (level: RiskLevelFilter) => {
    levelRef.current = level;
    setLevelValue(level);
    actionRef.current?.reloadAndRest?.();
  };

  const columns: ProColumns<API.RbacAuditItem>[] = [
    {
      title: '资源',
      dataIndex: 'resource',
      width: 280,
      ellipsis: true,
      render: (_, record) => {
        const resource = getResourceParts(record.resource);

        return (
          <span className={styles.resource}>
            <Tag>{resource.type}</Tag>
            <Typography.Link
              className={styles.resourceName}
              ellipsis
              onClick={() => setDetailItem(record)}
            >
              {resource.name}
            </Typography.Link>
          </span>
        );
      },
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      width: 160,
      ellipsis: true,
      renderText: (_, record) => record.namespace || '全集群',
    },
    {
      title: '风险',
      dataIndex: 'risk_level',
      width: 110,
      render: (_, record) => <RiskLevelTag level={record.risk_level} />,
    },
    {
      title: '说明',
      dataIndex: 'action',
      width: 420,
      ellipsis: true,
      render: (_, record) => {
        const reasons = splitRiskReasons(record.action);

        return (
          <div className={styles.reasonList}>
            {(reasons.length
              ? reasons.slice(0, 2)
              : [record.action || '-']
            ).map((reason) => (
              <Typography.Text
                className={styles.reason}
                ellipsis={{ tooltip: reason }}
                key={reason}
                type="secondary"
              >
                {reason}
              </Typography.Text>
            ))}
          </div>
        );
      },
    },
    { title: '状态', dataIndex: 'status', width: 120, ellipsis: true },
    { title: '创建时间', dataIndex: 'time', valueType: 'dateTime', width: 180 },
    {
      title: '操作',
      valueType: 'option',
      width: 90,
      fixed: 'right',
      render: (_, record) => [
        <a key="detail" onClick={() => setDetailItem(record)}>
          详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title="风险分析">
      <RbacRiskSummary
        activeLevel={levelValue}
        items={riskItems}
        onLevelChange={handleLevelChange}
      />
      <ProTable<API.RbacAuditItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        scroll={{ x: 1360 }}
        pagination={{
          defaultPageSize: TABLE_DEFAULT_PAGE_SIZE,
        }}
        request={async (params) => {
          const res = await getRbacRiskList({ keyword: keywordRef.current });
          setRiskItems(res.data.items);
          const items = filterItemsByLevel(res.data.items, levelRef.current);
          const current = params.current || 1;
          const pageSize = params.pageSize || TABLE_DEFAULT_PAGE_SIZE;
          return {
            data: items.slice((current - 1) * pageSize, current * pageSize),
            success: true,
            total: items.length,
          };
        }}
        headerTitle={
          <Space className={styles.toolbar}>
            <Select<RiskLevelFilter>
              className={styles.levelSelect}
              value={levelValue}
              options={[
                { label: '全部风险', value: 'all' },
                { label: RISK_LEVEL_TEXT.Critical, value: 'Critical' },
                { label: RISK_LEVEL_TEXT.High, value: 'High' },
                { label: RISK_LEVEL_TEXT.Medium, value: 'Medium' },
                { label: RISK_LEVEL_TEXT.Low, value: 'Low' },
              ]}
              onChange={handleLevelChange}
            />
            <ClusterTableSearch
              clearTriggersSearch
              placeholder="搜索资源 / 命名空间 / 风险说明"
              className={styles.search}
              onSearch={(value) => {
                keywordRef.current = value;
                actionRef.current?.reloadAndRest?.();
              }}
            />
          </Space>
        }
      />
      <RbacRiskDetailDrawer
        open={Boolean(detailItem)}
        item={detailItem}
        onClose={() => setDetailItem(undefined)}
      />
    </PageContainer>
  );
};

export default Risks;
