import {
  ModalForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import { useEffect } from 'react';

type NamespaceOption = {
  label: string;
  value: string;
};

type CreateServiceAccountFormValues = {
  name: string;
  namespace: string;
};

type CreateServiceAccountModalProps = {
  defaultNamespace?: string;
  loading: boolean;
  namespaceOptions: NamespaceOption[];
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    type: API.ClusterResourceCreateType;
    namespace?: string;
    manifest: Record<string, unknown>;
  }) => Promise<void>;
};

const SERVICE_ACCOUNT_TYPE: API.ClusterResourceCreateType = 'ServiceAccount';
const SERVICE_ACCOUNT_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const serviceAccountNameRules = [
  {
    required: true,
    message: '请输入名称',
  },
  {
    min: 1,
    max: 63,
    message: '名称长度需在 1 到 63 位之间',
  },
  {
    pattern: SERVICE_ACCOUNT_NAME_PATTERN,
    message: '名称仅支持小写字母、数字和中划线，且不能以中划线开头或结尾',
  },
];

const namespaceRules = [
  {
    required: true,
    message: '请选择命名空间',
  },
];

const getInitialNamespace = (
  defaultNamespace: string | undefined,
  namespaceOptions: NamespaceOption[],
) => {
  if (defaultNamespace) {
    return defaultNamespace;
  }

  if (namespaceOptions.some((option) => option.value === 'default')) {
    return 'default';
  }

  return namespaceOptions[0]?.value;
};

const buildServiceAccountManifest = ({
  name,
  namespace,
}: CreateServiceAccountFormValues) => ({
  apiVersion: 'v1',
  kind: SERVICE_ACCOUNT_TYPE,
  metadata: {
    name: name.trim(),
    namespace: namespace.trim(),
  },
});

const CreateServiceAccountModal = ({
  defaultNamespace,
  loading,
  namespaceOptions,
  open,
  onCancel,
  onSubmit,
}: CreateServiceAccountModalProps) => {
  const [form] = Form.useForm<CreateServiceAccountFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      namespace: getInitialNamespace(defaultNamespace, namespaceOptions),
    });
  }, [defaultNamespace, form, namespaceOptions, open]);

  return (
    <ModalForm<CreateServiceAccountFormValues>
      form={form}
      modalProps={{
        destroyOnHidden: true,
        maskClosable: false,
        onCancel,
      }}
      open={open}
      submitter={{
        resetButtonProps: {
          onClick: onCancel,
        },
        searchConfig: {
          resetText: '取消',
          submitText: '创建',
        },
        submitButtonProps: {
          loading,
        },
      }}
      title="创建服务账户"
      width={520}
      onFinish={async (values) => {
        const namespace = values.namespace.trim();

        await onSubmit({
          type: SERVICE_ACCOUNT_TYPE,
          namespace,
          manifest: buildServiceAccountManifest(values),
        });

        return true;
      }}
    >
      <ProFormText
        fieldProps={{
          autoComplete: 'off',
          autoFocus: true,
        }}
        label="名称"
        name="name"
        placeholder="请输入名称"
        rules={serviceAccountNameRules}
      />
      <ProFormSelect
        fieldProps={{
          optionFilterProp: 'label',
          showSearch: true,
        }}
        label="命名空间"
        name="namespace"
        options={namespaceOptions}
        placeholder="请选择命名空间"
        rules={namespaceRules}
      />
    </ModalForm>
  );
};

export default CreateServiceAccountModal;
