import {
  AimOutlined,
  AppstoreOutlined,
  LoginOutlined,
  LogoutOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Col, Form, Input, message, Row, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import {
  buildCreateNetworkPolicyManifest,
  buildCreateNetworkPolicyYaml,
  getInitialCreateNetworkPolicyValues,
  getNetworkPolicyStepFields,
  hasMetadataContent,
  hasRulesContent,
  hasSelectorContent,
  NAME_PATTERN,
  NETWORK_POLICY_API_VERSION,
  NETWORK_POLICY_KIND,
  NETWORK_POLICY_RESOURCE_TYPE,
  validateNetworkPolicyFormValues,
  validateNetworkPolicyStep,
} from './helpers';
import NetworkPolicyAdvancedSettings from './NetworkPolicyAdvancedSettings';
import NetworkPolicyRuleSettings from './NetworkPolicyRuleSettings';
import NetworkPolicySelectorSettings from './NetworkPolicySelectorSettings';
import type { CreateNetworkPolicyFormValues } from './types';

type CreateNetworkPolicyDrawerProps = {
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

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateNetworkPolicyFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (
    index === 1 &&
    (hasSelectorContent(values.podSelector) || values.policyTypes?.length)
  ) {
    return '已设置';
  }
  if (index === 2 && hasRulesContent(values.ingress)) {
    return '已设置';
  }
  if (index === 3 && hasRulesContent(values.egress)) {
    return '已设置';
  }
  if (index === 4 && hasMetadataContent(values)) {
    return '已设置';
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
  const metadataRecord = getRecordValue(resource.metadata);
  const name =
    typeof metadataRecord?.name === 'string' ? metadataRecord.name.trim() : '';
  const namespace =
    typeof metadataRecord?.namespace === 'string'
      ? metadataRecord.namespace.trim()
      : '';
  const kind = typeof resource.kind === 'string' ? resource.kind : '';
  const apiVersion =
    typeof resource.apiVersion === 'string' ? resource.apiVersion : '';

  if (!name || !namespace) {
    message.error('YAML 必须包含 metadata.name 和 metadata.namespace');
    return undefined;
  }
  if (kind !== NETWORK_POLICY_KIND) {
    message.error(`YAML kind 必须为 ${NETWORK_POLICY_KIND}`);
    return undefined;
  }
  if (apiVersion !== NETWORK_POLICY_API_VERSION) {
    message.error(`YAML apiVersion 必须为 ${NETWORK_POLICY_API_VERSION}`);
    return undefined;
  }

  return {
    namespace,
    resource,
  };
};

const CreateNetworkPolicyDrawer = ({
  defaultNamespace,
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateNetworkPolicyDrawerProps) => {
  const [form] = Form.useForm<CreateNetworkPolicyFormValues>();
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
        title: 'Pod 选择器',
        icon: <AimOutlined />,
      },
      {
        title: '入站规则',
        icon: <LoginOutlined />,
      },
      {
        title: '出站规则',
        icon: <LogoutOutlined />,
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

    const initialValues = getInitialCreateNetworkPolicyValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateNetworkPolicyYaml(initialValues));
  }, [defaultNamespace, form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateNetworkPolicyYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async (step: number) => {
    await form.validateFields(getNetworkPolicyStepFields(step));
    const warning = validateNetworkPolicyStep(form.getFieldsValue(true), step);

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
        type: NETWORK_POLICY_RESOURCE_TYPE,
        namespace: yamlResource.namespace,
        manifest: yamlResource.resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    const warning = validateNetworkPolicyFormValues(formValues);
    if (warning) {
      message.warning(warning);
      return;
    }

    await onSubmit({
      type: NETWORK_POLICY_RESOURCE_TYPE,
      namespace: formValues.namespace,
      manifest: buildCreateNetworkPolicyManifest(formValues),
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
    () => <NetworkPolicySelectorSettings />,
    () => <NetworkPolicyRuleSettings direction="ingress" form={form} />,
    () => <NetworkPolicyRuleSettings direction="egress" form={form} />,
    () => <NetworkPolicyAdvancedSettings />,
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
      title="创建网络策略"
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
              buildCreateNetworkPolicyYaml(form.getFieldsValue(true)),
            );
          }
        }}
      >
        {stepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreateNetworkPolicyDrawer;
