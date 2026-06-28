import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Tag } from 'antd';
import { useMemo } from 'react';
import { getGitOpsAuditList } from '@/services/kubeflare/gitops';
import {
  getComfortableTableScroll,
  withComfortableTableColumns,
} from '@/utils/table';
import { useGitOpsTableStyles } from '../components/tableStyles';
import { formatDateTimeText, toGitOpsTableResult } from '../utils';

const DEFAULT_PAGE_SIZE = 10;

const actionLabelMap: Record<string, string> = {
  approve: '审批',
  create: '创建',
  delete: '删除',
  fail: '失败标记',
  merge: 'MR 合并',
  open_mr: '创建 MR',
  reject: '拒绝',
  rollback: '回滚',
  submit: '提交',
  sync: '同步回流',
  test: '检测',
  update: '更新',
};

const actionColorMap: Record<string, string> = {
  approve: 'success',
  create: 'processing',
  delete: 'error',
  fail: 'error',
  merge: 'processing',
  open_mr: 'geekblue',
  reject: 'warning',
  rollback: 'warning',
  submit: 'processing',
  sync: 'success',
  test: 'default',
  update: 'blue',
};

const GitOpsAuditPage = () => {
  const { styles } = useGitOpsTableStyles();
  const columns = useMemo<ProColumns<API.GitOpsAudit>[]>(
    () =>
      withComfortableTableColumns([
        {
          title: '关键词',
          dataIndex: 'keyword',
          hideInTable: true,
          fieldProps: {
            placeholder: '搜索动作 / 资源 / 操作者 / 消息',
          },
        },
        {
          title: '动作',
          dataIndex: 'action',
          width: 110,
          render: (_, record) => (
            <Tag color={actionColorMap[record.action] || 'default'}>
              {actionLabelMap[record.action] || record.action}
            </Tag>
          ),
        },
        {
          title: '资源类型',
          dataIndex: 'resource_type',
          width: 140,
        },
        {
          title: '资源 ID',
          dataIndex: 'resource_id',
          ellipsis: true,
        },
        {
          title: '操作者',
          dataIndex: 'operator_id',
          width: 150,
        },
        {
          title: '结果',
          dataIndex: 'result',
          width: 100,
          renderText: (_, record) =>
            record.result === 'success' ? '成功' : record.result,
        },
        {
          title: '消息',
          dataIndex: 'message',
          ellipsis: true,
        },
        {
          title: '时间',
          dataIndex: 'created_at',
          width: 180,
          search: false,
          renderText: (value) => formatDateTimeText(value),
        },
      ]),
    [],
  );

  return (
    <PageContainer title="GitOps 审计">
      <ProTable<API.GitOpsAudit>
        rowKey="id"
        className={styles.table}
        columns={columns}
        scroll={getComfortableTableScroll(columns)}
        pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE }}
        request={async (params) => {
          const res = await getGitOpsAuditList(params);
          return toGitOpsTableResult(res.data);
        }}
      />
    </PageContainer>
  );
};

export default GitOpsAuditPage;
