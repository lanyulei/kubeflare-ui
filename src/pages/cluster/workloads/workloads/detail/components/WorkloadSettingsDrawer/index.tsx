import {
  ClockCircleOutlined,
  ClusterOutlined,
  DockerOutlined,
  HddOutlined,
  SaveOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { App, Form } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { SettingsNavDrawerSection } from '@/components';
import { SettingsNavDrawer } from '@/components';
import {
  getClusterWorkloadManifest,
  updateClusterWorkloadManifest,
} from '@/services/kubeflare/cluster/workload';
import { WorkloadContainerEditor } from '../../../components/CreateWorkloadDrawer/ContainerSettings';
import PodGracefulTerminationFields from '../../../components/CreateWorkloadDrawer/PodGracefulTerminationFields';
import PodSchedulingRuleSelector from '../../../components/CreateWorkloadDrawer/PodSchedulingRuleSelector';
import StorageSettings from '../../../components/CreateWorkloadDrawer/StorageSettings';
import type { CreateWorkloadFormValues } from '../../../components/CreateWorkloadDrawer/types';
import WorkloadUpdateStrategySelector from '../../../components/CreateWorkloadDrawer/WorkloadUpdateStrategySelector';
import {
  buildUpdatedWorkloadSettingsManifest,
  getWorkloadSettingsFormValues,
} from './helpers';

type WorkloadSettingKey =
  | 'updateStrategy'
  | 'containers'
  | 'storage'
  | 'scheduling'
  | 'termination';

type WorkloadSettingsDrawerProps = {
  name?: string;
  namespace?: string;
  open: boolean;
  type?: API.ClusterWorkloadType;
  onCancel: () => void;
  onSaved: (workload?: API.ClusterWorkloadItem) => Promise<void> | void;
};

const hasWorkerContainer = (values: CreateWorkloadFormValues) =>
  (values.containers || []).some(
    (container) => container.containerType !== 'init',
  );

const WorkloadSettingsDrawer = ({
  name,
  namespace,
  open,
  type,
  onCancel,
  onSaved,
}: WorkloadSettingsDrawerProps) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateWorkloadFormValues>();
  const [activeKey, setActiveKey] =
    useState<WorkloadSettingKey>('updateStrategy');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manifest, setManifest] = useState<Record<string, unknown>>();

  const sections = useMemo<
    SettingsNavDrawerSection<WorkloadSettingKey>[]
  >(() => {
    if (!type) {
      return [];
    }

    return [
      {
        key: 'updateStrategy',
        icon: <SyncOutlined />,
        title: '更新策略',
        description: '配置工作负载更新容器组副本时采用的策略。',
        content: (
          <WorkloadUpdateStrategySelector
            form={form as FormInstance}
            label="策略类型"
            marginTop={0}
            type={type}
          />
        ),
      },
      {
        key: 'containers',
        icon: <DockerOutlined />,
        title: '容器',
        description: '调整副本数量，并维护容器镜像、端口、资源和高级配置。',
        content: (
          <WorkloadContainerEditor form={form} showTitle={false} type={type} />
        ),
      },
      {
        key: 'storage',
        icon: <HddOutlined />,
        title: '存储',
        description: '为容器组挂载持久卷、临时卷、配置字典或保密字典。',
        content: <StorageSettings form={form} type={type} />,
      },
      {
        key: 'scheduling',
        icon: <ClusterOutlined />,
        title: '容器组调度规则',
        description: '设置容器组副本调度到节点的规则。',
        content: <PodSchedulingRuleSelector label="规则类型" marginTop={0} />,
      },
      {
        key: 'termination',
        icon: <ClockCircleOutlined />,
        title: '容器组优雅终止',
        description: '设置容器终止前等待的时间，超时后容器将强制终止。',
        content: <PodGracefulTerminationFields embedded />,
      },
    ];
  }, [form, type]);

  useEffect(() => {
    if (!open || !type || !namespace || !name) {
      return;
    }

    let ignore = false;

    const fetchManifest = async () => {
      setLoading(true);
      setManifest(undefined);
      setActiveKey('updateStrategy');
      form.resetFields();
      try {
        const res = await getClusterWorkloadManifest({
          type,
          namespace,
          name,
        });
        if (ignore) {
          return;
        }
        const nextManifest = res.data || {};
        setManifest(nextManifest);
        form.setFieldsValue(getWorkloadSettingsFormValues(type, nextManifest));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchManifest();

    return () => {
      ignore = true;
    };
  }, [form, name, namespace, open, type]);

  const handleSubmit = async () => {
    if (!type || !namespace || !name || !manifest) {
      return;
    }

    await form.validateFields();
    const values = form.getFieldsValue(true);

    if (!hasWorkerContainer(values)) {
      message.warning('请至少保留一个工作容器');
      setActiveKey('containers');
      return;
    }

    setSaving(true);
    try {
      const res = await updateClusterWorkloadManifest({
        type,
        namespace,
        name,
        manifest: buildUpdatedWorkloadSettingsManifest(type, manifest, values),
      });
      message.success('工作负载设置已更新');
      await onSaved(res.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" preserve requiredMark>
      <SettingsNavDrawer
        activeKey={activeKey}
        loading={loading}
        okButtonIcon={<SaveOutlined />}
        okButtonLoading={saving}
        open={open}
        sections={sections}
        title="编辑设置"
        onActiveKeyChange={setActiveKey}
        onCancel={onCancel}
        onOk={handleSubmit}
      />
    </Form>
  );
};

export default WorkloadSettingsDrawer;
