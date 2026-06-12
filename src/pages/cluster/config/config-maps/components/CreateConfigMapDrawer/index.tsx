import { AppstoreOutlined, DatabaseOutlined } from '@ant-design/icons';
import { Col, Form, Input, message, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import ConfigMapDataSettings from './ConfigMapDataSettings';
import {
  buildCreateConfigMapManifest,
  buildCreateConfigMapYaml,
  CONFIG_MAP_API_VERSION,
  CONFIG_MAP_KIND,
  CONFIG_MAP_NAME_PATTERN,
  CONFIG_MAP_RESOURCE_TYPE,
  getConfigMapStepFields,
  getInitialCreateConfigMapValues,
  hasConfigMapDataContent,
  validateConfigMapDataItems,
} from './helpers';
import type { CreateConfigMapFormValues } from './types';

const useStyles = createStyles(() => ({
  basicFields: {
    width: '100%',
  },
}));

type CreateConfigMapDrawerProps = {
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
  values: CreateConfigMapFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && hasConfigMapDataContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const validateYamlData = (data: unknown) => {
  if (data === undefined) {
    return true;
  }

  const dataRecord = getRecordValue(data);
  if (!dataRecord) {
    message.error('YAML data 必须为键值对象');
    return false;
  }

  const hasInvalidValue = Object.values(dataRecord).some(
    (value) => typeof value !== 'string',
  );
  if (hasInvalidValue) {
    message.error('YAML data 的值必须为字符串');
    return false;
  }

  return true;
};

const CreateConfigMapDrawer = ({
  defaultNamespace,
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateConfigMapDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateConfigMapFormValues>();
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
        title: '数据设置',
        icon: <DatabaseOutlined />,
      },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialCreateConfigMapValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateConfigMapYaml(initialValues));
  }, [defaultNamespace, form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateConfigMapYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    await form.validateFields(getConfigMapStepFields(current));

    if (current === 1) {
      const error = validateConfigMapDataItems(form.getFieldValue('dataItems'));
      if (error) {
        message.warning(error);
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();

    if (!valid) {
      return;
    }

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
        typeof metadataRecord?.name === 'string'
          ? metadataRecord.name.trim()
          : '';
      const namespace =
        typeof metadataRecord?.namespace === 'string'
          ? metadataRecord.namespace.trim()
          : '';
      const kind = typeof resource.kind === 'string' ? resource.kind : '';
      const apiVersion =
        typeof resource.apiVersion === 'string' ? resource.apiVersion : '';

      if (!name || !namespace) {
        message.error('YAML 必须包含 metadata.name 和 metadata.namespace');
        return;
      }
      if (kind !== CONFIG_MAP_KIND) {
        message.error(`YAML kind 必须为 ${CONFIG_MAP_KIND}`);
        return;
      }
      if (apiVersion !== CONFIG_MAP_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${CONFIG_MAP_API_VERSION}`);
        return;
      }
      if (!validateYamlData(resource.data)) {
        return;
      }

      await onSubmit({
        type: CONFIG_MAP_RESOURCE_TYPE,
        namespace,
        manifest: resource,
      });
      return;
    }

    await form.validateFields([
      ...getConfigMapStepFields(0),
      ...getConfigMapStepFields(1),
    ]);
    const formValues = form.getFieldsValue(true);
    const error = validateConfigMapDataItems(formValues.dataItems);

    if (error) {
      message.warning(error);
      return;
    }

    await onSubmit({
      type: CONFIG_MAP_RESOURCE_TYPE,
      namespace: formValues.namespace?.trim(),
      manifest: buildCreateConfigMapManifest(formValues),
    });
  };

  const renderBasicInfo = () => (
    <div className={styles.basicFields}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            tooltip="名称只能包含小写字母、数字和连字符（-），必须以小写字母或数字开头和结尾，最长 63 个字符"
            label="名称"
            name="name"
            rules={[
              { required: true, message: '请输入名称' },
              { max: 63, message: '名称最长 63 个字符' },
              {
                pattern: CONFIG_MAP_NAME_PATTERN,
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
            tooltip="选择将要创建资源的命名空间"
            label="命名空间"
            name="namespace"
            rules={[{ required: true, message: '请选择命名空间' }]}
          >
            <Select
              optionFilterProp="label"
              options={namespaceOptions}
              showSearch
              placeholder="请选择命名空间"
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return renderBasicInfo();
      case 1:
        return <ConfigMapDataSettings />;
      default:
        return null;
    }
  };

  return (
    <ResourceCreateWizardDrawer
      current={current}
      getStepDescription={(_, index) =>
        getStepStatusText(current, index, values)
      }
      loading={loading}
      open={open}
      steps={steps}
      title="创建配置字典"
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

        const valid = await validateCurrentStep();
        if (valid) {
          setCurrent(nextStep);
        }
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
            setYamlValue(buildCreateConfigMapYaml(form.getFieldsValue(true)));
          }
        }}
      >
        {renderStepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreateConfigMapDrawer;
