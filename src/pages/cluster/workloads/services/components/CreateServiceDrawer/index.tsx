import {
  AppstoreOutlined,
  DeploymentUnitOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Col, Form, Input, message, Row, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import {
  buildCreateServiceManifest,
  buildCreateServiceYaml,
  getInitialCreateServiceValues,
  getServiceStepFields,
  NAME_PATTERN,
  SERVICE_API_VERSION,
  SERVICE_KIND,
  SERVICE_RESOURCE_TYPE,
} from './helpers';
import ServiceAdvancedSettings from './ServiceAdvancedSettings';
import ServiceSettings from './ServiceSettings';
import type { CreateServiceFormValues } from './types';

type CreateServiceDrawerProps = {
  defaultNamespace?: string;
  loading?: boolean;
  namespaceOptions: { label: string; value: string }[];
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

const hasKeyValueContent = (items?: { keyName?: string }[]) =>
  (items || []).some((item) => item.keyName?.trim());

const hasServiceSettingsContent = (values: CreateServiceFormValues) =>
  values.internalAccessMode === 'Headless' ||
  hasKeyValueContent(values.selectors) ||
  (values.ports || []).some((item) => item.servicePort);

const hasAdvancedSettingsContent = (values: CreateServiceFormValues) =>
  values.enableExternalAccess ||
  values.enableSessionAffinity ||
  values.ipFamilyPolicy ||
  values.ipFamilies?.length ||
  values.internalTrafficPolicy ||
  values.trafficDistribution ||
  hasKeyValueContent(values.labels);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateServiceFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && hasServiceSettingsContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasAdvancedSettingsContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const CreateServiceDrawer = ({
  defaultNamespace,
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateServiceDrawerProps) => {
  const [form] = Form.useForm<CreateServiceFormValues>();
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
        title: '服务设置',
        icon: <DeploymentUnitOutlined />,
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

    const initialValues = getInitialCreateServiceValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateServiceYaml(initialValues));
  }, [defaultNamespace, form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateServiceYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateHeadlessExternalAccess = (
    formValues: CreateServiceFormValues,
  ) => {
    if (
      formValues.internalAccessMode === 'Headless' &&
      formValues.enableExternalAccess
    ) {
      message.warning('内部域名模式不支持同时开启外部访问');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    await form.validateFields(getServiceStepFields(current));
    const formValues = form.getFieldsValue(true);
    if (current === 2 && !validateHeadlessExternalAccess(formValues)) {
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
        typeof metadataRecord?.name === 'string' ? metadataRecord.name : '';
      const namespace =
        typeof metadataRecord?.namespace === 'string'
          ? metadataRecord.namespace
          : '';
      const kind = typeof resource.kind === 'string' ? resource.kind : '';
      const apiVersion =
        typeof resource.apiVersion === 'string' ? resource.apiVersion : '';

      if (!name || !namespace) {
        message.error('YAML 必须包含 metadata.name 和 metadata.namespace');
        return;
      }
      if (kind !== SERVICE_KIND) {
        message.error(`YAML kind 必须为 ${SERVICE_KIND}`);
        return;
      }
      if (apiVersion !== SERVICE_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${SERVICE_API_VERSION}`);
        return;
      }

      await onSubmit({
        type: SERVICE_RESOURCE_TYPE,
        namespace,
        manifest: resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    if (!validateHeadlessExternalAccess(formValues)) {
      return;
    }
    await onSubmit({
      type: SERVICE_RESOURCE_TYPE,
      namespace: formValues.namespace,
      manifest: buildCreateServiceManifest(formValues),
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
          <Input autoFocus placeholder="请输入名称" />
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
            optionFilterProp="label"
            options={namespaceOptions}
            placeholder="请选择命名空间"
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const stepContent = [
    renderBasicInfo,
    () => <ServiceSettings form={form} />,
    () => <ServiceAdvancedSettings form={form} />,
  ][current];

  return (
    <ResourceCreateWizardDrawer
      current={current}
      getStepDescription={(_, index) =>
        getStepStatusText(current, index, values)
      }
      loading={loading}
      open={open}
      steps={steps}
      title="创建服务"
      yamlMode={yamlMode}
      yamlValue={yamlValue}
      onCancel={onCancel}
      onNext={handleNext}
      onPrev={() => setCurrent((step) => step - 1)}
      onStepChange={async (nextStep) => {
        if (nextStep <= current) {
          setCurrent(nextStep);
          return;
        }
        if (nextStep > current + 1) {
          return;
        }
        await form.validateFields(getServiceStepFields(current));
        setCurrent(nextStep);
      }}
      onSubmit={handleSubmit}
      onYamlChange={setYamlValue}
      onYamlModeChange={handleYamlModeChange}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark
        onValuesChange={() => {
          if (!yamlMode) {
            setYamlValue(buildCreateServiceYaml(form.getFieldsValue(true)));
          }
        }}
      >
        {stepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreateServiceDrawer;
