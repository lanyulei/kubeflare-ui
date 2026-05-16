import dayjs from 'dayjs';

export const DEFAULT_RESOURCE_STATUS: API.ClusterNamespaceResourceStatus = {
  pods: 0,
  deployments: 0,
  statefulsets: 0,
  daemonsets: 0,
  jobs: 0,
  cronjobs: 0,
  persistentVolumeClaims: 0,
  services: 0,
  ingresses: 0,
};

export const DEFAULT_QUOTA_SUMMARY: API.ClusterNamespaceQuotaSummary = {
  defaultContainer: {},
  project: {
    cpuRequest: {},
    cpuLimit: {},
    memoryRequest: {},
    memoryLimit: {},
    storageRequest: {},
    storageLimit: {},
    pods: {},
    deployments: {},
    statefulsets: {},
    daemonsets: {},
    jobs: {},
    cronjobs: {},
    persistentVolumeClaims: {},
    services: {},
    ingresses: {},
    secrets: {},
    configMaps: {},
    storageClassQuotas: [],
  },
};

export const getNamespaceStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'active') {
    return '活跃';
  }
  if (normalizedStatus === 'terminating') {
    return '删除中';
  }
  return status || '-';
};

export const getNamespaceStatusType = (
  status?: string,
): 'default' | 'success' | 'warning' => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'active') {
    return 'success';
  }
  if (normalizedStatus === 'terminating') {
    return 'warning';
  }
  return 'default';
};

export const formatCreateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : value;
};

export const decodeNamespaceName = (name?: string) => {
  if (!name) {
    return '';
  }

  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

export const formatQuotaValue = (value?: string) => value || '无上限';

export const parseCpuQuantity = (value?: string) => {
  if (!value) {
    return undefined;
  }
  if (value.endsWith('m')) {
    return Number(value.replace('m', '')) / 1000;
  }
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

export const parseMemoryQuantity = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const matched = value.match(/^([\d.]+)(Ki|Mi|Gi|Ti|K|M|G|T)?$/);
  if (!matched) {
    return undefined;
  }

  const amount = Number(matched[1]);
  const unit = matched[2];
  const unitMap: Record<string, number> = {
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
    K: 1000,
    M: 1000 ** 2,
    G: 1000 ** 3,
    T: 1000 ** 4,
  };

  if (!Number.isFinite(amount)) {
    return undefined;
  }
  return amount * (unit ? unitMap[unit] : 1);
};

export const parseCountQuantity = (value?: string) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

export const getQuotaUsagePercent = (
  used?: string,
  hard?: string,
  parser: (value?: string) => number | undefined = parseCountQuantity,
) => {
  const usedValue = parser(used);
  const hardValue = parser(hard);

  if (!usedValue || !hardValue || hardValue <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((usedValue / hardValue) * 100));
};

export type DefaultContainerQuotaFormValues = {
  cpuRequest?: number | null;
  cpuLimit?: number | null;
  memoryRequest?: number | null;
  memoryLimit?: number | null;
};

export type ProjectQuotaFormValues = {
  cpuRequest?: number | null;
  cpuLimit?: number | null;
  memoryRequest?: number | null;
  memoryLimit?: number | null;
  storageRequest?: number | null;
  storageLimit?: number | null;
  storagePersistentVolumeClaims?: number | null;
  pods?: number | null;
  deployments?: number | null;
  statefulsets?: number | null;
  daemonsets?: number | null;
  jobs?: number | null;
  cronjobs?: number | null;
  persistentVolumeClaims?: number | null;
  services?: number | null;
  ingresses?: number | null;
  secrets?: number | null;
  configMaps?: number | null;
};

export type AppQuotaName =
  | 'pods'
  | 'deployments'
  | 'statefulsets'
  | 'daemonsets'
  | 'jobs'
  | 'cronjobs'
  | 'services'
  | 'ingresses'
  | 'secrets'
  | 'configMaps';

export type AppQuotaField = {
  label: string;
  name: AppQuotaName;
};

export type StorageClassQuotaRow = {
  id: string;
  storageClassName?: string;
  requestsStorage?: number | null;
  limitsStorage?: number | null;
  persistentVolumeClaims?: number | null;
  persistentVolumeClaimsUsed?: string;
};

export const APP_QUOTA_OPTIONS: AppQuotaField[] = [
  { label: '容器组数量', name: 'pods' },
  { label: '部署数量', name: 'deployments' },
  { label: '有状态副本集数量', name: 'statefulsets' },
  { label: '守护进程集数量', name: 'daemonsets' },
  { label: '任务数量', name: 'jobs' },
  { label: '定时任务数量', name: 'cronjobs' },
  { label: '服务数量', name: 'services' },
  { label: '应用路由数量', name: 'ingresses' },
  { label: '保密字典数量', name: 'secrets' },
  { label: '配置字典数量', name: 'configMaps' },
];

export const APP_QUOTA_OPTION_VALUES = APP_QUOTA_OPTIONS.map(
  (option) => option.name,
);
export const DEFAULT_APP_QUOTA_OPTION = APP_QUOTA_OPTIONS[0]?.name;

export const normalizeNumberValue = (value?: number | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
};

export const normalizeMemoryMiValue = (value?: number | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return `${value}Mi`;
};

export const normalizeMemoryGiValue = (value?: number | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return `${value}Gi`;
};

export const getCpuFormValue = (value?: string) => parseCpuQuantity(value);

export const getMemoryMiFormValue = (value?: string) => {
  const bytes = parseMemoryQuantity(value);

  if (!bytes) {
    return undefined;
  }

  return Math.round(bytes / 1024 ** 2);
};

export const getMemoryGiFormValue = (value?: string) => {
  const bytes = parseMemoryQuantity(value);

  if (!bytes) {
    return undefined;
  }

  return Number((bytes / 1024 ** 3).toFixed(2));
};
