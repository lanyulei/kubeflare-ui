import {
  AppstoreOutlined,
  BarChartOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, InputNumber, Row, Select, Switch } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { parse, stringify } from 'yaml';
import {
  buildHorizontalPodAutoscalerManifest,
  getInitialHorizontalPodAutoscalerValues,
  type HorizontalPodAutoscalerFormValues,
  NAME_PATTERN,
} from './helpers';
import PolicyFormDrawer from './PolicyFormDrawer';
import WorkloadTargetSelector from './WorkloadTargetSelector';

type CreateHorizontalPodAutoscalerDrawerProps = {
  defaultNamespace?: string;
  loading: boolean;
  namespaceOptions: { label: string; value: string }[];
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    type: API.ClusterResourceCreateType;
    namespace?: string;
    manifest: Record<string, unknown>;
  }) => Promise<void>;
};

const FALLBACK_NAMESPACE = 'default';
const REQUIRED_FORM_FIELDS: (keyof HorizontalPodAutoscalerFormValues)[] = [
  'name',
  'namespace',
  'targetKind',
  'targetName',
  'minReplicas',
  'maxReplicas',
];

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const getStringValue = (
  record: Record<string, unknown> | undefined,
  key: string,
) => {
  const value = record?.[key];

  return typeof value === 'string' ? value.trim() : '';
};

const getNamespaceFromManifest = (manifest: Record<string, unknown>) => {
  const metadata = getRecordValue(manifest.metadata);
  const namespace = getStringValue(metadata, 'namespace');

  return namespace || undefined;
};

const withManifestNamespace = (
  manifest: Record<string, unknown>,
  namespace: string,
) => ({
  ...manifest,
  metadata: {
    ...(getRecordValue(manifest.metadata) || {}),
    namespace,
  },
});

const getHorizontalPodAutoscalerValidationMessage = (
  manifest: Record<string, unknown>,
) => {
  const metadata = getRecordValue(manifest.metadata);
  const spec = getRecordValue(manifest.spec);
  const scaleTargetRef = getRecordValue(spec?.scaleTargetRef);
  const metrics = Array.isArray(spec?.metrics) ? spec.metrics : [];

  if (!getStringValue(metadata, 'name')) {
    return '请输入策略名称';
  }
  if (!getStringValue(scaleTargetRef, 'kind')) {
    return '请选择目标类型';
  }
  if (!getStringValue(scaleTargetRef, 'name')) {
    return '请选择目标工作负载';
  }
  if (metrics.length === 0) {
    return '请至少启用一个触发指标';
  }

  return undefined;
};

