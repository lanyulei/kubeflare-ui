import { createStyles } from 'antd-style';

export const useGitOpsTableStyles = createStyles(({ token }) => ({
  table: {
    '.ant-pro-table-list-toolbar-container': {
      gap: token.marginSM,
    },
    '.ant-pro-table-list-toolbar-left:empty': {
      display: 'none',
    },
    '.ant-pro-table-list-toolbar-right': {
      flex: 1,
      width: '100%',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: token.marginXS,
    },
    '.ant-pro-table-list-toolbar-right > div:not(.ant-pro-table-list-toolbar-setting-items)':
      {
        marginInlineEnd: 'auto',
      },
    '.ant-pro-table-list-toolbar-setting-items': {
      marginInlineStart: 'auto',
    },
  },
}));
