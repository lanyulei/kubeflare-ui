import type { FormItemProps } from 'antd';
import { Form, message } from 'antd';
import { createStyles } from 'antd-style';
import type { KeyValueEditorItem } from '../KeyValueEditor';
import KeyValueEditor from '../KeyValueEditor';

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

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createMetadataItem = (keyName = '', value = ''): KeyValueEditorItem => ({
  id: createId(),
  keyName,
  value,
});

type MetadataFieldConfig = {
  addBlockedMessage: string;
  deleteAriaLabel: string;
  itemName: FormItemProps['name'];
  title: string;
};

type ResourceMetadataFieldsProps = {
  annotationsName?: FormItemProps['name'];
  labelsName?: FormItemProps['name'];
  order?: ('annotations' | 'labels')[];
};

const getFieldConfig = (
  type: 'annotations' | 'labels',
  names: Pick<ResourceMetadataFieldsProps, 'annotationsName' | 'labelsName'>,
): MetadataFieldConfig => {
  if (type === 'labels') {
    return {
      addBlockedMessage: '请先填写已有标签的键。',
      deleteAriaLabel: '删除标签',
      itemName: names.labelsName ?? 'labels',
      title: '标签',
    };
  }

  return {
    addBlockedMessage: '请先填写已有注解的键。',
    deleteAriaLabel: '删除注解',
    itemName: names.annotationsName ?? 'annotations',
    title: '注解',
  };
};

const ResourceMetadataFields = ({
  annotationsName = 'annotations',
  labelsName = 'labels',
  order = ['labels', 'annotations'],
}: ResourceMetadataFieldsProps) => {
  const { styles } = useStyles();

  return (
    <div className={styles.stack}>
      {order.map((type) => {
        const field = getFieldConfig(type, {
          annotationsName,
          labelsName,
        });

        return (
          <div className={styles.field} key={type}>
            <div className={styles.fieldTitle}>{field.title}</div>
            <Form.Item name={field.itemName}>
              <KeyValueEditor
                addIcon={false}
                addText="添加"
                deleteAriaLabel={field.deleteAriaLabel}
                minRows={1}
                onAddBlocked={() => message.warning(field.addBlockedMessage)}
                onCreateItem={() => createMetadataItem()}
              />
            </Form.Item>
          </div>
        );
      })}
    </div>
  );
};

export type { ResourceMetadataFieldsProps };
export default ResourceMetadataFields;
