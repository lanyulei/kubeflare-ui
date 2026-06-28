import { Tag } from 'antd';

export const RELEASE_STATUS_LABEL_MAP: Record<string, string> = {
  approved: '待创建 MR',
  draft: '草稿',
  failed: '失败',
  merge_pending: '待合并',
  rejected: '已拒绝',
  rolled_back: '已回滚',
  rolling_back: '回滚中',
  succeeded: '成功',
  syncing: '同步中',
  waiting_approval: '待审批',
};

export const RELEASE_STATUS_COLOR_MAP: Record<string, string> = {
  approved: 'processing',
  draft: 'default',
  failed: 'error',
  merge_pending: 'geekblue',
  rejected: 'default',
  rolled_back: 'warning',
  rolling_back: 'processing',
  succeeded: 'success',
  syncing: 'processing',
  waiting_approval: 'warning',
};

export const RELEASE_STATUS_OPTIONS = [
  { label: RELEASE_STATUS_LABEL_MAP.draft, value: 'draft' },
  {
    label: RELEASE_STATUS_LABEL_MAP.waiting_approval,
    value: 'waiting_approval',
  },
  { label: RELEASE_STATUS_LABEL_MAP.approved, value: 'approved' },
  { label: RELEASE_STATUS_LABEL_MAP.merge_pending, value: 'merge_pending' },
  { label: RELEASE_STATUS_LABEL_MAP.syncing, value: 'syncing' },
  { label: RELEASE_STATUS_LABEL_MAP.succeeded, value: 'succeeded' },
  { label: RELEASE_STATUS_LABEL_MAP.failed, value: 'failed' },
  { label: RELEASE_STATUS_LABEL_MAP.rejected, value: 'rejected' },
  { label: RELEASE_STATUS_LABEL_MAP.rolling_back, value: 'rolling_back' },
  { label: RELEASE_STATUS_LABEL_MAP.rolled_back, value: 'rolled_back' },
];

export const SYNC_STATUS_OPTIONS = [
  { label: '等待中', value: 'pending' },
  { label: '同步中', value: 'running' },
  { label: '成功', value: 'succeeded' },
  { label: '失败', value: 'failed' },
  { label: '漂移', value: 'drifted' },
];

export const POLICY_STATUS_OPTIONS = [
  { label: '已通过', value: 'passed' },
  { label: '告警', value: 'warning' },
  { label: '未通过', value: 'failed' },
];

export const EnvironmentTierTag = ({
  tier,
}: {
  tier?: API.GitOpsEnvironmentTier;
}) => {
  const colorMap: Record<string, string> = {
    dev: 'blue',
    production: 'red',
    staging: 'purple',
    test: 'cyan',
  };
  const labelMap: Record<string, string> = {
    dev: '开发',
    production: '生产',
    staging: '预发',
    test: '测试',
  };
  return <Tag color={colorMap[tier || '']}>{labelMap[tier || ''] || '-'}</Tag>;
};

export const EnabledStatusTag = ({ status }: { status?: number }) => (
  <Tag color={status === 0 ? 'default' : 'success'}>
    {status === 0 ? '停用' : '启用'}
  </Tag>
);

export const ReleaseStatusTag = ({
  status,
}: {
  status?: API.GitOpsReleaseStatus;
}) => {
  return (
    <Tag color={RELEASE_STATUS_COLOR_MAP[status || '']}>
      {RELEASE_STATUS_LABEL_MAP[status || ''] || '-'}
    </Tag>
  );
};

export const SyncStatusTag = ({
  status,
}: {
  status?: API.GitOpsSyncStatus;
}) => {
  const colorMap: Record<string, string> = {
    drifted: 'warning',
    failed: 'error',
    pending: 'default',
    running: 'processing',
    succeeded: 'success',
  };
  const labelMap: Record<string, string> = {
    drifted: '漂移',
    failed: '失败',
    pending: '等待中',
    running: '同步中',
    succeeded: '成功',
  };
  return (
    <Tag color={colorMap[status || '']}>{labelMap[status || ''] || '-'}</Tag>
  );
};

export const PolicyStatusTag = ({
  status,
}: {
  status?: API.GitOpsPolicyReport['status'];
}) => {
  const colorMap: Record<string, string> = {
    failed: 'error',
    passed: 'success',
    warning: 'warning',
  };
  const labelMap: Record<string, string> = {
    failed: '未通过',
    passed: '已通过',
    warning: '告警',
  };
  return (
    <Tag color={colorMap[status || '']}>{labelMap[status || ''] || '-'}</Tag>
  );
};
