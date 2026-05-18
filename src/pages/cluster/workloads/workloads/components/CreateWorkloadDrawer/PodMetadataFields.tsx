import { Checkbox, Form, message } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import { KeyValueEditor } from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

const useStyles = createStyles(({ token }) => ({
  metadata: {
    padding: `14px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  header: {
    display: 'grid',
    gridTemplateColumns: '18px minmax(0, 1fr)',
    gap: token.marginSM,
    alignItems: 'start',
  },
  checkbox: {
    marginTop: 3,
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
  content: {
    marginTop: `10px`,

    '.ant-form-item-label': {
      paddingBottom: `10px`,
    },

    '.ant-form-item-label > label': {
      height: 'auto',
      color: token.colorText,
      fontSize: token.fontSizeSM,
      fontWeight: 600,
      lineHeight: token.lineHeight,
    },
  },
}));

const createKeyValueItem = (keyName = '', value = ''): KeyValueEditorItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  keyName,
  value,
});

const PodMetadataFields = () => {
  const { styles } = useStyles();
  const form = Form.useFormInstance();
  const enabled = Form.useWatch('enablePodMetadata', form);
  const annotations = Form.useWatch('podAnnotations', form);

  useEffect(() => {
    if (enabled && (!annotations || annotations.length === 0)) {
      form.setFieldValue('podAnnotations', [createKeyValueItem()]);
    }
  }, [annotations, enabled, form]);

  return (
    <div className={styles.metadata}>
      <div className={styles.header}>
        <Form.Item
          className={styles.checkbox}
          name="enablePodMetadata"
          valuePropName="checked"
        >
          <Checkbox aria-label="启用容器组元数据" />
        </Form.Item>
        <span>
          <div className={styles.title}>添加元数据</div>
          <div className={styles.description}>为容器组副本添加元数据。</div>
        </span>
      </div>
      {enabled && (
        <div className={styles.content}>
          <Form.Item label="注解" name="podAnnotations">
            <KeyValueEditor
              addIcon={false}
              addText="添加"
              deleteAriaLabel="删除注解"
              footerJustify="flex-end"
              onAddBlocked={() => message.warning('请先填写已有注解的键。')}
              onCreateItem={() => createKeyValueItem()}
            />
          </Form.Item>
        </div>
      )}
    </div>
  );
};

export default PodMetadataFields;
