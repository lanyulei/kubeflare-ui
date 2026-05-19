import {
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Select, Tooltip } from 'antd';
import { createStyles } from 'antd-style';

const PORT_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const protocolOptions = [
  { label: 'HTTP', value: 'HTTP' },
  { label: 'HTTPS', value: 'HTTPS' },
  { label: 'TCP', value: 'TCP' },
  { label: 'UDP', value: 'UDP' },
  { label: 'SCTP', value: 'SCTP' },
];

const useStyles = createStyles(({ token }) => ({
  ports: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  portRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(160px, 1fr) minmax(180px, 1.1fr) minmax(180px, 1.1fr) 32px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 999,
    background: token.colorFillSecondary,

    '& + &': {
      marginTop: 0,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      borderRadius: token.borderRadiusSM,
      padding: token.paddingSM,
    },
  },
  inputPrefix: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
  },
  helpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: 12,
  },
  formItem: {
    marginBottom: 0,
  },
  compactField: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-select-selector': {
      border: '0 !important',
      boxShadow: 'none !important',
    },
  },
  addon: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    padding: `0 ${token.paddingSM}px`,
    borderRight: `1px solid ${token.colorBorder}`,
    background: token.colorFillQuaternary,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: '30px',
    whiteSpace: 'nowrap',
  },
  prefixedControl: {
    '.ant-input-prefix, .ant-input-number-prefix': {
      marginInlineEnd: token.marginXS,
      color: token.colorText,
      fontSize: token.fontSizeSM,
      whiteSpace: 'nowrap',
    },
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },

    '@media (max-width: 768px)': {
      justifySelf: 'end',
    },
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
}));

const getDefaultPort = (index: number) => ({
  protocol: 'HTTP',
  name: `http-${index}`,
});

const ContainerPortFields = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.ports}>
      <Form.List name="containerPorts">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <div className={styles.portRow} key={field.key}>
                <div className={styles.formItem}>
                  <div className={styles.compactField}>
                    <span className={styles.addon}>
                      <span className={styles.inputPrefix}>
                        协议
                        <Tooltip title="HTTP/HTTPS 会在提交时按 TCP 容器端口协议生成。">
                          <QuestionCircleOutlined className={styles.helpIcon} />
                        </Tooltip>
                      </span>
                    </span>
                    <Form.Item name={[field.name, 'protocol']} noStyle>
                      <Select options={protocolOptions} />
                    </Form.Item>
                  </div>
                </div>
                <Form.Item
                  className={styles.formItem}
                  name={[field.name, 'name']}
                  rules={[
                    { max: 15, message: '端口名称最长 15 个字符' },
                    {
                      pattern: PORT_NAME_PATTERN,
                      message: '端口名称只能包含小写字母、数字和连字符（-）',
                    },
                  ]}
                >
                  <Input
                    className={styles.prefixedControl}
                    placeholder="例如 http-0"
                    prefix="名称"
                  />
                </Form.Item>
                <Form.Item
                  className={styles.formItem}
                  name={[field.name, 'containerPort']}
                  rules={[
                    {
                      type: 'number',
                      min: 1,
                      max: 65535,
                      message: '端口范围为 1-65535',
                    },
                  ]}
                >
                  <InputNumber
                    className={styles.prefixedControl}
                    min={1}
                    max={65535}
                    prefix="容器端口"
                    precision={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Button
                  aria-label="删除端口"
                  className={styles.deleteButton}
                  icon={<DeleteOutlined />}
                  type="text"
                  onClick={() => remove(field.name)}
                />
              </div>
            ))}
            <div className={styles.actions}>
              <Button
                icon={<PlusOutlined />}
                onClick={() => add(getDefaultPort(fields.length))}
              >
                添加端口
              </Button>
            </div>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default ContainerPortFields;
