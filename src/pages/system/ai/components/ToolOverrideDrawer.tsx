import {
  DrawerForm,
  ProFormDigit,
  ProFormSwitch,
  ProFormTextArea,
} from '@ant-design/pro-components';

export type ToolOverrideFormValues = {
  description: string;
  enabled: boolean;
  observe_max_chars?: number;
  read_only: boolean;
  timeout_ms: number;
};

type ToolOverrideDrawerProps = {
  loading?: boolean;
  open: boolean;
  tool?: API.AgentToolDefinition;
  onClose: () => void;
  onSubmit: (values: ToolOverrideFormValues) => Promise<boolean>;
};

const MIN_OBSERVE_MAX_CHARS = 256;
const MAX_OBSERVE_MAX_CHARS = 16000;

const getInitialValues = (
  tool?: API.AgentToolDefinition,
): Partial<ToolOverrideFormValues> => ({
  description: tool?.description || '',
  enabled: Boolean(tool?.enabled),
  observe_max_chars: tool?.observe_max_chars || 0,
  read_only: Boolean(tool?.read_only),
  timeout_ms: tool?.timeout_ms || 8000,
});

const ToolOverrideDrawer = ({
  loading = false,
  open,
  tool,
  onClose,
  onSubmit,
}: ToolOverrideDrawerProps) => (
  <DrawerForm<ToolOverrideFormValues>
    key={tool?.id || 'tool-override'}
    title={tool ? `编辑工具 / ${tool.name}` : '编辑工具'}
    open={open}
    width={620}
    drawerProps={{
      destroyOnHidden: true,
      onClose,
    }}
    initialValues={getInitialValues(tool)}
    submitter={{
      submitButtonProps: {
        loading,
      },
    }}
    onFinish={onSubmit}
  >
    <ProFormSwitch name="enabled" label="启用工具" />
    <ProFormSwitch name="read_only" label="只读声明" />
    <ProFormDigit
      name="timeout_ms"
      label="执行超时"
      fieldProps={{ precision: 0, addonAfter: 'ms' }}
      min={1000}
      max={120000}
      rules={[{ required: true, message: '请输入执行超时时间' }]}
    />
    <ProFormDigit
      name="observe_max_chars"
      label="观察文本上限"
      extra={`0 表示沿用 Agent 全局默认值；自定义值需在 ${MIN_OBSERVE_MAX_CHARS}-${MAX_OBSERVE_MAX_CHARS} 字符之间。`}
      fieldProps={{ precision: 0, addonAfter: '字符' }}
      min={0}
      max={MAX_OBSERVE_MAX_CHARS}
      rules={[
        { required: true, message: '请输入观察文本上限' },
        {
          validator: async (_: unknown, value?: number) => {
            const nextValue = Number(value || 0);
            if (
              nextValue === 0 ||
              (nextValue >= MIN_OBSERVE_MAX_CHARS &&
                nextValue <= MAX_OBSERVE_MAX_CHARS)
            ) {
              return;
            }
            throw new Error(
              `观察文本上限需为 0 或 ${MIN_OBSERVE_MAX_CHARS}-${MAX_OBSERVE_MAX_CHARS} 字符`,
            );
          },
        },
      ]}
    />
    <ProFormTextArea
      name="description"
      label="工具描述"
      fieldProps={{ autoSize: { minRows: 4, maxRows: 8 } }}
      rules={[
        { required: true, message: '请输入工具描述' },
        { max: 1000, message: '工具描述不能超过 1000 个字符' },
      ]}
    />
  </DrawerForm>
);

export default ToolOverrideDrawer;
