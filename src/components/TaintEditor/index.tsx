import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Select, Tooltip } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  editor: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns:
      'minmax(0, 1fr) minmax(0, 1fr) minmax(180px, 240px) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    backgroundColor: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
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
    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      gridRow: 2,
    },
  },
  effectSelect: {
    minWidth: 0,

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
      gridRow: 3,
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
  option: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  optionDescription: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeightSM,
    whiteSpace: 'normal',
  },
}));

type TaintEffect = 'NoExecute' | 'NoSchedule' | 'PreferNoSchedule';

type TaintEditorItem = {
  effect: TaintEffect;
  id: string;
  keyName: string;
  value: string;
};

type TaintEffectOption = {
  description: string;
  label: string;
  value: TaintEffect;
};

type TaintEditorProps = {
  addText?: string;
  deleteAriaLabel?: string;
  effectOptions: TaintEffectOption[];
  keyPlaceholder?: string;
  value?: TaintEditorItem[];
  valuePlaceholder?: string;
  onAddBlocked?: () => void;
  onChange?: (value: TaintEditorItem[]) => void;
  onCreateItem: () => TaintEditorItem;
};

const TaintEditor = ({
  addText = '添加',
  deleteAriaLabel = '删除',
  effectOptions,
  keyPlaceholder = 'Key',
  value = [],
  valuePlaceholder = '值',
  onAddBlocked,
  onChange,
  onCreateItem,
}: TaintEditorProps) => {
  const { styles } = useStyles();

  const updateItem = (
    id: string,
    field: 'effect' | 'keyName' | 'value',
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
        {value.map((item) => {
          const selectedEffect = effectOptions.find(
            (option) => option.value === item.effect,
          );

          return (
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
              <Tooltip title={selectedEffect?.description} placement="top">
                <Select<TaintEffect>
                  className={styles.effectSelect}
                  value={item.effect}
                  options={effectOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  optionRender={(option) => {
                    const effect = effectOptions.find(
                      (item) => item.value === option.value,
                    );

                    return (
                      <div className={styles.option}>
                        <span>{effect?.label}</span>
                        <span className={styles.optionDescription}>
                          {effect?.description}
                        </span>
                      </div>
                    );
                  }}
                  onChange={(nextValue) =>
                    updateItem(item.id, 'effect', nextValue)
                  }
                />
              </Tooltip>
              <Button
                aria-label={deleteAriaLabel}
                className={styles.deleteButton}
                icon={<DeleteOutlined />}
                type="text"
                onClick={() => deleteItem(item.id)}
              />
            </div>
          );
        })}
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
  TaintEditorItem,
  TaintEditorProps,
  TaintEffect,
  TaintEffectOption,
};
export default TaintEditor;
