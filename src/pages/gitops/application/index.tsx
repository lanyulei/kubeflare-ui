import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Typography } from 'antd';
import { useRef, useState } from 'react';
import { useClusterOptions } from '@/hooks/useClusterOptions';
import {
  createGitOpsApplication,
  createGitOpsEnvironment,
  deleteGitOpsApplication,
  deleteGitOpsEnvironment,
  getGitOpsApplicationList,
  getGitOpsEnvironmentList,
  updateGitOpsApplication,
  updateGitOpsEnvironment,
} from '@/services/kubeflare/gitops';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import { EnabledStatusTag, EnvironmentTierTag } from '../components/status';
import {
  invalidateGitOpsOptions,
  useGitOpsApplicationOptions,
  useGitOpsRepositoryOptions,
} from '../hooks/useGitOpsOptions';
import { getGitOpsErrorMessage } from '../utils';

const DEFAULT_PAGE_SIZE = 10;

type ApplicationFormValues = API.CreateGitOpsApplicationParams &
  API.UpdateGitOpsApplicationParams;

type EnvironmentFormValues = API.CreateGitOpsEnvironmentParams &
  API.UpdateGitOpsEnvironmentParams;

const TIER_OPTIONS = [
  { label: '开发', value: 'dev' },
  { label: '测试', value: 'test' },
  { label: '预发', value: 'staging' },
  { label: '生产', value: 'production' },
];

