import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Select, Space, Tag } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import { ClusterTableSearch } from '@/components';
import { getClusterNamespaceList } from '@/services/kubeflare/cluster/namespace';
import { getRbacRoleList } from '@/services/kubeflare/cluster/rbac';
import {
  createClusterResource,
  deleteClusterResource,
} from '@/services/kubeflare/cluster/resource';
import RbacDetailDrawer from '../components/RbacDetailDrawer';
import RbacYamlDrawer from '../components/RbacYamlDrawer';
import RiskLevelTag from '../components/RiskLevelTag';
import { ALL_NAMESPACES_VALUE, TABLE_DEFAULT_PAGE_SIZE } from '../constants';
import { getRbacResourceType, getResourceNamespace, toYaml } from '../utils';
import CreateRoleDrawer from './components/CreateRoleDrawer';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试';

const useStyles = createStyles(({ token }) => ({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
  },
  namespaceSelect: {
    width: 180,
  },
  typeSelect: {
    width: 150,
  },
}));

const Roles = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const namespaceRef = useRef<string | undefined>(undefined);
  const typeRef = useRef<'Role' | 'ClusterRole' | undefined>(undefined);
  const [namespaceValue, setNamespaceValue] = useState(ALL_NAMESPACES_VALUE);
  const [typeValue, setTypeValue] = useState<'all' | 'Role' | 'ClusterRole'>(
    'all',
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [namespaceOptions, setNamespaceOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [detailItem, setDetailItem] = useState<API.RbacRoleItem>();
  const [yamlState, setYamlState] = useState<{
    open: boolean;
    mode: 'view' | 'edit' | 'create';
    item?: API.RbacRoleItem;
    value: string;
  }>({ open: false, mode: 'view', value: '' });

  const handleCreateRole = async (values: {
    type: API.ClusterResourceCreateType;
    namespace?: string;
    manifest: Record<string, unknown>;
  }) => {
    setCreateLoading(true);
    try {
      await createClusterResource(values);
      message.success('角色已创建');
      setCreateOpen(false);
      actionRef.current?.reloadAndRest?.();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    getClusterNamespaceList().then((res) => {
      setNamespaceOptions(
        (res.data.items || []).flatMap((item) => {
          if (!item.name || item.name === '-') {
            return [];
          }

          return [
            {
              label: item.name,
              value: item.name,
            },
          ];
        }),
      );
    });
  }, []);

  const columns: ProColumns<API.RbacRoleItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 220,
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => setDetailItem(record)}>{record.name}</a>
      ),
    },
    { title: '类型', dataIndex: 'type', width: 130, ellipsis: true },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      width: 180,
      ellipsis: true,
      renderText: (_, record) => record.namespace || '全集群',
    },
    { title: '规则数', dataIndex: 'rule_count', width: 90 },
    { title: '绑定数', dataIndex: 'binding_count', width: 90 },
    {
      title: '标记',
      dataIndex: 'system',
      width: 150,
      render: (_, record) => (
        <Space size={[0, 6]} wrap>
          {record.system ? <Tag color="blue">系统</Tag> : <Tag>自定义</Tag>}
          {record.aggregated ? <Tag color="purple">聚合</Tag> : null}
        </Space>
      ),
    },
    {
      title: '风险',
      dataIndex: 'risk_level',
      width: 110,
      render: (_, record) => (
        <RiskLevelTag level={record.risk_level} reasons={record.risk_reasons} />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 190,
      fixed: 'right',
      render: (_, record) => [
        <a
          key="yaml"
          onClick={() =>
            setYamlState({
              open: true,
              mode: 'view',
              item: record,
              value: toYaml(record.raw),
            })
          }
        >
          <FileTextOutlined /> YAML
        </a>,
        <a
          key="edit"
          onClick={() =>
            setYamlState({
              open: true,
              mode: 'edit',
              item: record,
              value: toYaml(record.raw),
            })
          }
        >
          <EditOutlined /> 编辑
        </a>,
        <Popconfirm
          key="delete"
          title={`确认删除 ${record.type} 吗？`}
          description="删除角色可能导致已有绑定失效，请先确认影响范围。"
          okButtonProps={{ danger: true }}
          okText="删除"
          cancelText="取消"
          onConfirm={async () => {
            try {
              await deleteClusterResource({
                type: getRbacResourceType(record),
                namespace: getResourceNamespace(record),
                name: record.name,
              });
              message.success('角色已删除');
              actionRef.current?.reloadAndRest?.();
            } catch (error) {
              message.error(getErrorMessage(error));
            }
          }}
        >
          <a>
            <DeleteOutlined /> 删除
          </a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer title="角色">
      <ProTable<API.RbacRoleItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        scroll={{ x: 1340 }}
        pagination={{
          defaultPageSize: TABLE_DEFAULT_PAGE_SIZE,
        }}
        request={async (params) => {
          const res = await getRbacRoleList({
            keyword: keywordRef.current,
            namespace: namespaceRef.current,
            type: typeRef.current,
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              新建
            </Button>
            <Select<'all' | 'Role' | 'ClusterRole'>
              className={styles.typeSelect}
              value={typeValue}
              options={[
                { label: '全部类型', value: 'all' },
                { label: 'Role', value: 'Role' },
                { label: 'ClusterRole', value: 'ClusterRole' },
              ]}
              onChange={(value) => {
                setTypeValue(value);
                typeRef.current = value === 'all' ? undefined : value;
                actionRef.current?.reloadAndRest?.();
              }}
            />
            <Select<string>
              className={styles.namespaceSelect}
              value={namespaceValue}
              options={[
                { label: '全部命名空间', value: ALL_NAMESPACES_VALUE },
                ...namespaceOptions,
              ]}
              onChange={(value) => {
                setNamespaceValue(value);
                namespaceRef.current =
                  value === ALL_NAMESPACES_VALUE ? undefined : value;
                actionRef.current?.reloadAndRest?.();
              }}
            />
            <ClusterTableSearch
              clearTriggersSearch
              placeholder="搜索角色名称 / 命名空间 / 风险"
              style={{ width: 280 }}
              onSearch={(value) => {
                keywordRef.current = value;
                actionRef.current?.reloadAndRest?.();
              }}
            />
          </Space>
        }
      />
      <RbacDetailDrawer
        open={Boolean(detailItem)}
        item={detailItem}
        onClose={() => setDetailItem(undefined)}
      />
      <CreateRoleDrawer
        defaultNamespace={
          namespaceValue === ALL_NAMESPACES_VALUE ? undefined : namespaceValue
        }
        defaultType={typeRef.current || 'Role'}
        loading={createLoading}
        namespaceOptions={namespaceOptions}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSubmit={handleCreateRole}
      />
      <RbacYamlDrawer
        open={yamlState.open}
        mode={yamlState.mode}
        title={
          yamlState.mode === 'create'
            ? '新建角色 YAML'
            : `${yamlState.item?.name} YAML`
        }
        value={yamlState.value}
        resourceType={
          yamlState.item ? getRbacResourceType(yamlState.item) : undefined
        }
        namespace={
          yamlState.item ? getResourceNamespace(yamlState.item) : undefined
        }
        name={yamlState.item?.name}
        onClose={() => setYamlState((state) => ({ ...state, open: false }))}
        onSuccess={() => actionRef.current?.reloadAndRest?.()}
      />
    </PageContainer>
  );
};

export default Roles;
