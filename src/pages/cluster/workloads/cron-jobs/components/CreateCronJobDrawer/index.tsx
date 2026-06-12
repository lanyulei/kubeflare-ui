import {
  AppstoreOutlined,
  DockerOutlined,
  HddOutlined,
  SettingOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Form, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { ResourceCreateWizardDrawer } from '@/components';
import JobPodSettings from '../../../jobs/components/CreateJobDrawer/JobPodSettings';
import JobStrategySettings from '../../../jobs/components/CreateJobDrawer/JobStrategySettings';
import StorageSettings from '../../../workloads/components/CreateWorkloadDrawer/StorageSettings';
import type { CreateWorkloadFormValues } from '../../../workloads/components/CreateWorkloadDrawer/types';
import WorkloadAdvancedSettings from '../../../workloads/components/CreateWorkloadDrawer/WorkloadAdvancedSettings';
import CronJobBasicSettings from './CronJobBasicSettings';
import {
  buildCreateCronJobManifest,
  buildCreateCronJobYaml,
  CRON_JOB_API_VERSION,
  CRON_JOB_KIND,
  CRON_JOB_RESOURCE_TYPE,
  getCronJobStepFields,
  getInitialCreateCronJobValues,
  WORKLOAD_FORM_TYPE,
} from './helpers';
import type { CreateCronJobFormValues } from './types';

type CreateCronJobDrawerProps = {
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

const hasWorkerContainer = (values: CreateCronJobFormValues) =>
  (values.containers || []).some(
    (container) => container.containerType !== 'init',
  );

const hasCronJobBasicAdvancedContent = (values: CreateCronJobFormValues) =>
  Boolean(
    values.concurrencyPolicy ||
      values.timeZone ||
      [
        values.startingDeadlineSeconds,
        values.successfulJobsHistoryLimit,
        values.failedJobsHistoryLimit,
      ].some((value) => typeof value === 'number' && Number.isFinite(value)),
  );

const hasPolicySettingsContent = (values: CreateCronJobFormValues) =>
  [
    values.backoffLimit,
    values.completions,
    values.parallelism,
    values.activeDeadlineSeconds,
  ].some((value) => typeof value === 'number' && Number.isFinite(value));

const hasAdvancedSettingsContent = (values: CreateCronJobFormValues) =>
  Boolean(
    values.enableNodeSelector ||
      hasKeyValueContent(values.nodeSelectors) ||
      (values.selectedNodeNames && values.selectedNodeNames.length > 0) ||
      hasKeyValueContent(values.labels) ||
      hasKeyValueContent(values.annotations),
  );

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateCronJobFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (
    index === 0 &&
    values.name &&
    values.namespace &&
    values.schedule &&
    hasCronJobBasicAdvancedContent(values)
  ) {
    return '已设置';
  }
  if (index === 1 && hasPolicySettingsContent(values)) {
    return '已设置';
  }
  if (index === 2 && values.containers && values.containers.length > 0) {
    return '已设置';
  }
  if (
    index === 3 &&
    ((values.storageItems && values.storageItems.length > 0) ||
      (values.storageCategory && values.storageCategory !== 'none'))
  ) {
    return '已设置';
  }
  if (index === 4 && hasAdvancedSettingsContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const CreateCronJobDrawer = ({
  defaultNamespace,
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateCronJobDrawerProps) => {
  const [form] = Form.useForm<CreateCronJobFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const workloadForm =
    form as unknown as FormInstance<CreateWorkloadFormValues>;
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '策略设置',
        icon: <SettingOutlined />,
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

    const initialValues = getInitialCreateCronJobValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateCronJobYaml(initialValues));
  }, [defaultNamespace, form, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateCronJobYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const validateCurrentStep = async () => {
    if (current === 2 && !form.getFieldValue('containers')?.length) {
      message.warning('请先添加容器并填写容器名称和镜像');
      return false;
    }
    if (current === 2 && !hasWorkerContainer(form.getFieldsValue(true))) {
      message.warning('请至少添加一个工作容器');
      return false;
    }
    await form.validateFields(getCronJobStepFields(current));
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
      if (kind !== CRON_JOB_KIND) {
        message.error(`YAML kind 必须为 ${CRON_JOB_KIND}`);
        return;
      }
      if (apiVersion !== CRON_JOB_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${CRON_JOB_API_VERSION}`);
        return;
      }

      await onSubmit({
        type: CRON_JOB_RESOURCE_TYPE,
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
      type: CRON_JOB_RESOURCE_TYPE,
      namespace: formValues.namespace,
      manifest: buildCreateCronJobManifest(formValues),
    });
  };

  const renderStorageSettings = () => (
    <StorageSettings form={workloadForm} type={WORKLOAD_FORM_TYPE} />
  );

  const renderAdvancedSettings = () => (
    <WorkloadAdvancedSettings form={workloadForm} type={WORKLOAD_FORM_TYPE} />
  );

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return <CronJobBasicSettings namespaceOptions={namespaceOptions} />;
      case 1:
        return <JobStrategySettings />;
      case 2:
        return <JobPodSettings form={form} />;
      case 3:
        return renderStorageSettings();
      case 4:
        return renderAdvancedSettings();
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
      title="创建定时任务"
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
            setYamlValue(buildCreateCronJobYaml(form.getFieldsValue(true)));
          }
        }}
      >
        {renderStepContent()}
      </Form>
    </ResourceCreateWizardDrawer>
  );
};

export default CreateCronJobDrawer;
