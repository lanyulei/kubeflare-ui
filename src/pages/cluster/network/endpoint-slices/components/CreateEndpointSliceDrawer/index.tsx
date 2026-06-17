import {
  ApiOutlined,
  AppstoreOutlined,
  ClusterOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Col, Form, Input, message, Row, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import EndpointSliceAdvancedSettings from './EndpointSliceAdvancedSettings';
import EndpointSliceEndpointSettings from './EndpointSliceEndpointSettings';
import EndpointSlicePortSettings from './EndpointSlicePortSettings';
import {
  buildCreateEndpointSliceManifest,
  buildCreateEndpointSliceYaml,
  ENDPOINT_SLICE_RESOURCE_TYPE,
  getEndpointContentCount,
  getEndpointSliceStepFields,
  getEndpointSliceYamlValidationError,
  getInitialCreateEndpointSliceValues,
  getMetadataContentCount,
  getPortContentCount,
  NAME_PATTERN,
  validateEndpointSliceFormValues,
  validateEndpointSliceStep,
} from './helpers';
import type {
  CreateEndpointSliceFormValues,
  EndpointSliceAddressType,
} from './types';

type CreateEndpointSliceDrawerProps = {
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

const ADDRESS_TYPE_OPTIONS: {
  label: string;
  value: EndpointSliceAddressType;
}[] = [
  { label: 'IPv4', value: 'IPv4' },
  { label: 'IPv6', value: 'IPv6' },
  { label: 'FQDN', value: 'FQDN' },
];

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateEndpointSliceFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (
    index === 0 &&
    values.name &&
    values.namespace &&
    values.serviceName &&
    values.addressType
  ) {
    return values.addressType;
  }
  const endpointCount = getEndpointContentCount(values);
  if (index === 1 && endpointCount > 0) {
    return `${endpointCount} 个端点`;
  }
  const portCount = getPortContentCount(values);
  if (index === 2 && portCount > 0) {
    return `${portCount} 个端口`;
  }
  const metadataCount = getMetadataContentCount(values);
  if (index === 3 && metadataCount > 0) {
    return `${metadataCount} 项元数据`;
  }
  return '未设置';
};

const getValidatedYamlResource = (yamlValue: string) => {
  let manifest: unknown;
  try {
    manifest = parse(yamlValue);
  } catch {
    message.error('YAML 格式不正确，请检查后重试');
    return undefined;
  }

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    message.error('YAML 内容必须是有效的资源对象');
    return undefined;
  }

  const resource = manifest as Record<string, unknown>;
  const validationError = getEndpointSliceYamlValidationError(resource);
  if (validationError) {
    message.error(validationError);
    return undefined;
  }

  const metadataRecord = getRecordValue(resource.metadata);
  const namespace =
    typeof metadataRecord?.namespace === 'string'
      ? metadataRecord.namespace.trim()
      : '';

  return {
    namespace,
    resource,
  };
};

const CreateEndpointSliceDrawer = ({
  defaultNamespace,
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateEndpointSliceDrawerProps) => {
  const [form] = Form.useForm<CreateEndpointSliceFormValues>();
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
        title: '端点设置',
        icon: <ClusterOutlined />,
      },
      {
        title: '端口设置',
        icon: <ApiOutlined />,
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

    const initialValues = getInitialCreateEndpointSliceValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateEndpointSliceYaml(initialValues));
  }, [defaultNamespace, form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateEndpointSliceYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async (step: number) => {
    await form.validateFields(getEndpointSliceStepFields(step));
    const warning = validateEndpointSliceStep(form.getFieldsValue(true), step);

    if (warning) {
      message.warning(warning);
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (!(await validateCurrentStep(current))) {
      return;
    }
    setCurrent((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    if (yamlMode) {
      const yamlResource = getValidatedYamlResource(yamlValue);
      if (!yamlResource) {
        return;
      }

      await onSubmit({
        type: ENDPOINT_SLICE_RESOURCE_TYPE,
        namespace: yamlResource.namespace,
        manifest: yamlResource.resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    const warning = validateEndpointSliceFormValues(formValues);
    if (warning) {
      message.warning(warning);
      return;
    }

    await onSubmit({
      type: ENDPOINT_SLICE_RESOURCE_TYPE,
      namespace: formValues.namespace,
      manifest: buildCreateEndpointSliceManifest(formValues),
    });
  };

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col md={12} xs={24}>
        <Form.Item
          tooltip="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符。"
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
      <Col md={12} xs={24}>
        <Form.Item
          tooltip="EndpointSlice 是命名空间级资源。"
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
      <Col md={12} xs={24}>
        <Form.Item
          tooltip="将自动输出 metadata.labels.kubernetes.io/service-name。"
          label="关联服务"
          name="serviceName"
          rules={[
            { required: true, whitespace: true, message: '请输入关联服务' },
            { max: 63, message: '服务名称最长 63 个字符' },
            {
              pattern: NAME_PATTERN,
              message:
                '服务名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
            },
          ]}
        >
          <Input placeholder="请输入服务名称" />
        </Form.Item>
      </Col>
      <Col md={12} xs={24}>
        <Form.Item
          tooltip="必须与端点地址格式一致。"
          label="地址类型"
          name="addressType"
          rules={[{ required: true, message: '请选择地址类型' }]}
        >
          <Select options={ADDRESS_TYPE_OPTIONS} placeholder="请选择地址类型" />
        </Form.Item>
      </Col>
    </Row>
  );

  const stepContent = [
    renderBasicInfo,
    () => <EndpointSliceEndpointSettings form={form} />,
    () => <EndpointSlicePortSettings form={form} />,
    () => <EndpointSliceAdvancedSettings />,
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
      title="创建 EndpointSlice"
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
        if (!(await validateCurrentStep(current))) {
          return;
        }
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
            setYamlValue(
              buildCreateEndpointSliceYaml(form.getFieldsValue(true)),
            );
          }
        }}
      >
        {stepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreateEndpointSliceDrawer;
