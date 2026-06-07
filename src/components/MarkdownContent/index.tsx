import { createStyles } from 'antd-style';
import classNames from 'classnames';
import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown, {
  type Components,
  defaultUrlTransform,
  type ExtraProps,
} from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const useStyles = createStyles(({ token }) => ({
  root: {
    color: token.colorText,
    fontSize: 13,
    lineHeight: 1.7,
    overflowWrap: 'anywhere',

    'h1, h2, h3, h4, h5, h6': {
      margin: '0 0 10px',
      color: token.colorTextHeading,
      fontSize: 14,
      fontWeight: 600,
      lineHeight: 1.5,
    },

    'p, ul, ol, blockquote, pre': {
      marginTop: 0,
      marginBottom: 12,
    },

    '> :last-child': {
      marginBottom: 0,
    },

    ul: {
      paddingInlineStart: 20,
    },

    ol: {
      paddingInlineStart: 20,
    },

    li: {
      marginBottom: 4,
      paddingInlineStart: 2,
    },

    'li > p': {
      marginBottom: 4,
    },

    blockquote: {
      padding: '6px 10px',
      borderLeft: `3px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadius,
      color: token.colorTextSecondary,
      background: token.colorFillQuaternary,
    },

    hr: {
      height: 1,
      margin: '14px 0',
      border: 0,
      background: token.colorBorderSecondary,
    },

    pre: {
      padding: '10px 12px',
      overflowX: 'auto',
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadiusLG,
      color: token.colorText,
      background: token.colorFillQuaternary,
      fontSize: 12,
      lineHeight: 1.6,
    },

    'pre code': {
      padding: 0,
      color: 'inherit',
      background: 'transparent',
      fontSize: 'inherit',
      whiteSpace: 'pre',
    },

    ':not(pre) > code': {
      padding: '1px 5px',
      borderRadius: token.borderRadiusSM,
      color: token.colorPrimary,
      background: token.colorPrimaryBg,
      fontSize: 12,
      whiteSpace: 'break-spaces',
    },

    code: {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },

    a: {
      color: token.colorPrimary,
      textDecoration: 'none',

      '&:hover': {
        textDecoration: 'underline',
      },
    },

    'input[type="checkbox"]': {
      marginInlineEnd: 6,
    },
  },
  tableScroller: {
    width: '100%',
    margin: '0 0 12px',
    overflowX: 'auto',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgContainer,

    '&:last-child': {
      marginBottom: 0,
    },
  },
  table: {
    width: '100%',
    minWidth: 360,
    margin: 0,
    borderCollapse: 'collapse',
    fontSize: 12,
    lineHeight: 1.6,

    th: {
      padding: '8px 10px',
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
      color: token.colorTextHeading,
      background: token.colorFillQuaternary,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    },

    td: {
      padding: '8px 10px',
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      color: token.colorText,
      verticalAlign: 'top',
    },

    'tbody tr:first-child td': {
      borderTop: 0,
    },
  },
}));

type MarkdownContentProps = {
  className?: string;
  content: string;
};

const isExternalHref = (href?: string) => /^https?:\/\//i.test(href || '');

const omitMarkdownNode = <T extends ExtraProps>(props: T) => {
  const domProps = { ...props };
  delete domProps.node;
  return domProps;
};

const markdownComponents = (styles: ReturnType<typeof useStyles>['styles']) =>
  ({
    a: (props: ComponentPropsWithoutRef<'a'> & ExtraProps) => {
      const { href, ...anchorProps } = omitMarkdownNode(props);

      return (
        <a
          {...anchorProps}
          href={href}
          rel={isExternalHref(href) ? 'noreferrer' : undefined}
          target={isExternalHref(href) ? '_blank' : undefined}
        />
      );
    },
    table: (props: ComponentPropsWithoutRef<'table'> & ExtraProps) => {
      const { className, ...tableProps } = omitMarkdownNode(props);

      return (
        <div className={styles.tableScroller}>
          <table
            {...tableProps}
            className={classNames(styles.table, className)}
          />
        </div>
      );
    },
  }) satisfies Components;

const MarkdownContent = ({ className, content }: MarkdownContentProps) => {
  const { styles } = useStyles();

  return (
    <div className={classNames(styles.root, className)}>
      <ReactMarkdown
        components={markdownComponents(styles)}
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={defaultUrlTransform}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
