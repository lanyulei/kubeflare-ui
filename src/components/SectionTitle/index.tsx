import { createStyles } from 'antd-style';
import type { CSSProperties, ReactNode } from 'react';

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
  color?: CSSProperties['color'];
  fontSize?: CSSProperties['fontSize'];
  style?: CSSProperties;
};

const SectionTitle = ({
  children,
  className,
  color,
  fontSize,
  style,
}: SectionTitleProps) => {
  const { styles, cx } = useStyles();
  const customStyle: CSSProperties = {
    color,
    fontSize,
    ...style,
  };

  return (
    <div className={cx(styles.title, className)} style={customStyle}>
      {children}
    </div>
  );
};

export default SectionTitle;
