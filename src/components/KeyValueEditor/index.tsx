import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  editor: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 576px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  input: {
    minWidth: 0,

    '&.ant-input': {
      backgroundColor: token.colorBgContainer,
    },
  },
  valueInput: {
    '@media (max-width: 576px)': {
      gridColumn: '1 / -1',
      gridRow: 2,
    },
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginTop: token.marginMD,
  },
}));

type KeyValueEditorItem = {
  id: string;
  keyName: string;
  value: string;
};

type KeyValueEditorProps = {
  addText?: string;
  deleteAriaLabel?: string;
  keyPlaceholder?: string;
  value?: KeyValueEditorItem[];
  valuePlaceholder?: string;
  onAddBlocked?: () => void;
  onChange?: (value: KeyValueEditorItem[]) => void;
  onCreateItem: () => KeyValueEditorItem;
};

const KeyValueEditor = ({
  addText = '添加',
  deleteAriaLabel = '删除',
  keyPlaceholder = 'Key',
  value = [],
  valuePlaceholder = '值',
  onAddBlocked,
  onChange,
  onCreateItem,
}: KeyValueEditorProps) => {
  const { styles } = useStyles();

  const updateItem = (
    id: string,
    field: 'keyName' | 'value',
    nextValue: string,
  ) => {
    onChange?.(
      value.map((item) =>
        item.id === id ? { ...item, [field]: nextValue } : item,
      ),
    );
  };

  const addItem = () => {
    if (value.some((item) => !item.keyName.trim())) {
      onAddBlocked?.();
      return;
    }

    onChange?.([...value, onCreateItem()]);
  };

  const deleteItem = (id: string) => {
    onChange?.(value.filter((item) => item.id !== id));
  };

  return (
    <>
      <div className={styles.editor}>
        {value.map((item) => (
          <div className={styles.row} key={item.id}>
            <Input
              className={styles.input}
              placeholder={keyPlaceholder}
              value={item.keyName}
              onChange={(event) =>
                updateItem(item.id, 'keyName', event.target.value)
              }
            />
            <Input
              className={[styles.input, styles.valueInput].join(' ')}
              placeholder={valuePlaceholder}
              value={item.value}
              onChange={(event) =>
                updateItem(item.id, 'value', event.target.value)
              }
            />
            <Button
              aria-label={deleteAriaLabel}
              className={styles.deleteButton}
              icon={<DeleteOutlined />}
              type="text"
              onClick={() => deleteItem(item.id)}
            />
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <Button onClick={addItem}>
          <PlusOutlined />
          {addText}
        </Button>
      </div>
    </>
  );
};

export type { KeyValueEditorItem, KeyValueEditorProps };
export default KeyValueEditor;
