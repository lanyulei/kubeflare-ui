import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, InputNumber, Select } from 'antd';
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
    width: '100%',

    '.ant-select-selector, &.ant-input-number': {
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
    marginTop: 8,
  },
}));

type SelectValueEditorOption = {
  label: string;
  value: string;
};

type SelectValueEditorItem = {
  id: string;
  keyName?: string;
  value?: number | null;
};

type SelectValueEditorProps = {
  addText?: string;
  deleteAriaLabel?: string;
  keyPlaceholder?: string;
  options: SelectValueEditorOption[];
  value?: SelectValueEditorItem[];
  valuePlaceholder?: string;
  onAddBlocked?: () => void;
  onChange?: (value: SelectValueEditorItem[]) => void;
  onCreateItem: () => SelectValueEditorItem;
};

const SelectValueEditor = ({
  addText = '添加',
  deleteAriaLabel = '删除',
  keyPlaceholder = '请选择',
  options,
  value = [],
  valuePlaceholder = '值',
  onAddBlocked,
  onChange,
  onCreateItem,
}: SelectValueEditorProps) => {
  const { styles } = useStyles();

  const selectedKeys = value
    .map((item) => item.keyName)
    .filter(Boolean) as string[];

  const updateItem = (
    id: string,
    field: 'keyName' | 'value',
    nextValue?: string | number | null,
  ) => {
    onChange?.(
      value.map((item) =>
        item.id === id ? { ...item, [field]: nextValue } : item,
      ),
    );
  };

  const addItem = () => {
    if (value.some((item) => !item.keyName)) {
      onAddBlocked?.();
      return;
    }
    if (selectedKeys.length >= options.length) {
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
            <Select
              className={styles.input}
              options={options.map((option) => ({
                ...option,
                disabled:
                  option.value !== item.keyName &&
                  selectedKeys.includes(option.value),
              }))}
              placeholder={keyPlaceholder}
              value={item.keyName}
              onChange={(nextValue) =>
                updateItem(item.id, 'keyName', nextValue)
              }
            />
            <InputNumber
              className={[styles.input, styles.valueInput].join(' ')}
              min={0}
              placeholder={valuePlaceholder}
              precision={0}
              value={item.value}
              onChange={(nextValue) => updateItem(item.id, 'value', nextValue)}
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

export type {
  SelectValueEditorItem,
  SelectValueEditorOption,
  SelectValueEditorProps,
};
export default SelectValueEditor;
