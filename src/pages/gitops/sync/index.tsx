import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Space, Typography } from 'antd';
import { useMemo } from 'react';
import {
  getGitOpsPolicyReportList,
  getGitOpsSyncList,
} from '@/services/kubeflare/gitops';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import {
  POLICY_STATUS_OPTIONS,
  PolicyStatusTag,
  SYNC_STATUS_OPTIONS,
  SyncStatusTag,
} from '../components/status';
import { useGitOpsTableStyles } from '../components/tableStyles';
import {
  useGitOpsApplicationOptions,
  useGitOpsEnvironmentOptions,
} from '../hooks/useGitOpsOptions';
import { formatDateTimeText, toGitOpsTableResult } from '../utils';

const DEFAULT_PAGE_SIZE = 10;

const GitOpsSyncPage = () => {
  const { styles } = useGitOpsTableStyles();
  const { loading: applicationLoading, options: applicationOptions } =
    useGitOpsApplicationOptions();
  const { loading: environmentLoading, options: environmentOptions } =
    useGitOpsEnvironmentOptions();

  const syncColumns = useMemo<ProColumns<API.GitOpsSyncRecord>[]>(
    () =>
      withComfortableTableColumns([
        {
          title: '关键词',
          dataIndex: 'keyword',
          hideInTable: true,
          fieldProps: {
            placeholder: '搜索资源 / revision / 消息',
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
          title: '资源',
          dataIndex: 'resource_name',
          ellipsis: true,
          renderText: (_, record) =>
            record.resource_name || record.release_id || record.id,
        },
        {
          title: '命名空间',
          dataIndex: 'resource_namespace',
          width: 140,
        },
        {
          title: '状态',
          dataIndex: 'status',
          valueType: 'select',
          width: 110,
          fieldProps: {
            allowClear: true,
            options: SYNC_STATUS_OPTIONS,
          },
          render: (_, record) => <SyncStatusTag status={record.status} />,
        },
        {
          title: 'Revision',
          dataIndex: 'revision',
          ellipsis: true,
        },
        {
          title: '漂移',
          dataIndex: 'drifted',
          width: 90,
          renderText: (_, record) => (record.drifted ? '是' : '否'),
        },
        {
          title: '消息',
          dataIndex: 'message',
          ellipsis: true,
        },
        {
          title: '更新时间',
          dataIndex: 'updated_at',
          width: 180,
          renderText: (value) => formatDateTimeText(value),
        },
      ]),
    [
      applicationLoading,
      applicationOptions,
      environmentLoading,
      environmentOptions,
    ],
  );

  const policyColumns = useMemo<ProColumns<API.GitOpsPolicyReport>[]>(
    () =>
      withComfortableTableColumns([
        {
          title: '工具',
          dataIndex: 'tool',
          width: 160,
        },
        {
          title: '状态',
          dataIndex: 'status',
          valueType: 'select',
          width: 110,
          fieldProps: {
            allowClear: true,
            options: POLICY_STATUS_OPTIONS,
          },
          render: (_, record) => <PolicyStatusTag status={record.status} />,
        },
        {
          title: '违规数',
          dataIndex: 'violation_count',
          width: 100,
          search: false,
        },
        {
          title: '摘要',
          dataIndex: 'summary',
          ellipsis: true,
          search: false,
        },
        {
          title: '创建时间',
          dataIndex: 'created_at',
          width: 180,
          search: false,
          renderText: (value) => formatDateTimeText(value),
        },
      ]),
    [],
  );

  return (
    <PageContainer title="GitOps 同步">
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={5}>同步记录</Typography.Title>
          <ProTable<API.GitOpsSyncRecord>
            rowKey="id"
            className={styles.table}
            columns={syncColumns}
            scroll={getComfortableTableScroll(syncColumns)}
            pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE }}
            request={async (params) => {
              const res = await getGitOpsSyncList(params);
              return toGitOpsTableResult(res.data);
            }}
          />
        </div>
        <div>
          <Typography.Title level={5}>策略报告</Typography.Title>
          <ProTable<API.GitOpsPolicyReport>
            rowKey="id"
            className={styles.table}
            columns={policyColumns}
            scroll={getComfortableTableScroll(policyColumns)}
            pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE }}
            request={async (params) => {
              const res = await getGitOpsPolicyReportList(params);
              return toGitOpsTableResult(res.data);
            }}
          />
        </div>
      </Space>
    </PageContainer>
  );
};

export default GitOpsSyncPage;
