import {
  DrawerForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App } from 'antd';
import { MANAGED_AGENT_TYPE_OPTIONS } from '../constants';
import { normalizeOptionalText, normalizeTextList } from '../utils';

export type SkillFormValues = {
  agent_types?: API.AgentType[];
  allowed_tools?: string[];
  description?: string;
  enabled: boolean;
  hints?: string[];
  id: string;
  name: string;
  system_prompt?: string;
  triggers?: string[];
};

type SkillFormDrawerProps = {
  loading?: boolean;
  mode: 'create' | 'edit';
  open: boolean;
  skill?: API.AgentSkillDefinition;
  toolOptions: { label: string; value: string }[];
  onClose: () => void;
  onSubmit: (values: SkillFormValues) => Promise<boolean>;
};

const getInitialValues = (
  skill?: API.AgentSkillDefinition,
): Partial<SkillFormValues> => ({
  agent_types: skill?.agent_types || ['diagnostic'],
  allowed_tools: skill?.allowed_tools || [],
  description: skill?.description || '',
  enabled: skill?.enabled ?? true,
  hints: skill?.hints || [],
  id: skill?.id || '',
  name: skill?.name || '',
  system_prompt: skill?.system_prompt || '',
  triggers: skill?.triggers || [],
});

const normalizeSkillFormValues = (
  values: SkillFormValues,
): SkillFormValues => ({
  ...values,
  allowed_tools: normalizeTextList(values.allowed_tools),
  description: normalizeOptionalText(values.description),
  hints: normalizeTextList(values.hints),
  id: values.id.trim(),
  name: values.name.trim(),
  system_prompt: normalizeOptionalText(values.system_prompt),
  triggers: normalizeTextList(values.triggers),
});

const SkillFormDrawer = ({
  loading = false,
  mode,
  open,
  skill,
  toolOptions,
  onClose,
  onSubmit,
}: SkillFormDrawerProps) => {
  const { message } = App.useApp();

  return (
    <DrawerForm<SkillFormValues>
      key={`${mode}-${skill?.id || 'skill'}`}
      title={mode === 'create' ? '新建技能' : `编辑技能 / ${skill?.name || ''}`}
      open={open}
      width={720}
      drawerProps={{
        destroyOnHidden: true,
        onClose,
      }}
      initialValues={getInitialValues(skill)}
      submitter={{
        submitButtonProps: {
          loading,
        },
      }}
      onFinish={async (values) => {
        const normalizedValues = normalizeSkillFormValues(values);
        if (
          !normalizedValues.triggers?.length &&
          !normalizedValues.system_prompt
        ) {
          message.warning('触发词和系统提示词至少填写一项');
          return false;
        }
        return onSubmit(normalizedValues);
      }}
    >
      <ProFormText
        name="id"
        label="技能 ID"
        fieldProps={{ readOnly: mode === 'edit' }}
        rules={[
          { required: true, message: '请输入技能 ID' },
          { max: 128, message: '技能 ID 不能超过 128 个字符' },
          {
            pattern: /^[A-Za-z0-9._:-]+$/,
            message: '技能 ID 仅支持字母、数字、点、下划线、中划线和冒号',
          },
        ]}
      />
      <ProFormText
        name="name"
        label="技能名称"
        rules={[
          { required: true, message: '请输入技能名称' },
          { max: 128, message: '技能名称不能超过 128 个字符' },
        ]}
      />
      <ProFormSwitch name="enabled" label="启用技能" />
      <ProFormSelect
        name="agent_types"
        label="适用 Agent"
        fieldProps={{ mode: 'multiple' }}
        options={MANAGED_AGENT_TYPE_OPTIONS}
        placeholder="留空表示适用于任意 Agent"
      />
      <ProFormSelect
        name="triggers"
        label="触发词"
        fieldProps={{ mode: 'tags' }}
        placeholder="输入后回车添加触发词"
      />
      <ProFormSelect
        name="allowed_tools"
        label="允许工具"
        fieldProps={{ mode: 'multiple', showSearch: true }}
        options={toolOptions}
        placeholder="留空表示不收窄工具集"
      />
      <ProFormTextArea
        name="system_prompt"
        label="系统提示词"
        fieldProps={{ autoSize: { minRows: 4, maxRows: 10 } }}
        rules={[{ max: 8000, message: '系统提示词不能超过 8000 个字符' }]}
      />
      <ProFormSelect
        name="hints"
        label="排查步骤"
        fieldProps={{ mode: 'tags' }}
        placeholder="输入后回车添加步骤"
      />
      <ProFormTextArea
        name="description"
        label="描述"
        fieldProps={{ autoSize: { minRows: 2, maxRows: 5 } }}
        rules={[{ max: 512, message: '描述不能超过 512 个字符' }]}
      />
    </DrawerForm>
  );
};

export default SkillFormDrawer;
