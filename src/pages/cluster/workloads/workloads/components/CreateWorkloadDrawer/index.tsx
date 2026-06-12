import {
  AppstoreOutlined,
  DockerOutlined,
  HddOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Col, Form, Input, message, Row, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import ContainerSettings from './ContainerSettings';
import {
  buildCreateWorkloadManifest,
  buildCreateWorkloadYaml,
  getInitialCreateWorkloadValues,
  getWorkloadApiVersion,
  getWorkloadKind,
  getWorkloadResourceName,
  getWorkloadStepFields,
} from './helpers';
import StorageSettings from './StorageSettings';
import type { CreateWorkloadFormValues } from './types';
import WorkloadAdvancedSettings from './WorkloadAdvancedSettings';

const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

type CreateWorkloadDrawerProps = {
  open: boolean;
  type: API.ClusterWorkloadType;
  namespaceOptions: { label: string; value: string }[];
  defaultNamespace?: string;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    namespace: string;
    name: string;
    manifest: Record<string, unknown>;
  }) => Promise<void>;
};

const hasKeyValueContent = (items?: { keyName?: string }[]) =>
  (items || []).some((item) => item.keyName?.trim());

const hasWorkerContainer = (values: CreateWorkloadFormValues) =>
  (values.containers || []).some(
    (container) => container.containerType !== 'init',
  );

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const hasAdvancedSettingsContent = (
  values: CreateWorkloadFormValues,
  type: API.ClusterWorkloadType,
) =>
  Boolean(
    (type !== 'DaemonSet' &&
      (values.enableNodeSelector ||
        hasKeyValueContent(values.nodeSelectors) ||
        (values.selectedNodeNames && values.selectedNodeNames.length > 0))) ||
      hasKeyValueContent(values.labels) ||
      hasKeyValueContent(values.annotations),
  );

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateWorkloadFormValues,
  type: API.ClusterWorkloadType,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && values.containers && values.containers.length > 0) {
    return '已设置';
  }
  if (
    index === 2 &&
    ((values.storageItems && values.storageItems.length > 0) ||
      (values.storageCategory && values.storageCategory !== 'none'))
  ) {
    return '已设置';
  }
  if (index === 3 && hasAdvancedSettingsContent(values, type)) {
    return '已设置';
  }
  return '未设置';
};

const CreateWorkloadDrawer = ({
  open,
  type,
  namespaceOptions,
  defaultNamespace,
  loading = false,
  onCancel,
  onSubmit,
}: CreateWorkloadDrawerProps) => {
  const [form] = Form.useForm<CreateWorkloadFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const resourceName = getWorkloadResourceName(type);
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '容器组设置',
        icon: <DockerOutlined />,
      },
      {
        title: '存储设置',
        icon: <HddOutlined />,
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

    const initialValues = getInitialCreateWorkloadValues(
      type,
      defaultNamespace,
    );
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateWorkloadYaml(type, initialValues));
  }, [defaultNamespace, form, open, type]);

  const syncYamlFromForm = () => {
    const formValues = form.getFieldsValue(true);
    setYamlValue(buildCreateWorkloadYaml(type, formValues));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const handleNext = async () => {
    if (current === 1 && !form.getFieldValue('containers')?.length) {
      message.warning('请先添加容器并填写容器名称和镜像');
      return;
    }
    if (current === 1 && !hasWorkerContainer(form.getFieldsValue(true))) {
      message.warning('请至少添加一个工作容器');
      return;
    }
    await form.validateFields(getWorkloadStepFields(current, type));
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
      if (kind !== getWorkloadKind(type)) {
        message.error(`YAML kind 必须为 ${getWorkloadKind(type)}`);
        return;
      }
      if (apiVersion !== getWorkloadApiVersion(type)) {
        message.error(`YAML apiVersion 必须为 ${getWorkloadApiVersion(type)}`);
        return;
      }

      await onSubmit({
        name,
        namespace,
        manifest: resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    if (!hasWorkerContainer(formValues)) {
      message.warning('请至少添加一个工作容器');
      return;
    }
    await onSubmit({
      name: formValues.name || '',
      namespace: formValues.namespace || '',
      manifest: buildCreateWorkloadManifest(type, formValues),
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
          <Input placeholder="请输入名称" autoFocus />
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
            options={namespaceOptions}
            optionFilterProp="label"
            placeholder="请选择命名空间"
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderContainerSettings = () => (
    <ContainerSettings form={form} type={type} />
  );

  const renderStorageSettings = () => (
    <StorageSettings form={form} type={type} />
  );

  const renderAdvancedSettings = () => (
    <WorkloadAdvancedSettings form={form} type={type} />
  );

  const stepContent = [
    renderBasicInfo,
    renderContainerSettings,
    renderStorageSettings,
    renderAdvancedSettings,
  ][current];

  return (
    <ResourceCreateWizardDrawer
      current={current}
      getStepDescription={(_, index) =>
        getStepStatusText(current, index, values, type)
      }
      loading={loading}
      open={open}
      steps={steps}
      title={`创建${resourceName}`}
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
        if (current === 1 && !form.getFieldValue('containers')?.length) {
          message.warning('请先添加容器并填写容器名称和镜像');
          return;
        }
        if (current === 1 && !hasWorkerContainer(form.getFieldsValue(true))) {
          message.warning('请至少添加一个工作容器');
          return;
        }
        await form.validateFields(getWorkloadStepFields(current, type));
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
              buildCreateWorkloadYaml(type, form.getFieldsValue(true)),
            );
          }
        }}
      >
        {stepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreateWorkloadDrawer;
