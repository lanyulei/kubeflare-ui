import {
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  UpOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Tooltip,
} from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { KeyValueEditor } from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import { createKeyValueItem, createServicePortItem } from './helpers';
import type {
  CreateServiceFormValues,
  ServiceInternalAccessMode,
  ServicePortItem,
  ServicePortProtocol,
} from './types';
import WorkloadSelectorModal from './WorkloadSelectorModal';

const PORT_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const PORT_NUMBER_RULES = [
  {
    type: 'number' as const,
    min: 1,
    max: 65535,
    message: '端口范围为 1-65535',
  },
];

const PROTOCOL_OPTIONS: { label: string; value: ServicePortProtocol }[] = [
  { label: 'GRPC', value: 'GRPC' },
  { label: 'HTTP', value: 'HTTP' },
  { label: 'HTTP2', value: 'HTTP2' },
  { label: 'HTTPS', value: 'HTTPS' },
  { label: 'MONGO', value: 'MONGO' },
  { label: 'REDIS', value: 'REDIS' },
  { label: 'TCP', value: 'TCP' },
  { label: 'TLS', value: 'TLS' },
  { label: 'UDP', value: 'UDP' },
];

const ACCESS_MODES: {
  description: string;
  title: string;
  value: ServiceInternalAccessMode;
}[] = [
  {
    description:
      '为服务分配虚拟 IP 地址，可通过虚拟 IP 地址在集群内部访问服务。',
    title: '虚拟 IP 地址',
    value: 'ClusterIP',
  },
  {
    description:
      '不为服务分配 IP 地址，可通过集群的 DNS 机制在集群内部访问服务。',
    title: '内部域名',
    value: 'Headless',
  },
];

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: `16px`,
  },
  section: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
  },
  sectionTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionContent: {
    marginTop: 8,
  },
  accessMode: {
    position: 'relative',
    overflow: 'visible',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  accessModeOptions: {
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
  accessModeItem: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 24px',
    alignItems: 'center',
    gap: token.marginSM,
    width: '100%',
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
  accessTitle: {
    display: 'block',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  accessDescription: {
    display: 'block',
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  accessArrow: {
    justifySelf: 'end',
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
  },
  selectorBlock: {
    '.ant-form-item': {
      marginBottom: 0,
    },

    '.ant-alert': {
      marginTop: token.marginSM,
    },
  },
  portRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  portRow: {
    display: 'grid',
    minHeight: 46,
    gridTemplateColumns:
      'minmax(180px, 0.9fr) minmax(136px, 1fr) minmax(136px, 0.8fr) minmax(136px, 0.8fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  formItem: {
    marginBottom: 0,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
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

    '.ant-select-single': {
      height: 32,
    },

    '.ant-input, .ant-input-number': {
      height: 32,
      border: 0,
      boxShadow: 'none',
      background: token.colorBgContainer,
    },

    '.ant-input-number': {
      width: '100%',
    },

    '.ant-input-number-focused': {
      boxShadow: 'none',
    },

    '.ant-input-number-input': {
      height: 32,
      paddingInlineStart: token.paddingSM,
    },

    '.ant-form-item-control-input': {
      minHeight: 32,
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
  helpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: 12,
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },

    '@media (max-width: 768px)': {
      gridColumn: 2,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
}));

type AccessModeSelectorProps = {
  value?: ServiceInternalAccessMode;
  onChange?: (value: ServiceInternalAccessMode) => void;
};

const AccessModeSelector = ({ value, onChange }: AccessModeSelectorProps) => {
  const { styles } = useStyles();
  const [open, setOpen] = useState(false);
  const selectedMode =
    ACCESS_MODES.find((item) => item.value === value) || ACCESS_MODES[0];

  const renderMode = (
    item: (typeof ACCESS_MODES)[number],
    showArrow: boolean,
  ) => (
    <button
      className={styles.accessModeItem}
      key={item.value}
      type="button"
      onClick={() => {
        if (showArrow) {
          setOpen((current) => !current);
          return;
        }
        onChange?.(item.value);
        setOpen(false);
      }}
    >
      <span>
        <span className={styles.accessTitle}>{item.title}</span>
        <span className={styles.accessDescription}>{item.description}</span>
      </span>
      {showArrow && (
        <span className={styles.accessArrow}>
          {open ? <UpOutlined /> : <DownOutlined />}
        </span>
      )}
    </button>
  );

  return (
    <div className={styles.accessMode}>
      {renderMode(selectedMode, true)}
      {open && (
        <div className={styles.accessModeOptions}>
          {ACCESS_MODES.filter((item) => item.value !== selectedMode.value).map(
            (item) => renderMode(item, false),
          )}
        </div>
      )}
    </div>
  );
};

type ServiceFormSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  tooltip?: ReactNode;
  children: ReactNode;
};

const ServiceFormSection = ({
  title,
  description,
  extra,
  tooltip,
  children,
}: ServiceFormSectionProps) => {
  const { styles } = useStyles();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>
            {title}
            {tooltip && (
              <Tooltip title={tooltip}>
                <QuestionCircleOutlined className={styles.helpIcon} />
              </Tooltip>
            )}
          </div>
          {description && (
            <div className={styles.sectionDescription}>{description}</div>
          )}
        </div>
        {extra}
      </div>
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
};

type CompactFieldProps = {
  label: ReactNode;
  children: ReactNode;
};

const CompactField = ({ label, children }: CompactFieldProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.compactField}>
      <span className={styles.addon}>{label}</span>
      {children}
    </div>
  );
};

