import {
  CaretDownOutlined,
  CaretRightOutlined,
  CaretUpOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  HddOutlined,
  KeyOutlined,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Empty, Radio, Spin, Tooltip, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { KeyValueList } from '@/components';

type ContainerStatusManagementProps = {
  loading?: boolean;
  pods?: API.ClusterNodePodItem[];
};

type ManagedContainer = API.ClusterNodePodContainer & {
  key: string;
  podNames: string[];
  volumes?: API.ClusterNodePodVolume[];
};

type ContainerConfigKey = 'env' | 'ports' | 'mounts';

const useStyles = createStyles(({ token }) => ({
  container: {
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    overflow: 'visible',
    backgroundColor: token.colorBgContainer,
  },
  selector: {
    position: 'relative',
  },
  selectorScroll: {
    width: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  selectedRow: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(220px, 1.25fr) repeat(4, minmax(132px, 1fr)) 28px',
    alignItems: 'center',
    boxSizing: 'border-box',
    width: 'max(100%, 920px)',
    minHeight: 64,
    padding: `0 ${token.padding}px`,
    columnGap: token.marginLG,
    border: 0,
    cursor: 'pointer',
    textAlign: 'left',
    font: 'inherit',
    backgroundColor: token.colorBgContainer,
    transition: 'background-color 0.2s ease',

    '&:hover': {
      backgroundColor: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimary}`,
      outlineOffset: -2,
    },
  },
  selectorList: {
    position: 'absolute',
    top: '100%',
    right: 0,
    left: 0,
    zIndex: 10,
    maxHeight: 256,
    overflow: 'hidden',
    border: `1px solid ${token.colorBorder}`,
    borderTop: 0,
    boxShadow: token.boxShadowSecondary,
    backgroundColor: token.colorBgContainer,
  },
  selectorListScroll: {
    maxHeight: 256,
    overflow: 'auto',
  },
  row: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(220px, 1.25fr) repeat(4, minmax(132px, 1fr)) 28px',
    alignItems: 'center',
    boxSizing: 'border-box',
    width: 'max(100%, 920px)',
    minHeight: 64,
    padding: `0 ${token.padding}px`,
    columnGap: token.marginLG,
    border: 0,
    cursor: 'pointer',
    textAlign: 'left',
    font: 'inherit',
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s ease',

    '&:hover': {
      backgroundColor: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimary}`,
      outlineOffset: -2,
    },
  },
  activeRow: {
    backgroundColor: token.colorFillAlter,
  },
  selectedIndicator: {
    boxShadow: `inset 3px 0 0 ${token.colorPrimary}`,
  },
  identity: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginSM,
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    flex: '0 0 auto',
    borderRadius: token.borderRadiusLG,
    color: token.colorTextSecondary,
    backgroundColor: token.colorFillSecondary,
    fontSize: 18,
  },
  itemText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  label: {
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: 1.5,
  },
  description: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: 1.5,
  },
  field: {
    minWidth: 0,
  },
  toggle: {
    color: token.colorTextSecondary,
    textAlign: 'right',
  },
  panel: {
    borderTop: `1px solid ${token.colorBorderSecondary}`,
    padding: `${token.paddingMD}px ${token.padding}px ${token.padding}px`,
    backgroundColor: token.colorBgContainer,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    marginBottom: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSize,
  },
  radioGroup: {
    marginBottom: token.marginSM,

    '.ant-radio-button-wrapper': {
      minWidth: 118,
      textAlign: 'center',
    },

    '.ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)':
      {
        borderColor: '#3a4660',
        backgroundColor: '#3a4660',
        color: '#ffffff',

        '&::before': {
          backgroundColor: '#3a4660',
        },
      },
  },
  tabContent: {
    minHeight: 160,
    padding: `12px`,
    backgroundColor: token.colorFillQuaternary,
  },
  portTable: {
    backgroundColor: `#ffffff`,
    width: '100%',
  },
  portRow: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 0.65fr 0.65fr',
    alignItems: 'center',
    minHeight: 40,
    padding: `0 ${token.paddingSM}px`,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    color: token.colorTextSecondary,
    fontSize: token.fontSize,
  },
  portHeader: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  portCell: {
    minWidth: 0,
  },
  empty: {
    padding: `${token.paddingLG}px 0`,
  },
  mountList: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  mountCard: {
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    padding: `${token.padding}px`,
    backgroundColor: token.colorBgContainer,
  },
  mountInfo: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)',
    columnGap: token.marginXL,
    rowGap: token.marginSM,
    marginBottom: token.marginMD,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  mountSummary: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    gap: token.marginSM,
  },
  mountIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    flex: '0 0 auto',
    color: '#3a4b63',
    fontSize: 24,
  },
  mountContent: {
    minWidth: 0,
  },
  mountTitle: {
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  mountDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: 1.5,
  },
  mountRows: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1fr)',
    columnGap: token.marginXL,
    rowGap: token.marginXS,
    padding: `${token.paddingSM}px ${token.padding}px`,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  mountRow: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginSM,
    minWidth: 0,
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: 1.5,
  },
  mountRowIcon: {
    flex: '0 0 auto',
    color: '#3a4b63',
  },
  mountPath: {
    minWidth: 0,
  },
}));

