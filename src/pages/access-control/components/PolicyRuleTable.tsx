import type { TableColumnsType } from 'antd';
import { Table } from 'antd';
import { analyzeRbacRuleRisk } from '@/services/kubeflare/cluster/rbac';
import { formatList, getRuleResourceText } from '../utils';
import RiskLevelTag from './RiskLevelTag';

type PolicyRuleTableProps = {
  rules?: API.RbacPolicyRule[];
  showRisk?: boolean;
};

const PolicyRuleTable = ({
  rules = [],
  showRisk = true,
}: PolicyRuleTableProps) => {
  const columns: TableColumnsType<API.RbacPolicyRule> = [
    {
      title: 'API 组',
      dataIndex: 'apiGroups',
      width: 220,
      ellipsis: true,
      render: (_, record) =>
        formatList(record.apiGroups?.length ? record.apiGroups : ['core']),
    },
    {
      title: '资源 / URL',
      dataIndex: 'resources',
      width: 260,
      ellipsis: true,
      render: (_, record) => getRuleResourceText(record),
    },
    {
      title: '动作',
      dataIndex: 'verbs',
      width: 260,
      ellipsis: true,
      render: (_, record) => formatList(record.verbs),
    },
    {
      title: '资源名限制',
      dataIndex: 'resourceNames',
      width: 220,
      ellipsis: true,
      render: (_, record) => formatList(record.resourceNames),
    },
  ];

  if (showRisk) {
    columns.push({
      title: '风险',
      dataIndex: 'risk',
      width: 110,
      render: (_, record) => {
        const risk = analyzeRbacRuleRisk(record);
        return <RiskLevelTag level={risk.level} reasons={risk.reasons} />;
      },
    });
  }

  return (
    <Table<API.RbacPolicyRule>
      rowKey={(record, index) => `${record.verbs.join(',')}-${index}`}
      pagination={false}
      columns={columns}
      scroll={{ x: showRisk ? 1070 : 960 }}
      dataSource={rules}
      size="small"
    />
  );
};

export default PolicyRuleTable;