type ServicePortEditorProps = {
  form: FormInstance<CreateServiceFormValues>;
};

const ServicePortEditor = ({ form }: ServicePortEditorProps) => {
  const { styles } = useStyles();
  const ports = (Form.useWatch('ports', form) as ServicePortItem[]) || [];
  const addDisabled = ports.some((item) => !item.servicePort);

  return (
    <Form.List
      name="ports"
      rules={[
        {
          validator: async (_, value?: ServicePortItem[]) => {
            if ((value || []).some((item) => item.servicePort)) {
              return;
            }
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          <div className={styles.portRows}>
            {fields.map((field) => (
              <div className={styles.portRow} key={field.key}>
                <Form.Item className={styles.formItem}>
                  <CompactField
                    label={
                      <>
                        协议
                        <Tooltip title="HTTP/HTTPS 等协议会在提交时写入 appProtocol，Kubernetes 端口协议按 TCP/UDP 生成。">
                          <QuestionCircleOutlined className={styles.helpIcon} />
                        </Tooltip>
                      </>
                    }
                  >
                    <Form.Item name={[field.name, 'protocol']} noStyle>
                      <Select<ServicePortProtocol>
                        options={PROTOCOL_OPTIONS}
                        placeholder="请选择协议"
                      />
                    </Form.Item>
                  </CompactField>
                </Form.Item>
                <Form.Item className={styles.formItem}>
                  <CompactField label="名称">
                    <Form.Item
                      name={[field.name, 'name']}
                      noStyle
                      rules={[
                        { max: 15, message: '端口名称最长 15 个字符' },
                        {
                          pattern: PORT_NAME_PATTERN,
                          message:
                            '端口名称只能包含小写字母、数字和连字符（-）',
                        },
                      ]}
                    >
                      <Input placeholder="例如 http-0" />
                    </Form.Item>
                  </CompactField>
                </Form.Item>
                <Form.Item className={styles.formItem}>
                  <CompactField label="容器端口">
                    <Form.Item
                      name={[field.name, 'containerPort']}
                      noStyle
                      rules={PORT_NUMBER_RULES}
                    >
                      <InputNumber
                        min={1}
                        max={65535}
                        placeholder="可选"
                        precision={0}
                      />
                    </Form.Item>
                  </CompactField>
                </Form.Item>
                <Form.Item className={styles.formItem}>
                  <CompactField label="服务端口">
                    <Form.Item
                      name={[field.name, 'servicePort']}
                      noStyle
                      rules={[
                        { required: true, message: '请输入服务端口' },
                        ...PORT_NUMBER_RULES,
                      ]}
                    >
                      <InputNumber
                        min={1}
                        max={65535}
                        placeholder="必填"
                        precision={0}
                      />
                    </Form.Item>
                  </CompactField>
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
          </div>
          <Form.ErrorList errors={errors} />
          <div className={styles.footer}>
            <Button
              disabled={addDisabled}
              icon={<PlusOutlined />}
              onClick={async () => {
                try {
                  await form.validateFields(
                    fields.flatMap((field) => [
                      ['ports', field.name, 'servicePort'],
                    ]),
                  );
                  add(createServicePortItem({ name: `http-${fields.length}` }));
                } catch {
                  // Validation errors are displayed by Form.Item.
                }
              }}
            >
              添加端口
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );
};

type ServiceSettingsProps = {
  form: FormInstance<CreateServiceFormValues>;
  showInternalAccess?: boolean;
};

const ServiceSettings = ({
  form,
  showInternalAccess = true,
}: ServiceSettingsProps) => {
  const { styles } = useStyles();
  const [workloadModalOpen, setWorkloadModalOpen] = useState(false);
  const namespace = Form.useWatch('namespace', form);
  const selectors =
    (Form.useWatch('selectors', form) as KeyValueEditorItem[]) || [];
  const ports = (Form.useWatch('ports', form) as ServicePortItem[]) || [];

  useEffect(() => {
    if (selectors.length === 0) {
      form.setFieldValue('selectors', [createKeyValueItem()]);
    }
    if (ports.length === 0) {
      form.setFieldValue('ports', [createServicePortItem()]);
    }
  }, [form, ports.length, selectors.length]);

  return (
    <div className={styles.stack}>
      {showInternalAccess && (
        <ServiceFormSection
          tooltip="选择服务在集群内部被访问时使用的地址形态"
          title="内部访问模式"
        >
          <Form.Item name="internalAccessMode" noStyle>
            <AccessModeSelector />
          </Form.Item>
        </ServiceFormSection>
      )}

      <ServiceFormSection
        tooltip="通过标签选择一组工作负载，服务流量会转发到匹配的容器组"
        title="工作负载选择"
      >
        <div className={styles.selectorBlock}>
          <Form.Item
            name="selectors"
            required
            rules={[
              {
                validator: async (_, value?: KeyValueEditorItem[]) => {
                  if ((value || []).some((item) => item.keyName?.trim())) {
                    return;
                  }
                  throw new Error('请添加至少一个工作负载选择器');
                },
              },
            ]}
          >
            <KeyValueEditor
              addIcon
              addText="添加选择器"
              deleteAriaLabel="删除工作负载选择器"
              footerExtra={
                <Button onClick={() => setWorkloadModalOpen(true)}>
                  指定工作负载
                </Button>
              }
              footerJustify="space-between"
              onAddBlocked={() =>
                message.warning('请先填写已有工作负载选择器的键。')
              }
              onCreateItem={() => createKeyValueItem()}
            />
          </Form.Item>
          {!selectors.some((item) => item.keyName?.trim()) && (
            <Alert
              banner
              message="没有工作负载匹配当前选择器。"
              showIcon={false}
              type="warning"
            />
          )}
        </div>
      </ServiceFormSection>

      <ServiceFormSection
        tooltip="设置服务端口与目标容器端口，端口协议会同步写入服务清单"
        title="端口"
      >
        <ServicePortEditor form={form} />
      </ServiceFormSection>

      <WorkloadSelectorModal
        namespace={namespace}
        open={workloadModalOpen}
        onCancel={() => setWorkloadModalOpen(false)}
        onOk={(workload) => {
          const nextSelector = workload.selector || workload.labels || {};
          form.setFieldValue(
            'selectors',
            Object.entries(nextSelector).map(([keyName, value]) =>
              createKeyValueItem(keyName, value),
            ),
          );
          setWorkloadModalOpen(false);
        }}
      />
    </div>
  );
};

export default ServiceSettings;
