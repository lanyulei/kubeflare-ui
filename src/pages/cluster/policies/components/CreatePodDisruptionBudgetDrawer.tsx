import {
  AppstoreOutlined,
  SafetyCertificateOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parse, stringify } from 'yaml';
import {
  buildPodDisruptionBudgetManifest,
  formatSelector,
  getInitialPodDisruptionBudgetValues,
  NAME_PATTERN,
  type PodDisruptionBudgetFormValues,
} from './helpers';
import PolicyFormDrawer from './PolicyFormDrawer';
import WorkloadTargetSelector from './WorkloadTargetSelector';

type CreatePodDisruptionBudgetDrawerProps = {
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

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const CreatePodDisruptionBudgetDrawer = ({
  defaultNamespace,
  loading,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreatePodDisruptionBudgetDrawerProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<PodDisruptionBudgetFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const selector = Form.useWatch('selector', form);
  const steps = useMemo(
    () => [
      { title: '目标应用', icon: <AppstoreOutlined /> },
      { title: '保护方式', icon: <SafetyCertificateOutlined /> },
      { title: '确认规则', icon: <SlidersOutlined /> },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialPodDisruptionBudgetValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(
      stringify(buildPodDisruptionBudgetManifest(initialValues), {
        indent: 2,
      }),
    );
  }, [defaultNamespace, form, open]);

  const handleTargetChange = useCallback(
    (workload?: API.ClusterWorkloadItem) => {
      form.setFieldValue('selector', workload?.selector || {});
    },
    [form],
  );

  const syncYamlFromForm = () => {
    setYamlValue(
      stringify(buildPodDisruptionBudgetManifest(form.getFieldsValue(true)), {
        indent: 2,
      }),
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
      return ['mode', 'value'];
    }
    return [];
  };

  const handleNext = async () => {
    await form.validateFields(getStepFields());
    if (
      current === 0 &&
      Object.keys(form.getFieldValue('selector') || {}).length === 0
    ) {
      message.warning('目标工作负载缺少可用选择器，无法生成保护规则');
      return;
    }
    setCurrent((step) => Math.min(step + 1, steps.length - 1));
  };

  const submitManifest = async (manifest: Record<string, unknown>) => {
    const metadata = getRecordValue(manifest.metadata);
    const namespace =
      typeof metadata?.namespace === 'string' ? metadata.namespace : undefined;

    await onSubmit({
      type: 'PodDisruptionBudget',
      namespace,
      manifest,
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

    const formValues = await form.validateFields();
    if (!formValues.selector || Object.keys(formValues.selector).length === 0) {
      message.warning('目标工作负载缺少可用选择器，无法生成保护规则');
      return;
    }

    await submitManifest(buildPodDisruptionBudgetManifest(formValues));
  };

  return (
    <PolicyFormDrawer
      current={current}
      loading={loading}
      open={open}
      steps={steps}
      title="新建可用性保护"
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
                  <Input placeholder="例如 web-pdb" autoFocus />
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
              targetKinds={['Deployment', 'StatefulSet', 'DaemonSet']}
              onTargetChange={handleTargetChange}
            />
          </>
        )}
        {current === 1 && (
          <>
            <Form.Item
              label="保护方式"
              name="mode"
              rules={[{ required: true, message: '请选择保护方式' }]}
            >
              <Radio.Group
                options={[
                  { label: '至少保持 N 个可用实例', value: 'minAvailable' },
                  { label: '最多允许 N 个不可用实例', value: 'maxUnavailable' },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="实例数量"
              name="value"
              rules={[{ required: true, message: '请输入实例数量' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
        {current === 2 && (
          <>
            <Typography.Paragraph type="secondary">
              将为匹配以下选择器的容器组创建驱逐保护：
            </Typography.Paragraph>
            <Typography.Text strong>{formatSelector(selector)}</Typography.Text>
          </>
        )}
      </Form>
    </PolicyFormDrawer>
  );
};

export default CreatePodDisruptionBudgetDrawer;
