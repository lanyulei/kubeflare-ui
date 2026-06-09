import { Input, Modal, Typography } from 'antd';
import { useEffect, useState } from 'react';

type RuntimeChangeReasonModalProps = {
  confirmText: string;
  danger?: boolean;
  loading?: boolean;
  open: boolean;
  title: string;
  onCancel: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
};

const RuntimeChangeReasonModal = ({
  confirmText,
  danger = false,
  loading = false,
  open,
  title,
  onCancel,
  onSubmit,
}: RuntimeChangeReasonModalProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  return (
    <Modal
      destroyOnHidden
      open={open}
      title={title}
      okText={confirmText}
      cancelText="取消"
      confirmLoading={loading}
      okButtonProps={{ danger }}
      onCancel={onCancel}
      onOk={() => onSubmit(reason.trim())}
    >
      <Typography.Text type="secondary">操作原因</Typography.Text>
      <Input.TextArea
        autoSize={{ minRows: 3, maxRows: 6 }}
        maxLength={512}
        placeholder="选填，建议填写变更背景或工单号"
        showCount
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
    </Modal>
  );
};

export default RuntimeChangeReasonModal;
