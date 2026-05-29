import {
  AppstoreOutlined,
  BranchesOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Col,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { parse, stringify } from 'yaml';
import { KeyValueEditor } from '@/components';
import {
  buildNetworkPolicyManifest,
  createKeyValueItem,
  formatSelector,
  getInitialNetworkPolicyValues,
  NAME_PATTERN,
  type NetworkPolicyFormValues,
  toRecord,
} from './helpers';
import PolicyFormDrawer from './PolicyFormDrawer';

type CreateNetworkPolicyDrawerProps = {
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

const getSummary = (values: NetworkPolicyFormValues) => {
  const directionText =
    values.direction === 'Egress'
      ? '出站'
      : values.direction === 'Both'
        ? '入站与出站'
        : '入站';
  const selectorText = formatSelector(toRecord(values.podSelectors));

  if (values.mode === 'allowAll') {
    return `允许匹配 ${selectorText} 的容器组进行全部${directionText}访问。`;
  }
  if (values.mode === 'sameNamespace') {
    return `仅允许同命名空间内的容器组与匹配 ${selectorText} 的容器组进行${directionText}访问。`;
  }

  if (values.peerType === 'ipBlock') {
    return `仅允许 IP 段 ${values.ipBlockCidr || '-'} 与匹配 ${selectorText} 的容器组进行${directionText}访问。`;
  }

  if (values.peerType === 'namespace') {
    return `仅允许 ${values.peerNamespace || '任意命名空间'} 中的容器组与匹配 ${selectorText} 的容器组进行${directionText}访问。`;
  }

  const peerNamespace =
    values.peerType === 'pod'
      ? '同命名空间'
      : values.peerNamespace || '任意命名空间';
  const peerSelector = formatSelector(toRecord(values.peerSelectors));
  return `仅允许 ${peerNamespace} 中匹配 ${peerSelector} 的容器组与匹配 ${selectorText} 的容器组进行${directionText}访问。`;
};

const CreateNetworkPolicyDrawer = ({
  defaultNamespace,
  loading,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateNetworkPolicyDrawerProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<NetworkPolicyFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const steps = useMemo(
    () => [
      { title: '作用对象', icon: <AppstoreOutlined /> },
      { title: '访问规则', icon: <BranchesOutlined /> },
      { title: '规则摘要', icon: <PartitionOutlined /> },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialNetworkPolicyValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(
      stringify(buildNetworkPolicyManifest(initialValues), { indent: 2 }),
    );
  }, [defaultNamespace, form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(
      stringify(buildNetworkPolicyManifest(form.getFieldsValue(true)), {
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

  const validatePodSelector = () => {
    const selector = toRecord(form.getFieldValue('podSelectors'));

    if (Object.keys(selector).length === 0) {
      message.warning('请至少填写一个作用对象标签');
      return false;
    }
    return true;
  };

  const validateCustomPeer = () => {
    const formValues = form.getFieldsValue(true);

    if (formValues.mode !== 'custom') {
      return true;
    }
    if (formValues.peerType === 'ipBlock') {
      if (!formValues.ipBlockCidr?.trim()) {
        message.warning('请输入 IP 段 CIDR');
        return false;
      }
      return true;
    }
    if (formValues.peerType === 'namespace') {
      return true;
    }
    if (Object.keys(toRecord(formValues.peerSelectors)).length === 0) {
      message.warning('请至少填写一个来源/目标 Pod 标签');
      return false;
    }
    return true;
  };

  const getStepFields = () => {
    if (current === 0) {
      return ['name', 'namespace'];
    }
    if (current === 1) {
      return ['mode', 'direction'];
    }
    return [];
  };

  const handleNext = async () => {
    await form.validateFields(getStepFields());
    if (current === 0 && !validatePodSelector()) {
      return;
    }
    if (current === 1 && !validateCustomPeer()) {
      return;
    }
    setCurrent((step) => Math.min(step + 1, steps.length - 1));
  };

  const submitManifest = async (manifest: Record<string, unknown>) => {
    const metadata = getRecordValue(manifest.metadata);
    const namespace =
      typeof metadata?.namespace === 'string' ? metadata.namespace : undefined;

    await onSubmit({
      type: 'NetworkPolicy',
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
    if (!validatePodSelector() || !validateCustomPeer()) {
      return;
    }

    await submitManifest(buildNetworkPolicyManifest(formValues));
  };

  return (
    <PolicyFormDrawer
      current={current}
      loading={loading}
      open={open}
      steps={steps}
      title="新建网络策略"
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
                  <Input placeholder="例如 web-ingress-policy" autoFocus />
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
            <Form.Item label="作用对象标签" name="podSelectors">
              <KeyValueEditor
                addText="添加标签"
                keyPlaceholder="标签 Key，例如 app"
                valuePlaceholder="标签值，例如 web"
                onAddBlocked={() => message.warning('请先填写已有标签 Key')}
                onCreateItem={() => createKeyValueItem()}
              />
            </Form.Item>
          </>
        )}
        {current === 1 && (
          <>
            <Form.Item
              label="策略模板"
              name="mode"
              rules={[{ required: true, message: '请选择策略模板' }]}
            >
              <Radio.Group
                options={[
                  { label: '仅允许同命名空间访问', value: 'sameNamespace' },
                  { label: '仅允许指定来源访问', value: 'custom' },
                  { label: '允许全部访问', value: 'allowAll' },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="生效方向"
              name="direction"
              rules={[{ required: true, message: '请选择生效方向' }]}
            >
              <Radio.Group
                options={[
                  { label: '入站', value: 'Ingress' },
                  { label: '出站', value: 'Egress' },
                  { label: '入站与出站', value: 'Both' },
                ]}
              />
            </Form.Item>
            {values.mode === 'allowAll' && (
              <Alert
                showIcon
                type="warning"
                message="允许全部访问会放开所选容器组的对应方向流量，请确认这符合安全预期。"
              />
            )}
            {values.mode === 'custom' && (
              <>
                <Form.Item
                  label="匹配类型"
                  name="peerType"
                  rules={[{ required: true, message: '请选择匹配类型' }]}
                >
                  <Radio.Group
                    options={[
                      { label: '同命名空间 Pod', value: 'pod' },
                      { label: '命名空间', value: 'namespace' },
                      { label: '指定命名空间 Pod', value: 'podInNamespace' },
                      { label: 'IP 段', value: 'ipBlock' },
                    ]}
                  />
                </Form.Item>
                {(values.peerType === 'namespace' ||
                  values.peerType === 'podInNamespace') && (
                  <Form.Item label="来源/目标命名空间" name="peerNamespace">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={namespaceOptions}
                      placeholder="不选择则匹配任意命名空间"
                    />
                  </Form.Item>
                )}
                {(values.peerType === 'pod' ||
                  values.peerType === 'podInNamespace') && (
                  <Form.Item label="来源/目标 Pod 标签" name="peerSelectors">
                    <KeyValueEditor
                      addText="添加标签"
                      keyPlaceholder="标签 Key，例如 app"
                      valuePlaceholder="标签值，例如 gateway"
                      onAddBlocked={() =>
                        message.warning('请先填写已有标签 Key')
                      }
                      onCreateItem={() => createKeyValueItem()}
                    />
                  </Form.Item>
                )}
                {values.peerType === 'ipBlock' && (
                  <>
                    <Typography.Paragraph type="secondary">
                      IP 段通常用于匹配集群外部 CIDR；Pod IP
                      会随生命周期变化，不建议用作长期策略目标。
                    </Typography.Paragraph>
                    <Form.Item
                      label="IP 段 CIDR"
                      name="ipBlockCidr"
                      rules={[{ required: true, message: '请输入 IP 段 CIDR' }]}
                    >
                      <Input placeholder="例如 10.0.0.0/24" />
                    </Form.Item>
                    <Form.Item label="排除 CIDR" name="ipBlockExcept">
                      <KeyValueEditor
                        addText="添加排除项"
                        keyPlaceholder="排除的 CIDR，例如 10.0.0.5/32"
                        valuePlaceholder="备注，可留空"
                        onAddBlocked={() =>
                          message.warning('请先填写已有 CIDR')
                        }
                        onCreateItem={() => createKeyValueItem()}
                      />
                    </Form.Item>
                  </>
                )}
                <Form.Item label="端口限制" name="ports">
                  <KeyValueEditor
                    addText="添加端口"
                    keyPlaceholder="端口，例如 8080"
                    valuePlaceholder="协议，例如 TCP"
                    onAddBlocked={() => message.warning('请先填写已有端口')}
                    onCreateItem={() => createKeyValueItem('', 'TCP')}
                  />
                </Form.Item>
              </>
            )}
          </>
        )}
        {current === 2 && (
          <>
            <Typography.Paragraph type="secondary">
              即将创建以下网络访问规则：
            </Typography.Paragraph>
            <Typography.Text strong>{getSummary(values)}</Typography.Text>
          </>
        )}
      </Form>
    </PolicyFormDrawer>
  );
};

export default CreateNetworkPolicyDrawer;
