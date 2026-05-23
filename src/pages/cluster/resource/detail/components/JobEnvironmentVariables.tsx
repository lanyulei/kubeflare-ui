import { ClusterOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { KeyValueList, SectionTitle } from '@/components';
import {
  formatValue,
  getArrayValue,
  getRecordValue,
  getStringValue,
} from './helpers';

const useStyles = createStyles(({ token }) => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  item: {
    padding: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: 0,
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    padding: 0,
    border: 0,
    backgroundColor: 'transparent',
    color: token.colorText,
    cursor: 'pointer',
    textAlign: 'left',

    '&:hover': {
      color: token.colorText,
    },

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 2,
    },
  },
  title: {
    display: 'inline-flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginSM,
    color: token.colorText,
    fontSize: 15,
    fontWeight: 600,
  },
  icon: {
    color: token.colorTextSecondary,
    fontSize: 18,
  },
  content: {
    marginTop: token.marginSM,
  },
}));

type JobEnvironmentVariablesProps = {
  manifest?: Record<string, unknown>;
};

const getEnvValueFrom = (env: Record<string, unknown>) => {
  const valueFrom = getRecordValue(env.valueFrom);

  if (!valueFrom) {
    return undefined;
  }

  const configMapKeyRef = getRecordValue(valueFrom.configMapKeyRef);
  if (configMapKeyRef) {
    return `ConfigMap: ${formatValue(configMapKeyRef.name)}/${formatValue(
      configMapKeyRef.key,
    )}`;
  }

  const secretKeyRef = getRecordValue(valueFrom.secretKeyRef);
  if (secretKeyRef) {
    return `Secret: ${formatValue(secretKeyRef.name)}/${formatValue(
      secretKeyRef.key,
    )}`;
  }

  const fieldRef = getRecordValue(valueFrom.fieldRef);
  if (fieldRef) {
    return `字段引用: ${formatValue(fieldRef.fieldPath)}`;
  }

  const resourceFieldRef = getRecordValue(valueFrom.resourceFieldRef);
  if (resourceFieldRef) {
    return `资源引用: ${formatValue(resourceFieldRef.resource)}`;
  }

  return JSON.stringify(valueFrom);
};

const getContainers = (manifest?: Record<string, unknown>) => {
  const spec = getRecordValue(manifest?.spec);
  const template = getRecordValue(spec?.template);
  const podSpec = getRecordValue(template?.spec);

  return getArrayValue(podSpec?.containers).map((container) => {
    const containerRecord = getRecordValue(container) || {};

    return {
      name: getStringValue(containerRecord.name) || '-',
      env: getArrayValue(containerRecord.env)
        .map((item) => getRecordValue(item))
        .filter(Boolean)
        .map((env) => ({
          key: getStringValue(env?.name) || '',
          value: getStringValue(env?.value) || getEnvValueFrom(env || {}),
        }))
        .filter((item) => item.key),
    };
  });
};

const JobEnvironmentVariables = ({
  manifest,
}: JobEnvironmentVariablesProps) => {
  const { styles } = useStyles();
  const containers = useMemo(
    () =>
      getContainers(manifest).filter((container) => container.env.length > 0),
    [manifest],
  );
  const [expandedContainerName, setExpandedContainerName] = useState<string>();

  useEffect(() => {
    setExpandedContainerName(containers[0]?.name);
  }, [containers]);

  if (containers.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles.list}>
      {containers.map((container) => {
        const expanded = expandedContainerName === container.name;

        return (
          <div className={styles.item} key={container.name}>
            <div className={styles.header}>
              <SectionTitle color={'#36435C'} fontSize={12}>
                <button
                  aria-expanded={expanded}
                  className={styles.toggle}
                  onClick={() =>
                    setExpandedContainerName(
                      expanded ? undefined : container.name,
                    )
                  }
                  type="button"
                >
                  <span className={styles.title}>
                    <ClusterOutlined className={styles.icon} />
                    <span>容器：{container.name}</span>
                  </span>
                </button>
              </SectionTitle>
            </div>
            {expanded ? (
              <div className={styles.content}>
                <KeyValueList items={container.env} keyLabel="" valueLabel="" />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default JobEnvironmentVariables;
