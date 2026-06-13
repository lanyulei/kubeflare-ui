import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token }) => ({
  shell: {
    display: 'grid',
    height: '100%',
    minHeight: 0,
    gridTemplateColumns: '212px minmax(0, 1fr)',
    overflow: 'hidden',
    color: '#14204b',
    background: '#f5f7fb',

    '@media (max-width: 960px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'auto minmax(0, 1fr)',
    },
  },
  sidebar: {
    display: 'flex',
    minHeight: 0,
    flexDirection: 'column',
    gap: 16,
    padding: '20px 16px',
    borderRight: `1px solid ${token.colorBorderSecondary}`,
    background: '#ffffff',

    '@media (max-width: 960px)': {
      display: 'grid',
      gridTemplateRows: 'auto auto',
      padding: '12px 16px',
      borderRight: 0,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
    },
  },
  sidebarHeader: {
    display: 'block',
  },
  newSessionButton: {
    display: 'inline-flex',
    width: '100%',
    height: 42,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    border: 0,
    borderRadius: 12,
    background: 'linear-gradient(180deg, #8e6fff 0%, #3a20d2 100%)',
    boxShadow: '0 10px 22px rgba(77, 53, 219, 0.24)',
    fontSize: 14,
    fontWeight: 600,

    '.ant-btn-icon': {
      display: 'inline-flex',
      fontSize: 16,
    },
  },
  sessionList: {
    flex: 1,
    padding: 0,
    overflowY: 'auto',
    scrollbarWidth: 'none',

    '&::-webkit-scrollbar': {
      display: 'none',
    },

    '@media (max-width: 960px)': {
      display: 'grid',
      gridAutoColumns: 'minmax(220px, 1fr)',
      gridAutoFlow: 'column',
      gap: 10,
      overflowX: 'auto',
      overflowY: 'hidden',
    },
  },
  sessionItem: {
    position: 'relative',
    display: 'block',
    width: '100%',
    minHeight: 64,
    marginBottom: 6,
    padding: '8px 8px 7px',
    border: '1px solid transparent',
    borderRadius: 10,
    color: '#7c8ba6',
    background: 'transparent',
    transition:
      'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',

    '&:hover': {
      color: '#18214f',
      background: '#f7f8fd',
    },

    '@media (max-width: 960px)': {
      marginBottom: 0,
    },
  },
  sessionItemActive: {
    color: '#18214f',
    borderColor: '#e4e8f4',
    background: '#f7f6ff',
    boxShadow: '0 10px 24px rgba(71, 83, 111, 0.08)',
  },
  sessionSelectButton: {
    display: 'grid',
    width: '100%',
    minWidth: 0,
    minHeight: 48,
    gridTemplateColumns: 'minmax(0, 1fr)',
    alignItems: 'center',
    padding: 0,
    border: 0,
    color: 'inherit',
    cursor: 'pointer',
    background: 'transparent',
    font: 'inherit',
    textAlign: 'left',

    '&:focus-visible': {
      outline: `2px solid ${token.colorPrimary}`,
      outlineOffset: 2,
      borderRadius: 8,
    },
  },
  sessionDeleteButton: {
    '&&': {
      position: 'absolute',
      right: 6,
      bottom: 6,
      width: 26,
      height: 26,
      minWidth: 26,
      padding: 0,
      color: '#9aa7bc',
      borderRadius: 8,
      fontSize: 14,
      lineHeight: 1,

      '&:hover': {
        color: token.colorError,
        background: token.colorErrorBg,
      },
    },
  },
  sessionContent: {
    display: 'grid',
    minWidth: 0,
    gap: 4,
  },
  sessionHeaderRow: {
    display: 'grid',
    minWidth: 0,
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: 10,
  },
  sessionTitle: {
    overflow: 'hidden',
    color: '#18214f',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.3,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sessionFooterRow: {
    display: 'grid',
    minWidth: 0,
    gridTemplateColumns: 'minmax(0, 1fr) 26px',
    alignItems: 'center',
    gap: 8,
  },
  sessionPreview: {
    overflow: 'hidden',
    color: '#9aa7bc',
    fontSize: 12,
    lineHeight: 1.35,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sessionTime: {
    color: '#a7b2c3',
    fontSize: 11,
    lineHeight: 1.35,
    whiteSpace: 'nowrap',
  },
  main: {
    display: 'grid',
    minWidth: 0,
    minHeight: 0,
    gridTemplateRows: 'minmax(0, 1fr) auto',
    background: '#ffffff',
  },
  content: {
    minHeight: 0,
    overflowY: 'auto',
    padding: '0 40px',
    background:
      'radial-gradient(circle at 55% 30%, rgba(99, 73, 255, 0.05), transparent 32%), #ffffff',

    '@media (max-width: 768px)': {
      padding: '0 16px',
    },
  },
  conversation: {
    width: 'min(100%, 860px)',
    margin: '28px auto 0',
  },
  emptyState: {
    display: 'grid',
    minHeight: 280,
    placeItems: 'center',
    color: '#8d9ab2',
  },
  messageStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    paddingBottom: 28,
  },
  chatMessage: {
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    gap: 12,
  },
  chatMessageUser: {
    flexDirection: 'row-reverse',
  },
  chatMessageAssistant: {
    flexDirection: 'row',
  },
  messageAvatar: {
    flex: '0 0 auto',
    marginTop: 4,
  },
  messageContent: {
    minWidth: 0,
  },
  userMessageContent: {
    maxWidth: 'min(72%, 560px)',

    '@media (max-width: 768px)': {
      maxWidth: 'calc(100% - 44px)',
    },
  },
  assistantMessageContent: {
    flex: 1,
  },
  assistantAvatar: {
    width: 30,
    height: 30,
    color: '#ffffff',
    background: 'linear-gradient(180deg, #8e6fff 0%, #3a20d2 100%)',
    boxShadow: '0 10px 22px rgba(77, 53, 219, 0.28)',
  },
  userMessageAvatar: {
    width: 30,
    height: 30,
    color: '#4a37dc',
    background: '#ffffff',
    border: '1px solid #e5e9f3',
  },
  responseCard: {
    padding: '12px 16px',
    border: '1px solid #edf1f7',
    borderRadius: 12,
    color: '#152153',
    background: '#ffffff',
    boxShadow: '0 20px 44px rgba(71, 83, 111, 0.1)',
    fontSize: 13,
    lineHeight: 1.7,
  },
  agentRunPanel: {
    position: 'relative',
    display: 'grid',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '1px solid #edf1f7',
    color: '#4f5f7a',
    fontSize: 12,
    lineHeight: 1.5,
  },
  agentRunPanelWithFeedback: {
    paddingRight: 32,
  },
  agentRunHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  agentRouteMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
  },
  agentConfidence: {
    color: '#7b89a4',
    fontSize: 12,
    fontWeight: 600,
  },
  agentRunOpenLink: {
    display: 'inline-flex',
    minHeight: 22,
    alignItems: 'center',
    gap: 4,
    padding: 0,
    border: 0,
    color: token.colorPrimary,
    cursor: 'pointer',
    background: 'transparent',
    fontSize: 12,
    lineHeight: '20px',
    textDecoration: 'none',

    '&:hover, &:focus-visible': {
      color: token.colorPrimaryHover,
      textDecoration: 'none',
    },
  },
  agentReason: {
    overflowWrap: 'anywhere',
  },
  agentToolSummary: {
    display: 'grid',
    minWidth: 0,
    gridTemplateColumns: 'minmax(0, 1fr) 24px',
    gap: 6,
    alignItems: 'start',
  },
  agentToolList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    minWidth: 0,
    overflow: 'hidden',
  },
  agentToolListCollapsed: {
    maxHeight: 24,
  },
  agentToolToggle: {
    width: 24,
    height: 22,
    minWidth: 24,
    padding: 0,
    color: '#7b89a4',
    transition: 'background-color 0.2s ease, color 0.2s ease',

    '&:hover, &:focus-visible': {
      color: token.colorPrimary,
      background: token.colorPrimaryBg,
    },

    '.ant-btn-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
    },
  },
  agentEvidenceSummary: {
    display: 'grid',
    minWidth: 0,
    gridTemplateColumns: 'minmax(0, 1fr) 24px',
    gap: 6,
    alignItems: 'start',
  },
  agentEvidenceSummaryOpen: {
    gridTemplateColumns: 'minmax(0, 1fr)',
  },
  agentEvidenceList: {
    display: 'grid',
    gap: 6,
    minWidth: 0,
    overflow: 'hidden',
  },
  agentEvidenceListCollapsed: {
    maxHeight: 22,

    '.anticon + span': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
  agentEvidenceItem: {
    display: 'flex',
    minHeight: 22,
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
    color: '#60708d',
    lineHeight: '20px',

    '.anticon': {
      display: 'inline-flex',
      flex: '0 0 auto',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#7b89a4',
      fontSize: 13,
      lineHeight: 1,
    },

    '& > span': {
      minWidth: 0,
      lineHeight: '20px',
      overflowWrap: 'anywhere',
    },
  },
  agentError: {
    color: token.colorError,
    overflowWrap: 'anywhere',
  },
  agentFeedback: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 2,
  },
  agentFeedbackText: {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    gap: 6,
    color: '#60708d',
    fontSize: 12,
  },
  agentFeedbackActions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  agentFeedbackButton: {
    minWidth: 70,
    borderRadius: 8,
  },
  agentFeedbackReadonly: {
    position: 'absolute',
    top: 0,
    right: 0,
    display: 'inline-flex',
  },
  agentFeedbackReadonlyIcon: {
    display: 'inline-flex',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    fontSize: 15,
    lineHeight: 1,
  },
  agentFeedbackModalBody: {
    display: 'grid',
    gap: 10,
  },
  agentFeedbackInput: {
    marginBottom: 16,
  },
  userInputCard: {
    display: 'flex',
    minHeight: 45,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '5px 12px 5px 16px',
    border: '1px solid #dfe6f2',
    borderRadius: 14,
    color: '#18214f',
    background: '#f8faff',
    boxShadow: '0 10px 24px rgba(71, 83, 111, 0.08)',
    fontSize: 13,
    lineHeight: 1.6,

    '& > span': {
      minWidth: 0,
      overflowWrap: 'anywhere',
    },
  },
  editButton: {
    width: 32,
    height: 32,
    minWidth: 32,
    color: '#1f2c5b',
    borderRadius: 8,
  },
  composer: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: 8,
    width: '100%',
    maxWidth: 860,
    boxSizing: 'border-box',
    margin: '0 auto',
    padding: '16px 40px 16px',

    '@media (max-width: 768px)': {
      padding: '0 16px 16px',
    },
  },
  agentModePrefix: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 6,
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    marginLeft: 6,
    borderRight: `1px solid ${token.colorBorderSecondary}`,
  },
  agentModeSelect: {
    width: 140,
    minWidth: 0,

    '.ant-select-selector': {
      paddingInline: '8px 10px',
      color: token.colorText,
      background: 'transparent',
      boxShadow: 'none',
    },

    '.ant-select-arrow': {
      color: token.colorTextTertiary,
      fontSize: 10,
    },
  },
  composerRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 96px',
    gap: 12,
    alignItems: 'end',

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: 10,
    },
  },
  promptInputShell: {
    position: 'relative',
    minHeight: 44,
    border: `1px solid ${token.colorBorder}`,
    borderRadius: 22,
    background: token.colorBgContainer,
    transition:
      'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',

    '&:hover': {
      borderColor: token.colorPrimaryBorderHover,
    },

    '&:focus-within': {
      borderColor: token.colorPrimary,
      boxShadow: `0 0 0 2px ${token.colorPrimaryBg}`,
    },
  },
  promptInput: {
    minHeight: 42,
    padding: '10px 16px 10px 168px',
    resize: 'none',
    border: 0,
    borderRadius: 22,
    color: '#1f2c5b',
    boxShadow: 'none',
    fontSize: 13,
    lineHeight: 1.5,
    background: 'transparent',

    '&:hover, &:focus': {
      border: 0,
      boxShadow: 'none',
      background: 'transparent',
    },

    '@media (max-width: 768px)': {
      paddingLeft: 164,
    },
  },
  agentScopeButton: {
    justifySelf: 'start',
    maxWidth: '100%',
    height: 28,
    minWidth: 0,
    paddingInline: 10,
    borderRadius: 999,
    fontSize: 12,

    '.ant-btn-icon': {
      display: 'inline-flex',
      fontSize: 13,
    },

    '> span:not(.ant-btn-icon)': {
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
  agentScopeOverlay: {
    '.ant-popover-inner': {
      padding: 12,
    },
  },
  agentScopePopover: {
    display: 'grid',
    width: 280,
    gap: 10,
  },
  agentScopeField: {
    display: 'grid',
    gap: 4,
    color: token.colorTextSecondary,
    fontSize: 12,
    lineHeight: 1.4,
  },
  agentScopeActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
  submitButton: {
    width: 96,
    minHeight: 44,
    border: 0,
    borderRadius: 999,
    background: 'linear-gradient(90deg, #4f2ce6 0%, #8d63ff 100%)',
    boxShadow: '0 12px 24px rgba(81, 43, 220, 0.28)',
    fontWeight: 600,
  },
}));
