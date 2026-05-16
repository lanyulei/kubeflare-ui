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
    border: '1px solid rgba(255, 255, 255, 0.10)',
    borderRadius: token.borderRadiusSM,
    background:
      'linear-gradient(135deg, #2b3951 0%, #33445d 58%, #40536d 100%)',
    boxShadow: token.boxShadowSecondary,
  },
  halo: {
    position: 'absolute',
    top: -42,
    right: -34,
    width: 92,
    height: 92,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  progress: {
    flex: '0 0 auto',

    '.ant-progress-text': {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: 500,
    },
  },
  content: {
    position: 'relative',
    zIndex: 1,
    minWidth: 0,
    marginLeft: token.marginMD,
    color: '#ffffff',
  },
  title: {
    marginBottom: 2,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: 1.45,
  },
  meta: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: token.fontSizeSM,
    lineHeight: 1.45,
  },
  actions: {
    position: 'absolute',
    top: '50%',
    right: token.paddingMD,
    zIndex: 1,
    display: 'flex',
    transform: 'translateY(-50%)',
    flexDirection: 'column',
    gap: token.marginXS,
  },
  actionButton: {
    width: 22,
    minWidth: 22,
    height: 22,
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.10)',
    borderRadius: token.borderRadiusSM,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',

    '&:hover': {
      color: '#ffffff !important',
      borderColor: 'rgba(255, 255, 255, 0.24) !important',
      backgroundColor: 'rgba(255, 255, 255, 0.22) !important',
    },

    '&[disabled]': {
      color: 'rgba(255, 255, 255, 0.42)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
        size={54}
        strokeColor={token.colorSuccess}
        strokeWidth={8}
        trailColor="rgba(255, 255, 255, 0.18)"
        type="circle"
      />
      <div className={styles.content}>
        <div className={styles.title}>副本</div>
        <div className={styles.meta}>期望副本数: {desiredReplicas}</div>
        <div className={styles.meta}>当前副本数: {currentReplicas}</div>
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
