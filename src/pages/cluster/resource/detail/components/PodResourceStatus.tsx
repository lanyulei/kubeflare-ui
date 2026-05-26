import {
  ClusterOutlined,
  CodeOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  HddOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { SectionTitle } from '@/components';
import { formatValue } from './helpers';

const useStyles = createStyles(({ token }) => ({
  resourceStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginMD,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  containerItem: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 1fr) 160px 160px 180px',
    gap: token.marginLG,
    alignItems: 'center',
    minHeight: 64,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 992px)': {
      gridTemplateColumns: '1fr 1fr',
      alignItems: 'start',
    },

    '@media (max-width: 576px)': {
      gridTemplateColumns: '1fr',
    },
  },
  containerMain: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
    minWidth: 0,
  },
  iconWrap: {
    position: 'relative',
    flex: '0 0 auto',
    width: 36,
    height: 36,
    color: token.colorTextSecondary,
    fontSize: 28,
    lineHeight: '36px',
    textAlign: 'center',
  },
  statusBadge: {
    position: 'absolute',
    right: 1,
    bottom: 0,
    width: 8,
    height: 8,
    border: `2px solid ${token.colorBgContainer}`,
    borderRadius: '50%',
    backgroundColor: token.colorSuccess,
  },
  content: {
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginXS,
    minWidth: 0,
  },
  name: {
    minWidth: 0,
    overflow: 'hidden',
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    border: 0,
    backgroundColor: 'transparent',
    color: token.colorTextSecondary,
    cursor: 'default',
    fontSize: 13,
    lineHeight: 1,
  },
  image: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metricValue: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.5,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metricLabel: {
    marginTop: 2,
    color: token.colorTextTertiary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  volumeItem: {
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorBgContainer,
  },
  volumeHeader: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1fr)',
    gap: token.marginLG,
    alignItems: 'center',

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: token.marginSM,
    },
  },
  volumeMain: {
    display: 'flex',
    alignItems: 'center',
    gap: token.marginMD,
    minWidth: 0,
  },
  volumeIcon: {
    flex: '0 0 auto',
    color: token.colorTextSecondary,
    fontSize: 32,
  },
  volumeMounts: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: token.marginSM,
  },
  mountItem: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 220px) minmax(0, 1fr)',
    gap: token.marginMD,
    alignItems: 'center',
    minHeight: 36,
    padding: `0 ${token.paddingSM}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 576px)': {
      gridTemplateColumns: '1fr',
      padding: `${token.paddingSM}px`,
    },
  },
  mountContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    minWidth: 0,
    color: token.colorText,
    fontWeight: 600,
  },
  mountPath: {
    minWidth: 0,
    overflow: 'hidden',
    color: token.colorText,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

type PodResourceStatusProps = {
  pod?: API.ClusterNodePodItem;
};

const formatContainerPorts = (ports?: API.ClusterNodePodContainerPort[]) => {
  if (!ports || ports.length === 0) {
    return '-';
  }

  return ports
    .map((port) =>
      port.container_port
        ? `${port.container_port}/${port.protocol || 'TCP'}`
        : undefined,
    )
    .filter(Boolean)
    .join('、');
};

const getVolumeSource = (volume: API.ClusterNodePodVolume) =>
  volume.source_path || volume.source_name || volume.type || '-';

const getVolumeMounts = (pod: API.ClusterNodePodItem, volumeName?: string) =>
  (pod.containers || []).flatMap((container) =>
    (container.volume_mounts || [])
      .filter((mount) => mount.name === volumeName)
      .map((mount) => ({
        container: container.name,
        mount,
      })),
  );

const PodResourceStatus = ({ pod }: PodResourceStatusProps) => {
  const { styles } = useStyles();

  if (!pod) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className={styles.resourceStatus}>
      <div>
        <SectionTitle color={'#36435C'} fontSize={12}>
          容器
        </SectionTitle>
        {pod.containers && pod.containers.length > 0 ? (
          <div className={styles.list}>
            {pod.containers.map((container) => (
              <div className={styles.containerItem} key={container.name}>
                <div className={styles.containerMain}>
                  <div className={styles.iconWrap}>
                    <ClusterOutlined />
                    <span className={styles.statusBadge} />
                  </div>
                  <div className={styles.content}>
                    <div className={styles.titleRow}>
                      <Tooltip title={container.name || '-'}>
                        <div className={styles.name}>
                          {container.name || '-'}
                        </div>
                      </Tooltip>
                      <Tooltip title="容器日志">
                        <span className={styles.trigger}>
                          <FileTextOutlined />
                        </span>
                      </Tooltip>
                      <Tooltip title="终端">
                        <span className={styles.trigger}>
                          <CodeOutlined />
                        </span>
                      </Tooltip>
                      {container.probes && container.probes.length > 0 ? (
                        <Tooltip title="已配置探针">
                          <span className={styles.trigger}>
                            <SettingOutlined />
                          </span>
                        </Tooltip>
                      ) : null}
                    </div>
                    <Tooltip title={container.image || '-'}>
                      <div className={styles.image}>
                        镜像：{container.image || '-'}
                      </div>
                    </Tooltip>
                  </div>
                </div>
                <div>
                  <div className={styles.metricValue}>
                    {container.status || '-'}
                  </div>
                  <div className={styles.metricLabel}>状态</div>
                </div>
                <div>
                  <div className={styles.metricValue}>
                    {container.restart_count || 0}
                  </div>
                  <div className={styles.metricLabel}>重启次数</div>
                </div>
                <div>
                  <Tooltip title={formatContainerPorts(container.ports)}>
                    <div className={styles.metricValue}>
                      {formatContainerPorts(container.ports)}
                    </div>
                  </Tooltip>
                  <div className={styles.metricLabel}>端口</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无容器" />
        )}
      </div>
      <div>
        <SectionTitle color={'#36435C'} fontSize={12}>
          卷
        </SectionTitle>
        {pod.volumes && pod.volumes.length > 0 ? (
          <div className={styles.list}>
            {pod.volumes.map((volume) => {
              const mounts = getVolumeMounts(pod, volume.name);

              return (
                <div className={styles.volumeItem} key={volume.name}>
                  <div className={styles.volumeHeader}>
                    <div className={styles.volumeMain}>
                      <HddOutlined className={styles.volumeIcon} />
                      <div className={styles.content}>
                        <Tooltip title={volume.name || '-'}>
                          <div className={styles.name}>
                            {volume.name || '-'}
                          </div>
                        </Tooltip>
                        <div className={styles.image}>
                          卷类型：{formatValue(volume.type)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Tooltip title={getVolumeSource(volume)}>
                        <div className={styles.metricValue}>
                          {getVolumeSource(volume)}
                        </div>
                      </Tooltip>
                      <div className={styles.metricLabel}>
                        {volume.source_path ? '路径' : '来源'}
                      </div>
                    </div>
                  </div>
                  {mounts.length > 0 ? (
                    <div className={styles.volumeMounts}>
                      {mounts.map(({ container, mount }) => (
                        <div
                          className={styles.mountItem}
                          key={`${container || '-'}-${mount.mount_path || '-'}`}
                        >
                          <span className={styles.mountContainer}>
                            <DatabaseOutlined />
                            <span>{container || '-'}</span>
                          </span>
                          <Tooltip title={mount.mount_path || '-'}>
                            <span className={styles.mountPath}>
                              {mount.mount_path || '-'}
                              {mount.read_only ? '（只读）' : ''}
                            </span>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无卷" />
        )}
      </div>
    </div>
  );
};

export default PodResourceStatus;
