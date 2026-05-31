import { Button, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { RISK_LEVEL_TEXT } from '../constants';

type VisibleRiskLevel = Exclude<API.RbacRiskLevel, 'Info'>;
type RiskLevelFilter = 'all' | VisibleRiskLevel;

type RbacRiskSummaryProps = {
  activeLevel: RiskLevelFilter;
  items: API.RbacAuditItem[];
  onLevelChange: (level: RiskLevelFilter) => void;
};

const visibleLevels: VisibleRiskLevel[] = ['Critical', 'High', 'Medium', 'Low'];

const useStyles = createStyles(({ token }) => ({
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: token.marginSM,
    marginBottom: token.margin,

    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  cardButton: {
    width: '100%',
    height: 'auto',
    padding: `${token.paddingSM}px ${token.padding}px`,
    borderColor: token.colorBorderSecondary,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgContainer,
    textAlign: 'left',
  },
  activeCard: {
    borderColor: token.colorPrimary,
    background: token.colorPrimaryBg,
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
    minWidth: 0,
  },
  label: {
    margin: 0,
    color: token.colorTextSecondary,
    fontSize: 13,
    lineHeight: 1.5,
  },
  value: {
    color: token.colorText,
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  marker: {
    width: 8,
    height: 32,
    flex: '0 0 auto',
    borderRadius: token.borderRadiusSM,
    background: token.colorBorderSecondary,
  },
  markerCritical: {
    background: token.colorError,
  },
  markerHigh: {
    background: token.colorWarning,
  },
  markerMedium: {
    background: token.orange5,
  },
  markerLow: {
    background: token.colorInfo,
  },
  markerAll: {
    background: token.colorPrimary,
  },
}));

const getRiskCount = (items: API.RbacAuditItem[], level: RiskLevelFilter) => {
  if (level === 'all') {
    return items.length;
  }

  return items.filter((item) => item.risk_level === level).length;
};

const markerClassMap: Record<
  RiskLevelFilter,
  keyof ReturnType<typeof useStyles>['styles']
> = {
  all: 'markerAll',
  Critical: 'markerCritical',
  High: 'markerHigh',
  Medium: 'markerMedium',
  Low: 'markerLow',
};

const RbacRiskSummary = ({
  activeLevel,
  items,
  onLevelChange,
}: RbacRiskSummaryProps) => {
  const { styles, cx } = useStyles();
  const summaryItems: { label: string; level: RiskLevelFilter }[] = [
    { label: '全部风险', level: 'all' },
    ...visibleLevels.map((level) => ({
      label: RISK_LEVEL_TEXT[level],
      level,
    })),
  ];

  return (
    <div className={styles.summary}>
      {summaryItems.map((item) => (
        <Button
          className={cx(styles.cardButton, {
            [styles.activeCard]: activeLevel === item.level,
          })}
          key={item.level}
          onClick={() => onLevelChange(item.level)}
        >
          <div className={styles.cardContent}>
            <div>
              <Typography.Text className={styles.label}>
                {item.label}
              </Typography.Text>
              <div className={styles.value}>
                {getRiskCount(items, item.level)}
              </div>
            </div>
            <span
              className={cx(styles.marker, styles[markerClassMap[item.level]])}
            />
          </div>
        </Button>
      ))}
    </div>
  );
};

export type { RbacRiskSummaryProps, RiskLevelFilter, VisibleRiskLevel };
export default RbacRiskSummary;
