import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { useIntl } from '@umijs/max'
import type { UploadFile, UploadProps } from 'antd'
import { App, Button, Col, Popconfirm, Row, Tag, Upload } from 'antd'
import React, { useRef, useState } from 'react'
import {
  createUser,
  deleteUser,
  getUserList,
  updateUser,
} from '@/services/kubeflare/system/users'
import { uploadFile } from '@/services/kubeflare/upload'

const usernameRules = [
  {
    required: true,
    message: '请输入用户名',
  },
  {
    min: 3,
    max: 64,
    message: '用户名长度需在 3 到 64 位之间',
  },
  {
    pattern: /^[A-Za-z0-9._-]+$/,
    message: '用户名仅支持字母、数字、点、下划线和中划线',
  },
]

type UserFormValues = API.CreateUserParams &
  API.UpdateUserParams & {
    confirm_password?: string
    avatar_upload?: UploadFile<API.UploadFileData>[]
  }

const passwordRules = [
  { required: true, message: '请输入密码' },
  { min: 6, max: 72, message: '密码长度需在 6 到 72 位之间' },
]


const nicknameRules = [
  { required: true, message: '请输入昵称' },
  { min: 1, max: 64, message: '昵称长度需在 1 到 64 位之间' },
]

const emailRules = [
  {
    type: 'email' as const,
    message: '请输入合法的邮箱地址',
  },
]

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
    ].includes(file.type)

    return isSupportedImage || Upload.LIST_IGNORE
  },
  customRequest: async ({ file, onError, onSuccess }) => {
    try {
      const formData = new FormData()
      formData.append('file', file as File)
      const res = await uploadFile('avatar', formData)
      onSuccess?.(res.data)
    } catch (error) {
      onError?.(error as Error)
    }
  },
}

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
    : []

const normalizeOptionalText = (value?: string) => {
  const nextValue = value?.trim()
  return nextValue || undefined
}

const getAvatarValue = (values: UserFormValues) => {
  const avatarFile = values.avatar_upload?.[0]
  if (avatarFile?.status !== 'done') {
    return undefined
  }

  return normalizeOptionalText(avatarFile.response?.url || avatarFile.url)
}

const buildBaseUserPayload = (values: UserFormValues) => {
  return {
    username: values.username.trim(),
    nickname: values.nickname.trim(),
    email: normalizeOptionalText(values.email),
    phone: normalizeOptionalText(values.phone),
    avatar: getAvatarValue(values),
    remarks: normalizeOptionalText(values.remarks),
    status: Number(values.status ?? 1),
  }
}

const buildCreateUserPayload = (values: UserFormValues): API.CreateUserParams => ({
  ...buildBaseUserPayload(values),
  password: values.password.trim(),
})

const buildUpdateUserPayload = (values: UserFormValues): API.UpdateUserParams => ({
  ...buildBaseUserPayload(values),
  password: normalizeOptionalText(values.password),
})

