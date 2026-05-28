import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, Form, Input } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { UnitInputNumber } from '@/components';
import { getRecordValue, getStringValue } from './helpers';

type PersistentVolumeClaimFormValues = {
  name?: string;
  size?: number;
};

type PersistentVolumeClaimEditDrawerProps = {
  currentSizeGi?: number;
  loading?: boolean;
  manifest?: Record<string, unknown>;
  open: boolean;
  onCancel: () => void;
};

type PersistentVolumeClaimCloneDrawerProps =
  PersistentVolumeClaimEditDrawerProps & {
    onSubmit: (manifest: Record<string, unknown>) => Promise<void>;
  };

type PersistentVolumeClaimExpandDrawerProps =
  PersistentVolumeClaimEditDrawerProps & {
    onSubmit: (storage: string) => Promise<void>;
  };

type PersistentVolumeClaimEditDrawerShellProps =
  PersistentVolumeClaimEditDrawerProps & {
    children: ReactNode;
    submitText?: string;
    title: string;
    onSubmit: () => Promise<void>;
  };

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
    maxWidth: 520,
  },
  field: {
    width: '100%',
  },
  helpText: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

const cloneManifest = (manifest: Record<string, unknown>) =>
  JSON.parse(JSON.stringify(manifest)) as Record<string, unknown>;

const cleanPersistentVolumeClaimMetadata = (
  metadata?: Record<string, unknown>,
) => {
  const nextMetadata = {
    ...(metadata || {}),
  };

  delete nextMetadata.creationTimestamp;
  delete nextMetadata.deletionGracePeriodSeconds;
  delete nextMetadata.deletionTimestamp;
  delete nextMetadata.finalizers;
  delete nextMetadata.generation;
  delete nextMetadata.managedFields;
  delete nextMetadata.resourceVersion;
  delete nextMetadata.selfLink;
  delete nextMetadata.uid;

  return nextMetadata;
};

const getPersistentVolumeClaimSizeGi = (manifest?: Record<string, unknown>) => {
  const spec = getRecordValue(manifest?.spec);
  const status = getRecordValue(manifest?.status);
  const specResources = getRecordValue(spec?.resources);
  const specRequests = getRecordValue(specResources?.requests);
  const statusCapacity = getRecordValue(status?.capacity);
  const storage =
    getStringValue(statusCapacity?.storage) ||
    getStringValue(specRequests?.storage);

  if (!storage) {
    return undefined;
  }

  const matched = storage.match(/^(\d+(?:\.\d+)?)(Ki|Mi|Gi|Ti)?$/);

  if (!matched) {
    return undefined;
  }

  const value = Number(matched[1]);
  const unit = matched[2] || 'Gi';

  if (!Number.isFinite(value)) {
    return undefined;
  }
  if (unit === 'Ki') {
    return Math.ceil(value / 1024 / 1024);
  }
  if (unit === 'Mi') {
    return Math.ceil(value / 1024);
  }
  if (unit === 'Ti') {
    return Math.ceil(value * 1024);
  }

  return Math.ceil(value);
};

const buildPersistentVolumeClaimCloneManifest = (
  manifest: Record<string, unknown>,
  name: string,
  sizeGi: number,
) => {
  const nextManifest = cloneManifest(manifest);
  const metadata = cleanPersistentVolumeClaimMetadata(
    getRecordValue(nextManifest.metadata),
  );
  const spec = {
    ...(getRecordValue(nextManifest.spec) || {}),
  };
  const resources = {
    ...(getRecordValue(spec.resources) || {}),
  };
  const requests = {
    ...(getRecordValue(resources.requests) || {}),
    storage: `${sizeGi}Gi`,
  };
  const sourceMetadata = getRecordValue(manifest.metadata);

  delete nextManifest.status;
  delete spec.volumeName;
  delete spec.volumeMode;
  delete spec.selector;

  metadata.name = name;
  spec.resources = {
    ...resources,
    requests,
  };
  spec.dataSource = {
    kind: 'PersistentVolumeClaim',
    name: getStringValue(sourceMetadata?.name),
  };

  return {
    ...nextManifest,
    metadata,
    spec,
  };
};

