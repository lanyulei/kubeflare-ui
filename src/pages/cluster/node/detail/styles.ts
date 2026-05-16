import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  content: {
    backgroundColor: token.colorBgContainer,
    border: `1px solid ${token.colorBorder}80`,
    borderRadius: token.borderRadiusLG,
    padding: `20px`,
  },
  moreInfo: {
    marginTop: '15px',
  },
  moreInfoCard: {
    borderColor: `${token.colorBorder}80`,

    '.ant-card-body': {
      paddingTop: 2,
    },
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  statusDotDefault: {
    backgroundColor: token.colorTextQuaternary,
  },
  statusDotError: {
    backgroundColor: token.colorError,
  },
  statusDotSuccess: {
    backgroundColor: token.colorSuccess,
  },
  statusDotWarning: {
    backgroundColor: token.colorWarning,
  },
  eventTable: {
    '.ant-pro-card': {
      backgroundColor: 'transparent',
    },
    '.ant-pro-card-body': {
      padding: 0,
    },
    '.ant-pro-table-list-toolbar-container': {
      paddingTop: 0,
    },
    '.ant-table-container': {
      overflow: 'hidden',
      borderRadius: token.borderRadiusLG,
    },
    '.ant-table-thead > tr > th': {
      backgroundColor: token.colorFillQuaternary,
      color: token.colorTextSecondary,
      fontWeight: 500,
      lineHeight: 1.5,
    },
    '.ant-table-tbody > tr > td': {
      backgroundColor: token.colorBgContainer,
      borderBottomColor: token.colorFillQuaternary,
      color: token.colorText,
      lineHeight: 1.5,
    },
    '.ant-table-tbody > tr.ant-table-row:hover > td': {
      backgroundColor: token.colorFillTertiary,
    },
    '.ant-pagination': {
      margin: `${token.marginSM}px 0 0`,
    },
  },
  eventType: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXS,
    color: token.colorText,
    whiteSpace: 'nowrap',
  },
  eventTypeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flex: '0 0 auto',
  },
  eventTypeNormal: {
    backgroundColor: token.colorSuccess,
  },
  eventTypeWarning: {
    backgroundColor: token.colorWarning,
  },
  eventTypeError: {
    backgroundColor: token.colorError,
  },
}));

export default useStyles;
