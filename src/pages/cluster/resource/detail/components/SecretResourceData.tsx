import {
  EyeInvisibleOutlined,
  EyeOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { Button, Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useMemo, useState } from 'react';
import { SectionTitle } from '@/components';
import type { ResourceDataItem } from './ResourceDataFields';
import type { SecretDataView, SecretDockerConfigItem } from './secretHelpers';

const useStyles = createStyles(({ token }) => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  dataSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  fieldPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  fieldLabel: {
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
  },
  fieldValue: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: '1px solid #f0f0f0',
    borderRadius: token.borderRadiusSM,
    backgroundColor: '#f9f9f9',
    color: 'rgba(0,0,0,0.65)',
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  fieldValueText: {
    flex: 1,
    minWidth: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  revealButton: {
    flex: '0 0 auto',
    color: token.colorTextTertiary,
  },
  secretValueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  secretValueItem: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: token.marginLG,
    alignItems: 'center',
    minHeight: 46,
    padding: '0 16px',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: '#f9f9f9',
    lineHeight: 1.5,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      rowGap: token.marginXS,
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      borderRadius: token.borderRadiusLG,
    },
  },
  secretValueKey: {
    minWidth: 0,
    overflow: 'hidden',
    color: '#5F708A',
    fontSize: 13,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  secretValueContent: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    minWidth: 0,
  },
  secretValueText: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    color: token.colorText,
    fontSize: 13,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: '1px solid #f0f0f0',
    borderRadius: token.borderRadiusSM,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  dockerRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 240px) minmax(0, 1fr) max-content',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    padding: `0 ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorBgContainer,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: 8,
      paddingBlock: token.paddingSM,
    },
  },
  dockerRowKey: {
    minWidth: 0,
    overflow: 'hidden',
    color: '#5F708A',
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dockerRowValue: {
    minWidth: 0,
    overflow: 'hidden',
    color: 'rgba(0,0,0,0.65)',
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dockerRevealButton: {
    justifySelf: 'end',
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

const formatValue = (value?: string) => value || '';

const decodeSecretValue = (value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder().decode(bytes);
  } catch {
    return undefined;
  }
};

const SecretField = ({ label, value }: { label: string; value?: string }) => {
  const { styles } = useStyles();
  const [revealed, setRevealed] = useState(false);
  const decodedValue = useMemo(() => decodeSecretValue(value), [value]);
  const displayValue = revealed ? decodedValue || value : value;

  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>
        <span className={styles.fieldValueText}>
          {formatValue(displayValue)}
        </span>
        <Tooltip title={revealed ? '隐藏加密数据' : '解密数据'}>
          <Button
            aria-label={revealed ? '隐藏加密数据' : '解密数据'}
            className={styles.revealButton}
            icon={revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            type="text"
            onClick={() => setRevealed((current) => !current)}
          />
        </Tooltip>
      </div>
    </div>
  );
};

const RevealButton = ({
  revealed,
  onToggle,
}: {
  revealed: boolean;
  onToggle: () => void;
}) => {
  const { styles } = useStyles();

  return (
    <Tooltip title={revealed ? '隐藏加密数据' : '解密数据'}>
      <Button
        aria-label={revealed ? '隐藏加密数据' : '解密数据'}
        className={styles.revealButton}
        icon={revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        type="text"
        onClick={onToggle}
      />
    </Tooltip>
  );
};

const SecretValueRow = ({
  itemKey,
  revealValue,
  value,
}: {
  itemKey: string;
  revealValue?: string;
  value?: string;
}) => {
  const { styles } = useStyles();
  const [revealed, setRevealed] = useState(false);
  const decodedValue = useMemo(() => decodeSecretValue(value), [value]);
  const displayValue = revealed ? revealValue || decodedValue || value : value;

  return (
    <div className={styles.secretValueItem}>
      <Tooltip title={itemKey} placement="topLeft">
        <span className={styles.secretValueKey}>{itemKey}</span>
      </Tooltip>
      <div className={styles.secretValueContent}>
        <Tooltip title={displayValue} placement="topLeft">
          <span className={styles.secretValueText}>
            {formatValue(displayValue)}
          </span>
        </Tooltip>
        <RevealButton
          revealed={revealed}
          onToggle={() => setRevealed((current) => !current)}
        />
      </div>
    </div>
  );
};

const SecretDefaultData = ({ items }: { items?: ResourceDataItem[] }) => {
  const { styles } = useStyles();

  if (!items || items.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles.secretValueList}>
      {items.map((item) => (
        <SecretValueRow itemKey={item.key} key={item.key} value={item.value} />
      ))}
    </div>
  );
};

const DockerCredentialRow = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => {
  const { styles } = useStyles();
  const [revealed, setRevealed] = useState(false);
  const displayValue = revealed ? value : maskValue(value);

  return (
    <div className={styles.dockerRow}>
      <Tooltip title={label} placement="topLeft">
        <span className={styles.dockerRowKey}>{label}</span>
      </Tooltip>
      <Tooltip title={displayValue} placement="topLeft">
        <span className={styles.dockerRowValue}>
          {formatValue(displayValue)}
        </span>
      </Tooltip>
      <span className={styles.dockerRevealButton}>
        <RevealButton
          revealed={revealed}
          onToggle={() => setRevealed((current) => !current)}
        />
      </span>
    </div>
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
        <DockerCredentialRow label="用户名:" value={item.username} />
        <DockerCredentialRow label="密码:" value={item.password} />
        <DockerCredentialRow label="邮箱:" value={item.email} />
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
        <SecretField label="凭证：" value={data.tlsCertificate} />
        <SecretField label="私钥：" value={data.tlsPrivateKey} />
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
        <div className={styles.dataSection}>
          <SectionTitle color={'#36435C'} fontSize={12}>
            数据
          </SectionTitle>
          {data.dockerExtraItems.length > 0 && (
            <SecretDefaultData items={data.dockerExtraItems} />
          )}
        </div>
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
      <div className={styles.fieldPanel}>
        <SecretField label="密码：" value={data.basicAuthPassword} />
        <SecretField label="用户名：" value={data.basicAuthUsername} />
      </div>
    );
  }

  return <SecretDefaultData items={data.dataItems} />;
};

export default SecretResourceData;
