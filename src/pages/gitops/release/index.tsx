import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  LinkOutlined,
  PlusOutlined,
  RollbackOutlined,
  SendOutlined,
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
import { App, Button, Popconfirm } from 'antd';
import { useRef, useState } from 'react';
import {
  approveGitOpsRelease,
  createGitOpsRelease,
  getGitOpsReleaseDetail,
  getGitOpsReleaseList,
  rejectGitOpsRelease,
  rollbackGitOpsRelease,
  submitGitOpsRelease,
} from '@/services/kubeflare/gitops';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import { RELEASE_STATUS_OPTIONS, ReleaseStatusTag } from '../components/status';
import { useGitOpsTableStyles } from '../components/tableStyles';
import {
  useGitOpsApplicationOptions,
  useGitOpsEnvironmentOptions,
} from '../hooks/useGitOpsOptions';
import {
  formatDateTimeText,
  getGitOpsErrorMessage,
  toGitOpsTableResult,
} from '../utils';
import ReleaseDetailDrawer from './components/ReleaseDetailDrawer';

const DEFAULT_PAGE_SIZE = 10;

const rollbackEnabledStatuses: API.GitOpsReleaseStatus[] = [
  'failed',
  'succeeded',
];

const canRollback = (release: API.GitOpsRelease) =>
  rollbackEnabledStatuses.includes(release.status) &&
  Boolean(release.commit_sha);

const GitOpsReleasePage = () => {
  const { message } = App.useApp();
  const { styles } = useGitOpsTableStyles();
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRelease, setDetailRelease] = useState<API.GitOpsRelease>();
  const [submittingReleaseID, setSubmittingReleaseID] = useState<string>();

  const reload = () => actionRef.current?.reload();

  const openDetail = async (record: API.GitOpsRelease) => {
    setDetailOpen(true);
    setDetailRelease(record);
    setDetailLoading(true);
    try {
      const res = await getGitOpsReleaseDetail(record.id, {
        skipErrorHandler: true,
      });
      setDetailRelease({
        ...record,
        ...res.data,
        application: res.data.application || record.application,
        environment: res.data.environment || record.environment,
      });
    } catch (error) {
      message.error(getGitOpsErrorMessage(error, '发布详情加载失败'));
    } finally {
      setDetailLoading(false);
    }
  };

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

  const handleSubmitRelease = async (releaseID: string) => {
    setSubmittingReleaseID(releaseID);
    try {
      await submitGitOpsRelease(releaseID, { skipErrorHandler: true });
      message.success('发布单已提交审批');
      reload();
    } catch (error) {
      message.error(getGitOpsErrorMessage(error, '发布单提交失败'));
    } finally {
      setSubmittingReleaseID(undefined);
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
      width: 240,
      ellipsis: true,
    },
    {
      title: '应用',
      dataIndex: 'application_id',
      width: 160,
      ellipsis: true,
      search: false,
      renderText: (_, record) =>
        record.application?.display_name || record.application?.name || '-',
    },
    {
      title: '环境',
      dataIndex: 'environment_id',
      width: 140,
      ellipsis: true,
      search: false,
      renderText: (_, record) => record.environment?.name || '-',
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
      width: 240,
      ellipsis: true,
      search: false,
    },
    {
      title: 'MR',
      dataIndex: 'mr_url',
      width: 110,
      search: false,
      render: (_, record) =>
        record.mr_url ? (
          <Button
            href={record.mr_url}
            icon={<LinkOutlined />}
            rel="noreferrer"
            size="small"
            target="_blank"
            type="link"
          >
            {record.mr_iid ? `!${record.mr_iid}` : '查看'}
          </Button>
        ) : (
          '-'
        ),
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
      width: 300,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="detail"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record)}
        >
          详情
        </Button>,
        record.status === 'draft' ? (
          <Popconfirm
            key="submit"
            title="确认提交该发布单进入审批吗？"
            okText="提交"
            cancelText="取消"
            onConfirm={() => handleSubmitRelease(record.id)}
          >
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              loading={submittingReleaseID === record.id}
            >
              提交
            </Button>
          </Popconfirm>
        ) : null,
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
        rollbackEnabledStatuses.includes(record.status) ? (
          <Button
            key="rollback"
            disabled={!canRollback(record)}
            type="link"
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => {
              setActionRelease(record);
              setActionType('rollback');
            }}
          >
            回滚
          </Button>
        ) : null,
      ],
    },
  ]);

  return (
    <PageContainer title="GitOps 发布">
      <ProTable<API.GitOpsRelease>
        rowKey="id"
        actionRef={actionRef}
        className={styles.table}
        columns={columns}
        scroll={getComfortableTableScroll(columns)}
        pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE }}
        request={async (params) => {
          const res = await getGitOpsReleaseList(params);
          return toGitOpsTableResult(res.data);
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
        <ProFormText
          name="image_digest"
          label="镜像 Digest"
          fieldProps={{
            placeholder:
              'sha256:<64 位十六进制摘要>，开启签名要求的环境必须填写',
          }}
        />
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

      <ReleaseDetailDrawer
        loading={detailLoading}
        open={detailOpen}
        release={detailRelease}
        onClose={() => {
          setDetailOpen(false);
          setDetailRelease(undefined);
        }}
      />
    </PageContainer>
  );
};

export default GitOpsReleasePage;
