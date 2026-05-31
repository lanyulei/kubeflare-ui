import { ProForm, ProFormSelect } from '@ant-design/pro-components';
import { Form } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useMemo, useState } from 'react';
import { getClusterNamespaceList } from '@/services/kubeflare/cluster/namespace';
import { getRbacSubjectList } from '@/services/kubeflare/cluster/rbac';
import { SUBJECT_KIND_OPTIONS } from '../constants';

const useStyles = createStyles(({ token }) => ({
  form: {
    '.ant-pro-form-group-title': {
      marginBottom: token.marginSM,
    },
  },
}));

type SelectOption = {
  label: string;
  value: string;
};

type RbacSubjectQueryFormProps = {
  initialValues?: API.RbacSubjectQuery;
  loading?: boolean;
  onReset?: () => void;
  onSubmit: (values: API.RbacSubjectQuery) => Promise<void> | void;
};

const uniqueOptions = (values: (string | undefined)[]) =>
  Array.from(new Set(values.filter(Boolean) as string[])).map((value) => ({
    label: value,
    value,
  }));

const normalizeQuery = (
  values: API.RbacSubjectQuery,
): API.RbacSubjectQuery => ({
  ...values,
  namespace: values.kind === 'ServiceAccount' ? values.namespace : undefined,
});

const selectFieldProps = {
  allowClear: true,
  optionFilterProp: 'label',
  showSearch: true,
};

const RbacSubjectQueryForm = ({
  initialValues,
  loading,
  onReset,
  onSubmit,
}: RbacSubjectQueryFormProps) => {
  const { styles } = useStyles();
  const [form] = Form.useForm<API.RbacSubjectQuery>();
  const [subjects, setSubjects] = useState<API.RbacSubjectItem[]>([]);
  const [scopeNamespaceOptions, setScopeNamespaceOptions] = useState<
    SelectOption[]
  >([]);
  const [optionLoading, setOptionLoading] = useState(false);

  const selectedKind = Form.useWatch('kind', form);
  const selectedName = Form.useWatch('name', form);
  const selectedNamespace = Form.useWatch('namespace', form);

  useEffect(() => {
    setOptionLoading(true);
    Promise.all([getRbacSubjectList(), getClusterNamespaceList()])
      .then(([subjectRes, namespaceRes]) => {
        setSubjects(subjectRes.data.items || []);
        setScopeNamespaceOptions(
          uniqueOptions(
            (namespaceRes.data.items || []).map((item) =>
              item.name === '-' ? undefined : item.name,
            ),
          ),
        );
      })
      .catch(() => {
        setSubjects([]);
        setScopeNamespaceOptions([]);
      })
      .finally(() => setOptionLoading(false));
  }, []);

  const kindMatchedSubjects = useMemo(
    () =>
      subjects.filter((subject) => {
        if (selectedKind && subject.kind !== selectedKind) {
          return false;
        }
        return true;
      }),
    [selectedKind, subjects],
  );

  const namespaceOptions = useMemo(
    () =>
      uniqueOptions(
        kindMatchedSubjects
          .filter((subject) => !selectedName || subject.name === selectedName)
          .map((subject) => subject.namespace),
      ),
    [kindMatchedSubjects, selectedName],
  );

  const nameOptions = useMemo(
    () =>
      uniqueOptions(
        kindMatchedSubjects
          .filter(
            (subject) =>
              selectedKind !== 'ServiceAccount' ||
              !selectedNamespace ||
              subject.namespace === selectedNamespace,
          )
          .map((subject) => subject.name),
      ),
    [kindMatchedSubjects, selectedKind, selectedNamespace],
  );

  const hasSubject = (predicate: (subject: API.RbacSubjectItem) => boolean) =>
    subjects.some(predicate);

  const handleKindChange = () => {
    form.setFieldsValue({
      name: undefined,
      namespace: undefined,
    });
  };

  const handleNamespaceChange = () => {
    const nextName = form.getFieldValue('name');
    const nextNamespace = form.getFieldValue('namespace');

    if (
      nextName &&
      nextNamespace &&
      form.getFieldValue('kind') === 'ServiceAccount' &&
      !hasSubject(
        (subject) =>
          subject.kind === form.getFieldValue('kind') &&
          subject.namespace === nextNamespace &&
          subject.name === nextName,
      )
    ) {
      form.setFieldValue('name', undefined);
    }
  };

  const handleNameChange = () => {
    const nextName = form.getFieldValue('name');
    const nextNamespace = form.getFieldValue('namespace');

    if (
      nextName &&
      nextNamespace &&
      form.getFieldValue('kind') === 'ServiceAccount' &&
      !hasSubject(
        (subject) =>
          subject.kind === form.getFieldValue('kind') &&
          subject.name === nextName &&
          subject.namespace === nextNamespace,
      )
    ) {
      form.setFieldValue('namespace', undefined);
    }
  };

  return (
    <ProForm<API.RbacSubjectQuery>
      className={styles.form}
      form={form}
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
        await onSubmit(normalizeQuery(values));
        return true;
      }}
      onReset={onReset}
    >
      <ProForm.Group>
        <ProFormSelect
          name="kind"
          label="主体类型"
          colProps={{ xs: 24, md: 12, xl: 6 }}
          fieldProps={{
            ...selectFieldProps,
            onChange: handleKindChange,
          }}
          rules={[{ required: true, message: '请选择主体类型' }]}
          options={SUBJECT_KIND_OPTIONS}
        />
        <ProFormSelect
          name="namespace"
          label="主体命名空间"
          colProps={{ xs: 24, md: 12, xl: 6 }}
          disabled={selectedKind !== 'ServiceAccount'}
          fieldProps={{
            ...selectFieldProps,
            loading: optionLoading,
            onChange: handleNamespaceChange,
          }}
          options={namespaceOptions}
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
        <ProFormSelect
          name="name"
          label="主体名称"
          colProps={{ xs: 24, md: 12, xl: 6 }}
          fieldProps={{
            ...selectFieldProps,
            loading: optionLoading,
            onChange: handleNameChange,
          }}
          options={nameOptions}
          rules={[{ required: true, message: '请选择主体名称' }]}
        />
        <ProFormSelect
          name="scopeNamespace"
          label="限定命名空间"
          colProps={{ xs: 24, md: 12, xl: 6 }}
          fieldProps={{
            ...selectFieldProps,
            loading: optionLoading,
          }}
          options={scopeNamespaceOptions}
          tooltip="仅查看某个命名空间内生效的权限"
        />
      </ProForm.Group>
    </ProForm>
  );
};

export type { RbacSubjectQueryFormProps };
export default RbacSubjectQueryForm;
