import { Empty, Tooltip } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginXS,
  },
  label: {
    overflow: 'hidden',
    color: token.colorText,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  value: {
    minHeight: 46,
    padding: `${token.paddingSM}px ${token.padding}px`,
    border: '1px solid #f0f0f0',
    borderRadius: token.borderRadiusSM,
    background: '#f9f9f9',
    color: 'rgba(0,0,0,0.65)',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}));

type ResourceDataItem = {
  key: string;
  value?: string;
};

type ResourceDataFieldsProps = {
  emptyText?: string;
  items?: ResourceDataItem[];
};

const ResourceDataFields = ({
  emptyText = '暂无数据',
  items = [],
}: ResourceDataFieldsProps) => {
  const { styles } = useStyles();

  if (items.length === 0) {
    return <Empty description={emptyText} />;
  }

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <div className={styles.item} key={item.key}>
          <Tooltip title={item.key} placement="topLeft">
            <div className={styles.label}>{item.key}</div>
          </Tooltip>
          <div className={styles.value}>{item.value || ''}</div>
        </div>
      ))}
    </div>
  );
};

export type { ResourceDataFieldsProps, ResourceDataItem };
export default ResourceDataFields;
