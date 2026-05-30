import { SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { useEffect, useState } from 'react';
import {
  getRbacOverview,
  getRbacRiskList,
} from '@/services/kubeflare/cluster/rbac';
import RiskLevelTag from '../components/RiskLevelTag';

const riskColumns: ProColumns<API.RbacAuditItem>[] = [
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
  { title: '说明', dataIndex: 'action', ellipsis: true },
  { title: '创建时间', dataIndex: 'time', valueType: 'dateTime', width: 180 },
];

const Overview = () => {
  const [overview, setOverview] = useState<API.RbacOverviewData>();

  useEffect(() => {
    getRbacOverview().then((res) => setOverview(res.data));
  }, []);

  return (
    <PageContainer title="访问控制概览">
      <ProCard gutter={[16, 16]} wrap>
        <ProCard title="角色" colSpan={{ xs: 24, md: 6 }} layout="center">
          {(overview?.roles || 0) + (overview?.clusterRoles || 0)}
        </ProCard>
        <ProCard title="绑定" colSpan={{ xs: 24, md: 6 }} layout="center">
          {(overview?.roleBindings || 0) + (overview?.clusterRoleBindings || 0)}
        </ProCard>
        <ProCard title="授权主体" colSpan={{ xs: 24, md: 6 }} layout="center">
          <TeamOutlined /> {overview?.subjects || 0}
        </ProCard>
        <ProCard title="高风险" colSpan={{ xs: 24, md: 6 }} layout="center">
          <SafetyCertificateOutlined />{' '}
          {(overview?.criticalRisks || 0) + (overview?.highRisks || 0)}
        </ProCard>
      </ProCard>
      <ProTable<API.RbacAuditItem>
        rowKey="id"
        search={false}
        columns={riskColumns}
        request={async () => {
          const res = await getRbacRiskList();
          return {
            data: res.data.items.slice(0, 10),
            success: true,
            total: res.data.items.length,
          };
        }}
        headerTitle="高风险配置"
        style={{ marginTop: 16 }}
      />
    </PageContainer>
  );
};

export default Overview;
