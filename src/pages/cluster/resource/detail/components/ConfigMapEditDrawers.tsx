import { CloseOutlined } from '@ant-design/icons';
import { App, Button, Drawer, Form, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import ConfigMapDataSettings from '../../../config/config-maps/components/CreateConfigMapDrawer/ConfigMapDataSettings';
import {
  buildUpdatedConfigMapSettingsManifest,
  getConfigMapFormValuesFromManifest,
  getConfigMapStepFields,
  validateConfigMapDataItems,
} from '../../../config/config-maps/components/CreateConfigMapDrawer/helpers';
import type { CreateConfigMapFormValues } from '../../../config/config-maps/components/CreateConfigMapDrawer/types';

type ConfigMapSettingsEditDrawerProps = {
  loading?: boolean;
  manifest?: Record<string, unknown>;
  namespace?: string;
  open: boolean;
  onCancel: () => void;
  onSubmit: (manifest: Record<string, unknown>) => Promise<void>;
};

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
    height: 'calc(100vh - 116px)',
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
  section: {
    marginBottom: token.marginLG,
  },
}));

const ConfigMapSettingsEditDrawer = ({
  loading = false,
  manifest,
  namespace,
  open,
  onCancel,
  onSubmit,
}: ConfigMapSettingsEditDrawerProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateConfigMapFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();
    form.setFieldsValue(
      getConfigMapFormValuesFromManifest(manifest, namespace),
    );
  }, [form, manifest, namespace, open]);

  const handleSubmit = async () => {
    if (!manifest) {
      return;
    }

    await form.validateFields(getConfigMapStepFields(1));
    const values = form.getFieldsValue(true);
    const error = validateConfigMapDataItems(values.dataItems);

    if (error) {
      message.warning(error);
      return;
    }

    await onSubmit(buildUpdatedConfigMapSettingsManifest(manifest, values));
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
            <div className={styles.section}>
              <ConfigMapDataSettings />
            </div>
          </Form>
        </div>
      </Spin>
    </Drawer>
  );
};

export { ConfigMapSettingsEditDrawer };
