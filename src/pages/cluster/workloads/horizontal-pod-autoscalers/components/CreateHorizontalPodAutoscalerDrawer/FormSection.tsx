import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';

const useStyles = createStyles(({ token }) => ({
  section: {
    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  optionSectionTitle: {
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  option: {
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
  },
  sectionTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionDescription: {
    marginTop: token.marginXXS,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
  sectionContent: {
    marginTop: 8,
  },
  helpIcon: {
    color: token.colorTextTertiary,
    cursor: 'help',
    fontSize: 12,
  },
}));

type HpaFormSectionProps = {
  children: ReactNode;
  description?: ReactNode;
  title: ReactNode;
  tooltip?: ReactNode;
  variant?: 'option' | 'plain';
};

const FormSection = ({
  children,
  description,
  title,
  tooltip,
  variant = 'plain',
}: HpaFormSectionProps) => {
  const { styles } = useStyles();
  const titleNode = (
    <span className={styles.sectionTitle}>
      {title}
      {tooltip && (
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined className={styles.helpIcon} />
        </Tooltip>
      )}
    </span>
  );

  if (variant === 'option') {
    return (
      <div className={styles.section}>
        <div className={styles.optionSectionTitle}>{titleNode}</div>
        <div className={styles.option}>
          {description && (
            <div className={styles.sectionDescription}>{description}</div>
          )}
          <div className={styles.sectionContent}>{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>{titleNode}</div>
      {description && (
        <div className={styles.sectionDescription}>{description}</div>
      )}
      <div className={styles.sectionContent}>{children}</div>
    </div>
  );
};

export default FormSection;
