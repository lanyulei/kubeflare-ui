import {
  ProForm,
  ProFormDependency,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Divider } from 'antd';
import { createStyles } from 'antd-style';
import { RBAC_VERB_OPTIONS, SUBJECT_KIND_OPTIONS } from '../../constants';
import { normalizeSimulatorParams } from '../helpers';

type SimulatorFormProps = {
  loading?: boolean;
  onSubmit: (params: API.RbacSimulatorParams) => Promise<void>;
};

const useStyles = createStyles(({ token }) => ({
  form: {
    '.ant-pro-form-group-title': {
      marginBlockEnd: token.marginSM,
      color: token.colorTextHeading,
      fontWeight: 600,
    },
    '.ant-form-item': {
      marginBottom: token.margin,
    },
  },
  divider: {
    margin: `${token.marginXS}px 0 ${token.marginLG}px`,
  },
}));

const fieldColProps = {
  xs: 24,
  md: 12,
  xl: 8,
};

const fullColProps = {
  xs: 24,
};

const SimulatorForm = ({ loading, onSubmit }: SimulatorFormProps) => {
  const { styles } = useStyles();

  return (
    <ProForm<API.RbacSimulatorParams>
      className={styles.form}
      grid
      initialValues={{ subjectKind: 'Self' }}
      layout="vertical"
      submitter={{
        searchConfig: {
          submitText: '模拟访问',
          resetText: '重置',
        },
        submitButtonProps: {
          loading,
        },
      }}
      onFinish={async (values) => {
        await onSubmit(normalizeSimulatorParams(values));
        return true;
      }}
    >
      <ProForm.Group title="主体">
        <ProFormSelect
          colProps={fieldColProps}
          name="subjectKind"
          label="主体类型"
          options={[
            { label: '当前用户', value: 'Self' },
            ...SUBJECT_KIND_OPTIONS,
          ]}
          rules={[{ required: true }]}
        />
        <ProFormDependency name={['subjectKind']}>
          {({ subjectKind }) =>
            subjectKind && subjectKind !== 'Self' ? (
              <>
                <ProFormText
                  colProps={fieldColProps}
                  name="subjectName"
                  label="主体名称"
                  rules={[{ required: true, message: '请输入主体名称' }]}
                />
                <ProFormText
                  colProps={fieldColProps}
                  name="subjectNamespace"
                  label="主体命名空间"
                />
              </>
            ) : null
          }
        </ProFormDependency>
      </ProForm.Group>

      <Divider className={styles.divider} />

      <ProForm.Group title="访问目标">
        <ProFormText
          colProps={fieldColProps}
          name="namespace"
          label="资源命名空间"
        />
        <ProFormText
          colProps={fieldColProps}
          name="apiGroup"
          label="API 组"
          placeholder="core 资源可留空"
        />
        <ProFormText
          colProps={fieldColProps}
          name="resource"
          label="资源"
          placeholder="pods、deployments"
        />
        <ProFormText
          colProps={fieldColProps}
          name="subresource"
          label="子资源"
          placeholder="logs、status"
        />
        <ProFormText
          colProps={fieldColProps}
          name="resourceName"
          label="资源名称"
        />
        <ProFormSelect
          colProps={fieldColProps}
          name="verb"
          label="动作"
          options={RBAC_VERB_OPTIONS}
          rules={[{ required: true, message: '请选择动作' }]}
        />
        <ProFormText
          colProps={fullColProps}
          name="nonResourceURL"
          label="非资源 URL"
          placeholder="/api、/healthz"
        />
      </ProForm.Group>
    </ProForm>
  );
};

export default SimulatorForm;
