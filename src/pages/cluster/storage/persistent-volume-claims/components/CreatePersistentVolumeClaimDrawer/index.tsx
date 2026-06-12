import {
  AppstoreOutlined,
  HddOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Col, Form, Input, message, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import { getClusterStorageClassList } from '@/services/kubeflare/cluster/resource';
import {
  buildCreatePersistentVolumeClaimManifest,
  buildCreatePersistentVolumeClaimYaml,
  getInitialPersistentVolumeClaimValues,
  getModeDescription,
  getPersistentVolumeClaimStepFields,
  NAME_PATTERN,
  PVC_API_VERSION,
  PVC_KIND,
  PVC_RESOURCE_TYPE,
} from './helpers';
import PersistentVolumeClaimAdvancedSettings from './PersistentVolumeClaimAdvancedSettings';
import PersistentVolumeClaimStorageSettings from './PersistentVolumeClaimStorageSettings';
import type { CreatePersistentVolumeClaimFormValues } from './types';

const useStyles = createStyles(() => ({
  basicFields: {
    width: '100%',
  },
}));

type CreatePersistentVolumeClaimDrawerProps = {
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

const hasBasicInfoContent = (values: CreatePersistentVolumeClaimFormValues) =>
  Boolean(values.name && values.namespace);

const hasStorageContent = (values: CreatePersistentVolumeClaimFormValues) =>
  Boolean(
    values.createMode &&
      values.accessModes?.length &&
      values.storageSizeGi &&
      (values.createMode === 'storageClass'
        ? values.storageClassName
        : values.volumeName),
  );

const hasAdvancedContent = (values: CreatePersistentVolumeClaimFormValues) =>
  hasKeyValueContent(values.labels) || hasKeyValueContent(values.annotations);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreatePersistentVolumeClaimFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && hasBasicInfoContent(values)) {
    return '已设置';
  }
  if (index === 1 && hasStorageContent(values)) {
    return getModeDescription(values.createMode);
  }
  if (index === 2 && hasAdvancedContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const CreatePersistentVolumeClaimDrawer = ({
  defaultNamespace,
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreatePersistentVolumeClaimDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreatePersistentVolumeClaimFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const [storageClasses, setStorageClasses] = useState<
    API.ClusterStorageClassItem[]
  >([]);
  const [storageClassLoading, setStorageClassLoading] = useState(false);
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
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

  const fetchStorageClasses = useCallback(async () => {
    setStorageClassLoading(true);
    try {
      const res = await getClusterStorageClassList({ limit: 500 });
      setStorageClasses(res.data?.items || []);
    } catch {
      message.error('获取存储类失败');
    } finally {
      setStorageClassLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues =
      getInitialPersistentVolumeClaimValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreatePersistentVolumeClaimYaml(initialValues));
    fetchStorageClasses();
  }, [defaultNamespace, fetchStorageClasses, form, open]);

  useEffect(() => {
    if (
      open &&
      storageClasses.length > 0 &&
      !form.getFieldValue('storageClassName')
    ) {
      form.setFieldValue('storageClassName', storageClasses[0].name);
    }
  }, [form, open, storageClasses]);

  const syncYamlFromForm = () => {
    setYamlValue(
      buildCreatePersistentVolumeClaimYaml(form.getFieldsValue(true)),
    );
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    await form.validateFields(
      getPersistentVolumeClaimStepFields(current, form.getFieldsValue(true)),
    );
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
      if (kind !== PVC_KIND) {
        message.error(`YAML kind 必须为 ${PVC_KIND}`);
        return;
      }
      if (apiVersion !== PVC_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${PVC_API_VERSION}`);
        return;
      }

      await onSubmit({
        type: PVC_RESOURCE_TYPE,
        namespace,
        manifest: resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    await onSubmit({
      type: PVC_RESOURCE_TYPE,
      namespace: formValues.namespace,
      manifest: buildCreatePersistentVolumeClaimManifest(formValues),
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
              placeholder="请选择命名空间"
              showSearch
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
        return (
          <PersistentVolumeClaimStorageSettings
            form={form}
            loading={storageClassLoading}
            storageClasses={storageClasses}
          />
        );
      case 2:
        return <PersistentVolumeClaimAdvancedSettings form={form} />;
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
      title="创建持久卷声明"
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
            setYamlValue(
              buildCreatePersistentVolumeClaimYaml(form.getFieldsValue(true)),
            );
          }
        }}
      >
        {renderStepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreatePersistentVolumeClaimDrawer;
