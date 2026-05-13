import {
  ApartmentOutlined,
  ApiOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DeploymentUnitOutlined,
  DownOutlined,
  EditOutlined,
  FieldTimeOutlined,
  HddOutlined,
  PlaySquareOutlined,
} from '@ant-design/icons';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useIntl, useParams } from '@umijs/max';
import {
  App,
  Button,
  Card,
  Dropdown,
  Empty,
  Form,
  Modal,
  Spin,
  Tabs,
} from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClusterMetadata,
  ClusterPodList,
  ComputeQuotaFields,
  KeyValueEditor,
  SectionTitle,
  SelectValueEditor,
} from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type { SelectValueEditorItem } from '@/components/SelectValueEditor';
import {
  deleteClusterNamespace,
  getClusterNamespaceDetail,
  getClusterNamespacePodList,
  getClusterNamespaceQuotaSummary,
  getClusterNamespaceResourceStatus,
  updateClusterNamespaceAnnotations,
  updateClusterNamespaceDefaultContainerQuota,
  updateClusterNamespaceProjectQuota,
} from '@/services/kubeflare/cluster/namespace';

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorder}80`,
    borderRadius: token.borderRadiusLG,
    padding: 20,
  },
  moreInfo: {
    marginTop: 15,
  },
  moreInfoCard: {
    borderColor: `${token.colorBorder}80`,

    '.ant-card-body': {
      paddingTop: 2,
    },
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  statusDotDefault: {
    backgroundColor: token.colorTextQuaternary,
  },
  statusDotSuccess: {
    backgroundColor: token.colorSuccess,
  },
  statusDotWarning: {
    backgroundColor: token.colorWarning,
  },
  overview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorBgContainer,
    overflow: 'hidden',

    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  resourceItem: {
    display: 'grid',
    gridTemplateColumns: '52px 1fr',
    alignItems: 'center',
    minHeight: 62,
    backgroundColor: token.colorFillQuaternary,
    transition: `background-color ${token.motionDurationMid}`,

    '&:hover': {
      backgroundColor: token.colorFillSecondary,
    },
  },
  resourceIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#34465a',
    fontSize: 24,
  },
  resourceContent: {
    minWidth: 0,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
  },
  resourceCount: {
    color: token.colorText,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.4,
  },
  resourceCountActive: {
    color: token.colorSuccess,
  },
  resourceLabel: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resourceSpin: {
    '.ant-spin-container': {
      minHeight: 0,
    },
  },
  quotaPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  defaultQuota: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginLG,
    padding: `8px 5px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  defaultQuotaGroup: {
    display: 'grid',
    gridTemplateColumns: '52px 1fr 1fr',
    alignItems: 'center',
    minHeight: 48,
  },
  quotaIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#34465a',
    fontSize: 26,
  },
  quotaMetric: {
    minWidth: 0,
  },
  quotaMetricValue: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  quotaMetricLabel: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  projectQuota: {
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorFillQuaternary,
  },
  projectQuotaItem: {
    display: 'grid',
    gridTemplateColumns: '64px 180px 180px 180px 1fr',
    alignItems: 'center',
    minHeight: 70,
    padding: `0 ${token.padding}px 0 0`,
    transition: `background-color ${token.motionDurationMid}`,

    '&:hover': {
      backgroundColor: token.colorFillSecondary,
    },

    '@media (max-width: 1200px)': {
      gridTemplateColumns: '56px 1fr 1fr',
      rowGap: token.marginSM,
      padding: `${token.paddingSM}px ${token.padding}px`,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '48px 1fr',
    },
  },
  quotaUsage: {
    minWidth: 0,

    '@media (max-width: 1200px)': {
      gridColumn: '2 / 4',
    },

    '@media (max-width: 768px)': {
      gridColumn: '2 / 3',
    },
  },
  usageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: token.marginSM,
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  usageTitle: {
    color: token.colorText,
    fontSize: 14,
    // fontWeight: 600,
  },
  usageBar: {
    position: 'relative',
    height: 18,
    marginTop: 4,
    overflow: 'hidden',
    borderRadius: 0,
    backgroundColor: token.colorFillSecondary,
  },
  usageBarInner: {
    height: '100%',
    backgroundColor: token.colorPrimary,
  },
  usageLimit: {
    position: 'absolute',
    top: 0,
    right: token.paddingSM,
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: '18px',
  },
  quotaForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    padding: `${token.paddingXS}px 0`,
  },
  quotaFormSectionTitle: {
    color: token.colorText,
    fontWeight: 500,
    lineHeight: token.lineHeight,
    marginTop: token.marginXS,

    '&:first-child': {
      marginTop: 0,
    },
  },
}));

