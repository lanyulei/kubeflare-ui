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
    return normalizedStatus === 'active' ? '活跃' : '运行中';
  }
  if (normalizedStatus === 'suspended') {
    return '已暂停';
  }
  if (normalizedStatus === 'failed') {
    return '失败';
  }
  if (normalizedStatus === 'terminating') {
    return '删除中';
  }
  if (normalizedStatus === 'pending') {
    return '等待中';
  }
  if (normalizedStatus === 'containercreating') {
    return '容器创建中';
  }
  if (normalizedStatus === 'imagepullbackoff') {
    return '镜像拉取失败';
  }
  if (normalizedStatus === 'crashloopbackoff') {
    return '崩溃循环';
  }
  if (normalizedStatus === 'unknown') {
    return '未知';
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
  if (normalizedStatus === 'active') {
    return 'success';
  }
  if (normalizedStatus === 'running') {
    return 'success';
  }
  if (normalizedStatus === 'suspended') {
    return 'warning';
  }
  if (normalizedStatus === 'failed') {
    return 'error';
  }
  if (
    normalizedStatus === 'pending' ||
    normalizedStatus === 'containercreating' ||
    normalizedStatus === 'terminating'
  ) {
    return 'warning';
  }
  if (
    normalizedStatus === 'imagepullbackoff' ||
    normalizedStatus === 'crashloopbackoff' ||
    normalizedStatus === 'unknown'
  ) {
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
