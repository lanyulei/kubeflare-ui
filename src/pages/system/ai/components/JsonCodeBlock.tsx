import { Empty } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  code: {
    maxHeight: 360,
    margin: 0,
    padding: token.paddingMD,
    overflow: 'auto',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadius,
    background: token.colorFillQuaternary,
    color: token.colorText,
    fontSize: token.fontSizeSM,
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
}));

type JsonCodeBlockProps = {
  value?: string;
};

const JsonCodeBlock = ({ value }: JsonCodeBlockProps) => {
  const { styles } = useStyles();
  const content = value?.trim();

  if (!content) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return <pre className={styles.code}>{content}</pre>;
};

export default JsonCodeBlock;
