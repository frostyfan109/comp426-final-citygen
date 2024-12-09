import { Button, Card, Menu, Result, Space, Typography } from 'antd'
import { navigate } from '@gatsbyjs/reach-router'
import { useMemo } from 'react'
import { Header } from '../components/main-menu'

const { Title, Text } = Typography

const CreditsMenu = () => {
    return (
        <Menu
            mode="horizontal"
            selectedKeys={ [] }
            items={[
                {
                    key: "home",
                    label: "Home",
                    onClick: () => navigate("/")
                },
            ]}
            style={{ background: "transparent" }}
        />
    )
}

export const CreditsPage = () => {
    return (
        <Space direction="vertical" style={{ alignItems: "center" }}>
            <Header size="small" subTitle="Attributions" />
            <div style={{ maxWidth: 560 }}>
                <div>
                    <Title level={ 5 }>Guoning Chen et al.</Title>
                    <Text style={{ fontSize: 13 }}>
                        For their seminal paper&nbsp;
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://www.sci.utah.edu/~chengu/street_sig08/street_project.htm"
                        >
                            Interactive Procedural Street Modeling
                        </a>
                    </Text>
                </div>
                <div>
                    <Title level={ 5 }>ProbableTrain</Title>
                    <Text style={{ fontSize: 13 }}>
                        For their&nbsp;
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://github.com/ProbableTrain/MapGenerator"
                        >
                            implementation
                        </a>
                        &nbsp;of the above paper and the tensor field editor.
                    </Text>
                </div>
                <div>
                    <Title level={ 5 }>Tim Kahn</Title>
                    <Text style={{ fontSize: 13 }}>
                        For providing&nbsp;
                        <a
                            target="_blank"
                            rel="noreferrer"
                            href="https://freesound.org/people/tim.kahn/"
                        >
                            sound effects
                        </a>
                        &nbsp;under CC0
                    </Text>
                </div>
            </div>
            <CreditsMenu />
        </Space>
    )
} 