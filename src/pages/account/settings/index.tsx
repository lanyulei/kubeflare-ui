import {
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormText,
} from '@ant-design/pro-components';
import { useIntl, useModel } from '@umijs/max';
import { createStyles } from 'antd-style';
import type { UploadFile, UploadProps } from 'antd';
import {
  App,
  Button,
  Col,
  Modal,
  QRCode,
  Row,
  Space,
  Typography,
  Upload,
} from 'antd';
import React, { useState } from 'react';
import {
  confirmCurrentUserMfa,
  disableCurrentUserMfa,
  setupCurrentUserMfa,
  uploadFile,
  updateCurrentUser,
  updateCurrentUserPassword,
} from '@/services/kubeflare/api';

type UpdateCurrentUserFormValues = API.UpdateCurrentUserParams & {
  avatar_upload?: UploadFile<API.UploadFileData>[];
};

type UpdatePasswordFormValues = API.UpdateCurrentUserPasswordParams & {
  confirm_password: string;
};

const avatarUploadProps: UploadProps = {
  accept: 'image/*',
  listType: 'picture-card',
  maxCount: 1,
  name: 'file',
  beforeUpload: (file) => {
    const isSupportedImage = [
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp',
    ].includes(file.type);

    return isSupportedImage || Upload.LIST_IGNORE;
  },
  customRequest: async ({ file, onError, onSuccess }) => {
    try {
      const formData = new FormData();
      formData.append('file', file as File);
      const res = await uploadFile('avatar', formData);
      onSuccess?.(res.data);
    } catch (error) {
      onError?.(error as Error);
    }
  },
};

const getInitialAvatarUpload = (avatar?: string) =>
  avatar
    ? [
        {
          uid: 'avatar',
          name: 'avatar',
          status: 'done' as const,
          url: avatar,
        },
      ]
    : [];

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim();
  return nextValue || undefined;
};

const getAvatarValue = (values: UpdateCurrentUserFormValues) => {
  const avatarFile = values.avatar_upload?.[0];
  if (avatarFile?.status !== 'done') {
    return undefined;
  }

  return normalizeOptionalText(avatarFile.response?.url || avatarFile.url);
};

const buildUpdateCurrentUserPayload = (
  values: UpdateCurrentUserFormValues,
): API.UpdateCurrentUserParams => ({
  nickname: values.nickname.trim(),
  email: normalizeOptionalText(values.email),
  phone: normalizeOptionalText(values.phone),
  avatar: getAvatarValue(values),
});

const useStyles = createStyles(() => ({
  mfaSetupContent: {
    width: '100%',
  },
  mfaQrCode: {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
  },
  mfaSecret: {
    width: '100%',
    marginBottom: 0,
    textAlign: 'center',
  },
}));

