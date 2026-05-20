import { CodeSandboxOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Col, Form, Input, Modal, Row, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useState } from 'react';
import type { CreateWorkloadContainerValues } from '../types';
import ContainerAdvancedOptions from './ContainerAdvancedOptions';
import ContainerFormSection from './ContainerFormSection';
import ContainerPortFields from './ContainerPortFields';
import ContainerResourceFields from './ContainerResourceFields';

const NAME_PATTERN = /^[A-Za-z0-9]([-A-Za-z0-9]*[A-Za-z0-9])?$/;

const useStyles = createStyles(({ token }) => ({
  modal: {
    '.ant-modal-content': {
      padding: 0,
      overflow: 'hidden',
    },
    '.ant-modal-header': {
      marginBottom: 0,
      padding: `${token.paddingMD}px ${token.paddingLG}px`,
      borderBottom: `1px solid ${token.colorBorderSecondary}`,
    },
    '.ant-modal-body': {
      maxHeight: 'calc(100vh - 210px)',
      overflow: 'auto',
      padding: token.paddingLG,
      background: token.colorBgContainer,
    },
    '.ant-modal-footer': {
      marginTop: 0,
      padding: `${token.paddingSM}px ${token.paddingLG}px`,
      borderTop: `1px solid ${token.colorBorderSecondary}`,
      background: token.colorBgContainer,
    },
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  imageInput: {
    '.ant-input-prefix': {
      alignSelf: 'stretch',
      alignItems: 'center',
      marginInlineEnd: token.marginSM,
      marginInlineStart: -token.paddingSM,
      padding: `0 ${token.paddingSM}px`,
      background: token.colorText,
      color: token.colorBgContainer,
      fontWeight: 600,
    },
  },
  imageSuffix: {
    color: token.colorTextSecondary,
  },
  imagePreview: {
    display: 'flex',
    minHeight: 140,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: token.marginXS,
    marginTop: token.marginMD,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusSM,
    background: token.colorFillQuaternary,
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
  },
  imagePreviewIcon: {
    color: token.colorText,
    fontSize: 42,
  },
  advancedToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: token.marginXXS,
    margin: `${token.marginSM}px 0`,
    padding: 0,
    height: 'auto',
    color: token.colorPrimary,
    fontSize: token.fontSizeSM,
  },
  helper: {
    color: token.colorTextTertiary,
    fontSize: token.fontSizeSM,
    lineHeight: token.lineHeight,
  },
}));

type ContainerConfigModalProps = {
  form: FormInstance<CreateWorkloadContainerValues>;
  open: boolean;
  onCancel: () => void;
  onOk: () => Promise<void>;
};

const ContainerConfigModal = ({
  form,
  open,
  onCancel,
  onOk,
}: ContainerConfigModalProps) => {
  const { styles } = useStyles();
  const [advancedOpen, setAdvancedOpen] = useState(true);

  useEffect(() => {
    if (open) {
      setAdvancedOpen(true);
    }
  }, [open]);

  return (
    <Modal
      className={styles.modal}
      destroyOnHidden
      maskClosable={false}
      okText="保存"
      open={open}
      title="编辑容器配置"
      width={960}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form form={form} layout="vertical" requiredMark>
        <div className={styles.stack}>
          <ContainerFormSection
            description="设置容器的镜像、名称、类型和计算资源。"
            title="容器设置"
          >
            <Form.Item
              label="镜像"
              name="image"
              tooltip="如需使用私有镜像服务，您需要先创建镜像服务保密字典"
              rules={[{ required: true, message: '请输入容器镜像' }]}
            >
              <Input
                className={styles.imageInput}
                placeholder="镜像名称或路径，例如 nginx:latest"
                suffix={<CodeSandboxOutlined className={styles.imageSuffix} />}
              />
            </Form.Item>

            {/* <Button
            className={styles.advancedToggle}
            type="link"
            onClick={() => setAdvancedOpen((current) => !current)}
          >
            高级设置 {advancedOpen ? <UpOutlined /> : <DownOutlined />}
          </Button> */}

            {advancedOpen && (
              <>
                <Row gutter={18}>
                  <Col span={12}>
                    <Form.Item
                      label="容器名称"
                      name="containerName"
                      tooltip="名称只能包含大写字母、小写字母、数字和连字符（-），必须以字母或数字开头和结尾，最长 63 个字符"
                      rules={[
                        { required: true, message: '请输入容器名称' },
                        { max: 63, message: '容器名称最长 63 个字符' },
                        {
                          pattern: NAME_PATTERN,
                          message:
                            '容器名称只能包含大写字母、小写字母、数字和连字符（-），且不能以连字符开头或结尾',
                        },
                      ]}
                    >
                      <Input placeholder="例如 container-Ab12Cd34" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="容器类型" name="containerType">
                      <Select
                        options={[
                          { label: '工作容器', value: 'worker' },
                          { label: '初始化容器', value: 'init' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <ContainerResourceFields />
              </>
            )}
          </ContainerFormSection>

          <ContainerFormSection
            description="设置用于访问容器的端口。"
            title="端口设置"
          >
            <ContainerPortFields />
          </ContainerFormSection>

          <ContainerAdvancedOptions />
        </div>
      </Form>
    </Modal>
  );
};

export default ContainerConfigModal;
