import {
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Modal, Tooltip } from 'antd';
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  card: {
    minHeight: 64,
    padding: `${token.paddingSM}px ${token.paddingMD}px`,
    border: `1px solid color-mix(in srgb, ${token.colorBorder} 72%, ${token.colorBgContainer})`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    transition: `border-color ${token.motionDurationMid} ${token.motionEaseOut}, box-shadow ${token.motionDurationMid} ${token.motionEaseOut}`,

    '&:hover': {
      borderColor: token.colorBorder,
      boxShadow: token.boxShadowTertiary,
    },
  },
  cardHeader: {
    display: 'grid',
    gridTemplateColumns: '40px minmax(0, 1fr) max-content',
    alignItems: 'center',
    gap: token.marginLG,
    minHeight: 40,
  },
  icon: {
    color: token.colorTextDescription,
    fontSize: 32,
  },
  title: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  description: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXL,
  },
  actionButton: {
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorPrimary,
    },
  },
  add: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: token.marginSM,
    minHeight: 64,
    padding: '12px 20px',
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    font: 'inherit',
    textAlign: 'left',

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      outline: `${token.lineWidthFocus}px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 2,
    },
  },
  addText: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginXXS,
  },
  addTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  addDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  modal: {
    '.ant-modal-body': {
      paddingTop: token.paddingMD,
    },
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
        {value.length > 0 && (
          <div className={styles.list}>
            {value.map((item) => (
              <div className={styles.card} key={item.id}>
                <div className={styles.cardHeader}>
                  <KeyOutlined className={styles.icon} />
                  <div>
                    <Tooltip title={item.keyName} placement="topLeft">
                      <div className={styles.title}>{item.keyName || '-'}</div>
                    </Tooltip>
                    <Tooltip title={item.value || '空'} placement="topLeft">
                      <div className={styles.description}>
                        {item.value || '空'}
                      </div>
                    </Tooltip>
                  </div>
                  {!reservedKeys.includes(item.keyName) && (
                    <div className={styles.actions}>
                      <Tooltip title="删除数据">
                        <Button
                          aria-label="删除数据"
                          className={styles.actionButton}
                          icon={<DeleteOutlined />}
                          type="text"
                          onClick={() => deleteItem(item.id)}
                        />
                      </Tooltip>
                      <Tooltip title="编辑数据">
                        <Button
                          aria-label="编辑数据"
                          className={styles.actionButton}
                          icon={<EditOutlined />}
                          type="text"
                          onClick={() => openEditModal(item)}
                        />
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <button className={styles.add} type="button" onClick={openCreateModal}>
          <PlusOutlined />
          <span className={styles.addText}>
            <span className={styles.addTitle}>添加数据</span>
            <span className={styles.addDescription}>添加键值对数据。</span>
          </span>
        </button>
      </div>
      <Modal
        className={styles.modal}
        destroyOnHidden
        maskClosable={false}
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
