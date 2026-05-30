import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Drawer, Form, message } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { KeyValueEditor } from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import {
  buildIngressFormValuesFromManifest,
  buildIngressRouteManifest,
  createKeyValueItem,
} from '../../../workloads/ingresses/components/CreateIngressDrawer/helpers';
import IngressRuleSettings from '../../../workloads/ingresses/components/CreateIngressDrawer/IngressRuleSettings';
import type {
  CreateIngressFormValues,
  IngressServiceOption,
} from '../../../workloads/ingresses/components/CreateIngressDrawer/types';

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
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
  body: {
    height: 'calc(100vh - 131px)',
    overflow: 'auto',
    padding: token.paddingLG,
    background: token.colorBgContainer,
  },
  section: {
    marginBottom: token.marginLG,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  option: {
    padding: '12px 16px',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  optionHeader: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#36435C',
    fontSize: token.fontSizeSM,
  },
  title: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  description: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  metadataBody: {
    marginTop: 14,
    borderRadius: token.borderRadiusSM,
  },
  fieldLabel: {
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type IngressEditDrawerShellProps = {
  children: ReactNode;
  loading?: boolean;
  open: boolean;
  title: string;
  onCancel: () => void;
  onSubmit: () => void;
};

type IngressRouteRulesEditDrawerProps = {
  loading?: boolean;
  manifest?: Record<string, unknown>;
  namespace?: string;
  open: boolean;
  serviceOptions: IngressServiceOption[];
  onCancel: () => void;
  onSubmit: (manifest: Record<string, unknown>) => Promise<void>;
};

type IngressAnnotationsEditDrawerProps = {
  loading?: boolean;
  open: boolean;
  rows: KeyValueEditorItem[];
  onCancel: () => void;
  onChange: (rows: KeyValueEditorItem[]) => void;
  onSubmit: () => void;
};

const IngressEditDrawerShell = ({
  children,
  loading = false,
  open,
  title,
  onCancel,
  onSubmit,
}: IngressEditDrawerShellProps) => {
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
            保存
          </Button>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title={title}
      width="78vw"
      onClose={onCancel}
    >
      <div className={styles.body}>{children}</div>
    </Drawer>
  );
};

const IngressRouteRulesEditDrawer = ({
  loading = false,
  manifest,
  namespace,
  open,
  serviceOptions,
  onCancel,
  onSubmit,
}: IngressRouteRulesEditDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateIngressFormValues>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        buildIngressFormValuesFromManifest(manifest, namespace),
      );
    }
  }, [form, manifest, namespace, open]);

  const handleSubmit = async () => {
    if (!manifest) {
      return;
    }

    await form.validateFields([
      'rules',
      'ingressClassName',
      'tlsSecretName',
      'enablePathRewrite',
      'rewriteTarget',
    ]);
    const values = form.getFieldsValue(true);
    await onSubmit(buildIngressRouteManifest(values, manifest));
  };

  return (
    <IngressEditDrawerShell
      loading={loading}
      open={open}
      title="编辑路由规则"
      onCancel={onCancel}
      onSubmit={handleSubmit}
    >
      <Form form={form} layout="vertical" requiredMark>
        <div className={styles.section}>
          <IngressRuleSettings form={form} serviceOptions={serviceOptions} />
        </div>
      </Form>
    </IngressEditDrawerShell>
  );
};

const IngressAnnotationsEditDrawer = ({
  loading = false,
  open,
  rows,
  onCancel,
  onChange,
  onSubmit,
}: IngressAnnotationsEditDrawerProps) => {
  const { styles } = useStyles();

  return (
    <IngressEditDrawerShell
      loading={loading}
      open={open}
      title="编辑注解"
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <Form layout="vertical">
        <div className={styles.stack}>
          <div>
            <div className={styles.sectionTitle}>元数据</div>
            <div className={styles.option}>
              <div className={styles.optionHeader}>
                <span className={styles.headerIcon}>
                  <EditOutlined />
                </span>
                <span>
                  <div className={styles.title}>编辑注解</div>
                  <div className={styles.description}>
                    为应用路由配置注解信息。
                  </div>
                </span>
              </div>
              <div className={styles.metadataBody}>
                <div className={styles.fieldLabel}>注解</div>
                <KeyValueEditor
                  addIcon={false}
                  addText="添加"
                  deleteAriaLabel="删除注解"
                  value={rows}
                  onAddBlocked={() => message.warning('请先填写已有注解的键。')}
                  onChange={onChange}
                  onCreateItem={() => createKeyValueItem()}
                />
              </div>
            </div>
          </div>
        </div>
      </Form>
    </IngressEditDrawerShell>
  );
};

export { IngressAnnotationsEditDrawer, IngressRouteRulesEditDrawer };
