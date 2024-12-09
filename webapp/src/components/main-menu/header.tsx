import React from 'react'
import classNames from 'classnames'
import { navigate } from '@gatsbyjs/reach-router'
import './header.css'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
    title?: string
    subTitle?: string
    size?: "small" | "large"
}

export const Header = ({
    title="City-Gen", 
    subTitle="Interactive city generation",
    size="large",
    ...props
}: HeaderProps) => {
    return (
        <header className={ classNames("header", size) } { ...props }>
            <h1 className="title" onClick={ () => navigate("/") } style={{ cursor: "pointer" }}>
                { title }
            </h1>
            <h6 className="subtitle">--- { subTitle } ---</h6>
        </header>
    )
}