const getContainerKey = (container: API.ClusterNodePodContainer) =>
  `${container.name || '-'}::${container.image || '-'}`;

const getManagedContainers = (
  pods: API.ClusterNodePodItem[],
): ManagedContainer[] => {
  const containerMap = new Map<string, ManagedContainer>();

  pods.forEach((pod) => {
    (pod.containers || []).forEach((container) => {
      const key = getContainerKey(container);
      const current = containerMap.get(key);

      if (current) {
        current.podNames.push(pod.name);
        return;
      }

      containerMap.set(key, {
        ...container,
        key,
        podNames: [pod.name],
        volumes: pod.volumes,
      });
    });
  });

  return Array.from(containerMap.values());
};

const getImageRegistry = (image?: string) => {
  const firstSegment = image?.split('/')[0] || '';

  if (
    !firstSegment ||
    !image?.includes('/') ||
    (!firstSegment.includes('.') &&
      !firstSegment.includes(':') &&
      firstSegment !== 'localhost')
  ) {
    return 'Docker Hub';
  }

  return firstSegment;
};

const formatResources = (resources?: Record<string, string>) => {
  const values = [
    resources?.cpu ? `CPU ${resources.cpu}` : '',
    resources?.memory ? `内存 ${resources.memory}` : '',
  ].filter(Boolean);

  return values.length > 0 ? values.join(' / ') : undefined;
};

const getPullPolicyLabel = (policy?: string) => {
  if (policy === 'Always') {
    return '每次拉取镜像';
  }
  if (policy === 'Never') {
    return '仅使用本地镜像';
  }

  return '优先使用本地镜像';
};

const getContainerEnvItems = (env?: API.ClusterNodePodContainerEnv[]) =>
  (env || [])
    .filter((item) => Boolean(item.name))
    .map((item) => ({
      key: item.name || '',
      value: item.value || item.value_from || '-',
    }));

const getVolumeSourceLabel = (type?: string) => {
  if (type === 'ConfigMap') {
    return '配置字典';
  }
  if (type === 'Secret') {
    return '保密字典';
  }
  if (type === 'HostPath') {
    return 'HostPath';
  }
  if (type === 'EmptyDir') {
    return 'EmptyDir';
  }
  if (type === 'PersistentVolumeClaim') {
    return '存储卷声明';
  }
  if (type === 'Projected') {
    return '投射卷';
  }
  if (type === 'DownwardAPI') {
    return 'DownwardAPI';
  }

  return type || 'Volume';
};

const getVolumeSourceValue = (volume?: API.ClusterNodePodVolume) =>
  volume?.source_name || volume?.source_path || '-';

const getVolumeIcon = (type?: string) => {
  if (type === 'ConfigMap') {
    return <ToolOutlined />;
  }
  if (type === 'Secret') {
    return <KeyOutlined />;
  }
  if (type === 'HostPath' || type === 'EmptyDir') {
    return <HddOutlined />;
  }
  if (type === 'PersistentVolumeClaim') {
    return <DatabaseOutlined />;
  }

  return <FolderOpenOutlined />;
};

