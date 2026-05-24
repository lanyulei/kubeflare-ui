import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Tooltip, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { createSecretDataItem } from './helpers';
import type { SecretDataItem } from './types';

const { TextArea } = Input;

const useStyles = createStyles(({ token }) => ({
  editor: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    width: '100%',
  },
  addCard: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: 64,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    background: token.colorFillQuaternary,
    color: 'inherit',
    cursor: 'pointer',
    font: 'inherit',
    textAlign: 'left',
    transition: `all ${token.motionDurationMid}`,

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorPrimaryBg,
    },

    '&:focus-visible': {
      outline: `${token.lineWidthFocus}px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 2,
    },
  },
  addIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    marginRight: token.marginSM,
    borderRadius: token.borderRadiusLG,
    color: token.colorPrimary,
    background: token.colorPrimaryBg,
  },
  addTitle: {
    color: token.colorText,
    fontWeight: 500,
    lineHeight: token.lineHeight,
  },
  addDescription: {
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  item: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 0.7fr) minmax(160px, 1fr) auto',
    alignItems: 'center',
    gap: token.marginMD,
    minHeight: 48,
    padding: `${token.paddingXS}px ${token.paddingSM}px ${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    background: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      alignItems: 'start',
    },
  },
  itemField: {
    minWidth: 0,
  },
  itemLabel: {
    marginRight: token.marginXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  itemValue: {
    color: token.colorText,
  },
  itemValueCell: {
    minWidth: 0,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  actions: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
  },
}));

type DataModalValues = {
  keyName: string;
  value: string;
};

type SecretDataEditorProps = {
  reservedKeys?: string[];
  value?: SecretDataItem[];
  onChange?: (value: SecretDataItem[]) => void;
};

const SecretDataEditor = ({
  reservedKeys = [],
  value = [],
  onChange,
}: SecretDataEditorProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<DataModalValues>();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const editingItem = useMemo(
    () => value.find((item) => item.id === editingId),
    [editingId, value],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      keyName: editingItem?.keyName || '',
      value: editingItem?.value || '',
    });
  }, [editingItem, form, open]);

  const openCreateModal = () => {
    setEditingId(undefined);
    form.resetFields();
    setOpen(true);
  };

  const openEditModal = (item: SecretDataItem) => {
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const keyName = values.keyName.trim();
    const nextItem = editingItem
      ? {
          ...editingItem,
          keyName,
          value: values.value,
        }
      : createSecretDataItem(keyName, values.value);

    onChange?.(
      editingItem
        ? value.map((item) => (item.id === editingItem.id ? nextItem : item))
        : [...value, nextItem],
    );
    setOpen(false);
  };

  const deleteItem = (id: string) => {
    onChange?.(value.filter((item) => item.id !== id));
  };

  return (
    <>
      <div className={styles.editor}>
        {value.map((item) => (
          <div className={styles.item} key={item.id}>
            <div className={styles.itemField}>
              <span className={styles.itemLabel}>键</span>
              <Tooltip title={item.keyName} placement="topLeft">
                <Typography.Text
                  className={styles.itemValue}
                  ellipsis
                  title={undefined}
                >
                  {item.keyName}
                </Typography.Text>
              </Tooltip>
            </div>
            <div className={styles.itemValueCell}>
              <span className={styles.itemLabel}>值</span>
              <Tooltip title={item.value} placement="topLeft">
                <Typography.Text ellipsis title={undefined}>
                  {item.value || '-'}
                </Typography.Text>
              </Tooltip>
            </div>
            <div className={styles.actions}>
              <Button
                aria-label="编辑数据"
                icon={<EditOutlined />}
                type="text"
                onClick={() => openEditModal(item)}
              />
              <Button
                aria-label="删除数据"
                icon={<DeleteOutlined />}
                type="text"
                onClick={() => deleteItem(item.id)}
              />
            </div>
          </div>
        ))}
        <button
          className={styles.addCard}
          type="button"
          onClick={openCreateModal}
        >
          <span className={styles.addIcon}>
            <PlusOutlined />
          </span>
          <div>
            <div className={styles.addTitle}>添加数据</div>
            <div className={styles.addDescription}>添加键值对数据。</div>
          </div>
        </button>
      </div>
      <Modal
        destroyOnHidden
        okText={editingItem ? '保存' : '添加'}
        open={open}
        title={editingItem ? '编辑数据' : '添加数据'}
        width={720}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="键"
            name="keyName"
            rules={[
              {
                required: true,
                message: '请输入键',
              },
              {
                validator: (_, fieldValue?: string) => {
                  const keyName = fieldValue?.trim();

                  if (!keyName) {
                    return Promise.resolve();
                  }
                  if (
                    reservedKeys.includes(keyName) &&
                    editingItem?.keyName !== keyName
                  ) {
                    return Promise.reject(
                      new Error(`${keyName} 为系统生成字段`),
                    );
                  }
                  if (
                    value.some(
                      (item) =>
                        item.id !== editingId &&
                        item.keyName.trim() === keyName,
                    )
                  ) {
                    return Promise.reject(new Error('键不能重复'));
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item label="值" name="value">
            <TextArea autoSize={{ minRows: 5, maxRows: 10 }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SecretDataEditor;
