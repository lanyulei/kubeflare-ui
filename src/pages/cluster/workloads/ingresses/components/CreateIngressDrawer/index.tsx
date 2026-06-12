import {
  AppstoreOutlined,
  GlobalOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Col, Form, Input, message, Row, Select } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import { getClusterServiceList } from '@/services/kubeflare/cluster/resource';
import {
  buildCreateIngressManifest,
  buildCreateIngressYaml,
  getIngressStepFields,
  getInitialCreateIngressValues,
  INGRESS_API_VERSION,
  INGRESS_KIND,
  INGRESS_RESOURCE_TYPE,
  isValidIngressRule,
  NAME_PATTERN,
} from './helpers';
import IngressAdvancedSettings from './IngressAdvancedSettings';
import IngressRuleSettings from './IngressRuleSettings';
import type { CreateIngressFormValues, IngressServiceOption } from './types';

type CreateIngressDrawerProps = {
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

const hasRouteRuleContent = (values: CreateIngressFormValues) =>
  (values.rules || []).some(isValidIngressRule) || values.enablePathRewrite;

const hasAdvancedSettingsContent = (values: CreateIngressFormValues) =>
  hasKeyValueContent(values.labels) || hasKeyValueContent(values.annotations);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateIngressFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && hasRouteRuleContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasAdvancedSettingsContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const CreateIngressDrawer = ({
  defaultNamespace,
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateIngressDrawerProps) => {
  const [form] = Form.useForm<CreateIngressFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const [serviceOptions, setServiceOptions] = useState<IngressServiceOption[]>(
    [],
  );
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const namespace = Form.useWatch('namespace', { form, preserve: true });
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '路由规则',
        icon: <GlobalOutlined />,
      },
      {
        title: '高级设置',
        icon: <SlidersOutlined />,
      },
    ],
    [],
  );

  const loadServiceOptions = useCallback(async (nextNamespace?: string) => {
    if (!nextNamespace) {
      setServiceOptions([]);
      return;
    }

    const res = await getClusterServiceList({ namespace: nextNamespace });
    setServiceOptions(
      (res.data.items || []).flatMap((item) =>
        item.name && item.name !== '-'
          ? [
              {
                label: item.name,
                ports: (item.ports || []).flatMap((port) => {
                  const options: { label: string; value: number | string }[] =
                    [];
                  if (port.name) {
                    options.push({
                      label: `${port.name} (${port.port || '-'})`,
                      value: port.name,
                    });
                  }
                  if (port.port) {
                    options.push({
                      label: String(port.port),
                      value: port.port,
                    });
                  }
                  return options;
                }),
                value: item.name,
              },
            ]
          : [],
      ),
    );
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialCreateIngressValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateIngressYaml(initialValues));
    loadServiceOptions(defaultNamespace);
  }, [defaultNamespace, form, loadServiceOptions, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    loadServiceOptions(namespace);
  }, [loadServiceOptions, namespace, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateIngressYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const handleNext = async () => {
    await form.validateFields(getIngressStepFields(current));
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
      const namespaceValue =
        typeof metadataRecord?.namespace === 'string'
          ? metadataRecord.namespace
          : '';
      const kind = typeof resource.kind === 'string' ? resource.kind : '';
      const apiVersion =
        typeof resource.apiVersion === 'string' ? resource.apiVersion : '';

      if (!name || !namespaceValue) {
        message.error('YAML 必须包含 metadata.name 和 metadata.namespace');
        return;
      }
      if (kind !== INGRESS_KIND) {
        message.error(`YAML kind 必须为 ${INGRESS_KIND}`);
        return;
      }
      if (apiVersion !== INGRESS_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${INGRESS_API_VERSION}`);
        return;
      }

      await onSubmit({
        type: INGRESS_RESOURCE_TYPE,
        namespace: namespaceValue,
        manifest: resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    await onSubmit({
      type: INGRESS_RESOURCE_TYPE,
      namespace: formValues.namespace,
      manifest: buildCreateIngressManifest(formValues),
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
    () => <IngressRuleSettings form={form} serviceOptions={serviceOptions} />,
    () => <IngressAdvancedSettings form={form} />,
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
      title="创建应用路由"
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
        await form.validateFields(getIngressStepFields(current));
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
            setYamlValue(buildCreateIngressYaml(form.getFieldsValue(true)));
          }
        }}
      >
        {stepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreateIngressDrawer;
