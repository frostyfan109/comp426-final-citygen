import { useCallback, useMemo, useRef, useState } from 'react'
import { Alert, Button, Checkbox, Form, Input, Result, Typography } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons'
import { Redirect, Link, navigate } from '@gatsbyjs/reach-router'
import classNames from 'classnames'
import { useAPI } from '../contexts'
import { Header } from '../components/main-menu'
import { APIRequestError, APIResponseError } from '../api'
import './login-page.css'

const { Text } = Typography

interface LoginPageProps {
    register?: boolean
}

export const LoginPage = ({ register=false }: LoginPageProps) => {
    const { loggedIn, api } = useAPI()
    const [generalError, setGeneralError] = useState<string|null>(null)

    const [form] = Form.useForm()
    const abortController = useRef<AbortController>()

    const onFinish = useCallback(async (values) => {
        setGeneralError(null)
        
        abortController.current?.abort()
        abortController.current = new AbortController()

        if (register) {
            const { username, email, first_name, last_name, password } = values
            try {
                await api.register(username, email, first_name, last_name, password, {
                    signal: abortController.current.signal
                })
            } catch (e: any) {
                if (e.isAbort) return
                if (e instanceof APIResponseError) {
                    if (e.detail === "USER__USERNAME_ALREADY_EXISTS") form.setFields([{
                        name: "username",
                        errors: [e.message]
                    }])
                    else if (e.detail === "USER__EMAIL_ALREADY_EXISTS") form.setFields([{
                        name: "email",
                        errors: [e.message]
                    }])
                    else if (e.detail === "USER_PASSWORD_TOO_SHORT") form.setFields([{
                        name: "password",
                        errors: [e.message]
                    }])
                } else setGeneralError("Something went wrong...")
            }
        } else {
            const { email, password } = values
            try {
                await api.login(email, password, {
                    signal: abortController.current.signal
                })
            } catch (e: any) {
                if (e.isAbort) return
                if (e instanceof APIResponseError) {
                    if (e.detail === "USER__INVALID_CREDENTIALS") form.setFields([{
                        name: "password",
                        errors: [e.message]
                    }])
                    else if (e.detail === "USER__DOES_NOT_EXIST") form.setFields([{
                        name: "email",
                        errors: [e.message]
                    }])
                } else setGeneralError("Something went wrong...")
            }
        }
    }, [form, register])

    if (loggedIn) return <Redirect to="/" noThrow />
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
            <Header size="small" subTitle={ register ? "Register" : "Login" } />
            {/* <Text style={{ fontSize: 12 }}>Welcome to CityGen! Please login to continue...</Text> */}
            <div className="login-form-wrapper">
                <Form
                    className={ classNames("login-form", register && "register") }
                    form={ form }
                    onFinish={ onFinish }
                    validateTrigger="onBlur"
                    layout="vertical"
                >
                    { register && (
                        <Form.Item
                            name="username"
                            rules={[
                                { required: true, message: "Please enter a username!" },
                                { min: 3, message: "Your username must be at least 3 characters!" },
                                { max: 40, message: "Your username cannot be more than 40 characters!" }
                            ]}
                        >
                            <Input
                                prefix={ <UserOutlined style={{ marginRight: 4 }} /> }
                                placeholder="Username"
                            />
                        </Form.Item>
                    ) }
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: `Please enter ${ register ? "an" : "your" } email!` },
                            { type: "email", message: "The email you entered is invalid!" }
                        ]}
                    >
                        <Input
                            prefix={ <MailOutlined style={{ marginRight: 4 }} /> }
                            placeholder="Email"
                        />
                    </Form.Item>
                    { register && (
                        <Form.Item style={{ marginBottom: 0 }}>
                            <Form.Item
                                name="first_name"
                                rules={[
                                    { required: true, message: "Enter your first name!" }
                                ]}
                                style={{ display: "inline-block", width: "calc(50% - 4px)" }}
                            >
                                <Input
                                    placeholder="First name"
                                />
                            </Form.Item>
                            <Form.Item
                                name="last_name"
                                rules={[
                                    { required: true, message: "Enter your last name!" },
                                ]}
                                style={{ display: "inline-block", width: "calc(50% - 4px)", marginLeft: 8 }}
                            >
                                <Input
                                    placeholder="Last name"
                                />
                            </Form.Item>
                        </Form.Item>
                    ) }
                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: `Please enter ${ register ? "a" : "your" } password!` },
                            ...( register ? [
                                { min: 4, message: "Your password must be at least 4 characters!" },
                                { max: 100, message: "Your password cannot be more than 100 characters!" }
                            ] : [])
                        ]}
                    >
                        <Input.Password
                            prefix={ <LockOutlined style={{ marginRight: 4 }} /> }
                            type="password"
                            placeholder="Password"
                        />
                    </Form.Item>
                    { register && (
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
                    ) }
                    {/* <Form.Item name="remember" valuePropName="checked" style={{ marginTop: -8, marginBottom: 16 }}>
                        <Checkbox defaultChecked>Remember me</Checkbox>
                    </Form.Item> */}
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button block type="primary" htmlType="submit">
                            { register ? "Sign up" : "Log in" }
                        </Button>
                        { generalError && (
                            <div className="login-form-general-error" style={{ marginTop: 8 }}>
                                { generalError }
                            </div>
                        ) }
                        <div style={{ marginTop: 16, textAlign: "center" }}>
                            <Text>{ register ? "Already have an account?" : "Don't have an account?" }</Text>&nbsp;
                            { register ? <Link to="/login">Log in</Link> : <Link to="/register">Sign up</Link> }
                        </div>
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
} 