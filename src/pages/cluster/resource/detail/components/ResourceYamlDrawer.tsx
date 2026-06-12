import { FileTextOutlined } from '@ant-design/icons';
import { Button, Drawer, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { YamlEditor } from '@/components';

type ResourceYamlDrawerProps = {
  loading?: boolean;
  open: boolean;
  value: string;
  onCancel: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
};

const useStyles = createStyles(({ token }) => ({
  body: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  editor: {
    flex: 1,
    minHeight: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: token.marginSM,
  },
}));

const ResourceYamlDrawer = ({
  loading = false,
  open,
  value,
  onCancel,
  onChange,
  onSubmit,
}: ResourceYamlDrawerProps) => {
  const { styles } = useStyles();

  return (
    <Drawer
      destroyOnHidden
      footer={
        <div className={styles.footer}>
          <Button onClick={onCancel}>取消</Button>
          <Button loading={loading} type="primary" onClick={onSubmit}>
            确定
          </Button>
        </div>
      }
      open={open}
      title={
        <>
          <FileTextOutlined /> 编辑当前资源 YAML
        </>
      }
      width="65vw"
      onClose={onCancel}
    >
      <Spin spinning={loading && !value}>
        <div className={styles.body}>
          <div className={styles.editor}>
            <YamlEditor
              height="calc(100vh - 154px)"
              value={value}
              onChange={onChange}
            />
          </div>
        </div>
      </Spin>
    </Drawer>
  );
};

export default ResourceYamlDrawer;
