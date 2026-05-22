import { PlusOutlined } from '@ant-design/icons';
import { Col, Form, Input, InputNumber, Row } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import { useEffect, useRef } from 'react';
import { SegmentedTabs } from '@/components';
import type {
  ContainerActionFormValue,
  ContainerHandlerType,
  ContainerLifecycleActionName,
  ContainerLifecycleActionsValue,
} from '../types';
import ContainerHttpTargetFields from './ContainerHttpTargetFields';

const ACTION_OPTIONS: {
  name: ContainerLifecycleActionName;
  title: string;
  description: string;
}[] = [
  {
    name: 'postStart',
    title: '启动后动作',
    description: '设置容器启动后需要执行的动作。',
  },
  {
    name: 'preStop',
    title: '终止前动作',
    description: '设置容器终止前需要执行的动作。',
  },
];

const HANDLER_OPTIONS: {
  label: string;
  value: ContainerHandlerType;
}[] = [
  { label: 'HTTP 请求', value: 'httpGet' },
  { label: '命令', value: 'exec' },
  { label: 'TCP 端口', value: 'tcpSocket' },
];

const useStyles = createStyles(({ token }) => ({
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  actionTitle: {
    marginBottom: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  addAction: {
    display: 'inline-flex',
    width: '100%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: token.marginXS,
    padding: `0 ${token.paddingSM}px`,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    fontSize: token.fontSizeSM,
    transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },
  },
  actionDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  actionEditor: {
    overflow: 'hidden',
    padding: `${token.paddingSM}px ${token.paddingSM}px 0`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: token.marginSM,
    },
  },
  editorHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: token.marginSM,
    marginBottom: token.marginSM,
  },
  actionFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginXS,
    margin: `${token.marginSM}px -${token.paddingSM}px 0`,
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    borderRadius: `0 0 ${token.borderRadiusSM}px ${token.borderRadiusSM}px`,
    background: token.colorText,
  },
  actionFooterButton: {
    color: token.colorBgContainer,

    '&:hover': {
      background: 'rgba(255, 255, 255, 0.12)',
      color: token.colorBgContainer,
    },
  },
  textarea: {
    resize: 'vertical',
  },
  fieldHelp: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

const getActionName = (actionName: ContainerLifecycleActionName): NamePath => [
  'lifecycleActions',
  actionName,
];

const getActionFieldName = (
  actionName: ContainerLifecycleActionName,
  fieldName: keyof ContainerActionFormValue,
): NamePath => ['lifecycleActions', actionName, fieldName];

const createDefaultActionValue = (
  handlerType: ContainerHandlerType = 'httpGet',
): ContainerActionFormValue => ({
  enabled: true,
  handlerType,
  scheme: 'HTTP',
  path: '/',
  port: 80,
  command: '',
});

const withHandlerDefaults = (
  value: ContainerActionFormValue | undefined,
  handlerType: ContainerHandlerType,
): ContainerActionFormValue => ({
  ...createDefaultActionValue(handlerType),
  ...value,
  enabled: true,
  handlerType,
  scheme: value?.scheme || 'HTTP',
  path: value?.path || '/',
  port: value?.port ?? 80,
  command: value?.command || '',
});

const validateCommand = async (_: unknown, value?: string) => {
  const commands = (value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (commands.length === 0) {
    throw new Error('请输入命令');
  }
};

const ContainerLifecycleFields = () => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  const didSeedDefaultActionRef = useRef(false);
  const lifecycleActions =
    (Form.useWatch('lifecycleActions', {
      form,
      preserve: true,
    }) as ContainerLifecycleActionsValue) || {};

  useEffect(() => {
    if (didSeedDefaultActionRef.current) {
      return;
    }

    didSeedDefaultActionRef.current = true;
    const hasEnabledAction = ACTION_OPTIONS.some(
      (action) => lifecycleActions[action.name]?.enabled,
    );

    if (!hasEnabledAction) {
      form.setFieldValue(
        getActionName('postStart'),
        createDefaultActionValue(),
      );
    }
  }, [form, lifecycleActions]);

  const addAction = (actionName: ContainerLifecycleActionName) => {
    form.setFieldValue(getActionName(actionName), createDefaultActionValue());
  };

  const selectHandler = (
    actionName: ContainerLifecycleActionName,
    handlerType: ContainerHandlerType,
  ) => {
    const current = form.getFieldValue(getActionName(actionName)) as
      | ContainerActionFormValue
      | undefined;

    form.setFieldValue(
      getActionName(actionName),
      withHandlerDefaults(current, handlerType),
    );
  };

  const renderHandlerTabs = (
    actionName: ContainerLifecycleActionName,
    handlerType: ContainerHandlerType,
  ) => (
    <SegmentedTabs
      items={HANDLER_OPTIONS}
      value={handlerType}
      onChange={(value) => selectHandler(actionName, value)}
    />
  );

  const renderHttpFields = (actionName: ContainerLifecycleActionName) => {
    const pathName = getActionFieldName(actionName, 'path');
    const portName = getActionFieldName(actionName, 'port');

    return (
      <ContainerHttpTargetFields
        compactRow
        pathName={pathName}
        portName={portName}
        schemeName={getActionFieldName(actionName, 'scheme')}
      />
    );
  };

  const renderCommandFields = (actionName: ContainerLifecycleActionName) => (
    <Form.Item
      label="命令"
      name={getActionFieldName(actionName, 'command')}
      required
      rules={[{ validator: validateCommand }]}
    >
      <Input.TextArea className={styles.textarea} rows={3} />
      <div className={styles.fieldHelp}>使用半角逗号（,）分隔多条命令。</div>
    </Form.Item>
  );

  const renderTcpFields = (actionName: ContainerLifecycleActionName) => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="端口"
          name={getActionFieldName(actionName, 'port')}
          rules={[
            { required: true, message: '请输入端口' },
            {
              type: 'number',
              min: 1,
              max: 65535,
              message: '端口范围为 1-65535',
            },
          ]}
        >
          <InputNumber
            min={1}
            max={65535}
            precision={0}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderActionEditor = (
    actionName: ContainerLifecycleActionName,
    actionValue: ContainerActionFormValue,
  ) => {
    const handlerType = actionValue.handlerType || 'httpGet';

    return (
      <div className={styles.actionEditor}>
        <div className={styles.editorHeader}>
          {renderHandlerTabs(actionName, handlerType)}
        </div>
        {handlerType === 'httpGet' && renderHttpFields(actionName)}
        {handlerType === 'exec' && renderCommandFields(actionName)}
        {handlerType === 'tcpSocket' && renderTcpFields(actionName)}
      </div>
    );
  };

  return (
    <div className={styles.actions}>
      {ACTION_OPTIONS.map((action) => {
        const actionValue = lifecycleActions[action.name];
        const enabled = Boolean(actionValue?.enabled);

        return (
          <div key={action.name}>
            <div className={styles.actionTitle}>{action.title}</div>
            {enabled && actionValue ? (
              renderActionEditor(action.name, actionValue)
            ) : (
              <button
                className={styles.addAction}
                type="button"
                onClick={() => addAction(action.name)}
              >
                <PlusOutlined />
                添加动作
              </button>
            )}
            <div className={styles.actionDescription}>{action.description}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ContainerLifecycleFields;
