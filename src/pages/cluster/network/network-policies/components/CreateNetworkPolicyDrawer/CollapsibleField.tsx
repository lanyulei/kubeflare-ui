import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import { useState } from 'react';

const useStyles = createStyles(({ token }) => ({
  headerButton: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    alignItems: 'start',
    gap: token.marginSM,
    width: '100%',
    padding: 0,
    border: 0,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
  },
  headerIcon: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  title: {
    display: 'block',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  description: {
    display: 'block',
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  content: {
    marginTop: 14,
  },
}));

type CollapsibleFieldProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  description?: ReactNode;
  title: ReactNode;
};

const CollapsibleField = ({
  children,
  defaultOpen = true,
  description,
  title,
}: CollapsibleFieldProps) => {
  const { styles } = useStyles();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        aria-expanded={open}
        className={styles.headerButton}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.headerIcon}>
          {open ? <UpOutlined /> : <DownOutlined />}
        </span>
        <span>
          <span className={styles.title}>{title}</span>
          {description && (
            <span className={styles.description}>{description}</span>
          )}
        </span>
      </button>

      {open && <div className={styles.content}>{children}</div>}
    </div>
  );
};

export default CollapsibleField;
