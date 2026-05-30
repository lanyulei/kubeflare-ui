import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, Form, Spin, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo } from 'react';
import { ComputeQuotaFields, SectionTitle } from '@/components';
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
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: token.paddingLG,
      background: token.colorBgContainer,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginSM,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  summaryItem: {
    minWidth: 0,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  policy: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: token.marginXS,
  },
}));

const formatResourcePair = (
  resources: API.ClusterNodePodContainerResources | undefined,
  resourceName: 'cpu' | 'memory',
) => {
  const request = resources?.requests?.[resourceName];
  const limit = resources?.limits?.[resourceName];

  if (!request && !limit) {
    return '未设置';
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
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      footer={
        <div className={styles.footer}>
          <Button onClick={onCancel}>取消</Button>
          <Button
            disabled={Boolean(disabledReason)}
            loading={loading}
            type="primary"
            onClick={handleSubmit}
          >
            提交调整
          </Button>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title="调整容器资源"
      width="64vw"
      onClose={onCancel}
    >
      <Spin spinning={!container}>
        <div className={styles.body}>
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
          <div className={styles.section}>
            <SectionTitle color={'#36435C'} fontSize={12}>
              当前资源
            </SectionTitle>
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>容器</div>
                <div className={styles.summaryValue}>
                  {container?.name || '-'}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>QoS 等级</div>
                <div className={styles.summaryValue}>
                  {pod?.qos_class || '-'}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>期望 CPU</div>
                <div className={styles.summaryValue}>
                  {formatResourcePair(container?.resources, 'cpu')}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>实际 CPU</div>
                <div className={styles.summaryValue}>
                  {formatResourcePair(container?.status_resources, 'cpu')}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>期望内存</div>
                <div className={styles.summaryValue}>
                  {formatResourcePair(container?.resources, 'memory')}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryLabel}>实际内存</div>
                <div className={styles.summaryValue}>
                  {formatResourcePair(container?.status_resources, 'memory')}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <SectionTitle color={'#36435C'} fontSize={12}>
              Resize 策略
            </SectionTitle>
            <div className={styles.policy}>
              <Tag icon={<InfoCircleOutlined />}>
                CPU：{getPolicyText(getResizePolicy(container, 'cpu'))}
              </Tag>
              <Tag icon={<InfoCircleOutlined />}>
                内存：{getPolicyText(getResizePolicy(container, 'memory'))}
              </Tag>
            </div>
          </div>
          <div className={styles.section}>
            <SectionTitle color={'#36435C'} fontSize={12}>
              目标资源
            </SectionTitle>
            <Typography.Text type="secondary">
              CPU 单位为 Core，内存单位为 Mi。留空表示不声明对应资源。
            </Typography.Text>
            <Form form={form} layout="vertical" requiredMark>
              <ComputeQuotaFields
                cpuFields={[
                  {
                    label: 'CPU 预留',
                    name: 'cpuRequest',
                    placeholder: '无预留',
                  },
                  {
                    label: 'CPU 限制',
                    name: 'cpuLimit',
                    placeholder: '无上限',
                  },
                ]}
                memoryFields={[
                  {
                    label: '内存预留',
                    name: 'memoryRequest',
                    placeholder: '无预留',
                  },
                  {
                    label: '内存限制',
                    name: 'memoryLimit',
                    placeholder: '无上限',
                  },
                ]}
              />
            </Form>
          </div>
        </div>
      </Spin>
    </Drawer>
  );
};

export type { PodResizeFormValues };
export default PodResizeDrawer;
