import { DeleteOutlined } from '@ant-design/icons';
import { Link } from '@umijs/max';
import { App, Button, Form, Input, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getClusterConfigMapList,
  getClusterSecretList,
} from '@/services/kubeflare/cluster/namespace';
import type { ContainerEnvItem, ContainerEnvSourceType } from '../types';

const ENV_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const envSourceOptions: {
  label: string;
  value: ContainerEnvSourceType;
}[] = [
  { label: '自定义', value: 'custom' },
  { label: '来自配置字典', value: 'configMap' },
  { label: '来自保密字典', value: 'secret' },
];

const useStyles = createStyles(({ token }) => ({
  envs: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  row: {
    display: 'grid',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 999,
    background: token.colorFillSecondary,

    '.ant-form-item': {
      marginBottom: 0,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      borderRadius: token.borderRadiusSM,
      padding: token.paddingSM,
    },
  },
  customRow: {
    gridTemplateColumns:
      'minmax(128px, 0.6fr) minmax(180px, 1fr) minmax(220px, 1fr) 32px',
  },
  referenceRow: {
    gridTemplateColumns:
      'minmax(128px, 0.6fr) minmax(160px, 0.9fr) minmax(180px, 1fr) minmax(180px, 1fr) 32px',
  },
  control: {
    minWidth: 0,
    width: '100%',

    '.ant-select-selector, &.ant-input': {
      background: token.colorBgContainer,
    },
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },

    '@media (max-width: 768px)': {
      justifySelf: 'end',
    },
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
  },
  helper: {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
  },
}));

const createContainerEnvItem = (): ContainerEnvItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  sourceType: 'custom',
  keyName: '',
  value: '',
});

const isResourceSource = (sourceType?: ContainerEnvSourceType) =>
  sourceType === 'configMap' || sourceType === 'secret';

const isEnvItemIncomplete = (item: ContainerEnvItem) => {
  if (!item.keyName?.trim()) {
    return true;
  }

  if (!isResourceSource(item.sourceType)) {
    return false;
  }

  return !item.resourceName || !item.resourceKey;
};

const toSelectOptions = (items: API.ClusterConfigResourceItem[]) =>
  items.map((item) => ({
    label: item.name,
    value: item.name,
  }));

const getResourceKeys = (
  sourceType: ContainerEnvSourceType,
  resourceName: string | undefined,
  configMaps: API.ClusterConfigResourceItem[],
  secrets: API.ClusterConfigResourceItem[],
) => {
  const resources = sourceType === 'secret' ? secrets : configMaps;
  const resource = resources.find((item) => item.name === resourceName);

  return (resource?.keys || []).map((key) => ({
    label: key,
    value: key,
  }));
};

