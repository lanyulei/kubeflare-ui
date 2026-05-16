import type { FormInstance } from 'antd';
import { Form, Modal } from 'antd';
import { ComputeQuotaFields } from '@/components';
import type { DefaultContainerQuotaFormValues } from './helpers';
import useStyles from './styles';

type DefaultContainerQuotaModalProps = {
  form: FormInstance<DefaultContainerQuotaFormValues>;
  open: boolean;
  saving: boolean;
  onCancel: () => void;
  onOk: () => void;
};

const DefaultContainerQuotaModal = ({
  form,
  open,
  saving,
  onCancel,
  onOk,
}: DefaultContainerQuotaModalProps) => {
  const { styles } = useStyles();

  return (
    <Modal
      destroyOnHidden
      confirmLoading={saving}
      open={open}
      title="编辑默认容器配额"
      width={800}
      okText="保存"
      cancelText="取消"
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form<DefaultContainerQuotaFormValues>
        className={styles.quotaForm}
        form={form}
        layout="vertical"
      >
        <ComputeQuotaFields
          cpuFields={[
            {
              label: 'CPU 预留',
              name: 'cpuRequest',
              placeholder: '无预留',
            },
            {
              label: 'CPU 限制',
              name: 'cpuLimit',
              placeholder: '无上限',
            },
          ]}
          memoryFields={[
            {
              label: '内存预留',
              name: 'memoryRequest',
              placeholder: '无预留',
            },
            {
              label: '内存上限',
              name: 'memoryLimit',
              placeholder: '无上限',
            },
          ]}
        />
      </Form>
    </Modal>
  );
};

export default DefaultContainerQuotaModal;
