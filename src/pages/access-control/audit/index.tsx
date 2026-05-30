import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRef } from 'react';
import { ClusterTableSearch } from '@/components';
import { getRbacAuditList } from '@/services/kubeflare/cluster/rbac';
import RiskLevelTag from '../components/RiskLevelTag';

const Audit = () => {
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');

  const columns: ProColumns<API.RbacAuditItem>[] = [
    { title: '时间', dataIndex: 'time', valueType: 'dateTime', width: 180 },
    { title: '操作人', dataIndex: 'operator', width: 140 },
    { title: '动作', dataIndex: 'action', ellipsis: true },
    { title: '资源', dataIndex: 'resource', ellipsis: true },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      renderText: (_, record) => record.namespace || '全集群',
    },
    {
      title: '风险',
      dataIndex: 'risk_level',
      width: 110,
      render: (_, record) => <RiskLevelTag level={record.risk_level} />,
    },
    { title: '结果', dataIndex: 'status', width: 120 },
  ];

  return (
    <PageContainer title="审计日志">
      <ProTable<API.RbacAuditItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        request={async (params) => {
          const res = await getRbacAuditList({ keyword: keywordRef.current });
          const current = params.current || 1;
          const pageSize = params.pageSize || 10;
          return {
            data: res.data.items.slice(
              (current - 1) * pageSize,
              current * pageSize,
            ),
            success: true,
            total: res.data.items.length,
          };
        }}
        headerTitle={
          <ClusterTableSearch
            clearTriggersSearch
            placeholder="搜索操作 / 资源 / 命名空间"
            style={{ width: 320 }}
            onSearch={(value) => {
              keywordRef.current = value;
              actionRef.current?.reloadAndRest?.();
            }}
          />
        }
      />
    </PageContainer>
  );
};

export default Audit;
