import { useCallback, useEffect, useMemo, useState } from 'react'
import { Checkbox, InputNumber, Space } from 'antd'
import { volcano } from '@ant-design/colors'
import GridIcon from '@mui/icons-material/GridOnOutlined'
import RadialIcon from '@mui/icons-material/ZoomOutMapOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined'
import TensorField, { NoiseParams } from '../../MapGenerator/src/ts/impl/tensor_field'
import { BasisField, FIELD_TYPE, Grid } from '../../MapGenerator/src/ts/impl/basis_field'
import DomainController from '../../MapGenerator/src/ts/ui/domain_controller'
import DragController from '../../MapGenerator/src/ts/ui/drag_controller'
import { DefaultCanvasWrapper } from '../../MapGenerator/src/ts/ui/canvas_wrapper'
import Vector from '../../MapGenerator/src/ts/vector'
import Util from '../../MapGenerator/src/ts/util'
import { MAP_HEIGHT, MAP_WIDTH, useMapCreate } from './map-create-context'
import { SettingsMenu } from '../../components/settings-menu'

export class TensorFieldInternal extends TensorField {
    private TENSOR_LINE_DIAMETER = 20;
    private TENSOR_SPAWN_SCALE = 0.8;  // How much to shrink worldDimensions to find spawn point
    private domainController = DomainController.getInstance()

    constructor(private _dragController: DragController, private _updateCallback: () => void, public noiseParams: NoiseParams) {
        super(noiseParams)
    }
    
    setRecommended(): void {
        const sea = this.sea
        const river = this.river
        const parks = this.parks
        this.reset();
        this.sea = sea
        this.river = river
        this.parks = parks
        const size = this.domainController.worldDimensions.multiplyScalar(this.TENSOR_SPAWN_SCALE);
        const newOrigin = this.domainController.worldDimensions
            .multiplyScalar((1 - this.TENSOR_SPAWN_SCALE) / 2)
            .add(this.domainController.origin);
        this.addGridAtLocation(newOrigin);
        this.addGridAtLocation(newOrigin.clone().add(size));
        // this.addGridAtLocation(newOrigin.clone().add(new Vector(size.x, 0)));
        // this.addGridAtLocation(newOrigin.clone().add(new Vector(0, size.y)));
        this.addRadialRandom();
        this.addRadialRandom();
    }
    addRadialRandom(): void {
        const width = this.domainController.worldDimensions.x;
        this.addRadial(this.randomLocation(),
            Util.randomRange(width / 10, width / 5),  // Size
            Util.randomRange(50));  // Decay
    }

    addGridRandom(): void {
        this.addGridAtLocation(this.randomLocation());
    }

    addGridAtLocation(location: Vector): void {
        const width = this.domainController.worldDimensions.x;
        this.addGrid(location,
            Util.randomRange(width / 4, width / 2),  // Size
            Util.randomRange(50),  // Decay
            Util.randomRange(Math.PI / 2));
    }

    /**
     * World-space random location for tensor field spawn
     * Sampled from middle of screen (shrunk rectangle)
     */
    randomLocation(): Vector {
        const size = this.domainController.worldDimensions.multiplyScalar(this.TENSOR_SPAWN_SCALE);
        const location = new Vector(Math.random(), Math.random()).multiply(size);
        const newOrigin = this.domainController.worldDimensions.multiplyScalar((1 - this.TENSOR_SPAWN_SCALE) / 2);
        return location.add(this.domainController.origin).add(newOrigin);
    }

    getCrossLocations(): Vector[] {
        // Gets grid of points for vector field vis in world space
        const diameter = this.TENSOR_LINE_DIAMETER / this.domainController.zoom;
        const worldDimensions = this.domainController.worldDimensions;
        const nHor = Math.ceil(worldDimensions.x / diameter) + 1; // Prevent pop-in
        const nVer = Math.ceil(worldDimensions.y / diameter) + 1;
        const originX = diameter * Math.floor(this.domainController.origin.x / diameter);
        const originY = diameter * Math.floor(this.domainController.origin.y / diameter);

        const out: Vector[] = [];
        for (let x = 0; x <= nHor; x++) {
            for (let y = 0; y <= nVer; y++) {
                out.push(new Vector(originX + (x * diameter), originY + (y * diameter)));
            }
        }

        return out;
    }

    getTensorLine(point: Vector, tensorV: Vector): Vector[] {
        const transformedPoint = this.domainController.worldToScreen(point.clone());

        const diff = tensorV.multiplyScalar(this.TENSOR_LINE_DIAMETER / 2);  // Assumes normalised
        const start = transformedPoint.clone().sub(diff);
        const end = transformedPoint.clone().add(diff);
        return [start, end];
    }

    reset(): void {
        this.getBasisFields().forEach((field) => {
            field.removeDragListener?.()
        })
        super.reset()
    }

    protected addField(field: BasisField): void {
        super.addField(field)

        field.removeDragListener = this._dragController.register(
            () => field.centre,
            (...args) => {
                this._updateCallback()
                field.dragMoveListener.apply(field, args)
            },
            (...args) => {
                this._updateCallback()
                field.dragStartListener.apply(field, args)
            }
        )
    }

    removeField(field: BasisField): void {
        super.removeField(field)
        field.removeDragListener?.()
    }
}

