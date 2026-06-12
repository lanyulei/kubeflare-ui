import { AppstoreOutlined, KeyOutlined } from '@ant-design/icons';
import { Col, Form, Input, message, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import {
  buildCreateSecretManifest,
  buildCreateSecretYaml,
  getInitialCreateSecretValues,
  getSecretStepFields,
  hasSecretDataSettingsContent,
  NAME_PATTERN,
  SECRET_API_VERSION,
  SECRET_KIND,
  SECRET_RESOURCE_TYPE,
  validateSecretDataItems,
} from './helpers';
import SecretDataSettings from './SecretDataSettings';
import type { CreateSecretFormValues } from './types';

const useStyles = createStyles(() => ({
  basicFields: {
    width: '100%',
  },
}));

type CreateSecretDrawerProps = {
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
  values: Partial<CreateSecretFormValues>,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && hasSecretDataSettingsContent(values)) {
    return '已设置';
  }

  return '未设置';
};

const CreateSecretDrawer = ({
  defaultNamespace,
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateSecretDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateSecretFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const secretType = values.type || 'Opaque';
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '数据设置',
        icon: <KeyOutlined />,
      },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialCreateSecretValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateSecretYaml(initialValues));
  }, [defaultNamespace, form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateSecretYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    await form.validateFields(getSecretStepFields(current, secretType));
    if (current === 1 && secretType === 'Opaque') {
      const error = validateSecretDataItems(form.getFieldValue('dataItems'));

      if (error) {
        form.setFields([{ name: 'dataItems', errors: [error] }]);
        throw new Error(error);
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
      if (kind !== SECRET_KIND) {
        message.error(`YAML kind 必须为 ${SECRET_KIND}`);
        return;
      }
      if (apiVersion !== SECRET_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${SECRET_API_VERSION}`);
        return;
      }

      await onSubmit({
        type: SECRET_RESOURCE_TYPE,
        namespace,
        manifest: resource,
      });
      return;
    }

    await form.validateFields([
      ...getSecretStepFields(0, secretType),
      ...getSecretStepFields(1, secretType),
    ]);
    const formValues = form.getFieldsValue(true);
    if (formValues.type === 'Opaque') {
      const error = validateSecretDataItems(formValues.dataItems);

      if (error) {
        form.setFields([{ name: 'dataItems', errors: [error] }]);
        message.warning(error);
        return;
      }
    }

    await onSubmit({
      type: SECRET_RESOURCE_TYPE,
      namespace: formValues.namespace,
      manifest: buildCreateSecretManifest(formValues),
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
    if (current === 0) {
      return renderBasicInfo();
    }

    return <SecretDataSettings form={form} />;
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
      title="创建保密字典"
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
            setYamlValue(buildCreateSecretYaml(form.getFieldsValue(true)));
          }
        }}
      >
        {renderStepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreateSecretDrawer;
