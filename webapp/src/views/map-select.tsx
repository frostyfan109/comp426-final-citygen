import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Space, Menu as AntMenu, Layout, Tooltip, List, Avatar, Typography, Tabs, Segmented, Button, Modal, Input, message } from 'antd'
import { StarOutlined, StarFilled } from '@ant-design/icons'
import { volcano, red, gray, yellow } from '@ant-design/colors'
import { navigate } from '@gatsbyjs/reach-router'
import moment from 'moment'
import { Header } from '../components/main-menu/header'
import { useAPI } from '../contexts'
import { Map } from '../api'
import './map-select.css'

const { Content } = Layout
const { Text } = Typography

interface MapSelectMenuProps {
    selectedMap?: Map
}

const SelectMenu = ({ selectedMap }: MapSelectMenuProps) => {
    return (
        <AntMenu
            mode="horizontal"
            selectedKeys={ [] }
            items={[
                {
                    key: "play",
                    label: <Tooltip title={ !selectedMap ? "Select a map" : undefined }>Play</Tooltip>,
                    disabled: !selectedMap,
                    onClick: () => navigate(`/play/${ selectedMap!.id }`)
                },
                {
                    key: "new-map",
                    label: "New map",
                    onClick: () => navigate("/create-map")
                },
                {
                    key: "home",
                    label: "Home",
                    onClick: () => navigate("/")
                }
            ]}
            style={{ background: "transparent", width: "100%", justifyContent: "center" }}
        />
    )
}

