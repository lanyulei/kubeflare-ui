import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { useEffect, useRef } from 'react';
import { resolveRbacSubjectPermissions } from '@/services/kubeflare/cluster/rbac';
import { TABLE_DEFAULT_PAGE_SIZE } from '../constants';
import { formatList, getRuleResourceText } from '../utils';
import PolicyRuleTable from './PolicyRuleTable';
import RiskLevelTag from './RiskLevelTag';

type SubjectPermissionPanelProps = {
  query?: API.RbacSubjectQuery;
};

const SubjectPermissionPanel = ({ query }: SubjectPermissionPanelProps) => {
  const actionRef = useRef<ActionType | null>(null);

  useEffect(() => {
    actionRef.current?.reload();
  }, [query]);

  const columns: ProColumns<API.RbacResolvedPermission>[] = [
    {
      title: '作用范围',
      dataIndex: 'scope',
      width: 150,
      renderText: (_, record) =>
        record.scope === 'Cluster' ? '全集群' : record.namespace || '-',
    },
    {
      title: 'API 组',
      dataIndex: ['rule', 'apiGroups'],
      width: 180,
      ellipsis: true,
      renderText: (_, record) =>
        formatList(
          record.rule.apiGroups?.length ? record.rule.apiGroups : ['core'],
        ),
    },
    {
      title: '资源 / URL',
      dataIndex: ['rule', 'resources'],
      width: 240,
      ellipsis: true,
      renderText: (_, record) => getRuleResourceText(record.rule),
    },
    {
      title: '动作',
      dataIndex: ['rule', 'verbs'],
      width: 220,
      ellipsis: true,
      renderText: (_, record) => formatList(record.rule.verbs),
    },
    {
      title: '来源绑定',
      dataIndex: ['source', 'bindingName'],
      width: 260,
      ellipsis: true,
      renderText: (_, record) =>
        `${record.source.bindingKind}:${record.source.bindingNamespace ? `${record.source.bindingNamespace}/` : ''}${record.source.bindingName}`,
    },
    {
      title: '来源角色',
      dataIndex: ['source', 'roleName'],
      width: 220,
      ellipsis: true,
      renderText: (_, record) =>
        `${record.source.roleKind}:${record.source.roleName}`,
    },
    {
      title: '风险',
      dataIndex: 'risk_level',
      width: 110,
      render: (_, record) => (
        <RiskLevelTag level={record.risk_level} reasons={record.risk_reasons} />
      ),
    },
  ];

  return (
    <ProTable<API.RbacResolvedPermission>
      rowKey="id"
      actionRef={actionRef}
      search={false}
      columns={columns}
      scroll={{ x: 1380 }}
      pagination={{
        defaultPageSize: TABLE_DEFAULT_PAGE_SIZE,
      }}
      expandable={{
        expandedRowRender: (record) => (
          <PolicyRuleTable rules={[record.rule]} showRisk={false} />
        ),
      }}
      request={async () => {
        if (!query) {
          return { data: [], success: true, total: 0 };
        }
        const res = await resolveRbacSubjectPermissions(query);
        return {
          data: res.data.items,
          success: true,
          total: res.data.items.length,
        };
      }}
    />
  );
};

export default SubjectPermissionPanel;
