const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getArrayValue = (value: unknown) =>
  Array.isArray(value) ? (value as unknown[]) : [];

const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

const getNumberValue = (value: unknown) =>
  typeof value === 'number' ? value : undefined;

const formatValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
};

const getJobStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'completed' || normalizedStatus === 'succeeded') {
    return '已完成';
  }
  if (normalizedStatus === 'running' || normalizedStatus === 'active') {
    return '运行中';
  }
  if (normalizedStatus === 'failed') {
    return '失败';
  }
  if (normalizedStatus === 'terminating') {
    return '删除中';
  }
  return status || '-';
};

const getJobStatusType = (
  status?: string,
): 'default' | 'error' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'completed' || normalizedStatus === 'succeeded') {
    return 'success';
  }
  if (normalizedStatus === 'running' || normalizedStatus === 'active') {
    return 'warning';
  }
  if (normalizedStatus === 'failed') {
    return 'error';
  }
  return 'default';
};

export {
  formatValue,
  getArrayValue,
  getJobStatusLabel,
  getJobStatusType,
  getNumberValue,
  getRecordValue,
  getStringValue,
};
