import {
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button } from 'antd';
import { useRef, useState } from 'react';
import {
  approveGitOpsRelease,
  createGitOpsRelease,
  getGitOpsReleaseList,
  rejectGitOpsRelease,
  rollbackGitOpsRelease,
} from '@/services/kubeflare/gitops';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import { ReleaseStatusTag } from '../components/status';
import {
  useGitOpsApplicationOptions,
  useGitOpsEnvironmentOptions,
} from '../hooks/useGitOpsOptions';
import { formatDateTimeText, getGitOpsErrorMessage } from '../utils';

const DEFAULT_PAGE_SIZE = 10;

const RELEASE_STATUS_OPTIONS = [
  { label: '待审批', value: 'waiting_approval' },
  { label: '同步中', value: 'syncing' },
  { label: '成功', value: 'succeeded' },
  { label: '失败', value: 'failed' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已回滚', value: 'rolled_back' },
];

const GitOpsReleasePage = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const { loading: applicationLoading, options: applicationOptions } =
    useGitOpsApplicationOptions();
  const { loading: environmentLoading, options: environmentOptions } =
    useGitOpsEnvironmentOptions();
  const [createOpen, setCreateOpen] = useState(false);
  const [actionRelease, setActionRelease] = useState<API.GitOpsRelease>();
  const [actionType, setActionType] = useState<
    'approve' | 'reject' | 'rollback'
  >();

  const reload = () => actionRef.current?.reload();

  const handleCreate = async (values: API.CreateGitOpsReleaseParams) => {
    try {
      await createGitOpsRelease(values, { skipErrorHandler: true });
      message.success('发布单已创建');
      setCreateOpen(false);
      reload();
      return true;
    } catch (error) {
      message.error(getGitOpsErrorMessage(error, '发布单创建失败'));
      return false;
    }
  };

  const handleAction = async (values: API.GitOpsReleaseActionParams) => {
    if (!actionRelease || !actionType) {
      return false;
    }
    try {
      if (actionType === 'approve') {
        await approveGitOpsRelease(actionRelease.id, values, {
          skipErrorHandler: true,
        });
        message.success('发布单已审批通过');
      }
      if (actionType === 'reject') {
        await rejectGitOpsRelease(actionRelease.id, values, {
          skipErrorHandler: true,
        });
        message.success('发布单已拒绝');
      }
      if (actionType === 'rollback') {
        await rollbackGitOpsRelease(
          actionRelease.id,
          { reason: values.comment },
          { skipErrorHandler: true },
        );
        message.success('回滚记录已创建');
      }
      setActionRelease(undefined);
      setActionType(undefined);
      reload();
      return true;
    } catch (error) {
      message.error(getGitOpsErrorMessage(error, '发布操作失败'));
      return false;
    }
  };

  const columns: ProColumns<API.GitOpsRelease>[] = withComfortableTableColumns([
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '搜索标题 / 版本 / 镜像 Digest',
      },
    },
    {
      title: '应用',
      dataIndex: 'application_id',
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        loading: applicationLoading,
        options: applicationOptions,
        showSearch: true,
        optionFilterProp: 'label',
      },
      hideInTable: true,
    },
    {
      title: '环境',
      dataIndex: 'environment_id',
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        loading: environmentLoading,
        options: environmentOptions,
        showSearch: true,
        optionFilterProp: 'label',
      },
      hideInTable: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        options: RELEASE_STATUS_OPTIONS,
      },
      hideInTable: true,
    },
    {
      title: '发布单',
      dataIndex: 'title',
      width: 220,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      search: false,
      render: (_, record) => <ReleaseStatusTag status={record.status} />,
    },
    {
      title: 'Source Ref',
      dataIndex: 'source_ref',
      width: 160,
      ellipsis: true,
      search: false,
    },
    {
      title: '目标版本',
      dataIndex: 'target_revision',
      width: 180,
      ellipsis: true,
      search: false,
    },
    {
      title: '镜像 Digest',
      dataIndex: 'image_digest',
      ellipsis: true,
      search: false,
    },
    {
      title: '操作者',
      dataIndex: 'operator_id',
      width: 140,
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      search: false,
      renderText: (value) => formatDateTimeText(value),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 240,
      fixed: 'right',
      render: (_, record) => [
        record.status === 'waiting_approval' ? (
          <Button
            key="approve"
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => {
              setActionRelease(record);
              setActionType('approve');
            }}
          >
            通过
          </Button>
        ) : null,
        record.status === 'waiting_approval' ? (
          <Button
            key="reject"
            danger
            type="link"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => {
              setActionRelease(record);
              setActionType('reject');
            }}
          >
            拒绝
          </Button>
        ) : null,
        <Button
          key="rollback"
          type="link"
          size="small"
          icon={<RollbackOutlined />}
          onClick={() => {
            setActionRelease(record);
            setActionType('rollback');
          }}
        >
          回滚
        </Button>,
      ],
    },
  ]);

  return (
    <PageContainer title="GitOps 发布">
      <ProTable<API.GitOpsRelease>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        scroll={getComfortableTableScroll(columns)}
        pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE }}
        request={async (params) => {
          const res = await getGitOpsReleaseList(params);
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
            onClick={() => setCreateOpen(true)}
          >
            新建发布
          </Button>,
        ]}
      />

      <ModalForm<API.CreateGitOpsReleaseParams>
        modalProps={{ destroyOnHidden: true }}
        open={createOpen}
        title="新建发布"
        width={720}
        onFinish={handleCreate}
        onOpenChange={setCreateOpen}
      >
        <ProFormSelect
          name="application_id"
          label="应用"
          rules={[{ required: true, message: '请选择应用' }]}
          fieldProps={{
            loading: applicationLoading,
            options: applicationOptions,
            showSearch: true,
            optionFilterProp: 'label',
          }}
        />
        <ProFormSelect
          name="environment_id"
          label="环境"
          rules={[{ required: true, message: '请选择环境' }]}
          fieldProps={{
            loading: environmentLoading,
            options: environmentOptions,
            showSearch: true,
            optionFilterProp: 'label',
          }}
        />
        <ProFormText
          name="title"
          label="发布标题"
          rules={[{ required: true, message: '请输入发布标题' }]}
        />
        <ProForm.Group>
          <ProFormText name="source_ref" label="Source Ref" />
          <ProFormText name="target_revision" label="目标版本" />
        </ProForm.Group>
        <ProFormText name="image_digest" label="镜像 Digest" />
        <ProFormTextArea
          name="reason"
          label="发布说明"
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>

      <ModalForm<API.GitOpsReleaseActionParams>
        modalProps={{ destroyOnHidden: true }}
        open={Boolean(actionRelease && actionType)}
        title={
          actionType === 'approve'
            ? '审批通过'
            : actionType === 'reject'
              ? '拒绝发布'
              : '创建回滚记录'
        }
        width={560}
        onFinish={handleAction}
        onOpenChange={(open) => {
          if (!open) {
            setActionRelease(undefined);
            setActionType(undefined);
          }
        }}
      >
        <ProFormTextArea name="comment" label="说明" fieldProps={{ rows: 4 }} />
      </ModalForm>
    </PageContainer>
  );
};

export default GitOpsReleasePage;
