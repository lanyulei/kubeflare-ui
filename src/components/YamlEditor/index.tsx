import { yaml } from '@codemirror/lang-yaml';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { Typography } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token }) => ({
  editor: {
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    overflow: 'hidden',
    background: token.colorBgContainer,

    '&:focus-within': {
      borderColor: token.colorPrimary,
      boxShadow: `0 0 0 2px ${token.colorPrimaryBg}`,
    },

    '.cm-editor': {
      flex: 1,
      minHeight: 0,
      fontSize: token.fontSize,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },

    '.cm-scroller': {
      lineHeight: 1.65,
      overflow: 'auto',
    },

    '.cm-gutters': {
      borderRight: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorFillQuaternary,
      color: token.colorTextQuaternary,
    },

    '.cm-activeLineGutter, .cm-activeLine': {
      background: token.colorFillTertiary,
    },

    '.cm-content': {
      padding: `${token.paddingXS}px 0`,
    },

    '.cm-line': {
      padding: `0 ${token.paddingSM}px`,
    },

    '.cm-placeholder': {
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
    },
  },
  codeMirror: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
  readOnly: {
    '.cm-cursor': {
      display: 'none',
    },
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${token.paddingXXS}px ${token.paddingSM}px`,
    borderTop: `1px solid ${token.colorBorderSecondary}`,
    color: token.colorTextTertiary,
    background: token.colorFillQuaternary,
    flexShrink: 0,
  },
}));

type YamlEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  placeholder?: string;
};

const getCssSize = (value: number | string) =>
  typeof value === 'number' ? `${value}px` : value;

const YamlEditor: React.FC<YamlEditorProps> = ({
  value = '',
  onChange,
  readOnly = false,
  height,
  minHeight = 280,
  maxHeight = 520,
  placeholder,
}) => {
  const { styles, cx } = useStyles();
  const lineCount = value ? value.split(/\r\n|\r|\n/).length : 1;
  const editorStyle: React.CSSProperties = height
    ? { height: getCssSize(height) }
    : {
        minHeight: getCssSize(minHeight),
        maxHeight: getCssSize(maxHeight),
      };

  return (
    <div
      className={cx(styles.editor, readOnly && styles.readOnly)}
      style={editorStyle}
    >
      <CodeMirror
        className={styles.codeMirror}
        value={value}
        basicSetup={{
          bracketMatching: true,
          foldGutter: true,
          highlightActiveLine: !readOnly,
          highlightActiveLineGutter: !readOnly,
          lineNumbers: true,
        }}
        editable={!readOnly}
        readOnly={readOnly}
        extensions={[yaml(), EditorView.lineWrapping]}
        height="100%"
        placeholder={placeholder}
        onChange={(nextValue) => onChange?.(nextValue)}
      />
      <div className={styles.meta}>
        <Typography.Text type="secondary">YAML</Typography.Text>
        <Typography.Text type="secondary">{lineCount} 行</Typography.Text>
      </div>
    </div>
  );
};

export default YamlEditor;
