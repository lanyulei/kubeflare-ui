import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Checkbox, Form, InputNumber, message, Select } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { KeyValueEditor } from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import { createKeyValueItem } from './helpers';
import type { CreateServiceFormValues } from './types';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  sectionTitle: {
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  option: {
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
    alignItems: 'start',
    gap: token.marginSM,
  },
  optionHeaderButton: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
    width: '100%',
    padding: 0,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#36435C',
    fontSize: token.fontSizeSM,
  },
  checkbox: {
    marginTop: 2,
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
  body: {
    marginTop: `14px`,
    borderRadius: token.borderRadiusSM,

    '.ant-form-item-label > label': {
      fontSize: token.fontSizeSM,
    },
  },
  field: {
    width: 'min(460px, 100%)',
  },
  extra: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  metadataBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    marginTop: `14px`,
    borderRadius: token.borderRadiusSM,
  },
  fieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type ServiceAdvancedSettingsProps = {
  form: FormInstance<CreateServiceFormValues>;
};

type ServiceAdvancedOptionProps = {
  children?: ReactNode;
  description: ReactNode;
  formItemName: keyof CreateServiceFormValues;
  title: ReactNode;
};

const ServiceAdvancedOption = ({
  children,
  description,
  formItemName,
  title,
}: ServiceAdvancedOptionProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.option}>
      <div className={styles.optionHeader}>
        <Form.Item
          className={styles.checkbox}
          name={formItemName}
          valuePropName="checked"
        >
          <Checkbox aria-label={String(title)} />
        </Form.Item>
        <span>
          <div className={styles.title}>{title}</div>
          <div className={styles.description}>{description}</div>
        </span>
      </div>
      {children}
    </div>
  );
};

const SERVICE_EXTERNAL_ACCESS_OPTIONS = [
  { label: 'NodePort', value: 'NodePort' },
  { label: 'LoadBalancer', value: 'LoadBalancer' },
];

type ServiceExternalAccessSectionProps = {
  form: FormInstance<CreateServiceFormValues>;
};

const ServiceExternalAccessSection = ({
  form,
}: ServiceExternalAccessSectionProps) => {
  const { styles } = useStyles();
  const enableExternalAccess = Form.useWatch('enableExternalAccess', form);

  return (
    <div>
      <div className={styles.sectionTitle}>外部访问</div>
      <ServiceAdvancedOption
        description="设置从集群外访问服务的方式。"
        formItemName="enableExternalAccess"
        title="外部访问"
      >
        {enableExternalAccess && (
          <div className={styles.body}>
            <Form.Item label="访问模式" name="externalAccessMode">
              <Select
                className={styles.field}
                options={SERVICE_EXTERNAL_ACCESS_OPTIONS}
              />
            </Form.Item>
          </div>
        )}
      </ServiceAdvancedOption>
    </div>
  );
};

type ServiceSessionAffinitySectionProps = {
  form: FormInstance<CreateServiceFormValues>;
};

const ServiceSessionAffinitySection = ({
  form,
}: ServiceSessionAffinitySectionProps) => {
  const { styles } = useStyles();
  const enableSessionAffinity = Form.useWatch('enableSessionAffinity', form);

  return (
    <div>
      <div className={styles.sectionTitle}>会话保持</div>
      <ServiceAdvancedOption
        description="设置系统在指定的时间内将同一个会话中来自同一个客户端的请求全部转发给同一个容器组。"
        formItemName="enableSessionAffinity"
        title="会话保持"
      >
        {enableSessionAffinity && (
          <div className={styles.body}>
            <Form.Item
              label="最长会话保持时间（s）"
              name="sessionAffinityTimeoutSeconds"
              rules={[
                { required: true, message: '请输入最长会话保持时间' },
                {
                  type: 'number',
                  min: 0,
                  max: 86400,
                  message: '取值范围为 0 到 86400',
                },
              ]}
            >
              <InputNumber className={styles.field} min={0} max={86400} />
            </Form.Item>
            <div className={styles.extra}>
              设置最大会话保持时间。取值范围为 0 到 86400，默认值 10800。
            </div>
          </div>
        )}
      </ServiceAdvancedOption>
    </div>
  );
};

const ServiceAdvancedSettings = ({ form }: ServiceAdvancedSettingsProps) => {
  const { styles } = useStyles();
  const [metadataOpen, setMetadataOpen] = useState(true);
  const labels = (Form.useWatch('labels', form) as KeyValueEditorItem[]) || [];

  useEffect(() => {
    if (metadataOpen && labels.length === 0) {
      form.setFieldValue('labels', [createKeyValueItem()]);
    }
  }, [form, labels.length, metadataOpen]);

  return (
    <div className={styles.stack}>
      <ServiceExternalAccessSection form={form} />
      <ServiceSessionAffinitySection form={form} />

      <div>
        <div className={styles.sectionTitle}>元数据</div>
        <div className={styles.option}>
          <button
            className={styles.optionHeaderButton}
            type="button"
            onClick={() => setMetadataOpen((open) => !open)}
          >
            <span className={styles.headerIcon}>
              {metadataOpen ? <UpOutlined /> : <DownOutlined />}
            </span>
            <span>
              <div className={styles.title}>添加元数据</div>
              <div className={styles.description}>为服务添加元数据。</div>
            </span>
          </button>
          {metadataOpen && (
            <div className={styles.metadataBody}>
              <div>
                <div className={styles.fieldLabel}>标签</div>
                <Form.Item name="labels">
                  <KeyValueEditor
                    addIcon={false}
                    addText="添加"
                    deleteAriaLabel="删除标签"
                    onAddBlocked={() =>
                      message.warning('请先填写已有标签的键。')
                    }
                    onCreateItem={() => createKeyValueItem()}
                  />
                </Form.Item>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { ServiceExternalAccessSection, ServiceSessionAffinitySection };
export default ServiceAdvancedSettings;
