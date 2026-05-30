import {
  CodeSandboxOutlined,
  DatabaseOutlined,
  DockerOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Alert, Form, Modal, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo } from 'react';
import ContainerResourceFields from '../../../workloads/workloads/components/CreateWorkloadDrawer/ContainerConfigModal/ContainerResourceFields';
import {
  getPodResizeDisabledReason,
  getResizeFormValues,
  getResizePolicy,
  type PodResizeFormValues,
  validatePodResizeValues,
} from './podResizeHelpers';

type PodResizeDrawerProps = {
  container?: API.ClusterNodePodContainer;
  loading?: boolean;
  open: boolean;
  pod?: API.ClusterNodePodItem;
  onCancel: () => void;
  onSubmit: (
    container: API.ClusterNodePodContainer,
    values: PodResizeFormValues,
  ) => Promise<void>;
};

const useStyles = createStyles(({ token }) => ({
  modal: {
    '.ant-modal-content': {
      padding: 0,
      overflow: 'hidden',
    },
    '.ant-modal-header': {
      marginBottom: 0,
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
    },
    '.ant-modal-body': {
      maxHeight: 'calc(100vh - 210px)',
      overflow: 'auto',
      padding: token.paddingLG,
      background: token.colorBgContainer,
    },
    '.ant-modal-footer': {
      marginTop: 0,
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorBgContainer,
    },
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionPanel: {
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  sectionDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionContent: {
    marginTop: token.marginSM,
  },
  containerCard: {
    display: 'grid',
    minHeight: 64,
    gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, auto)',
    alignItems: 'center',
    gap: token.marginLG,
    padding: `${token.paddingSM}px ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      alignItems: 'flex-start',
      gap: token.marginSM,
    },
  },
  containerMain: {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginMD,
  },
  containerIcon: {
    flex: '0 0 auto',
    color: token.colorText,
    fontSize: 34,
    lineHeight: 1,
  },
  containerContent: {
    minWidth: 0,
  },
  containerName: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  containerImage: {
    overflow: 'hidden',
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  containerMetrics: {
    display: 'flex',
    minWidth: 0,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: `${token.marginSM}px ${token.marginLG}px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,

    '@media (max-width: 768px)': {
      justifyContent: 'flex-start',
      paddingLeft: 48,
    },

    '@media (max-width: 576px)': {
      paddingLeft: 0,
    },
  },
  metric: {
    display: 'inline-flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginXS,
    whiteSpace: 'nowrap',
  },
  metricIcon: {
    color: token.colorTextSecondary,
    fontSize: 16,
  },
  memoryIcon: {
    transform: 'rotate(-45deg)',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: token.marginSM,
    marginTop: token.marginSM,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 576px)': {
      gridTemplateColumns: '1fr',
    },
  },
  summaryItem: {
    minWidth: 0,
    padding: `${token.paddingXS}px ${token.paddingSM}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
  },
  summaryLabel: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  summaryValue: {
    marginTop: token.marginXXS,
    overflow: 'hidden',
    color: token.colorText,
    fontWeight: 600,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  policy: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginXS,

    '@media (max-width: 576px)': {
      gridTemplateColumns: '1fr',
    },
  },
  policyItem: {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginXS,
    padding: `${token.paddingXS}px ${token.paddingSM}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  policyIcon: {
    flex: '0 0 auto',
    color: token.colorTextSecondary,
  },
  policyLabel: {
    flex: '0 0 auto',
    color: token.colorTextSecondary,
  },
  policyValue: {
    minWidth: 0,
    overflow: 'hidden',
    fontWeight: 600,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

const formatResourcePair = (
  resources: API.ClusterNodePodContainerResources | undefined,
  resourceName: 'cpu' | 'memory',
) => {
  const request = resources?.requests?.[resourceName];
  const limit = resources?.limits?.[resourceName];

  if (!request && !limit) {
    return '-';
  }

  return `${request || '无预留'} / ${limit || '无上限'}`;
};

const getPolicyText = (policy?: string) => {
  if (policy === 'RestartContainer') {
    return '需要重启容器';
  }
  if (policy === 'NotRequired') {
    return '无需重启';
  }
  return '未声明';
};

const PodResizeDrawer = ({
  container,
  loading = false,
  open,
  pod,
  onCancel,
  onSubmit,
}: PodResizeDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<PodResizeFormValues>();
  const disabledReason = getPodResizeDisabledReason(pod, container);
  const restartRequired = useMemo(
    () =>
      getResizePolicy(container, 'cpu') === 'RestartContainer' ||
      getResizePolicy(container, 'memory') === 'RestartContainer',
    [container],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();
    form.setFieldsValue(getResizeFormValues(container));
  }, [container, form, open]);

  const handleSubmit = async () => {
    if (!pod || !container) {
      return;
    }

    const values = await form.validateFields();
    const error = validatePodResizeValues(pod, container, values);

    if (error) {
      form.setFields([
        {
          name: error.name,
          errors: [error.message],
        },
      ]);
      return;
    }

    await onSubmit(container, values);
  };

  return (
    <Modal
      cancelText="取消"
      className={styles.modal}
      destroyOnHidden
      keyboard={false}
      maskClosable={false}
      okButtonProps={{
        disabled: Boolean(disabledReason),
        loading,
      }}
      okText="提交调整"
      open={open}
      title="调整容器资源"
      width={960}
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Spin spinning={!container}>
        <div className={styles.stack}>
          {disabledReason ? (
            <Alert message={disabledReason} showIcon type="warning" />
          ) : null}
          <Alert
            message="该调整只作用于当前 Pod，不会修改上层工作负载模板；Pod 被重建后会恢复为模板中的资源配置。"
            showIcon
            type="info"
          />
          {restartRequired ? (
            <Alert
              message="当前容器的 resizePolicy 声明部分资源调整可能需要重启容器。"
              showIcon
              type="warning"
            />
          ) : null}
          <section>
            <div className={styles.sectionTitle}>当前容器</div>
            <div className={styles.sectionPanel}>
              <div className={styles.containerCard}>
                <div className={styles.containerMain}>
                  <DockerOutlined className={styles.containerIcon} />
                  <div className={styles.containerContent}>
                    <div className={styles.containerName}>
                      {container?.name || '-'}
                    </div>
                    <div className={styles.containerImage}>
                      镜像： {container?.image || '-'}
                    </div>
                  </div>
                </div>
                <div className={styles.containerMetrics}>
                  <span className={styles.metric}>
                    <CodeSandboxOutlined className={styles.metricIcon} />
                    {formatResourcePair(container?.resources, 'cpu')}
                  </span>
                  <span className={styles.metric}>
                    <DatabaseOutlined
                      className={`${styles.metricIcon} ${styles.memoryIcon}`}
                    />
                    {formatResourcePair(container?.resources, 'memory')}
                  </span>
                </div>
              </div>
              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryLabel}>QoS 等级</div>
                  <div className={styles.summaryValue}>
                    {pod?.qos_class || '-'}
                  </div>
                </div>
                {[
                  {
                    label: '期望 CPU',
                    value: formatResourcePair(container?.resources, 'cpu'),
                  },
                  {
                    label: '实际 CPU',
                    value: formatResourcePair(
                      container?.status_resources,
                      'cpu',
                    ),
                  },
                  {
                    label: '期望内存',
                    value: formatResourcePair(container?.resources, 'memory'),
                  },
                  {
                    label: '实际内存',
                    value: formatResourcePair(
                      container?.status_resources,
                      'memory',
                    ),
                  },
                ].map((item) => (
                  <div className={styles.summaryItem} key={item.label}>
                    <div className={styles.summaryLabel}>{item.label}</div>
                    <div className={styles.summaryValue}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section>
            <div className={styles.sectionTitle}>Resize 策略</div>
            <div className={styles.sectionPanel}>
              <div className={styles.sectionDescription}>
                根据容器的 resizePolicy 判断资源变更是否需要重启容器。
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.policy}>
                  <div className={styles.policyItem}>
                    <InfoCircleOutlined className={styles.policyIcon} />
                    <span className={styles.policyLabel}>CPU</span>
                    <span className={styles.policyValue}>
                      {getPolicyText(getResizePolicy(container, 'cpu'))}
                    </span>
                  </div>
                  <div className={styles.policyItem}>
                    <InfoCircleOutlined className={styles.policyIcon} />
                    <span className={styles.policyLabel}>内存</span>
                    <span className={styles.policyValue}>
                      {getPolicyText(getResizePolicy(container, 'memory'))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section>
            <div className={styles.sectionTitle}>目标资源</div>
            <div className={styles.sectionPanel}>
              <div className={styles.sectionDescription}>
                CPU 单位为 Core，内存单位为 Mi。留空表示不声明对应资源。
              </div>
              <div className={styles.sectionContent}>
                <Form form={form} layout="vertical" requiredMark>
                  <ContainerResourceFields />
                </Form>
              </div>
            </div>
          </section>
        </div>
      </Spin>
    </Modal>
  );
};

export type { PodResizeFormValues };
export default PodResizeDrawer;
