import { CloseOutlined } from '@ant-design/icons';
import type { StepsProps } from 'antd';
import { Button, Drawer, Space, Steps, Switch } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import YamlEditor from '../YamlEditor';

export type ResourceCreateWizardStep = NonNullable<StepsProps['items']>[number];

type ResourceCreateWizardDrawerProps = {
  children: ReactNode;
  current: number;
  getStepDescription?: (
    step: ResourceCreateWizardStep,
    index: number,
  ) => ReactNode;
  loading?: boolean;
  open: boolean;
  steps: ResourceCreateWizardStep[];
  submitText?: string;
  title: ReactNode;
  width?: number | string;
  yamlMode: boolean;
  yamlValue: string;
  onCancel: () => void;
  onNext: () => void | Promise<void>;
  onPrev: () => void;
  onStepChange: (nextStep: number) => void | Promise<void>;
  onSubmit: () => void | Promise<void>;
  onYamlChange: (value: string) => void;
  onYamlModeChange: (checked: boolean) => void;
};

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: 0,
      background: token.colorBgLayout,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  headerExtra: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
  },
  yamlSwitch: {
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    borderRadius: 999,
    background: token.colorFillSecondary,
  },
  steps: {
    padding: '15px 20px',
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,

    '.ant-steps-item-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    '.ant-steps-item-title': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeightSM,
    },

    '.ant-steps-item-description': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  body: {
    height: 'calc(100vh - 205px)',
    overflow: 'auto',
    padding: token.paddingLG,
    background: token.colorBgContainer,

    '.ant-form-item-extra': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  yamlBody: {
    height: 'calc(100vh - 131px)',
    padding: token.paddingLG,
    background: token.colorBgContainer,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  footerActions: {
    display: 'flex',
    gap: token.marginSM,
  },
  section: {
    marginBottom: token.marginLG,
  },
}));

const ResourceCreateWizardDrawer = ({
  children,
  current,
  getStepDescription,
  loading = false,
  open,
  steps,
  submitText = '创建',
  title,
  width = '78vw',
  yamlMode,
  yamlValue,
  onCancel,
  onNext,
  onPrev,
  onStepChange,
  onSubmit,
  onYamlChange,
  onYamlModeChange,
}: ResourceCreateWizardDrawerProps) => {
  const { styles } = useStyles();

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      extra={
        <div className={styles.headerExtra}>
          <Space className={styles.yamlSwitch}>
            <span>编辑 YAML</span>
            <Switch
              aria-label="切换 YAML 编辑模式"
              checked={yamlMode}
              onChange={onYamlModeChange}
            />
          </Space>
        </div>
      }
      footer={
        <div className={styles.footer}>
          <span />
          <div className={styles.footerActions}>
            <Button onClick={onCancel}>取消</Button>
            {!yamlMode && current > 0 && (
              <Button onClick={onPrev}>上一步</Button>
            )}
            {!yamlMode && current < steps.length - 1 ? (
              <Button type="primary" onClick={onNext}>
                下一步
              </Button>
            ) : (
              <Button loading={loading} type="primary" onClick={onSubmit}>
                {submitText}
              </Button>
            )}
          </div>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title={title}
      width={width}
      onClose={onCancel}
    >
      {yamlMode ? (
        <div className={styles.yamlBody}>
          <YamlEditor
            height="calc(100vh - 179px)"
            value={yamlValue}
            onChange={onYamlChange}
          />
        </div>
      ) : (
        <>
          <Steps
            className={styles.steps}
            current={current}
            items={steps.map((step, index) => ({
              ...step,
              disabled: step.disabled ?? index > current + 1,
              description: getStepDescription
                ? getStepDescription(step, index)
                : step.description,
            }))}
            onChange={onStepChange}
          />
          <div className={styles.body}>
            <div className={styles.section}>{children}</div>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default ResourceCreateWizardDrawer;
