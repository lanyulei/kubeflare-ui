import { createStyles } from 'antd-style';
import { getJobStatusLabel, getJobStatusType } from './helpers';

const useStyles = createStyles(({ token }) => ({
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    whiteSpace: 'nowrap',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  default: {
    backgroundColor: token.colorTextQuaternary,
    boxShadow: `0 0 0 3px ${token.colorFillSecondary}`,
  },
  error: {
    backgroundColor: token.colorError,
    boxShadow: `0 0 0 3px ${token.colorErrorBg}`,
  },
  success: {
    backgroundColor: token.colorSuccess,
    boxShadow: `0 0 0 3px ${token.colorSuccessBg}`,
  },
  warning: {
    backgroundColor: token.colorWarning,
    boxShadow: `0 0 0 3px ${token.colorWarningBg}`,
  },
}));

type StatusTextProps = {
  status?: string;
};

const StatusText = ({ status }: StatusTextProps) => {
  const { styles } = useStyles();
  const statusType = getJobStatusType(status);

  return (
    <span className={styles.status}>
      <span className={`${styles.dot} ${styles[statusType]}`} />
      <span>{getJobStatusLabel(status)}</span>
    </span>
  );
};

export default StatusText;
