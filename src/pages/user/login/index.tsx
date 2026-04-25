import {
  KeyOutlined,
  LockOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import {
  FormattedMessage,
  Helmet,
  history,
  SelectLang,
  useIntl,
  useModel,
} from '@umijs/max';
import { Alert, App, Button } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { Footer } from '@/components';
import { getCaptcha, login } from '@/services/kubeflare/user/login';
import { setAuthSession } from '@/utils/auth';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => {
  return {
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
    extraAction: {
      display: 'flex',
      gap: 12,
      marginBottom: 24,
      color: token.colorTextSecondary,
      fontSize: 12,
    },
    captchaImage: {
      display: 'block',
      width: 120,
      height: 40,
      objectFit: 'cover',
      cursor: 'pointer',
    },
  };
});

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const getSafeRedirect = () => {
  const redirect = new URL(window.location.href).searchParams.get('redirect');

  if (
    !redirect?.startsWith('/') ||
    redirect.startsWith('//') ||
    redirect.startsWith('/user/login')
  ) {
    return '/';
  }

  return redirect;
};

const Login: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string>();
  const [captcha, setCaptcha] = useState<API.CaptchaData>();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const res = await getCaptcha({
        skipErrorHandler: true,
      });
      setCaptcha(res.data);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.info?.message ||
          intl.formatMessage({
            id: 'pages.login.captcha.loadFailed',
            defaultMessage: '验证码加载失败，请稍后重试',
          }),
      );
    } finally {
      setCaptchaLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleLoginSubmit = async (values: API.LoginParams) => {
    try {
      setErrorMessage(undefined);
      const res = await login(
        {
          ...values,
          captcha_id: showCaptcha ? captcha?.id : undefined,
        },
        {
          skipErrorHandler: true,
        },
      );
      setAuthSession(res.data);
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: res.data.user,
        }));
      });
      message.success(
        intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        }),
      );
      void fetchUserInfo();
      history.replace(getSafeRedirect());
      return true;
    } catch (error: any) {
      const responseMessage =
        error?.response?.data?.message ||
        error?.info?.message ||
        error?.message;
      const normalizedMessage = String(responseMessage || '').toLowerCase();

      if (normalizedMessage.includes('captcha')) {
        setShowCaptcha(true);
        void fetchCaptcha();
      }

      if (normalizedMessage.includes('mfa')) {
        setShowMfa(true);
      }

      setErrorMessage(
        responseMessage ||
          intl.formatMessage({
            id: 'pages.login.failure',
            defaultMessage: '登录失败，请重试！',
          }),
      );
      return false;
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: '登录页',
          })}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <Lang />
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="Kubeflare"
          subTitle={intl.formatMessage({
            id: 'pages.layouts.userLayout.title',
            defaultMessage: 'Kubeflare 企业后台管理系统',
          })}
          submitter={{
            searchConfig: {
              submitText: intl.formatMessage({
                id: 'pages.login.submit',
                defaultMessage: '登录',
              }),
            },
          }}
          onFinish={async (values) =>
            handleLoginSubmit(values as API.LoginParams)
          }
        >
          {errorMessage && <LoginMessage content={errorMessage} />}
          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder={intl.formatMessage({
              id: 'pages.login.username.placeholder',
              defaultMessage: '请输入用户名',
            })}
            rules={[
              {
                required: true,
                message: (
                  <FormattedMessage
                    id="pages.login.username.required"
                    defaultMessage="请输入用户名!"
                  />
                ),
              },
              {
                min: 3,
                max: 64,
                message: intl.formatMessage({
                  id: 'pages.login.username.length',
                  defaultMessage: '用户名长度需在 3 到 64 位之间',
                }),
              },
            ]}
          />
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder={intl.formatMessage({
              id: 'pages.login.password.placeholder',
              defaultMessage: '请输入密码',
            })}
            rules={[
              {
                required: true,
                message: (
                  <FormattedMessage
                    id="pages.login.password.required"
                    defaultMessage="请输入密码！"
                  />
                ),
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
          {showCaptcha && (
            <ProFormText
              name="captcha_code"
              fieldProps={{
                size: 'large',
                prefix: <SafetyCertificateOutlined />,
                addonAfter: captcha?.image_url ? (
                  <img
                    alt={intl.formatMessage({
                      id: 'pages.login.captcha.imageAlt',
                      defaultMessage: '验证码',
                    })}
                    className={styles.captchaImage}
                    src={captcha.image_url}
                    onClick={fetchCaptcha}
                  />
                ) : (
                  <Button
                    icon={<ReloadOutlined />}
                    loading={captchaLoading}
                    type="link"
                    onClick={fetchCaptcha}
                  />
                ),
              }}
              placeholder={intl.formatMessage({
                id: 'pages.login.captcha.placeholder',
                defaultMessage: '请输入验证码',
              })}
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.login.captcha.required"
                      defaultMessage="请输入验证码！"
                    />
                  ),
                },
              ]}
            />
          )}
          {showMfa && (
            <ProFormText
              name="otp_code"
              fieldProps={{
                size: 'large',
                prefix: <KeyOutlined />,
              }}
              placeholder={intl.formatMessage({
                id: 'pages.login.mfa.placeholder',
                defaultMessage: '请输入 MFA 动态码',
              })}
              rules={[
                {
                  required: true,
                  message: (
                    <FormattedMessage
                      id="pages.login.mfa.required"
                      defaultMessage="请输入 MFA 动态码！"
                    />
                  ),
                },
                {
                  len: 6,
                  message: intl.formatMessage({
                    id: 'pages.login.mfa.length',
                    defaultMessage: 'MFA 动态码为 6 位数字',
                  }),
                },
              ]}
            />
          )}
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
