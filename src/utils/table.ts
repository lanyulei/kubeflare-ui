import type { TableProps } from 'antd';
import type { Key } from 'react';

export const TABLE_COLUMN_WIDTH = {
  xs: 96,
  sm: 120,
  md: 160,
  lg: 220,
  xl: 280,
  time: 180,
  option: 160,
} as const;

const DEFAULT_TABLE_MIN_SCROLL_X = 960;

type ColumnWidth = number | string;
export type ComfortableTableColumn = {
  children?: ComfortableTableColumn[];
  dataIndex?: unknown;
  hideInTable?: boolean;
  key?: Key;
  title?: unknown;
  valueType?: unknown;
  width?: ColumnWidth;
};

type ComfortableTableScrollOptions = {
  minScrollX?: number;
};

const stringifyColumnValue = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(stringifyColumnValue).join('.');
  }

  return '';
};

const getColumnIdentity = (column: ComfortableTableColumn) =>
  [
    stringifyColumnValue(column.title),
    stringifyColumnValue(column.dataIndex),
    stringifyColumnValue(column.key),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const includesAny = (value: string, keywords: string[]) =>
  keywords.some((keyword) => value.includes(keyword.toLowerCase()));

const getDefaultColumnWidth = (column: ComfortableTableColumn) => {
  const identity = getColumnIdentity(column);
  const valueType = stringifyColumnValue(column.valueType).toLowerCase();

  if (column.hideInTable) {
    return undefined;
  }

  if (
    valueType === 'option' ||
    includesAny(identity, ['操作', 'option', 'action'])
  ) {
    return TABLE_COLUMN_WIDTH.option;
  }

  if (
    includesAny(identity, [
      'created_at',
      'updated_at',
      'create_time',
      'update_time',
      'started_at',
      'completed_at',
      'collected_at',
      'event_time',
      '时间',
      '日期',
    ])
  ) {
    return TABLE_COLUMN_WIDTH.time;
  }

  if (includesAny(identity, ['状态', 'status', 'risk', '风险', '健康'])) {
    return TABLE_COLUMN_WIDTH.sm;
  }

  if (
    includesAny(identity, [
      '数量',
      '副本',
      '端点',
      '规则数',
      '绑定数',
      'count',
      'replica',
      'enabled',
      'available',
    ])
  ) {
    return TABLE_COLUMN_WIDTH.sm;
  }

  if (includesAny(identity, ['版本', 'version'])) {
    return TABLE_COLUMN_WIDTH.sm;
  }

  if (includesAny(identity, ['命名空间', 'namespace', '项目'])) {
    return TABLE_COLUMN_WIDTH.md;
  }

  if (
    includesAny(identity, [
      'agent',
      '类型',
      '分类',
      '供应商',
      'provider',
      'transport',
      'category',
      'controller',
    ])
  ) {
    return TABLE_COLUMN_WIDTH.md;
  }

  if (includesAny(identity, ['run', '名称', 'name', 'id'])) {
    return TABLE_COLUMN_WIDTH.lg;
  }

  if (
    includesAny(identity, [
      '消息',
      '摘要',
      '描述',
      '原因',
      '输入',
      '错误',
      '问题',
      '症状',
      '根因',
      '选择器',
      '参数',
      'message',
      'summary',
      'description',
      'reason',
      'input',
      'error',
      'question',
      'selector',
      'parameters',
    ])
  ) {
    return TABLE_COLUMN_WIDTH.xl;
  }

  if (
    includesAny(identity, [
      '标签',
      '能力',
      '工具',
      '指标',
      '主体',
      '角色',
      'tag',
      'tool',
      'metric',
      'subject',
      'role',
    ])
  ) {
    return TABLE_COLUMN_WIDTH.lg;
  }

  return TABLE_COLUMN_WIDTH.md;
};

const getNumericColumnWidth = (column: ComfortableTableColumn): number => {
  if (column.hideInTable) {
    return 0;
  }

  if (column.children?.length) {
    return column.children.reduce(
      (total, child) => total + getNumericColumnWidth(child),
      0,
    );
  }

  return typeof column.width === 'number' ? column.width : 0;
};

export const withComfortableTableColumns = <C extends ComfortableTableColumn>(
  columns: C[],
): C[] =>
  columns.map((column) => {
    const columnLike = column as ComfortableTableColumn;
    const children = columnLike.children?.length
      ? withComfortableTableColumns(columnLike.children)
      : undefined;
    const width = columnLike.width ?? getDefaultColumnWidth(columnLike);

    if (!children && columnLike.width !== undefined) {
      return column;
    }

    return {
      ...column,
      ...(children ? { children } : {}),
      ...(width !== undefined ? { width } : {}),
    } as C;
  });

export const getComfortableTableScroll = (
  columns: ComfortableTableColumn[],
  scroll?: TableProps<any>['scroll'],
  options?: ComfortableTableScrollOptions,
): TableProps<any>['scroll'] => {
  const totalWidth = columns.reduce(
    (total, column) =>
      total + getNumericColumnWidth(column as ComfortableTableColumn),
    0,
  );
  const minScrollX = options?.minScrollX ?? DEFAULT_TABLE_MIN_SCROLL_X;
  const comfortableScrollX = totalWidth
    ? Math.max(totalWidth, minScrollX)
    : 'max-content';

  if (scroll?.x !== undefined) {
    return {
      ...scroll,
      x:
        typeof scroll.x === 'number' && typeof comfortableScrollX === 'number'
          ? Math.max(scroll.x, comfortableScrollX)
          : scroll.x,
    };
  }

  return {
    ...scroll,
    x: comfortableScrollX,
  };
};
