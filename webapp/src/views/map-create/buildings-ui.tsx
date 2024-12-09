import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Checkbox, Form, Input, InputNumber, Modal, Space, Tooltip } from 'antd'
import { red, volcano, gray } from '@ant-design/colors'
import { useMapCreate } from './map-create-context'
import { IMapSettings } from './map-create'
import { SettingsMenu } from '../../components/settings-menu'
import { DefaultCanvasWrapper } from '../../MapGenerator/src/ts/ui/canvas_wrapper'
import Vector from '../../MapGenerator/src/ts/vector'
import DomainController from '../../MapGenerator/src/ts/ui/domain_controller'

interface BuildingsGUIProps {
    confirmMapCreation: (mapSettings: IMapSettings) => void
}

interface MapSettingsModalProps {
    showModal: boolean
    setShowModal: (show: boolean) => void
    confirmMapCreation: (mapSettings: IMapSettings) => void
}

const MapSettingsModal = ({ confirmMapCreation, showModal, setShowModal }: MapSettingsModalProps) => {
    const [mapName, setMapName] = useState<string>("")
    const [mapPrivate, setMapPrivate] = useState<boolean>(false)

    const [form] = Form.useForm()

    useEffect(() => {
        if (!showModal) {
            setMapName("")
            setMapPrivate(false)
        }
    }, [showModal])

    return (
        <Modal
            title="Finish map creation"
            open={ showModal }
            onOk={ async () => {
                try {
                    await form.validateFields()
                } catch { return }
                setShowModal(false)
                confirmMapCreation({
                    name: mapName,
                    private: mapPrivate
                })
            } }
            onCancel={ () => setShowModal(false) }
            cancelButtonProps={{ type: "text" }}
            destroyOnClose
        >
            <Form
                form={ form }
                className="map-settings-form"
                validateTrigger="onBlur"
                clearOnDestroy
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    label="Name"
                    name="name"
                    rules={[
                        { required: true, message: "Please enter a name for the map!" },
                        { min: 3, message: "Please use at least 3 characters!" },
                        { max: 80, message: "Please use less than 80 characters!" }
                    ]}
                >
                    <Input
                        placeholder="Enter a name for the map..."
                        value={ mapName }
                        onChange={ (e) => setMapName(e.target.value) }
                        style={{ color: "rgba(0, 0, 0, 0.85)" }}
                    />
                </Form.Item>
                <Form.Item style={{ marginTop: -8 }}>
                    <Checkbox checked={ mapPrivate } onChange={ () => setMapPrivate(!mapPrivate) }>
                        Private
                    </Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    )
}

export const BuildingsGUI = ({ confirmMapCreation }: BuildingsGUIProps) => {
    const {
        canvasEl, drawBuildings,
        buildingParams, setBuildingParams,
        buildings, generateBuildings,
        redrawTrigger, triggerRedraw
    } = useMapCreate()
    const [showModal, setShowModal] = useState<boolean>(false)

    const finalizeDisabled = useMemo(() => !buildings || buildings.buildingModels.length === 0, [buildings])

    useEffect(() => {
        drawBuildings()
    }, [drawBuildings, redrawTrigger])

    return (
        <div className="canvas-container">
            { canvasEl }
            <SettingsMenu
                floating="top-right"
                containerProps={{ style: { left: "calc(100% + 8px)", top: 0 } }}
                extra={ (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 4 }}>
                        <Tooltip
                            title={ finalizeDisabled && "You should generate some buildings first" }
                            placement="bottom"
                        >
                            <Button
                                type="primary"
                                onClick={ () => setShowModal(true) }
                                disabled={ finalizeDisabled }
                            >
                                Finalize
                            </Button>
                        </Tooltip>
                    </div>
                ) }
                items={[
                    {
                        key: 0,
                        label: "Generate",
                        onClick: async () => await generateBuildings()
                    },
                    {
                        key: 1,
                        label: (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                Min. area
                                <InputNumber
                                    value={ buildingParams.minArea }
                                    size="small"
                                    min={ 10 }
                                    max={ 250 }
                                    onChange={ (value) => {
                                        if (value !== null) {
                                            buildingParams.minArea = value
                                            setBuildingParams(buildingParams)
                                            triggerRedraw()
                                        }
                                    } }
                                    style={{ width: 64, color: "black" }}
                                />
                            </div>
                        ),
                    },
                    {
                        key: 2,
                        label: (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                Shrinkage
                                <InputNumber
                                    value={ buildingParams.shrinkSpacing }
                                    size="small"
                                    min={ 0 }
                                    max={ 8 }
                                    onChange={ (value) => {
                                        if (value !== null) {
                                            buildingParams.shrinkSpacing = value
                                            setBuildingParams(buildingParams)
                                            triggerRedraw()
                                        }
                                    } }
                                    style={{ width: 64, color: "black" }}
                                />
                            </div>
                        ),
                    },
                    {
                        key: 3,
                        label: (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                Divide rate
                                <InputNumber
                                    value={ Number.parseFloat((1 - buildingParams.chanceNoDivide).toFixed(2)) }
                                    size="small"
                                    min={ 0 }
                                    max={ 1 }
                                    onChange={ (value) => {
                                        if (value !== null) {
                                            buildingParams.chanceNoDivide = 1 - value
                                            setBuildingParams(buildingParams)
                                            triggerRedraw()
                                        }
                                    } }
                                    style={{ width: 64, color: "black" }}
                                />
                            </div>
                        ),
                    }
            ]} />
            <MapSettingsModal confirmMapCreation={ confirmMapCreation } showModal={ showModal } setShowModal={ setShowModal } />
        </div>
    )
}