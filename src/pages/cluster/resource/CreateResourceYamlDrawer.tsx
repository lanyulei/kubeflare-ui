import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, message } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { parse, stringify } from 'yaml';
import { YamlEditor } from '@/components';

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
}));

export type CreateResourceConfig = {
  type: API.ClusterResourceCreateType;
  title: string;
  createWarning?: {
    title: string;
    description: string;
    okText?: string;
  };
  namespaced?: boolean;
  getDefaultManifest: (namespace?: string) => Record<string, unknown>;
};

type CreateResourceYamlDrawerProps = {
  config?: CreateResourceConfig;
  defaultNamespace?: string;
  loading?: boolean;
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    type: API.ClusterResourceCreateType;
    namespace?: string;
    manifest: Record<string, unknown>;
  }) => Promise<void>;
};

const getRecordValue = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const CreateResourceYamlDrawer = ({
  config,
  defaultNamespace,
  loading = false,
  open,
  onCancel,
  onSubmit,
}: CreateResourceYamlDrawerProps) => {
  const { styles } = useStyles();
  const [yamlValue, setYamlValue] = useState('');

  useEffect(() => {
    if (!open || !config) {
      return;
    }

    setYamlValue(stringify(config.getDefaultManifest(defaultNamespace)));
  }, [config, defaultNamespace, open]);

  const handleSubmit = async () => {
    if (!config) {
      return;
    }

    let manifest: unknown;
    try {
      manifest = parse(yamlValue);
    } catch {
      message.error('YAML 格式不正确，请检查后重试');
      return;
    }

    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
      message.error('YAML 内容必须是有效的资源对象');
      return;
    }

    const resource = manifest as Record<string, unknown>;
    const metadata = getRecordValue(resource.metadata);
    const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';
    const namespace =
      typeof metadata?.namespace === 'string'
        ? metadata.namespace.trim()
        : undefined;

    if (!name) {
      message.error('YAML 必须包含 metadata.name');
      return;
    }
    if (config.namespaced && !namespace) {
      message.error('YAML 必须包含 metadata.namespace');
      return;
    }

    await onSubmit({
      type: config.type,
      namespace,
      manifest: resource,
    });
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
            创建
          </Button>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title={config?.title || '新建'}
      width="64vw"
      onClose={onCancel}
    >
      <YamlEditor
        height="calc(100vh - 179px)"
        value={yamlValue}
        onChange={setYamlValue}
      />
    </Drawer>
  );
};

export default CreateResourceYamlDrawer;
