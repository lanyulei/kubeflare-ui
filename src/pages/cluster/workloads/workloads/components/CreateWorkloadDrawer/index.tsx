import {
  AppstoreOutlined,
  CloseOutlined,
  DockerOutlined,
  HddOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { parse } from 'yaml';
import { KeyValueEditor, YamlEditor } from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';
import {
  buildCreateWorkloadManifest,
  buildCreateWorkloadYaml,
  getInitialCreateWorkloadValues,
  getWorkloadResourceName,
  getWorkloadStepFields,
} from './helpers';
import type { CreateWorkloadFormValues } from './types';

const { Text } = Typography;

const NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const ALIAS_PATTERN =
  /^[\u4e00-\u9fa5A-Za-z0-9]([\u4e00-\u9fa5A-Za-z0-9-]*[\u4e00-\u9fa5A-Za-z0-9])?$/;

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
    padding: `15px 20px`,
    borderBottom: `2px solid ${token.colorBorderSecondary}`,
    // background: token.colorFillQuaternary,
    background: '#ffffff',

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
    height: 'calc(100vh - 166px)',
    overflow: 'auto',
    padding: `${token.paddingLG}px`,
    background: token.colorBgContainer,
  },
  yamlBody: {
    height: 'calc(100vh - 166px)',
    padding: token.paddingLG,
    background: token.colorBgContainer,
  },
  formHelp: {
    display: 'block',
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
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
  metadataEditor: {
    padding: token.paddingMD,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorFillQuaternary,
  },
}));

type CreateWorkloadDrawerProps = {
  open: boolean;
  type: API.ClusterWorkloadType;
  namespaceOptions: { label: string; value: string }[];
  defaultNamespace?: string;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    namespace: string;
    name: string;
    manifest: Record<string, unknown>;
  }) => Promise<void>;
};

const createKeyValueItem = (keyName = '', value = ''): KeyValueEditorItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  keyName,
  value,
});

const getStepStatusText = (
  current: number,
  index: number,
  values: CreateWorkloadFormValues,
) => {
  if (current === index) {
    return '当前';
  }
  if (index === 0 && values.name && values.namespace) {
    return '已设置';
  }
  if (index === 1 && values.containerName && values.image) {
    return '已设置';
  }
  if (index === 2 && values.storageType && values.storageType !== 'none') {
    return '已设置';
  }
  if (
    index === 3 &&
    ((values.labels && values.labels.length > 0) ||
      (values.annotations && values.annotations.length > 0))
  ) {
    return '已设置';
  }
  return '未设置';
};

