import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Form, message } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { KeyValueEditor } from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import { createKeyValueItem } from './helpers';
import type { CreateIngressFormValues } from './types';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sectionTitle: {
    marginBottom: 8,
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
  metadataBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
    marginTop: 14,
    borderRadius: token.borderRadiusSM,
  },
  fieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type IngressAdvancedSettingsProps = {
  form: FormInstance<CreateIngressFormValues>;
};

const IngressAdvancedSettings = ({ form }: IngressAdvancedSettingsProps) => {
  const { styles } = useStyles();
  const [metadataOpen, setMetadataOpen] = useState(true);
  const annotations =
    (Form.useWatch('annotations', form) as KeyValueEditorItem[]) || [];
  const labels = (Form.useWatch('labels', form) as KeyValueEditorItem[]) || [];

  useEffect(() => {
    if (!metadataOpen) {
      return;
    }
    if (annotations.length === 0) {
      form.setFieldValue('annotations', [createKeyValueItem()]);
    }
    if (labels.length === 0) {
      form.setFieldValue('labels', [createKeyValueItem()]);
    }
  }, [annotations.length, form, labels.length, metadataOpen]);

  return (
    <div className={styles.stack}>
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
              <div className={styles.description}>为应用路由添加元数据。</div>
            </span>
          </button>
          {metadataOpen && (
            <div className={styles.metadataBody}>
              <div>
                <div className={styles.fieldLabel}>注解</div>
                <Form.Item name="annotations">
                  <KeyValueEditor
                    addIcon={false}
                    addText="添加"
                    deleteAriaLabel="删除注解"
                    onAddBlocked={() =>
                      message.warning('请先填写已有注解的键。')
                    }
                    onCreateItem={() => createKeyValueItem()}
                  />
                </Form.Item>
              </div>
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

export default IngressAdvancedSettings;
