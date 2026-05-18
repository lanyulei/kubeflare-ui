import {
  DockerOutlined,
  EditOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
} from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import PodGracefulTerminationFields from './PodGracefulTerminationFields';
import PodMetadataFields from './PodMetadataFields';
import PodSchedulingRuleSelector from './PodSchedulingRuleSelector';
import PodSecurityContextFields from './PodSecurityContextFields';
import type { CreateWorkloadFormValues } from './types';
import WorkloadUpdateStrategySelector from './WorkloadUpdateStrategySelector';

const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const CONTAINER_FIELD_NAMES: (keyof CreateWorkloadFormValues)[] = [
  'containerName',
  'image',
  'imagePullPolicy',
  'containerPort',
  'protocol',
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
  addContainer: {
    display: 'flex',
    width: '100%',
    minHeight: 142,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: token.marginXXS,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    cursor: 'pointer',
    transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },
  },
  addIcon: {
    color: token.colorText,
    fontSize: 30,
    lineHeight: 1,
  },
  addTitle: {
    marginTop: token.marginXS,
    color: token.colorText,
    fontWeight: 500,
  },
  addDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  containerForm: {
    padding: token.paddingLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  containerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: token.marginMD,
  },
  containerName: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontWeight: 500,
  },
  containerInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${token.marginXS}px ${token.marginLG}px`,
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  },
  containerValue: {
    color: token.colorText,
  },
}));

type ContainerSettingsProps = {
  form: FormInstance<CreateWorkloadFormValues>;
  type: API.ClusterWorkloadType;
};

const normalizeName = (value?: string) => value?.trim() || '';

const ContainerSettings = ({ form, type }: ContainerSettingsProps) => {
  const { styles } = useStyles();
  const [showContainerForm, setShowContainerForm] = useState(false);
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const containerSnapshotRef = useRef<Partial<CreateWorkloadFormValues>>({});
  const containerName = Form.useWatch('containerName', form);
  const image = Form.useWatch('image', form);
  const imagePullPolicy = Form.useWatch('imagePullPolicy', form);
  const containerPort = Form.useWatch('containerPort', form);
  const protocol = Form.useWatch('protocol', form);
  const replicas = Form.useWatch('replicas', form) ?? 1;
  const hasContainer = Boolean(containerName || image || showContainerForm);

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
    const workloadName = normalizeName(form.getFieldValue('name'));
    if (
      shouldPrefillName &&
      !form.getFieldValue('containerName') &&
      workloadName
    ) {
      form.setFieldValue('containerName', workloadName);
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
    await form.validateFields(CONTAINER_FIELD_NAMES);
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
      {hasContainer ? (
        <div className={styles.containerForm}>
          <div className={styles.containerHeader}>
            <div className={styles.containerName}>
              <DockerOutlined />
              <span>{containerName || '新容器'}</span>
            </div>
            <Button
              icon={<EditOutlined />}
              type="link"
              onClick={() => openContainerModal(false)}
            >
              编辑配置
            </Button>
          </div>
          <div className={styles.containerInfo}>
            <span>
              镜像：
              <span className={styles.containerValue}>{image || '未填写'}</span>
            </span>
            <span>
              拉取策略：
              <span className={styles.containerValue}>
                {imagePullPolicy || 'IfNotPresent'}
              </span>
            </span>
            <span>
              端口：
              <span className={styles.containerValue}>
                {containerPort
                  ? `${containerPort}/${protocol || 'TCP'}`
                  : '未设置'}
              </span>
            </span>
          </div>
        </div>
      ) : (
        <button
          className={styles.addContainer}
          type="button"
          onClick={() => openContainerModal(true)}
        >
          <DockerOutlined className={styles.addIcon} />
          <span className={styles.addTitle}>添加容器</span>
          <span className={styles.addDescription}>
            自定义容器的设置以创建容器。
          </span>
        </button>
      )}

      <div style={{ marginTop: `16px` }}>
        <WorkloadUpdateStrategySelector form={form} type={type} />
      </div>
      <PodSecurityContextFields />
      <PodSchedulingRuleSelector />
      <PodGracefulTerminationFields />
      <div style={{ marginBottom: `16px` }}>
        <PodMetadataFields />
      </div>

      <Modal
        destroyOnHidden
        maskClosable={false}
        open={containerModalOpen}
        title="编辑容器配置"
        width={760}
        onCancel={cancelContainerModal}
        onOk={saveContainerModal}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label="容器名称"
              name="containerName"
              rules={[
                { required: true, message: '请输入容器名称' },
                { max: 63, message: '容器名称最长 63 个字符' },
                {
                  pattern: NAME_PATTERN,
                  message:
                    '容器名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
                },
              ]}
            >
              <Input placeholder="例如 nginx" />
            </Form.Item>
            <Form.Item
              label="镜像"
              name="image"
              rules={[{ required: true, message: '请输入容器镜像' }]}
            >
              <Input placeholder="例如 nginx:1.27" />
            </Form.Item>
            <Form.Item label="镜像拉取策略" name="imagePullPolicy">
              <Select
                options={[
                  { label: 'IfNotPresent', value: 'IfNotPresent' },
                  { label: 'Always', value: 'Always' },
                  { label: 'Never', value: 'Never' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="容器端口" name="containerPort">
              <InputNumber
                min={1}
                max={65535}
                precision={0}
                style={{ width: '100%' }}
                placeholder="可选"
              />
            </Form.Item>
            <Form.Item label="协议" name="protocol">
              <Select
                options={[
                  { label: 'TCP', value: 'TCP' },
                  { label: 'UDP', value: 'UDP' },
                  { label: 'SCTP', value: 'SCTP' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default ContainerSettings;
