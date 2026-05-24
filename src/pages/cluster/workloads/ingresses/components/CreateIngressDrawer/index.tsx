import {
  AppstoreOutlined,
  CloseOutlined,
  GlobalOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Steps,
  Switch,
} from 'antd';
import { createStyles } from 'antd-style';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { YamlEditor } from '@/components';
import { getClusterServiceList } from '@/services/kubeflare/cluster/resource';
import {
  buildCreateIngressManifest,
  buildCreateIngressYaml,
  getIngressStepFields,
  getInitialCreateIngressValues,
  INGRESS_API_VERSION,
  INGRESS_KIND,
  INGRESS_RESOURCE_TYPE,
  isValidIngressRule,
  NAME_PATTERN,
} from './helpers';
import IngressAdvancedSettings from './IngressAdvancedSettings';
import IngressRuleSettings from './IngressRuleSettings';
import type { CreateIngressFormValues, IngressServiceOption } from './types';

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
  headerExtra: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
  },
  yamlSwitch: {
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    borderRadius: 999,
    background: token.colorFillSecondary,
  },
  steps: {
    padding: '15px 20px',
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,

    '.ant-steps-item-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    '.ant-steps-item-title': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeightSM,
    },

    '.ant-steps-item-description': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },
  },
  body: {
    height: 'calc(100vh - 205px)',
    overflow: 'auto',
    padding: `${token.paddingLG}px`,
    background: token.colorBgContainer,
  },
  yamlBody: {
    height: 'calc(100vh - 131px)',
    padding: token.paddingLG,
    background: token.colorBgContainer,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  footerActions: {
    display: 'flex',
    gap: token.marginSM,
  },
  section: {
    marginBottom: token.marginLG,
  },
}));

type CreateIngressDrawerProps = {
  defaultNamespace?: string;
  loading?: boolean;
  namespaceOptions: { label: string; value: string }[];
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

const hasKeyValueContent = (items?: { keyName?: string }[]) =>
  (items || []).some((item) => item.keyName?.trim());

const hasRouteRuleContent = (values: CreateIngressFormValues) =>
  (values.rules || []).some(isValidIngressRule) || values.enablePathRewrite;

const hasAdvancedSettingsContent = (values: CreateIngressFormValues) =>
  hasKeyValueContent(values.labels) || hasKeyValueContent(values.annotations);

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateIngressFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && hasRouteRuleContent(values)) {
    return '已设置';
  }
  if (index === 2 && hasAdvancedSettingsContent(values)) {
    return '已设置';
  }
  return '未设置';
};