const GitOpsApplicationPage = () => {
  const { message } = App.useApp();
  const applicationActionRef = useRef<ActionType | null>(null);
  const environmentActionRef = useRef<ActionType | null>(null);
  const { loading: repositoryLoading, options: repositoryOptions } =
    useGitOpsRepositoryOptions();
  const { loading: applicationLoading, options: applicationOptions } =
    useGitOpsApplicationOptions();
  const { loading: clusterLoading, options: clusterOptions } =
    useClusterOptions();
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [environmentOpen, setEnvironmentOpen] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<API.GitOpsApplication>();
  const [editingEnvironment, setEditingEnvironment] =
    useState<API.GitOpsEnvironment>();

  const reloadAll = () => {
    invalidateGitOpsOptions();
    applicationActionRef.current?.reload();
    environmentActionRef.current?.reload();
  };

  const handleApplicationSubmit = async (values: ApplicationFormValues) => {
    const payload = {
      ...values,
      status: Number(values.status ?? 1) as API.GitOpsStatus,
    };
    try {
      if (editingApplication) {
        await updateGitOpsApplication(editingApplication.id, payload, {
          skipErrorHandler: true,
        });
      } else {
        await createGitOpsApplication(payload, { skipErrorHandler: true });
      }
      message.success('应用已保存');
      setApplicationOpen(false);
      setEditingApplication(undefined);
      reloadAll();
      return true;
    } catch (error) {
      message.error(getGitOpsErrorMessage(error, '应用保存失败'));
      return false;
    }
  };

  const handleEnvironmentSubmit = async (values: EnvironmentFormValues) => {
    const payload = {
      ...values,
      status: Number(values.status ?? 1) as API.GitOpsStatus,
    };
    try {
      if (editingEnvironment) {
        await updateGitOpsEnvironment(editingEnvironment.id, payload, {
          skipErrorHandler: true,
        });
      } else {
        await createGitOpsEnvironment(payload, { skipErrorHandler: true });
      }
      message.success('环境已保存');
      setEnvironmentOpen(false);
      setEditingEnvironment(undefined);
      reloadAll();
      return true;
    } catch (error) {
      message.error(getGitOpsErrorMessage(error, '环境保存失败'));
      return false;
    }
  };

  const applicationColumns: ProColumns<API.GitOpsApplication>[] =
    withComfortableTableColumns([
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '搜索应用 / 负责人',
        },
      },
      {
        title: '应用',
        dataIndex: 'display_name',
        ellipsis: true,
        renderText: (_, record) => record.display_name || record.name,
      },
      {
        title: '标识',
        dataIndex: 'name',
        width: 180,
        ellipsis: true,
      },
      {
        title: '负责人',
        dataIndex: 'owner',
        width: 140,
      },
      {
        title: 'Manifest',
        dataIndex: 'manifest_path',
        ellipsis: true,
        search: false,
      },
      {
        title: '渲染',
        dataIndex: 'render_type',
        width: 110,
        search: false,
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
              setEditingApplication(record);
              setApplicationOpen(true);
            }}
          >
            编辑
          </Button>,
          <Popconfirm
            key="delete"
            title="确认删除该应用吗？"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={async () => {
              try {
                await deleteGitOpsApplication(record.id, {
                  skipErrorHandler: true,
                });
                message.success('应用已删除');
                reloadAll();
              } catch (error) {
                message.error(getGitOpsErrorMessage(error, '应用删除失败'));
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

  const environmentColumns: ProColumns<API.GitOpsEnvironment>[] =
    withComfortableTableColumns([
      {
        title: '关键词',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: {
          placeholder: '搜索环境 / 命名空间 / 集群',
        },
      },
      {
        title: '环境',
        dataIndex: 'name',
        ellipsis: true,
      },
      {
        title: '等级',
        dataIndex: 'tier',
        width: 100,
        render: (_, record) => <EnvironmentTierTag tier={record.tier} />,
      },
      {
        title: '集群',
        dataIndex: 'cluster_id',
        width: 120,
      },
      {
        title: '命名空间',
        dataIndex: 'namespace',
        width: 140,
      },
      {
        title: 'Overlay',
        dataIndex: 'overlay_path',
        ellipsis: true,
      },
      {
        title: '自动审批',
        dataIndex: 'auto_approve',
        width: 100,
        search: false,
        renderText: (_, record) => (record.auto_approve ? '是' : '否'),
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
              setEditingEnvironment(record);
              setEnvironmentOpen(true);
            }}
          >
            编辑
          </Button>,
          <Popconfirm
            key="delete"
            title="确认删除该环境吗？"
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
            onConfirm={async () => {
              try {
                await deleteGitOpsEnvironment(record.id, {
                  skipErrorHandler: true,
                });
                message.success('环境已删除');
                reloadAll();
              } catch (error) {
                message.error(getGitOpsErrorMessage(error, '环境删除失败'));
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
    <PageContainer title="GitOps 应用">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={5}>应用</Typography.Title>
          <ProTable<API.GitOpsApplication>
            rowKey="id"
            actionRef={applicationActionRef}
            columns={applicationColumns}
            scroll={getComfortableTableScroll(applicationColumns)}
            pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE }}
            request={async (params) => {
              const res = await getGitOpsApplicationList(params);
              return {
                data: res.data.items || [],
                success: true,
              };
            }}
            toolBarRender={() => [
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingApplication(undefined);
                  setApplicationOpen(true);
                }}
              >
                新建应用
              </Button>,
            ]}
          />
        </div>

        <div>
          <Typography.Title level={5}>环境</Typography.Title>
          <ProTable<API.GitOpsEnvironment>
            rowKey="id"
            actionRef={environmentActionRef}
            columns={environmentColumns}
            scroll={getComfortableTableScroll(environmentColumns)}
            pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE }}
            request={async (params) => {
              const res = await getGitOpsEnvironmentList(params);
              return {
                data: res.data.items || [],
                success: true,
              };
            }}
            toolBarRender={() => [
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingEnvironment(undefined);
                  setEnvironmentOpen(true);
                }}
              >
                新建环境
              </Button>,
            ]}
          />
        </div>
      </Space>

      <ModalForm<ApplicationFormValues>
        modalProps={{ destroyOnHidden: true }}
        open={applicationOpen}
        title={editingApplication ? '编辑应用' : '新建应用'}
        initialValues={editingApplication}
        width={760}
        onFinish={handleApplicationSubmit}
        onOpenChange={(open) => {
          setApplicationOpen(open);
          if (!open) {
            setEditingApplication(undefined);
          }
        }}
      >
        <ProFormSelect
          name="repository_id"
          label="GitOps 仓库"
          rules={[{ required: true, message: '请选择 GitOps 仓库' }]}
          fieldProps={{
            loading: repositoryLoading,
            options: repositoryOptions,
          }}
        />
        <ProForm.Group>
          <ProFormText
            name="display_name"
            label="应用名称"
            rules={[{ required: true, message: '请输入应用名称' }]}
          />
          <ProFormText
            name="name"
            label="应用标识"
            rules={[{ required: true, message: '请输入应用标识' }]}
          />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormText name="owner" label="负责人" />
          <ProFormSelect
            name="render_type"
            label="渲染方式"
            initialValue="kustomize"
            options={[
              { label: 'Kustomize', value: 'kustomize' },
              { label: 'Helm', value: 'helm' },
              { label: 'Raw YAML', value: 'raw' },
            ]}
            rules={[{ required: true, message: '请选择渲染方式' }]}
          />
        </ProForm.Group>
        <ProFormText
          name="manifest_path"
          label="Manifest 路径"
          rules={[{ required: true, message: '请输入 Manifest 路径' }]}
        />
        <ProFormText name="image_repo" label="镜像仓库" />
        <ProFormRadio.Group
          name="status"
          label="状态"
          initialValue={1}
          options={[
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ]}
        />
        <ProFormTextArea
          name="description"
          label="描述"
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>

      <ModalForm<EnvironmentFormValues>
        modalProps={{ destroyOnHidden: true }}
        open={environmentOpen}
        title={editingEnvironment ? '编辑环境' : '新建环境'}
        initialValues={editingEnvironment}
        width={760}
        onFinish={handleEnvironmentSubmit}
        onOpenChange={(open) => {
          setEnvironmentOpen(open);
          if (!open) {
            setEditingEnvironment(undefined);
          }
        }}
      >
        <ProFormSelect
          name="application_id"
          label="应用"
          rules={[{ required: true, message: '请选择应用' }]}
          fieldProps={{
            loading: applicationLoading,
            options: applicationOptions,
          }}
        />
        <ProForm.Group>
          <ProFormText
            name="name"
            label="环境名称"
            rules={[{ required: true, message: '请输入环境名称' }]}
          />
          <ProFormSelect
            name="tier"
            label="环境等级"
            options={TIER_OPTIONS}
            rules={[{ required: true, message: '请选择环境等级' }]}
          />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormSelect
            name="cluster_id"
            label="集群"
            rules={[{ required: true, message: '请选择集群' }]}
            fieldProps={{
              loading: clusterLoading,
              options: clusterOptions,
              showSearch: true,
              optionFilterProp: 'label',
            }}
          />
          <ProFormText
            name="namespace"
            label="命名空间"
            rules={[{ required: true, message: '请输入命名空间' }]}
          />
        </ProForm.Group>
        <ProFormText
          name="overlay_path"
          label="Overlay 路径"
          rules={[{ required: true, message: '请输入 Overlay 路径' }]}
        />
        <ProForm.Group>
          <ProFormText name="flux_namespace" label="Flux 命名空间" />
          <ProFormText name="flux_kustomization" label="Kustomization" />
          <ProFormText name="flux_helm_release" label="HelmRelease" />
        </ProForm.Group>
        <ProForm.Group>
          <ProFormSwitch name="auto_approve" label="自动审批" />
          <ProFormSwitch
            name="require_signed_image"
            label="要求镜像签名"
            initialValue
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
      </ModalForm>
    </PageContainer>
  );
};

export default GitOpsApplicationPage;
