import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Select, Space } from 'antd';
import { useRef, useState } from 'react';
import { ClusterTableSearch } from '@/components';
import { getRbacSubjectList } from '@/services/kubeflare/cluster/rbac';
import RiskLevelTag from '../components/RiskLevelTag';
import SubjectPermissionPanel from '../components/SubjectPermissionPanel';
import { SUBJECT_KIND_OPTIONS } from '../constants';

const Subjects = () => {
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const kindRef = useRef<API.RbacSubjectKind | undefined>(undefined);
  const [kindValue, setKindValue] = useState<'all' | API.RbacSubjectKind>(
    'all',
  );
  const [selected, setSelected] = useState<API.RbacSubjectItem>();

  const columns: ProColumns<API.RbacSubjectItem>[] = [
    {
      title: '主体',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => setSelected(record)}>{record.name}</a>
      ),
    },
    { title: '类型', dataIndex: 'kind', width: 150 },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      renderText: (_, record) => record.namespace || '-',
    },
    { title: '绑定数', dataIndex: 'binding_count', width: 100 },
    { title: '集群级绑定', dataIndex: 'cluster_binding_count', width: 120 },
    { title: '权限规则', dataIndex: 'permission_count', width: 100 },
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
    <PageContainer title="主体">
      <ProTable<API.RbacSubjectItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        request={async (params) => {
          const res = await getRbacSubjectList({
            keyword: keywordRef.current,
            kind: kindRef.current,
          });
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
        expandable={{
          expandedRowRender: (record) => (
            <SubjectPermissionPanel
              query={{
                kind: record.kind,
                name: record.name,
                namespace: record.namespace,
              }}
            />
          ),
        }}
        headerTitle={
          <Space>
            <Select<'all' | API.RbacSubjectKind>
              value={kindValue}
              style={{ width: 180 }}
              options={[
                { label: '全部主体', value: 'all' },
                ...SUBJECT_KIND_OPTIONS,
              ]}
              onChange={(value) => {
                setKindValue(value);
                kindRef.current = value === 'all' ? undefined : value;
                actionRef.current?.reloadAndRest?.();
              }}
            />
            <ClusterTableSearch
              clearTriggersSearch
              placeholder="搜索主体名称 / 命名空间 / 风险"
              style={{ width: 300 }}
              onSearch={(value) => {
                keywordRef.current = value;
                actionRef.current?.reloadAndRest?.();
              }}
            />
          </Space>
        }
      />
      {selected ? (
        <SubjectPermissionPanel
          query={{
            kind: selected.kind,
            name: selected.name,
            namespace: selected.namespace,
          }}
        />
      ) : null}
    </PageContainer>
  );
};

export default Subjects;
