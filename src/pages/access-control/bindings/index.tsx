import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Select, Space } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import { ClusterTableSearch } from '@/components';
import { getClusterNamespaceList } from '@/services/kubeflare/cluster/namespace';
import { getRbacBindingList } from '@/services/kubeflare/cluster/rbac';
import {
  createClusterResource,
  deleteClusterResource,
} from '@/services/kubeflare/cluster/resource';
import RbacDetailDrawer from '../components/RbacDetailDrawer';
import RbacYamlDrawer from '../components/RbacYamlDrawer';
import RiskLevelTag from '../components/RiskLevelTag';
import { ALL_NAMESPACES_VALUE } from '../constants';
import {
  getBindingScopeText,
  getRbacResourceType,
  getResourceNamespace,
  getSubjectText,
  toYaml,
} from '../utils';
import CreateBindingDrawer from './components/CreateBindingDrawer';

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
    width: 190,
  },
}));

const Bindings = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const keywordRef = useRef('');
  const namespaceRef = useRef<string | undefined>(undefined);
  const typeRef = useRef<'RoleBinding' | 'ClusterRoleBinding' | undefined>(
    undefined,
  );
  const [namespaceValue, setNamespaceValue] = useState(ALL_NAMESPACES_VALUE);
  const [typeValue, setTypeValue] = useState<
    'all' | 'RoleBinding' | 'ClusterRoleBinding'
  >('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [namespaceOptions, setNamespaceOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [detailItem, setDetailItem] = useState<API.RbacBindingItem>();
  const [yamlState, setYamlState] = useState<{
    open: boolean;
    mode: 'view' | 'edit' | 'create';
    item?: API.RbacBindingItem;
    value: string;
  }>({ open: false, mode: 'view', value: '' });

  const handleCreateBinding = async (values: {
    type: API.ClusterResourceCreateType;
    namespace?: string;
    manifest: Record<string, unknown>;
  }) => {
    setCreateLoading(true);
    try {
      await createClusterResource(values);
      message.success('绑定已创建');
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

  const columns: ProColumns<API.RbacBindingItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 240,
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => setDetailItem(record)}>{record.name}</a>
      ),
    },
    { title: '类型', dataIndex: 'type', width: 170, ellipsis: true },
    {
      title: '授权范围',
      dataIndex: 'scope',
      width: 160,
      renderText: (_, record) => getBindingScopeText(record),
    },
    {
      title: '主体',
      dataIndex: 'subjects',
      width: 260,
      ellipsis: true,
      renderText: (_, record) => record.subjects.map(getSubjectText).join('、'),
    },
    {
      title: '引用角色',
      dataIndex: 'role_name',
      width: 260,
      ellipsis: true,
      renderText: (_, record) =>
        `${record.roleRef?.kind || '-'}:${record.roleRef?.name || '-'}`,
    },
    { title: '规则数', dataIndex: 'rule_count', width: 90 },
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
          description="删除绑定会立即收回对应主体权限，请谨慎操作。"
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
              message.success('绑定已删除');
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
    <PageContainer title="绑定">
      <ProTable<API.RbacBindingItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        scroll={{ x: 1660 }}
        request={async (params) => {
          const res = await getRbacBindingList({
            keyword: keywordRef.current,
            namespace: namespaceRef.current,
            type: typeRef.current,
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
        headerTitle={
          <Space className={styles.toolbar}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              新建
            </Button>
            <Select<'all' | 'RoleBinding' | 'ClusterRoleBinding'>
              className={styles.typeSelect}
              value={typeValue}
              options={[
                { label: '全部类型', value: 'all' },
                { label: 'RoleBinding', value: 'RoleBinding' },
                { label: 'ClusterRoleBinding', value: 'ClusterRoleBinding' },
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
              placeholder="搜索绑定名称 / 主体 / 角色 / 风险"
              style={{ width: 300 }}
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
      <CreateBindingDrawer
        defaultNamespace={
          namespaceValue === ALL_NAMESPACES_VALUE ? undefined : namespaceValue
        }
        defaultType={typeRef.current || 'RoleBinding'}
        loading={createLoading}
        namespaceOptions={namespaceOptions}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSubmit={handleCreateBinding}
      />
      <RbacYamlDrawer
        open={yamlState.open}
        mode={yamlState.mode}
        title={
          yamlState.mode === 'create'
            ? '新建绑定 YAML'
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

export default Bindings;
