import {
  DrawerForm,
  ProFormDigit,
  ProFormSwitch,
  ProFormTextArea,
} from '@ant-design/pro-components';

export type ToolOverrideFormValues = {
  description: string;
  enabled: boolean;
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

const getInitialValues = (
  tool?: API.AgentToolDefinition,
): Partial<ToolOverrideFormValues> => ({
  description: tool?.description || '',
  enabled: Boolean(tool?.enabled),
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
