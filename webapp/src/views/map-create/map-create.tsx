import React, { Fragment, useCallback, useRef, useState } from 'react'
import { Space, Menu as AntMenu, Layout, Tooltip, Steps, Modal, message, Spin } from 'antd'
import { volcano } from '@ant-design/colors'
import { navigate } from '@gatsbyjs/reach-router'
import { MapCreateProvider, useMapCreate } from './map-create-context'
import { TensorFieldGUI } from './tensor-field-ui'
import { WaterMapGUI } from './water-map-ui'
import { RoadParkMapGUI } from './road-park-map-gui'
import { BuildingsGUI } from './buildings-ui'
import { Header } from '../../components/main-menu/header'
import { useAPI } from '../../contexts'
import { Map } from '../../api'
import './map-create.css'

const { Content } = Layout

export interface IMapSettings {
    name: string
    private: boolean
}

interface MapGenerateMenuProps {
    activeStep: number
    setActiveStep: (number) => void
}

const GenerateMenu = ({ activeStep, setActiveStep }: MapGenerateMenuProps) => {  
    return (
        <AntMenu
            mode="horizontal"
            selectedKeys={ [] }
            items={[
                {
                    key: "prev",
                    label: "Back",
                    disabled: activeStep === 0,
                    onClick: () => setActiveStep(activeStep - 1)
                },
                {
                    key: "next",
                    label: "Next",
                    disabled: activeStep === 3,
                    onClick: () => setActiveStep(activeStep + 1)
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

export const MapCreateInternal = () => {
    const { api } = useAPI()
    const { canvasEl, canvasRef, buildings, generateBuildings, drawBuildings, collectMapData } = useMapCreate()

    const [activeStep, setActiveStep] = useState<number>(0)
    const [creatingMap, setCreatingMap] = useState<boolean>(false)

    const [messageApi, contextHolder] = message.useMessage()

    const mapCreateAbortController = useRef<AbortController>()

    const createThumbnail = useCallback(() => {
        if (!canvasEl) return
        const dataURL = canvasRef.current!.toDataURL("image/jpeg")
        const b64String = dataURL.split("base64,")[1]
        return b64String
    }, [canvasEl])

    const confirmMapCreation = useCallback(async (mapSettings: IMapSettings) => {
        if (!canvasEl) return
        
        setCreatingMap(true)
        const thumbnail = createThumbnail()!
        let map
        try {
            mapCreateAbortController.current?.abort()
            mapCreateAbortController.current = new AbortController()
            await new Promise((resolve) => setTimeout(resolve, 1000))
            const mapData = collectMapData()!
            map = await api.createMap(
                mapSettings.name,
                thumbnail,
                mapSettings.private,
                mapData
            )
            navigate(`/play/${ map.id }`)
        } catch (e: any) {
            if (e.isAbort) return
            messageApi.open({
                type: "error",
                content: "Failed to create map!"
            })
            setCreatingMap(false)
        }
        // Don't bother setting loading to false if successful, since it will redirect anyways
        // (since it causes a flash of the view before the redirect goes through)
    }, [api, buildings, generateBuildings, drawBuildings, collectMapData, createThumbnail])

    if (creatingMap) return <Spin />
    return (
        <Fragment>
            { contextHolder }
            <Space direction="vertical" size={ 12 } style={{ width: "100%" }}>
                <Header subTitle="Map creation" size="small" style={{ marginBottom: 16 }} />
                <Content style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Space direction="vertical" size="large">
                        <Steps
                            className="map-create-steps"
                            size="small"
                            current={ activeStep }
                            items={[
                                {
                                    title: "Water map",
                                    onClick: () => setActiveStep(0),
                                },
                                {
                                    title: "Tensor field",
                                    onClick: () => setActiveStep(1)
                                },
                                {
                                    title: "Roads and parks",
                                    onClick: () => setActiveStep(2)
                                },
                                {
                                    title: "Buildings",
                                    onClick: () => setActiveStep(3)
                                }
                            ]}
                            style={{ width: "auto" }}
                        />
                        {
                            activeStep === 0 ? (
                                <WaterMapGUI />
                            ) : activeStep === 1 ? (
                                <TensorFieldGUI />
                            ) : activeStep === 2 ? (
                                <RoadParkMapGUI />
                            ) : activeStep === 3 ? (
                                <BuildingsGUI confirmMapCreation={ confirmMapCreation } />
                            ) : null
                        }
                    </Space>
                </Content>
                <GenerateMenu
                    activeStep={ activeStep }
                    setActiveStep={ setActiveStep }
                />
            </Space>
        </Fragment>
    )
}


export const MapCreate = () => (
    <MapCreateProvider>
        <MapCreateInternal />
    </MapCreateProvider>
)