const CreateHorizontalPodAutoscalerDrawer = ({
  defaultNamespace,
  loading,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateHorizontalPodAutoscalerDrawerProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<HorizontalPodAutoscalerFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const steps = useMemo(
    () => [
      { title: '目标应用', icon: <AppstoreOutlined /> },
      { title: '副本范围', icon: <SlidersOutlined /> },
      { title: '触发指标', icon: <BarChartOutlined /> },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialHorizontalPodAutoscalerValues(
      defaultNamespace || namespaceOptions[0]?.value || FALLBACK_NAMESPACE,
    );
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(
      stringify(buildHorizontalPodAutoscalerManifest(initialValues), {
        indent: 2,
      }),
    );
  }, [defaultNamespace, form, namespaceOptions, open]);

  const syncYamlFromForm = () => {
    setYamlValue(
      stringify(
        buildHorizontalPodAutoscalerManifest(form.getFieldsValue(true)),
        {
          indent: 2,
        },
      ),
    );
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const getStepFields = () => {
    if (current === 0) {
      return ['name', 'namespace', 'targetKind', 'targetName'];
    }
    if (current === 1) {
      return ['minReplicas', 'maxReplicas'];
    }
    return [];
  };

  const handleNext = async () => {
    await form.validateFields(getStepFields());
    setCurrent((step) => Math.min(step + 1, steps.length - 1));
  };

  const submitManifest = async (manifest: Record<string, unknown>) => {
    const namespace =
      getNamespaceFromManifest(manifest) ||
      form.getFieldValue('namespace') ||
      defaultNamespace ||
      namespaceOptions[0]?.value ||
      FALLBACK_NAMESPACE;
    const nextManifest = withManifestNamespace(manifest, namespace);
    const validationMessage =
      getHorizontalPodAutoscalerValidationMessage(nextManifest);

    if (validationMessage) {
      message.warning(validationMessage);
      return;
    }

    await onSubmit({
      type: 'HorizontalPodAutoscaler',
      namespace,
      manifest: nextManifest,
    });
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
      await submitManifest(manifest as Record<string, unknown>);
      return;
    }

    await form.validateFields(REQUIRED_FORM_FIELDS);
    await form.validateFields();
    const formValues = form.getFieldsValue(true);
    if (!formValues.cpuEnabled && !formValues.memoryEnabled) {
      message.warning('请至少启用一个触发指标');
      return;
    }
    if (
      formValues.minReplicas !== undefined &&
      formValues.maxReplicas !== undefined &&
      formValues.minReplicas > formValues.maxReplicas
    ) {
      message.warning('最小副本数不能大于最大副本数');
      return;
    }

    await submitManifest(buildHorizontalPodAutoscalerManifest(formValues));
  };

  return (
    <PolicyFormDrawer
      current={current}
      loading={loading}
      open={open}
      steps={steps}
      title="新建自动伸缩策略"
      yamlMode={yamlMode}
      yamlValue={yamlValue}
      onCancel={onCancel}
      onChangeYaml={setYamlValue}
      onNext={handleNext}
      onPrev={() => setCurrent((step) => Math.max(step - 1, 0))}
      onSubmit={handleSubmit}
      onStepChange={setCurrent}
      onYamlModeChange={handleYamlModeChange}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark
        onValuesChange={() => {
          if (!yamlMode) {
            syncYamlFromForm();
          }
        }}
      >
        {current === 0 && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="策略名称"
                  name="name"
                  rules={[
                    { required: true, message: '请输入策略名称' },
                    { max: 63, message: '名称最长 63 个字符' },
                    {
                      pattern: NAME_PATTERN,
                      message:
                        '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
                    },
                  ]}
                >
                  <Input placeholder="例如 web-hpa" autoFocus />
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
                    onChange={() => {
                      form.setFieldValue('targetName', undefined);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <WorkloadTargetSelector
              form={form}
              namespaceOptions={namespaceOptions}
              targetKinds={['Deployment', 'StatefulSet']}
            />
          </>
        )}
        {current === 1 && (
          <>
            <Form.Item
              label="最小副本数"
              name="minReplicas"
              rules={[{ required: true, message: '请输入最小副本数' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="最大副本数"
              name="maxReplicas"
              rules={[{ required: true, message: '请输入最大副本数' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
        {current === 2 && (
          <>
            <Form.Item
              label="CPU 使用率"
              name="cpuEnabled"
              valuePropName="checked"
            >
              <Switch checkedChildren="启用" unCheckedChildren="关闭" />
            </Form.Item>
            {values.cpuEnabled && (
              <Form.Item
                label="CPU 目标使用率"
                name="cpuAverageUtilization"
                rules={[{ required: true, message: '请输入 CPU 目标使用率' }]}
              >
                <InputNumber
                  addonAfter="%"
                  min={1}
                  max={100}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}
            <Form.Item
              label="内存使用率"
              name="memoryEnabled"
              valuePropName="checked"
            >
              <Switch checkedChildren="启用" unCheckedChildren="关闭" />
            </Form.Item>
            {values.memoryEnabled && (
              <Form.Item
                label="内存目标使用率"
                name="memoryAverageUtilization"
                rules={[{ required: true, message: '请输入内存目标使用率' }]}
              >
                <InputNumber
                  addonAfter="%"
                  min={1}
                  max={100}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}
          </>
        )}
      </Form>
    </PolicyFormDrawer>
  );
};

export default CreateHorizontalPodAutoscalerDrawer;
