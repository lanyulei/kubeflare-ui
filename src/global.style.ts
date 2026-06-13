import { createStyles } from 'antd-style';

const useStyles = createStyles(() => {
  return {
    colorWeak: {
      filter: 'invert(80%)',
    },
    'ant-layout': {
      minHeight: '100vh',
    },
    'ant-pro-sider.ant-layout-sider.ant-pro-sider-fixed': {
      left: 'unset',
    },
    canvas: {
      display: 'block',
    },
    body: {
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    'ant-table-wrapper': {
      '& .ant-table-content, & .ant-table-body': {
        scrollbarWidth: 'thin',
      },
      '& .ant-table-thead > tr > th, & .ant-table-tbody > tr > td, & .ant-table-summary > tr > td':
        {
          verticalAlign: 'top',
          overflowWrap: 'anywhere',
        },
      '& .ant-table-thead > tr > th:not(.ant-table-selection-column):not(.ant-table-row-expand-icon-cell), & .ant-table-tbody > tr > td:not(.ant-table-selection-column):not(.ant-table-row-expand-icon-cell), & .ant-table-summary > tr > td:not(.ant-table-selection-column):not(.ant-table-row-expand-icon-cell)':
        {
          minWidth: 96,
        },
      '& .ant-table-thead > tr > th': {
        whiteSpace: 'nowrap',
      },
    },
    'ul,ol': {
      listStyle: 'none',
    },
    '@media(max-width: 768px)': {
      'ant-table': {
        width: '100%',
        overflowX: 'auto',
        '&-thead > tr,    &-tbody > tr': {
          '> th,      > td': {
            whiteSpace: 'normal',
            '> span': {
              display: 'block',
            },
          },
        },
      },
    },
  };
});

export default useStyles;
