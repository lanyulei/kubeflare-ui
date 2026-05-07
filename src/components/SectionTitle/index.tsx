import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';

const useStyles = createStyles(() => ({
  title: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 600,
    fontStyle: 'normal',
    fontStretch: 'normal',
    lineHeight: 1.67,
    letterSpacing: 'normal',
    color: 'rgba(0,0,0,0.88)',
  },
}));

type SectionTitleProps = {
  children: ReactNode;
  className?: string;
};

const SectionTitle = ({ children, className }: SectionTitleProps) => {
  const { styles, cx } = useStyles();

  return <div className={cx(styles.title, className)}>{children}</div>;
};

export default SectionTitle;
