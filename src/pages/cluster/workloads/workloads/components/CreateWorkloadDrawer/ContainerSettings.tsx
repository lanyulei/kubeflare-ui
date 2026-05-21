import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, InputNumber } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import ContainerConfigModal from './ContainerConfigModal';
import type { ContainerSummaryItem } from './ContainerSummaryList';
import ContainerSummaryList from './ContainerSummaryList';
import PodGracefulTerminationFields from './PodGracefulTerminationFields';
import PodMetadataFields from './PodMetadataFields';
import PodSchedulingRuleSelector from './PodSchedulingRuleSelector';
import PodSecurityContextFields from './PodSecurityContextFields';
import type {
  CreateWorkloadContainerValues,
  CreateWorkloadFormValues,
} from './types';
import WorkloadUpdateStrategySelector from './WorkloadUpdateStrategySelector';

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

const createContainerId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getInitialContainerValues = (): CreateWorkloadContainerValues => ({
  id: createContainerId(),
  containerType: 'worker',
  imagePullPolicy: 'IfNotPresent',
  containerPorts: [{ protocol: 'HTTP', name: 'http-0' }],
  enableHealthCheck: false,
  healthChecks: {},
  enableLifecycle: false,
  lifecycleActions: {},
  enableStartupCommand: false,
  enableContainerEnv: false,
  containerEnv: [],
  enableContainerSecurityContext: false,
  containerPrivileged: false,
  containerRunAsNonRoot: false,
  containerReadOnlyRootFilesystem: false,
  allowPrivilegeEscalation: false,
  containerCapabilitiesAdd: [''],
  containerCapabilitiesDrop: [''],
  containerSeccompProfileType: undefined,
  containerSeccompProfileLocalhost: '',
  syncHostTimezone: false,
  protocol: 'TCP',
});

const ContainerSettings = ({ form, type }: ContainerSettingsProps) => {
  const { styles } = useStyles();
  const [containerForm] = Form.useForm<CreateWorkloadContainerValues>();
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [editingContainerIndex, setEditingContainerIndex] = useState<
    number | null
  >(null);
  const containers =
    (Form.useWatch('containers', {
      form,
      preserve: true,
    }) as CreateWorkloadContainerValues[]) || [];
  const replicas = Form.useWatch('replicas', form) ?? 1;
  const containerItems: ContainerSummaryItem[] = containers.map(
    (container, index) => ({
      cpuLimit: container.cpuLimit,
      cpuRequest: container.cpuRequest,
      image: container.image,
      key: container.id || container.containerName || `container-${index}`,
      memoryLimit: container.memoryLimit,
      memoryRequest: container.memoryRequest,
      name: container.containerName,
    }),
  );

  const updateReplicas = (offset: number) => {
    form.setFieldValue('replicas', Math.max(0, replicas + offset));
  };

  const openContainerModal = (
    shouldPrefillName = false,
    index: number | null = null,
  ) => {
    setEditingContainerIndex(index);
    containerForm.resetFields();
    containerForm.setFieldsValue(
      index === null
        ? {
            ...getInitialContainerValues(),
            containerName: shouldPrefillName
              ? createRandomContainerName()
              : undefined,
          }
        : containers[index],
    );
    setContainerModalOpen(true);
  };

  const cancelContainerModal = () => {
    containerForm.resetFields();
    setEditingContainerIndex(null);
    setContainerModalOpen(false);
  };

  const saveContainerModal = async () => {
    await containerForm.validateFields(CONTAINER_VALIDATE_FIELD_NAMES);
    const containerPorts = containerForm.getFieldValue('containerPorts') || [];
    await containerForm.validateFields(
      containerPorts.flatMap((_: unknown, index: number) => [
        ['containerPorts', index, 'containerPort'],
        ['containerPorts', index, 'servicePort'],
      ]),
    );
    const containerValues = {
      ...containerForm.getFieldsValue(true),
      id: containers[editingContainerIndex ?? -1]?.id || createContainerId(),
    } as CreateWorkloadContainerValues;
    const nextContainers = [...containers];
    if (editingContainerIndex === null) {
      nextContainers.push(containerValues);
    } else {
      nextContainers[editingContainerIndex] = containerValues;
    }
    form.setFieldValue('containers', nextContainers);
    containerForm.resetFields();
    setEditingContainerIndex(null);
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
        onAdd={() => openContainerModal(true)}
        onEdit={(_, index) => openContainerModal(false, index)}
      />

      <WorkloadUpdateStrategySelector form={form} type={type} />
      <PodSecurityContextFields />
      <PodSchedulingRuleSelector />
      <PodGracefulTerminationFields />
      <div style={{ marginBottom: `16px` }}>
        <PodMetadataFields />
      </div>

      <ContainerConfigModal
        form={containerForm}
        open={containerModalOpen}
        onCancel={cancelContainerModal}
        onOk={saveContainerModal}
      />
    </>
  );
};

export default ContainerSettings;
