import React from 'react'
import { Space, Menu as AntMenu, Divider } from 'antd'
import { navigate } from '@gatsbyjs/reach-router'
import { Header } from '../components/main-menu/header'
import { useAPI } from '../contexts'

const Menu = () => {
    const { api } = useAPI()

    return (
        <AntMenu
            selectedKeys={ [] }
            items={[
                {
                    key: "select-map",
                    label: "Select Map",
                    onClick: () => navigate("/select-map")
                },
                {
                    key: "create-map",
                    label: "Create Map",
                    onClick: () => navigate("/create-map")
                },
                {
                    key: "account",
                    label: "Account",
                    onClick: () => navigate("/account")
                },
                {
                    key: "credits",
                    label: "Attributions",
                    onClick: () => navigate("/attributions")
                },
                // {
                //     key: "logout",
                //     label: "Logout",
                //     onClick: async () => {
                //         try {
                //             await api.logout()
                //         } catch {}
                //     }
                // }
            ]}
            style={{ background: "transparent" }}
        />
    )
}

export const MainMenu = () => {
    return (
        <Space direction="vertical" size="middle">
            <Header />
            <Menu />
        </Space>
    )
}