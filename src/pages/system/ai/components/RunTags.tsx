import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
import type { ReactNode } from 'react';

const RUN_STATUS_META: Record<
  string,
  { color?: string; icon?: ReactNode; text: string }
> = {
  cancelled: { color: 'default', icon: <StopOutlined />, text: '已取消' },
  completed: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    text: '已完成',
  },
  failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
  pending: {
    color: 'processing',
    icon: <PauseCircleOutlined />,
    text: '等待中',
  },
  running: { color: 'processing', icon: <LoadingOutlined />, text: '运行中' },
};

export const AgentRunStatusTag = ({ status }: { status?: string }) => {
  const meta = RUN_STATUS_META[status || ''] || {
    color: 'default',
    text: status || '-',
  };

  return (
    <Tag color={meta.color} icon={meta.icon}>
      {meta.text}
    </Tag>
  );
};

export const RouteSourceTag = ({ value }: { value?: string }) => {
  const color =
    value === 'user' ? 'green' : value === 'llm' ? 'purple' : 'default';
  const text =
    value === 'user'
      ? '用户指定'
      : value === 'llm'
        ? 'LLM 路由'
        : value === 'keyword'
          ? '关键词'
          : value || '-';

  return <Tag color={color}>{text}</Tag>;
};
