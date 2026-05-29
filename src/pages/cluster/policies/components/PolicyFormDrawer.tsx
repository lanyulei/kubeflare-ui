import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Space, Steps, Switch } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { YamlEditor } from '@/components';

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
    padding: `15px 20px`,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    background: '#ffffff',

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
    padding: `${token.paddingLG}px`,
    background: token.colorBgContainer,
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

type PolicyFormDrawerProps = {
  children: ReactNode;
  current: number;
  loading?: boolean;
  open: boolean;
  steps: { title: string; icon: ReactNode }[];
  title: string;
  yamlMode: boolean;
  yamlValue: string;
  onCancel: () => void;
  onChangeYaml: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  onStepChange?: (step: number) => void;
  onYamlModeChange: (checked: boolean) => void;
};

const PolicyFormDrawer = ({
  children,
  current,
  loading = false,
  open,
  steps,
  title,
  yamlMode,
  yamlValue,
  onCancel,
  onChangeYaml,
  onNext,
  onPrev,
  onSubmit,
  onStepChange,
  onYamlModeChange,
}: PolicyFormDrawerProps) => {
  const { styles } = useStyles();
  const isLastStep = current >= steps.length - 1;
  const getStepStatusText = (index: number) => {
    if (current === index) {
      return '当前';
    }
    if (index < current) {
      return '已设置';
    }
    return '未设置';
  };

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      extra={
        <div className={styles.headerExtra}>
          <Space className={styles.yamlSwitch}>
            <span>编辑 YAML</span>
            <Switch checked={yamlMode} onChange={onYamlModeChange} />
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
            {!yamlMode && !isLastStep ? (
              <Button type="primary" onClick={onNext}>
                下一步
              </Button>
            ) : (
              <Button loading={loading} type="primary" onClick={onSubmit}>
                创建
              </Button>
            )}
          </div>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title={title}
      width="78vw"
      onClose={onCancel}
    >
      {yamlMode ? (
        <div className={styles.yamlBody}>
          <YamlEditor
            height="calc(100vh - 179px)"
            value={yamlValue}
            onChange={onChangeYaml}
          />
        </div>
      ) : (
        <>
          <Steps
            className={styles.steps}
            current={current}
            items={steps.map((step, index) => ({
              ...step,
              disabled: index > current + 1,
              description: getStepStatusText(index),
            }))}
            onChange={(nextStep) => {
              if (nextStep <= current) {
                onStepChange?.(nextStep);
                return;
              }
              if (nextStep > current + 1) {
                return;
              }
              onNext();
            }}
            size="small"
          />
          <div className={styles.body}>
            <div className={styles.section}>{children}</div>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default PolicyFormDrawer;
