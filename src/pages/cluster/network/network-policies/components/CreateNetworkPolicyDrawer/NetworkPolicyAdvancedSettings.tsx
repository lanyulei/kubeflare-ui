import { Form, message } from 'antd';
import { createStyles } from 'antd-style';
import { KeyValueEditor } from '@/components';
import CollapsibleField from './CollapsibleField';
import FormSection from './FormSection';
import { createKeyValueItem } from './helpers';

const useStyles = createStyles(({ token }) => ({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  fieldTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

const NetworkPolicyAdvancedSettings = () => {
  const { styles } = useStyles();

  return (
    <FormSection title="元数据">
      <CollapsibleField
        description="为 NetworkPolicy 资源添加标签和注解。"
        title="添加元数据"
      >
        <div className={styles.stack}>
          <div className={styles.field}>
            <div className={styles.fieldTitle}>标签</div>
            <Form.Item name="labels">
              <KeyValueEditor
                addIcon={false}
                addText="添加"
                deleteAriaLabel="删除标签"
                onAddBlocked={() => message.warning('请先填写已有标签的键。')}
                onCreateItem={() => createKeyValueItem()}
              />
            </Form.Item>
          </div>
          <div className={styles.field}>
            <div className={styles.fieldTitle}>注解</div>
            <Form.Item name="annotations">
              <KeyValueEditor
                addIcon={false}
                addText="添加"
                deleteAriaLabel="删除注解"
                onAddBlocked={() => message.warning('请先填写已有注解的键。')}
                onCreateItem={() => createKeyValueItem()}
              />
            </Form.Item>
          </div>
        </div>
      </CollapsibleField>
    </FormSection>
  );
};

export default NetworkPolicyAdvancedSettings;
