import {
  ProForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { createStyles } from 'antd-style';
import { SUBJECT_KIND_OPTIONS } from '../constants';

const useStyles = createStyles(({ token }) => ({
  form: {
    '.ant-pro-form-group-title': {
      marginBottom: token.marginSM,
    },
  },
}));

type RbacSubjectQueryFormProps = {
  initialValues?: API.RbacSubjectQuery;
  loading?: boolean;
  onReset?: () => void;
  onSubmit: (values: API.RbacSubjectQuery) => Promise<void> | void;
};

const RbacSubjectQueryForm = ({
  initialValues,
  loading,
  onReset,
  onSubmit,
}: RbacSubjectQueryFormProps) => {
  const { styles } = useStyles();

  return (
    <ProForm<API.RbacSubjectQuery>
      className={styles.form}
      grid
      initialValues={initialValues}
      layout="vertical"
      rowProps={{ gutter: [16, 0] }}
      submitter={{
        searchConfig: {
          resetText: '重置',
          submitText: '查询权限',
        },
        submitButtonProps: {
          loading,
        },
      }}
      onFinish={async (values) => {
        await onSubmit(values);
        return true;
      }}
      onReset={onReset}
    >
      <ProForm.Group title="主体信息">
        <ProFormSelect
          name="kind"
          label="主体类型"
          colProps={{ xs: 24, md: 12, xl: 6 }}
          rules={[{ required: true, message: '请选择主体类型' }]}
          options={SUBJECT_KIND_OPTIONS}
        />
        <ProFormText
          name="name"
          label="主体名称"
          colProps={{ xs: 24, md: 12, xl: 6 }}
          rules={[{ required: true, message: '请输入主体名称' }]}
        />
        <ProFormText
          name="namespace"
          label="主体命名空间"
          colProps={{ xs: 24, md: 12, xl: 6 }}
          rules={[
            ({ getFieldValue }) => ({
              validator: async (_, value) => {
                if (getFieldValue('kind') === 'ServiceAccount' && !value) {
                  throw new Error('请输入 ServiceAccount 命名空间');
                }
              },
            }),
          ]}
          tooltip="ServiceAccount 必填，User 和 Group 可留空"
        />
        <ProFormText
          name="scopeNamespace"
          label="限定命名空间"
          colProps={{ xs: 24, md: 12, xl: 6 }}
          tooltip="仅查看某个命名空间内生效的权限"
        />
      </ProForm.Group>
    </ProForm>
  );
};

export type { RbacSubjectQueryFormProps };
export default RbacSubjectQueryForm;
