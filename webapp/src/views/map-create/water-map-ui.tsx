import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Checkbox, InputNumber, Tooltip } from 'antd'
import { blue } from '@ant-design/colors'
import { MAP_HEIGHT, MAP_WIDTH, useMapCreate } from './map-create-context'
import { SettingsMenu } from '../../components/settings-menu'
import { DefaultCanvasWrapper } from '../../MapGenerator/src/ts/ui/canvas_wrapper'
import WaterGenerator from '../../MapGenerator/src/ts/impl/water_generator'
import DomainController from '../../MapGenerator/src/ts/ui/domain_controller'
import Util from '../../MapGenerator/src/ts/util'

export const WaterMapGUI = () => {
    const {
        canvasEl, canvasRef,
        integrator, tensorField,
        seaPolygon, riverPolygon,
        waterGenerator, generateWater,
        waterParams, setWaterParams,
        redrawTrigger, triggerRedraw
    } = useMapCreate()

    const draw = useCallback(() => {
        if (!canvasEl || !seaPolygon || !riverPolygon) return

        const canvas = new DefaultCanvasWrapper(canvasRef.current!)
        canvas.clearCanvas()
        canvas.setFillStyle("#FCF6D9")
        canvas.drawFrame(0, MAP_WIDTH, 0, MAP_HEIGHT)
        
        canvas.setFillStyle(blue[6])
        canvas.setStrokeStyle(blue[6])
        canvas.setLineWidth(1)

        canvas.drawPolygon(seaPolygon)
        canvas.drawPolygon(riverPolygon)
    }, [canvasEl, seaPolygon, riverPolygon])

    useEffect(() => {
        draw()
    }, [draw, redrawTrigger])

    return (
        <div className="canvas-container">
            { canvasEl }
            <SettingsMenu
                floating="top-right"
                containerProps={{ style: { left: "calc(100% + 8px)", top: 0 } }}
                // extra={ (
                //    <div>Generate a water map</div> 
                // ) }
                items={[
                    {
                        key: 1,
                        label: "Generate water",
                        onClick: () => generateWater()
                    },
                    {
                        key: "ocean",
                        label: "Ocean noise",
                        children: [
                            {
                                key: "ocean.enabled",
                                label: (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        Enabled*
                                        <Checkbox
                                            checked={ waterParams.coastNoise.noiseEnabled }
                                            onChange={ () => {
                                                waterParams.coastNoise.noiseEnabled = !waterParams.coastNoise.noiseEnabled
                                                setWaterParams(waterParams)
                                                triggerRedraw()
                                            } }
                                        />
                                    </div>
                                ),
                                style: { paddingLeft: 32 }
                            },
                            {
                                key: `ocean.size`,
                                label: (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        Noise size
                                        <InputNumber
                                            value={ Number.parseFloat(waterParams.coastNoise.noiseSize.toFixed(1)) }
                                            size="small"
                                            onChange={ (value) => {
                                                if (value !== null) {
                                                    waterParams.coastNoise.noiseSize = value
                                                    setWaterParams(waterParams)
                                                    triggerRedraw()
                                                }
                                            } }
                                            style={{ width: 64, color: "black" }}
                                        />
                                    </div>
                                ),
                                style: { paddingLeft: 32 }
                            },
                            {
                                key: `ocean.angle`,
                                label: (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        Noise angle
                                        <InputNumber
                                            value={ Number.parseFloat(waterParams.coastNoise.noiseAngle.toFixed(1)) }
                                            size="small"
                                            onChange={ (value) => {
                                                if (value !== null) {
                                                    waterParams.coastNoise.noiseAngle = value
                                                    setWaterParams(waterParams)
                                                    triggerRedraw()
                                                }
                                            } }
                                            style={{ width: 64, color: "black" }}
                                        />
                                    </div>
                                ),
                                style: { paddingLeft: 32 }
                            },
                        ]
                    },
                    {
                        key: "river",
                        label: "River noise",
                        children: [
                            {
                                key: "river.enabled",
                                label: (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        Enabled*
                                        <Checkbox
                                            checked={ waterParams.riverNoise.noiseEnabled }
                                            onChange={ () => {
                                                waterParams.riverNoise.noiseEnabled = !waterParams.riverNoise.noiseEnabled
                                                setWaterParams(waterParams)
                                                triggerRedraw()
                                            } }
                                        />
                                    </div>
                                ),
                                style: { paddingLeft: 32 }
                            },
                            {
                                key: `river.size`,
                                label: (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        Noise size
                                        <InputNumber
                                            value={ Number.parseFloat(waterParams.riverNoise.noiseSize.toFixed(1)) }
                                            size="small"
                                            onChange={ (value) => {
                                                if (value !== null) {
                                                    waterParams.riverNoise.noiseSize = value
                                                    setWaterParams(waterParams)
                                                    triggerRedraw()
                                                }
                                            } }
                                            style={{ width: 64, color: "black" }}
                                        />
                                    </div>
                                ),
                                style: { paddingLeft: 32 }
                            },
                            {
                                key: `river.angle`,
                                label: (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        Noise angle
                                        <InputNumber
                                            value={ Number.parseFloat(waterParams.riverNoise.noiseAngle.toFixed(1)) }
                                            size="small"
                                            onChange={ (value) => {
                                                if (value !== null) {
                                                    waterParams.riverNoise.noiseAngle = value
                                                    setWaterParams(waterParams)
                                                    triggerRedraw()
                                                }
                                            } }
                                            style={{ width: 64, color: "black" }}
                                        />
                                    </div>
                                ),
                                style: { paddingLeft: 32 }
                            },
                        ]
                    }
                ]}
            />
        </div>
    )
}