import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, InputNumber, Row, Select } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import type {
  ContainerActionFormValue,
  ContainerHandlerType,
  ContainerLifecycleActionName,
  ContainerLifecycleActionsValue,
} from '../types';

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

const SCHEME_OPTIONS = [
  { label: 'HTTP', value: 'HTTP' },
  { label: 'HTTPS', value: 'HTTPS' },
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
    display: 'flex',
    width: '100%',
    minHeight: 64,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: token.marginXXS,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    fontSize: token.fontSizeSM,
    textAlign: 'left',
    transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },
  },
  addTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  addDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  actionEditor: {
    padding: token.paddingSM,
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
    justifyContent: 'space-between',
    gap: token.marginSM,
    marginBottom: token.marginSM,
  },
  handlerTabs: {
    display: 'grid',
    width: 'min(454px, 100%)',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 2,
    padding: 2,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: 999,
    background: token.colorFillQuaternary,
  },
  handlerTab: {
    height: 28,
    border: 0,
    borderRadius: 999,
    background: 'transparent',
    color: token.colorText,
    cursor: 'pointer',
    fontSize: token.fontSizeSM,
    lineHeight: '28px',
    textAlign: 'center',
    transition: `background ${token.motionDurationMid}, color ${token.motionDurationMid}`,

    '&:hover': {
      background: token.colorFillSecondary,
    },
  },
  handlerTabActive: {
    background: token.colorText,
    color: token.colorBgContainer,

    '&:hover': {
      background: token.colorText,
    },
  },
  removeButton: {
    flexShrink: 0,
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  httpTarget: {
    display: 'grid',
    minHeight: 40,
    gridTemplateColumns:
      'minmax(120px, 0.8fr) minmax(160px, 1fr) minmax(120px, 1fr)',
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: 999,
    background: token.colorBgContainer,

    '.ant-select-selector, .ant-input, .ant-input-number': {
      border: '0 !important',
      borderRadius: '0 !important',
      boxShadow: 'none !important',
    },

    '.ant-input-number': {
      width: '100%',
    },

    '.ant-select, .ant-input, .ant-input-number': {
      height: '100%',
    },

    '.ant-input-number-input': {
      height: 38,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      borderRadius: token.borderRadiusSM,

      '.ant-select-selector, .ant-input, .ant-input-number': {
        borderBottom: `1px solid ${token.colorBorderSecondary} !important`,
      },
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

const FieldErrors = ({ names }: { names: NamePath[] }) => {
  const form = Form.useFormInstance();

  return (
    <Form.Item noStyle shouldUpdate>
      {() => {
        const errors = names.flatMap((name) => form.getFieldError(name));

        return errors.length > 0 ? <Form.ErrorList errors={errors} /> : null;
      }}
    </Form.Item>
  );
};

const ContainerLifecycleFields = () => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  const lifecycleActions =
    (Form.useWatch(
      'lifecycleActions',
      form,
    ) as ContainerLifecycleActionsValue) || {};

  const addAction = (actionName: ContainerLifecycleActionName) => {
    form.setFieldValue(getActionName(actionName), createDefaultActionValue());
  };

  const removeAction = (actionName: ContainerLifecycleActionName) => {
    form.setFieldValue(getActionName(actionName), undefined);
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
    <div className={styles.handlerTabs}>
      {HANDLER_OPTIONS.map((option) => (
        <button
          className={[
            styles.handlerTab,
            option.value === handlerType ? styles.handlerTabActive : '',
          ].join(' ')}
          key={option.value}
          type="button"
          onClick={() => selectHandler(actionName, option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const renderHttpFields = (actionName: ContainerLifecycleActionName) => {
    const pathName = getActionFieldName(actionName, 'path');
    const portName = getActionFieldName(actionName, 'port');

    return (
      <Form.Item label="路径" required>
        <div className={styles.httpTarget}>
          <Form.Item name={getActionFieldName(actionName, 'scheme')} noStyle>
            <Select options={SCHEME_OPTIONS} />
          </Form.Item>
          <Form.Item
            name={pathName}
            noStyle
            rules={[{ required: true, message: '请输入路径' }]}
          >
            <Input placeholder="/" />
          </Form.Item>
          <Form.Item
            name={portName}
            noStyle
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
            <InputNumber min={1} max={65535} precision={0} />
          </Form.Item>
        </div>
        <FieldErrors names={[pathName, portName]} />
      </Form.Item>
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
          <Button
            aria-label="移除动作"
            className={styles.removeButton}
            icon={<DeleteOutlined />}
            type="text"
            onClick={() => removeAction(actionName)}
          />
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
                <span className={styles.addTitle}>添加动作</span>
                <span className={styles.addDescription}>
                  {action.description}
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ContainerLifecycleFields;
