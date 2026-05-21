import {
  DeleteOutlined,
  DockerOutlined,
  EditOutlined,
  FolderOpenOutlined,
  HddOutlined,
  KeyOutlined,
  PlusOutlined,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  Alert,
  App,
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popover,
  Select,
  Slider,
  Spin,
  Tooltip,
  Typography,
} from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getClusterConfigMapList,
  getClusterPersistentVolumeClaimList,
  getClusterSecretList,
  getClusterStorageClassList,
} from '@/services/kubeflare/cluster/namespace';
import type {
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
  WorkloadConfigResourceType,
  WorkloadContainerMountItem,
  WorkloadStorageCategory,
  WorkloadStorageConfigItem,
  WorkloadStorageKeyPathItem,
  WorkloadVolumeType,
} from '../types';
import {
  ABSOLUTE_PATH_PATTERN,
  activateEmptyMounts,
  configResourceTypeOptions,
  createStorageKeyPathItem,
  getAvailableKeyOptions,
  getMountModeOptions,
  isRelativeVolumeItemPath,
  KUBERNETES_NAME_PATTERN,
  normalizeContainerMounts,
  STORAGE_QUANTITY_PATTERN,
  volumeTypeOptions,
} from './helpers';

import useStyles from './styles';

type StorageSettingsProps = {
  form: FormInstance<CreateWorkloadFormValues>;
  type: API.ClusterWorkloadType;
};

type ResourcePlaceholderProps = {
  description: string;
  icon: ReactNode;
  title: string;
};

type ResourceOptionContentProps = ResourcePlaceholderProps & {
  metrics?: { label: string; value?: string }[];
};

type SubPathEditorState = {
  index: number;
  value: string;
  error?: string;
};

const getConfigResourceLabel = (type?: WorkloadConfigResourceType) =>
  type === 'secret' ? '保密字典' : '配置字典';

const getResourceIcon = (type?: WorkloadConfigResourceType) =>
  type === 'secret' ? <KeyOutlined /> : <ToolOutlined />;

const getPvcMetrics = (item: API.ClusterPersistentVolumeClaimItem) => [
  { label: '容量', value: item.capacity || '-' },
  { label: '访问模式', value: item.accessModes?.join(', ') || '-' },
];

const accessModeOptions = [
  { label: 'ReadWriteOnce', value: 'ReadWriteOnce' },
  { label: 'ReadOnlyMany', value: 'ReadOnlyMany' },
  { label: 'ReadWriteMany', value: 'ReadWriteMany' },
];

const storageFieldNames: (keyof CreateWorkloadFormValues)[] = [
  'storageCategory',
  'storageType',
  'volumeType',
  'configResourceType',
  'volumeName',
  'emptyDirSizeLimit',
  'hostPath',
  'claimName',
  'claimStorageClassName',
  'claimCapacity',
  'claimAccessModes',
  'pvcNamePrefix',
  'pvcStorageClassName',
  'pvcAccessModes',
  'pvcSizeGi',
  'configResourceName',
  'containerMounts',
  'selectSpecificKeys',
  'specificKeyPaths',
];

const createStorageConfigId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const ResourceOptionContent = ({
  description,
  icon,
  metrics = [],
  title,
}: ResourceOptionContentProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.resourceOption}>
      <span className={styles.resourceIcon}>{icon}</span>
      <div className={styles.resourceText}>
        <div className={styles.resourceTitle}>{title}</div>
        <div className={styles.resourceDescription}>{description}</div>
      </div>
      {metrics.slice(0, 2).map((metric) => (
        <div className={styles.resourceMetric} key={metric.label}>
          {metric.value || '-'}
          <span className={styles.metricLabel}>{metric.label}</span>
        </div>
      ))}
    </div>
  );
};

const ResourcePlaceholder = ({
  description,
  icon,
  title,
}: ResourcePlaceholderProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.resourcePlaceholder}>
      <span className={styles.resourceIcon}>{icon}</span>
      <div className={styles.resourceText}>
        <div className={styles.resourceTitle}>{title}</div>
        <div className={styles.resourceDescription}>{description}</div>
      </div>
    </div>
  );
};

