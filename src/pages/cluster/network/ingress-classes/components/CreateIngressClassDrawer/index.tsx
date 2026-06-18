import {
  AppstoreOutlined,
  LinkOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Col, Form, Input, message, Row, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import {
  buildCreateIngressClassManifest,
  buildCreateIngressClassYaml,
  getIngressClassStepFields,
  getInitialCreateIngressClassValues,
  hasKeyValueContent,
  INGRESS_CLASS_API_VERSION,
  INGRESS_CLASS_KIND,
  INGRESS_CLASS_RESOURCE_TYPE,
  NAME_PATTERN,
  validateIngressClassFormValues,
  validateIngressClassStep,
} from './helpers';
import IngressClassAdvancedSettings from './IngressClassAdvancedSettings';
import IngressClassParameterSettings from './IngressClassParameterSettings';
import type { CreateIngressClassFormValues } from './types';

type CreateIngressClassDrawerProps = {
  loading?: boolean;
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

const hasBasicInfoContent = (values: CreateIngressClassFormValues) =>
  Boolean(values.name && values.controller);

const hasParameterContent = (values: CreateIngressClassFormValues) =>
  Boolean(
    values.enableParameters === 'true' &&
      (values.parameterApiGroup ||
        values.parameterKind ||
        values.parameterName ||
        values.parameterNamespace ||
        values.parameterScope),
  );

const hasMetadataContent = (values: CreateIngressClassFormValues) =>
  hasKeyValueContent(values.labels) || hasKeyValueContent(values.annotations);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateIngressClassFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && hasBasicInfoContent(values)) {
    return '已设置';
  }
  if (index === 1 && hasParameterContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasMetadataContent(values)) {
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
  const specRecord = getRecordValue(resource.spec);
  const parametersRecord = getRecordValue(specRecord?.parameters);
  const name =
    typeof metadataRecord?.name === 'string' ? metadataRecord.name.trim() : '';
  const namespace =
    typeof metadataRecord?.namespace === 'string'
      ? metadataRecord.namespace.trim()
      : '';
  const kind = typeof resource.kind === 'string' ? resource.kind : '';
  const apiVersion =
    typeof resource.apiVersion === 'string' ? resource.apiVersion : '';
  const controller =
    typeof specRecord?.controller === 'string'
      ? specRecord.controller.trim()
      : '';
  const parameterScope =
    typeof parametersRecord?.scope === 'string'
      ? parametersRecord.scope
      : undefined;
  const parameterNamespace =
    typeof parametersRecord?.namespace === 'string'
      ? parametersRecord.namespace.trim()
      : '';

  if (!name) {
    message.error('YAML 必须包含 metadata.name');
    return undefined;
  }
  if (namespace) {
    message.error('Ingress 类是集群级资源，YAML 不应包含 metadata.namespace');
    return undefined;
  }
  if (kind !== INGRESS_CLASS_KIND) {
    message.error(`YAML kind 必须为 ${INGRESS_CLASS_KIND}`);
    return undefined;
  }
  if (apiVersion !== INGRESS_CLASS_API_VERSION) {
    message.error(`YAML apiVersion 必须为 ${INGRESS_CLASS_API_VERSION}`);
    return undefined;
  }
  if (!controller) {
    message.error('YAML 必须包含 spec.controller');
    return undefined;
  }
  if (
    parametersRecord &&
    (typeof parametersRecord.kind !== 'string' ||
      !parametersRecord.kind.trim() ||
      typeof parametersRecord.name !== 'string' ||
      !parametersRecord.name.trim())
  ) {
    message.error('YAML spec.parameters 必须包含 kind 和 name');
    return undefined;
  }
  if (
    parameterScope !== undefined &&
    parameterScope !== 'Cluster' &&
    parameterScope !== 'Namespace'
  ) {
    message.error('YAML spec.parameters.scope 必须为 Cluster 或 Namespace');
    return undefined;
  }
  if (parameterScope === 'Namespace' && !parameterNamespace) {
    message.error('命名空间级参数引用必须包含 namespace');
    return undefined;
  }
  if (
    parametersRecord &&
    parameterScope !== 'Namespace' &&
    parameterNamespace
  ) {
    message.error('只有 Namespace 作用域的参数引用可以包含 namespace');
    return undefined;
  }

  return resource;
};

const defaultClassOptions = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
];

const CreateIngressClassDrawer = ({
  loading = false,
  open,
  onCancel,
  onSubmit,
}: CreateIngressClassDrawerProps) => {
  const [form] = Form.useForm<CreateIngressClassFormValues>();
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
        title: '参数引用',
        icon: <LinkOutlined />,
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

    const initialValues = getInitialCreateIngressClassValues();
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateIngressClassYaml(initialValues));
  }, [form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateIngressClassYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async (step: number) => {
    await form.validateFields(getIngressClassStepFields(step));
    const warning = validateIngressClassStep(form.getFieldsValue(true), step);

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
      const resource = getValidatedYamlResource(yamlValue);
      if (!resource) {
        return;
      }

      await onSubmit({
        type: INGRESS_CLASS_RESOURCE_TYPE,
        manifest: resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    const warning = validateIngressClassFormValues(formValues);
    if (warning) {
      message.warning(warning);
      return;
    }

    await onSubmit({
      type: INGRESS_CLASS_RESOURCE_TYPE,
      manifest: buildCreateIngressClassManifest(formValues),
    });
  };

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          extra="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
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
          extra="通常为域名路径格式，例如 k8s.io/ingress-nginx。"
          label="控制器"
          name="controller"
          rules={[
            { required: true, whitespace: true, message: '请输入控制器' },
            { max: 250, message: '控制器最长 250 个字符' },
          ]}
        >
          <Input placeholder="请输入控制器" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          extra="设置后会输出 ingressclass.kubernetes.io/is-default-class 注解。"
          label="默认 Ingress 类"
          name="isDefaultClass"
          rules={[{ required: true, message: '请选择是否作为默认类' }]}
        >
          <Select options={defaultClassOptions} placeholder="请选择" />
        </Form.Item>
      </Col>
    </Row>
  );

  const stepContent = [
    renderBasicInfo,
    () => <IngressClassParameterSettings />,
    () => <IngressClassAdvancedSettings />,
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
      title="创建 Ingress 类"
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
              buildCreateIngressClassYaml(form.getFieldsValue(true)),
            );
          }
        }}
      >
        {stepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreateIngressClassDrawer;
