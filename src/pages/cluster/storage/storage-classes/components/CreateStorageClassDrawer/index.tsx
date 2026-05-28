import {
  AppstoreOutlined,
  CloseOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Steps,
  Switch,
} from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { YamlEditor } from '@/components';
import {
  buildCreateStorageClassManifest,
  buildCreateStorageClassYaml,
  getInitialStorageClassValues,
  getStorageClassStepFields,
  NAME_PATTERN,
  STORAGE_CLASS_API_VERSION,
  STORAGE_CLASS_KIND,
  STORAGE_CLASS_RESOURCE_TYPE,
  validateStorageClassParameters,
} from './helpers';
import StorageClassSettings from './StorageClassSettings';
import type { CreateStorageClassFormValues } from './types';

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: 0,
      background: token.colorBgLayout,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  headerExtra: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
  },
  yamlSwitch: {
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    borderRadius: 999,
    background: token.colorFillSecondary,
  },
  steps: {
    padding: '15px 20px',
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,

    '.ant-steps-item-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    '.ant-steps-item-title': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeightSM,
    },

    '.ant-steps-item-description': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  body: {
    height: 'calc(100vh - 205px)',
    overflow: 'auto',
    padding: `${token.paddingLG}px`,
    background: token.colorBgContainer,

    '.ant-form-item-extra': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  yamlBody: {
    height: 'calc(100vh - 131px)',
    padding: token.paddingLG,
    background: token.colorBgContainer,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  footerActions: {
    display: 'flex',
    gap: token.marginSM,
  },
  section: {
    marginBottom: token.marginLG,
  },
  basicFields: {
    width: '100%',
  },
}));

type CreateStorageClassDrawerProps = {
  loading?: boolean;
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    type: API.ClusterResourceCreateType;
    namespace?: string;
    manifest: Record<string, unknown>;
  }) => Promise<void>;
};

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const storageTypeOptions = [
  { label: '块存储', value: 'block' },
  { label: '对象存储', value: 'object' },
  { label: '文件存储', value: 'file' },
];

const hasBasicInfoContent = (values: CreateStorageClassFormValues) =>
  Boolean(values.name && values.storageType);

const hasStorageClassSettingsContent = (values: CreateStorageClassFormValues) =>
  Boolean(
    values.provisioner ||
      values.reclaimPolicy ||
      values.volumeBindingMode ||
      values.allowVolumeExpansion ||
      values.accessModes?.length ||
      values.parameters?.some((item) => item.keyName.trim()),
  );

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateStorageClassFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && hasBasicInfoContent(values)) {
    return '已设置';
  }
  if (index === 1 && hasStorageClassSettingsContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const CreateStorageClassDrawer = ({
  loading = false,
  open,
  onCancel,
  onSubmit,
}: CreateStorageClassDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateStorageClassFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '存储类设置',
        icon: <DatabaseOutlined />,
      },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialStorageClassValues();
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateStorageClassYaml(initialValues));
  }, [form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateStorageClassYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    await form.validateFields(getStorageClassStepFields(current));
    if (current === 1) {
      const error = validateStorageClassParameters(
        form.getFieldValue('parameters'),
      );

      if (error) {
        form.setFields([{ name: 'parameters', errors: [error] }]);
        throw new Error(error);
      }
    }
    return true;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();

    if (!valid) {
      return;
    }

    setCurrent((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    if (yamlMode) {
      let manifest: unknown;
      try {
        manifest = parse(yamlValue);
      } catch {
        message.error('YAML 格式不正确，请检查后重试');
        return;
      }

      if (
        !manifest ||
        typeof manifest !== 'object' ||
        Array.isArray(manifest)
      ) {
        message.error('YAML 内容必须是有效的资源对象');
        return;
      }

      const resource = manifest as Record<string, unknown>;
      const metadataRecord = getRecordValue(resource.metadata);
      const name =
        typeof metadataRecord?.name === 'string'
          ? metadataRecord.name.trim()
          : '';
      const kind = typeof resource.kind === 'string' ? resource.kind : '';
      const apiVersion =
        typeof resource.apiVersion === 'string' ? resource.apiVersion : '';

      if (!name) {
        message.error('YAML 必须包含 metadata.name');
        return;
      }
      if (kind !== STORAGE_CLASS_KIND) {
        message.error(`YAML kind 必须为 ${STORAGE_CLASS_KIND}`);
        return;
      }
      if (apiVersion !== STORAGE_CLASS_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${STORAGE_CLASS_API_VERSION}`);
        return;
      }

      await onSubmit({
        type: STORAGE_CLASS_RESOURCE_TYPE,
        manifest: resource,
      });
      return;
    }

    await form.validateFields([
      ...getStorageClassStepFields(0),
      ...getStorageClassStepFields(1),
    ]);
    const formValues = form.getFieldsValue(true);
    const error = validateStorageClassParameters(formValues.parameters);

    if (error) {
      form.setFields([{ name: 'parameters', errors: [error] }]);
      message.warning(error);
      return;
    }

    await onSubmit({
      type: STORAGE_CLASS_RESOURCE_TYPE,
      manifest: buildCreateStorageClassManifest(formValues),
    });
  };

  const renderBasicInfo = () => (
    <div className={styles.basicFields}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            extra="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
            label="名称"
            name="name"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 63, message: '名称最长 63 个字符' },
              {
                pattern: NAME_PATTERN,
                message:
                  '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
              },
            ]}
          >
            <Input placeholder="请输入名称" autoFocus />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="存储类型"
            name="storageType"
            rules={[{ required: true, message: '请选择存储类型' }]}
          >
            <Select options={storageTypeOptions} placeholder="请选择" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return renderBasicInfo();
      case 1:
        return <StorageClassSettings />;
      default:
        return null;
    }
  };

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      extra={
        <div className={styles.headerExtra}>
          <Space className={styles.yamlSwitch}>
            <span>编辑 YAML</span>
            <Switch checked={yamlMode} onChange={handleYamlModeChange} />
          </Space>
        </div>
      }
      footer={
        <div className={styles.footer}>
          <span />
          <div className={styles.footerActions}>
            <Button onClick={onCancel}>取消</Button>
            {!yamlMode && current > 0 && (
              <Button onClick={() => setCurrent((step) => step - 1)}>
                上一步
              </Button>
            )}
            {!yamlMode && current < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button loading={loading} type="primary" onClick={handleSubmit}>
                创建
              </Button>
            )}
          </div>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title="创建存储类"
      width="78vw"
      onClose={onCancel}
    >
      {yamlMode ? (
        <div className={styles.yamlBody}>
          <YamlEditor
            height="calc(100vh - 179px)"
            value={yamlValue}
            onChange={setYamlValue}
          />
        </div>
      ) : (
        <>
          <Steps
            className={styles.steps}
            current={current}
            items={steps.map((step, index) => ({
              ...step,
              disabled: index > current + 1,
              description: getStepStatusText(current, index, values),
            }))}
            onChange={async (nextStep) => {
              if (nextStep <= current) {
                setCurrent(nextStep);
                return;
              }
              if (nextStep > current + 1) {
                return;
              }

              const valid = await validateCurrentStep();
              if (valid) {
                setCurrent(nextStep);
              }
            }}
          />
          <div className={styles.body}>
            <Form
              form={form}
              layout="vertical"
              requiredMark
              onValuesChange={() => {
                if (!yamlMode) {
                  setYamlValue(
                    buildCreateStorageClassYaml(form.getFieldsValue(true)),
                  );
                }
              }}
            >
              <div className={styles.section}>{renderStepContent()}</div>
            </Form>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default CreateStorageClassDrawer;
