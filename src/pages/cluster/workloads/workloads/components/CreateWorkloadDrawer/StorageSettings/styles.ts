import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  storageTitle: {
    marginBottom: `8px`,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
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
  entryCardWide: {
    gridColumn: '1 / -1',
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
  storageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  storageCard: {
    padding: `${token.paddingSM}px ${token.paddingLG}px`,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    transition: `border-color ${token.motionDurationMid}, box-shadow ${token.motionDurationMid}`,

    '&:hover': {
      borderColor: token.colorPrimaryBorder,
      boxShadow: token.boxShadowTertiary,
    },
  },
  storageCardMain: {
    display: 'grid',
    minHeight: 56,
    gridTemplateColumns:
      '44px minmax(150px, 1fr) repeat(3, minmax(120px, 0.6fr)) auto',
    alignItems: 'center',
    gap: token.marginMD,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '40px minmax(0, 1fr) auto',
    },
  },
  storageCardIcon: {
    display: 'inline-flex',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3a4b63',
    fontSize: 30,
  },
  storageCardIdentity: {
    minWidth: 0,
  },
  storageCardName: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  storageCardDescription: {
    marginTop: 2,
    overflow: 'hidden',
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  storageCardMetric: {
    minWidth: 0,
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',

    span: {
      display: 'block',
      marginTop: 2,
      color: token.colorTextTertiary,
      fontWeight: 400,
    },

    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  storageCardActions: {
    display: 'inline-flex',
    justifySelf: 'end',
    gap: token.marginXS,

    '.ant-btn': {
      color: token.colorTextTertiary,
    },
  },
  cardMountRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginXS,
    marginTop: token.marginSM,
  },
  cardMountRow: {
    display: 'grid',
    minHeight: 38,
    gridTemplateColumns: 'minmax(160px, 0.8fr) minmax(220px, 1fr)',
    alignItems: 'center',
    gap: token.marginLG,
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: token.marginXS,
    },
  },
  cardMountContainer: {
    display: 'inline-flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
  },
  cardMountMeta: {
    display: 'inline-flex',
    minWidth: 0,
    alignItems: 'center',
    gap: token.marginSM,
    color: token.colorText,
    fontSize: token.fontSizeSM,
  },
  addStorageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginMD,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  addStorageCard: {
    display: 'flex',
    minHeight: 64,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: token.marginXXS,
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
  },
  addStorageTitle: {
    color: token.colorText,
    fontSize: token.fontSizeSM,
    fontWeight: 600,
    lineHeight: token.lineHeight,
  },
  addStorageDescription: {
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    color: token.colorText,
    fontSize: token.fontSize,
    fontWeight: 500,
    lineHeight: token.lineHeight,
  },
  titleIcon: {
    color: '#3a4b63',
    fontSize: token.fontSizeSM,
  },
  typeTabs: {
    display: 'grid',
    width: 'min(454px, 100%)',
    gridAutoColumns: 'minmax(112px, 1fr)',
    gridAutoFlow: 'column',
    gap: 2,
    marginBottom: token.marginSM,
    padding: 2,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: 999,
    background: token.colorFillQuaternary,

    '@media (max-width: 576px)': {
      gridAutoFlow: 'row',
      gridTemplateColumns: '1fr',
      borderRadius: token.borderRadiusSM,
    },
  },
  typeTab: {
    height: 28,
    border: 0,
    borderRadius: 999,
    background: 'transparent',
    color: token.colorText,
    cursor: 'pointer',
    fontSize: token.fontSizeSM,
    lineHeight: '28px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    transition: `background ${token.motionDurationMid}, color ${token.motionDurationMid}`,

    '&:hover': {
      background: token.colorFillSecondary,
    },

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimaryBorder}`,
      outlineOffset: 1,
    },

    '@media (max-width: 576px)': {
      borderRadius: token.borderRadiusSM,
      fontSize: 12,
    },
  },
  typeTabActive: {
    '&&': {
      background: token.colorPrimaryBg,
      color: token.colorPrimaryText,
      boxShadow: `inset 0 0 0 1px ${token.colorPrimaryBorder}`,
    },

    '&&:hover': {
      background: token.colorPrimaryBgHover,
      color: token.colorPrimaryText,
    },
  },
  panel: {
    // padding: token.paddingSM,
    // border: `1px solid ${token.colorBorder}`,
    // borderRadius: token.borderRadiusSM,
    // background: token.colorBgContainer,
  },
  templatePanel: {
    marginBottom: token.marginSM,
  },
  templateFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 456px) minmax(0, 1fr)',
    gap: token.marginSM,

    '.ant-form-item': {
      marginBottom: 0,
    },

    '.ant-form-item-extra': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
    },

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  templateField: {
    gridColumn: 1,
  },
  capacityFormItem: {
    gridColumn: '1 / -1',
  },
  capacityRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 132px',
    alignItems: 'center',
    gap: `15px`,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr 124px',
    },
  },
  capacitySlider: {
    '.ant-slider-mark-text': {
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
    },
  },
  capacityInput: {
    width: '100%',
  },
  resourceSelector: {
    marginBottom: token.marginSM,
  },
  resourceItem: {
    '&.ant-form-item': {
      marginBottom: 0,
    },

    '.ant-form-item-explain-error': {
      marginTop: token.marginXS,
    },
  },
  resourceSelect: {
    width: '100%',
    height: '100% !important',

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
    gridTemplateColumns: 'minmax(180px, 0.8fr) repeat(2, minmax(220px, 1fr))',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    background: token.colorFillQuaternary,

    '.ant-form-item': {
      marginBottom: 0,
    },

    '.ant-select-single, .ant-input-affix-wrapper': {
      height: 32,
    },

    '.ant-select-selector, .ant-input, .ant-input-affix-wrapper': {
      borderColor: `${token.colorBorder} !important`,
      borderRadius: `${token.borderRadiusSM}px !important`,
      background: `${token.colorBgContainer} !important`,
      boxShadow: 'none !important',
    },

    '.ant-input-affix-wrapper': {
      display: 'inline-flex',
      alignItems: 'center',
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
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
  },
  specificHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: token.marginSM,
    // marginBottom: token.marginSM,

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
    padding: `12px 16px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorBgContainer,
    marginTop: `14px`,
  },
  keyEditor: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  keyRow: {
    display: 'grid',
    minHeight: 46,
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    background: token.colorFillQuaternary,

    '.ant-form-item': {
      marginBottom: 0,
    },

    '.ant-select-selector, .ant-input': {
      borderRadius: `${token.borderRadiusSM}px !important`,
      background: `${token.colorBgContainer} !important`,
    },

    '@media (max-width: 576px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  keyValueField: {
    '@media (max-width: 576px)': {
      gridColumn: '1 / -1',
      gridRow: 2,
    },
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },
  },
  keyFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: `12px`,
  },
  empty: {
    padding: `${token.paddingMD}px 0`,
  },
}));

export default useStyles;
