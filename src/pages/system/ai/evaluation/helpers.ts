export type AgentEvaluationFeatureKey =
  | 'planning'
  | 'reflection'
  | 'replan'
  | 'semantic_retrieval'
  | 'case_hit';

export type AgentEvaluationFeatureItem = {
  description: string;
  key: AgentEvaluationFeatureKey;
  title: string;
};

export const EVALUATION_WINDOW_OPTIONS = [
  { label: '7 天', value: 7 },
  { label: '30 天', value: 30 },
  { label: '90 天', value: 90 },
  { label: '180 天', value: 180 },
];

export const FEATURE_COMPARISON_ITEMS: AgentEvaluationFeatureItem[] = [
  {
    description: '评估生成计划后再执行时，对诊断质量和成本的影响。',
    key: 'planning',
    title: '计划生成',
  },
  {
    description: '评估反思校验对回答可用率、工具调用和耗时的影响。',
    key: 'reflection',
    title: '反思校验',
  },
  {
    description: '评估执行中动态重规划是否改善复杂问题处理效果。',
    key: 'replan',
    title: '动态重规划',
  },
  {
    description: '评估语义检索介入后，历史知识对诊断命中的帮助。',
    key: 'semantic_retrieval',
    title: '语义检索',
  },
  {
    description: '评估命中历史案例时，对反馈质量和资源消耗的影响。',
    key: 'case_hit',
    title: '案例命中',
  },
];

export const EMPTY_AGENT_FEATURE_BUCKET: API.AgentFeatureBucket = {
  avg_duration_ms: 0,
  avg_step_count: 0,
  avg_token_total: 0,
  avg_tool_call_count: 0,
  feedback_count: 0,
  run_count: 0,
  useful_count: 0,
};

const numberFormatter = new Intl.NumberFormat('zh-CN');
const decimalFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});
const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export const safeNumber = (value?: number) =>
  Number.isFinite(value) ? Number(value) : 0;

export const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, value));

export const getRatio = (numerator?: number, denominator?: number) => {
  const nextNumerator = safeNumber(numerator);
  const nextDenominator = safeNumber(denominator);

  if (nextDenominator <= 0) {
    return 0;
  }

  return nextNumerator / nextDenominator;
};

export const getUsefulRate = (bucket: API.AgentFeatureBucket) =>
  getRatio(bucket.useful_count, bucket.feedback_count);

export const getFeedbackRate = (bucket: API.AgentFeatureBucket) =>
  getRatio(bucket.feedback_count, bucket.run_count);

export const hasFeedback = (bucket: API.AgentFeatureBucket) =>
  safeNumber(bucket.feedback_count) > 0;

export const formatCount = (value?: number) =>
  numberFormatter.format(Math.round(safeNumber(value)));

export const formatAverage = (value?: number) =>
  decimalFormatter.format(safeNumber(value));

export const formatPercent = (ratio?: number) =>
  `${decimalFormatter.format(safeNumber(ratio) * 100)}%`;

export const formatPercentDelta = (ratio?: number) => {
  const value = safeNumber(ratio) * 100;
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${decimalFormatter.format(value)} 个百分点`;
};

export const formatDuration = (durationMs?: number) => {
  const value = safeNumber(durationMs);

  if (value >= 1000) {
    return `${decimalFormatter.format(value / 1000)} 秒`;
  }

  return `${numberFormatter.format(Math.round(value))} ms`;
};

export const formatSince = (value?: string) => {
  if (!value) {
    return '-';
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return dateTimeFormatter.format(timestamp);
};
