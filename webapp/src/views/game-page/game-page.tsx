import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Space, Menu as AntMenu, Divider, Spin, message, Button, Typography, Checkbox, InputNumber, Popconfirm } from 'antd'
import { red } from '@ant-design/colors'
import { navigate } from '@gatsbyjs/reach-router'
import { Player } from './player'
import { Header } from '../../components/main-menu/header'
import { useAPI } from '../../contexts'
import { Map } from '../../api'
import { MAP_HEIGHT, MAP_WIDTH } from '../map-create/map-create-context'
import { Game } from './game'
import PolygonUtil from '../../MapGenerator/src/ts/impl/polygon_util'
import { SettingsMenu } from '../../components/settings-menu'
import './game-page.css'

const { Text } = Typography

interface GamePageProps {
    mapId: string
}

const FooterMenu = () => {
    const { api } = useAPI()

    return (
        <AntMenu
            mode="horizontal"
            selectedKeys={ [] }
            items={[
                {
                    key: "back",
                    label: "Back",
                    onClick: () => navigate("/select-map")
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

export const GamePage = ({ mapId }: GamePageProps) => {
    const { api } = useAPI()

    const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
    const [mouseEnabled, setMouseEnabled] = useState<boolean>(true)
    const [debugEnabled, setDebugEnabled] = useState<boolean>(false)
    const [playerCoords, setPlayerCoords] = useState<{
        x: number, z: number, yPos3D: number,
        yaw: number, pitch: number
    } | null>(null)
    const [teleportX, setTeleportX] = useState<number|undefined>()
    const [teleportY, setTeleportY] = useState<number|undefined>()
    const [teleportZ, setTeleportZ] = useState<number|undefined>()
    const [showTeleportPopover, setShowTeleportPopover] = useState<boolean>(false)
    const [gravitationalForce, setGravitationalForce] = useState<number>(0)
    const [jumpForce, setJumpForce] = useState<number>(0)
    const [moveForce, setMoveForce] = useState<number>(0)

    const [map, setMap] = useState<Map|undefined>()
    const [error, setError] = useState<string|null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [canvasEl, setCanvas] = useState(
        <canvas
            id="game-canvas"
            width={ MAP_WIDTH }
            height={ MAP_HEIGHT }
            ref={ canvasRef }
            style={{ background: "rgba(0, 0, 0, 0.05)", border: `1px solid ${ red[7] }D9`, borderRadius: 4 }}
        />
    )

    const [messageApi, contextHolder] = message.useMessage()
    
    const game = useRef<Game>()
    const mapAbortController = useRef<AbortController>()

    const loadMap = useCallback(async () => {
        setError(null)

        mapAbortController.current?.abort()
        mapAbortController.current = new AbortController()
        try {
            const map = await api.getMap(mapId, true, { signal: mapAbortController.current.signal })
            setMap(map)
        } catch (e: any) {
            if (!e.isAbort) setError("Failed to load game map!")
        }
    }, [api, mapId])

    const updatePlayerCoords = useCallback(() => setPlayerCoords({
        x: game.current?.player.x,
        z: game.current?.player.y,
        yPos3D: game.current?.player.yPos3D,
        yaw: game.current?.player.angle,
        pitch: game.current?.player.verticalAngle
    }), [])
    
    useEffect(() => {
        void async function() {
            await loadMap()
        }()
        return () => {
            mapAbortController.current?.abort()
        }
    }, [loadMap])

    useEffect(() => {
        if (!map || !canvasRef.current) return
        
        game.current = new Game(canvasRef.current, map.data);
        game.current.startGame();
        game.current.soundEnabled = true
        updatePlayerCoords()

        const player = game.current.player
        
        player.moveCallback = updatePlayerCoords
        setGravitationalForce(player.GRAVITATIONAL_FORCE)
        setJumpForce(player.JUMP_FORCE)
        setMoveForce(player.TERMINAL_VELOCITY_X + player.TERMINAL_VELOCITY_Z)

        return () => {
            game.current?.endGame()
        }
    }, [map, canvasEl, updatePlayerCoords])

    useEffect(() => {
        if (!game.current) return
        game.current.soundEnabled = soundEnabled
    }, [soundEnabled])

    useEffect(() => {
        if (!game.current) return
        if (mouseEnabled) game.current.player.mouse.start()
        else game.current.player.mouse.stop()
    }, [mouseEnabled])

    useEffect(() => {
        if (!game.current) return
        
        const raycaster = game.current.raycaster
        const player = game.current.player
        if (debugEnabled) {
            raycaster.renderFPS = true
            raycaster.debugObjects.push(player)
        }
        else {
            raycaster.renderFPS = false
            raycaster.debugObjects = raycaster.debugObjects.filter((obj) => obj !== player)
        }
    }, [debugEnabled])

    useEffect(() => {
        setTeleportX(playerCoords?.x)
        setTeleportY(playerCoords?.yPos3D)
        setTeleportZ(playerCoords?.z)
    }, [showTeleportPopover])

    useEffect(() => {
        if (!game.current) return
        game.current.player.GRAVITATIONAL_FORCE = gravitationalForce
    }, [gravitationalForce])

    useEffect(() => {
        if (!game.current) return
        game.current.player.JUMP_FORCE = jumpForce
    }, [jumpForce])

    useEffect(() => {
        if (!game.current) return
        game.current.player.TERMINAL_VELOCITY_X = moveForce / 2
        game.current.player.TERMINAL_VELOCITY_Z = moveForce / 2
    }, [moveForce])
    
    if (!map && !error) return <Spin />
    return (
        <Fragment>
            <Space className="game-page" direction="vertical" size="middle">
                <Header subTitle={ map?.name } size="small" />
                { error ? (
                    <Space direction="vertical" size="middle" style={{ marginTop: 8 }}>
                        <Text style={{ color: red[6] }}>{ error }</Text>
                        <Button
                            className="retry-btn"
                            type="text"
                            size="small"
                            onClick={ loadMap }
                        >
                            Retry?
                        </Button>
                    </Space>
                ) : (
                    <div style={{ position: "relative" }}>
                        { canvasEl }
                        { playerCoords && (
                            <SettingsMenu
                                floating="top-right"
                                containerProps={{ style: { left: "calc(100% + 8px)", top: 0 } }}
                                extra={ (
                                    <div style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        fontSize: 11,
                                        border: "1px solid white",
                                        padding: 16
                                        }}
                                    >
                                        <div>
                                            Controls
                                            <ul style={{ paddingLeft: 16 }}>
                                                <li>Movement - WASD</li>
                                                <li>Turn left - Q</li>
                                                <li>Turn right - E</li>
                                                <li>Jump - space</li>
                                                <li>Sprint - shift</li>
                                            </ul>
                                        </div>
                                        <div style={{ fontStyle: "italic" }}>Click on the game to lock your mouse.</div>
                                    </div>
                                ) }
                                items={[
                                    {
                                        key: "sound",
                                        label: (
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                Sound
                                                <Checkbox
                                                    checked={ soundEnabled }
                                                    onChange={ () => setSoundEnabled(!soundEnabled) }
                                                />
                                            </div>
                                        )
                                    },
                                    {
                                        key: "mouse",
                                        label: (
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                Enable mouse
                                                <Checkbox
                                                    checked={ mouseEnabled }
                                                    onChange={ () => setMouseEnabled(!mouseEnabled) }
                                                />
                                            </div>
                                        )
                                    },
                                    {
                                        key: "player.info",
                                        label: "Player info",
                                        children: [
                                            {
                                                key: "player.x",
                                                label: (
                                                    <div>
                                                        X: { playerCoords.x.toFixed(2) }
                                                    </div>
                                                ),
                                                style: { paddingLeft: 32 }
                                            },
                                            {
                                                key: "player.z",
                                                label: (
                                                    <div>
                                                        Z: { playerCoords.z.toFixed(2) }
                                                    </div>
                                                ),
                                                style: { paddingLeft: 32 }
                                            },
                                            {
                                                key: "player.y",
                                                label: (
                                                    <div>
                                                        Y: { playerCoords.yPos3D.toFixed(2) }
                                                    </div>
                                                ),
                                                style: { paddingLeft: 32 }
                                            },
                                            {
                                                key: "player.yaw",
                                                label: (
                                                    <div>
                                                        Yaw: { `${ (playerCoords.yaw * 180 / Math.PI).toFixed(2)}°` }
                                                    </div>
                                                ),
                                                style: { paddingLeft: 32 }
                                            },
                                            {
                                                key: "player.pitch",
                                                label: (
                                                    <div>
                                                        Pitch: { `${ (playerCoords.pitch * 180 / Math.PI).toFixed(2)}°` }
                                                    </div>
                                                ),
                                                style: { paddingLeft: 32 }
                                            },
                                            {
                                                key: "player.teleport",
                                                label: (
                                                    <Popconfirm
                                                        overlayClassName="teleport-popover"
                                                        trigger="click"
                                                        title="Teleport"
                                                        open={ showTeleportPopover }
                                                        onOpenChange={ (open) => setShowTeleportPopover(open) }
                                                        onConfirm={ () => {
                                                            if (!game.current) return
                                                            game.current.player.setX(teleportX)
                                                            game.current.player.setZ(teleportZ)
                                                            game.current.player.yPos3D = teleportY
                                                            updatePlayerCoords()
                                                            setShowTeleportPopover(false)
                                                        }}
                                                        onCancel={ () => setShowTeleportPopover(false) }
                                                        cancelButtonProps={{ type: "text", style: { color: "Red" } }}
                                                        destroyTooltipOnHide
                                                        description={ (
                                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    X
                                                                    <InputNumber
                                                                        value={ Math.round(teleportX ?? playerCoords.x) }
                                                                        size="small"
                                                                        onChange={ (value) => {
                                                                            if (value !== null) {
                                                                                setTeleportX(value)
                                                                            }
                                                                        } }
                                                                        style={{ marginLeft: 8 }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    Z
                                                                    <InputNumber
                                                                        value={ Math.round(teleportZ ?? playerCoords.z) }
                                                                        size="small"
                                                                        onChange={ (value) => {
                                                                            if (value !== null) {
                                                                                setTeleportZ(value)
                                                                            }
                                                                        } }
                                                                        style={{ marginLeft: 8 }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                    Y
                                                                    <InputNumber
                                                                        value={ Math.round(teleportY ?? playerCoords.yPos3D) }
                                                                        size="small"
                                                                        onChange={ (value) => {
                                                                            if (value !== null) {
                                                                                setTeleportY(value)
                                                                            }
                                                                        } }
                                                                        style={{ marginLeft: 8 }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) }
                                                    >
                                                        Teleport
                                                    </Popconfirm>
                                                ),
                                                onClick: () => setShowTeleportPopover(true),
                                                style: { paddingLeft: 32 }
                                            }
                                        ]
                                    },
                                    {
                                        key: "player.settings",
                                        label: "Player settings",
                                        children: [
                                            {
                                                key: "player.gravity",
                                                label: (
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                        Grav. force
                                                        <InputNumber
                                                            value={ gravitationalForce }
                                                            size="small"
                                                            onChange={ (value) => {
                                                                if (value !== null) {
                                                                    setGravitationalForce(value)
                                                                }
                                                            } }
                                                            style={{ width: 48, color: "black" }}
                                                        />
                                                    </div>
                                                ),
                                                style: { paddingLeft: 32 }
                                            },
                                            {
                                                key: "player.jumpforce",
                                                label: (
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                        Jump force
                                                        <InputNumber
                                                            value={ jumpForce }
                                                            size="small"
                                                            onChange={ (value) => {
                                                                if (value !== null) {
                                                                    setJumpForce(value)
                                                                }
                                                            } }
                                                            style={{ width: 48, color: "black" }}
                                                        />
                                                    </div>
                                                ),
                                                style: { paddingLeft: 32 }
                                            },
                                            {
                                                key: "player.moveforce",
                                                label: (
                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                        Move force
                                                        <InputNumber
                                                            value={ moveForce }
                                                            size="small"
                                                            onChange={ (value) => {
                                                                if (value !== null) {
                                                                    setMoveForce(value)
                                                                }
                                                            } }
                                                            style={{ width: 48, color: "black" }}
                                                        />
                                                    </div>
                                                ),
                                                style: { paddingLeft: 32 }
                                            }
                                        ]
                                    },
                                    {
                                        key: "debug",
                                        label: (
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                Debug info
                                                <Checkbox
                                                    checked={ debugEnabled }
                                                    onChange={ () => setDebugEnabled(!debugEnabled) }
                                                />
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        ) }
                    </div>
                ) }
                <FooterMenu />
            </Space>
            { contextHolder }
        </Fragment>
    )
}