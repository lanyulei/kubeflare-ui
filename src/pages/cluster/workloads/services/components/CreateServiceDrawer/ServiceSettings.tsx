import {
  AppstoreOutlined,
  ClusterOutlined,
  DeleteOutlined,
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

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  sectionTitle: {
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  accessMode: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    overflow: 'hidden',
  },
  accessModeItem: {
    display: 'grid',
    gridTemplateColumns: '36px minmax(0, 1fr) 20px',
    alignItems: 'center',
    gap: token.marginMD,
    width: '100%',
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',

    '& + &': {
      borderTop: `1px solid ${token.colorBorderSecondary}`,
    },
  },
  selectedAccessMode: {
    '&&': {
      background: token.colorPrimaryBg,
      boxShadow: `inset 0 0 0 1px ${token.colorPrimaryBorder}`,
    },
  },
  accessIcon: {
    color: '#36435C',
    fontSize: 28,
  },
  accessTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  description: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  selectorBlock: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  portPanel: {
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  portDescription: {
    marginBottom: token.marginMD,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  portRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  portRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(124px, 0.7fr) minmax(132px, 0.9fr) minmax(112px, 0.8fr) minmax(112px, 0.8fr) 40px',
    alignItems: 'center',
    gap: token.marginXS,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  fieldGroup: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    alignItems: 'center',

    '.ant-input-group-addon': {
      color: token.colorTextSecondary,
      background: token.colorFillQuaternary,
    },

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  protocolGroup: {
    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  addon: {
    height: 32,
    padding: `0 ${token.paddingSM}px`,
    border: `1px solid ${token.colorBorder}`,
    borderRight: 0,
    borderRadius: `${token.borderRadius}px 0 0 ${token.borderRadius}px`,
    background: token.colorFillQuaternary,
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: '30px',
    whiteSpace: 'nowrap',
  },
  portInput: {
    minWidth: 0,
    width: '100%',
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: token.marginSM,
  },
}));

type AccessModeSelectorProps = {
  value?: ServiceInternalAccessMode;
  onChange?: (value: ServiceInternalAccessMode) => void;
};

const ACCESS_MODES: {
  description: string;
  icon: ReactNode;
  title: string;
  value: ServiceInternalAccessMode;
}[] = [
  {
    description:
      '为服务分配虚拟 IP 地址，可通过虚拟 IP 地址在集群内部访问服务。',
    icon: <ClusterOutlined />,
    title: '虚拟 IP 地址',
    value: 'ClusterIP',
  },
  {
    description:
      '不为服务分配 IP 地址，可通过集群的 DNS 机制在集群内部访问服务。',
    icon: <AppstoreOutlined />,
    title: '内部域名',
    value: 'Headless',
  },
];

const AccessModeSelector = ({ value, onChange }: AccessModeSelectorProps) => {
  const { styles, cx } = useStyles();

  return (
    <div className={styles.accessMode}>
      {ACCESS_MODES.map((item) => (
        <button
          className={cx(
            styles.accessModeItem,
            value === item.value && styles.selectedAccessMode,
          )}
          key={item.value}
          type="button"
          onClick={() => onChange?.(item.value)}
        >
          <span className={styles.accessIcon}>{item.icon}</span>
          <span>
            <div className={styles.accessTitle}>{item.title}</div>
            <div className={styles.description}>{item.description}</div>
          </span>
          <span />
        </button>
      ))}
    </div>
  );
};

type ServicePortEditorProps = {
  value?: ServicePortItem[];
  onChange?: (value: ServicePortItem[]) => void;
};

const ServicePortEditor = ({
  value = [],
  onChange,
}: ServicePortEditorProps) => {
  const { styles } = useStyles();

  const updateItem = (
    id: string,
    field: keyof Omit<ServicePortItem, 'id'>,
    nextValue: ServicePortItem[keyof Omit<ServicePortItem, 'id'>],
  ) => {
    onChange?.(
      value.map((item) =>
        item.id === id ? { ...item, [field]: nextValue } : item,
      ),
    );
  };

  const addDisabled = value.some((item) => !item.servicePort);

  return (
    <>
      <div className={styles.portRows}>
        {value.map((item) => (
          <div className={styles.portRow} key={item.id}>
            <div className={styles.protocolGroup}>
              <Input.Group compact>
                <span className={styles.addon}>
                  协议
                  <Tooltip title="服务端口协议">
                    <span> ?</span>
                  </Tooltip>
                </span>
                <Select<ServicePortProtocol>
                  className={styles.portInput}
                  options={PROTOCOL_OPTIONS}
                  value={item.protocol}
                  onChange={(nextValue) =>
                    updateItem(item.id, 'protocol', nextValue)
                  }
                />
              </Input.Group>
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.addon}>名称</span>
              <Input
                className={styles.portInput}
                placeholder="http-"
                value={item.name}
                onChange={(event) =>
                  updateItem(item.id, 'name', event.target.value)
                }
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.addon}>容器端口</span>
              <InputNumber
                className={styles.portInput}
                min={1}
                max={65535}
                precision={0}
                value={item.containerPort}
                onChange={(nextValue) =>
                  updateItem(
                    item.id,
                    'containerPort',
                    typeof nextValue === 'number' ? nextValue : undefined,
                  )
                }
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.addon}>服务端口</span>
              <InputNumber
                className={styles.portInput}
                min={1}
                max={65535}
                placeholder="必填"
                precision={0}
                value={item.servicePort}
                onChange={(nextValue) =>
                  updateItem(
                    item.id,
                    'servicePort',
                    typeof nextValue === 'number' ? nextValue : undefined,
                  )
                }
              />
            </div>
            <Button
              aria-label="删除端口"
              className={styles.deleteButton}
              icon={<DeleteOutlined />}
              type="text"
              onClick={() =>
                onChange?.(value.filter((port) => port.id !== item.id))
              }
            />
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <Button
          disabled={addDisabled}
          onClick={() => {
            if (addDisabled) {
              message.warning('请先填写已有端口的服务端口。');
              return;
            }
            onChange?.([...value, createServicePortItem()]);
          }}
        >
          添加
        </Button>
      </div>
    </>
  );
};

type ServiceSettingsProps = {
  form: FormInstance<CreateServiceFormValues>;
};

const ServiceSettings = ({ form }: ServiceSettingsProps) => {
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
      <div>
        <div className={styles.sectionTitle}>内部访问模式</div>
        <Form.Item name="internalAccessMode">
          <AccessModeSelector />
        </Form.Item>
      </div>

      <div className={styles.selectorBlock}>
        <Form.Item
          label="工作负载选择器"
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
            addIcon={false}
            addText="添加"
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

      <div>
        <div className={styles.sectionTitle}>端口</div>
        <div className={styles.portPanel}>
          <div className={styles.portDescription}>设置容器端口和服务端口。</div>
          <Form.Item
            name="ports"
            rules={[
              {
                validator: async (_, value?: ServicePortItem[]) => {
                  if ((value || []).some((item) => item.servicePort)) {
                    return;
                  }
                  throw new Error('请添加至少一个服务端口');
                },
              },
            ]}
          >
            <ServicePortEditor />
          </Form.Item>
        </div>
      </div>

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
