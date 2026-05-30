import { Tag } from 'antd';
import { createStyles } from 'antd-style';
import { getEventTypeLabel } from './eventHelpers';

const useStyles = createStyles(({ token }) => ({
  type: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    maxWidth: '100%',
    color: token.colorText,
    whiteSpace: 'nowrap',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  normal: {
    backgroundColor: token.colorSuccess,
  },
  warning: {
    backgroundColor: token.colorWarning,
  },
  error: {
    backgroundColor: token.colorError,
  },
}));

type EventTypeBadgeProps = {
  type?: string;
};

const EventTypeBadge = ({ type }: EventTypeBadgeProps) => {
  const { styles } = useStyles();
  const normalizedType = type?.toLowerCase();
  const dotClassName =
    normalizedType === 'normal'
      ? styles.normal
      : normalizedType === 'warning'
        ? styles.warning
        : styles.error;

  return (
    <span className={styles.type}>
      <span className={[styles.dot, dotClassName].join(' ')} />
      <span>{getEventTypeLabel(type)}</span>
    </span>
  );
};

export const EventTypeTag = ({ type }: EventTypeBadgeProps) => {
  const normalizedType = type?.toLowerCase();

  return (
    <Tag
      color={
        normalizedType === 'normal'
          ? 'success'
          : normalizedType === 'warning'
            ? 'warning'
            : 'error'
      }
    >
      {getEventTypeLabel(type)}
    </Tag>
  );
};

export default EventTypeBadge;