const CreateWorkloadDrawer = ({
  open,
  type,
  namespaceOptions,
  defaultNamespace,
  loading = false,
  onCancel,
  onSubmit,
}: CreateWorkloadDrawerProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<CreateWorkloadFormValues>();
  const [current, setCurrent] = useState(0);
  const [yamlMode, setYamlMode] = useState(false);
  const [yamlValue, setYamlValue] = useState('');
  const values = Form.useWatch([], form) || {};
  const storageType = Form.useWatch('storageType', form);
  const resourceName = getWorkloadResourceName(type);
  const steps = useMemo(
    () => [
      {
        title: '基本信息',
        icon: <AppstoreOutlined />,
      },
      {
        title: '容器组设置',
        icon: <DockerOutlined />,
      },
      {
        title: '存储设置',
        icon: <HddOutlined />,
      },
      {
        title: '高级设置',
        icon: <SlidersOutlined />,
      },
    ],
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialValues = getInitialCreateWorkloadValues(
      type,
      defaultNamespace,
    );
    form.setFieldsValue(initialValues);
    setCurrent(0);
    setYamlMode(false);
    setYamlValue(buildCreateWorkloadYaml(type, initialValues));
  }, [defaultNamespace, form, open, type]);

  const syncYamlFromForm = () => {
    const formValues = form.getFieldsValue();
    setYamlValue(buildCreateWorkloadYaml(type, formValues));
  };

  const handleYamlModeChange = (checked: boolean) => {
    if (checked) {
      syncYamlFromForm();
    }
    setYamlMode(checked);
  };

  const handleNext = async () => {
    await form.validateFields(getWorkloadStepFields(current, type));
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
      const metadata = resource.metadata;
      const metadataRecord =
        metadata && typeof metadata === 'object' && !Array.isArray(metadata)
          ? (metadata as Record<string, unknown>)
          : undefined;
      const name =
        typeof metadataRecord?.name === 'string' ? metadataRecord.name : '';
      const namespace =
        typeof metadataRecord?.namespace === 'string'
          ? metadataRecord.namespace
          : '';
      if (!name || !namespace) {
        message.error('YAML 必须包含 metadata.name 和 metadata.namespace');
        return;
      }

      await onSubmit({
        name,
        namespace,
        manifest: resource,
      });
      return;
    }

    const formValues = await form.validateFields();
    await onSubmit({
      name: formValues.name || '',
      namespace: formValues.namespace || '',
      manifest: buildCreateWorkloadManifest(type, formValues),
    });
  };

  const renderBasicInfo = () => (
    <Row gutter={24}>
      <Col span={12}>
        <Form.Item
          label="名称"
          name="name"
          rules={[
            { required: true, message: '请设置一个名称。' },
            { max: 63, message: '名称最长 63 个字符。' },
            {
              pattern: NAME_PATTERN,
              message:
                '名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾。',
            },
          ]}
        >
          <Input autoFocus />
        </Form.Item>
        <Form.Item
          label="项目"
          name="namespace"
          rules={[{ required: true, message: '请选择一个项目。' }]}
        >
          <Select
            showSearch
            options={namespaceOptions}
            optionFilterProp="label"
            placeholder="请选择"
          />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input.TextArea maxLength={256} rows={3} />
        </Form.Item>
        <Text className={styles.formHelp}>
          描述可包含任意字符，最长 256 个字符。
        </Text>
      </Col>
      <Col span={12}>
        <Form.Item label="工作负载模板" name="template">
          <Select
            options={[{ label: resourceName, value: type }]}
            placeholder="请选择"
          />
        </Form.Item>
        <Text className={styles.formHelp}>选择一个工作负载模板进行创建。</Text>
        <Form.Item
          label="别名"
          name="alias"
          rules={[
            { max: 63, message: '别名最长 63 个字符。' },
            {
              pattern: ALIAS_PATTERN,
              message:
                '别名只能包含中文、字母、数字和连字符（-），不得以连字符开头或结尾。',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Text className={styles.formHelp}>
          别名只能包含中文、字母、数字和连字符（-），不得以连字符（-）开头或结尾，最长
          63 个字符。
        </Text>
      </Col>
    </Row>
  );

  const renderContainerSettings = () => (
    <Row gutter={24}>
      <Col span={12}>
        <Form.Item
          label="容器名称"
          name="containerName"
          rules={[
            { required: true, message: '请输入容器名称。' },
            { max: 63, message: '容器名称最长 63 个字符。' },
            {
              pattern: NAME_PATTERN,
              message:
                '容器名称只能包含小写字母、数字和连字符（-），且不能以连字符开头或结尾。',
            },
          ]}
        >
          <Input placeholder="例如 nginx" />
        </Form.Item>
        <Form.Item
          label="镜像"
          name="image"
          rules={[{ required: true, message: '请输入容器镜像。' }]}
        >
          <Input placeholder="例如 nginx:1.27" />
        </Form.Item>
        <Form.Item label="镜像拉取策略" name="imagePullPolicy">
          <Select
            options={[
              { label: 'IfNotPresent', value: 'IfNotPresent' },
              { label: 'Always', value: 'Always' },
              { label: 'Never', value: 'Never' },
            ]}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        {type !== 'DaemonSet' && (
          <Form.Item
            label="副本数"
            name="replicas"
            rules={[{ required: true, message: '请输入副本数。' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        )}
        <Form.Item label="容器端口" name="containerPort">
          <InputNumber
            min={1}
            max={65535}
            precision={0}
            style={{ width: '100%' }}
            placeholder="可选"
          />
        </Form.Item>
        <Form.Item label="协议" name="protocol">
          <Select
            options={[
              { label: 'TCP', value: 'TCP' },
              { label: 'UDP', value: 'UDP' },
              { label: 'SCTP', value: 'SCTP' },
            ]}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderStorageSettings = () => (
    <Row gutter={24}>
      <Col span={12}>
        <Form.Item label="存储类型" name="storageType">
          <Select
            options={[
              { label: '不挂载存储', value: 'none' },
              { label: '临时卷 EmptyDir', value: 'emptyDir' },
              { label: '已有持久卷声明 PVC', value: 'persistentVolumeClaim' },
            ]}
          />
        </Form.Item>
        {storageType !== 'none' && (
          <>
            <Form.Item
              label="卷名称"
              name="volumeName"
              rules={[{ required: true, message: '请输入卷名称。' }]}
            >
              <Input placeholder="例如 data" />
            </Form.Item>
            <Form.Item
              label="挂载路径"
              name="mountPath"
              rules={[{ required: true, message: '请输入挂载路径。' }]}
            >
              <Input placeholder="例如 /data" />
            </Form.Item>
          </>
        )}
      </Col>
      <Col span={12}>
        {storageType === 'persistentVolumeClaim' && (
          <>
            <Form.Item
              label="PVC 名称"
              name="claimName"
              rules={[{ required: true, message: '请输入 PVC 名称。' }]}
            >
              <Input placeholder="选择或输入已有 PVC 名称" />
            </Form.Item>
            <Form.Item label="只读挂载" name="readOnly" valuePropName="checked">
              <Switch />
            </Form.Item>
          </>
        )}
      </Col>
    </Row>
  );

  const renderAdvancedSettings = () => (
    <Row gutter={24}>
      <Col span={12}>
        <div className={styles.metadataEditor}>
          <Form.Item label="标签" name="labels">
            <KeyValueEditor
              addText="添加标签"
              deleteAriaLabel="删除标签"
              onAddBlocked={() => message.warning('请先填写已有标签的键。')}
              onCreateItem={() => createKeyValueItem()}
            />
          </Form.Item>
        </div>
      </Col>
      <Col span={12}>
        <div className={styles.metadataEditor}>
          <Form.Item label="注解" name="annotations">
            <KeyValueEditor
              addText="添加注解"
              deleteAriaLabel="删除注解"
              onAddBlocked={() => message.warning('请先填写已有注解的键。')}
              onCreateItem={() => createKeyValueItem()}
            />
          </Form.Item>
        </div>
      </Col>
    </Row>
  );

  const stepContent = [
    renderBasicInfo,
    renderContainerSettings,
    renderStorageSettings,
    renderAdvancedSettings,
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
      open={open}
      title={`创建${resourceName}`}
      width="78vw"
      onClose={onCancel}
    >
      {yamlMode ? (
        <div className={styles.yamlBody}>
          <YamlEditor
            height="calc(100vh - 214px)"
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
              await form.validateFields(getWorkloadStepFields(current, type));
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
                    buildCreateWorkloadYaml(type, form.getFieldsValue()),
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

export default CreateWorkloadDrawer;
