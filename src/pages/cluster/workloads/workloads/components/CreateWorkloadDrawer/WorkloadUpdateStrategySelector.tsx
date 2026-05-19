import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Col, Form, Input, Row } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';

type WorkloadUpdateStrategyType = 'RollingUpdate' | 'Recreate';

const useStyles = createStyles(({ token }) => ({
  updateStrategy: {
    marginBottom: 16,
  },
  updateStrategyLabel: {
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  strategySelect: {
    position: 'relative',
    overflow: 'visible',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  strategyOptions: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    left: 0,
    zIndex: 10,
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    boxShadow: token.boxShadowSecondary,
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
}));

type WorkloadUpdateStrategySelectorProps = {
  form: FormInstance;
  type: API.ClusterWorkloadType;
  label?: string;
  strategyName?: NamePath;
  maxUnavailableName?: NamePath;
  maxSurgeName?: NamePath;
};

const rollingStrategy = {
  title: '滚动更新（推荐）',
  value: 'RollingUpdate',
  description:
    '用新容器组副本逐步替换旧容器组副本。升级过程中业务流量会负载均衡到新旧容器组副本上，业务不会中断。',
} as const;

const recreateStrategy = {
  title: '同时更新',
  value: 'Recreate',
  description: '删除全部旧容器组副本再创建新容器组副本。升级过程中业务会中断。',
} as const;

const WorkloadUpdateStrategySelector = ({
  form,
  type,
  label = '更新策略',
  strategyName = 'updateStrategyType',
  maxUnavailableName = 'maxUnavailable',
  maxSurgeName = 'maxSurge',
}: WorkloadUpdateStrategySelectorProps) => {
  const { styles } = useStyles();
  const [strategyOpen, setStrategyOpen] = useState(false);
  const updateStrategyType =
    (Form.useWatch(strategyName, form) as WorkloadUpdateStrategyType) ||
    'RollingUpdate';
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
      form.getFieldValue(strategyName) === 'Recreate'
    ) {
      form.setFieldValue(strategyName, 'RollingUpdate');
      setStrategyOpen(false);
    }
  }, [form, strategyName, type]);

  const selectStrategy = (value: WorkloadUpdateStrategyType) => {
    form.setFieldValue(strategyName, value);
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
    <div className={styles.updateStrategy}>
      <div className={styles.updateStrategyLabel}>{label}</div>
      <Form.Item name={strategyName} hidden>
        <Input />
      </Form.Item>
      <div className={styles.strategySelect}>
        {renderStrategyOption(selectedStrategy, true)}
        {strategyOpen && (
          <div className={styles.strategyOptions}>
            {strategyOptions
              .filter((option) => option.value !== selectedStrategy.value)
              .map((option) => renderStrategyOption(option, false))}
          </div>
        )}
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
                  name={maxUnavailableName}
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
                    name={maxSurgeName}
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
  );
};

export type { WorkloadUpdateStrategySelectorProps, WorkloadUpdateStrategyType };
export default WorkloadUpdateStrategySelector;
