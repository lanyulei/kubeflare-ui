import { Modal } from 'antd';
import { KeyValueEditor } from '@/components';
import type { KeyValueEditorItem } from '@/components/KeyValueEditor';

type LabelModalProps = {
  open: boolean;
  saving: boolean;
  rows: KeyValueEditorItem[];
  onAddBlocked: () => void;
  onCancel: () => void;
  onChange: (rows: KeyValueEditorItem[]) => void;
  onCreateItem: () => KeyValueEditorItem;
  onOk: () => void;
};

const LabelModal = ({
  open,
  saving,
  rows,
  onAddBlocked,
  onCancel,
  onChange,
  onCreateItem,
  onOk,
}: LabelModalProps) => (
  <Modal
    destroyOnHidden
    confirmLoading={saving}
    open={open}
    title="编辑标签"
    width={900}
    okText="保存"
    cancelText="取消"
    onCancel={onCancel}
    onOk={onOk}
  >
    <KeyValueEditor
      value={rows}
      deleteAriaLabel="删除标签"
      onAddBlocked={onAddBlocked}
      onChange={onChange}
      onCreateItem={onCreateItem}
    />
  </Modal>
);

export default LabelModal;
