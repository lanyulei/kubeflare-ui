import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, Input, Select } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect } from 'react';
import { createIngressPathItem, isValidIngressPath } from './helpers';
import type {
  IngressRoutePathItem,
  IngressRouteRuleItem,
  IngressServiceOption,
} from './types';

const useStyles = createStyles(({ token }) => ({
  pathRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: token.marginSM,
  },
  pathRow: {
    display: 'grid',
    minHeight: 46,
    gridTemplateColumns:
      'minmax(160px, 0.9fr) minmax(180px, 1fr) minmax(128px, 0.75fr) 40px',
    alignItems: 'center',
    gap: token.marginSM,
    padding: `${token.paddingXS}px ${token.paddingMD}px`,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 24,
    background: token.colorFillQuaternary,

    '@media (max-width: 768px)': {
      gridTemplateColumns: 'minmax(0, 1fr) 40px',
    },
  },
  formItem: {
    '&.ant-form-item': {
      marginBottom: 0,
    },

    '@media (max-width: 768px)': {
      gridColumn: '1 / -1',
    },
  },
  control: {
    minWidth: 0,
    width: '100%',

    '&.ant-input, .ant-input, .ant-select-selector': {
      backgroundColor: token.colorBgContainer,
    },
  },
  deleteButton: {
    justifySelf: 'center',
    color: token.colorTextTertiary,

    '&:hover': {
      color: token.colorError,
    },

    '@media (max-width: 768px)': {
      gridColumn: 2,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
}));

type RoutePathEditorProps = {
  form: FormInstance<IngressRouteRuleItem>;
  serviceOptions: IngressServiceOption[];
};

const getServicePortOptions = (ports?: IngressServiceOption['ports']) =>
  Array.from(new Map((ports || []).map((port) => [port.value, port])).values());

const RoutePathEditor = ({ form, serviceOptions }: RoutePathEditorProps) => {
  const { styles } = useStyles();
  const paths = (Form.useWatch('paths', form) as IngressRoutePathItem[]) || [];
  const addDisabled = paths.some((path) => !isValidIngressPath(path));
  const serviceSelectOptions = serviceOptions.map(({ label, value }) => ({
    label,
    value,
  }));

  useEffect(() => {
    if (paths.length === 0) {
      form.setFieldValue('paths', [createIngressPathItem()]);
    }
  }, [form, paths.length]);

  const getPortOptions = (serviceName?: string) =>
    getServicePortOptions(
      serviceOptions.find((service) => service.value === serviceName)?.ports,
    );

  return (
    <Form.List
      name="paths"
      rules={[
        {
          validator: async (_, value?: IngressRoutePathItem[]) => {
            if ((value || []).some(isValidIngressPath)) {
              return;
            }
            throw new Error('请添加至少一条路径');
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          <div className={styles.pathRows}>
            {fields.map((field) => {
              const serviceName = paths[field.name]?.serviceName;

              return (
                <div className={styles.pathRow} key={field.key}>
                  <Form.Item
                    className={styles.formItem}
                    name={[field.name, 'path']}
                    rules={[
                      { required: true, message: '请输入路径' },
                      {
                        validator: async (_, value?: string) => {
                          if (!value || value.startsWith('/')) {
                            return;
                          }
                          throw new Error('路径必须以 / 开头');
                        },
                      },
                    ]}
                  >
                    <Input className={styles.control} placeholder="/" />
                  </Form.Item>
                  <Form.Item
                    className={styles.formItem}
                    name={[field.name, 'serviceName']}
                    rules={[{ required: true, message: '请选择服务' }]}
                  >
                    <Select
                      allowClear
                      className={styles.control}
                      optionFilterProp="label"
                      options={serviceSelectOptions}
                      placeholder="服务"
                      showSearch
                      filterOption={(inputValue, option) =>
                        String(option?.label || '')
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                      }
                      onChange={() => {
                        form.setFieldValue(
                          ['paths', field.name, 'servicePort'],
                          undefined,
                        );
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    className={styles.formItem}
                    name={[field.name, 'servicePort']}
                    rules={[
                      { required: true, message: '请选择端口' },
                      {
                        validator: async (_, value?: number | string) => {
                          if (typeof value === 'number') {
                            if (value >= 1 && value <= 65535) {
                              return;
                            }
                            throw new Error('端口范围为 1-65535');
                          }
                          if (value?.trim()) {
                            return;
                          }
                          throw new Error('请选择端口');
                        },
                      },
                    ]}
                  >
                    <Select
                      allowClear
                      className={styles.control}
                      disabled={!serviceName}
                      notFoundContent="暂无端口"
                      optionFilterProp="label"
                      options={getPortOptions(serviceName)}
                      placeholder="端口"
                      showSearch
                    />
                  </Form.Item>
                  <Button
                    aria-label="删除路径"
                    className={styles.deleteButton}
                    icon={<DeleteOutlined />}
                    type="text"
                    onClick={() => remove(field.name)}
                  />
                </div>
              );
            })}
          </div>
          <Form.ErrorList errors={errors} />
          <div className={styles.footer}>
            <Button
              disabled={addDisabled}
              onClick={async () => {
                try {
                  await form.validateFields(
                    fields.flatMap((field) => [
                      ['paths', field.name, 'path'],
                      ['paths', field.name, 'serviceName'],
                      ['paths', field.name, 'servicePort'],
                    ]),
                  );
                  add(createIngressPathItem());
                } catch {
                  // Validation errors are displayed by Form.Item.
                }
              }}
            >
              <PlusOutlined />
              添加
            </Button>
          </div>
        </>
      )}
    </Form.List>
  );
};

export default RoutePathEditor;