const PersistentVolumeClaimEditDrawerShell = ({
  children,
  loading = false,
  open,
  submitText = '保存',
  title,
  onCancel,
  onSubmit,
}: PersistentVolumeClaimEditDrawerShellProps) => {
  const { styles } = useStyles();

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      footer={
        <div className={styles.footer}>
          <Button onClick={onCancel}>取消</Button>
          <Button loading={loading} type="primary" onClick={onSubmit}>
            {submitText}
          </Button>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title={title}
      width="64vw"
      onClose={onCancel}
    >
      {children}
    </Drawer>
  );
};

const PersistentVolumeClaimCloneDrawer = ({
  currentSizeGi,
  loading = false,
  manifest,
  open,
  onCancel,
  onSubmit,
}: PersistentVolumeClaimCloneDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<PersistentVolumeClaimFormValues>();
  const sourceName = getStringValue(getRecordValue(manifest?.metadata)?.name);
  const minSize = currentSizeGi || 1;

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: sourceName ? `${sourceName}-clone` : undefined,
        size: minSize,
      });
    }
  }, [form, minSize, open, sourceName]);

  const handleSubmit = async () => {
    if (!manifest) {
      return;
    }

    const values = await form.validateFields();

    await onSubmit(
      buildPersistentVolumeClaimCloneManifest(
        manifest,
        values.name?.trim() || '',
        values.size || minSize,
      ),
    );
  };

  return (
    <PersistentVolumeClaimEditDrawerShell
      loading={loading}
      open={open}
      submitText="创建"
      title="克隆持久卷声明"
      onCancel={onCancel}
      onSubmit={handleSubmit}
    >
      <Form className={styles.form} form={form} layout="vertical" requiredMark>
        <Form.Item
          label="名称"
          name="name"
          rules={[
            { required: true, message: '请输入名称' },
            {
              pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
              message: '名称只能包含小写字母、数字和中划线',
            },
          ]}
        >
          <Input className={styles.field} placeholder="请输入名称" />
        </Form.Item>
        <Form.Item
          label="容量"
          name="size"
          rules={[
            { required: true, message: '请输入容量' },
            {
              type: 'number',
              min: minSize,
              message: `容量不能小于当前容量 ${minSize}Gi`,
            },
          ]}
        >
          <UnitInputNumber
            className={styles.field}
            min={minSize}
            precision={0}
            unit="Gi"
          />
        </Form.Item>
        <div className={styles.helpText}>
          克隆会基于当前 PVC 创建新的持久卷声明，访问模式和存储类保持一致。
        </div>
      </Form>
    </PersistentVolumeClaimEditDrawerShell>
  );
};

const PersistentVolumeClaimExpandDrawer = ({
  currentSizeGi,
  loading = false,
  manifest,
  open,
  onCancel,
  onSubmit,
}: PersistentVolumeClaimExpandDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<PersistentVolumeClaimFormValues>();
  const minSize = currentSizeGi || 1;

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        size: minSize,
      });
    }
  }, [form, minSize, open]);

  const handleSubmit = async () => {
    if (!manifest) {
      return;
    }

    const values = await form.validateFields();
    await onSubmit(`${values.size || minSize}Gi`);
  };

  return (
    <PersistentVolumeClaimEditDrawerShell
      loading={loading}
      open={open}
      title="拓展持久卷声明"
      onCancel={onCancel}
      onSubmit={handleSubmit}
    >
      <Form className={styles.form} form={form} layout="vertical" requiredMark>
        <Form.Item
          label="容量"
          name="size"
          rules={[
            { required: true, message: '请输入容量' },
            {
              type: 'number',
              min: minSize,
              message: `容量不能小于当前容量 ${minSize}Gi`,
            },
          ]}
        >
          <UnitInputNumber
            className={styles.field}
            min={minSize}
            precision={0}
            unit="Gi"
          />
        </Form.Item>
        <div className={styles.helpText}>
          仅支持增大容量，实际生效能力取决于当前存储类是否允许卷拓展。
        </div>
      </Form>
    </PersistentVolumeClaimEditDrawerShell>
  );
};

export {
  getPersistentVolumeClaimSizeGi,
  PersistentVolumeClaimCloneDrawer,
  PersistentVolumeClaimExpandDrawer,
};
