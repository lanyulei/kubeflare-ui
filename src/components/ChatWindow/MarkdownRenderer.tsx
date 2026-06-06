import type { ReactNode } from 'react';
import { useStyles } from './styles';

type MarkdownBlock =
  | {
      content: string;
      language?: string;
      type: 'code';
    }
  | {
      content: string;
      level: 1 | 2 | 3 | 4;
      type: 'heading';
    }
  | {
      items: string[];
      type: 'ordered-list' | 'unordered-list';
    }
  | {
      lines: string[];
      type: 'blockquote' | 'paragraph';
    };

const CODE_FENCE_REGEXP = /^```([a-z0-9_-]+)?\s*$/i;
const HEADING_REGEXP = /^(#{1,4})\s+(.+)$/;
const ORDERED_LIST_REGEXP = /^\d+[.)]\s+(.+)$/;
const UNORDERED_LIST_REGEXP = /^[-*+]\s+(.+)$/;

const isBlockStart = (line: string) =>
  CODE_FENCE_REGEXP.test(line) ||
  HEADING_REGEXP.test(line) ||
  line.startsWith('>') ||
  ORDERED_LIST_REGEXP.test(line) ||
  UNORDERED_LIST_REGEXP.test(line);

const isSafeHref = (href: string) =>
  href.startsWith('#') ||
  (href.startsWith('/') && !href.startsWith('//')) ||
  /^https?:\/\//i.test(href) ||
  /^mailto:/i.test(href);

const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

const parseMarkdown = (markdown: string) => {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    const codeFenceMatch = trimmedLine.match(CODE_FENCE_REGEXP);
    if (codeFenceMatch) {
      index += 1;
      const codeLines: string[] = [];

      while (
        index < lines.length &&
        !CODE_FENCE_REGEXP.test(lines[index].trim())
      ) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        content: codeLines.join('\n'),
        language: codeFenceMatch[1],
        type: 'code',
      });
      continue;
    }

    const headingMatch = trimmedLine.match(HEADING_REGEXP);
    if (headingMatch) {
      blocks.push({
        content: headingMatch[2],
        level: headingMatch[1].length as 1 | 2 | 3 | 4,
        type: 'heading',
      });
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith('>')) {
      const linesInQuote: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith('>')) {
        linesInQuote.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }

      blocks.push({
        lines: linesInQuote,
        type: 'blockquote',
      });
      continue;
    }

    const unorderedListMatch = trimmedLine.match(UNORDERED_LIST_REGEXP);
    if (unorderedListMatch) {
      const items: string[] = [];

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(UNORDERED_LIST_REGEXP);
        if (!itemMatch) {
          break;
        }

        items.push(itemMatch[1]);
        index += 1;
      }

      blocks.push({
        items,
        type: 'unordered-list',
      });
      continue;
    }

    const orderedListMatch = trimmedLine.match(ORDERED_LIST_REGEXP);
    if (orderedListMatch) {
      const items: string[] = [];

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(ORDERED_LIST_REGEXP);
        if (!itemMatch) {
          break;
        }

        items.push(itemMatch[1]);
        index += 1;
      }

      blocks.push({
        items,
        type: 'ordered-list',
      });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const paragraphLine = lines[index].trim();

      if (!paragraphLine) {
        break;
      }

      if (paragraphLines.length > 0 && isBlockStart(paragraphLine)) {
        break;
      }

      paragraphLines.push(paragraphLine);
      index += 1;
    }

    blocks.push({
      lines: paragraphLines,
      type: 'paragraph',
    });
  }

  return blocks;
};

const renderInlineMarkdown = (
  text: string,
  keyPrefix: string,
  inlineCodeClassName: string,
  linkClassName: string,
): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const tokenRegexp = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match = tokenRegexp.exec(text);

  while (match) {
    const token = match[0];

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const key = `${keyPrefix}-${match.index}`;

    if (token.startsWith('`')) {
      nodes.push(
        <code className={inlineCodeClassName} key={key}>
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={key}>
          {renderInlineMarkdown(
            token.slice(2, -2),
            key,
            inlineCodeClassName,
            linkClassName,
          )}
        </strong>,
      );
    } else if (token.startsWith('*')) {
      nodes.push(
        <em key={key}>
          {renderInlineMarkdown(
            token.slice(1, -1),
            key,
            inlineCodeClassName,
            linkClassName,
          )}
        </em>,
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch && isSafeHref(linkMatch[2])) {
        nodes.push(
          <a
            className={linkClassName}
            href={linkMatch[2]}
            key={key}
            rel="noreferrer"
            target={isExternalHref(linkMatch[2]) ? '_blank' : undefined}
          >
            {renderInlineMarkdown(
              linkMatch[1],
              key,
              inlineCodeClassName,
              linkClassName,
            )}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }

    lastIndex = match.index + token.length;
    match = tokenRegexp.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

type MarkdownRendererProps = {
  content: string;
};

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const { styles } = useStyles();
  const blocks = parseMarkdown(content);

  return (
    <div className={styles.markdown}>
      {blocks.map((block, index) => {
        const key = `markdown-block-${index}`;

        if (block.type === 'heading') {
          const headingContent = renderInlineMarkdown(
            block.content,
            key,
            styles.markdownInlineCode,
            styles.markdownLink,
          );

          if (block.level === 1) {
            return (
              <h1 className={styles.markdownHeading} key={key}>
                {headingContent}
              </h1>
            );
          }

          if (block.level === 2) {
            return (
              <h2 className={styles.markdownHeading} key={key}>
                {headingContent}
              </h2>
            );
          }

          if (block.level === 3) {
            return (
              <h3 className={styles.markdownHeading} key={key}>
                {headingContent}
              </h3>
            );
          }

          return (
            <h4 className={styles.markdownHeading} key={key}>
              {headingContent}
            </h4>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p className={styles.markdownParagraph} key={key}>
              {renderInlineMarkdown(
                block.lines.join(' '),
                key,
                styles.markdownInlineCode,
                styles.markdownLink,
              )}
            </p>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote className={styles.markdownBlockquote} key={key}>
              {renderInlineMarkdown(
                block.lines.join(' '),
                key,
                styles.markdownInlineCode,
                styles.markdownLink,
              )}
            </blockquote>
          );
        }

        if (block.type === 'code') {
          return (
            <pre className={styles.markdownCodeBlock} key={key}>
              <code>{block.content}</code>
            </pre>
          );
        }

        if (block.type !== 'ordered-list' && block.type !== 'unordered-list') {
          return null;
        }

        const ListTag = block.type === 'ordered-list' ? 'ol' : 'ul';

        return (
          <ListTag className={styles.markdownList} key={key}>
            {block.items.map((item) => (
              <li key={`${key}-${item}`}>
                {renderInlineMarkdown(
                  item,
                  `${key}-${item}`,
                  styles.markdownInlineCode,
                  styles.markdownLink,
                )}
              </li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
};

export default MarkdownRenderer;
