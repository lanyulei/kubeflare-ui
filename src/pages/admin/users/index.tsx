import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components'
import { useIntl } from '@umijs/max'
import { App, Button, Popconfirm, Space, Tag } from 'antd'
import React, { useRef, useState } from 'react'
import {
  createUser,
  deleteUser,
  getUserList,
  updateUser,
} from '@/services/kubeflare/api'

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

const UserAdminPage: React.FC = () => {
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
        id: 'pages.admin.users.username',
        defaultMessage: '用户名',
      }),
      dataIndex: 'username',
    },
    {
      title: intl.formatMessage({
        id: 'pages.admin.users.nickname',
        defaultMessage: '昵称',
      }),
      dataIndex: 'nickname',
    },
    {
      title: intl.formatMessage({
        id: 'pages.admin.users.email',
        defaultMessage: '邮箱',
      }),
      dataIndex: 'email',
      ellipsis: true,
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.admin.users.phone',
        defaultMessage: '手机号',
      }),
      dataIndex: 'phone',
    },
    {
      title: intl.formatMessage({
        id: 'pages.admin.users.role',
        defaultMessage: '角色',
      }),
      dataIndex: 'is_admin',
      render: (_, record) =>
        record.is_admin ? (
          <Tag color="gold">Admin</Tag>
        ) : (
          <Tag>Member</Tag>
        ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.admin.users.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      render: (_, record) =>
        record.status === 1 ? (
          <Tag color="success">
            {intl.formatMessage({
              id: 'pages.admin.users.status.enabled',
              defaultMessage: '启用',
            })}
          </Tag>
        ) : (
          <Tag color="default">
            {intl.formatMessage({
              id: 'pages.admin.users.status.disabled',
              defaultMessage: '禁用',
            })}
          </Tag>
        ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.admin.users.updatedAt',
        defaultMessage: '更新时间',
      }),
      dataIndex: 'update_time',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: intl.formatMessage({
        id: 'pages.admin.users.option',
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
            id: 'pages.admin.users.edit',
            defaultMessage: '编辑',
          })}
        </a>,
        <Popconfirm
          key="delete"
          title={intl.formatMessage({
            id: 'pages.admin.users.delete.confirm',
            defaultMessage: '确认删除该用户吗？',
          })}
          onConfirm={async () => {
            await deleteUser(record.id)
            message.success(
              intl.formatMessage({
                id: 'pages.admin.users.delete.success',
                defaultMessage: '用户已删除',
              }),
            )
            actionRef.current?.reload()
          }}
        >
          <a>
            <DeleteOutlined />{' '}
            {intl.formatMessage({
              id: 'pages.admin.users.delete',
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
        id: 'pages.admin.users.title',
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
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateVisible(true)}
          >
            {intl.formatMessage({
              id: 'pages.admin.users.create',
              defaultMessage: '新建用户',
            })}
          </Button>,
        ]}
      />

      <ModalForm<API.CreateUserParams>
        title={intl.formatMessage({
          id: 'pages.admin.users.create',
          defaultMessage: '新建用户',
        })}
        open={createVisible}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setCreateVisible(false),
        }}
        onFinish={async (values) => {
          await createUser({
            ...values,
            is_admin: values.is_admin ?? false,
            status: Number(values.status ?? 1),
          })
          message.success(
            intl.formatMessage({
              id: 'pages.admin.users.create.success',
              defaultMessage: '用户创建成功',
            }),
          )
          setCreateVisible(false)
          actionRef.current?.reload()
          return true
        }}
      >
        <ProFormText
          name="username"
          label={intl.formatMessage({
            id: 'pages.admin.users.username',
            defaultMessage: '用户名',
          })}
          rules={usernameRules}
        />
        <ProFormText
          name="nickname"
          label={intl.formatMessage({
            id: 'pages.admin.users.nickname',
            defaultMessage: '昵称',
          })}
          rules={[
            { required: true, message: '请输入昵称' },
            { min: 1, max: 64, message: '昵称长度需在 1 到 64 位之间' },
          ]}
        />
        <ProFormText.Password
          name="password"
          label={intl.formatMessage({
            id: 'pages.admin.users.password',
            defaultMessage: '密码',
          })}
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, max: 72, message: '密码长度需在 6 到 72 位之间' },
          ]}
        />
        <ProFormText name="email" label="Email" />
        <ProFormText name="phone" label="Phone" />
        <ProFormText name="avatar" label="Avatar URL" />
        <Space size={24}>
          <ProFormSwitch
            name="is_admin"
            label={intl.formatMessage({
              id: 'pages.admin.users.isAdmin',
              defaultMessage: '管理员',
            })}
          />
          <ProFormSelect
            name="status"
            label={intl.formatMessage({
              id: 'pages.admin.users.status',
              defaultMessage: '状态',
            })}
            valueEnum={{
              1: { text: '启用' },
              0: { text: '禁用' },
            }}
            initialValue={1}
          />
        </Space>
      </ModalForm>

      <ModalForm<API.UpdateUserParams>
        title={intl.formatMessage({
          id: 'pages.admin.users.edit',
          defaultMessage: '编辑用户',
        })}
        open={editVisible}
        initialValues={{
          ...editingUser,
          password: '',
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
            ...values,
            password: values.password || undefined,
            status:
              typeof values.status === 'undefined'
                ? editingUser.status
                : Number(values.status),
          })
          message.success(
            intl.formatMessage({
              id: 'pages.admin.users.edit.success',
              defaultMessage: '用户更新成功',
            }),
          )
          setEditVisible(false)
          setEditingUser(undefined)
          actionRef.current?.reload()
          return true
        }}
      >
        <ProFormText
          name="username"
          label={intl.formatMessage({
            id: 'pages.admin.users.username',
            defaultMessage: '用户名',
          })}
          rules={usernameRules}
        />
        <ProFormText
          name="nickname"
          label={intl.formatMessage({
            id: 'pages.admin.users.nickname',
            defaultMessage: '昵称',
          })}
          rules={[
            { required: true, message: '请输入昵称' },
            { min: 1, max: 64, message: '昵称长度需在 1 到 64 位之间' },
          ]}
        />
        <ProFormText.Password
          name="password"
          label={intl.formatMessage({
            id: 'pages.admin.users.password.optional',
            defaultMessage: '新密码（留空则不修改）',
          })}
          rules={[
            {
              validator: async (_, value) => {
                if (!value) {
                  return
                }
                if (value.length < 6 || value.length > 72) {
                  throw new Error('密码长度需在 6 到 72 位之间')
                }
              },
            },
          ]}
        />
        <ProFormText name="email" label="Email" />
        <ProFormText name="phone" label="Phone" />
        <ProFormText name="avatar" label="Avatar URL" />
        <Space size={24}>
          <ProFormSwitch
            name="is_admin"
            label={intl.formatMessage({
              id: 'pages.admin.users.isAdmin',
              defaultMessage: '管理员',
            })}
          />
          <ProFormSelect
            name="status"
            label={intl.formatMessage({
              id: 'pages.admin.users.status',
              defaultMessage: '状态',
            })}
            valueEnum={{
              1: { text: '启用' },
              0: { text: '禁用' },
            }}
          />
        </Space>
      </ModalForm>
    </PageContainer>
  )
}

export default UserAdminPage
