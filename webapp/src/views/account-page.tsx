import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react'
import {
    Space, Menu as AntMenu, Divider, Segmented, Tabs,
    Typography, Descriptions, Button, Avatar, Tooltip, Tag,
    Upload, Form,
    Input,
    Modal,
    message
} from 'antd'
import { UploadRef } from 'antd/es/upload/Upload'
import { LockOutlined } from '@ant-design/icons'
import { orange } from '@ant-design/colors'
import moment from 'moment'
import { navigate } from '@gatsbyjs/reach-router'
import { Header } from '../components/main-menu/header'
import { useAPI } from '../contexts'
import './account-page.css'

const { Title, Text } = Typography

const AccountMenu = () => {
    const { api } = useAPI()

    return (
        <AntMenu
            mode="horizontal"
            selectedKeys={ [] }
            items={[
                {
                    key: "logout",
                    label: "Logout",
                    onClick: async () => {
                        try {
                            await api.logout()
                        } catch {}
                    }
                },
                {
                    key: "home",
                    label: "Home",
                    onClick: () => navigate("/")
                },
            ]}
            style={{ background: "transparent", width: "100%", justifyContent: "center" }}
        />
    )
}

export const AccountPage = () => {
    const { api, user } = useAPI()

    const [randomHash, setRandomHash] = useState<string>("")
    const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false)

    const [form] = Form.useForm()
    const [messageApi, contextHolder] = message.useMessage()

    const uploadRef = useRef<UploadRef>()
    const uploadAbortController = useRef<AbortController>()
    const passwordAbortController = useRef<AbortController>()

    const roles = useMemo(() => {
        if (!user) return []
        const roles: { name: string, description?: string, color: string }[] = []
        if (user.is_verified) roles.push({
            name: "verified",
            description: "Verified user",
            color: "purple"
        })
        else roles.push({
            name: "unverified",
            description: "You haven't verified your email yet",
            color: "orange"
        })
        if (user.is_superuser) roles.push({
            name: "admin",
            description: "Full access to all administrative functions",
            color: "geekblue"
        })
        return roles
    }, [user])

    const openImageUpload = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (!uploadRef.current) return
        const upload = uploadRef.current.upload as any
        upload.uploader.onClick(e)
    }, [])

    const uploadAvatar = useCallback(async (file: File | null) => {
        if (!user) return
        
        uploadAbortController.current?.abort()
        uploadAbortController.current = new AbortController()
        try {
            if (file) await api.uploadUserAvatar(user.username, file, { signal: uploadAbortController.current.signal })
            else await api.randomizeUserAvatar(user.username, { signal: uploadAbortController.current.signal })
            setRandomHash(Math.random().toString(36).substring(2, 15))
        } catch (e: any) {
            if (!e.isAbort) messageApi.open({
                type: "error",
                content: "Failed to upload avatar!"
            })
        }
    }, [api, user])

    const onFinishPasswordForm = useCallback(async ({ password }) => {
        passwordAbortController.current?.abort()
        passwordAbortController.current = new AbortController()
        try {
            await api.changePassword(password, { signal: passwordAbortController.current.signal })
        } catch (e: any) {
            if (!e.isAbort) messageApi.open({
                type: "error",
                content: "Failed to change password!"
            })
        }
        setShowPasswordModal(false)
    }, [form])

    if (!user) return
    return (
        <Fragment>
            <Space direction="vertical" size="middle" className="account-page">
                <Header subTitle="Account & Settings" size="small" style={{ marginBottom: 16 }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 480 }}>
                    <Descriptions
                        title="Account"
                        items={[
                            {
                                key: "username",
                                label: "Username",
                                children: user.username
                            },
                            {
                                key: "email",
                                label: "Email",
                                children: user.email
                            },
                            {
                                key: "name",
                                label: "Name",
                                children: `${ user.first_name } ${ user.last_name }`
                            },
                            {
                                key: "created_date",
                                label: "Created",
                                children: moment(user.created_at).format("MM/DD/YY")
                            }
                        ]}
                        column={ 2 }
                        bordered
                        size="small"
                    />
                    <Space size={[ 0, 8 ]} wrap style={{ width: "100%", marginTop: 8 }}>
                        { roles.map((role, i) => (
                            <Tooltip title={ role.description } placement="bottom">
                                <Tag color={ role.color }>{ role.name }</Tag>
                            </Tooltip>
                        )) }
                    </Space>
                    <div className="avatar-section" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <Title level={ 5 } style={{ marginTop: 0 }}>Profile Picture</Title>
                        <Upload
                            ref={ uploadRef }
                            accept="image/jpeg, image/png"
                            showUploadList={ false }
                            customRequest={ ({ file }: any) => uploadAvatar(file) }
                            style={{ display: "none" }}
                        />
                        <Avatar
                            size={ 48 }
                            src={ `${ api.apiUrl }users/${ user.username }/avatar?${ randomHash }` }
                            onClick={ openImageUpload }
                            style={{ marginTop: 8, cursor: "pointer" }}
                        />
                        <Button
                            className="btn-secondary"
                            type="primary"
                            size="small"
                            onClick={ () => uploadAvatar(null) }
                            style={{ marginTop: 16 }}
                        >
                            Randomize
                        </Button>
                    </div>
                    <div className="password-section">
                        <Title level={ 5 } style={{ marginTop: 0 }}>Password</Title>
                        <Button type="link" size="small" onClick={ () => setShowPasswordModal(true) } style={{ padding: 0 }}>
                            Change password
                        </Button>
                    </div>
                    <AccountMenu />
                </div>
            </Space>
            <Modal
                title="Change password"
                open={ showPasswordModal }
                onOk={ () => form.submit() }
                onCancel={ () => setShowPasswordModal(false) }
                cancelButtonProps={{ type: "text" }}
                destroyOnClose
            >
                 <Form
                    form={ form }
                    onFinish={ onFinishPasswordForm }
                    validateTrigger="onBlur"
                    layout="vertical"
                    clearOnDestroy
                >
                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: `Please enter a new password!` },
                            { min: 4, message: "Your password must be at least 4 characters!" },
                            { max: 100, message: "Your password cannot be more than 100 characters!" }
                        ]}
                    >
                        <Input.Password
                            prefix={ <LockOutlined style={{ marginRight: 4 }} /> }
                            type="password"
                            placeholder="Password"
                        />
                </Form.Item>
                    <Form.Item
                        name="confirm_password"
                        dependencies={["password"]}
                        rules={[
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) return Promise.resolve()
                                    return Promise.reject(new Error("The passwords you entered do not match!"))
                                }
                            })
                        ]}
                    >
                        <Input.Password
                            prefix={ <LockOutlined style={{ marginRight: 4 }} /> }
                            type="password"
                            placeholder="Confirm password"
                        />
                    </Form.Item>
                </Form>
            </Modal>
            { contextHolder }
        </Fragment>
    )
}