const DEFAULT_RESOURCE_STATUS: API.ClusterNamespaceResourceStatus = {
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

const DEFAULT_QUOTA_SUMMARY: API.ClusterNamespaceQuotaSummary = {
  defaultContainer: {},
  project: {
    cpuRequest: {},
    cpuLimit: {},
    memoryRequest: {},
    memoryLimit: {},
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
  },
};

const getNamespaceStatusLabel = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  if (normalizedStatus === 'active') {
    return '运行中';
  }
  if (normalizedStatus === 'terminating') {
    return '删除中';
  }
  return status || '-';
};

const getNamespaceStatusType = (
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

const formatCreateTime = (value?: string) => {
  if (!value) {
    return '-';
  }
  const time = dayjs(value);
  return time.isValid() ? time.format('YYYY-MM-DD HH:mm:ss') : value;
};

const decodeNamespaceName = (name?: string) => {
  if (!name) {
    return '';
  }

  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

const formatQuotaValue = (value?: string) => value || '无上限';

const parseCpuQuantity = (value?: string) => {
  if (!value) {
    return undefined;
  }
  if (value.endsWith('m')) {
    return Number(value.replace('m', '')) / 1000;
  }
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

const parseMemoryQuantity = (value?: string) => {
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

const parseCountQuantity = (value?: string) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
};

const getQuotaUsagePercent = (
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

type DefaultContainerQuotaFormValues = {
  cpuRequest?: number | null;
  cpuLimit?: number | null;
  memoryRequest?: number | null;
  memoryLimit?: number | null;
};

type ProjectQuotaFormValues = {
  cpuRequest?: number | null;
  cpuLimit?: number | null;
  memoryRequest?: number | null;
  memoryLimit?: number | null;
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

type AppQuotaField = {
  label: string;
  name: keyof ProjectQuotaFormValues;
};

const APP_QUOTA_OPTIONS: AppQuotaField[] = [
  { label: '容器组数量', name: 'pods' },
  { label: '部署数量', name: 'deployments' },
  { label: '有状态副本集数量', name: 'statefulsets' },
  { label: '守护进程集数量', name: 'daemonsets' },
  { label: '任务数量', name: 'jobs' },
  { label: '定时任务数量', name: 'cronjobs' },
  { label: '持久卷声明数量', name: 'persistentVolumeClaims' },
  { label: '服务数量', name: 'services' },
  { label: '应用路由数量', name: 'ingresses' },
  { label: '保密字典数量', name: 'secrets' },
  { label: '配置字典数量', name: 'configMaps' },
];

const APP_QUOTA_OPTION_VALUES = APP_QUOTA_OPTIONS.map((option) => option.name);

const normalizeNumberValue = (value?: number | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
};

const normalizeMemoryMiValue = (value?: number | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return `${value}Mi`;
};

const normalizeMemoryGiValue = (value?: number | null) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return `${value}Gi`;
};

const getCpuFormValue = (value?: string) => parseCpuQuantity(value);

const getMemoryMiFormValue = (value?: string) => {
  const bytes = parseMemoryQuantity(value);

  if (!bytes) {
    return undefined;
  }

  return Math.round(bytes / 1024 ** 2);
};

const getMemoryGiFormValue = (value?: string) => {
  const bytes = parseMemoryQuantity(value);

  if (!bytes) {
    return undefined;
  }

  return Number((bytes / 1024 ** 3).toFixed(2));
};

const NamespaceDetail = () => {
  const intl = useIntl();
  const params = useParams<{ name?: string }>();
  const { message, modal } = App.useApp();
  const { styles } = useStyles();
  const [defaultContainerQuotaForm] =
    Form.useForm<DefaultContainerQuotaFormValues>();
  const [projectQuotaForm] = Form.useForm<ProjectQuotaFormValues>();
  const annotationRowIdRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [namespace, setNamespace] = useState<API.ClusterNamespaceItem>();
  const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
  const [annotationSaving, setAnnotationSaving] = useState(false);
  const [annotationRows, setAnnotationRows] = useState<KeyValueEditorItem[]>(
    [],
  );
  const [appQuotaRows, setAppQuotaRows] = useState<SelectValueEditorItem[]>([]);
  const [podLoading, setPodLoading] = useState(false);
  const [pods, setPods] = useState<API.ClusterNodePodItem[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceStatus, setResourceStatus] =
    useState<API.ClusterNamespaceResourceStatus>(DEFAULT_RESOURCE_STATUS);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaSummary, setQuotaSummary] =
    useState<API.ClusterNamespaceQuotaSummary>(DEFAULT_QUOTA_SUMMARY);
  const [defaultContainerQuotaModalOpen, setDefaultContainerQuotaModalOpen] =
    useState(false);
  const [defaultContainerQuotaSaving, setDefaultContainerQuotaSaving] =
    useState(false);
  const [projectQuotaModalOpen, setProjectQuotaModalOpen] = useState(false);
  const [projectQuotaSaving, setProjectQuotaSaving] = useState(false);
  const appQuotaRowIdRef = useRef(0);
  const namespaceName = useMemo(
    () => decodeNamespaceName(params.name),
    [params.name],
  );
  const statusDotClassNames = {
    default: styles.statusDotDefault,
    success: styles.statusDotSuccess,
    warning: styles.statusDotWarning,
  };
  const createAnnotationRow = useCallback((keyName = '', value = '') => {
    const nextId = annotationRowIdRef.current;
    annotationRowIdRef.current += 1;

    return {
      id: `annotation-${nextId}`,
      keyName,
      value,
    };
  }, []);
  const createAppQuotaRow = useCallback(
    (keyName?: string, value?: number | null) => {
      const nextId = appQuotaRowIdRef.current;
      appQuotaRowIdRef.current += 1;

      return {
        id: `app-quota-${nextId}`,
        keyName,
        value,
      };
    },
    [],
  );

  const fetchNamespace = useCallback(async () => {
    if (!namespaceName) {
      setNamespace(undefined);
      return;
    }

    setLoading(true);
    try {
      const res = await getClusterNamespaceDetail(namespaceName);
      setNamespace(res.data);
    } finally {
      setLoading(false);
    }
  }, [namespaceName]);

  const fetchPods = useCallback(async () => {
    if (!namespaceName) {
      setPods([]);
      return;
    }

    setPodLoading(true);
    try {
      const res = await getClusterNamespacePodList({
        namespace: namespaceName,
      });
      setPods(res.data.items || []);
    } finally {
      setPodLoading(false);
    }
  }, [namespaceName]);

  const fetchResourceStatus = useCallback(async () => {
    if (!namespaceName) {
      setResourceStatus(DEFAULT_RESOURCE_STATUS);
      return;
    }

    setResourceLoading(true);
    try {
      const res = await getClusterNamespaceResourceStatus(namespaceName);
      setResourceStatus(res.data);
    } finally {
      setResourceLoading(false);
    }
  }, [namespaceName]);

  const fetchQuotaSummary = useCallback(async () => {
    if (!namespaceName) {
      setQuotaSummary(DEFAULT_QUOTA_SUMMARY);
      return;
    }

    setQuotaLoading(true);
    try {
      const res = await getClusterNamespaceQuotaSummary(namespaceName);
      setQuotaSummary(res.data);
    } finally {
      setQuotaLoading(false);
    }
  }, [namespaceName]);

  useEffect(() => {
    fetchNamespace();
  }, [fetchNamespace]);

  useEffect(() => {
    fetchPods();
  }, [fetchPods]);

  useEffect(() => {
    fetchResourceStatus();
  }, [fetchResourceStatus]);

  useEffect(() => {
    fetchQuotaSummary();
  }, [fetchQuotaSummary]);

  const openAnnotationModal = () => {
    const rows = Object.entries(namespace?.annotations || {}).map(
      ([keyName, value]) => createAnnotationRow(keyName, value),
    );

    setAnnotationRows(rows);
    setAnnotationModalOpen(true);
  };
  const handleSaveAnnotations = async () => {
    if (!namespaceName) {
      return;
    }

    const nextAnnotations: Record<string, string> = {};
    const annotationKeys = new Set<string>();

    for (const row of annotationRows) {
      const keyName = row.keyName.trim();

      if (!keyName) {
        message.warning('注解 Key 不能为空');
        return;
      }
      if (annotationKeys.has(keyName)) {
        message.warning('注解 Key 不能重复');
        return;
      }

      annotationKeys.add(keyName);
      nextAnnotations[keyName] = row.value.trim();
    }

    const annotationsPatch: Record<string, string | null> = {};
    Object.keys(namespace?.annotations || {}).forEach((keyName) => {
      if (!annotationKeys.has(keyName)) {
        annotationsPatch[keyName] = null;
      }
    });
    Object.entries(nextAnnotations).forEach(([keyName, value]) => {
      annotationsPatch[keyName] = value;
    });

    setAnnotationSaving(true);
    try {
      await updateClusterNamespaceAnnotations(namespaceName, {
        annotations: annotationsPatch,
      });
      message.success('命名空间注解已更新');
      setAnnotationModalOpen(false);
      await fetchNamespace();
    } finally {
      setAnnotationSaving(false);
    }
  };
  const openDefaultContainerQuotaModal = () => {
    defaultContainerQuotaForm.setFieldsValue({
      cpuRequest: getCpuFormValue(quotaSummary.defaultContainer.cpuRequest),
      cpuLimit: getCpuFormValue(quotaSummary.defaultContainer.cpuLimit),
      memoryRequest: getMemoryMiFormValue(
        quotaSummary.defaultContainer.memoryRequest,
      ),
      memoryLimit: getMemoryMiFormValue(
        quotaSummary.defaultContainer.memoryLimit,
      ),
    });
    setDefaultContainerQuotaModalOpen(true);
  };
  const handleSaveDefaultContainerQuota = async () => {
    if (!namespaceName) {
      return;
    }

    const values = await defaultContainerQuotaForm.validateFields();

    setDefaultContainerQuotaSaving(true);
    try {
      await updateClusterNamespaceDefaultContainerQuota(namespaceName, {
        cpuRequest: normalizeNumberValue(values.cpuRequest),
        cpuLimit: normalizeNumberValue(values.cpuLimit),
        memoryRequest: normalizeMemoryMiValue(values.memoryRequest),
        memoryLimit: normalizeMemoryMiValue(values.memoryLimit),
      });
      message.success('默认容器配额已更新');
      setDefaultContainerQuotaModalOpen(false);
      await fetchQuotaSummary();
    } finally {
      setDefaultContainerQuotaSaving(false);
    }
  };
  const openProjectQuotaModal = () => {
    projectQuotaForm.setFieldsValue({
      cpuRequest: getCpuFormValue(quotaSummary.project.cpuRequest.hard),
      cpuLimit: getCpuFormValue(quotaSummary.project.cpuLimit.hard),
      memoryRequest: getMemoryGiFormValue(
        quotaSummary.project.memoryRequest.hard,
      ),
      memoryLimit: getMemoryGiFormValue(quotaSummary.project.memoryLimit.hard),
    });
    setAppQuotaRows(
      APP_QUOTA_OPTIONS.flatMap((option) => {
        const value = parseCountQuantity(
          quotaSummary.project[option.name].hard,
        );

        return value === undefined
          ? []
          : [createAppQuotaRow(option.name, value)];
      }),
    );
    setProjectQuotaModalOpen(true);
  };
  const handleSaveProjectQuota = async () => {
    if (!namespaceName) {
      return;
    }

    const values = await projectQuotaForm.validateFields();
    const appQuotaValues: Partial<
      Record<keyof ProjectQuotaFormValues, number>
    > = {};
    const appQuotaKeys = new Set<string>();

    for (const row of appQuotaRows) {
      if (!row.keyName) {
        message.warning('请选择应用资源类型');
        return;
      }
      if (appQuotaKeys.has(row.keyName)) {
        message.warning('应用资源类型不能重复');
        return;
      }
      if (row.value === undefined || row.value === null) {
        message.warning('请输入应用资源配额数量');
        return;
      }

      appQuotaKeys.add(row.keyName);
      appQuotaValues[row.keyName as keyof ProjectQuotaFormValues] = row.value;
    }

    setProjectQuotaSaving(true);
    try {
      await updateClusterNamespaceProjectQuota(namespaceName, {
        cpuRequest: normalizeNumberValue(values.cpuRequest),
        cpuLimit: normalizeNumberValue(values.cpuLimit),
        memoryRequest: normalizeMemoryGiValue(values.memoryRequest),
        memoryLimit: normalizeMemoryGiValue(values.memoryLimit),
        pods: normalizeNumberValue(appQuotaValues.pods),
        deployments: normalizeNumberValue(appQuotaValues.deployments),
        statefulsets: normalizeNumberValue(appQuotaValues.statefulsets),
        daemonsets: normalizeNumberValue(appQuotaValues.daemonsets),
        jobs: normalizeNumberValue(appQuotaValues.jobs),
        cronjobs: normalizeNumberValue(appQuotaValues.cronjobs),
        persistentVolumeClaims: normalizeNumberValue(
          appQuotaValues.persistentVolumeClaims,
        ),
        services: normalizeNumberValue(appQuotaValues.services),
        ingresses: normalizeNumberValue(appQuotaValues.ingresses),
        secrets: normalizeNumberValue(appQuotaValues.secrets),
        configMaps: normalizeNumberValue(appQuotaValues.configMaps),
      });
      message.success('项目配额已更新');
      setProjectQuotaModalOpen(false);
      await fetchQuotaSummary();
    } finally {
      setProjectQuotaSaving(false);
    }
  };

  const resourceStatusItems = [
    {
      key: 'pods',
      label: '容器组',
      value: resourceStatus.pods,
      icon: <ClusterOutlined />,
    },
    {
      key: 'deployments',
      label: '部署',
      value: resourceStatus.deployments,
      icon: <DeploymentUnitOutlined />,
      active: resourceStatus.deployments > 0,
    },
    {
      key: 'statefulsets',
      label: '有状态副本集',
      value: resourceStatus.statefulsets,
      icon: <PlaySquareOutlined />,
    },
    {
      key: 'daemonsets',
      label: '守护进程集',
      value: resourceStatus.daemonsets,
      icon: <ApartmentOutlined />,
    },
    {
      key: 'jobs',
      label: '任务',
      value: resourceStatus.jobs,
      icon: <AppstoreOutlined />,
    },
    {
      key: 'cronjobs',
      label: '定时任务',
      value: resourceStatus.cronjobs,
      icon: <FieldTimeOutlined />,
    },
    {
      key: 'persistentVolumeClaims',
      label: '持久卷声明',
      value: resourceStatus.persistentVolumeClaims,
      icon: <HddOutlined />,
    },
    {
      key: 'services',
      label: '服务',
      value: resourceStatus.services,
      icon: <DatabaseOutlined />,
    },
    {
      key: 'ingresses',
      label: '应用路由',
      value: resourceStatus.ingresses,
      icon: <ApiOutlined />,
    },
  ];
  const defaultQuotaItems = [
    {
      key: 'cpu',
      icon: <DatabaseOutlined />,
      request: quotaSummary.defaultContainer.cpuRequest,
      requestLabel: 'CPU 预留',
      limit: quotaSummary.defaultContainer.cpuLimit,
      limitLabel: 'CPU 限制',
    },
    {
      key: 'memory',
      icon: <HddOutlined />,
      request: quotaSummary.defaultContainer.memoryRequest,
      requestLabel: '内存预留',
      limit: quotaSummary.defaultContainer.memoryLimit,
      limitLabel: '内存上限',
    },
  ];
  const projectQuotaItems = [
    {
      key: 'cpuLimit',
      icon: <DatabaseOutlined />,
      title: 'CPU 上限',
      quota: quotaSummary.project.cpuLimit,
      parser: parseCpuQuantity,
    },
    {
      key: 'memoryLimit',
      icon: <HddOutlined />,
      title: '内存上限',
      quota: quotaSummary.project.memoryLimit,
      parser: parseMemoryQuantity,
    },
    {
      key: 'pods',
      icon: <ClusterOutlined />,
      title: '容器组',
      quota: quotaSummary.project.pods,
    },
    {
      key: 'deployments',
      icon: <DeploymentUnitOutlined />,
      title: '部署',
      quota: quotaSummary.project.deployments,
    },
    {
      key: 'persistentVolumeClaims',
      icon: <HddOutlined />,
      title: '持久卷声明',
      quota: quotaSummary.project.persistentVolumeClaims,
    },
  ];

  const title = namespaceName
    ? intl.formatMessage(
        {
          id: 'pages.cluster.namespaces.detail.title',
          defaultMessage: '命名空间详情：{name}',
        },
        { name: namespaceName },
      )
    : intl.formatMessage({
        id: 'pages.cluster.namespaces.detail',
        defaultMessage: '命名空间详情',
      });
  const namespaceActionItems = [
    {
      key: 'editAnnotations',
      icon: <EditOutlined />,
      label: '编辑注解',
    },
    {
      key: 'editQuota',
      icon: <DatabaseOutlined />,
      label: '编辑配额',
    },
    {
      key: 'editDefaultContainerQuota',
      icon: <HddOutlined />,
      label: '编辑默认容器配额',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: intl.formatMessage({
        id: 'pages.cluster.namespaces.delete',
        defaultMessage: '删除',
      }),
      danger: true,
    },
  ];
  const handleDeleteNamespace = () => {
    if (!namespaceName) {
      return;
    }

    modal.confirm({
      title: intl.formatMessage({
        id: 'pages.cluster.namespaces.delete.confirm',
        defaultMessage: '确认删除该命名空间吗？',
      }),
      okText: intl.formatMessage({
        id: 'pages.cluster.namespaces.delete',
        defaultMessage: '删除',
      }),
      okButtonProps: {
        danger: true,
      },
      cancelText: '取消',
      onOk: async () => {
        await deleteClusterNamespace(namespaceName);
        message.success(
          intl.formatMessage({
            id: 'pages.cluster.namespaces.delete.success',
            defaultMessage: '命名空间已删除',
          }),
        );
        history.push('/cluster/namespaces');
      },
    });
  };
  const handleActionMenuClick = ({ key }: { key: string }) => {
    if (key === 'delete') {
      handleDeleteNamespace();
      return;
    }
    if (key === 'editAnnotations') {
      openAnnotationModal();
      return;
    }
    if (key === 'editQuota') {
      openProjectQuotaModal();
      return;
    }
    if (key === 'editDefaultContainerQuota') {
      openDefaultContainerQuotaModal();
      return;
    }

    message.info('该操作暂未开放');
  };

  return (
    <PageContainer
      title={title}
      onBack={() => history.back()}
      extra={[
        <Dropdown
          disabled={!namespace}
          key="namespace-actions"
          menu={{
            items: namespaceActionItems,
            onClick: handleActionMenuClick,
          }}
          trigger={['click']}
        >
          <Button disabled={!namespace}>
            操作
            <DownOutlined />
          </Button>
        </Dropdown>,
      ]}
    >
      <div>
        <SectionTitle>基本信息</SectionTitle>
        <div className={styles.content}>
          <Spin spinning={loading}>
            {namespaceName ? (
              <ProDescriptions<API.ClusterNamespaceItem>
                column={2}
                dataSource={namespace}
                columns={[
                  {
                    title: intl.formatMessage({
                      id: 'pages.cluster.namespaces.name',
                      defaultMessage: '名称',
                    }),
                    dataIndex: 'name',
                    renderText: (_, record) => record.name || namespaceName,
                  },
                  {
                    title: intl.formatMessage({
                      id: 'pages.cluster.namespaces.status',
                      defaultMessage: '状态',
                    }),
                    dataIndex: 'status',
                    render: (_, record) => {
                      const statusType = getNamespaceStatusType(record.status);

                      return (
                        <span className={styles.status}>
                          <span
                            className={[
                              styles.statusDot,
                              statusDotClassNames[statusType],
                            ].join(' ')}
                          />
                          <span>{getNamespaceStatusLabel(record.status)}</span>
                        </span>
                      );
                    },
                  },
                  {
                    title: intl.formatMessage({
                      id: 'pages.cluster.namespaces.uid',
                      defaultMessage: 'UID',
                    }),
                    dataIndex: 'id',
                    copyable: true,
                    renderText: (value) => value || '-',
                  },
                  {
                    title: intl.formatMessage({
                      id: 'pages.cluster.namespaces.createdAt',
                      defaultMessage: '创建时间',
                    }),
                    dataIndex: 'create_time',
                    renderText: (value) => formatCreateTime(value),
                  },
                ]}
              />
            ) : (
              <Empty
                description={intl.formatMessage({
                  id: 'pages.cluster.namespaces.detail.empty',
                  defaultMessage: '未找到命名空间',
                })}
              />
            )}
          </Spin>
        </div>
      </div>
      <div className={styles.moreInfo}>
        <Card className={styles.moreInfoCard}>
          <Tabs
            items={[
              {
                key: 'overview',
                label: '概览',
                children: (
                  <div>
                    <SectionTitle color={'#36435C'} fontSize={12}>
                      资源状态
                    </SectionTitle>
                    <Spin
                      spinning={resourceLoading}
                      className={styles.resourceSpin}
                    >
                      <div className={styles.overview}>
                        {resourceStatusItems.map((item) => (
                          <div className={styles.resourceItem} key={item.key}>
                            <div className={styles.resourceIcon}>
                              {item.icon}
                            </div>
                            <div className={styles.resourceContent}>
                              <div
                                className={[
                                  styles.resourceCount,
                                  item.active ? styles.resourceCountActive : '',
                                ].join(' ')}
                              >
                                {item.value}
                              </div>
                              <div className={styles.resourceLabel}>
                                {item.label}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Spin>
                  </div>
                ),
              },
              {
                key: 'pods',
                label: '容器组',
                children: (
                  <ClusterPodList
                    dataSource={pods}
                    loading={podLoading}
                    onRefresh={fetchPods}
                  />
                ),
              },
              {
                key: 'quota',
                label: '配额',
                children: (
                  <Spin spinning={quotaLoading}>
                    <div className={styles.quotaPanel}>
                      <div>
                        <SectionTitle color={'#36435C'} fontSize={12}>
                          默认容器配额
                        </SectionTitle>
                        <div className={styles.defaultQuota}>
                          {defaultQuotaItems.map((item) => (
                            <div
                              className={styles.defaultQuotaGroup}
                              key={item.key}
                            >
                              <div className={styles.quotaIcon}>
                                {item.icon}
                              </div>
                              <div className={styles.quotaMetric}>
                                <div className={styles.quotaMetricValue}>
                                  {item.request || '无预留'}
                                </div>
                                <div className={styles.quotaMetricLabel}>
                                  {item.requestLabel}
                                </div>
                              </div>
                              <div className={styles.quotaMetric}>
                                <div className={styles.quotaMetricValue}>
                                  {formatQuotaValue(item.limit)}
                                </div>
                                <div className={styles.quotaMetricLabel}>
                                  {item.limitLabel}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <SectionTitle color={'#36435C'} fontSize={12}>
                          项目配额
                        </SectionTitle>
                        <div className={styles.projectQuota}>
                          {projectQuotaItems.map((item) => {
                            const usagePercent = getQuotaUsagePercent(
                              item.quota.used,
                              item.quota.hard,
                              item.parser,
                            );

                            return (
                              <div
                                className={styles.projectQuotaItem}
                                key={item.key}
                              >
                                <div className={styles.quotaIcon}>
                                  {item.icon}
                                </div>
                                <div className={styles.quotaMetric}>
                                  <div className={styles.quotaMetricValue}>
                                    {item.title}
                                  </div>
                                  <div className={styles.quotaMetricLabel}>
                                    资源类型
                                  </div>
                                </div>
                                <div className={styles.quotaMetric}>
                                  <div className={styles.quotaMetricValue}>
                                    {item.quota.used || '0'}
                                  </div>
                                  <div className={styles.quotaMetricLabel}>
                                    已使用
                                  </div>
                                </div>
                                <div className={styles.quotaMetric}>
                                  <div className={styles.quotaMetricValue}>
                                    {formatQuotaValue(item.quota.hard)}
                                  </div>
                                  <div className={styles.quotaMetricLabel}>
                                    配额
                                  </div>
                                </div>
                                <div className={styles.quotaUsage}>
                                  <div className={styles.usageHeader}>
                                    <span className={styles.usageTitle}>
                                      用量
                                    </span>
                                    <span>已使用：{usagePercent}%</span>
                                  </div>
                                  <div className={styles.usageBar}>
                                    <div
                                      className={styles.usageBarInner}
                                      style={{ width: `${usagePercent}%` }}
                                    />
                                    <span className={styles.usageLimit}>
                                      {formatQuotaValue(item.quota.hard)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Spin>
                ),
              },
              {
                key: 'metadata',
                label: '元数据',
                children: (
                  <ClusterMetadata
                    labels={namespace?.labels}
                    annotations={namespace?.annotations}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
      <Modal
        destroyOnHidden
        confirmLoading={projectQuotaSaving}
        open={projectQuotaModalOpen}
        title="编辑配额"
        width={920}
        okText="保存"
        cancelText="取消"
        onCancel={() => setProjectQuotaModalOpen(false)}
        onOk={handleSaveProjectQuota}
      >
        <Form<ProjectQuotaFormValues>
          className={styles.quotaForm}
          form={projectQuotaForm}
          layout="vertical"
        >
          <div className={styles.quotaFormSectionTitle}>可用配额</div>
          <ComputeQuotaFields
            cpuFields={[
              {
                label: 'CPU 预留',
                name: 'cpuRequest',
                placeholder: '无预留',
              },
              {
                label: 'CPU 限制',
                name: 'cpuLimit',
                placeholder: '无上限',
              },
            ]}
            memoryFields={[
              {
                label: '内存预留',
                name: 'memoryRequest',
                placeholder: '无预留',
              },
              {
                label: '内存上限',
                name: 'memoryLimit',
                placeholder: '无上限',
              },
            ]}
            memoryUnit="Gi"
          />
          <div className={styles.quotaFormSectionTitle}>应用资源配额</div>
          <SelectValueEditor
            value={appQuotaRows}
            deleteAriaLabel="删除应用资源配额"
            keyPlaceholder="请选择资源类型"
            options={APP_QUOTA_OPTIONS.map((option) => ({
              label: option.label,
              value: option.name,
            }))}
            valuePlaceholder="无上限"
            onAddBlocked={() => message.warning('请先选择已有资源类型')}
            onChange={setAppQuotaRows}
            onCreateItem={() =>
              createAppQuotaRow(
                APP_QUOTA_OPTION_VALUES.find(
                  (option) =>
                    !appQuotaRows.some((row) => row.keyName === option),
                ),
              )
            }
          />
        </Form>
      </Modal>
      <Modal
        destroyOnHidden
        confirmLoading={defaultContainerQuotaSaving}
        open={defaultContainerQuotaModalOpen}
        title="编辑默认容器配额"
        width={800}
        okText="保存"
        cancelText="取消"
        onCancel={() => setDefaultContainerQuotaModalOpen(false)}
        onOk={handleSaveDefaultContainerQuota}
      >
        <Form<DefaultContainerQuotaFormValues>
          className={styles.quotaForm}
          form={defaultContainerQuotaForm}
          layout="vertical"
        >
          <ComputeQuotaFields
            cpuFields={[
              {
                label: 'CPU 预留',
                name: 'cpuRequest',
                placeholder: '无预留',
              },
              {
                label: 'CPU 限制',
                name: 'cpuLimit',
                placeholder: '无上限',
              },
            ]}
            memoryFields={[
              {
                label: '内存预留',
                name: 'memoryRequest',
                placeholder: '无预留',
              },
              {
                label: '内存上限',
                name: 'memoryLimit',
                placeholder: '无上限',
              },
            ]}
          />
        </Form>
      </Modal>
      <Modal
        destroyOnHidden
        confirmLoading={annotationSaving}
        open={annotationModalOpen}
        title="编辑注解"
        width={900}
        okText="保存"
        cancelText="取消"
        onCancel={() => setAnnotationModalOpen(false)}
        onOk={handleSaveAnnotations}
      >
        <KeyValueEditor
          value={annotationRows}
          deleteAriaLabel="删除注解"
          onAddBlocked={() => message.warning('请先填写已有注解的 Key')}
          onChange={setAnnotationRows}
          onCreateItem={() => createAnnotationRow()}
        />
      </Modal>
    </PageContainer>
  );
};

export default NamespaceDetail;
