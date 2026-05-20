import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, InputNumber } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import ContainerConfigModal from './ContainerConfigModal';
import type { ContainerSummaryItem } from './ContainerSummaryList';
import ContainerSummaryList from './ContainerSummaryList';
import PodGracefulTerminationFields from './PodGracefulTerminationFields';
import PodMetadataFields from './PodMetadataFields';
import PodSchedulingRuleSelector from './PodSchedulingRuleSelector';
import PodSecurityContextFields from './PodSecurityContextFields';
import type { CreateWorkloadFormValues } from './types';
import WorkloadUpdateStrategySelector from './WorkloadUpdateStrategySelector';

const CONTAINER_FIELD_NAMES: (keyof CreateWorkloadFormValues)[] = [
  'containerName',
  'containerType',
  'image',
  'imagePullPolicy',
  'cpuRequest',
  'cpuLimit',
  'memoryRequest',
  'memoryLimit',
  'containerPorts',
  'containerPort',
  'protocol',
  'enableHealthCheck',
  'healthChecks',
  'enableLifecycle',
  'lifecycleActions',
  'postStartCommand',
  'preStopCommand',
  'enableStartupCommand',
  'startupCommand',
  'startupArgs',
  'enableContainerEnv',
  'containerEnv',
  'enableContainerSecurityContext',
  'containerPrivileged',
  'containerRunAsNonRoot',
  'containerRunAsUser',
  'containerRunAsGroup',
  'containerReadOnlyRootFilesystem',
  'allowPrivilegeEscalation',
  'containerSeLinuxLevel',
  'containerSeLinuxRole',
  'containerSeLinuxType',
  'containerSeLinuxUser',
  'containerCapabilitiesAdd',
  'containerCapabilitiesDrop',
  'containerSeccompProfileType',
  'containerSeccompProfileLocalhost',
  'syncHostTimezone',
];
const CONTAINER_VALIDATE_FIELD_NAMES: NamePath[] = [
  'containerName',
  'image',
  'containerPorts',
  'cpuRequest',
  'cpuLimit',
  'memoryRequest',
  'memoryLimit',
  ['healthChecks', 'liveness', 'path'],
  ['healthChecks', 'liveness', 'port'],
  ['healthChecks', 'liveness', 'command'],
  ['healthChecks', 'liveness', 'initialDelaySeconds'],
  ['healthChecks', 'liveness', 'timeoutSeconds'],
  ['healthChecks', 'liveness', 'periodSeconds'],
  ['healthChecks', 'liveness', 'successThreshold'],
  ['healthChecks', 'liveness', 'failureThreshold'],
  ['healthChecks', 'readiness', 'path'],
  ['healthChecks', 'readiness', 'port'],
  ['healthChecks', 'readiness', 'command'],
  ['healthChecks', 'readiness', 'initialDelaySeconds'],
  ['healthChecks', 'readiness', 'timeoutSeconds'],
  ['healthChecks', 'readiness', 'periodSeconds'],
  ['healthChecks', 'readiness', 'successThreshold'],
  ['healthChecks', 'readiness', 'failureThreshold'],
  ['healthChecks', 'startup', 'path'],
  ['healthChecks', 'startup', 'port'],
  ['healthChecks', 'startup', 'command'],
  ['healthChecks', 'startup', 'initialDelaySeconds'],
  ['healthChecks', 'startup', 'timeoutSeconds'],
  ['healthChecks', 'startup', 'periodSeconds'],
  ['healthChecks', 'startup', 'successThreshold'],
  ['healthChecks', 'startup', 'failureThreshold'],
  ['lifecycleActions', 'postStart', 'path'],
  ['lifecycleActions', 'postStart', 'port'],
  ['lifecycleActions', 'postStart', 'command'],
  ['lifecycleActions', 'preStop', 'path'],
  ['lifecycleActions', 'preStop', 'port'],
  ['lifecycleActions', 'preStop', 'command'],
  'containerEnv',
  'containerRunAsUser',
  'containerRunAsGroup',
  'containerSeccompProfileLocalhost',
];

