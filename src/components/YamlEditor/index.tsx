import { yaml } from '@codemirror/lang-yaml'
import CodeMirror from '@uiw/react-codemirror'
import { Typography } from 'antd'
import { createStyles } from 'antd-style'
import React from 'react'

const useStyles = createStyles(({ token }) => ({
  editor: {
    border: `1px solid ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    overflow: 'hidden',
    background: token.colorBgContainer,

    '&:focus-within': {
      borderColor: token.colorPrimary,
      boxShadow: `0 0 0 2px ${token.colorPrimaryBg}`,
    },

    '.cm-editor': {
      fontSize: token.fontSize,
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },

    '.cm-scroller': {
      lineHeight: 1.65,
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
  },
}))

type YamlEditorProps = {
  value?: string
  onChange?: (value: string) => void
  readOnly?: boolean
  minHeight?: number
  maxHeight?: number
  placeholder?: string
}

const YamlEditor: React.FC<YamlEditorProps> = ({
  value = '',
  onChange,
  readOnly = false,
  minHeight = 280,
  maxHeight = 520,
  placeholder,
}) => {
  const { styles, cx } = useStyles()
  const lineCount = value ? value.split(/\r\n|\r|\n/).length : 1

  return (
    <div className={cx(styles.editor, readOnly && styles.readOnly)}>
      <CodeMirror
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
        extensions={[yaml()]}
        height={`${minHeight}px`}
        maxHeight={`${maxHeight}px`}
        placeholder={placeholder}
        onChange={(nextValue) => onChange?.(nextValue)}
      />
      <div className={styles.meta}>
        <Typography.Text type="secondary">YAML</Typography.Text>
        <Typography.Text type="secondary">{lineCount} 行</Typography.Text>
      </div>
    </div>
  )
}

export default YamlEditor