const containerConfigOptions: { label: string; value: ContainerConfigKey }[] = [
  { label: '容器环境变量', value: 'env' },
  { label: '容器端口', value: 'ports' },
  { label: '容器挂载', value: 'mounts' },
];

const ContainerStatusManagement = ({
  loading = false,
  pods = [],
}: ContainerStatusManagementProps) => {
  const { styles, cx } = useStyles();
  const containers = useMemo(() => getManagedContainers(pods), [pods]);
  const [activeKey, setActiveKey] = useState<string>();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [activeConfigKey, setActiveConfigKey] =
    useState<ContainerConfigKey>('env');
  const activeContainer =
    containers.find((container) => container.key === activeKey) ||
    containers[0];

  useEffect(() => {
    if (containers.length === 0) {
      setActiveKey(undefined);
      setSelectorOpen(false);
      return;
    }

    if (
      !activeKey ||
      !containers.some((container) => container.key === activeKey)
    ) {
      setActiveKey(containers[0].key);
    }
  }, [activeKey, containers]);

  const selectContainer = (container: ManagedContainer) => {
    setActiveKey(container.key);
    setSelectorOpen(false);
  };

  const renderContainerRow = (
    container: ManagedContainer,
    options?: {
      className?: string;
      onClick?: () => void;
      toggleIcon?: boolean;
    },
  ) => (
    <button
      className={cx(options?.className)}
      key={container.key}
      onClick={options?.onClick}
      type="button"
    >
      <div className={styles.identity}>
        <span className={styles.icon}>
          <CloudServerOutlined />
        </span>
        <div className={styles.itemText}>
          <Tooltip title={container.name || '-'}>
            <Typography.Text className={styles.label} ellipsis>
              {container.name || '-'}
            </Typography.Text>
          </Tooltip>
          <Tooltip title={container.image || '-'}>
            <Typography.Text className={styles.description} ellipsis>
              {container.image || '-'}
            </Typography.Text>
          </Tooltip>
        </div>
      </div>
      <div className={styles.field}>
        <Typography.Text className={styles.label} ellipsis>
          {getImageRegistry(container.image)}
        </Typography.Text>
        <div className={styles.description}>镜像仓库地址</div>
      </div>
      <div className={styles.field}>
        <Typography.Text className={styles.label} ellipsis>
          {formatResources(container.resources?.requests) || '无预留'}
        </Typography.Text>
        <div className={styles.description}>资源预留</div>
      </div>
      <div className={styles.field}>
        <Typography.Text className={styles.label} ellipsis>
          {formatResources(container.resources?.limits) || '无上限'}
        </Typography.Text>
        <div className={styles.description}>资源上限</div>
      </div>
      <div className={styles.field}>
        <Typography.Text className={styles.label} ellipsis>
          {getPullPolicyLabel(container.image_pull_policy)}
        </Typography.Text>
        <div className={styles.description}>镜像拉取策略</div>
      </div>
      <div className={styles.toggle}>
        {options?.toggleIcon ? (
          selectorOpen ? (
            <CaretUpOutlined />
          ) : (
            <CaretDownOutlined />
          )
        ) : (
          <CaretRightOutlined />
        )}
      </div>
    </button>
  );

  const renderConfigContent = (container: ManagedContainer) => {
    if (activeConfigKey === 'env') {
      return (
        <div className={styles.tabContent}>
          <KeyValueList
            itemBackgroundColor="#ffffff"
            items={getContainerEnvItems(container.env)}
          />
        </div>
      );
    }

    if (activeConfigKey === 'ports') {
      return (
        <div className={styles.tabContent}>
          {container.ports && container.ports.length > 0 ? (
            <div className={styles.portTable}>
              <div className={`${styles.portRow} ${styles.portHeader}`}>
                <div className={styles.portCell}>名称</div>
                <div className={styles.portCell}>协议</div>
                <div className={styles.portCell}>端口</div>
              </div>
              {container.ports.map((port) => (
                <div
                  className={styles.portRow}
                  key={`${port.name || ''}-${port.container_port}-${
                    port.protocol || ''
                  }`}
                >
                  <Typography.Text className={styles.portCell} ellipsis>
                    {port.name || '-'}
                  </Typography.Text>
                  <div className={styles.portCell}>{port.protocol || '-'}</div>
                  <div className={styles.portCell}>
                    {port.container_port || '-'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              className={styles.empty}
              description="暂无数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      );
    }

    return (
      <div className={styles.tabContent}>
        {container.volume_mounts && container.volume_mounts.length > 0 ? (
          <div className={styles.mountList}>
            {container.volume_mounts.map((mount) => {
              const volume = container.volumes?.find(
                (item) => item.name === mount.name,
              );
              const sourceLabel = getVolumeSourceLabel(volume?.type);
              const sourceValue = getVolumeSourceValue(volume);
              const mountPath = mount.mount_path || '-';

              return (
                <div
                  className={styles.mountCard}
                  key={`${mount.name || ''}-${mount.mount_path || ''}`}
                >
                  <div className={styles.mountInfo}>
                    <div className={styles.mountSummary}>
                      <span className={styles.mountIcon}>
                        {getVolumeIcon(volume?.type)}
                      </span>
                      <div className={styles.mountContent}>
                        <Tooltip title={mount.name || '-'}>
                          <Typography.Text
                            className={styles.mountTitle}
                            ellipsis
                          >
                            {mount.name || '-'}
                          </Typography.Text>
                        </Tooltip>
                        <div className={styles.mountDescription}>
                          卷类型：{sourceLabel}
                        </div>
                      </div>
                    </div>
                    <div className={styles.mountContent}>
                      <Tooltip title={sourceValue} placement="topLeft">
                        <Typography.Text className={styles.mountTitle} ellipsis>
                          {sourceValue}
                        </Typography.Text>
                      </Tooltip>
                      <div className={styles.mountDescription}>
                        {sourceLabel}
                      </div>
                    </div>
                  </div>
                  <div className={styles.mountRows}>
                    <div className={styles.mountRow}>
                      <CloudServerOutlined className={styles.mountRowIcon} />
                      <Tooltip
                        title={container.name || '-'}
                        placement="topLeft"
                      >
                        <Typography.Text className={styles.mountPath} ellipsis>
                          {container.name || '-'}
                        </Typography.Text>
                      </Tooltip>
                    </div>
                    <div className={styles.mountRow}>
                      <SettingOutlined className={styles.mountRowIcon} />
                      <Tooltip title={mountPath} placement="topLeft">
                        <Typography.Text className={styles.mountPath} ellipsis>
                          {mountPath}
                          {mount.sub_path ? ` / ${mount.sub_path}` : ''}
                          {mount.read_only ? '（只读）' : ''}
                        </Typography.Text>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            className={styles.empty}
            description="暂无数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    );
  };

  return (
    <Spin spinning={loading}>
      <div className={styles.container}>
        {containers.length > 0 && activeContainer ? (
          <>
            <div className={styles.selector}>
              <div className={styles.selectorScroll}>
                {renderContainerRow(activeContainer, {
                  className: styles.selectedRow,
                  onClick: () => setSelectorOpen((open) => !open),
                  toggleIcon: true,
                })}
              </div>
              {selectorOpen ? (
                <div className={styles.selectorList}>
                  <div className={styles.selectorListScroll}>
                    {containers.map((container) =>
                      renderContainerRow(container, {
                        className: cx(
                          styles.row,
                          container.key === activeContainer.key &&
                            styles.activeRow,
                          container.key === activeContainer.key &&
                            styles.selectedIndicator,
                        ),
                        onClick: () => selectContainer(container),
                      }),
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            {activeContainer ? (
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <CaretDownOutlined />
                  容器: {activeContainer.name || '-'}
                </div>
                <Radio.Group
                  className={styles.radioGroup}
                  onChange={(event) => setActiveConfigKey(event.target.value)}
                  optionType="button"
                  options={containerConfigOptions}
                  value={activeConfigKey}
                />
                {renderConfigContent(activeContainer)}
              </div>
            ) : null}
          </>
        ) : (
          <Empty
            className={styles.empty}
            description="暂无容器"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </Spin>
  );
};

export default ContainerStatusManagement;
