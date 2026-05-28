import { CloseOutlined } from '@ant-design/icons';
import { App, Button, Drawer, Form, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import {
  buildUpdatedSecretSettingsManifest,
  getSecretFormValuesFromManifest,
  getSecretStepFields,
  validateSecretDataItems,
} from '../../../config/secrets/components/CreateSecretDrawer/helpers';
import SecretDataSettings from '../../../config/secrets/components/CreateSecretDrawer/SecretDataSettings';
import type {
  CreateSecretFormValues,
  SecretType,
} from '../../../config/secrets/components/CreateSecretDrawer/types';

const useStyles = createStyles(({ token }) => ({
  drawer: {
    '.ant-drawer-header': {
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
    },
    '.ant-drawer-body': {
      padding: 0,
      background: token.colorBgLayout,
    },
    '.ant-drawer-footer': {
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      background: token.colorBgContainer,
    },
  },
  body: {
    minHeight: 'calc(100vh - 116px)',
    overflow: 'auto',
    padding: token.paddingLG,
    background: token.colorBgContainer,

    '.ant-form-item-extra': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
}));

type SecretSettingsEditDrawerProps = {
  loading?: boolean;
  manifest?: Record<string, unknown>;
  namespace?: string;
  open: boolean;
  onCancel: () => void;
  onSubmit: (manifest: Record<string, unknown>) => Promise<void>;
};

const SecretSettingsEditDrawer = ({
  loading = false,
  manifest,
  namespace,
  open,
  onCancel,
  onSubmit,
}: SecretSettingsEditDrawerProps) => {
  const { message } = App.useApp();
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateSecretFormValues>();
  const secretType =
    Form.useWatch('type', { form, preserve: true }) || 'Opaque';

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();
    form.setFieldsValue(getSecretFormValuesFromManifest(manifest, namespace));
  }, [form, manifest, namespace, open]);

  const handleSubmit = async () => {
    if (!manifest) {
      return;
    }

    await form.validateFields(getSecretStepFields(1, secretType as SecretType));
    const values = form.getFieldsValue(true);

    if (values.type === 'Opaque') {
      const error = validateSecretDataItems(values.dataItems);

      if (error) {
        message.warning(error);
        return;
      }
    }

    await onSubmit(buildUpdatedSecretSettingsManifest(manifest, values));
  };

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      footer={
        <div className={styles.footer}>
          <Button onClick={onCancel}>取消</Button>
          <Button loading={loading} type="primary" onClick={handleSubmit}>
            保存
          </Button>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title="编辑设置"
      width="78vw"
      onClose={onCancel}
    >
      <Spin spinning={!manifest}>
        <div className={styles.body}>
          <Form form={form} layout="vertical" preserve requiredMark>
            <SecretDataSettings form={form} />
          </Form>
        </div>
      </Spin>
    </Drawer>
  );
};

export { SecretSettingsEditDrawer };
