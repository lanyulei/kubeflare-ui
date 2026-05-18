import {
  DockerOutlined,
  DownOutlined,
  MinusOutlined,
  PlusOutlined,
  UpOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Col, Form, Input, InputNumber, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import type { CreateWorkloadFormValues } from './types';

const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const useStyles = createStyles(({ token }) => ({
  replicaPanel: {
    display: 'inline-flex',
    minWidth: 324,
    flexDirection: 'column',
    alignItems: 'center',
    gap: token.marginSM,
    marginBottom: token.marginLG,
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
  updateStrategy: {
    marginBottom: token.marginLG,
  },
  updateStrategyLabel: {
    marginBottom: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  strategySelect: {
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  strategyOption: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: 'minmax(0, 1fr) 24px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `12px 16px`,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',

    '& + &': {
      borderTop: `1px solid ${token.colorBorderSecondary}`,
    },

    '&:hover': {
      background: token.colorFillQuaternary,
    },
  },
  strategyTitle: {
    display: 'block',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  strategyDescription: {
    display: 'block',
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  strategyArrow: {
    justifySelf: 'end',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  },
  rollingSettings: {
    marginTop: token.marginSM,
    padding: `15px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  rollingSettingsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    marginBottom: `10px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
  },
  rollingSettingsBody: {
    padding: `12px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillQuaternary,
  },
  fieldHelp: {
    marginTop: token.marginXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  containerTitle: {
    marginBottom: token.marginSM,
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
}));

type ContainerSettingsProps = {
  form: FormInstance<CreateWorkloadFormValues>;
  type: API.ClusterWorkloadType;
};

const normalizeName = (value?: string) => value?.trim() || '';

const ContainerSettings = ({ form, type }: ContainerSettingsProps) => {
  const { styles } = useStyles();
  const [showContainerForm, setShowContainerForm] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const containerName = Form.useWatch('containerName', form);
  const image = Form.useWatch('image', form);
  const replicas = Form.useWatch('replicas', form) ?? 1;
  const updateStrategyType =
    Form.useWatch('updateStrategyType', form) || 'RollingUpdate';
  const hasContainer = Boolean(containerName || image || showContainerForm);
  const rollingStrategy = {
    title: '滚动更新（推荐）',
    value: 'RollingUpdate',
    description:
      '用新容器组副本逐步替换旧容器组副本。升级过程中业务流量会负载均衡到新旧容器组副本上，业务不会中断。',
  } as const;
  const recreateStrategy = {
    title: '同时更新',
    value: 'Recreate',
    description:
      '删除全部旧容器组副本再创建新容器组副本。升级过程中业务会中断。',
  } as const;
  const strategyOptions =
    type === 'Deployment'
      ? [rollingStrategy, recreateStrategy]
      : [rollingStrategy];
  const selectedStrategy =
    strategyOptions.find((option) => option.value === updateStrategyType) ||
    strategyOptions[0];

  useEffect(() => {
    if (
      type !== 'Deployment' &&
      form.getFieldValue('updateStrategyType') === 'Recreate'
    ) {
      form.setFieldValue('updateStrategyType', 'RollingUpdate');
      setStrategyOpen(false);
    }
  }, [form, type]);

  useEffect(() => {
    if (containerName || image) {
      setShowContainerForm(true);
    }
  }, [containerName, image]);

  const updateReplicas = (offset: number) => {
    form.setFieldValue('replicas', Math.max(0, replicas + offset));
  };

  const addContainer = () => {
    const workloadName = normalizeName(form.getFieldValue('name'));
    if (!form.getFieldValue('containerName') && workloadName) {
      form.setFieldValue('containerName', workloadName);
    }
    setShowContainerForm(true);
  };

  const selectStrategy = (
    value: CreateWorkloadFormValues['updateStrategyType'],
  ) => {
    form.setFieldValue('updateStrategyType', value);
    setStrategyOpen(false);
  };

  const renderStrategyOption = (
    option: (typeof strategyOptions)[number],
    showArrow: boolean,
  ) => (
    <button
      className={styles.strategyOption}
      key={option.value}
      type="button"
      onClick={() =>
        showArrow && strategyOptions.length > 1
          ? setStrategyOpen((open) => !open)
          : selectStrategy(option.value)
      }
    >
      <span>
        <span className={styles.strategyTitle}>{option.title}</span>
        <span className={styles.strategyDescription}>{option.description}</span>
      </span>
      {showArrow && strategyOptions.length > 1 && (
        <span className={styles.strategyArrow}>
          {strategyOpen ? <UpOutlined /> : <DownOutlined />}
        </span>
      )}
    </button>
  );

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

      <div className={styles.updateStrategy}>
        <div className={styles.updateStrategyLabel}>更新策略</div>
        <Form.Item name="updateStrategyType" hidden>
          <Input />
        </Form.Item>
        <div className={styles.strategySelect}>
          {renderStrategyOption(selectedStrategy, true)}
          {strategyOpen &&
            strategyOptions
              .filter((option) => option.value !== selectedStrategy.value)
              .map((option) => renderStrategyOption(option, false))}
        </div>

        {updateStrategyType === 'RollingUpdate' && type !== 'StatefulSet' && (
          <div className={styles.rollingSettings}>
            <div className={styles.rollingSettingsTitle}>
              <span>滚动更新设置</span>
            </div>
            <div className={styles.rollingSettingsBody}>
              <Row gutter={16}>
                <Col span={type === 'Deployment' ? 12 : 24}>
                  <Form.Item
                    label="最大不可用容器组数量"
                    name="maxUnavailable"
                    rules={[
                      {
                        required: true,
                        message: '请输入最大不可用容器组数量',
                      },
                    ]}
                    tooltip="更新过程中允许的不可用容器组副本的最大数量或百分比"
                  >
                    <Input placeholder="25%" />
                  </Form.Item>
                </Col>
                {type === 'Deployment' && (
                  <Col span={12}>
                    <Form.Item
                      tooltip="更新过程中允许的多余容器组副本的最大数量或百分比"
                      label="最大多余容器组数量"
                      name="maxSurge"
                      rules={[
                        {
                          required: true,
                          message: '请输入最大多余容器组数量',
                        },
                      ]}
                    >
                      <Input placeholder="25%" />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </div>
          </div>
        )}
      </div>

      <div className={styles.containerTitle}>容器</div>
      {hasContainer ? (
        <div className={styles.containerForm}>
          <div className={styles.containerHeader}>
            <div className={styles.containerName}>
              <DockerOutlined />
              <span>{containerName || '新容器'}</span>
            </div>
          </div>
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
        </div>
      ) : (
        <button
          className={styles.addContainer}
          type="button"
          onClick={addContainer}
        >
          <DockerOutlined className={styles.addIcon} />
          <span className={styles.addTitle}>添加容器</span>
          <span className={styles.addDescription}>
            自定义容器的设置以创建容器。
          </span>
        </button>
      )}
    </>
  );
};

export default ContainerSettings;
