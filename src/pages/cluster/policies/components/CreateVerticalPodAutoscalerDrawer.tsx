import {
  AppstoreOutlined,
  ControlOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { App, Col, Form, Input, Row, Select, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { parse, stringify } from 'yaml';
import {
  buildVerticalPodAutoscalerManifest,
  getInitialVerticalPodAutoscalerValues,
  NAME_PATTERN,
  type VerticalPodAutoscalerFormValues,
} from './helpers';
import PolicyFormDrawer from './PolicyFormDrawer';
import WorkloadTargetSelector from './WorkloadTargetSelector';

type CreateVerticalPodAutoscalerDrawerProps = {
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

const CreateVerticalPodAutoscalerDrawer = ({
  defaultNamespace,
  loading,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateVerticalPodAutoscalerDrawerProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<VerticalPodAutoscalerFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const steps = useMemo(
    () => [
      { title: '目标应用', icon: <AppstoreOutlined /> },
      { title: '调整策略', icon: <SlidersOutlined /> },
      { title: '资源范围', icon: <ControlOutlined /> },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues =
      getInitialVerticalPodAutoscalerValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(
      stringify(buildVerticalPodAutoscalerManifest(initialValues), {
        indent: 2,
      }),
    );
  }, [defaultNamespace, form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(
      stringify(buildVerticalPodAutoscalerManifest(form.getFieldsValue(true)), {
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
      return ['updateMode'];
    }
    return ['controlledResources'];
  };

  const handleNext = async () => {
    await form.validateFields(getStepFields());
    setCurrent((step) => Math.min(step + 1, steps.length - 1));
  };

  const submitManifest = async (manifest: Record<string, unknown>) => {
    const metadata = getRecordValue(manifest.metadata);
    const namespace =
      typeof metadata?.namespace === 'string' ? metadata.namespace : undefined;

    await onSubmit({
      type: 'VerticalPodAutoscaler',
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
    await submitManifest(buildVerticalPodAutoscalerManifest(formValues));
  };

  return (
    <PolicyFormDrawer
      current={current}
      loading={loading}
      open={open}
      steps={steps}
      title="新建资源建议策略"
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
                  <Input placeholder="例如 web-vpa" autoFocus />
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
              label="更新模式"
              name="updateMode"
              rules={[{ required: true, message: '请选择更新模式' }]}
            >
              <Select
                options={[
                  { label: '仅推荐，不自动修改（Off）', value: 'Off' },
                  { label: '仅新建容器组生效（Initial）', value: 'Initial' },
                  {
                    label: '可重建容器组后生效（Recreate）',
                    value: 'Recreate',
                  },
                  {
                    label: '优先原地调整，失败后重建（InPlaceOrRecreate）',
                    value: 'InPlaceOrRecreate',
                  },
                ]}
              />
            </Form.Item>
            <Typography.Paragraph type="secondary">
              Kubernetes 官方已不建议继续使用 Auto。需要零自动变更时请选择
              Off，仅把推荐值用于观察和人工评估。
            </Typography.Paragraph>
          </>
        )}
        {current === 2 && (
          <Form.Item
            label="受控资源"
            name="controlledResources"
            rules={[{ required: true, message: '请选择受控资源' }]}
          >
            <Select
              mode="multiple"
              options={[
                { label: 'CPU', value: 'cpu' },
                { label: '内存', value: 'memory' },
              ]}
              placeholder="请选择需要推荐或调整的资源"
            />
          </Form.Item>
        )}
      </Form>
    </PolicyFormDrawer>
  );
};

export default CreateVerticalPodAutoscalerDrawer;
