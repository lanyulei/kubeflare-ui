import type { FormInstance } from 'antd';
import {
  Alert,
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
import { registryProtocolOptions, secretTypeOptions } from './helpers';
import SecretDataEditor from './SecretDataEditor';
import type { CreateSecretFormValues, SecretDataItem } from './types';

const { Password, TextArea } = Input;

const useStyles = createStyles(({ token }) => ({
  compactField: {
    maxWidth: 456,
  },
  dataField: {
    width: '100%',
  },
  registryProtocol: {
    width: 106,
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
    color: token.colorSuccess,
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

const CreateSecretDataSettings = ({ form }: SecretDataSettingsProps) => {
  const { styles } = useStyles();
  const type = Form.useWatch('type', { form, preserve: true }) || 'Opaque';
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
  const showRegistryAlert =
    type === 'kubernetes.io/dockerconfigjson' &&
    (!registryAddress || !registryUsername || !registryPassword);

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
        <TextArea autoSize={{ minRows: 6, maxRows: 10 }} />
      </Form.Item>
      <Form.Item
        label="私钥"
        name="tlsPrivateKey"
        rules={[{ required: true, message: '请输入私钥' }]}
      >
        <TextArea autoSize={{ minRows: 6, maxRows: 10 }} />
      </Form.Item>
    </div>
  );

  const renderRegistryFields = () => (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            extra="设置镜像服务地址，例如 docker.io。"
            label="镜像服务地址"
            name="registryAddress"
            rules={[{ required: true, message: '请输入镜像服务地址' }]}
          >
            <Input
              addonBefore={
                <Form.Item name="registryProtocol" noStyle>
                  <Select
                    className={styles.registryProtocol}
                    options={registryProtocolOptions}
                  />
                </Form.Item>
              }
            />
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
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="邮箱" name="registryEmail">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="密码"
            name="registryPassword"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Password
              addonAfter={<span className={styles.verifyButton}>验证</span>}
            />
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
    </>
  );

  const renderBasicAuthFields = () => (
    <div className={styles.compactField}>
      <Form.Item
        label="用户名"
        name="basicAuthUsername"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="密码"
        name="basicAuthPassword"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Password />
      </Form.Item>
    </div>
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Form.Item
        className={styles.compactField}
        extra="选择一个保密字典类型。"
        label="类型"
        name="type"
        rules={[{ required: true, message: '请选择类型' }]}
      >
        <Select options={secretTypeOptions} />
      </Form.Item>
      {type === 'kubernetes.io/tls' && renderTlsFields()}
      {type === 'kubernetes.io/dockerconfigjson' && renderRegistryFields()}
      {type === 'kubernetes.io/basic-auth' && renderBasicAuthFields()}
      {type === 'Opaque' && renderDefaultData()}
    </Space>
  );
};

export default CreateSecretDataSettings;
