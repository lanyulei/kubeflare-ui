import {
  DatabaseOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  HddOutlined,
} from '@ant-design/icons';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useIntl, useParams } from '@umijs/max';
import { App, Button, Card, Dropdown, Empty, Form, Spin, Tabs } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ClusterMetadata, ClusterPodList, SectionTitle } from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import type { SelectValueEditorItem } from '@/components/SelectValueEditor';
import {
  deleteClusterNamespace,
  getClusterNamespaceDetail,
  getClusterNamespacePodList,
  getClusterNamespaceQuotaSummary,
  getClusterNamespaceResourceStatus,
  getClusterStorageClassList,
  updateClusterNamespaceAnnotations,
  updateClusterNamespaceDefaultContainerQuota,
  updateClusterNamespaceProjectQuota,
} from '@/services/kubeflare/cluster/namespace';
import {
  AnnotationModal,
  DefaultContainerQuotaModal,
  ProjectQuotaModal,
  QuotaOverview,
  ResourceOverview,
  useNamespaceDetailStyles as useStyles,
} from './components';
import {
  APP_QUOTA_OPTIONS,
  type AppQuotaName,
  DEFAULT_APP_QUOTA_OPTION,
  DEFAULT_QUOTA_SUMMARY,
  DEFAULT_RESOURCE_STATUS,
  type DefaultContainerQuotaFormValues,
  decodeNamespaceName,
  formatCreateTime,
  getCpuFormValue,
  getMemoryGiFormValue,
  getMemoryMiFormValue,
  getNamespaceStatusLabel,
  getNamespaceStatusType,
  normalizeMemoryGiValue,
  normalizeMemoryMiValue,
  normalizeNumberValue,
  type ProjectQuotaFormValues,
  parseCountQuantity,
  type StorageClassQuotaRow,
} from './components/helpers';

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
  const [storageClassQuotaRows, setStorageClassQuotaRows] = useState<
    StorageClassQuotaRow[]
  >([]);
  const [activeStorageClassName, setActiveStorageClassName] = useState<
    string | undefined
  >();
  const [storageClasses, setStorageClasses] = useState<
    API.ClusterStorageClassItem[]
  >([]);
  const [storageClassLoading, setStorageClassLoading] = useState(false);
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
  const storageClassQuotaRowIdRef = useRef(0);
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
  const createStorageClassQuotaRow = useCallback(
    (
      storageClassName?: string,
      values?: Omit<StorageClassQuotaRow, 'id' | 'storageClassName'>,
    ) => {
      const nextId = storageClassQuotaRowIdRef.current;
      storageClassQuotaRowIdRef.current += 1;

      return {
        id: `storage-class-quota-${nextId}`,
        storageClassName,
        ...values,
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

  const fetchStorageClasses = useCallback(async () => {
    setStorageClassLoading(true);
    try {
      const res = await getClusterStorageClassList({ limit: 500 });
      setStorageClasses(res.data.items || []);
    } finally {
      setStorageClassLoading(false);
    }
  }, []);

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

    setAnnotationRows(rows.length > 0 ? rows : [createAnnotationRow()]);
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
        message.warning('注解 键 不能为空');
        return;
      }
      if (annotationKeys.has(keyName)) {
        message.warning('注解 键 不能重复');
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
      storageRequest: getMemoryGiFormValue(
        quotaSummary.project.storageRequest.hard,
      ),
      storageLimit: getMemoryGiFormValue(
        quotaSummary.project.storageLimit.hard,
      ),
      storagePersistentVolumeClaims: parseCountQuantity(
        quotaSummary.project.persistentVolumeClaims.hard,
      ),
    });
    const nextAppQuotaRows = APP_QUOTA_OPTIONS.flatMap((option) => {
      const value = parseCountQuantity(quotaSummary.project[option.name].hard);

      return value === undefined ? [] : [createAppQuotaRow(option.name, value)];
    });
    const nextStorageClassQuotaRows =
      quotaSummary.project.storageClassQuotas.map((quota) =>
        createStorageClassQuotaRow(quota.storageClassName, {
          requestsStorage: getMemoryGiFormValue(quota.requestsStorage?.hard),
          limitsStorage: getMemoryGiFormValue(quota.limitsStorage?.hard),
          persistentVolumeClaims: parseCountQuantity(
            quota.persistentVolumeClaims?.hard,
          ),
          persistentVolumeClaimsUsed: quota.persistentVolumeClaims?.used,
        }),
      );

    setAppQuotaRows(
      nextAppQuotaRows.length > 0
        ? nextAppQuotaRows
        : [createAppQuotaRow(DEFAULT_APP_QUOTA_OPTION)],
    );
    setStorageClassQuotaRows(nextStorageClassQuotaRows);
    setActiveStorageClassName(nextStorageClassQuotaRows[0]?.storageClassName);
    fetchStorageClasses();
    setProjectQuotaModalOpen(true);
  };
  const handleSaveProjectQuota = async () => {
    if (!namespaceName) {
      return;
    }

    const values = await projectQuotaForm.validateFields();
    const appQuotaValues: Partial<Record<AppQuotaName, number>> = {};
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
      appQuotaValues[row.keyName as AppQuotaName] = row.value;
    }
    const nextStorageClassQuotaRows = storageClassQuotaRows.filter(
      (row) => row.storageClassName,
    );

    setProjectQuotaSaving(true);
    try {
      await updateClusterNamespaceProjectQuota(namespaceName, {
        cpuRequest: normalizeNumberValue(values.cpuRequest),
        cpuLimit: normalizeNumberValue(values.cpuLimit),
        memoryRequest: normalizeMemoryGiValue(values.memoryRequest),
        memoryLimit: normalizeMemoryGiValue(values.memoryLimit),
        storageRequest: normalizeMemoryGiValue(
          values.storageRequest ? values.storageRequest : undefined,
        ),
        storageLimit: normalizeMemoryGiValue(values.storageLimit),
        pods: normalizeNumberValue(appQuotaValues.pods),
        deployments: normalizeNumberValue(appQuotaValues.deployments),
        statefulsets: normalizeNumberValue(appQuotaValues.statefulsets),
        daemonsets: normalizeNumberValue(appQuotaValues.daemonsets),
        jobs: normalizeNumberValue(appQuotaValues.jobs),
        cronjobs: normalizeNumberValue(appQuotaValues.cronjobs),
        persistentVolumeClaims: normalizeNumberValue(
          values.storagePersistentVolumeClaims,
        ),
        services: normalizeNumberValue(appQuotaValues.services),
        ingresses: normalizeNumberValue(appQuotaValues.ingresses),
        secrets: normalizeNumberValue(appQuotaValues.secrets),
        configMaps: normalizeNumberValue(appQuotaValues.configMaps),
        storageClassQuotas: nextStorageClassQuotaRows.map((row) => ({
          storageClassName: row.storageClassName,
          requestsStorage: normalizeMemoryGiValue(
            row.requestsStorage ? row.requestsStorage : undefined,
          ),
          limitsStorage: normalizeMemoryGiValue(row.limitsStorage),
          persistentVolumeClaims: normalizeNumberValue(
            row.persistentVolumeClaims,
          ),
        })),
      });
      message.success('项目配额已更新');
      setProjectQuotaModalOpen(false);
      await fetchQuotaSummary();
    } finally {
      setProjectQuotaSaving(false);
    }
  };
  const updateStorageClassQuotaRow = (
    storageClassName: string,
    field: keyof Omit<StorageClassQuotaRow, 'id' | 'storageClassName'>,
    value?: number | null,
  ) => {
    setStorageClassQuotaRows((rows) =>
      rows.map((row) =>
        row.storageClassName === storageClassName
          ? { ...row, [field]: value }
          : row,
      ),
    );
  };
  const selectStorageClassQuota = (storageClassName: string) => {
    setStorageClassQuotaRows((rows) => {
      if (rows.some((row) => row.storageClassName === storageClassName)) {
        return rows;
      }

      return [...rows, createStorageClassQuotaRow(storageClassName)];
    });
    setActiveStorageClassName(storageClassName);
  };
  const deleteStorageClassQuota = (storageClassName?: string) => {
    setStorageClassQuotaRows((rows) =>
      rows.filter((row) => row.storageClassName !== storageClassName),
    );
    setActiveStorageClassName((current) =>
      current === storageClassName ? undefined : current,
    );
  };

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
                  <ResourceOverview
                    loading={resourceLoading}
                    resourceStatus={resourceStatus}
                  />
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
                  <QuotaOverview
                    loading={quotaLoading}
                    quotaSummary={quotaSummary}
                  />
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
      <ProjectQuotaModal
        activeStorageClassName={activeStorageClassName}
        appQuotaRows={appQuotaRows}
        form={projectQuotaForm}
        open={projectQuotaModalOpen}
        saving={projectQuotaSaving}
        storageClassLoading={storageClassLoading}
        storageClassQuotaRows={storageClassQuotaRows}
        storageClasses={storageClasses}
        onAddAppQuotaBlocked={() => message.warning('请先选择已有资源类型')}
        onCancel={() => setProjectQuotaModalOpen(false)}
        onChangeAppQuotaRows={setAppQuotaRows}
        onCreateAppQuotaRow={createAppQuotaRow}
        onDeleteStorageClassQuota={deleteStorageClassQuota}
        onOk={handleSaveProjectQuota}
        onSelectStorageClassQuota={selectStorageClassQuota}
        onSetActiveStorageClassName={setActiveStorageClassName}
        onUpdateStorageClassQuotaRow={updateStorageClassQuotaRow}
      />
      <DefaultContainerQuotaModal
        form={defaultContainerQuotaForm}
        open={defaultContainerQuotaModalOpen}
        saving={defaultContainerQuotaSaving}
        onCancel={() => setDefaultContainerQuotaModalOpen(false)}
        onOk={handleSaveDefaultContainerQuota}
      />
      <AnnotationModal
        rows={annotationRows}
        open={annotationModalOpen}
        saving={annotationSaving}
        onAddBlocked={() => message.warning('请先填写已有注解的 Key')}
        onCancel={() => setAnnotationModalOpen(false)}
        onChange={setAnnotationRows}
        onCreateItem={() => createAnnotationRow()}
        onOk={handleSaveAnnotations}
      />
    </PageContainer>
  );
};

export default NamespaceDetail;
