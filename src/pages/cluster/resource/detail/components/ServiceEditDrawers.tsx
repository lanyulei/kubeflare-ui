import { CloseOutlined, CloudOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Drawer, Form, message, Select } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { KeyValueEditor } from '@/components';
import {
  buildServiceExternalAccessSpecPatch,
  buildServiceFormValuesFromManifest,
  buildServiceSettingsSpecPatch,
  createKeyValueItem,
} from '../../../workloads/services/components/CreateServiceDrawer/helpers';
import { ServiceSessionAffinitySection } from '../../../workloads/services/components/CreateServiceDrawer/ServiceAdvancedSettings';
import ServiceSettings from '../../../workloads/services/components/CreateServiceDrawer/ServiceSettings';
import type { CreateServiceFormValues } from '../../../workloads/services/components/CreateServiceDrawer/types';

const useStyles = createStyles(({ token }) => ({
  drawer: {
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
  formStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginLG,
  },
  externalAccessField: {
    width: 'min(460px, 100%)',
  },
  providerOption: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginSM,
  },
  serviceSection: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
  },
  sectionTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionContent: {
    marginTop: 8,
  },
}));

type ServiceEditDrawerProps = {
  loading?: boolean;
  manifest?: Record<string, unknown>;
  open: boolean;
  onCancel: () => void;
  onSubmit: (patch: Record<string, unknown>) => Promise<void>;
};

type ServiceEditDrawerShellProps = ServiceEditDrawerProps & {
  children: (form: FormInstance<CreateServiceFormValues>) => ReactNode;
  title: string;
  width: number | string;
  onBuildPatch: (
    values: CreateServiceFormValues,
    manifest?: Record<string, unknown>,
  ) => Record<string, unknown>;
};

const LOAD_BALANCER_PROVIDER_OPTIONS = [
  { label: 'Alibaba Cloud ACK', value: 'alibaba-cloud-ack' },
  { label: 'Azure Kubernetes Service', value: 'azure-kubernetes-service' },
  { label: 'Huawei Cloud CCE', value: 'huawei-cloud-cce' },
  { label: 'Amazon EKS', value: 'amazon-eks' },
  { label: 'Google Kubernetes Engine', value: 'google-kubernetes-engine' },
  {
    label: 'QingCloud Kubernetes Engine',
    value: 'qingcloud-kubernetes-engine',
  },
  { label: 'Tencent Kubernetes Engine', value: 'tencent-kubernetes-engine' },
];

const ServiceEditDrawerShell = ({
  loading = false,
  manifest,
  open,
  onCancel,
  onSubmit,
  children,
  title,
  width,
  onBuildPatch,
}: ServiceEditDrawerShellProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateServiceFormValues>();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(buildServiceFormValuesFromManifest(manifest));
    }
  }, [form, manifest, open]);

  const handleSubmit = async () => {
    await form.validateFields();
    const values = form.getFieldsValue(true);
    await onSubmit(onBuildPatch(values, manifest));
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
      title={title}
      width={width}
      onClose={onCancel}
    >
      {children(form)}
    </Drawer>
  );
};

const ServiceSettingsEditDrawer = (props: ServiceEditDrawerProps) => {
  const { styles } = useStyles();

  return (
    <ServiceEditDrawerShell
      {...props}
      title="编辑服务"
      width="78vw"
      onBuildPatch={(values) => ({
        spec: buildServiceSettingsSpecPatch(values),
      })}
    >
      {(form) => (
        <Form
          className={styles.formStack}
          form={form}
          layout="vertical"
          requiredMark
        >
          <ServiceSettings form={form} showInternalAccess={false} />
          <ServiceSessionAffinitySection form={form} />
        </Form>
      )}
    </ServiceEditDrawerShell>
  );
};

type ServiceExternalAccessFormProps = {
  form: FormInstance<CreateServiceFormValues>;
};

type ServiceEditSectionProps = {
  children: ReactNode;
  description?: ReactNode;
  title: ReactNode;
};

const ServiceEditSection = ({
  children,
  description,
  title,
}: ServiceEditSectionProps) => {
  const { styles } = useStyles();

  return (
    <section className={styles.serviceSection}>
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.sectionTitle}>{title}</div>
          {description && (
            <div className={styles.sectionDescription}>{description}</div>
          )}
        </div>
      </div>
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
};

const ServiceExternalAccessForm = ({
  form,
}: ServiceExternalAccessFormProps) => {
  const { styles } = useStyles();
  const externalAccessMode = Form.useWatch('externalAccessMode', form);
  const externalAccessAnnotations =
    Form.useWatch('externalAccessAnnotations', form) || [];
  const providerOptions = useMemo(
    () =>
      LOAD_BALANCER_PROVIDER_OPTIONS.map((item) => ({
        value: item.value,
        label: (
          <span className={styles.providerOption}>
            <CloudOutlined />
            {item.label}
          </span>
        ),
      })),
    [styles.providerOption],
  );

  useEffect(() => {
    if (
      externalAccessMode === 'LoadBalancer' &&
      externalAccessAnnotations.length === 0
    ) {
      form.setFieldValue('externalAccessAnnotations', [createKeyValueItem()]);
    }
  }, [externalAccessAnnotations.length, externalAccessMode, form]);

  return (
    <div className={styles.formStack}>
      <ServiceEditSection
        description="设置从集群外访问服务的方式。"
        title="访问模式"
      >
        <Form.Item name="externalAccessMode">
          <Select
            aria-label="访问模式"
            className={styles.externalAccessField}
            options={[
              { label: '无', value: 'None' },
              { label: 'NodePort', value: 'NodePort' },
              { label: 'LoadBalancer', value: 'LoadBalancer' },
            ]}
          />
        </Form.Item>
      </ServiceEditSection>

      {externalAccessMode === 'LoadBalancer' && (
        <ServiceEditSection
          description="选择当前集群使用的负载均衡器实现。"
          title="负载均衡器提供商"
        >
          <Form.Item name="loadBalancerProvider">
            <Select
              allowClear
              aria-label="负载均衡器提供商"
              className={styles.externalAccessField}
              options={providerOptions}
              placeholder="请选择负载均衡器提供商"
            />
          </Form.Item>
        </ServiceEditSection>
      )}

      {externalAccessMode === 'LoadBalancer' && (
        <ServiceEditSection
          description="通过注解补充负载均衡器相关配置。"
          title="注解"
        >
          <Form.Item name="externalAccessAnnotations">
            <KeyValueEditor
              addIcon={false}
              addText="添加"
              deleteAriaLabel="删除注解"
              keyPlaceholder="键"
              valuePlaceholder="值"
              onAddBlocked={() => message.warning('请先填写已有注解的键。')}
              onCreateItem={() => createKeyValueItem()}
            />
          </Form.Item>
        </ServiceEditSection>
      )}
    </div>
  );
};

const ServiceExternalAccessEditDrawer = (props: ServiceEditDrawerProps) => (
  <ServiceEditDrawerShell
    {...props}
    title="编辑外部访问"
    width="78vw"
    onBuildPatch={buildServiceExternalAccessSpecPatch}
  >
    {(form) => (
      <Form form={form} layout="vertical">
        <ServiceExternalAccessForm form={form} />
      </Form>
    )}
  </ServiceEditDrawerShell>
);

export { ServiceExternalAccessEditDrawer, ServiceSettingsEditDrawer };
