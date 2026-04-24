import {
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  PictureOutlined,
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
import { App, Button, Col, Modal, QRCode, Row, Space, Typography } from 'antd';
import React, { useState } from 'react';
import {
  confirmCurrentUserMfa,
  disableCurrentUserMfa,
  setupCurrentUserMfa,
  updateCurrentUser,
  updateCurrentUserPassword,
} from '@/services/kubeflare/api';

const AccountSettingsPage: React.FC = () => {
  const intl = useIntl();
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
            <ProForm<API.UpdateCurrentUserParams>
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
                avatar: currentUser?.avatar,
              }}
              onFinish={async (values) => {
                const res = await updateCurrentUser(values);
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
              <ProFormText
                name="avatar"
                label={intl.formatMessage({
                  id: 'pages.account.settings.avatar',
                  defaultMessage: '头像地址',
                })}
                fieldProps={{
                  prefix: <PictureOutlined />,
                }}
              />
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
            <ProForm<API.UpdateCurrentUserPasswordParams>
              submitter={{
                searchConfig: {
                  submitText: intl.formatMessage({
                    id: 'pages.account.settings.password.save',
                    defaultMessage: '更新密码',
                  }),
                },
              }}
              onFinish={async (values) => {
                await updateCurrentUserPassword(values);
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
        <Space direction="vertical" size={16}>
          {mfaSetup?.otp_auth_url && (
            <QRCode size={180} value={mfaSetup.otp_auth_url} />
          )}
          {mfaSetup?.secret && (
            <Typography.Paragraph copyable>
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
