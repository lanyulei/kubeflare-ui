import { Tag } from 'antd';

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
  const colorMap: Record<string, string> = {
    draft: 'default',
    failed: 'error',
    rejected: 'default',
    rolled_back: 'warning',
    succeeded: 'success',
    syncing: 'processing',
    waiting_approval: 'warning',
  };
  const labelMap: Record<string, string> = {
    draft: '草稿',
    failed: '失败',
    rejected: '已拒绝',
    rolled_back: '已回滚',
    succeeded: '成功',
    syncing: '同步中',
    waiting_approval: '待审批',
  };
  return (
    <Tag color={colorMap[status || '']}>{labelMap[status || ''] || '-'}</Tag>
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
