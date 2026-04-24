import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => {
  return {
    activitiesList: {
      padding: 0,
    },
    username: {
      color: token.colorText,
    },
    event: {
      fontWeight: 'normal',
    },
    pageHeaderContent: {
      display: 'flex',
      [`@media screen and (max-width: ${token.screenSM}px)`]: {
        display: 'block',
      },
    },
    avatar: {
      flex: '0 1 72px',
      '& > span': {
        display: 'block',
        width: '72px',
        height: '72px',
        borderRadius: '72px',
      },
    },
    content: {
      position: 'relative',
      top: '4px',
      flex: '1 1 auto',
      marginLeft: '24px',
      color: token.colorTextSecondary,
      lineHeight: '22px',
      [`@media screen and (max-width: ${token.screenSM}px)`]: {
        marginLeft: '0',
        marginTop: '16px',
      },
    },
    contentTitle: {
      marginBottom: '12px',
      color: token.colorTextHeading,
      fontWeight: 500,
      fontSize: '20px',
      lineHeight: '28px',
    },
    extraContent: {
      display: 'flex',
      justifyContent: 'flex-end',
      whiteSpace: 'nowrap',
      [`@media screen and (max-width: ${token.screenLG}px)`]: {
        justifyContent: 'flex-start',
      },
      [`@media screen and (max-width: ${token.screenSM}px)`]: {
        flexWrap: 'wrap',
      },
    },
    statItem: {
      position: 'relative',
      display: 'inline-block',
      padding: '0 32px',
      '& .ant-statistic': {
        textAlign: 'left',
      },
      '& .ant-statistic-content': {
        fontSize: '30px',
        lineHeight: '38px',
      },
      '& .ant-statistic-content-suffix': {
        color: token.colorTextSecondary,
        fontSize: '20px',
      },
      '&::after': {
        position: 'absolute',
        top: '8px',
        right: '0',
        width: '1px',
        height: '40px',
        backgroundColor: token.colorSplit,
        content: "''",
      },
      '&:last-child': {
        paddingRight: '0',
        '&::after': {
          display: 'none',
        },
      },
      [`@media screen and (max-width: ${token.screenLG}px)`]: {
        padding: '0 16px 0 0',
        '&::after': {
          display: 'none',
        },
      },
      [`@media screen and (max-width: ${token.screenSM}px)`]: {
        width: '50%',
        paddingBottom: '16px',
      },
    },
    projectList: {
      '.ant-card-meta-description': {
        height: '44px',
        overflow: 'hidden',
        color: token.colorTextSecondary,
        lineHeight: '22px',
      },
    },
    cardTitle: {
      fontSize: 0,
      a: {
        display: 'inline-block',
        height: '24px',
        marginLeft: '12px',
        color: token.colorTextHeading,
        fontSize: token.fontSize,
        lineHeight: '24px',
        verticalAlign: 'top',
        '&:hover': {
          color: token.colorPrimary,
        },
      },
    },
    projectGrid: {
      width: '33.33%',
      [`@media screen and (max-width: ${token.screenMD}px)`]: {
        width: '50%',
      },
      [`@media screen and (max-width: ${token.screenXS}px)`]: {
        width: '100%',
      },
    },
    projectItemContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      height: '20px',
      marginTop: '8px',
      overflow: 'hidden',
      fontSize: '12px',
      lineHeight: '20px',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      wordBreak: 'break-all',
      a: {
        display: 'inline-block',
        flex: '1 1 0',
        overflow: 'hidden',
        color: token.colorTextSecondary,
        textOverflow: 'ellipsis',
        '&:hover': {
          color: token.colorPrimary,
        },
      },
    },
    datetime: {
      flex: '0 0 auto',
      color: token.colorTextDisabled,
    },
    activeCard: {
      [`@media screen and (max-width: ${token.screenLG}px)`]: {
        marginBottom: '24px',
      },
    },
    members: {
      a: {
        display: 'block',
        height: '24px',
        margin: '12px 0',
        overflow: 'hidden',
        color: token.colorText,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        transition: 'all 0.3s',
        '&:hover': {
          color: token.colorPrimary,
        },
      },
    },
    member: {
      marginLeft: '12px',
      fontSize: token.fontSize,
      lineHeight: '24px',
      verticalAlign: 'top',
    },
    linkGroup: {
      fontSize: 0,
      '& > a': {
        display: 'inline-block',
        width: '25%',
        marginBottom: '13px',
        color: token.colorText,
        fontSize: token.fontSize,
        '&:hover': {
          color: token.colorPrimary,
        },
        [`@media screen and (max-width: ${token.screenSM}px)`]: {
          width: '50%',
        },
      },
    },
    radarChart: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    },
    radarSvg: {
      overflow: 'visible',
    },
    radarAxisLabel: {
      fill: token.colorTextSecondary,
      fontSize: 12,
    },
    radarGrid: {
      fill: 'none',
      stroke: token.colorBorderSecondary,
      strokeWidth: 1,
    },
    radarAxis: {
      stroke: token.colorBorder,
      strokeWidth: 1,
    },
    radarLegend: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '16px',
    },
    radarLegendItem: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: token.colorTextSecondary,
      fontSize: token.fontSize,
    },
    radarLegendSwatch: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
    },
  };
});

export default useStyles;
