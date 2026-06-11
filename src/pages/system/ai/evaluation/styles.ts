import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token }) => ({
  pageBody: {
    display: 'grid',
    gap: 16,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 16,

    '@media (max-width: 1180px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },

    '@media (max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
  metricCard: {
    borderRadius: 8,

    '.ant-card-body': {
      display: 'grid',
      gap: 10,
      minHeight: 116,
    },
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricLabel: {
    color: token.colorTextSecondary,
    fontSize: 13,
  },
  metricValue: {
    color: token.colorTextHeading,
    fontSize: 28,
    fontWeight: 650,
    lineHeight: 1.15,
  },
  metricFooter: {
    color: token.colorTextTertiary,
    fontSize: 12,
    lineHeight: 1.5,
  },
  panelCard: {
    borderRadius: 8,

    '.ant-card-head-title': {
      fontWeight: 600,
    },
  },
  panelExtra: {
    color: token.colorTextTertiary,
    fontSize: 12,
  },
  featureCell: {
    display: 'grid',
    gap: 4,
    minWidth: 0,
  },
  featureTitle: {
    color: token.colorTextHeading,
    fontWeight: 600,
  },
  featureDescription: {
    color: token.colorTextSecondary,
    fontSize: 12,
    lineHeight: 1.5,
    overflowWrap: 'anywhere',
  },
  bucketStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  rateCell: {
    display: 'grid',
    gap: 8,
    minWidth: 220,
  },
  rateLine: {
    display: 'grid',
    gridTemplateColumns: '36px minmax(84px, 1fr) 58px',
    alignItems: 'center',
    gap: 8,
    color: token.colorTextSecondary,
    fontSize: 12,
  },
  rateTrack: {
    position: 'relative',
    height: 8,
    overflow: 'hidden',
    borderRadius: 999,
    background: token.colorFillQuaternary,
  },
  rateBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 999,
    background: token.colorSuccess,
  },
  rateBarMuted: {
    background: token.colorWarning,
  },
  deltaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: token.colorTextTertiary,
    fontSize: 12,
  },
  costStack: {
    display: 'grid',
    gap: 6,
    minWidth: 210,
    color: token.colorTextSecondary,
    fontSize: 12,
  },
  costLine: {
    display: 'grid',
    gridTemplateColumns: '54px minmax(0, 1fr) minmax(0, 1fr)',
    alignItems: 'center',
    gap: 8,
  },
  costLabel: {
    color: token.colorTextTertiary,
  },
  emptyPanel: {
    display: 'grid',
    minHeight: 280,
    placeItems: 'center',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 8,
    background: token.colorBgContainer,
  },
}));
