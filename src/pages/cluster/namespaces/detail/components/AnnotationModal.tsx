import { Modal } from 'antd';
import { KeyValueEditor } from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

type AnnotationModalProps = {
  rows: KeyValueEditorItem[];
  open: boolean;
  saving: boolean;
  onAddBlocked: () => void;
  onCancel: () => void;
  onChange: (rows: KeyValueEditorItem[]) => void;
  onCreateItem: () => KeyValueEditorItem;
  onOk: () => void;
};

const AnnotationModal = ({
  rows,
  open,
  saving,
  onAddBlocked,
  onCancel,
  onChange,
  onCreateItem,
  onOk,
}: AnnotationModalProps) => (
  <Modal
    destroyOnHidden
    confirmLoading={saving}
    open={open}
    title="编辑注解"
    width={900}
    okText="保存"
    cancelText="取消"
    onCancel={onCancel}
    onOk={onOk}
  >
    <KeyValueEditor
      value={rows}
      deleteAriaLabel="删除注解"
      onAddBlocked={onAddBlocked}
      onChange={onChange}
      onCreateItem={onCreateItem}
    />
  </Modal>
);

export default AnnotationModal;
