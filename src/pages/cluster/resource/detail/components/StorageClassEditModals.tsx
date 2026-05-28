import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Form, Switch } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import type { StorageClassVolumeOperations } from './storageClassHelpers';

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: token.paddingLG,
      background: token.colorBgContainer,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
  form: {
    width: '100%',
  },
  operationList: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
  },
  operationItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginLG,
    minHeight: 56,
    padding: `${token.paddingSM}px ${token.padding}px`,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,

    '&:last-child': {
      borderBottom: 0,
    },

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  operationLabel: {
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
  },
}));

type StorageClassVolumeOperationFormValues = {
  allowVolumeClone?: boolean;
  allowVolumeExpansion?: boolean;
  allowVolumeSnapshot?: boolean;
};

type StorageClassVolumeOperationModalProps = {
  loading?: boolean;
  open: boolean;
  values: StorageClassVolumeOperations;
  onCancel: () => void;
  onSubmit: (values: StorageClassVolumeOperationFormValues) => Promise<void>;
};

const StorageClassVolumeOperationModal = ({
  loading = false,
  open,
  values,
  onCancel,
  onSubmit,
}: StorageClassVolumeOperationModalProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<StorageClassVolumeOperationFormValues>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        allowVolumeClone: Boolean(values.allowVolumeClone),
        allowVolumeExpansion: Boolean(values.allowVolumeExpansion),
        allowVolumeSnapshot: Boolean(values.allowVolumeSnapshot),
      });
    }
  }, [form, open, values]);

  const handleOk = async () => {
    await form.validateFields();
    await onSubmit(form.getFieldsValue(true));
  };

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      footer={
        <div className={styles.footer}>
          <Button onClick={onCancel}>取消</Button>
          <Button loading={loading} type="primary" onClick={handleOk}>
            保存
          </Button>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title="设置卷操作"
      width={520}
      onClose={onCancel}
    >
      <Form<StorageClassVolumeOperationFormValues>
        className={styles.form}
        form={form}
        layout="horizontal"
      >
        <div className={styles.operationList}>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>允许卷克隆</span>
            <Form.Item name="allowVolumeClone" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>允许卷快照</span>
            <Form.Item name="allowVolumeSnapshot" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <div className={styles.operationItem}>
            <span className={styles.operationLabel}>允许卷扩展</span>
            <Form.Item name="allowVolumeExpansion" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Drawer>
  );
};

export type { StorageClassVolumeOperationFormValues };
export { StorageClassVolumeOperationModal };
