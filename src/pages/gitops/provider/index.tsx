import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Typography } from 'antd';
import { useRef, useState } from 'react';
import {
  createGitOpsProvider,
  createGitOpsRepository,
  deleteGitOpsProvider,
  deleteGitOpsRepository,
  getGitOpsProviderList,
  getGitOpsRepositoryList,
  testGitOpsProvider,
  updateGitOpsProvider,
  updateGitOpsRepository,
} from '@/services/kubeflare/gitops';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import { EnabledStatusTag } from '../components/status';
import { useGitOpsTableStyles } from '../components/tableStyles';
import {
  invalidateGitOpsOptions,
  useGitOpsProviderOptions,
} from '../hooks/useGitOpsOptions';
import {
  formatDateTimeText,
  getGitOpsErrorMessage,
  toGitOpsTableResult,
} from '../utils';

const DEFAULT_PAGE_SIZE = 10;

type ProviderFormValues = API.CreateGitOpsProviderParams &
  API.UpdateGitOpsProviderParams;

type RepositoryFormValues = API.CreateGitOpsRepositoryParams &
  API.UpdateGitOpsRepositoryParams;

const GitOpsProviderPage = () => {
  const { message } = App.useApp();
  const { styles } = useGitOpsTableStyles();
  const providerActionRef = useRef<ActionType | null>(null);
  const repositoryActionRef = useRef<ActionType | null>(null);
  const { loading: providerOptionsLoading, options: providerOptions } =
    useGitOpsProviderOptions();
  const [providerOpen, setProviderOpen] = useState(false);
  const [repositoryOpen, setRepositoryOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<API.GitOpsProvider>();
  const [editingRepository, setEditingRepository] =
    useState<API.GitOpsRepository>();
  const [testingProviderID, setTestingProviderID] = useState<string>();

  const reloadAll = () => {
    invalidateGitOpsOptions();
    providerActionRef.current?.reload();
    repositoryActionRef.current?.reload();
  };

  const handleProviderSubmit = async (values: ProviderFormValues) => {
    const payload = {
      ...values,
      status: Number(values.status ?? 1) as API.GitOpsStatus,
    };
    try {
      if (editingProvider) {
        await updateGitOpsProvider(editingProvider.id, payload, {
          skipErrorHandler: true,
        });
      } else {
        await createGitOpsProvider(payload as API.CreateGitOpsProviderParams, {
          skipErrorHandler: true,
        });
      }
      message.success('GitLab Provider 已保存');
      setProviderOpen(false);
      setEditingProvider(undefined);
      reloadAll();
      return true;
    } catch (error) {
      message.error(getGitOpsErrorMessage(error, 'Provider 保存失败'));
      return false;
    }
  };

  const handleRepositorySubmit = async (values: RepositoryFormValues) => {
    const payload = {
      ...values,
      status: Number(values.status ?? 1) as API.GitOpsStatus,
    };
    try {
      if (editingRepository) {
        await updateGitOpsRepository(editingRepository.id, payload, {
          skipErrorHandler: true,
        });
      } else {
        await createGitOpsRepository(payload, { skipErrorHandler: true });
      }
      message.success('GitOps 仓库已保存');
      setRepositoryOpen(false);
      setEditingRepository(undefined);
      reloadAll();
      return true;
    } catch (error) {
      message.error(getGitOpsErrorMessage(error, '仓库保存失败'));
      return false;
    }
  };

  const handleTestProvider = async (providerID: string) => {
    setTestingProviderID(providerID);
    try {
      const res = await testGitOpsProvider(providerID, {
        skipErrorHandler: true,
      });
      if (res.data.reachable) {
        message.success(res.data.message || '连接正常');
      } else {
        message.warning(res.data.message || '连接失败');
      }
      providerActionRef.current?.reload();
    } catch (error) {
      message.error(getGitOpsErrorMessage(error, '连接检测失败'));
    } finally {
      setTestingProviderID(undefined);
    }
  };

  const providerColumns: ProColumns<API.GitOpsProvider>[] =
    withComfortableTableColumns([
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '搜索名称 / URL',
        },
      },
      {
        title: '名称',
        dataIndex: 'name',
        ellipsis: true,
      },
      {
        title: 'GitLab URL',
        dataIndex: 'base_url',
        ellipsis: true,
      },
      {
        title: 'Token',
        dataIndex: 'has_token',
        width: 100,
        search: false,
        render: (_, record) => (record.has_token ? '已配置' : '未配置'),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        search: false,
        render: (_, record) => <EnabledStatusTag status={record.status} />,
      },
      {
        title: '最近检测',
        dataIndex: 'last_check_at',
        width: 180,
        search: false,
        renderText: (value) => formatDateTimeText(value),
      },
      {
        title: '检测消息',
        dataIndex: 'last_check_message',
        ellipsis: true,
        search: false,
      },
      {
        title: '操作',
        valueType: 'option',
        width: 220,
        fixed: 'right',
        render: (_, record) => [
          <Button
            key="test"
            type="link"
            size="small"
            icon={<ThunderboltOutlined />}
            loading={testingProviderID === record.id}
            onClick={() => handleTestProvider(record.id)}
          >
            检测
          </Button>,
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingProvider(record);
              setProviderOpen(true);
            }}
          >
            编辑
          </Button>,
          <Popconfirm
            key="delete"
            title="确认删除该 Provider 吗？"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={async () => {
              try {
                await deleteGitOpsProvider(record.id, {
                  skipErrorHandler: true,
                });
                message.success('Provider 已删除');
                reloadAll();
              } catch (error) {
                message.error(
                  getGitOpsErrorMessage(error, 'Provider 删除失败'),
                );
              }
            }}
          >
            <Button danger type="link" size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>,
        ],
      },
    ]);

  const repositoryColumns: ProColumns<API.GitOpsRepository>[] =
    withComfortableTableColumns([
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '搜索仓库 / 路径 / Project ID',
        },
      },
      {
        title: '仓库',
        dataIndex: 'name',
        ellipsis: true,
      },
      {
        title: 'Provider',
        dataIndex: 'provider_id',
        width: 160,
        ellipsis: true,
        renderText: (_, record) => record.provider?.name || record.provider_id,
      },
      {
        title: 'Project ID',
        dataIndex: 'project_id',
        width: 140,
      },
      {
        title: '路径',
        dataIndex: 'path',
        ellipsis: true,
      },
      {
        title: '默认分支',
        dataIndex: 'default_ref',
        width: 120,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        search: false,
        render: (_, record) => <EnabledStatusTag status={record.status} />,
      },
      {
        title: '操作',
        valueType: 'option',
        width: 160,
        fixed: 'right',
        render: (_, record) => [
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRepository(record);
              setRepositoryOpen(true);
            }}
          >
            编辑
          </Button>,
          <Popconfirm
            key="delete"
            title="确认删除该仓库吗？"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={async () => {
              try {
                await deleteGitOpsRepository(record.id, {
                  skipErrorHandler: true,
                });
                message.success('仓库已删除');
                reloadAll();
              } catch (error) {
                message.error(getGitOpsErrorMessage(error, '仓库删除失败'));
              }
            }}
          >
            <Button danger type="link" size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>,
        ],
      },
    ]);

  return (
    <PageContainer title="GitOps 接入">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={5}>GitLab Provider</Typography.Title>
          <ProTable<API.GitOpsProvider>
            rowKey="id"
            actionRef={providerActionRef}
            className={styles.table}
            columns={providerColumns}
            scroll={getComfortableTableScroll(providerColumns)}
            pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE }}
            request={async (params) => {
              const res = await getGitOpsProviderList(params);
              return toGitOpsTableResult(res.data);
            }}
            toolBarRender={() => [
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingProvider(undefined);
                  setProviderOpen(true);
                }}
              >
                新建 Provider
              </Button>,
            ]}
          />
        </div>

        <div>
          <Typography.Title level={5}>GitOps 仓库</Typography.Title>
          <ProTable<API.GitOpsRepository>
            rowKey="id"
            actionRef={repositoryActionRef}
            className={styles.table}
            columns={repositoryColumns}
            scroll={getComfortableTableScroll(repositoryColumns)}
            pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE }}
            request={async (params) => {
              const res = await getGitOpsRepositoryList(params);
              return toGitOpsTableResult(res.data);
            }}
            toolBarRender={() => [
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRepository(undefined);
                  setRepositoryOpen(true);
                }}
              >
                新建仓库
              </Button>,
            ]}
          />
        </div>
      </Space>

      <ModalForm<ProviderFormValues>
        modalProps={{ destroyOnHidden: true }}
        open={providerOpen}
        title={editingProvider ? '编辑 Provider' : '新建 Provider'}
        initialValues={editingProvider}
        width={720}
        onFinish={handleProviderSubmit}
        onOpenChange={(open) => {
          setProviderOpen(open);
          if (!open) {
            setEditingProvider(undefined);
          }
        }}
      >
        <ProFormText
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        />
        <ProFormText
          name="base_url"
          label="GitLab URL"
          rules={[{ required: true, message: '请输入 GitLab URL' }]}
        />
        <ProFormText.Password
          name="token"
          label="访问 Token"
          rules={
            editingProvider
              ? []
              : [{ required: true, message: '请输入访问 Token' }]
          }
          fieldProps={{
            placeholder: editingProvider ? '留空表示不变' : undefined,
          }}
        />
        <ProFormText.Password
          name="webhook_secret"
          label="Webhook Secret"
          fieldProps={{ placeholder: editingProvider ? '留空表示不变' : '' }}
        />
        <ProFormTextArea
          name="ca_bundle"
          label="CA Bundle"
          fieldProps={{
            placeholder: editingProvider
              ? '留空表示不变'
              : '自签 GitLab 证书链，可留空',
            rows: 4,
          }}
        />
        <ProFormRadio.Group
          name="status"
          label="状态"
          initialValue={1}
          options={[
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ]}
        />
        <ProFormTextArea name="remarks" label="备注" fieldProps={{ rows: 3 }} />
      </ModalForm>

      <ModalForm<RepositoryFormValues>
        modalProps={{ destroyOnHidden: true }}
        open={repositoryOpen}
        title={editingRepository ? '编辑 GitOps 仓库' : '新建 GitOps 仓库'}
        initialValues={editingRepository}
        width={720}
        onFinish={handleRepositorySubmit}
        onOpenChange={(open) => {
          setRepositoryOpen(open);
          if (!open) {
            setEditingRepository(undefined);
          }
        }}
      >
        <ProFormSelect
          name="provider_id"
          label="Provider"
          rules={[{ required: true, message: '请选择 Provider' }]}
          fieldProps={{
            loading: providerOptionsLoading,
            options: providerOptions,
          }}
        />
        <ProForm.Group>
          <ProFormText
            name="name"
            label="仓库名称"
            rules={[{ required: true, message: '请输入仓库名称' }]}
          />
          <ProFormText
            name="project_id"
            label="Project ID"
            rules={[{ required: true, message: '请输入 Project ID' }]}
          />
        </ProForm.Group>
        <ProFormText
          name="path"
          label="仓库路径"
          rules={[{ required: true, message: '请输入仓库路径' }]}
        />
        <ProForm.Group>
          <ProFormText
            name="default_ref"
            label="默认分支"
            initialValue="main"
            rules={[{ required: true, message: '请输入默认分支' }]}
          />
          <ProFormRadio.Group
            name="status"
            label="状态"
            initialValue={1}
            options={[
              { label: '启用', value: 1 },
              { label: '停用', value: 0 },
            ]}
          />
        </ProForm.Group>
        <ProFormText name="web_url" label="Web URL" />
        <ProFormTextArea name="remarks" label="备注" fieldProps={{ rows: 3 }} />
      </ModalForm>
    </PageContainer>
  );
};

export default GitOpsProviderPage;
