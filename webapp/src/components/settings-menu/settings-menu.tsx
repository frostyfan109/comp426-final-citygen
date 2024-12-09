import React, { ReactNode, useMemo, useState } from 'react'
import { Menu, MenuProps, Space } from 'antd'
import classNames from 'classnames'
import { MAP_HEIGHT } from '../../views/map-create/map-create-context'
import './settings-menu.css'

interface SettingsMenuProps extends MenuProps {
    extra?: ReactNode
    floating?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    extraProps?: React.HTMLAttributes<HTMLDivElement>
    containerProps?: React.HTMLAttributes<HTMLDivElement>
}

export const SettingsMenu = ({
    items, 
    extra=null,
    floating=undefined,
    containerProps: { style: containerStyle={}, ...containerProps }={},
    extraProps={},
    className=undefined,
    ...props
}: SettingsMenuProps) => {
    const [collapsed, setCollapsed] = useState<boolean>(false)
    const menuItems = useMemo(() => {
        if (!collapsed) return [
            ...items!,
            {
                key: "collapse-menu",
                label: "Hide controls",
                onClick: () => setCollapsed(true)
            }
        ]
        else return [{
            key: "collapse-menu",
            label: "Show controls",
            onClick: () => setCollapsed(false)
        }]
    }, [items, collapsed])
    return (
        <div
            className={ classNames("settings-menu-container", floating && `floating ${ floating }`) }
            style={{ maxHeight: MAP_HEIGHT, ...containerStyle }}
            { ...containerProps }
        >
            <Menu
                className={ classNames("settings-menu", className) }
                mode="inline"
                selectedKeys={[]}
                items={ menuItems }
                { ...props }
            />
            { extra ? <div className="settings-menu-extra" { ...extraProps }>{ extra }</div> : null }
        </div>
    )
}