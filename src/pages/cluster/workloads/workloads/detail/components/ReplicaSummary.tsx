import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Progress, Tooltip, theme } from 'antd';
import { createStyles } from 'antd-style';

type ReplicaSummaryProps = {
  loading?: boolean;
  workload?: API.ClusterWorkloadItem;
  onScale?: (replicas: number) => void;
};

const useStyles = createStyles(({ token }) => ({
  card: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
    width: 316,
    minHeight: 0,
    padding: `${token.paddingSM}px ${token.paddingXL}px ${token.paddingSM}px ${token.paddingLG}px`,
    overflow: 'hidden',
    border: `1px solid ${token.colorPrimaryBorder}33`,
    borderRadius: token.borderRadiusSM,
    background: token.colorPrimaryBg,
  },
  halo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 72,
    // background: token.colorPrimaryBgHover,
    opacity: 0.32,
  },
  progress: {
    flex: '0 0 auto',

    '.ant-progress-text': {
      color: `${token.colorPrimaryText} !important`,
      fontSize: 18,
      fontWeight: 500,
    },
  },
  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    marginLeft: token.marginMD,
    paddingRight: token.paddingMD,
    color: token.colorText,
  },
  title: {
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  metaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginTop: 4,
  },
  meta: {
    color: token.colorTextSecondary,
    fontSize: token.fontSizeSM,
    lineHeight: 1.5,
  },
  actions: {
    position: 'absolute',
    top: '50%',
    right: token.paddingMD,
    zIndex: 1,
    display: 'flex',
    transform: 'translateY(-50%)',
    flexDirection: 'column',
    gap: `10px`,
  },
  actionButton: {
    width: 22,
    minWidth: 22,
    height: 22,
    color: token.colorPrimaryText,
    border: `1px solid ${token.colorPrimaryBorder}`,
    borderRadius: token.borderRadiusSM,
    backgroundColor: token.colorBgContainer,

    '&:hover': {
      color: `${token.colorPrimaryText} !important`,
      borderColor: `${token.colorPrimaryBorderHover} !important`,
      backgroundColor: `${token.colorPrimaryBgHover} !important`,
    },

    '&[disabled]': {
      color: token.colorTextDisabled,
      borderColor: token.colorBorderSecondary,
      backgroundColor: token.colorFillQuaternary,
    },
  },
}));

const getReplicaPercent = (current: number, desired: number) => {
  if (desired <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.min(100, Math.round((current / desired) * 100));
};

const ReplicaSummary = ({
  loading = false,
  workload,
  onScale,
}: ReplicaSummaryProps) => {
  const { styles } = useStyles();
  const { token } = theme.useToken();
  const desiredReplicas = workload?.replicas || 0;
  const currentReplicas = workload?.ready_replicas || 0;
  const canScale = Boolean(workload && workload.type !== 'DaemonSet');
  const canScaleDown = canScale && desiredReplicas > 0;

  return (
    <div className={styles.card}>
      <div className={styles.halo} />
      <Progress
        className={styles.progress}
        format={() => `${currentReplicas}/${desiredReplicas}`}
        percent={getReplicaPercent(currentReplicas, desiredReplicas)}
        size={60}
        strokeColor={token.colorPrimary}
        strokeWidth={10}
        trailColor={token.colorFillSecondary}
        type="circle"
      />
      <div className={styles.content}>
        <div className={styles.title}>副本</div>
        <div className={styles.metaList}>
          <div className={styles.meta}>期望副本数: {desiredReplicas}</div>
          <div className={styles.meta}>当前副本数: {currentReplicas}</div>
        </div>
      </div>
      <div className={styles.actions}>
        <Tooltip title={canScale ? '增加副本' : '该类型不支持手动调整副本'}>
          <Button
            className={styles.actionButton}
            disabled={!canScale}
            icon={<PlusOutlined />}
            loading={loading}
            onClick={() => onScale?.(desiredReplicas + 1)}
            size="small"
            type="text"
          />
        </Tooltip>
        <Tooltip title={canScale ? '减少副本' : '该类型不支持手动调整副本'}>
          <Button
            className={styles.actionButton}
            disabled={!canScaleDown}
            icon={<MinusOutlined />}
            loading={loading}
            onClick={() => onScale?.(Math.max(0, desiredReplicas - 1))}
            size="small"
            type="text"
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default ReplicaSummary;
