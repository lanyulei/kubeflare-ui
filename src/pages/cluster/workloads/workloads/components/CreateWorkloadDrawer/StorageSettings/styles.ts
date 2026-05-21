import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  entryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: `16px`,
    padding: `14px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  entryCard: {
    display: 'flex',
    minHeight: 64,
    alignItems: 'center',
    gap: token.marginMD,
    padding: `${token.paddingSM}px ${token.paddingLG}px`,
    border: `1px dashed ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    color: token.colorText,
    cursor: 'pointer',
    textAlign: 'left',
    transition: `border-color ${token.motionDurationMid}, background ${token.motionDurationMid}`,

    '&:hover': {
      borderColor: token.colorPrimary,
      background: token.colorFillQuaternary,
    },

    '&:focus-visible': {
      borderColor: token.colorPrimary,
      outline: `2px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 1,
    },
  },
  entryIcon: {
    color: '#3a4b63',
    fontSize: 28,
  },
  entryContent: {
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    gap: token.marginXXS,
  },
  entryTitle: {
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  entryDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: token.marginSM,
    marginBottom: token.marginXS,
  },
  title: {
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 500,
    lineHeight: token.lineHeight,
  },
  segmented: {
    marginBottom: token.marginSM,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: 999,
    background: token.colorFillQuaternary,

    '.ant-segmented-item': {
      minWidth: 116,
      borderRadius: 999,
    },

    '.ant-segmented-item-selected': {
      background: '#35435c',
      color: '#ffffff',
    },
  },
  panel: {
    padding: token.paddingSM,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
  },
  resourceItem: {
    marginBottom: token.marginSM,

    '.ant-form-item-explain-error': {
      marginTop: token.marginXS,
    },
  },
  resourceSelect: {
    width: '100%',

    '.ant-select-selector': {
      minHeight: '72px !important',
      alignItems: 'center',
      borderRadius: `${token.borderRadiusSM}px !important`,
      padding: `0 ${token.paddingSM}px !important`,
    },

    '.ant-select-selection-item': {
      width: '100%',
    },

    '.ant-select-selection-placeholder': {
      width: '100%',
    },
  },
  resourceOption: {
    display: 'grid',
    width: '100%',
    gridTemplateColumns:
      '44px minmax(180px, 1fr) repeat(2, minmax(120px, 0.6fr))',
    alignItems: 'center',
    gap: token.marginMD,
    color: token.colorText,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '40px minmax(0, 1fr)',
    },
  },
  resourcePlaceholder: {
    display: 'flex',
    width: '100%',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginMD,
  },
  resourceIcon: {
    display: 'inline-flex',
    width: 36,
    height: 36,
    flex: '0 0 auto',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3a4b63',
    fontSize: 28,
  },
  resourceText: {
    minWidth: 0,
  },
  resourceTitle: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resourceDescription: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resourceMetric: {
    minWidth: 0,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,

    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  metricLabel: {
    display: 'block',
    marginTop: 2,
    color: token.colorTextTertiary,
    fontWeight: 400,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginLG,
    marginBottom: token.marginSM,

    '.ant-form-item': {
      marginBottom: token.marginSM,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  info: {
    marginBottom: token.marginMD,
  },
  mountRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  mountRow: {
    display: 'grid',
    minHeight: 46,
    gridTemplateColumns:
      'minmax(180px, 0.8fr) minmax(220px, 1fr) minmax(240px, 1fr)',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    background: token.colorFillQuaternary,

    '.ant-form-item': {
      marginBottom: 0,
    },

    '.ant-select-single': {
      height: 32,
    },

    '.ant-select-selector, .ant-input': {
      borderColor: `${token.colorBorder} !important`,
      borderRadius: `${token.borderRadiusSM}px !important`,
      background: `${token.colorBgContainer} !important`,
      boxShadow: 'none !important',
    },

    '.ant-input': {
      height: 32,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      borderRadius: token.borderRadiusSM,
    },
  },
  containerIdentity: {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
  },
  containerIcon: {
    color: '#3a4b63',
    fontSize: 16,
  },
  mountControl: {
    width: '100%',
    minWidth: 0,
  },
  specificPanel: {
    marginTop: token.marginSM,
    padding: `${token.paddingSM}px ${token.padding}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
  },
  specificHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: token.marginSM,
    marginBottom: token.marginSM,

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
  specificText: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  specificDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
  },
  keyRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  keyRow: {
    display: 'grid',
    minHeight: 46,
    gridTemplateColumns: 'minmax(180px, 1fr) minmax(220px, 1fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    borderRadius: 24,
    background: token.colorFillQuaternary,

    '.ant-form-item': {
      marginBottom: 0,
    },

    '.ant-select-selector, .ant-input': {
      borderRadius: `${token.borderRadiusSM}px !important`,
      background: `${token.colorBgContainer} !important`,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr 40px',

      '.ant-form-item:last-of-type': {
        gridColumn: '1 / -1',
        gridRow: 2,
      },
    },
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  addAction: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: token.marginSM,
  },
  empty: {
    padding: `${token.paddingMD}px 0`,
  },
}));

export default useStyles;
