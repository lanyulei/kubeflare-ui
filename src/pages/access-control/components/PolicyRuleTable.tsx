import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Tag } from 'antd';
import { analyzeRbacRuleRisk } from '@/services/kubeflare/cluster/rbac';
import { formatList, getRuleResourceText } from '../utils';
import RiskLevelTag from './RiskLevelTag';

type PolicyRuleTableProps = {
  rules?: API.RbacPolicyRule[];
  showRisk?: boolean;
};

const renderTags = (values?: string[]) => {
  if (!values?.length) {
    return '-';
  }

  return values.map((value) => <Tag key={value}>{value}</Tag>);
};

const PolicyRuleTable = ({
  rules = [],
  showRisk = true,
}: PolicyRuleTableProps) => {
  const columns: ProColumns<API.RbacPolicyRule>[] = [
    {
      title: 'API 组',
      dataIndex: 'apiGroups',
      render: (_, record) =>
        renderTags(record.apiGroups?.length ? record.apiGroups : ['core']),
    },
    {
      title: '资源 / URL',
      dataIndex: 'resources',
      ellipsis: true,
      renderText: (_, record) => getRuleResourceText(record),
    },
    {
      title: '动作',
      dataIndex: 'verbs',
      render: (_, record) => renderTags(record.verbs),
    },
    {
      title: '资源名限制',
      dataIndex: 'resourceNames',
      ellipsis: true,
      renderText: (_, record) => formatList(record.resourceNames),
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
    <ProTable<API.RbacPolicyRule>
      rowKey={(record, index) => `${record.verbs.join(',')}-${index}`}
      search={false}
      options={false}
      pagination={false}
      columns={columns}
      dataSource={rules}
      size="small"
    />
  );
};

export default PolicyRuleTable;
