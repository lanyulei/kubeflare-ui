import { Form, InputNumber, Typography } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  fields: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: token.marginXL,

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
    gap: token.marginSM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '72px minmax(0, 1fr)',
    alignItems: 'center',
    gap: token.marginSM,
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
    fields.map((field) => (
      <div className={styles.row} key={field.label}>
        <Typography.Text className={styles.label}>
          {field.label}
        </Typography.Text>
        <Form.Item className={styles.formItem} name={field.name}>
          <InputNumber
            addonAfter={unit}
            min={0}
            placeholder={field.placeholder}
            precision={unit === 'Core' ? 3 : 0}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </div>
    ));

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
