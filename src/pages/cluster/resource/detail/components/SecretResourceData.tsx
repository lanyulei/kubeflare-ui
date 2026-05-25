import { GlobalOutlined } from '@ant-design/icons';
import { Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { KeyValueList } from '@/components';
import type { ResourceDataItem } from './ResourceDataFields';
import type { SecretDataView, SecretDockerConfigItem } from './secretHelpers';

const useStyles = createStyles(({ token }) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fieldPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 0,
  },
  dockerPanel: {
    padding: 0,
  },
  dockerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    minWidth: 0,
    marginBottom: 8,
    color: token.colorText,
    fontSize: token.fontSizeLG,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  dockerIcon: {
    flex: '0 0 auto',
    color: token.colorTextSecondary,
    fontSize: token.fontSize,
  },
  dockerServer: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dockerRows: {
    padding: 0,
  },
}));

type SecretResourceDataProps = {
  data?: SecretDataView;
};

const hasValue = (value?: string) => value !== undefined && value !== null;

const maskValue = (value?: string) => {
  if (!value) {
    return '';
  }

  return '*'.repeat(Math.min(Math.max(value.length, 5), 12));
};

const SecretDefaultData = ({ items }: { items?: ResourceDataItem[] }) => {
  if (!items || items.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <KeyValueList
      itemBackgroundColor="#f9f9f9"
      items={items.map((item) => ({ key: item.key, value: item.value }))}
    />
  );
};

const DockerConfigData = ({ item }: { item: SecretDockerConfigItem }) => {
  const { styles } = useStyles();

  return (
    <div className={styles.dockerPanel}>
      <div className={styles.dockerHeader}>
        <GlobalOutlined className={styles.dockerIcon} />
        <Tooltip title={item.server} placement="topLeft">
          <span className={styles.dockerServer}>{item.server}</span>
        </Tooltip>
      </div>
      <div className={styles.dockerRows}>
        <KeyValueList
          itemBackgroundColor="#f9f9f9"
          items={[
            { key: '用户名', value: maskValue(item.username) },
            { key: '密码', value: maskValue(item.password) },
            { key: '邮箱', value: maskValue(item.email) },
          ]}
        />
      </div>
    </div>
  );
};

const SecretResourceData = ({ data }: SecretResourceDataProps) => {
  const { styles } = useStyles();

  if (!data || data.dataItems.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  if (data.type === 'kubernetes.io/tls') {
    if (!hasValue(data.tlsCertificate) && !hasValue(data.tlsPrivateKey)) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <div className={styles.fieldPanel}>
        <KeyValueList
          itemBackgroundColor="#f9f9f9"
          items={[
            { key: '凭证', value: data.tlsCertificate },
            { key: '私钥', value: data.tlsPrivateKey },
          ]}
        />
      </div>
    );
  }

  if (data.type === 'kubernetes.io/dockerconfigjson') {
    if (data.dockerConfigItems.length === 0) {
      return <SecretDefaultData items={data.dataItems} />;
    }

    return (
      <div className={styles.content}>
        {data.dockerConfigItems.map((item) => (
          <DockerConfigData item={item} key={item.key} />
        ))}
        {data.dockerExtraItems.length > 0 && (
          <SecretDefaultData items={data.dockerExtraItems} />
        )}
      </div>
    );
  }

  if (data.type === 'kubernetes.io/basic-auth') {
    if (
      !hasValue(data.basicAuthPassword) &&
      !hasValue(data.basicAuthUsername)
    ) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <KeyValueList
        itemBackgroundColor="#f9f9f9"
        items={[
          { key: '密码', value: data.basicAuthPassword },
          { key: '用户名', value: data.basicAuthUsername },
        ]}
      />
    );
  }

  return <SecretDefaultData items={data.dataItems} />;
};

export default SecretResourceData;