const CreateIngressDrawer = ({
  defaultNamespace,
  loading = false,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateIngressDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateIngressFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const [serviceOptions, setServiceOptions] = useState<IngressServiceOption[]>(
    [],
  );
  const values = Form.useWatch([], { form, preserve: true }) || {};
  const namespace = Form.useWatch('namespace', { form, preserve: true });
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '路由规则',
        icon: <GlobalOutlined />,
      },
      {
        title: '高级设置',
        icon: <SlidersOutlined />,
      },
    ],
    [],
  );

  const loadServiceOptions = useCallback(async (nextNamespace?: string) => {
    if (!nextNamespace) {
      setServiceOptions([]);
      return;
    }

    const res = await getClusterServiceList({ namespace: nextNamespace });
    setServiceOptions(
      (res.data.items || []).flatMap((item) =>
        item.name && item.name !== '-'
          ? [
              {
                label: item.name,
                ports: (item.ports || []).flatMap((port) =>
                  port.port ? [port.port] : [],
                ),
                value: item.name,
              },
            ]
          : [],
      ),
    );
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialCreateIngressValues(defaultNamespace);
    form.resetFields();
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateIngressYaml(initialValues));
    loadServiceOptions(defaultNamespace);
  }, [defaultNamespace, form, loadServiceOptions, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    loadServiceOptions(namespace);
  }, [loadServiceOptions, namespace, open]);

  const syncYamlFromForm = () => {
    setYamlValue(buildCreateIngressYaml(form.getFieldsValue(true)));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const handleNext = async () => {
    await form.validateFields(getIngressStepFields(current));
    setCurrent((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    if (yamlMode) {
      let manifest: unknown;
      try {
        manifest = parse(yamlValue);
      } catch {
        message.error('YAML 格式不正确，请检查后重试');
        return;
      }

      if (
        !manifest ||
        typeof manifest !== 'object' ||
        Array.isArray(manifest)
      ) {
        message.error('YAML 内容必须是有效的资源对象');
        return;
      }

      const resource = manifest as Record<string, unknown>;
      const metadataRecord = getRecordValue(resource.metadata);
      const name =
        typeof metadataRecord?.name === 'string' ? metadataRecord.name : '';
      const namespaceValue =
        typeof metadataRecord?.namespace === 'string'
          ? metadataRecord.namespace
          : '';
      const kind = typeof resource.kind === 'string' ? resource.kind : '';
      const apiVersion =
        typeof resource.apiVersion === 'string' ? resource.apiVersion : '';

      if (!name || !namespaceValue) {
        message.error('YAML 必须包含 metadata.name 和 metadata.namespace');
        return;
      }
      if (kind !== INGRESS_KIND) {
        message.error(`YAML kind 必须为 ${INGRESS_KIND}`);
        return;
      }
      if (apiVersion !== INGRESS_API_VERSION) {
        message.error(`YAML apiVersion 必须为 ${INGRESS_API_VERSION}`);
        return;
      }

      await onSubmit({
        type: INGRESS_RESOURCE_TYPE,
        namespace: namespaceValue,
        manifest: resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    await onSubmit({
      type: INGRESS_RESOURCE_TYPE,
      namespace: formValues.namespace,
      manifest: buildCreateIngressManifest(formValues),
    });
  };

  const renderBasicInfo = () => (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="名称"
          name="name"
          rules={[
            { required: true, message: '请输入名称' },
            { max: 63, message: '名称最长 63 个字符' },
            {
              pattern: NAME_PATTERN,
              message:
                '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾',
            },
          ]}
        >
          <Input autoFocus placeholder="请输入名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="命名空间"
          name="namespace"
          rules={[{ required: true, message: '请选择命名空间' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={namespaceOptions}
            placeholder="请选择命名空间"
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const stepContent = [
    renderBasicInfo,
    () => <IngressRuleSettings form={form} serviceOptions={serviceOptions} />,
    () => <IngressAdvancedSettings form={form} />,
  ][current];

  return (
    <Drawer
      className={styles.drawer}
      closeIcon={<CloseOutlined />}
      destroyOnHidden
      extra={
        <div className={styles.headerExtra}>
          <Space className={styles.yamlSwitch}>
            <span>编辑 YAML</span>
            <Switch checked={yamlMode} onChange={handleYamlModeChange} />
          </Space>
        </div>
      }
      footer={
        <div className={styles.footer}>
          <span />
          <div className={styles.footerActions}>
            <Button onClick={onCancel}>取消</Button>
            {!yamlMode && current > 0 && (
              <Button onClick={() => setCurrent((step) => step - 1)}>
                上一步
              </Button>
            )}
            {!yamlMode && current < steps.length - 1 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button loading={loading} type="primary" onClick={handleSubmit}>
                创建
              </Button>
            )}
          </div>
        </div>
      }
      keyboard={false}
      maskClosable={false}
      open={open}
      title="创建应用路由"
      width="78vw"
      onClose={onCancel}
    >
      {yamlMode ? (
        <div className={styles.yamlBody}>
          <YamlEditor
            height="calc(100vh - 179px)"
            value={yamlValue}
            onChange={setYamlValue}
          />
        </div>
      ) : (
        <>
          <Steps
            className={styles.steps}
            current={current}
            items={steps.map((step, index) => ({
              ...step,
              disabled: index > current + 1,
              description: getStepStatusText(current, index, values),
            }))}
            onChange={async (nextStep) => {
              if (nextStep <= current) {
                setCurrent(nextStep);
                return;
              }
              if (nextStep > current + 1) {
                return;
              }
              await form.validateFields(getIngressStepFields(current));
              setCurrent(nextStep);
            }}
          />
          <div className={styles.body}>
            <Form
              form={form}
              layout="vertical"
              requiredMark
              onValuesChange={() => {
                if (!yamlMode) {
                  setYamlValue(
                    buildCreateIngressYaml(form.getFieldsValue(true)),
                  );
                }
              }}
            >
              <div className={styles.section}>{stepContent()}</div>
            </Form>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default CreateIngressDrawer;