const StorageSettings = ({ form, type }: StorageSettingsProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const storageSnapshotRef = useRef<Partial<CreateWorkloadFormValues> | null>(
    null,
  );
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [editingStorageIndex, setEditingStorageIndex] = useState<number | null>(
    null,
  );
  const [subPathEditor, setSubPathEditor] = useState<SubPathEditorState | null>(
    null,
  );
  const namespace = Form.useWatch('namespace', {
    form,
    preserve: true,
  });
  const containers =
    (Form.useWatch('containers', {
      form,
      preserve: true,
    }) as CreateWorkloadContainerValues[]) || [];
  const storageCategory = Form.useWatch('storageCategory', {
    form,
    preserve: true,
  });
  const volumeType = Form.useWatch('volumeType', {
    form,
    preserve: true,
  });
  const storageType = Form.useWatch('storageType', {
    form,
    preserve: true,
  });
  const configResourceType = Form.useWatch('configResourceType', {
    form,
    preserve: true,
  });
  const containerMounts =
    (Form.useWatch('containerMounts', {
      form,
      preserve: true,
    }) as WorkloadContainerMountItem[]) || [];
  const storageItems =
    (Form.useWatch('storageItems', {
      form,
      preserve: true,
    }) as WorkloadStorageConfigItem[]) || [];
  const selectSpecificKeys = Form.useWatch('selectSpecificKeys', {
    form,
    preserve: true,
  });
  const specificKeyPaths =
    (Form.useWatch('specificKeyPaths', {
      form,
      preserve: true,
    }) as WorkloadStorageKeyPathItem[]) || [];
  const configResourceName = Form.useWatch('configResourceName', {
    form,
    preserve: true,
  });
  const pvcSizeGi = Form.useWatch('pvcSizeGi', {
    form,
    preserve: true,
  });
  const [pvcs, setPvcs] = useState<API.ClusterPersistentVolumeClaimItem[]>([]);
  const [storageClasses, setStorageClasses] = useState<
    API.ClusterStorageClassItem[]
  >([]);
  const [configMaps, setConfigMaps] = useState<API.ClusterConfigResourceItem[]>(
    [],
  );
  const [secrets, setSecrets] = useState<API.ClusterConfigResourceItem[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);

  const selectedConfigResources =
    configResourceType === 'secret' ? secrets : configMaps;
  const selectedConfigResource = selectedConfigResources.find(
    (item) => item.name === configResourceName,
  );
  const selectedKeys = selectedConfigResource?.keys || [];

  const pvcOptions = useMemo(
    () =>
      pvcs.map((item) => ({
        label: (
          <ResourceOptionContent
            description={item.storageClassName || '默认存储类'}
            icon={<HddOutlined />}
            metrics={getPvcMetrics(item)}
            title={item.name}
          />
        ),
        searchLabel: item.name,
        value: item.name,
      })),
    [pvcs],
  );

  const storageClassOptions = useMemo(
    () =>
      storageClasses.map((item) => ({
        label: item.name,
        value: item.name,
      })),
    [storageClasses],
  );

  const configResourceOptions = useMemo(
    () =>
      selectedConfigResources.map((item) => ({
        label: (
          <ResourceOptionContent
            description={getConfigResourceLabel(configResourceType)}
            icon={getResourceIcon(configResourceType)}
            title={item.name}
          />
        ),
        searchLabel: item.name,
        value: item.name,
      })),
    [configResourceType, selectedConfigResources],
  );

  const normalizeMounts = useCallback(
    (category = storageCategory) =>
      normalizeContainerMounts(
        containers,
        (form.getFieldValue('containerMounts') ||
          []) as WorkloadContainerMountItem[],
        category,
      ),
    [containers, form, storageCategory],
  );

  const updateMounts = useCallback(
    (nextMounts: WorkloadContainerMountItem[]) => {
      form.setFieldValue('containerMounts', nextMounts);
    },
    [form],
  );

  const openSubPathEditor = (index: number) => {
    const mount = form.getFieldValue(['containerMounts', index]);

    setSubPathEditor({
      index,
      value: mount?.subPath || '',
    });
  };

  const cancelSubPathEditor = () => {
    setSubPathEditor(null);
  };

  const confirmSubPathEditor = () => {
    if (!subPathEditor) {
      return;
    }

    const nextValue = subPathEditor.value.trim();

    if (nextValue && !isRelativeVolumeItemPath(nextValue)) {
      setSubPathEditor({
        ...subPathEditor,
        error: '请使用相对路径，且不能包含 ..',
      });
      return;
    }

    form.setFieldValue(
      ['containerMounts', subPathEditor.index, 'subPath'],
      nextValue || undefined,
    );
    setSubPathEditor(null);
  };

  const activateMounts = useCallback(
    (category = storageCategory) => {
      updateMounts(activateEmptyMounts(normalizeMounts(category), category));
    },
    [normalizeMounts, storageCategory, updateMounts],
  );

  const getStorageSnapshot = useCallback(() => {
    const snapshot: Partial<CreateWorkloadFormValues> = {};

    storageFieldNames.forEach((fieldName) => {
      snapshot[fieldName] = structuredClone(form.getFieldValue(fieldName));
    });

    return snapshot;
  }, [form]);

  const restoreStorageSnapshot = useCallback(() => {
    const snapshot = storageSnapshotRef.current;

    if (!snapshot) {
      return;
    }

    form.setFieldsValue(snapshot);
    updateMounts(
      (snapshot.containerMounts || []) as WorkloadContainerMountItem[],
    );
    storageSnapshotRef.current = null;
  }, [form, updateMounts]);

  const openStorageModal = useCallback(
    (setupStorage: () => void) => {
      storageSnapshotRef.current = getStorageSnapshot();
      setEditingStorageIndex(null);
      setSubPathEditor(null);
      setupStorage();
      setStorageModalOpen(true);
    },
    [getStorageSnapshot],
  );

  useEffect(() => {
    const normalized = normalizeMounts();
    const currentValue = JSON.stringify(
      containerMounts.map((item) => ({
        containerId: item.containerId,
        containerName: item.containerName,
        id: item.id,
        mountMode: item.mountMode,
        mountPath: item.mountPath,
        subPath: item.subPath,
      })),
    );
    const nextValue = JSON.stringify(
      normalized.map((item) => ({
        containerId: item.containerId,
        containerName: item.containerName,
        id: item.id,
        mountMode: item.mountMode,
        mountPath: item.mountPath,
        subPath: item.subPath,
      })),
    );

    if (currentValue !== nextValue) {
      updateMounts(normalized);
    }
  }, [containerMounts, normalizeMounts, updateMounts]);

  useEffect(() => {
    if (storageItems.length === 0) {
      return;
    }

    const normalizedItems = storageItems.map((item) => ({
      ...item,
      containerMounts: normalizeContainerMounts(
        containers,
        item.containerMounts || [],
        item.storageCategory,
      ),
    }));
    const currentValue = JSON.stringify(
      storageItems.map((item) => item.containerMounts || []),
    );
    const nextValue = JSON.stringify(
      normalizedItems.map((item) => item.containerMounts || []),
    );

    if (currentValue !== nextValue) {
      form.setFieldValue('storageItems', normalizedItems);
    }
  }, [containers, form, storageItems]);

  const fetchResources = useCallback(async () => {
    if (!namespace || !storageCategory || storageCategory === 'none') {
      setPvcs([]);
      setStorageClasses([]);
      setConfigMaps([]);
      setSecrets([]);
      return;
    }

    setResourceLoading(true);
    try {
      if (storageCategory === 'volume') {
        if (storageType === 'volumeClaimTemplate') {
          const res = await getClusterStorageClassList();
          setStorageClasses(res.data?.items || []);
          setPvcs([]);
          return;
        }

        const res = await getClusterPersistentVolumeClaimList({ namespace });
        setPvcs(res.data?.items || []);
        setStorageClasses([]);
        return;
      }

      const [configMapRes, secretRes] = await Promise.all([
        getClusterConfigMapList({ namespace }),
        getClusterSecretList({ namespace }),
      ]);
      setConfigMaps(configMapRes.data?.items || []);
      setSecrets(secretRes.data?.items || []);
      setStorageClasses([]);
    } catch {
      message.error('获取存储资源失败');
    } finally {
      setResourceLoading(false);
    }
  }, [message, namespace, storageCategory, storageType]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    if (
      storageType === 'volumeClaimTemplate' &&
      storageClasses.length > 0 &&
      !form.getFieldValue('pvcStorageClassName')
    ) {
      form.setFieldValue('pvcStorageClassName', storageClasses[0].name);
    }
  }, [form, storageClasses, storageType]);

  useEffect(() => {
    if (!selectSpecificKeys) {
      return;
    }

    if (specificKeyPaths.length === 0) {
      form.setFieldValue('specificKeyPaths', [createStorageKeyPathItem()]);
    }
  }, [form, selectSpecificKeys, specificKeyPaths.length]);

  const selectStorageCategory = (
    category: Exclude<WorkloadStorageCategory, 'none'>,
  ) => {
    const nextType =
      category === 'volume' ? 'persistentVolumeClaim' : 'configMap';

    form.setFieldsValue({
      storageCategory: category,
      storageType: nextType,
      volumeType: category === 'volume' ? 'persistentVolumeClaim' : volumeType,
      configResourceType:
        category === 'config' ? 'configMap' : configResourceType,
      configResourceName: undefined,
      claimName: undefined,
      claimStorageClassName: undefined,
      claimCapacity: undefined,
      claimAccessModes: undefined,
      pvcNamePrefix: undefined,
      pvcStorageClassName: undefined,
      pvcAccessModes: ['ReadWriteOnce'],
      pvcSizeGi: 10,
      selectSpecificKeys: false,
      specificKeyPaths: [],
    });
    updateMounts(normalizeMounts(category));
  };

  const resetStorageCategory = () => {
    form.setFieldsValue({
      storageCategory: 'none',
      storageType: 'none',
      volumeType: 'persistentVolumeClaim',
      configResourceType: 'configMap',
      claimName: undefined,
      claimStorageClassName: undefined,
      claimCapacity: undefined,
      claimAccessModes: undefined,
      pvcNamePrefix: undefined,
      pvcStorageClassName: undefined,
      pvcAccessModes: ['ReadWriteOnce'],
      pvcSizeGi: 10,
      configResourceName: undefined,
      selectSpecificKeys: false,
      specificKeyPaths: [],
    });
    updateMounts(normalizeMounts('none'));
  };

  const handleVolumeTypeChange = (nextVolumeType: WorkloadVolumeType) => {
    form.setFieldsValue({
      storageType: nextVolumeType,
      volumeType: nextVolumeType,
      claimName: undefined,
      claimStorageClassName: undefined,
      claimCapacity: undefined,
      claimAccessModes: undefined,
    });

    if (nextVolumeType !== 'persistentVolumeClaim') {
      activateMounts('volume');
    }
  };

  const selectVolumeClaimTemplate = () => {
    form.setFieldsValue({
      storageCategory: 'volume',
      storageType: 'volumeClaimTemplate',
      volumeType: 'persistentVolumeClaim',
      claimName: undefined,
      claimStorageClassName: undefined,
      claimCapacity: undefined,
      claimAccessModes: undefined,
      pvcNamePrefix: form.getFieldValue('pvcNamePrefix') || '',
      pvcStorageClassName: form.getFieldValue('pvcStorageClassName'),
      pvcAccessModes: form.getFieldValue('pvcAccessModes') || ['ReadWriteOnce'],
      pvcSizeGi: form.getFieldValue('pvcSizeGi') || 10,
      selectSpecificKeys: false,
      specificKeyPaths: [],
    });
    activateMounts('volume');
  };

  const handleConfigResourceTypeChange = (
    nextResourceType: WorkloadConfigResourceType,
  ) => {
    form.setFieldsValue({
      configResourceName: undefined,
      configResourceType: nextResourceType,
      selectSpecificKeys: false,
      specificKeyPaths: [],
      storageType: nextResourceType,
    });
    activateMounts('config');
  };

  const addSpecificKeyPath = () => {
    const hasIncompleteItem = specificKeyPaths.some(
      (item) => !item.keyName || !item.path?.trim(),
    );

    if (hasIncompleteItem || specificKeyPaths.length >= selectedKeys.length) {
      return;
    }

    form.setFieldValue('specificKeyPaths', [
      ...specificKeyPaths,
      createStorageKeyPathItem(),
    ]);
  };

  const removeSpecificKeyPath = (index: number) => {
    form.setFieldValue(
      'specificKeyPaths',
      specificKeyPaths.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const cancelStorageModal = () => {
    restoreStorageSnapshot();
    setEditingStorageIndex(null);
    setSubPathEditor(null);
    setStorageModalOpen(false);
  };

  const confirmStorageModal = async () => {
    await form.validateFields(storageFieldNames);
    const selectedPvc = pvcs.find(
      (item) => item.name === form.getFieldValue('claimName'),
    );
    const nextItem: WorkloadStorageConfigItem = {
      id:
        editingStorageIndex === null
          ? createStorageConfigId()
          : storageItems[editingStorageIndex]?.id || createStorageConfigId(),
      storageCategory,
      storageType,
      volumeType,
      configResourceType,
      volumeName: form.getFieldValue('volumeName'),
      emptyDirSizeLimit: form.getFieldValue('emptyDirSizeLimit'),
      hostPath: form.getFieldValue('hostPath'),
      claimName: form.getFieldValue('claimName'),
      claimStorageClassName: selectedPvc?.storageClassName,
      claimCapacity: selectedPvc?.capacity,
      claimAccessModes: selectedPvc?.accessModes,
      pvcNamePrefix: form.getFieldValue('pvcNamePrefix'),
      pvcStorageClassName: form.getFieldValue('pvcStorageClassName'),
      pvcAccessModes: form.getFieldValue('pvcAccessModes'),
      pvcSizeGi: form.getFieldValue('pvcSizeGi'),
      configResourceName: form.getFieldValue('configResourceName'),
      containerMounts: form.getFieldValue('containerMounts'),
      selectSpecificKeys: form.getFieldValue('selectSpecificKeys'),
      specificKeyPaths: form.getFieldValue('specificKeyPaths'),
    };
    const nextItems = [...storageItems];

    if (editingStorageIndex === null) {
      nextItems.push(nextItem);
    } else {
      nextItems[editingStorageIndex] = nextItem;
    }

    form.setFieldValue('storageItems', nextItems);
    storageSnapshotRef.current = null;
    setEditingStorageIndex(null);
    setSubPathEditor(null);
    resetStorageCategory();
    setStorageModalOpen(false);
  };

  const editStorageConfig = (
    item: WorkloadStorageConfigItem,
    index: number,
  ) => {
    storageSnapshotRef.current = getStorageSnapshot();
    setEditingStorageIndex(index);
    form.setFieldsValue({
      storageCategory: item.storageCategory,
      storageType: item.storageType,
      volumeType: item.volumeType,
      configResourceType: item.configResourceType,
      volumeName: item.volumeName,
      emptyDirSizeLimit: item.emptyDirSizeLimit,
      hostPath: item.hostPath,
      claimName: item.claimName,
      claimStorageClassName: item.claimStorageClassName,
      claimCapacity: item.claimCapacity,
      claimAccessModes: item.claimAccessModes,
      pvcNamePrefix: item.pvcNamePrefix,
      pvcStorageClassName: item.pvcStorageClassName,
      pvcAccessModes: item.pvcAccessModes,
      pvcSizeGi: item.pvcSizeGi,
      configResourceName: item.configResourceName,
      containerMounts: item.containerMounts,
      selectSpecificKeys: item.selectSpecificKeys,
      specificKeyPaths: item.specificKeyPaths,
    });
    setSubPathEditor(null);
    setStorageModalOpen(true);
  };

  const deleteStorageConfig = (index: number) => {
    form.setFieldValue(
      'storageItems',
      storageItems.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const renderEntry = () => (
    <div className={styles.entryGrid}>
      {type === 'StatefulSet' && (
        <button
          className={[styles.entryCard, styles.entryCardWide].join(' ')}
          type="button"
          onClick={() => openStorageModal(selectVolumeClaimTemplate)}
        >
          <HddOutlined className={styles.entryIcon} />
          <span className={styles.entryContent}>
            <span className={styles.entryTitle}>添加持久卷声明模板</span>
            <span className={styles.entryDescription}>
              添加持久卷声明模板为有状态副本集的每个容器组挂载一个持久卷。
            </span>
          </span>
        </button>
      )}
      <button
        className={styles.entryCard}
        type="button"
        onClick={() => openStorageModal(() => selectStorageCategory('volume'))}
      >
        <HddOutlined className={styles.entryIcon} />
        <span className={styles.entryContent}>
          <span className={styles.entryTitle}>挂载卷</span>
          <span className={styles.entryDescription}>
            为容器挂载持久卷、临时卷或 HostPath 卷
          </span>
        </span>
      </button>
      <button
        className={styles.entryCard}
        type="button"
        onClick={() => openStorageModal(() => selectStorageCategory('config'))}
      >
        <ToolOutlined className={styles.entryIcon} />
        <span className={styles.entryContent}>
          <span className={styles.entryTitle}>挂载配置字典或保密字典</span>
          <span className={styles.entryDescription}>
            为容器挂载配置字典或保密字典
          </span>
        </span>
      </button>
    </div>
  );

  const renderPvcSelector = () => (
    <div className={styles.resourceSelector}>
      <Form.Item
        className={styles.resourceItem}
        name="claimName"
        rules={[{ required: true, message: '请选择持久卷声明' }]}
      >
        <Select
          className={styles.resourceSelect}
          loading={resourceLoading}
          notFoundContent={
            resourceLoading ? <Spin size="small" /> : '未发现可用资源'
          }
          optionFilterProp="searchLabel"
          options={pvcOptions}
          placeholder={
            <ResourcePlaceholder
              description="将根据持久卷声明创建的持久卷挂载到容器"
              icon={<HddOutlined />}
              title={pvcs.length > 0 ? '选择持久卷声明' : '未发现可用资源'}
            />
          }
          showSearch
          onChange={() => activateMounts('volume')}
        />
      </Form.Item>
    </div>
  );

  const renderConfigResourceSelector = () => {
    const resourceLabel = getConfigResourceLabel(configResourceType);

    return (
      <div className={styles.resourceSelector}>
        <Form.Item
          className={styles.resourceItem}
          name="configResourceName"
          rules={[{ required: true, message: `请选择${resourceLabel}。` }]}
        >
          <Select
            className={styles.resourceSelect}
            loading={resourceLoading}
            notFoundContent={
              resourceLoading ? <Spin size="small" /> : '未发现可用资源'
            }
            optionFilterProp="searchLabel"
            options={configResourceOptions}
            placeholder={
              <ResourcePlaceholder
                description={`将${resourceLabel}挂载到容器。`}
                icon={getResourceIcon(configResourceType)}
                title={
                  selectedConfigResources.length > 0
                    ? `选择${resourceLabel}`
                    : '未发现可用资源'
                }
              />
            }
            showSearch
            onChange={() => {
              form.setFieldValue('specificKeyPaths', []);
              activateMounts('config');
            }}
          />
        </Form.Item>
      </div>
    );
  };

  const renderVolumeFields = () => {
    if (storageType === 'volumeClaimTemplate') {
      return null;
    }

    if (volumeType === 'persistentVolumeClaim') {
      return renderPvcSelector();
    }

    if (volumeType === 'hostPath') {
      return (
        <>
          <Alert
            className={styles.info}
            message="使用 HostPath 卷将主机文件系统中的文件或目录挂载到容器中。"
            showIcon={false}
            type="info"
          />
          <div className={styles.formGrid}>
            <Form.Item
              label="卷名称"
              name="volumeName"
              rules={[
                { required: true, message: '请输入卷名称' },
                { max: 63, message: '卷名称最长 63 个字符' },
                {
                  pattern: KUBERNETES_NAME_PATTERN,
                  message:
                    '卷名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="主机路径"
              name="hostPath"
              rules={[
                { required: true, message: '请输入主机路径' },
                {
                  pattern: ABSOLUTE_PATH_PATTERN,
                  message: '请输入以 / 开头的绝对路径',
                },
              ]}
            >
              <Input />
            </Form.Item>
          </div>
        </>
      );
    }

    return (
      <div className={styles.formGrid}>
        <Form.Item
          label="卷名称"
          name="volumeName"
          rules={[
            { required: true, message: '请输入卷名称' },
            { max: 63, message: '卷名称最长 63 个字符' },
            {
              pattern: KUBERNETES_NAME_PATTERN,
              message:
                '卷名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="容量上限"
          name="emptyDirSizeLimit"
          rules={[
            { required: true, message: '请输入容量上限' },
            {
              pattern: STORAGE_QUANTITY_PATTERN,
              message: '请输入合法的容量，例如 200Mi 或 2Gi',
            },
          ]}
          tooltip="设置当前存储卷的容量上限，默认值为 200Mi，最大值不能超过 2Gi"
        >
          <Input />
        </Form.Item>
      </div>
    );
  };

  const renderVolumeClaimTemplateFields = () => (
    <div className={styles.templatePanel}>
      <div className={styles.templateFormGrid}>
        <Form.Item
          className={styles.templateField}
          tooltip="持久卷声明名称的前缀。前缀只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 253 个字符"
          label="PVC 名称前缀"
          name="pvcNamePrefix"
          rules={[
            { required: true, message: '请输入 PVC 名称前缀' },
            { max: 253, message: 'PVC 名称前缀最长 253 个字符' },
            {
              pattern: KUBERNETES_NAME_PATTERN,
              message:
                'PVC 名称前缀只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
            },
          ]}
        >
          <Input placeholder="请输入 PVC 名称前缀" />
        </Form.Item>
        <Form.Item
          className={styles.templateField}
          tooltip="选择一个存储类来创建特定种类的卷"
          label="存储类"
          name="pvcStorageClassName"
          rules={[{ required: true, message: '请选择存储类' }]}
        >
          <Select
            allowClear
            loading={resourceLoading}
            notFoundContent={
              resourceLoading ? <Spin size="small" /> : '未发现可用存储类'
            }
            options={storageClassOptions}
            placeholder="请选择存储类"
            showSearch
          />
        </Form.Item>
        <Form.Item
          className={styles.templateField}
          tooltip="选择存储类支持的一种或多种访问模式"
          label="访问模式"
          name="pvcAccessModes"
          rules={[{ required: true, message: '请选择访问模式' }]}
        >
          <Select
            mode="multiple"
            options={accessModeOptions}
            placeholder="请选择访问模式"
          />
        </Form.Item>
        <Form.Item className={styles.capacityFormItem} label="卷容量" required>
          <div className={styles.capacityRow}>
            <Slider
              className={styles.capacitySlider}
              marks={{
                0: '0',
                512: '512Gi',
                1024: '1024Gi',
                1536: '1536Gi',
                2048: '2048Gi',
              }}
              max={2048}
              min={0}
              value={pvcSizeGi ?? 10}
              onChange={(value) =>
                form.setFieldValue('pvcSizeGi', Math.max(value, 1))
              }
            />
            <InputNumber
              className={styles.capacityInput}
              controls={false}
              max={2048}
              min={1}
              suffix="Gi"
              value={pvcSizeGi ?? 10}
              onChange={(value) => form.setFieldValue('pvcSizeGi', value || 1)}
            />
          </div>
        </Form.Item>
      </div>
    </div>
  );

  const renderSubPathEditor = () => (
    <div className={styles.subPathEditor}>
      <div className={styles.subPathHeader}>
        <div className={styles.subPathTitle}>指定子路径</div>
        <div className={styles.subPathDescription}>
          指定需要挂载到容器的卷子路径。
        </div>
      </div>
      <Input
        autoFocus
        placeholder="子路径"
        prefix={<FolderOpenOutlined />}
        status={subPathEditor?.error ? 'error' : undefined}
        value={subPathEditor?.value}
        onChange={(event) =>
          setSubPathEditor((current) =>
            current
              ? {
                  ...current,
                  error: undefined,
                  value: event.target.value,
                }
              : current,
          )
        }
        onPressEnter={confirmSubPathEditor}
      />
      {subPathEditor?.error && (
        <div className={styles.subPathError}>{subPathEditor.error}</div>
      )}
      <div className={styles.subPathFooter}>
        <Button onClick={cancelSubPathEditor}>取消</Button>
        <Button type="primary" onClick={confirmSubPathEditor}>
          确定
        </Button>
      </div>
    </div>
  );

  const renderContainerMountRows = () => {
    if (containers.length === 0) {
      return (
        <Empty
          className={styles.empty}
          description="请先添加容器"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <div className={styles.mountRows}>
        {containerMounts.map((item, index) => {
          const mountMode = item.mountMode || 'none';
          const disabled = mountMode === 'none';
          const mountPath = item.mountPath?.trim();
          const subPath = item.subPath?.trim();
          const subPathDisabled = disabled || !mountPath;

          return (
            <div className={styles.mountRow} key={item.id}>
              <div className={styles.containerIdentity}>
                <DockerOutlined className={styles.containerIcon} />
                <Typography.Text ellipsis>
                  {item.containerName || `container-${index + 1}`}
                </Typography.Text>
              </div>
              <Form.Item name={['containerMounts', index, 'mountMode']}>
                <Select
                  className={styles.mountControl}
                  options={getMountModeOptions(storageCategory)}
                />
              </Form.Item>
              <Form.Item
                name={['containerMounts', index, 'mountPath']}
                rules={
                  disabled
                    ? []
                    : [
                        { required: true, message: '请输入挂载路径' },
                        {
                          pattern: ABSOLUTE_PATH_PATTERN,
                          message: '请输入以 / 开头的绝对路径',
                        },
                      ]
                }
              >
                <Input
                  className={styles.mountControl}
                  disabled={disabled}
                  placeholder="挂载路径"
                  prefix={<SettingOutlined />}
                  suffix={
                    <Popover
                      arrow
                      content={renderSubPathEditor()}
                      open={subPathEditor?.index === index}
                      placement="topRight"
                      trigger="click"
                      onOpenChange={(open) => {
                        if (open) {
                          openSubPathEditor(index);
                          return;
                        }
                        cancelSubPathEditor();
                      }}
                    >
                      <Tooltip title="指定子路径">
                        <Button
                          aria-label="指定子路径"
                          className={[
                            styles.subPathTrigger,
                            subPath ? styles.subPathTriggerActive : '',
                          ].join(' ')}
                          disabled={subPathDisabled}
                          icon={<FolderOpenOutlined />}
                          size="small"
                          type="text"
                        />
                      </Tooltip>
                    </Popover>
                  }
                />
              </Form.Item>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSpecificKeyPaths = () => {
    if (!selectSpecificKeys) {
      return null;
    }

    const addDisabled =
      selectedKeys.length === 0 ||
      specificKeyPaths.length >= selectedKeys.length ||
      specificKeyPaths.some((item) => !item.keyName || !item.path?.trim());

    return (
      <div className={styles.keyRows}>
        <div className={styles.keyEditor}>
          {specificKeyPaths.map((item, index) => (
            <div className={styles.keyRow} key={item.id}>
              <Form.Item
                name={['specificKeyPaths', index, 'keyName']}
                rules={[{ required: true, message: '请选择键' }]}
              >
                <Select
                  disabled={selectedKeys.length === 0}
                  options={getAvailableKeyOptions(
                    selectedKeys,
                    specificKeyPaths,
                    item.keyName,
                  )}
                  placeholder="键"
                  showSearch
                />
              </Form.Item>
              <Form.Item
                className={styles.keyValueField}
                name={['specificKeyPaths', index, 'path']}
                rules={[
                  { required: true, message: '请输入路径' },
                  {
                    validator: (_, value) =>
                      isRelativeVolumeItemPath(value)
                        ? Promise.resolve()
                        : Promise.reject(new Error('请使用相对路径。')),
                  },
                ]}
              >
                <Input placeholder="相对路径" />
              </Form.Item>
              <Button
                aria-label="删除键映射"
                className={styles.deleteButton}
                icon={<DeleteOutlined />}
                type="text"
                onClick={() => removeSpecificKeyPath(index)}
              />
            </div>
          ))}
        </div>
        <div className={styles.keyFooter}>
          <Button disabled={addDisabled} onClick={addSpecificKeyPath}>
            <PlusOutlined />
            添加
          </Button>
        </div>
      </div>
    );
  };

  const renderSpecificKeySelector = () => {
    if (storageCategory !== 'config') {
      return null;
    }

    return (
      <div className={styles.specificPanel}>
        <div className={styles.specificHeader}>
          <Form.Item name="selectSpecificKeys" valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <div>
            <div className={styles.specificText}>选择特定键</div>
            <div className={styles.specificDescription}>
              选择需要挂载到容器的特定键
            </div>
          </div>
        </div>
        {renderSpecificKeyPaths()}
      </div>
    );
  };

  const renderVolumeTypeTabs = () => (
    <div className={styles.typeTabs}>
      {volumeTypeOptions.map((option) => (
        <button
          aria-pressed={option.value === volumeType}
          className={[
            styles.typeTab,
            option.value === volumeType ? styles.typeTabActive : '',
          ].join(' ')}
          key={option.value}
          type="button"
          onClick={() => handleVolumeTypeChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const renderConfigResourceTypeTabs = () => (
    <div className={styles.typeTabs}>
      {configResourceTypeOptions.map((option) => (
        <button
          aria-pressed={option.value === configResourceType}
          className={[
            styles.typeTab,
            option.value === configResourceType ? styles.typeTabActive : '',
          ].join(' ')}
          key={option.value}
          type="button"
          onClick={() => handleConfigResourceTypeChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const renderSelectedStorage = () => (
    <>
      {storageType !== 'volumeClaimTemplate' &&
        (storageCategory === 'volume'
          ? renderVolumeTypeTabs()
          : renderConfigResourceTypeTabs())}
      <div className={styles.panel}>
        {storageType === 'volumeClaimTemplate'
          ? renderVolumeClaimTemplateFields()
          : storageCategory === 'volume'
            ? renderVolumeFields()
            : renderConfigResourceSelector()}
        {renderContainerMountRows()}
        {renderSpecificKeySelector()}
      </div>
    </>
  );

  const getConfiguredStorageTitle = (item?: WorkloadStorageConfigItem) => {
    const currentStorageType = item?.storageType || storageType;
    const currentStorageCategory = item?.storageCategory || storageCategory;

    if (currentStorageType === 'volumeClaimTemplate') {
      return '持久卷声明模板';
    }
    if (currentStorageCategory === 'volume') {
      return '挂载卷';
    }
    return '挂载配置字典或保密字典';
  };

  const getStorageCardIcon = (item: WorkloadStorageConfigItem) => {
    if (item.storageCategory === 'config') {
      return getResourceIcon(item.configResourceType);
    }
    return item.storageType === 'hostPath' ? <ToolOutlined /> : <HddOutlined />;
  };

  const getStorageCardFields = (item: WorkloadStorageConfigItem) => {
    if (item.storageType === 'volumeClaimTemplate') {
      return [
        {
          label: '存储类',
          value: item.pvcStorageClassName || 'standard',
        },
        {
          label: '容量',
          value: `${item.pvcSizeGi || 10}Gi`,
        },
        {
          label: '访问模式',
          value: item.pvcAccessModes?.join(', ') || 'ReadWriteOnce',
        },
      ];
    }

    if (item.storageType === 'persistentVolumeClaim') {
      return [
        {
          label: '存储类',
          value: item.claimStorageClassName || 'standard',
        },
        {
          label: '容量',
          value: item.claimCapacity || '-',
        },
        {
          label: '访问模式',
          value: item.claimAccessModes?.join(', ') || '-',
        },
      ];
    }

    if (item.storageType === 'hostPath') {
      return [{ label: 'HostPath', value: item.hostPath || '-' }];
    }

    if (item.storageType === 'configMap' || item.storageType === 'secret') {
      return [
        {
          label: getConfigResourceLabel(item.configResourceType),
          value: item.configResourceName || '-',
        },
      ];
    }

    return [{ label: '卷类型', value: 'EmptyDir' }];
  };

  const getStorageCardName = (item: WorkloadStorageConfigItem) => {
    if (item.storageType === 'volumeClaimTemplate') {
      return item.pvcNamePrefix || 'volume';
    }
    if (item.storageType === 'persistentVolumeClaim') {
      return item.claimName || 'persistent-volume-claim';
    }
    if (item.storageType === 'configMap' || item.storageType === 'secret') {
      return (
        item.configResourceName ||
        getConfigResourceLabel(item.configResourceType)
      );
    }
    return item.volumeName || 'data';
  };

  const getStorageTypeDescription = (item: WorkloadStorageConfigItem) => {
    if (item.storageType === 'volumeClaimTemplate') {
      return '持久卷声明';
    }
    if (item.storageType === 'persistentVolumeClaim') {
      return '持久卷声明';
    }
    if (item.storageType === 'hostPath') {
      return 'HostPath';
    }
    if (item.storageType === 'configMap' || item.storageType === 'secret') {
      return getConfigResourceLabel(item.configResourceType);
    }
    return 'EmptyDir';
  };

  const renderStorageMounts = (item: WorkloadStorageConfigItem) => {
    const activeMounts = (item.containerMounts || []).filter(
      (mount) =>
        mount.mountMode && mount.mountMode !== 'none' && mount.mountPath,
    );

    if (activeMounts.length === 0) {
      return null;
    }

    return (
      <div className={styles.cardMountRows}>
        {activeMounts.map((mount, index) => (
          <div className={styles.cardMountRow} key={mount.id || index}>
            <span className={styles.cardMountContainer}>
              <DockerOutlined className={styles.containerIcon} />
              <Typography.Text ellipsis>
                {mount.containerName || `container-${index + 1}`}
              </Typography.Text>
            </span>
            <span className={styles.cardMountMeta}>
              <SettingOutlined />
              {mount.mountPath}
              {mount.mountMode === 'readWrite' ? '（读写）' : ''}
              {mount.subPath ? ` · 子路径：${mount.subPath}` : ''}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderStorageCard = (
    item: WorkloadStorageConfigItem,
    index: number,
  ) => (
    <div className={styles.storageCard} key={item.id}>
      <div className={styles.storageCardMain}>
        <div className={styles.storageCardIcon}>{getStorageCardIcon(item)}</div>
        <div className={styles.storageCardIdentity}>
          <div className={styles.storageCardName}>
            {getStorageCardName(item)}
          </div>
          <div className={styles.storageCardDescription}>
            卷类型： {getStorageTypeDescription(item)}
          </div>
        </div>
        {getStorageCardFields(item).map((field) => (
          <div className={styles.storageCardMetric} key={field.label}>
            {field.value}
            <span>{field.label}</span>
          </div>
        ))}
        <div className={styles.storageCardActions}>
          <Button
            aria-label="删除存储配置"
            icon={<DeleteOutlined />}
            type="text"
            onClick={() => deleteStorageConfig(index)}
          />
          <Button
            aria-label="编辑存储配置"
            icon={<EditOutlined />}
            type="text"
            onClick={() => editStorageConfig(item, index)}
          />
        </div>
      </div>
      {renderStorageMounts(item)}
    </div>
  );

  const renderAddStorageActions = () => (
    <div className={styles.addStorageGrid}>
      {type === 'StatefulSet' && (
        <button
          className={[styles.addStorageCard, styles.addStorageCardWide].join(
            ' ',
          )}
          type="button"
          onClick={() => openStorageModal(selectVolumeClaimTemplate)}
        >
          <span className={styles.addStorageTitle}>添加持久卷声明模板</span>
          <span className={styles.addStorageDescription}>
            添加持久卷声明模板为有状态副本集的每个容器组挂载一个持久卷。
          </span>
        </button>
      )}
      <button
        className={styles.addStorageCard}
        type="button"
        onClick={() => openStorageModal(() => selectStorageCategory('volume'))}
      >
        <span className={styles.addStorageTitle}>挂载卷</span>
        <span className={styles.addStorageDescription}>
          为容器挂载持久卷、临时卷或 HostPath 卷。
        </span>
      </button>
      <button
        className={styles.addStorageCard}
        type="button"
        onClick={() => openStorageModal(() => selectStorageCategory('config'))}
      >
        <span className={styles.addStorageTitle}>挂载配置字典或保密字典</span>
        <span className={styles.addStorageDescription}>
          为容器挂载配置字典或保密字典。
        </span>
      </button>
    </div>
  );

  const renderConfiguredStorage = () => (
    <div className={styles.storageList}>
      <div className={styles.storageTitle}>存储设置</div>
      <div className={styles.storageListPanel}>
        {storageItems.map(renderStorageCard)}
        {renderAddStorageActions()}
      </div>
    </div>
  );

  return (
    <div>
      {storageItems.length === 0 ? (
        <>
          <div className={styles.storageTitle}>存储设置</div>
          {renderEntry()}
        </>
      ) : (
        renderConfiguredStorage()
      )}
      <Modal
        destroyOnHidden
        keyboard={false}
        maskClosable={false}
        open={storageModalOpen}
        title={getConfiguredStorageTitle()}
        width={900}
        onCancel={cancelStorageModal}
        onOk={confirmStorageModal}
      >
        {storageCategory &&
          storageCategory !== 'none' &&
          renderSelectedStorage()}
      </Modal>
    </div>
  );
};

export default StorageSettings;