const AccountSettingsPage: React.FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [mfaSetup, setMfaSetup] = useState<API.SetupMfaData>();
  const [mfaConfirmOpen, setMfaConfirmOpen] = useState(false);
  const [mfaDisableOpen, setMfaDisableOpen] = useState(false);

  const updateMfaState = (enabled: boolean) => {
    setInitialState((state) => ({
      ...state,
      currentUser: state?.currentUser
        ? {
            ...state.currentUser,
            mfa_enabled: enabled,
          }
        : state?.currentUser,
    }));
  };

  const startMfaSetup = async () => {
    const res = await setupCurrentUserMfa();
    setMfaSetup(res.data);
    setMfaConfirmOpen(true);
  };

  const closeMfaConfirm = () => {
    setMfaConfirmOpen(false);
    setMfaSetup(undefined);
  };

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'pages.account.settings.title',
        defaultMessage: '个人设置',
      })}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <ProCard
            title={intl.formatMessage({
              id: 'pages.account.settings.profile',
              defaultMessage: '基本信息',
            })}
          >
            <ProForm<UpdateCurrentUserFormValues>
              submitter={{
                searchConfig: {
                  submitText: intl.formatMessage({
                    id: 'pages.account.settings.save',
                    defaultMessage: '保存信息',
                  }),
                },
              }}
              initialValues={{
                nickname: currentUser?.nickname,
                email: currentUser?.email,
                phone: currentUser?.phone,
                avatar_upload: getInitialAvatarUpload(currentUser?.avatar),
              }}
              onFinish={async (values) => {
                const res = await updateCurrentUser(
                  buildUpdateCurrentUserPayload(values),
                );
                setInitialState((state) => ({
                  ...state,
                  currentUser: res.data,
                }));
                message.success(
                  intl.formatMessage({
                    id: 'pages.account.settings.saveSuccess',
                    defaultMessage: '个人信息已更新',
                  }),
                );
                return true;
              }}
            >
              <ProFormText
                name="nickname"
                label={intl.formatMessage({
                  id: 'pages.account.settings.nickname',
                  defaultMessage: '昵称',
                })}
                fieldProps={{
                  prefix: <UserOutlined />,
                }}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.account.settings.nickname.required',
                      defaultMessage: '请输入昵称',
                    }),
                  },
                  {
                    min: 1,
                    max: 64,
                    message: intl.formatMessage({
                      id: 'pages.account.settings.nickname.length',
                      defaultMessage: '昵称长度需在 1 到 64 位之间',
                    }),
                  },
                ]}
              />
              <ProFormText
                readonly
                label={intl.formatMessage({
                  id: 'pages.account.settings.username',
                  defaultMessage: '用户名',
                })}
                fieldProps={{
                  prefix: <UserOutlined />,
                  value: currentUser?.username,
                }}
              />
              <ProFormText
                name="email"
                label={intl.formatMessage({
                  id: 'pages.account.settings.email',
                  defaultMessage: '邮箱',
                })}
                fieldProps={{
                  prefix: <MailOutlined />,
                }}
                rules={[
                  {
                    type: 'email',
                    message: intl.formatMessage({
                      id: 'pages.account.settings.email.invalid',
                      defaultMessage: '请输入合法的邮箱地址',
                    }),
                  },
                ]}
              />
              <ProFormText
                name="phone"
                label={intl.formatMessage({
                  id: 'pages.account.settings.phone',
                  defaultMessage: '手机号',
                })}
                fieldProps={{
                  prefix: <PhoneOutlined />,
                }}
              />
              <ProForm.Item
                name="avatar_upload"
                label={intl.formatMessage({
                  id: 'pages.account.settings.avatar',
                  defaultMessage: '头像',
                })}
                valuePropName="fileList"
                getValueFromEvent={(event: {
                  fileList?: UploadFile<API.UploadFileData>[];
                }) => event?.fileList}
                rules={[
                  {
                    validator: async (
                      _rule: unknown,
                      fileList?: UploadFile<API.UploadFileData>[],
                    ) => {
                      const avatarFile = fileList?.[0];
                      if (!avatarFile) {
                        return;
                      }
                      if (avatarFile.status === 'uploading') {
                        throw new Error('头像上传中，请稍后再提交');
                      }
                      if (avatarFile.status === 'error') {
                        throw new Error('头像上传失败，请重新上传');
                      }
                      if (
                        avatarFile.status === 'done' &&
                        !normalizeOptionalText(
                          avatarFile.response?.url || avatarFile.url,
                        )
                      ) {
                        throw new Error('头像上传结果无效，请重新上传');
                      }
                    },
                  },
                ]}
              >
                <Upload {...avatarUploadProps}>
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>
                      {intl.formatMessage({
                        id: 'pages.account.settings.avatar.upload',
                        defaultMessage: '上传头像',
                      })}
                    </div>
                  </div>
                </Upload>
              </ProForm.Item>
            </ProForm>
          </ProCard>
        </Col>
        <Col xs={24} xl={10}>
          <ProCard
            title={intl.formatMessage({
              id: 'pages.account.settings.password',
              defaultMessage: '修改密码',
            })}
          >
            <ProForm<UpdatePasswordFormValues>
              submitter={{
                searchConfig: {
                  submitText: intl.formatMessage({
                    id: 'pages.account.settings.password.save',
                    defaultMessage: '更新密码',
                  }),
                },
              }}
              onFinish={async (values) => {
                const { confirm_password: _confirmPassword, ...params } =
                  values;
                await updateCurrentUserPassword(params);
                message.success(
                  intl.formatMessage({
                    id: 'pages.account.settings.password.success',
                    defaultMessage: '密码已更新',
                  }),
                );
                return true;
              }}
            >
              <ProFormText.Password
                name="old_password"
                label={intl.formatMessage({
                  id: 'pages.account.settings.password.old',
                  defaultMessage: '旧密码',
                })}
                fieldProps={{
                  prefix: <LockOutlined />,
                }}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.account.settings.password.old.required',
                      defaultMessage: '请输入旧密码',
                    }),
                  },
                ]}
              />
              <ProFormText.Password
                name="new_password"
                label={intl.formatMessage({
                  id: 'pages.account.settings.password.new',
                  defaultMessage: '新密码',
                })}
                fieldProps={{
                  prefix: <LockOutlined />,
                }}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.account.settings.password.new.required',
                      defaultMessage: '请输入新密码',
                    }),
                  },
                  {
                    min: 6,
                    max: 72,
                    message: intl.formatMessage({
                      id: 'pages.login.password.length',
                      defaultMessage: '密码长度需在 6 到 72 位之间',
                    }),
                  },
                ]}
              />
              <ProFormText.Password
                name="confirm_password"
                dependencies={['new_password']}
                label={intl.formatMessage({
                  id: 'pages.account.settings.password.confirm',
                  defaultMessage: '确认新密码',
                })}
                fieldProps={{
                  prefix: <LockOutlined />,
                }}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'pages.account.settings.password.confirm.required',
                      defaultMessage: '请再次输入新密码',
                    }),
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          intl.formatMessage({
                            id: 'pages.account.settings.password.confirm.mismatch',
                            defaultMessage: '两次输入的新密码不一致',
                          }),
                        ),
                      );
                    },
                  }),
                ]}
              />
            </ProForm>
          </ProCard>
          <ProCard
            style={{
              marginTop: 16,
            }}
            title={intl.formatMessage({
              id: 'pages.account.settings.mfa',
              defaultMessage: '多因素认证',
            })}
          >
            <Space direction="vertical" size={16}>
              <Typography.Text type="secondary">
                {currentUser?.mfa_enabled
                  ? intl.formatMessage({
                      id: 'pages.account.settings.mfa.enabled',
                      defaultMessage: '当前账号已开启 MFA。',
                    })
                  : intl.formatMessage({
                      id: 'pages.account.settings.mfa.disabled',
                      defaultMessage: '当前账号未开启 MFA。',
                    })}
              </Typography.Text>
              {currentUser?.mfa_enabled ? (
                <Button danger onClick={() => setMfaDisableOpen(true)}>
                  {intl.formatMessage({
                    id: 'pages.account.settings.mfa.disable',
                    defaultMessage: '关闭 MFA',
                  })}
                </Button>
              ) : (
                <Button type="primary" onClick={startMfaSetup}>
                  {intl.formatMessage({
                    id: 'pages.account.settings.mfa.enable',
                    defaultMessage: '开启 MFA',
                  })}
                </Button>
              )}
            </Space>
          </ProCard>
        </Col>
      </Row>
      <Modal
        destroyOnClose
        footer={null}
        open={mfaConfirmOpen}
        title={intl.formatMessage({
          id: 'pages.account.settings.mfa.confirmTitle',
          defaultMessage: '确认 MFA',
        })}
        onCancel={closeMfaConfirm}
      >
        <Space className={styles.mfaSetupContent} direction="vertical" size={16}>
          {mfaSetup?.otp_auth_url && (
            <div className={styles.mfaQrCode}>
              <QRCode size={180} value={mfaSetup.otp_auth_url} />
            </div>
          )}
          {mfaSetup?.secret && (
            <Typography.Paragraph className={styles.mfaSecret} copyable>
              {mfaSetup.secret}
            </Typography.Paragraph>
          )}
          <ProForm<API.ConfirmMfaParams>
            submitter={{
              searchConfig: {
                submitText: intl.formatMessage({
                  id: 'pages.account.settings.mfa.confirm',
                  defaultMessage: '确认开启',
                }),
              },
            }}
            onFinish={async (values) => {
              await confirmCurrentUserMfa(values);
              updateMfaState(true);
              closeMfaConfirm();
              message.success(
                intl.formatMessage({
                  id: 'pages.account.settings.mfa.enableSuccess',
                  defaultMessage: 'MFA 已开启',
                }),
              );
              return true;
            }}
          >
            <ProFormText
              name="otp_code"
              label={intl.formatMessage({
                id: 'pages.account.settings.mfa.otp',
                defaultMessage: '动态码',
              })}
              fieldProps={{
                prefix: <KeyOutlined />,
              }}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pages.account.settings.mfa.otp.required',
                    defaultMessage: '请输入动态码',
                  }),
                },
              ]}
            />
          </ProForm>
        </Space>
      </Modal>
      <Modal
        destroyOnClose
        footer={null}
        open={mfaDisableOpen}
        title={intl.formatMessage({
          id: 'pages.account.settings.mfa.disableTitle',
          defaultMessage: '关闭 MFA',
        })}
        onCancel={() => setMfaDisableOpen(false)}
      >
        <ProForm<API.DisableMfaParams>
          submitter={{
            searchConfig: {
              submitText: intl.formatMessage({
                id: 'pages.account.settings.mfa.disableConfirm',
                defaultMessage: '确认关闭',
              }),
            },
          }}
          onFinish={async (values) => {
            await disableCurrentUserMfa(values);
            updateMfaState(false);
            setMfaDisableOpen(false);
            message.success(
              intl.formatMessage({
                id: 'pages.account.settings.mfa.disableSuccess',
                defaultMessage: 'MFA 已关闭',
              }),
            );
            return true;
          }}
        >
          <ProFormText.Password
            name="password"
            label={intl.formatMessage({
              id: 'pages.account.settings.mfa.password',
              defaultMessage: '当前密码',
            })}
            fieldProps={{
              prefix: <LockOutlined />,
            }}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.account.settings.mfa.password.required',
                  defaultMessage: '请输入当前密码',
                }),
              },
            ]}
          />
          <ProFormText
            name="otp_code"
            label={intl.formatMessage({
              id: 'pages.account.settings.mfa.otp',
              defaultMessage: '动态码',
            })}
            fieldProps={{
              prefix: <SafetyCertificateOutlined />,
            }}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'pages.account.settings.mfa.otp.required',
                  defaultMessage: '请输入动态码',
                }),
              },
            ]}
          />
        </ProForm>
      </Modal>
    </PageContainer>
  );
};

export default AccountSettingsPage;