export const MapSelect = () => {
    const [userMaps, setUserMaps] = useState<Map[]>()
    const [publicMaps, setPublicMaps] = useState<Map[]>()
    const [mapSelection, setMapSelection] = useState<Map|undefined>()
    const [mapsLoading, setMapsLoading] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<string>("Your Maps")
    const [search, setSearch] = useState<string>("")
    const [error, setError] = useState<string|null>(null)
    const [showMapImageModal, setShowMapImageModal] = useState<Map|undefined>()

    const { api } = useAPI()
    const [messageApi, contextHolder] = message.useMessage()

    const userMapsAbortController = useRef<AbortController>()
    const publicMapsAbortController = useRef<AbortController>()
    const favoritedAbortController = useRef<AbortController>()

    const showPublicMaps = useMemo(() => activeTab === "Public Maps", [activeTab])

    const dataSource = useMemo(() => {
        const source = showPublicMaps ? publicMaps : userMaps
        if (!source) return
        if (search) return source.filter((map) => map.name.toLowerCase().includes(search.toLowerCase()))
        return source 
    }, [showPublicMaps, userMaps, publicMaps, search])
    
    const loadMaps = useCallback(async () => {
        
        userMapsAbortController.current?.abort()
        userMapsAbortController.current = new AbortController()
        publicMapsAbortController.current?.abort()
        publicMapsAbortController.current = new AbortController()
        
        setMapsLoading(true)
        try {
            const [newUserMaps, newPublicMaps] = await Promise.all([
                api.getMyMaps({
                    signal: userMapsAbortController.current.signal
                }),
                api.getPublicMaps({
                    signal: publicMapsAbortController.current.signal
                })
            ])
            setUserMaps(newUserMaps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
            setPublicMaps(newPublicMaps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
            setActiveTab("Your Maps")
            setMapSelection(newUserMaps[0])
            setMapsLoading(false)
        } catch (e: any) {
            if (e.isAbort) return
            setUserMaps([])
            setPublicMaps([])
            setError("Failed to load.")
            setMapsLoading(false)
        }
    }, [api])

    const setFavorited = useCallback(async (map: Map, favorited: boolean) => {
        const setMaps = showPublicMaps ? setPublicMaps : setUserMaps
        const updateMapFavorited = (favorited: boolean) => setMaps((maps) => {
            maps = maps?.map((_map) => {
                if (map.id === _map.id) return { ..._map, favorited }
                return _map
            })
            return maps
        })

        favoritedAbortController.current?.abort()
        favoritedAbortController.current = new AbortController()
        updateMapFavorited(favorited)

        try {
            await api.setMapFavorited(map.id, favorited)
        } catch (e: any) {
            if (e.isAbort) return
            // Revert optimistic update
            updateMapFavorited(!favorited)
            messageApi.open({
                type: "error",
                content: `Failed to ${ favorited ? "favorite" : "unfavorite" } map!`
            })
        }
    }, [api, messageApi, showPublicMaps])

    useEffect(() => {
        void async function() {
            await loadMaps()
        }()
        return () => {
            userMapsAbortController.current?.abort()
            publicMapsAbortController.current?.abort()
        }
    }, [loadMaps])

    useEffect(() => {
        if (showPublicMaps) setMapSelection(publicMaps?.[0])
        else setMapSelection(userMaps?.[0])
    }, [showPublicMaps])

    return (
        <Space direction="vertical" size={ 12 } style={{ width: "100%" }}>
            <Header subTitle="Map selection" size="small" style={{ marginBottom: 16 }} />
            <Content style={{ maxWidth: 480, display: "flex", flexDirection: "column", alignItems: "center", margin: "0 auto" }}>
                <Segmented
                    size="small"
                    value={ activeTab }
                    onChange={ (key: string) => setActiveTab(key) }
                    options={[ "Your Maps", "Public Maps" ]}
                    style={{ marginBottom: 16 }}
                />
                { dataSource && dataSource.length > 0 && (
                    <Input
                        className="search-maps-input"
                        placeholder="Search..."
                        value={ search }
                        onChange={ (e) => setSearch(e.target.value) }
                        style={{ marginBottom: 8 }}
                    />
                ) }
                <List
                    className="map-select-list"
                    dataSource={ dataSource }
                    loading={ mapsLoading }
                    renderItem={ (map) => (
                        <List.Item
                            key={ map.id }
                            onClick={ () => setMapSelection(map) }
                            style={{
                                border: map.id === mapSelection?.id ? `1px solid ${ volcano.primary }` : undefined,
                                cursor: map.id === mapSelection?.id ? "default" : "pointer"
                            }}
                        >
                            <List.Item.Meta
                                title={ map.name }
                                avatar={
                                    <Avatar
                                        shape="square"
                                        size={ 48 }
                                        src={ `${ api.apiUrl }maps/${ map.id }/thumbnail` }
                                        alt="Map thumbnail"
                                        onClick={ () => setShowMapImageModal(map) }
                                        style={{ borderRadius: 4, position: "absolute", cursor: "pointer" }}
                                    />
                                }
                                description={
                                    showPublicMaps && !!map.user ? (
                                        `Created by ${ map.user.username }`
                                    ) : moment().diff(moment(map.created_at), "days") > 30 ? (
                                        `Created ${ moment(map.created_at).format("MM/DD/YY") }`
                                    ) : (
                                        `Created ${ moment(map.created_at).fromNow() }`
                                    )
                                }
                            />
                            <Button
                                type="text"
                                title="Favorite"
                                icon={
                                    map.favorited ? (
                                        <StarFilled style={{ color: yellow[6] }} />
                                    ): <StarOutlined />
                                }
                                onClick={ () => setFavorited(map, !map.favorited) }
                                style={{ position: "absolute", right: showPublicMaps ? 56 : 8 }}
                            />
                            { showPublicMaps && (
                                <div title={ map.user!.username } style={{ position: "absolute", right: 8 }}>
                                    <Avatar
                                        shape="circle"
                                        size={ 40 }
                                        src={ `${ api.apiUrl }users/${ map.user!.username }/avatar` }
                                    >
                                        { map.user!.username.slice(0, 8) }
                                    </Avatar>
                                </div>
                            ) }
                        </List.Item>

                    )}
                    locale={{ emptyText: (
                        error ? (
                            <Space direction="horizontal" size="small">
                            <Text style={{ color: red[6] }}>{ error }</Text>
                            <Button
                                className="retry-btn"
                                type="text"
                                size="small"
                                onClick={ () => loadMaps() }
                            >
                                Retry?
                            </Button>
                            </Space>
                        ) : (
                            <Text style={{ color: gray[0] }}>
                                {
                                    activeTab === "Your Maps" ? (
                                        "You haven't created any maps yet..."
                                    ) :
                                    activeTab === "Public Maps" ? (
                                        "No public maps are currently available..."
                                    ) : null
                                }
                            </Text>
                        )
                    ) }}
                />
            </Content>
            <SelectMenu selectedMap={ mapSelection }/>
            <Modal
                title={ showMapImageModal?.name }
                open={ !!showMapImageModal }
                onOk={ () => setShowMapImageModal(undefined) }
                onCancel={ () => setShowMapImageModal(undefined) }
                footer={ null }
            >
                { showMapImageModal && (
                    <img
                        src={ `${ api.apiUrl }maps/${ showMapImageModal.id }/thumbnail` }
                        alt="Map thumbnail"
                        style={{ width: "100%" }}
                    />
                ) }
            </Modal>
            { contextHolder }
        </Space>
    )
}