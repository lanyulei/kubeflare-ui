import type { TaintEffectOption } from '@/components/TaintEditor';

export const DEFAULT_PAGE_SIZE = 10;
export const EVENT_SEARCH_PAGE_SIZE = 500;

export const TAINT_EFFECT_OPTIONS: TaintEffectOption[] = [
  {
    value: 'NoSchedule',
    label: '阻止调度',
    description: '阻止容器组调度到节点。',
  },
  {
    value: 'PreferNoSchedule',
    label: '尽可能阻止调度',
    description: '尽可能阻止容器组调度到节点。',
  },
  {
    value: 'NoExecute',
    label: '阻止调度并驱逐现有容器组',
    description: '阻止容器组调度到节点并驱逐节点上现有的容器组。',
  },
];
