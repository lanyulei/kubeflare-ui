import { Form, Typography } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';
import UnitInputNumber from '../UnitInputNumber';
import { createLessThanFieldValidator } from './validation';

const useStyles = createStyles(({ token }) => ({
  fields: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginLG,

    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  group: {
    minWidth: 0,
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginXS,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '72px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginXS,
  },
  label: {
    color: token.colorTextSecondary,
    lineHeight: token.lineHeight,
    whiteSpace: 'nowrap',
  },
  formItem: {
    marginBottom: 0,
  },
}));

type QuotaFieldConfig = {
  label: string;
  name: NamePath;
  placeholder?: string;
  lessThanField?: NamePath;
  lessThanMessage?: string;
};

type ComputeQuotaFieldsProps = {
  cpuFields: QuotaFieldConfig[];
  cpuUnit?: string;
  memoryFields: QuotaFieldConfig[];
  memoryUnit?: string;
};

const ComputeQuotaFields = ({
  cpuFields,
  cpuUnit = 'Core',
  memoryFields,
  memoryUnit = 'Mi',
}: ComputeQuotaFieldsProps) => {
  const { styles } = useStyles();

  const renderFields = (fields: QuotaFieldConfig[], unit: string) =>
    fields.map((field) => {
      const rules =
        field.lessThanField && field.lessThanMessage
          ? [
              ({
                getFieldValue,
              }: {
                getFieldValue: (name: NamePath) => unknown;
              }) => ({
                validator: createLessThanFieldValidator(
                  getFieldValue,
                  field.lessThanField as NamePath,
                  field.lessThanMessage as string,
                ),
              }),
            ]
          : undefined;

      return (
        <div className={styles.row} key={field.label}>
          <Typography.Text className={styles.label}>
            {field.label}
          </Typography.Text>
          <Form.Item
            className={styles.formItem}
            dependencies={
              field.lessThanField ? [field.lessThanField] : undefined
            }
            name={field.name}
            rules={rules}
          >
            <UnitInputNumber
              min={0}
              placeholder={field.placeholder}
              precision={unit === 'Core' ? 3 : 0}
              style={{ width: '100%' }}
              unit={unit}
            />
          </Form.Item>
        </div>
      );
    });

  return (
    <div className={styles.fields}>
      <div className={styles.group}>
        <div className={styles.rows}>{renderFields(cpuFields, cpuUnit)}</div>
      </div>
      <div className={styles.group}>
        <div className={styles.rows}>
          {renderFields(memoryFields, memoryUnit)}
        </div>
      </div>
    </div>
  );
};

export type { ComputeQuotaFieldsProps, QuotaFieldConfig };
export default ComputeQuotaFields;
