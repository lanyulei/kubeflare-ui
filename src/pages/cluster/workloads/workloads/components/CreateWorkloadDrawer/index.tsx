import {
  AppstoreOutlined,
  CloseOutlined,
  DockerOutlined,
  HddOutlined,
  SlidersOutlined,
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
import ContainerSettings from './ContainerSettings';
import {
  buildCreateWorkloadManifest,
  buildCreateWorkloadYaml,
  getInitialCreateWorkloadValues,
  getWorkloadResourceName,
  getWorkloadStepFields,
} from './helpers';
import StorageSettings from './StorageSettings';
import type { CreateWorkloadFormValues } from './types';
import WorkloadAdvancedSettings from './WorkloadAdvancedSettings';

const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

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
    padding: `15px 20px`,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    // background: token.colorFillQuaternary,
    background: '#ffffff',

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
}));

type CreateWorkloadDrawerProps = {
  open: boolean;
  type: API.ClusterWorkloadType;
  namespaceOptions: { label: string; value: string }[];
  defaultNamespace?: string;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    namespace: string;
    name: string;
    manifest: Record<string, unknown>;
  }) => Promise<void>;
};

const hasKeyValueContent = (items?: { keyName?: string }[]) =>
  (items || []).some((item) => item.keyName?.trim());

const hasAdvancedSettingsContent = (
  values: CreateWorkloadFormValues,
  type: API.ClusterWorkloadType,
) =>
  Boolean(
    (type !== 'DaemonSet' &&
      (values.enableNodeSelector ||
        hasKeyValueContent(values.nodeSelectors) ||
        (values.selectedNodeNames && values.selectedNodeNames.length > 0))) ||
      hasKeyValueContent(values.labels) ||
      hasKeyValueContent(values.annotations),
  );

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateWorkloadFormValues,
  type: API.ClusterWorkloadType,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && values.containers && values.containers.length > 0) {
    return '已设置';
  }
  if (
    index === 2 &&
    ((values.storageItems && values.storageItems.length > 0) ||
      (values.storageCategory && values.storageCategory !== 'none'))
  ) {
    return '已设置';
  }
  if (index === 3 && hasAdvancedSettingsContent(values, type)) {
    return '已设置';
  }
  return '未设置';
};

const CreateWorkloadDrawer = ({
  open,
  type,
  namespaceOptions,
  defaultNamespace,
  loading = false,
  onCancel,
  onSubmit,
}: CreateWorkloadDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateWorkloadFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const resourceName = getWorkloadResourceName(type);
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '容器组设置',
        icon: <DockerOutlined />,
      },
      {
        title: '存储设置',
        icon: <HddOutlined />,
      },
      {
        title: '高级设置',
        icon: <SlidersOutlined />,
      },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialCreateWorkloadValues(
      type,
      defaultNamespace,
    );
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateWorkloadYaml(type, initialValues));
  }, [defaultNamespace, form, open, type]);

  const syncYamlFromForm = () => {
    const formValues = form.getFieldsValue(true);
    setYamlValue(buildCreateWorkloadYaml(type, formValues));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const handleNext = async () => {
    if (current === 1 && !form.getFieldValue('containers')?.length) {
      message.warning('请先添加容器并填写容器名称和镜像');
      return;
    }
    await form.validateFields(getWorkloadStepFields(current, type));
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
      const metadata = resource.metadata;
      const metadataRecord =
        metadata && typeof metadata === 'object' && !Array.isArray(metadata)
          ? (metadata as Record<string, unknown>)
          : undefined;
      const name =
        typeof metadataRecord?.name === 'string' ? metadataRecord.name : '';
      const namespace =
        typeof metadataRecord?.namespace === 'string'
          ? metadataRecord.namespace
          : '';
      if (!name || !namespace) {
        message.error('YAML 必须包含 metadata.name 和 metadata.namespace');
        return;
      }

      await onSubmit({
        name,
        namespace,
        manifest: resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    await onSubmit({
      name: formValues.name || '',
      namespace: formValues.namespace || '',
      manifest: buildCreateWorkloadManifest(type, formValues),
    });
  };

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
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
          label="命名空间"
          name="namespace"
          rules={[{ required: true, message: '请选择命名空间' }]}
        >
          <Select
            showSearch
            options={namespaceOptions}
            optionFilterProp="label"
            placeholder="请选择命名空间"
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderContainerSettings = () => (
    <ContainerSettings form={form} type={type} />
  );

  const renderStorageSettings = () => (
    <StorageSettings form={form} type={type} />
  );

  const renderAdvancedSettings = () => (
    <WorkloadAdvancedSettings form={form} type={type} />
  );

  const stepContent = [
    renderBasicInfo,
    renderContainerSettings,
    renderStorageSettings,
    renderAdvancedSettings,
  ][current];

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
      title={`创建${resourceName}`}
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
              description: getStepStatusText(current, index, values, type),
            }))}
            onChange={async (nextStep) => {
              if (nextStep <= current) {
                setCurrent(nextStep);
                return;
              }
              if (nextStep > current + 1) {
                return;
              }
              if (current === 1 && !form.getFieldValue('containers')?.length) {
                message.warning('请先添加容器并填写容器名称和镜像');
                return;
              }
              await form.validateFields(getWorkloadStepFields(current, type));
              setCurrent(nextStep);
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
                    buildCreateWorkloadYaml(type, form.getFieldsValue(true)),
                  );
                }
              }}
            >
              <div className={styles.section}>{stepContent()}</div>
            </Form>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default CreateWorkloadDrawer;