const useStyles = createStyles(({ token }) => ({
  replicaPanel: {
    display: 'inline-flex',
    minWidth: 324,
    flexDirection: 'column',
    alignItems: 'center',
    gap: token.marginSM,
    marginBottom: `16px`,
    padding: `${token.paddingSM}px ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,

    '@media (max-width: 576px)': {
      width: '100%',
      minWidth: 0,
    },
  },
  replicaLabel: {
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
  },
  replicaControl: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: '40px minmax(120px, 1fr) 40px',
    alignItems: 'center',
    gap: token.margin,
  },
  stepButton: {
    color: token.colorTextSecondary,
  },
  replicaInput: {
    width: '100%',

    '.ant-input-number-input': {
      textAlign: 'center',
    },
  },
  containerTitle: {
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type ContainerSettingsProps = {
  form: FormInstance<CreateWorkloadFormValues>;
  type: API.ClusterWorkloadType;
};

const createRandomContainerName = () => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const suffix = Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');

  return `container-${suffix}`;
};

const ContainerSettings = ({ form, type }: ContainerSettingsProps) => {
  const { styles } = useStyles();
  const [showContainerForm, setShowContainerForm] = useState(false);
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const containerSnapshotRef = useRef<Partial<CreateWorkloadFormValues>>({});
  const containerName = Form.useWatch('containerName', {
    form,
    preserve: true,
  });
  const image = Form.useWatch('image', { form, preserve: true });
  const cpuRequest = Form.useWatch('cpuRequest', { form, preserve: true });
  const cpuLimit = Form.useWatch('cpuLimit', { form, preserve: true });
  const memoryRequest = Form.useWatch('memoryRequest', {
    form,
    preserve: true,
  });
  const memoryLimit = Form.useWatch('memoryLimit', {
    form,
    preserve: true,
  });
  const replicas = Form.useWatch('replicas', form) ?? 1;
  const hasContainer = Boolean(containerName || image || showContainerForm);
  const containerItems: ContainerSummaryItem[] = hasContainer
    ? [
        {
          cpuLimit,
          cpuRequest,
          image,
          key: containerName || image || 'draft-container',
          memoryLimit,
          memoryRequest,
          name: containerName,
        },
      ]
    : [];

  useEffect(() => {
    if (containerName || image) {
      setShowContainerForm(true);
    }
  }, [containerName, image]);

  const updateReplicas = (offset: number) => {
    form.setFieldValue('replicas', Math.max(0, replicas + offset));
  };

  const getContainerSnapshot = () =>
    CONTAINER_FIELD_NAMES.reduce<Partial<CreateWorkloadFormValues>>(
      (snapshot, fieldName) => {
        snapshot[fieldName] = form.getFieldValue(fieldName);
        return snapshot;
      },
      {},
    );

  const openContainerModal = (shouldPrefillName = false) => {
    containerSnapshotRef.current = getContainerSnapshot();
    if (shouldPrefillName && !form.getFieldValue('containerName')) {
      form.setFieldValue('containerName', createRandomContainerName());
    }
    setShowContainerForm(true);
    setContainerModalOpen(true);
  };

  const cancelContainerModal = () => {
    form.setFieldsValue(containerSnapshotRef.current);
    if (
      !containerSnapshotRef.current.containerName &&
      !containerSnapshotRef.current.image
    ) {
      setShowContainerForm(false);
    }
    setContainerModalOpen(false);
  };

  const saveContainerModal = async () => {
    await form.validateFields(CONTAINER_VALIDATE_FIELD_NAMES);
    setShowContainerForm(true);
    setContainerModalOpen(false);
  };

  return (
    <>
      {type !== 'DaemonSet' && (
        <div className={styles.replicaPanel}>
          <div className={styles.replicaLabel}>容器组副本数量</div>
          <div className={styles.replicaControl}>
            <Button
              aria-label="减少容器组副本数量"
              className={styles.stepButton}
              disabled={replicas <= 0}
              icon={<MinusOutlined />}
              type="text"
              onClick={() => updateReplicas(-1)}
            />
            <Form.Item
              name="replicas"
              rules={[{ required: true, message: '请输入副本数' }]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                className={styles.replicaInput}
                min={0}
                precision={0}
              />
            </Form.Item>
            <Button
              aria-label="增加容器组副本数量"
              className={styles.stepButton}
              icon={<PlusOutlined />}
              type="text"
              onClick={() => updateReplicas(1)}
            />
          </div>
        </div>
      )}

      <div className={styles.containerTitle}>容器</div>
      <ContainerSummaryList
        items={containerItems}
        showAdd={!hasContainer}
        onAdd={() => openContainerModal(true)}
        onEdit={() => openContainerModal(false)}
      />

      <div style={{ marginTop: `16px` }}>
        <WorkloadUpdateStrategySelector form={form} type={type} />
      </div>
      <PodSecurityContextFields />
      <PodSchedulingRuleSelector />
      <PodGracefulTerminationFields />
      <div style={{ marginBottom: `16px` }}>
        <PodMetadataFields />
      </div>

      <ContainerConfigModal
        open={containerModalOpen}
        onCancel={cancelContainerModal}
        onOk={saveContainerModal}
      />
    </>
  );
};

export default ContainerSettings;
