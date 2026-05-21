import {
  DeleteOutlined,
  DockerOutlined,
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
  Select,
  Spin,
  Typography,
} from 'antd';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getClusterConfigMapList,
  getClusterPersistentVolumeClaimList,
  getClusterSecretList,
} from '@/services/kubeflare/cluster/namespace';
import type {
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
  WorkloadConfigResourceType,
  WorkloadContainerMountItem,
  WorkloadStorageCategory,
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
};

type ResourcePlaceholderProps = {
  description: string;
  icon: ReactNode;
  title: string;
};

type ResourceOptionContentProps = ResourcePlaceholderProps & {
  metrics?: { label: string; value?: string }[];
};

const getConfigResourceLabel = (type?: WorkloadConfigResourceType) =>
  type === 'secret' ? '保密字典' : '配置字典';

const getResourceIcon = (type?: WorkloadConfigResourceType) =>
  type === 'secret' ? <KeyOutlined /> : <ToolOutlined />;

const getPvcMetrics = (item: API.ClusterPersistentVolumeClaimItem) => [
  { label: '容量', value: item.capacity || '-' },
  { label: '访问模式', value: item.accessModes?.join(', ') || '-' },
];

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

const StorageSettings = ({ form }: StorageSettingsProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
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
  const configResourceType = Form.useWatch('configResourceType', {
    form,
    preserve: true,
  });
  const containerMounts =
    (Form.useWatch('containerMounts', {
      form,
      preserve: true,
    }) as WorkloadContainerMountItem[]) || [];
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
  const [pvcs, setPvcs] = useState<API.ClusterPersistentVolumeClaimItem[]>([]);
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

  const activateMounts = useCallback(
    (category = storageCategory) => {
      updateMounts(activateEmptyMounts(normalizeMounts(category), category));
    },
    [normalizeMounts, storageCategory, updateMounts],
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
      })),
    );
    const nextValue = JSON.stringify(
      normalized.map((item) => ({
        containerId: item.containerId,
        containerName: item.containerName,
        id: item.id,
        mountMode: item.mountMode,
        mountPath: item.mountPath,
      })),
    );

    if (currentValue !== nextValue) {
      updateMounts(normalized);
    }
  }, [containerMounts, normalizeMounts, updateMounts]);

  const fetchResources = useCallback(async () => {
    if (!namespace || !storageCategory || storageCategory === 'none') {
      setPvcs([]);
      setConfigMaps([]);
      setSecrets([]);
      return;
    }

    setResourceLoading(true);
    try {
      if (storageCategory === 'volume') {
        const res = await getClusterPersistentVolumeClaimList({ namespace });
        setPvcs(res.data?.items || []);
        return;
      }

      const [configMapRes, secretRes] = await Promise.all([
        getClusterConfigMapList({ namespace }),
        getClusterSecretList({ namespace }),
      ]);
      setConfigMaps(configMapRes.data?.items || []);
      setSecrets(secretRes.data?.items || []);
    } catch {
      message.error('获取存储资源失败');
    } finally {
      setResourceLoading(false);
    }
  }, [message, namespace, storageCategory]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

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
    });

    if (nextVolumeType !== 'persistentVolumeClaim') {
      activateMounts('volume');
    }
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

  const renderEntry = () => (
    <div className={styles.entryGrid}>
      <button
        className={styles.entryCard}
        type="button"
        onClick={() => selectStorageCategory('volume')}
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
        onClick={() => selectStorageCategory('config')}
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
      <div className={styles.sectionHeader}>
        <div className={styles.title}>
          {storageCategory === 'volume' ? '挂载卷' : '挂载配置字典或保密字典'}
        </div>
        <Button size="small" type="link" onClick={resetStorageCategory}>
          重新选择
        </Button>
      </div>
      {storageCategory === 'volume'
        ? renderVolumeTypeTabs()
        : renderConfigResourceTypeTabs()}
      <div className={styles.panel}>
        {storageCategory === 'volume'
          ? renderVolumeFields()
          : renderConfigResourceSelector()}
        {renderContainerMountRows()}
        {renderSpecificKeySelector()}
      </div>
    </>
  );

  return (
    <div>
      {!storageCategory || storageCategory === 'none'
        ? renderEntry()
        : renderSelectedStorage()}
    </div>
  );
};

export default StorageSettings;
