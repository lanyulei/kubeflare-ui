import type { FormInstance } from 'antd';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
} from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import {
  createSecretDataItem,
  getDockerConfigJson,
  registryProtocolOptions,
  secretTypeOptions,
} from './helpers';
import SecretDataEditor from './SecretDataEditor';
import type {
  CreateSecretFormValues,
  SecretDataItem,
  SecretType,
} from './types';

const { Password, TextArea } = Input;

const useStyles = createStyles(({ token }) => ({
  compactField: {
    maxWidth: 456,

    '.ant-form-item': {
      marginBottom: token.marginMD,
    },

    '.ant-form-item:last-child': {
      marginBottom: 0,
    },
  },
  settings: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
    width: '100%',

    '& > .ant-form-item': {
      marginBottom: 0,
    },
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  dataField: {
    width: '100%',
  },
  registryProtocol: {
    flex: '0 0 112px',
  },
  compactInput: {
    width: '100%',

    '.ant-form-item': {
      flex: 1,
      minWidth: 0,
    },
  },
  compactInputValue: {
    width: '100%',
    flex: 1,
  },
  defaultRegistry: {
    display: 'flex',
    gap: token.marginSM,
    alignItems: 'flex-start',
    padding: `${token.paddingMD}px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    background: token.colorFillQuaternary,
  },
  defaultTitle: {
    color: token.colorText,
    fontWeight: 500,
    lineHeight: token.lineHeight,
  },
  defaultDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  verifyButton: {
    minWidth: 70,
    color: token.colorTextSecondary,
    fontWeight: 500,
  },
}));

type SecretDataSettingsProps = {
  form: FormInstance<CreateSecretFormValues>;
};

const hasDataItems = (items?: SecretDataItem[]) =>
  (items || []).some((item) => item.keyName.trim());

const validateDefaultData = (_: unknown, items?: SecretDataItem[]) => {
  const normalizedKeys = (items || [])
    .map((item) => item.keyName.trim())
    .filter(Boolean);

  if (!hasDataItems(items)) {
    return Promise.reject(new Error('请添加至少一条数据'));
  }
  if (new Set(normalizedKeys).size !== normalizedKeys.length) {
    return Promise.reject(new Error('数据键不能重复'));
  }

  return Promise.resolve();
};

const dataSettingFields: (keyof CreateSecretFormValues)[] = [
  'dataItems',
  'tlsCertificate',
  'tlsPrivateKey',
  'registryProtocol',
  'registryAddress',
  'registryUsername',
  'registryPassword',
  'registryEmail',
  'skipTlsVerify',
  'setAsDefault',
  'basicAuthUsername',
  'basicAuthPassword',
];

const DOCKER_CONFIG_JSON_KEY = '.dockerconfigjson';

const hasText = (value?: string) => Boolean(value?.trim());

const CreateSecretDataSettings = ({ form }: SecretDataSettingsProps) => {
  const { styles } = useStyles();
  const type = Form.useWatch('type', { form, preserve: true }) || 'Opaque';
  const registryProtocol = Form.useWatch('registryProtocol', {
    form,
    preserve: true,
  });
  const registryAddress = Form.useWatch('registryAddress', {
    form,
    preserve: true,
  });
  const registryUsername = Form.useWatch('registryUsername', {
    form,
    preserve: true,
  });
  const registryPassword = Form.useWatch('registryPassword', {
    form,
    preserve: true,
  });
  const registryEmail = Form.useWatch('registryEmail', {
    form,
    preserve: true,
  });
  const showRegistryAlert =
    type === 'kubernetes.io/dockerconfigjson' &&
    (!registryAddress || !registryUsername || !registryPassword);

  useEffect(() => {
    if (type !== 'kubernetes.io/dockerconfigjson') {
      return;
    }

    const dataItems = form.getFieldValue('dataItems') || [];
    const visibleDataItems = dataItems.filter(
      (item: SecretDataItem) => item.keyName !== DOCKER_CONFIG_JSON_KEY,
    );
    const shouldCreateDockerConfig =
      hasText(registryAddress) &&
      hasText(registryUsername) &&
      hasText(registryEmail) &&
      Boolean(registryPassword);

    if (!shouldCreateDockerConfig) {
      if (visibleDataItems.length !== dataItems.length) {
        form.setFieldsValue({ dataItems: visibleDataItems });
      }
      return;
    }

    const dockerConfigItem =
      dataItems.find(
        (item: SecretDataItem) => item.keyName === DOCKER_CONFIG_JSON_KEY,
      ) ||
      createSecretDataItem(
        DOCKER_CONFIG_JSON_KEY,
        getDockerConfigJson(form.getFieldsValue(true)),
      );
    const nextDockerConfigItem = {
      ...dockerConfigItem,
      value: getDockerConfigJson(form.getFieldsValue(true)),
    };

    form.setFieldsValue({
      dataItems: [...visibleDataItems, nextDockerConfigItem],
    });
  }, [
    form,
    registryAddress,
    registryEmail,
    registryPassword,
    registryProtocol,
    registryUsername,
    type,
  ]);

  const handleTypeChange = (nextType: SecretType) => {
    form.setFieldsValue({
      type: nextType,
      dataItems: [],
      tlsCertificate: undefined,
      tlsPrivateKey: undefined,
      registryProtocol: 'https://',
      registryAddress: undefined,
      registryUsername: undefined,
      registryPassword: undefined,
      registryEmail: undefined,
      skipTlsVerify: true,
      setAsDefault: false,
      basicAuthUsername: undefined,
      basicAuthPassword: undefined,
    });
    form.setFields(
      dataSettingFields.map((name) => ({
        name,
        errors: [],
      })),
    );
  };

  const renderDefaultData = () => (
    <Form.Item
      className={styles.dataField}
      label="数据"
      name="dataItems"
      rules={[{ validator: validateDefaultData }]}
      required
    >
      <SecretDataEditor />
    </Form.Item>
  );

  const renderTlsFields = () => (
    <div className={styles.compactField}>
      <Form.Item
        label="证书"
        name="tlsCertificate"
        rules={[{ required: true, message: '请输入证书' }]}
      >
        <TextArea
          placeholder="请输入证书"
          autoSize={{ minRows: 6, maxRows: 10 }}
        />
      </Form.Item>
      <Form.Item
        label="私钥"
        name="tlsPrivateKey"
        rules={[{ required: true, message: '请输入私钥' }]}
      >
        <TextArea
          placeholder="请输入私钥"
          autoSize={{ minRows: 6, maxRows: 10 }}
        />
      </Form.Item>
    </div>
  );

  const renderRegistryFields = () => (
    <div className={styles.fieldGroup}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            extra="设置镜像服务地址，例如 docker.io。"
            label="镜像服务地址"
            required
          >
            <Space.Compact block className={styles.compactInput}>
              <Form.Item name="registryProtocol" noStyle>
                <Select
                  className={styles.registryProtocol}
                  options={registryProtocolOptions}
                  popupMatchSelectWidth={false}
                />
              </Form.Item>
              <Form.Item
                name="registryAddress"
                noStyle
                rules={[{ required: true, message: '请输入镜像服务地址' }]}
              >
                <Input
                  className={styles.compactInputValue}
                  placeholder="例如 docker.io"
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="skipTlsVerify" valuePropName="checked">
            <Checkbox>跳过证书验证</Checkbox>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="用户名"
            name="registryUsername"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="邮箱" name="registryEmail">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="密码" required>
            <Space.Compact block className={styles.compactInput}>
              <Form.Item
                name="registryPassword"
                noStyle
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Password
                  className={styles.compactInputValue}
                  placeholder="请输入密码"
                />
              </Form.Item>
              <Button className={styles.verifyButton} htmlType="button">
                验证
              </Button>
            </Space.Compact>
          </Form.Item>
        </Col>
      </Row>
      <div className={styles.defaultRegistry}>
        <Form.Item name="setAsDefault" valuePropName="checked" noStyle>
          <Switch />
        </Form.Item>
        <div>
          <div className={styles.defaultTitle}>设为默认</div>
          <div className={styles.defaultDescription}>
            设置镜像服务为默认镜像服务。如果没有特别指定，系统将使用默认镜像服务中的镜像创建容器。每个项目只允许存在一个默认镜像服务。
          </div>
        </div>
      </div>
      {showRegistryAlert && (
        <Alert
          showIcon={false}
          message="请设置镜像服务地址、用户名和密码。"
          type="error"
        />
      )}
      <Form.Item
        className={styles.dataField}
        label="数据"
        name="dataItems"
        required
      >
        <SecretDataEditor reservedKeys={['.dockerconfigjson']} />
      </Form.Item>
    </div>
  );

  const renderBasicAuthFields = () => (
    <div className={styles.compactField}>
      <Form.Item
        label="用户名"
        name="basicAuthUsername"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input placeholder="请输入用户名" />
      </Form.Item>
      <Form.Item
        label="密码"
        name="basicAuthPassword"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Password placeholder="请输入密码" />
      </Form.Item>
    </div>
  );

  return (
    <div className={styles.settings}>
      <Form.Item
        className={styles.compactField}
        label="类型"
        name="type"
        rules={[{ required: true, message: '请选择类型' }]}
      >
        <Select options={secretTypeOptions} onChange={handleTypeChange} />
      </Form.Item>
      {type === 'kubernetes.io/tls' && renderTlsFields()}
      {type === 'kubernetes.io/dockerconfigjson' && renderRegistryFields()}
      {type === 'kubernetes.io/basic-auth' && renderBasicAuthFields()}
      {type === 'Opaque' && renderDefaultData()}
    </div>
  );
};

export default CreateSecretDataSettings;
