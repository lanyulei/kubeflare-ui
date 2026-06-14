import {
  AppstoreOutlined,
  DeploymentUnitOutlined,
  LineChartOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Col, Form, Input, message, Row, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import BehaviorSettings from './BehaviorSettings';
import {
  buildCreateHpaManifest,
  buildCreateHpaYaml,
  getHpaStepFields,
  getInitialCreateHpaValues,
  HPA_API_VERSION,
  HPA_KIND,
  HPA_RESOURCE_TYPE,
  NAME_PATTERN,
} from './helpers';
import MetricSettings from './MetricSettings';
import TargetSettings from './TargetSettings';
import type {
  CreateHorizontalPodAutoscalerFormValues,
  HpaScalingPolicyItem,
} from './types';

type CreateHorizontalPodAutoscalerDrawerProps = {
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

const hasPolicyContent = (items?: HpaScalingPolicyItem[]) =>
  (items || []).some((item) => item.type && item.value && item.periodSeconds);

const hasMetricsContent = (values: CreateHorizontalPodAutoscalerFormValues) =>
  typeof values.maxReplicas === 'number' &&
  (values.metrics || []).some((item) => item.type);

const hasBehaviorContent = (values: CreateHorizontalPodAutoscalerFormValues) =>
  values.enableScaleUpBehavior ||
  values.enableScaleDownBehavior ||
  (values.enableScaleUpBehavior && hasPolicyContent(values.scaleUpPolicies)) ||
  (values.enableScaleDownBehavior &&
    hasPolicyContent(values.scaleDownPolicies)) ||
  hasKeyValueContent(values.labels) ||
  hasKeyValueContent(values.annotations);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateHorizontalPodAutoscalerFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && values.targetKind && values.targetName) {
    return '已设置';
  }
  if (index === 2 && hasMetricsContent(values)) {
    return '已设置';
  }
  if (index === 3 && hasBehaviorContent(values)) {
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
    return undefined;
  }
  if (kind !== HPA_KIND) {
    message.error(`YAML kind 必须为 ${HPA_KIND}`);
    return undefined;
  }
  if (apiVersion !== HPA_API_VERSION) {
    message.error(`YAML apiVersion 必须为 ${HPA_API_VERSION}`);
    return undefined;
  }

  return {
    namespace,
    resource,
  };
};

const CreateHorizontalPodAutoscalerDrawer = ({
  defaultNamespace,
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateHorizontalPodAutoscalerDrawerProps) => {
  const [form] = Form.useForm<CreateHorizontalPodAutoscalerFormValues>();
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
        title: '伸缩目标',
        icon: <DeploymentUnitOutlined />,
      },
      {
        title: '伸缩指标',
        icon: <LineChartOutlined />,
      },
      {
        title: '行为策略',
        icon: <SlidersOutlined />,
      },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialCreateHpaValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateHpaYaml(initialValues));
  }, [defaultNamespace, form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateHpaYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const handleNext = async () => {
    await form.validateFields(getHpaStepFields(current));
    setCurrent((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    if (yamlMode) {
      const yamlResource = getValidatedYamlResource(yamlValue);
      if (!yamlResource) {
        return;
      }

      await onSubmit({
        type: HPA_RESOURCE_TYPE,
        namespace: yamlResource.namespace,
        manifest: yamlResource.resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    await onSubmit({
      type: HPA_RESOURCE_TYPE,
      namespace: formValues.namespace,
      manifest: buildCreateHpaManifest(formValues),
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
    () => <TargetSettings form={form} onTargetChange={syncYamlFromForm} />,
    () => <MetricSettings form={form} />,
    () => <BehaviorSettings form={form} />,
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
      title="创建水平伸缩"
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
        await form.validateFields(getHpaStepFields(current));
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
            setYamlValue(buildCreateHpaYaml(form.getFieldsValue(true)));
          }
        }}
      >
        {stepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreateHorizontalPodAutoscalerDrawer;
