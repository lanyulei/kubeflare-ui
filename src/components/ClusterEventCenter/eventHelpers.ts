import dayjs from 'dayjs';

const workloadKinds = new Set(['Deployment', 'StatefulSet', 'DaemonSet']);

const namespacedResourceKinds = new Set<API.ClusterResourceCreateType>([
  'Job',
  'CronJob',
  'Pod',
  'Service',
  'Ingress',
  'Secret',
  'ConfigMap',
  'ServiceAccount',
  'PersistentVolumeClaim',
]);

const resourceKindLabels: Record<string, string> = {
  ConfigMap: '配置字典',
  CronJob: '定时任务',
  DaemonSet: '守护进程集',
  Deployment: '无状态工作负载',
  Ingress: '应用路由',
  Job: '任务',
  Node: '节点',
  PersistentVolumeClaim: '持久卷声明',
  Pod: '容器组',
  Secret: '保密字典',
  Service: '服务',
  ServiceAccount: '服务账户',
  StatefulSet: '有状态工作负载',
};

const formatRelativeTime = (value?: string) => {
  if (!value) {
    return '-';
  }

  const time = dayjs(value);
  if (!time.isValid()) {
    return value;
  }

  const diffSeconds = Math.max(0, dayjs().diff(time, 'second'));
  const diffDays = Math.floor(diffSeconds / 86400);
  if (diffDays > 0) {
    return `${diffDays} 天前`;
  }
  const diffHours = Math.floor(diffSeconds / 3600);
  if (diffHours > 0) {
    return `${diffHours} 小时前`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes > 0) {
    return `${diffMinutes} 分钟前`;
  }
  return '刚刚';
};

const getEventTypeLabel = (type?: string) => {
  const normalizedType = type?.toLowerCase();

  if (normalizedType === 'normal') {
    return '正常';
  }
  if (normalizedType === 'warning') {
    return '警告';
  }
  return type || '-';
};

const getEventObjectText = (ref?: API.ClusterEventObjectRef) => {
  if (!ref?.kind && !ref?.name) {
    return '-';
  }

  return `${resourceKindLabels[ref.kind || ''] || ref.kind || '-'} / ${
    ref.name || '-'
  }`;
};

const getEventObjectDetailPath = (ref?: API.ClusterEventObjectRef) => {
  if (!ref?.kind || !ref?.name) {
    return undefined;
  }
  if (ref.kind === 'Node') {
    return `/cluster/node/detail/${encodeURIComponent(ref.name)}`;
  }
  if (workloadKinds.has(ref.kind) && ref.namespace) {
    return `/cluster/workloads/detail/${encodeURIComponent(
      ref.kind,
    )}/${encodeURIComponent(ref.namespace)}/${encodeURIComponent(ref.name)}`;
  }
  if (
    namespacedResourceKinds.has(ref.kind as API.ClusterResourceCreateType) &&
    ref.namespace
  ) {
    return `/cluster/resource/detail/${encodeURIComponent(
      ref.kind,
    )}/${encodeURIComponent(ref.namespace)}/${encodeURIComponent(ref.name)}`;
  }

  return undefined;
};

const getEventMessage = (event?: API.ClusterEventItem) =>
  event?.note || event?.message || '-';

const getEventItemKey = (event: API.ClusterEventItem) =>
  event.uid ||
  event.id ||
  `${event.namespace || '-'}-${event.regarding?.kind || '-'}-${
    event.regarding?.name || '-'
  }-${event.reason || '-'}-${event.event_time || '-'}`;

const sortEventsByTime = (items: API.ClusterEventItem[]) =>
  [...items].sort((first, second) => {
    const firstTime = dayjs(first.event_time).valueOf() || 0;
    const secondTime = dayjs(second.event_time).valueOf() || 0;
    return secondTime - firstTime;
  });

const mergeEventItems = (
  currentItems: API.ClusterEventItem[],
  incoming: API.ClusterEventItem,
) => {
  const key = getEventItemKey(incoming);
  const nextItems = currentItems.filter(
    (item) => getEventItemKey(item) !== key,
  );
  return sortEventsByTime([incoming, ...nextItems]).slice(0, 1000);
};

const getWarningCount = (items: API.ClusterEventItem[]) =>
  items.filter((item) => item.type?.toLowerCase() === 'warning').length;

const getNormalCount = (items: API.ClusterEventItem[]) =>
  items.filter((item) => item.type?.toLowerCase() === 'normal').length;

export {
  formatRelativeTime,
  getEventItemKey,
  getEventMessage,
  getEventObjectDetailPath,
  getEventObjectText,
  getEventTypeLabel,
  getNormalCount,
  getWarningCount,
  mergeEventItems,
  resourceKindLabels,
  sortEventsByTime,
};
