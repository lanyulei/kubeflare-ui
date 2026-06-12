import { RobotOutlined } from '@ant-design/icons';
import type { ButtonProps } from 'antd';
import { Button } from 'antd';
import type { ReactNode } from 'react';
import { buildAgentDiagnosePrompt, normalizeAgentScope } from '@/utils/agent';

export const AGENT_DIAGNOSE_EVENT = 'kubeflare:agentDiagnose';

export type AgentDiagnoseRequest = {
  prompt?: string;
  scope?: API.AgentScope;
  selectedAgent?: API.AgentType;
};

export type AgentDiagnoseButtonProps = Omit<ButtonProps, 'onClick'> & {
  children?: ReactNode;
  prompt?: string;
  scope?: API.AgentScope;
  selectedAgent?: API.AgentType;
};

export const openAgentDiagnose = (request: AgentDiagnoseRequest) => {
  if (typeof window === 'undefined') {
    return;
  }

  const scope = normalizeAgentScope(request.scope);

  window.dispatchEvent(
    new CustomEvent<AgentDiagnoseRequest>(AGENT_DIAGNOSE_EVENT, {
      detail: {
        prompt: request.prompt || buildAgentDiagnosePrompt(scope),
        scope,
        selectedAgent: request.selectedAgent || 'diagnostic',
      },
    }),
  );
};

const AgentDiagnoseButton = ({
  children = 'Agent 诊断',
  prompt,
  scope,
  selectedAgent = 'diagnostic',
  ...buttonProps
}: AgentDiagnoseButtonProps) => (
  <Button
    icon={<RobotOutlined />}
    {...buttonProps}
    onClick={() =>
      openAgentDiagnose({
        prompt,
        scope,
        selectedAgent,
      })
    }
  >
    {children}
  </Button>
);

export default AgentDiagnoseButton;
