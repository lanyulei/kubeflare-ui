import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Select, Space } from 'antd';
import { createStyles } from 'antd-style';
import { useRef, useState } from 'react';
import { ClusterTableSearch } from '@/components';
import { getRbacSubjectList } from '@/services/kubeflare/cluster/rbac';
import RiskLevelTag from '../components/RiskLevelTag';
import SubjectDetailDrawer from '../components/SubjectDetailDrawer';
import SubjectIdentity from '../components/SubjectIdentity';
import { SUBJECT_KIND_OPTIONS, TABLE_DEFAULT_PAGE_SIZE } from '../constants';

const useStyles = createStyles(({ token }) => ({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: token.marginSM,
  },
  kindSelect: {
    width: 180,
  },
  search: {
    width: 300,
    maxWidth: '100%',
  },
}));

const Subjects = () => {
  const { styles } = useStyles();
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
      width: 320,
      render: (_, record) => (
        <SubjectIdentity
          link
          showNamespace={false}
          subject={record}
          onClick={() => setSelected(record)}
        />
      ),
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      width: 180,
      ellipsis: true,
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
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, record) => [
        <a key="detail" onClick={() => setSelected(record)}>
          详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title="主体">
      <ProTable<API.RbacSubjectItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        scroll={{ x: 1030 }}
        pagination={{
          defaultPageSize: TABLE_DEFAULT_PAGE_SIZE,
        }}
        request={async (params) => {
          const res = await getRbacSubjectList({
            keyword: keywordRef.current,
            kind: kindRef.current,
          });
          const current = params.current || 1;
          const pageSize = params.pageSize || TABLE_DEFAULT_PAGE_SIZE;
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
          <Space className={styles.toolbar}>
            <Select<'all' | API.RbacSubjectKind>
              value={kindValue}
              className={styles.kindSelect}
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
              className={styles.search}
              onSearch={(value) => {
                keywordRef.current = value;
                actionRef.current?.reloadAndRest?.();
              }}
            />
          </Space>
        }
      />
      <SubjectDetailDrawer
        open={Boolean(selected)}
        subject={selected}
        onClose={() => setSelected(undefined)}
      />
    </PageContainer>
  );
};

export default Subjects;