const ContainerEnvFields = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const form = Form.useFormInstance();
  const namespace = Form.useWatch('namespace', {
    form,
    preserve: true,
  });
  const envItems =
    (Form.useWatch('containerEnv', {
      form,
      preserve: true,
    }) as ContainerEnvItem[]) || [];
  const [configMaps, setConfigMaps] = useState<API.ClusterConfigResourceItem[]>(
    [],
  );
  const [secrets, setSecrets] = useState<API.ClusterConfigResourceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const configMapOptions = useMemo(
    () => toSelectOptions(configMaps),
    [configMaps],
  );
  const secretOptions = useMemo(() => toSelectOptions(secrets), [secrets]);
  const addDisabled = envItems.some(isEnvItemIncomplete);

  const fetchResources = useCallback(async () => {
    if (!namespace) {
      setConfigMaps([]);
      setSecrets([]);
      return;
    }

    setLoading(true);
    try {
      const [configMapRes, secretRes] = await Promise.all([
        getClusterConfigMapList({ namespace }),
        getClusterSecretList({ namespace }),
      ]);

      setConfigMaps(configMapRes.data?.items || []);
      setSecrets(secretRes.data?.items || []);
    } catch {
      message.error('获取配置字典或保密字典失败');
    } finally {
      setLoading(false);
    }
  }, [message, namespace]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    if (envItems.length === 0) {
      form.setFieldValue('containerEnv', [createContainerEnvItem()]);
    }
  }, [envItems.length, form]);

  const updateEnvItem = (
    index: number,
    nextValue: Partial<ContainerEnvItem>,
  ) => {
    const currentItems = (form.getFieldValue('containerEnv') ||
      []) as ContainerEnvItem[];

    form.setFieldValue(
      'containerEnv',
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...nextValue } : item,
      ),
    );
  };

  const addEnvItem = (add: (defaultValue?: ContainerEnvItem) => void) => {
    if (addDisabled) {
      return;
    }

    add(createContainerEnvItem());
  };

  const renderReferenceFields = (
    fieldName: number,
    item: ContainerEnvItem,
    sourceType: ContainerEnvSourceType,
  ) => {
    const resourceOptions =
      sourceType === 'secret' ? secretOptions : configMapOptions;
    const resourceKeyOptions = getResourceKeys(
      sourceType,
      item.resourceName,
      configMaps,
      secrets,
    );

    return (
      <>
        <Form.Item
          name={[fieldName, 'resourceName']}
          rules={[{ required: true, message: '请选择资源' }]}
        >
          <Select
            className={styles.control}
            disabled={!namespace}
            loading={loading}
            options={resourceOptions}
            placeholder="资源"
            showSearch
            optionFilterProp="label"
            onChange={(resourceName) =>
              updateEnvItem(fieldName, {
                resourceName,
                resourceKey: undefined,
              })
            }
          />
        </Form.Item>
        <Form.Item
          name={[fieldName, 'resourceKey']}
          rules={[{ required: true, message: '请选择资源中的键' }]}
        >
          <Select
            className={styles.control}
            disabled={!item.resourceName}
            options={resourceKeyOptions}
            placeholder="资源中的键"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </>
    );
  };

  return (
    <div className={styles.envs}>
      <Form.List name="containerEnv">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => {
              const item = envItems[field.name] || {};
              const sourceType = item.sourceType || 'custom';

              return (
                <div
                  className={[
                    styles.row,
                    isResourceSource(sourceType)
                      ? styles.referenceRow
                      : styles.customRow,
                  ].join(' ')}
                  key={field.key}
                >
                  <Form.Item
                    initialValue="custom"
                    name={[field.name, 'sourceType']}
                  >
                    <Select
                      className={styles.control}
                      options={envSourceOptions}
                      onChange={(nextSourceType) =>
                        updateEnvItem(field.name, {
                          sourceType: nextSourceType,
                          value: '',
                          resourceName: undefined,
                          resourceKey: undefined,
                        })
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'keyName']}
                    rules={[
                      { required: true, message: '请输入键' },
                      {
                        pattern: ENV_NAME_PATTERN,
                        message:
                          '键只能包含字母、数字和下划线，且不能以数字开头',
                      },
                    ]}
                  >
                    <Input className={styles.control} placeholder="键" />
                  </Form.Item>
                  {isResourceSource(sourceType) ? (
                    renderReferenceFields(field.name, item, sourceType)
                  ) : (
                    <Form.Item name={[field.name, 'value']}>
                      <Input className={styles.control} placeholder="值" />
                    </Form.Item>
                  )}
                  <Button
                    aria-label="删除环境变量"
                    className={styles.deleteButton}
                    icon={<DeleteOutlined />}
                    type="text"
                    onClick={() => remove(field.name)}
                  />
                </div>
              );
            })}
            <div className={styles.footer}>
              <div className={styles.helper}>
                如果没有配置字典或保密字典满足要求，您可以{' '}
                <Link to="/cluster/config/config-maps">创建配置字典</Link> 或{' '}
                <Link to="/cluster/config/secrets">创建保密字典</Link>。
              </div>
              <div className={styles.actions}>
                <Button disabled={addDisabled} onClick={() => addEnvItem(add)}>
                  添加环境变量
                </Button>
              </div>
            </div>
          </>
        )}
      </Form.List>
    </div>
  );
};

export { createContainerEnvItem };
export default ContainerEnvFields;
