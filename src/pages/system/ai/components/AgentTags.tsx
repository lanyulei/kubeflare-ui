import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Space, Tag } from 'antd';
import {
  AGENT_TYPE_LABELS,
  TOOL_ORIGIN_LABELS,
  TOOL_SOURCE_LABELS,
} from '../constants';
import { ensureStringList } from '../utils';

type AgentTypeTagsProps = {
  values?: string[] | null;
};

export const getAgentTypeLabel = (agentType?: string) =>
  (agentType && AGENT_TYPE_LABELS[agentType]) || agentType || '-';

export const AgentTypeTag = ({ value }: { value?: string }) => (
  <Tag color="blue">{getAgentTypeLabel(value)}</Tag>
);

export const AgentTypeTags = ({ values }: AgentTypeTagsProps) => {
  const agentTypes = ensureStringList(values);

  if (!agentTypes.length) {
    return <Tag>任意 Agent</Tag>;
  }

  return (
    <Space size={[0, 6]} wrap>
      {agentTypes.map((value) => (
        <AgentTypeTag key={value} value={value} />
      ))}
    </Space>
  );
};

export const EnabledTag = ({ enabled }: { enabled?: boolean }) =>
  enabled ? (
    <Tag icon={<CheckCircleOutlined />} color="success">
      启用
    </Tag>
  ) : (
    <Tag icon={<CloseCircleOutlined />} color="default">
      停用
    </Tag>
  );

export const ReadOnlyTag = ({ readOnly }: { readOnly?: boolean }) =>
  readOnly ? (
    <Tag icon={<SafetyCertificateOutlined />} color="cyan">
      只读
    </Tag>
  ) : (
    <Tag color="warning">非只读</Tag>
  );

export const ToolSourceTag = ({ value }: { value?: string }) => (
  <Tag color={value === 'monitoring' ? 'purple' : 'geekblue'}>
    {(value && TOOL_SOURCE_LABELS[value]) || value || '-'}
  </Tag>
);

export const ToolOriginTag = ({ value }: { value?: string }) => (
  <Tag color={value === 'mcp' ? 'orange' : 'default'}>
    {(value && TOOL_ORIGIN_LABELS[value]) || value || '-'}
  </Tag>
);