export const TensorFieldGUI = () => {
    const {
        canvasEl, canvasRef,
        tensorField, fieldSmoothing, setFieldSmoothing,
        waterGenerator, redrawTrigger, triggerRedraw
    } = useMapCreate()
    
    const draw = useCallback(() => {
        if (!canvasRef.current) return
        
        const tensorCanvas = new DefaultCanvasWrapper(canvasRef.current)
        tensorCanvas.clearCanvas()
        tensorCanvas.setFillStyle("black")
        tensorCanvas.drawFrame(0, MAP_WIDTH, 0, MAP_HEIGHT)
        
        // Draw tensor grid
        const tensorPoints = tensorField.getCrossLocations()
        tensorCanvas.setStrokeStyle("white")
        tensorPoints.forEach((p) => {
            const tensor = tensorField.samplePoint(p)
            tensorCanvas.drawPolyline(tensorField.getTensorLine(p, tensor.getMajor()))
            tensorCanvas.drawPolyline(tensorField.getTensorLine(p, tensor.getMinor()))
        })

        // Draw blank water indicator
        tensorCanvas.setLineWidth(1)
        tensorCanvas.setStrokeStyle("black")
        tensorCanvas.setFillStyle("black")
        tensorCanvas.drawPolygon(waterGenerator.current.seaPolygon)
        tensorCanvas.drawPolygon(waterGenerator.current.riverPolygon)

        // Draw centers
        const domainController = DomainController.getInstance()
        tensorCanvas.setFillStyle(volcano.primary!)
        tensorField.getBasisFields().forEach((field) => {
            if (field.FIELD_TYPE === FIELD_TYPE.Grid) tensorCanvas.drawSquare(domainController.worldToScreen(field.centre), 7)
            else tensorCanvas.drawCircle(domainController.worldToScreen(field.centre), 7)
        })


    }, [tensorField, canvasEl])

    useEffect(() => {
        draw()
    }, [draw, redrawTrigger])

    return (
        <div className="canvas-container">
            { canvasEl }
            <SettingsMenu
                floating="top-right"
                containerProps={{ style: { left: "calc(100% + 8px)", top: 0 } }}
                extra={ (
                    <div>
                        The tensor field is used in the generation of the city's road network,
                        consisting of highway, major, and minor roadways, via the tracing
                        of its hyperstreamlines.
                    </div>
                ) }
                items={[
                    {
                        key: 3,
                        label: "Add field",
                        children: [
                            {
                                key: 4,
                                label: "Radial",
                                icon: <RadialIcon style={{ fontSize: 12 }} />,
                                onClick: () => (tensorField.addRadialRandom(), triggerRedraw())
                            },
                            {
                                key: 5,
                                label: "Grid",
                                icon: <GridIcon style={{ fontSize: 12 }} />,
                                onClick: () => (tensorField.addGridRandom(), triggerRedraw())
                            }
                        ]
                    },
                    {
                        key: 6,
                        label: "Edit fields",
                        disabled: tensorField.getBasisFields().length === 0,
                        children: tensorField.getBasisFields().map((field, i) => ({
                            key: `${ field.FOLDER_NAME }`,
                            label: `${ field.FOLDER_NAME }`,
                            children: [
                                {
                                    key: `${ field.FOLDER_NAME }.0`,
                                    label: (
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            Size
                                            <InputNumber
                                                min={ 0 }
                                                max={ 200 }
                                                value={ Number.parseFloat(field.size.toFixed(1)) }
                                                size="small"
                                                onChange={ (value) => {
                                                    if (value !== null) {
                                                        field.size = value
                                                        triggerRedraw()
                                                    }
                                                } }
                                                style={{ width: 64, color: "black" }}
                                            />
                                        </div>
                                    ),
                                    style: { paddingLeft: 56 }
                                },
                                {
                                    key: `${ field.FOLDER_NAME }.1`,
                                    label: (
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            Decay
                                            <InputNumber
                                                min={ -200 }
                                                max={ 200 }
                                                value={ Number.parseFloat(field.decay.toFixed(1)) }
                                                size="small"
                                                onChange={ (value) => {
                                                    if (value !== null) {
                                                        field.decay = value
                                                        triggerRedraw()
                                                    }
                                                } }
                                                style={{ width: 64, color: "black" }}
                                            />
                                        </div>
                                    ),
                                    style: { paddingLeft: 56 }
                                },
                                ...(field.FIELD_TYPE === FIELD_TYPE.Grid ? [{
                                    key: `${ field.FOLDER_NAME }.2`,
                                    label: (
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            Theta
                                            <InputNumber
                                                min={ -90 }
                                                max={ 90 }
                                                value={ Number.parseFloat((field as Grid).theta.toFixed(1)) }
                                                size="small"
                                                onChange={ (value) => {
                                                    if (value !== null) {
                                                        (field as Grid).theta = value
                                                        triggerRedraw()
                                                    }
                                                } }
                                                style={{ width: 64, color: "black" }}
                                            />
                                        </div>
                                    ),
                                    style: { paddingLeft: 56 }
                                }] : []),
                                {
                                    key: `${ field.FOLDER_NAME }.7`,
                                    label: "Delete",
                                    onClick: () => {
                                        tensorField.removeField(field)
                                        triggerRedraw()
                                    },
                                    style: { paddingLeft: 56 },
                                    icon: <DeleteIcon style={{ fontSize: 12 }} />
                                }
                            ]
                        }))
                    },
                    {
                        key: 0,
                        label: (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                Field smoothing
                                <Checkbox checked={ fieldSmoothing } onChange={ () => setFieldSmoothing(!fieldSmoothing) } />
                            </div>
                        ),
                        onClick: () => setFieldSmoothing(!fieldSmoothing)
                    },
                    {
                        key: 1,
                        label: "Use randomized preset",
                        onClick: () => {
                            tensorField.setRecommended()
                            triggerRedraw()
                        }
                    },
                    {
                        key: 2,
                        label: "Reset",
                        onClick: () => {
                            tensorField.reset()
                            triggerRedraw()
                        }
                    },
                ]}
            />
        </div>
    )
}