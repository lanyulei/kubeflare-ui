import { App, Button, Drawer, Space, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import { parse } from 'yaml';
import { YamlEditor } from '@/components';
import { dryRunRbacManifest } from '@/services/kubeflare/cluster/rbac';
import {
  createClusterResource,
  updateClusterResourceManifest,
} from '@/services/kubeflare/cluster/resource';
import { RBAC_RESOURCE_TYPES } from '../constants';

const useStyles = createStyles(() => ({
  body: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
}));

type RbacYamlDrawerProps = {
  open: boolean;
  title: string;
  value?: string;
  mode?: 'view' | 'edit' | 'create';
  resourceType?: API.ClusterResourceCreateType;
  namespace?: string;
  name?: string;
  loading?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请稍后重试';

const isRbacResourceType = (
  kind?: unknown,
): kind is (typeof RBAC_RESOURCE_TYPES)[number] =>
  typeof kind === 'string' &&
  RBAC_RESOURCE_TYPES.includes(kind as (typeof RBAC_RESOURCE_TYPES)[number]);

const RbacYamlDrawer = ({
  open,
  title,
  value = '',
  mode = 'view',
  resourceType,
  namespace,
  name,
  loading,
  onClose,
  onSuccess,
}: RbacYamlDrawerProps) => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [yamlValue, setYamlValue] = useState(value);
  const [submitting, setSubmitting] = useState(false);
  const editable = mode !== 'view';

  useEffect(() => {
    setYamlValue(value);
  }, [value]);

  const parseManifest = () => {
    const manifest = parse(yamlValue) as Record<string, unknown>;
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('YAML 内容不能为空');
    }
    if (!isRbacResourceType(manifest.kind)) {
      throw new Error(
        '仅支持 Role、ClusterRole、RoleBinding、ClusterRoleBinding',
      );
    }
    return manifest;
  };

  const handleDryRun = async () => {
    setSubmitting(true);
    try {
      await dryRunRbacManifest(parseManifest(), { skipErrorHandler: true });
      message.success('Dry Run 校验通过');
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const manifest = parseManifest();
      if (mode === 'create') {
        await createClusterResource({
          type: manifest.kind as API.ClusterResourceCreateType,
          namespace: (manifest.metadata as { namespace?: string })?.namespace,
          manifest,
        });
      } else if (resourceType && name) {
        await updateClusterResourceManifest({
          type: resourceType,
          namespace,
          name,
          manifest,
        });
      }
      message.success(mode === 'create' ? '资源已创建' : '资源已更新');
      onSuccess?.();
      onClose();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      destroyOnHidden
      open={open}
      title={title}
      width="65vw"
      extra={
        editable ? (
          <Space>
            <Button loading={submitting} onClick={handleDryRun}>
              Dry Run
            </Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              提交
            </Button>
          </Space>
        ) : null
      }
      onClose={onClose}
    >
      <Spin spinning={Boolean(loading)}>
        <div className={styles.body}>
          <YamlEditor
            height="calc(100vh - 116px)"
            readOnly={!editable}
            value={yamlValue}
            onChange={setYamlValue}
          />
        </div>
      </Spin>
    </Drawer>
  );
};

export default RbacYamlDrawer;
