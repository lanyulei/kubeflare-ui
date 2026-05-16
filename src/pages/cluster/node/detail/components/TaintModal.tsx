import { Modal } from 'antd';
import { TaintEditor } from '@/components';
import type { TaintEditorItem } from '@/components/TaintEditor';
import { TAINT_EFFECT_OPTIONS } from '../constants';

type TaintModalProps = {
  open: boolean;
  saving: boolean;
  rows: TaintEditorItem[];
  onAddBlocked: () => void;
  onCancel: () => void;
  onChange: (rows: TaintEditorItem[]) => void;
  onCreateItem: () => TaintEditorItem;
  onOk: () => void;
};

const TaintModal = ({
  open,
  saving,
  rows,
  onAddBlocked,
  onCancel,
  onChange,
  onCreateItem,
  onOk,
}: TaintModalProps) => (
  <Modal
    destroyOnHidden
    confirmLoading={saving}
    open={open}
    title="编辑污点"
    width={960}
    okText="保存"
    cancelText="取消"
    onCancel={onCancel}
    onOk={onOk}
  >
    <TaintEditor
      value={rows}
      deleteAriaLabel="删除污点"
      effectOptions={TAINT_EFFECT_OPTIONS}
      onAddBlocked={onAddBlocked}
      onChange={onChange}
      onCreateItem={onCreateItem}
    />
  </Modal>
);

export default TaintModal;
