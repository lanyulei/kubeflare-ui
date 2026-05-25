import { Form } from 'antd';
import { createStyles } from 'antd-style';
import ConfigMapDataEditor from './ConfigMapDataEditor';
import { validateConfigMapDataItems } from './helpers';
import type { ConfigMapDataItem } from './types';

const useStyles = createStyles(() => ({
  dataField: {
    width: '100%',

    '.ant-form-item': {
      marginBottom: 0,
    },
  },
}));

const ConfigMapDataSettings = () => {
  const { styles } = useStyles();

  return (
    <Form.Item
      className={styles.dataField}
      label="数据"
      name="dataItems"
      rules={[
        {
          validator: async (_, value?: ConfigMapDataItem[]) => {
            const error = validateConfigMapDataItems(value);
            if (error) {
              throw new Error(error);
            }
          },
        },
      ]}
    >
      <ConfigMapDataEditor />
    </Form.Item>
  );
};

export default ConfigMapDataSettings;
