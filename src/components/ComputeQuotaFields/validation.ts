import type { NamePath } from 'antd/es/form/interface';

type GetFieldValue = (name: NamePath) => unknown;

const hasQuotaValue = (value: unknown) =>
  value !== undefined && value !== null && value !== '';

const toQuotaNumber = (value: unknown) =>
  typeof value === 'number' ? value : Number(value);

export const createLessThanFieldValidator =
  (getFieldValue: GetFieldValue, targetName: NamePath, message: string) =>
  async (_: unknown, value: unknown) => {
    const targetValue = getFieldValue(targetName);

    if (!hasQuotaValue(value) || !hasQuotaValue(targetValue)) {
      return;
    }

    if (toQuotaNumber(value) < toQuotaNumber(targetValue)) {
      return;
    }

    throw new Error(message);
  };