const renderUserFormFields = (intl: ReturnType<typeof useIntl>, isEdit = false) => (
  <>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormText
          name="username"
          label={intl.formatMessage({
            id: 'pages.system.users.username',
            defaultMessage: '用户名',
          })}
          rules={usernameRules}
        />
      </Col>
      <Col xs={24} md={12}>
        <ProFormText
          name="nickname"
          label={intl.formatMessage({
            id: 'pages.system.users.nickname',
            defaultMessage: '昵称',
          })}
          rules={nicknameRules}
        />
      </Col>
    </Row>
    {!isEdit && (
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormText.Password
          name="password"
          label={intl.formatMessage({
            id: 'pages.system.users.password',
            defaultMessage: '密码',
          })}
          rules={passwordRules}
        />
      </Col>
      <Col xs={24} md={12}>
        <ProFormText.Password
          name="confirm_password"
          dependencies={['password']}
          label={intl.formatMessage({
            id: 'pages.system.users.password.confirm',
            defaultMessage: '确认密码',
          })}
          rules={[
            ({ getFieldValue }) => ({
              validator: async (_, value) => {
                const password = getFieldValue('password')
                if (!password && !value) {
                  return
                }
                if (!value) {
                  throw new Error('请再次输入密码')
                }
                if (password !== value) {
                  throw new Error('两次输入的密码不一致')
                }
              },
            }),
          ]}
        />
      </Col>
    </Row>
    )}
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormText
          name="email"
          label={intl.formatMessage({
            id: 'pages.system.users.email',
            defaultMessage: '邮箱',
          })}
          rules={emailRules}
        />
      </Col>
      <Col xs={24} md={12}>
        <ProFormText
          name="phone"
          label={intl.formatMessage({
            id: 'pages.system.users.phone',
            defaultMessage: '手机号',
          })}
        />
      </Col>
    </Row>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <ProFormRadio.Group
          name="status"
          label={intl.formatMessage({
            id: 'pages.system.users.status',
            defaultMessage: '状态',
          })}
          options={[
            {
              label: intl.formatMessage({
                id: 'pages.system.users.status.enabled',
                defaultMessage: '启用',
              }),
              value: 1,
            },
            {
              label: intl.formatMessage({
                id: 'pages.system.users.status.disabled',
                defaultMessage: '禁用',
              }),
              value: 0,
            },
          ]}
          initialValue={1}
        />
      </Col>
    </Row>
    <ProForm.Item
      name="avatar_upload"
      label={intl.formatMessage({
        id: 'pages.system.users.avatar',
        defaultMessage: '头像',
      })}
      valuePropName="fileList"
      getValueFromEvent={(event: {
        fileList?: UploadFile<API.UploadFileData>[]
      }) => event?.fileList}
      rules={[
        {
          validator: async (
            _rule: unknown,
            fileList?: UploadFile<API.UploadFileData>[],
          ) => {
            const avatarFile = fileList?.[0]
            if (!avatarFile) {
              return
            }
            if (avatarFile.status === 'uploading') {
              throw new Error('头像上传中，请稍后再提交')
            }
            if (avatarFile.status === 'error') {
              throw new Error('头像上传失败，请重新上传')
            }
            if (
              avatarFile.status === 'done' &&
              !normalizeOptionalText(avatarFile.response?.url || avatarFile.url)
            ) {
              throw new Error('头像上传结果无效，请重新上传')
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
              id: 'pages.system.users.avatar.upload',
              defaultMessage: '上传头像',
            })}
          </div>
        </div>
      </Upload>
    </ProForm.Item>
    <ProFormTextArea
      name="remarks"
      label={intl.formatMessage({
        id: 'pages.system.users.remark',
        defaultMessage: '备注',
      })}
      fieldProps={{
        rows: 3,
        maxLength: 256,
        showCount: true,
      }}
    />
  </>
)

const UserManagementPage: React.FC = () => {
  const intl = useIntl()
  const { message } = App.useApp()
  const actionRef = useRef<ActionType | null>(null)
  const [editingUser, setEditingUser] = useState<API.UserItem | undefined>(
    undefined,
  )
  const [createVisible, setCreateVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)

  const columns: ProColumns<API.UserItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.system.users.username',
        defaultMessage: '用户名',
      }),
      dataIndex: 'username',
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.users.nickname',
        defaultMessage: '昵称',
      }),
      dataIndex: 'nickname',
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.users.email',
        defaultMessage: '邮箱',
      }),
      dataIndex: 'email',
      ellipsis: true,
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.users.phone',
        defaultMessage: '手机号',
      }),
      dataIndex: 'phone',
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.users.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      render: (_, record) =>
        record.status === 1 ? (
          <Tag color="success">
            {intl.formatMessage({
              id: 'pages.system.users.status.enabled',
              defaultMessage: '启用',
            })}
          </Tag>
        ) : (
          <Tag color="default">
            {intl.formatMessage({
              id: 'pages.system.users.status.disabled',
              defaultMessage: '禁用',
            })}
          </Tag>
        ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.users.updatedAt',
        defaultMessage: '更新时间',
      }),
      dataIndex: 'update_time',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: intl.formatMessage({
        id: 'pages.system.users.option',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      key: 'option',
      width: 220,
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setEditingUser(record)
            setEditVisible(true)
          }}
        >
          <EditOutlined />{' '}
          {intl.formatMessage({
            id: 'pages.system.users.edit',
            defaultMessage: '编辑',
          })}
        </a>,
        <Popconfirm
          key="delete"
          title={intl.formatMessage({
            id: 'pages.system.users.delete.confirm',
            defaultMessage: '确认删除该用户吗？',
          })}
          onConfirm={async () => {
            await deleteUser(record.id)
            message.success(
              intl.formatMessage({
                id: 'pages.system.users.delete.success',
                defaultMessage: '用户已删除',
              }),
            )
            actionRef.current?.reload()
          }}
        >
          <a>
            <DeleteOutlined />{' '}
            {intl.formatMessage({
              id: 'pages.system.users.delete',
              defaultMessage: '删除',
            })}
          </a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'pages.system.users.title',
        defaultMessage: '用户管理',
      })}
    >
      <ProTable<API.UserItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        request={async () => {
          const res = await getUserList()
          return {
            data: res.data.items || [],
            success: true,
          }
        }}
        headerTitle={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateVisible(true)}
          >
            {intl.formatMessage({
              id: 'pages.system.users.create',
              defaultMessage: '新建用户',
            })}
          </Button>
        }
      />

      <ModalForm<UserFormValues>
        title={intl.formatMessage({
          id: 'pages.system.users.create',
          defaultMessage: '新建用户',
        })}
        open={createVisible}
        width={650}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setCreateVisible(false),
        }}
        initialValues={{
          status: 1,
        }}
        onFinish={async (values) => {
          await createUser(buildCreateUserPayload(values))
          message.success(
            intl.formatMessage({
              id: 'pages.system.users.create.success',
              defaultMessage: '用户创建成功',
            }),
          )
          setCreateVisible(false)
          actionRef.current?.reload()
          return true
        }}
      >
        {renderUserFormFields(intl)}
      </ModalForm>

      <ModalForm<UserFormValues>
        title={intl.formatMessage({
          id: 'pages.system.users.edit',
          defaultMessage: '编辑用户',
        })}
        open={editVisible}
        width={650}
        initialValues={{
          ...editingUser,
          password: '',
          confirm_password: '',
          avatar_upload: getInitialAvatarUpload(editingUser?.avatar),
        }}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => {
            setEditVisible(false)
            setEditingUser(undefined)
          },
        }}
        onFinish={async (values) => {
          if (!editingUser) {
            return false
          }
          await updateUser(editingUser.id, {
            ...buildUpdateUserPayload(values),
            status:
              typeof values.status === 'undefined'
                ? editingUser.status
                : Number(values.status),
          })
          message.success(
            intl.formatMessage({
              id: 'pages.system.users.edit.success',
              defaultMessage: '用户更新成功',
            }),
          )
          setEditVisible(false)
          setEditingUser(undefined)
          actionRef.current?.reload()
          return true
        }}
      >
        {renderUserFormFields(intl, true)}
      </ModalForm>
    </PageContainer>
  )
}

export default UserManagementPage
