import {
  ClockCircleOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Checkbox, Form, Input } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useState } from 'react';
import ContainerEnvFields from './ContainerEnvFields';
import ContainerHealthCheckFields from './ContainerHealthCheckFields';
import ContainerLifecycleFields from './ContainerLifecycleFields';
import ContainerSecurityContextFields from './ContainerSecurityContextFields';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  option: {
    position: 'relative',
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  optionHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginSM,
  },
  checkbox: {
    marginTop: 2,
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: token.colorTextTertiary,
    fontSize: 22,
  },
  title: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  description: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  policyOptions: {
    position: 'relative',
    overflow: 'visible',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  policyOptionList: {
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
  policyOption: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: '32px minmax(0, 1fr) 24px',
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
  policyOptionIcon: {
    color: token.colorTextTertiary,
    fontSize: 22,
    lineHeight: 1,
  },
  policyArrow: {
    justifySelf: 'end',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  },
  body: {
    marginTop: `14px`,
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
  },
  plainBody: {
    marginTop: token.marginMD,
  },
  textarea: {
    resize: 'vertical',
  },
  fieldStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  fieldBlock: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  fieldHelp: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type ToggleOptionCardProps = {
  bodyClassName?: string;
  name: NamePath;
  title: string;
  description: string;
  enabled?: boolean;
  children?: ReactNode;
};

type ImagePullPolicyType = 'IfNotPresent' | 'Always' | 'Never';

const imagePullPolicyOptions: {
  title: string;
  value: ImagePullPolicyType;
  description: string;
}[] = [
  {
    title: '优先使用本地镜像',
    value: 'IfNotPresent',
    description: '如果本地存在所需的镜像，则优先使用本地镜像。',
  },
  {
    title: '每次都拉取镜像',
    value: 'Always',
    description: '在容器组创建及更新时，每次都尝试拉取新的镜像。',
  },
  {
    title: '仅使用本地镜像',
    value: 'Never',
    description: '仅使用本地镜像。如果本地不存在所需的镜像，则会导致容器异常。',
  },
];

const ToggleOptionCard = ({
  bodyClassName,
  name,
  title,
  description,
  enabled,
  children,
}: ToggleOptionCardProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.option}>
      <div className={styles.optionHeader}>
        <Form.Item
          className={styles.checkbox}
          name={name}
          valuePropName="checked"
        >
          <Checkbox aria-label={title} />
        </Form.Item>
        <span>
          <div className={styles.title}>{title}</div>
          <div className={styles.description}>{description}</div>
        </span>
      </div>
      {enabled && children && (
        <div className={bodyClassName || styles.body}>{children}</div>
      )}
    </div>
  );
};

const ContainerAdvancedOptions = () => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  const [policyOpen, setPolicyOpen] = useState(false);
  const enableHealthCheck = Form.useWatch('enableHealthCheck', form);
  const enableLifecycle = Form.useWatch('enableLifecycle', form);
  const enableStartupCommand = Form.useWatch('enableStartupCommand', form);
  const enableContainerEnv = Form.useWatch('enableContainerEnv', form);
  const enableContainerSecurityContext = Form.useWatch(
    'enableContainerSecurityContext',
    form,
  );
  const syncHostTimezone = Form.useWatch('syncHostTimezone', form);
  const imagePullPolicy =
    (Form.useWatch('imagePullPolicy', form) as ImagePullPolicyType) ||
    'IfNotPresent';

  const selectImagePullPolicy = (value: ImagePullPolicyType) => {
    form.setFieldValue('imagePullPolicy', value);
    setPolicyOpen(false);
  };

  const renderImagePullPolicyOption = (
    option: (typeof imagePullPolicyOptions)[number],
    showArrow: boolean,
  ) => (
    <button
      className={styles.policyOption}
      key={option.value}
      type="button"
      onClick={() =>
        showArrow
          ? setPolicyOpen((open) => !open)
          : selectImagePullPolicy(option.value)
      }
    >
      <ClockCircleOutlined className={styles.policyOptionIcon} />
      <span>
        <div className={styles.title}>{option.title}</div>
        <div className={styles.description}>{option.description}</div>
      </span>
      {showArrow && (
        <span className={styles.policyArrow}>
          {policyOpen ? <UpOutlined /> : <DownOutlined />}
        </span>
      )}
    </button>
  );

  const selectedImagePullPolicy =
    imagePullPolicyOptions.find((option) => option.value === imagePullPolicy) ||
    imagePullPolicyOptions[0];

  return (
    <div className={styles.stack}>
      <Form.Item name="imagePullPolicy" hidden>
        <Input />
      </Form.Item>
      <div className={styles.policyOptions}>
        {renderImagePullPolicyOption(selectedImagePullPolicy, true)}
        {policyOpen && (
          <div className={styles.policyOptionList}>
            {imagePullPolicyOptions
              .filter((option) => option.value !== imagePullPolicy)
              .map((option) => renderImagePullPolicyOption(option, false))}
          </div>
        )}
      </div>

      <ToggleOptionCard
        description="添加探针以定时检查容器健康状态。"
        enabled={enableHealthCheck}
        name="enableHealthCheck"
        title="健康检查"
      >
        <ContainerHealthCheckFields />
      </ToggleOptionCard>

      <ToggleOptionCard
        description="设置容器启动后或终止前需要执行的动作，以进行环境检查或体面终止。"
        enabled={enableLifecycle}
        name="enableLifecycle"
        title="生命周期管理"
      >
        <ContainerLifecycleFields />
      </ToggleOptionCard>

      <ToggleOptionCard
        description="自定义容器启动时运行的命令。默认情况下，容器启动时将运行镜像默认命令。"
        enabled={enableStartupCommand}
        name="enableStartupCommand"
        title="启动命令"
      >
        <div className={styles.fieldStack}>
          <div className={styles.fieldBlock}>
            <Form.Item label="命令" name="startupCommand">
              <Input.TextArea
                placeholder="请输入命令"
                className={styles.textarea}
                rows={2}
              />
            </Form.Item>
            <div className={styles.fieldHelp}>容器的启动命令。</div>
          </div>
          <div className={styles.fieldBlock}>
            <Form.Item label="参数" name="startupArgs">
              <Input.TextArea
                placeholder="请输入参数"
                className={styles.textarea}
                rows={2}
              />
            </Form.Item>
            <div className={styles.fieldHelp}>
              容器启动命令的参数。如有多个参数请使用半角逗号（,）分隔。
            </div>
          </div>
        </div>
      </ToggleOptionCard>

      <ToggleOptionCard
        bodyClassName={styles.plainBody}
        description="为容器添加添加环境变量。"
        enabled={enableContainerEnv}
        name="enableContainerEnv"
        title="环境变量"
      >
        <ContainerEnvFields />
      </ToggleOptionCard>

      <ToggleOptionCard
        description="自定义容器的权限设置。"
        enabled={enableContainerSecurityContext}
        name="enableContainerSecurityContext"
        title="容器安全上下文"
      >
        <ContainerSecurityContextFields />
      </ToggleOptionCard>

      <ToggleOptionCard
        description="同步容器与主机的时区。"
        enabled={syncHostTimezone}
        name="syncHostTimezone"
        title="同步主机时区"
      />
    </div>
  );
};

export default ContainerAdvancedOptions;
