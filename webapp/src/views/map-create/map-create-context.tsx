import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { red, volcano, yellow, orange, blue, green, gray } from '@ant-design/colors'
import { MapData } from '../../api'
import WaterGenerator, { WaterParams } from '../../MapGenerator/src/ts/impl/water_generator'
import StreamlineGenerator, { StreamlineParams } from '../../MapGenerator/src/ts/impl/streamlines'
import FieldIntegrator, { RK4Integrator } from '../../MapGenerator/src/ts/impl/integrator'
import TensorField from '../../MapGenerator/src/ts/impl/tensor_field'
import { TensorFieldInternal } from './tensor-field-ui'
import DragController from '../../MapGenerator/src/ts/ui/drag_controller'
import DomainController from '../../MapGenerator/src/ts/ui/domain_controller'
import Util from '../../MapGenerator/src/ts/util'
import Vector from '../../MapGenerator/src/ts/vector'
import Graph from '../../MapGenerator/src/ts/impl/graph'
import PolygonFinder, { PolygonParams } from '../../MapGenerator/src/ts/impl/polygon_finder'
import { DefaultCanvasWrapper } from '../../MapGenerator/src/ts/ui/canvas_wrapper'
import { BuildingModel, BuildingModels } from '../../MapGenerator/src/ts/ui/buildings'
import PolygonUtil from '../../MapGenerator/src/ts/impl/polygon_util'

interface ParkParams {
    numBigParks: number
    numSmallParks: number
    clusterBigParks: boolean
}

interface IMapContext {
    tensorField: TensorFieldInternal
    integrator: FieldIntegrator
    waterGenerator: React.MutableRefObject<WaterGenerator>
    createWaterGenerator: (params: WaterParams) => WaterGenerator
    generateWater: (regenerate?: boolean) => void
    mainRoadGenerator: React.MutableRefObject<StreamlineGenerator>
    majorRoadGenerator: React.MutableRefObject<StreamlineGenerator>
    minorRoadGenerator: React.MutableRefObject<StreamlineGenerator>
    createRoadGenerator: (params: StreamlineParams) => StreamlineGenerator
    generateRoads: (regenerate?: boolean) => void
    generateParks: () => void
    generateBuildings: () => void
    minorParams: StreamlineParams
    majorParams: StreamlineParams
    mainParams: StreamlineParams
    waterParams: WaterParams
    parkParams: ParkParams
    buildingParams: PolygonParams
    setWaterParams: React.Dispatch<React.SetStateAction<WaterParams>>
    setParkParams: React.Dispatch<React.SetStateAction<ParkParams>>
    setBuildingParams: React.Dispatch<React.SetStateAction<PolygonParams>>
    seaPolygon?: Vector[]
    riverPolygon?: Vector[]
    mainRoads?: Vector[][]
    coastalRoads?: Vector[][]
    majorRoads?: Vector[][]
    minorRoads?: Vector[][]
    bigParks?: Vector[][]
    smallParks?: Vector[][]
    buildings?: BuildingModels
    dragController: DragController
    drawRoadParks: () => void
    drawBuildings: () => void
    collectMapData: () => MapData | undefined
    canvasEl: JSX.Element,
    canvasRef: React.MutableRefObject<HTMLCanvasElement|null>
    fieldSmoothing: boolean
    setFieldSmoothing: React.Dispatch<React.SetStateAction<boolean>>
    redrawTrigger: number
    triggerRedraw: () => void
}

interface MapCreateProviderProps {
    children?: ReactNode
}

export const MAP_WIDTH = 512
export const MAP_HEIGHT = 512

const MapCreateContext = createContext<IMapContext>({} as IMapContext)
export const MapCreateProvider = ({ children }: MapCreateProviderProps) => {
    const [redrawTrigger, setRedrawTrigger] = useState<number>(0)
    const triggerRedraw = useCallback(() => {
        setRedrawTrigger((v) => v+1)
    }, [])

    const [minorParams, setMinorParams] = useState<StreamlineParams>({
        dsep: 20,
        dtest: 15,
        dstep: 1,
        dlookahead: 40,
        dcirclejoin: 5,
        joinangle: 0.1, // ~30deg
        pathIterations: 1000,
        seedTries: 1000,
        simplifyTolerance: 0.5,
        collideEarly: 0
    })
    const [majorParams, setMajorParams] = useState<StreamlineParams>({
        ...minorParams,
        dsep: 40,
        dtest: 25,
        dlookahead: 200,
        collideEarly: 0
    })
    const [mainParams, setMainParams] = useState<StreamlineParams>({
        ...minorParams,
        dsep: 200,
        dtest: 30,
        dlookahead: 200,
        collideEarly: 0
    })
    const [waterParams, setWaterParams] = useState<WaterParams>({
        ...minorParams,
        coastNoise: {
            noiseEnabled: true,
            noiseSize: 30,
            noiseAngle: 20
        },
        riverNoise: {
            noiseEnabled: true,
            noiseSize: 30,
            noiseAngle: 20
        },
        riverBankSize: 10,
        riverSize: 30,
        pathIterations: 10000,
        simplifyTolerance: 10
    })
    const [parkParams, setParkParams] = useState<ParkParams>({
        numBigParks: 2,
        numSmallParks: 0,
        clusterBigParks: false
    })
    const [buildingParams, setBuildingParams] = useState<PolygonParams>({
        maxLength: 200,
        minArea: 30,
        shrinkSpacing: 4,
        chanceNoDivide: 0.05
    })

    const [seaPolygon, setSeaPolygon] = useState<Vector[]>()
    const [riverPolygon, setRiverPolygon] = useState<Vector[]>()
    const [mainRoads, setMainRoads] = useState<Vector[][]>()
    const [coastalRoads, setCoastalRoads] = useState<Vector[][]>()
    const [majorRoads, setMajorRoads] = useState<Vector[][]>()
    const [minorRoads, setMinorRoads] = useState<Vector[][]>()
    const [bigParks, setBigParks] = useState<Vector[][]>()
    const [smallParks, setSmallParks] = useState<Vector[][]>()
    const [buildings, setBuildings] = useState<BuildingModels>()

    const [dragController, setDragController] = useState<DragController>(new DragController(triggerRedraw))
    const [tensorField, setTensorField] = useState<TensorFieldInternal>(() => {
        const tf = new TensorFieldInternal(dragController, triggerRedraw, {
            globalNoise: false,
            noiseSizePark: 20,
            noiseAnglePark: 90,
            noiseSizeGlobal: 30,
            noiseAngleGlobal: 20
        })
        tf.setRecommended()
        return tf
    })
    const [integrator, setIntegrator] = useState<FieldIntegrator>(
        new RK4Integrator(tensorField, minorParams)
    )

    const createWaterGenerator = useCallback((params: WaterParams) => {
        const domainController = DomainController.getInstance()
        domainController.zoom = domainController.zoom / Util.DRAW_INFLATE_AMOUNT
        const generator = new WaterGenerator(
            integrator,
            domainController.origin,
            domainController.worldDimensions,
            Object.assign({}, params),
            tensorField
        )
        domainController.zoom = domainController.zoom * Util.DRAW_INFLATE_AMOUNT
        return generator
    }, [integrator, tensorField])
    const waterGenerator = useRef<WaterGenerator>(createWaterGenerator(waterParams))
    const generateWater = useCallback((regenerate=true) => {
        if (regenerate) waterGenerator.current = createWaterGenerator(waterParams)
        tensorField.sea = []
        tensorField.river = []
        tensorField.parks = []
        waterGenerator.current.clearStreamlines()
        waterGenerator.current.createCoast()
        waterGenerator.current.createRiver()
        waterGenerator.current.joinDanglingStreamlines()
        
        setSeaPolygon(waterGenerator.current.seaPolygon)
        setRiverPolygon(waterGenerator.current.riverPolygon)
    }, [createWaterGenerator, tensorField, waterParams])

    const createRoadGenerator = useCallback((params: StreamlineParams) => {
        const domainController = DomainController.getInstance()
        domainController.zoom = domainController.zoom / Util.DRAW_INFLATE_AMOUNT
        const generator = new StreamlineGenerator(
            integrator,
            domainController.origin,
            domainController.worldDimensions,
            Object.assign({}, params)
        )
        domainController.zoom = domainController.zoom * Util.DRAW_INFLATE_AMOUNT
        return generator
    }, [integrator])
    const mainRoadGenerator = useRef<StreamlineGenerator>(createRoadGenerator(mainParams))
    const majorRoadGenerator = useRef<StreamlineGenerator>(createRoadGenerator(majorParams))
    const minorRoadGenerator = useRef<StreamlineGenerator>(createRoadGenerator(minorParams))
    const generateRoads = useCallback((regenerate=true) => {
        if (regenerate) {
            mainRoadGenerator.current = createRoadGenerator(mainParams)
            majorRoadGenerator.current = createRoadGenerator(majorParams)
            minorRoadGenerator.current = createRoadGenerator(minorParams)
        }
        // tensorField.ignoreRiver = true
        mainRoadGenerator.current.createAllStreamlines(false)
        // tensorField.ignoreRiver = false
        majorRoadGenerator.current.createAllStreamlines(false)
        minorRoadGenerator.current.createAllStreamlines(false)
        mainRoadGenerator.current.joinDanglingStreamlines()
        majorRoadGenerator.current.joinDanglingStreamlines()
        minorRoadGenerator.current.joinDanglingStreamlines()
        waterGenerator.current.joinDanglingStreamlines()

        setMainRoads(mainRoadGenerator.current.allStreamlines)
        setCoastalRoads(waterGenerator.current.allStreamlines)
        setMajorRoads(majorRoadGenerator.current.allStreamlines)
        setMinorRoads(minorRoadGenerator.current.allStreamlines)
    }, [createRoadGenerator, mainParams, majorParams, minorParams, tensorField])

    const generateParks = useCallback(() => {
        if (!mainRoads || !majorRoads) return

        const createBigParks = (p: PolygonFinder) => {
            const polys = p.polygons.filter((p) => PolygonUtil.calcPolygonArea(p) > 40)
            const parks: Vector[][] = []
            if (polys.length > numBigParks) {
                if (clusterBigParks) {
                    const parkIndex = Math.floor(Math.random() * (polys.length - numBigParks))
                    for (let i = parkIndex; i < parkIndex + numBigParks; i++) {
                        parks.push(polys[i])
                    }
                } else {
                    for (let i = 0; i < numBigParks; i++) {
                        const parkIndex = Math.floor(Math.random() * polys.length)
                        parks.push(polys[parkIndex]);
                    }
                }
            } else {
                parks.push(...polys)
            }
            return parks
        }

        const createSmallParks = (p: PolygonFinder) => {
            const parks: Vector[][] = []
            for (let i = 0; i < numSmallParks; i++) {
                const parkIndex = Math.floor(Math.random() * p.polygons.length);
                parks.push(p.polygons[parkIndex]);
            }
            return parks
        }

        const majorGraph = new Graph(mainRoads.concat(majorRoads), minorParams.dstep)
        const majorPolyfinder = new PolygonFinder(majorGraph.nodes, {
            maxLength: 200,
            minArea: 40,
            shrinkSpacing: 4,
            chanceNoDivide: 1
        }, tensorField)
        majorPolyfinder.findPolygons()
        // const fullGraph = new Graph(mainRoads.concat(majorRoads).concat(minorRoads), minorParams.dstep)
        // const fullPolyfinder = new PolygonFinder(fullGraph.nodes, {
        //     maxLength: 1000,
        //     minArea: 200,
        //     shrinkSpacing: 4,
        //     chanceNoDivide: 1
        // }, tensorField)
        // fullPolyfinder.findPolygons()
        
        const { numBigParks, numSmallParks, clusterBigParks } = parkParams
        const newBigParks = createBigParks(majorPolyfinder).filter((p) => p !== undefined)
        // const newSmallParks = createSmallParks(fullPolyfinder).filter((p) => p !== undefined)
        const newSmallParks = []
        setBigParks(newBigParks)
        setSmallParks(newSmallParks)
        tensorField.parks = [...newBigParks, ...newSmallParks]

        // Regenerate minor roads with park noise applied
        minorRoadGenerator.current = createRoadGenerator(minorParams)
        minorRoadGenerator.current.createAllStreamlines(false)
        minorRoadGenerator.current.joinDanglingStreamlines()
        setMinorRoads(minorRoadGenerator.current.allStreamlines)

    }, [parkParams, minorParams, tensorField, mainRoads, majorRoads])

    const generateBuildings = useCallback(async () => {
        if (!mainRoads || !majorRoads || !minorRoads || !coastalRoads) return
        const graph = new Graph(
            mainRoads
                .concat(majorRoads)
                .concat(minorRoads)
                .concat(coastalRoads),
            minorParams.dstep,
            true
        )
        const polyfinder = new PolygonFinder(graph.nodes, buildingParams, tensorField)
        polyfinder.findPolygons()
        await polyfinder.shrink(false)
        await polyfinder.divide(false)
        const models = new BuildingModels(polyfinder.polygons)
        models.setBuildingProjections()
        setBuildings(models)
    }, [buildingParams, minorParams, tensorField, mainRoads, majorRoads, minorRoads, coastalRoads])

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [canvasEl, setCanvas] = useState(
        <canvas
            id="map-canvas"
            width={ MAP_WIDTH }
            height={ MAP_HEIGHT }
            ref={ canvasRef }
            style={{ background: "rgba(0, 0, 0, 0.05)", border: `1px solid ${ red[7] }D9`, borderRadius: 4 }}
        />
    )

    const [fieldSmoothing, setFieldSmoothing] = useState<boolean>(false)

    const drawRoadParks = useCallback(() => {
        if (
            !canvasEl || !seaPolygon || !riverPolygon || !bigParks || !smallParks ||
            !mainRoads || !majorRoads || !minorRoads || !coastalRoads
        ) return

        const domainController = DomainController.getInstance()
        const canvas = new DefaultCanvasWrapper(canvasRef.current!)
        canvas.clearCanvas()
        canvas.setFillStyle("#FCF6D9")
        canvas.drawFrame(0, MAP_WIDTH, 0, MAP_HEIGHT)
        
        const drawRoad = (road: Vector[]) => canvas.drawPolyline(road)
        const drawRoads = (roads: Vector[][]) => roads.forEach((road) => {
            drawRoad(road.map((v) => domainController.worldToScreen(v.clone())))
        })

        /** Sea */
        canvas.setFillStyle(blue[6])
        canvas.setStrokeStyle(blue[6])
        canvas.setLineWidth(0.1)
        canvas.drawPolygon(seaPolygon)
        
        /** Coastline */
        canvas.setLineWidth(30)
        canvas.setStrokeStyle("#FCF6D9")
        canvas.drawPolyline(waterGenerator.current.coastline)

        /** Parks */
        canvas.setFillStyle(green[6])
        bigParks.forEach((park) => canvas.drawPolygon(park))
        smallParks.forEach((park) => canvas.drawPolygon(park))

        /** River */
        canvas.setFillStyle(blue[6])
        canvas.setStrokeStyle(blue[6])
        canvas.setLineWidth(1)
        canvas.drawPolygon(riverPolygon)
        
        
        /** Major roads */
        canvas.setLineWidth(2)
        canvas.setStrokeStyle("rgb(64, 64, 64)")
        drawRoads(majorRoads)
        canvas.setStrokeStyle("hotpink")
        // canvas.drawPolyline(waterGenerator.current.riverSecondaryRoad)


        /** Main roads & coastal roads */
        canvas.setLineWidth(3)
        canvas.setStrokeStyle(yellow[6])
        drawRoads(mainRoads)
        drawRoads(coastalRoads)

        /** Parks */
        canvas.setFillStyle(green[6])
        bigParks.forEach((park) => canvas.drawPolygon(park))
        smallParks.forEach((park) => canvas.drawPolygon(park))

        /** Minor roads */
        canvas.setLineWidth(2)
        canvas.setStrokeStyle("black")
        drawRoads(minorRoads)
        canvas.setLineWidth(1)
        canvas.setStrokeStyle("white")
        drawRoads(minorRoads)

        canvas.setStrokeStyle("hotpink")
        // canvas.drawPolyline(waterGenerator.current.riverSecondaryRoad)


    }, [canvasEl, mainRoads, coastalRoads, majorRoads, minorRoads, bigParks, smallParks, seaPolygon, riverPolygon])
    
    const drawBuildings = useCallback(() => {
        const canvas = new DefaultCanvasWrapper(canvasRef.current!)
        drawRoadParks()

        if (!canvasEl || !buildings) return
        
        canvas.setFillStyle("#F9ECAC")
        canvas.setStrokeStyle("gray")
        buildings.buildingModels.forEach((lot) => {
            canvas.drawPolygon(lot.lotWorld)
        })
    }, [canvasEl, buildings, drawRoadParks])

    const collectMapData = useCallback(() => {
        if (
            !seaPolygon || !riverPolygon || !bigParks || !smallParks ||
            !mainRoads || !majorRoads || !minorRoads || !coastalRoads || !buildings
        ) return
        return {
            mainRoads: mainRoadGenerator.current.allStreamlinesSimple,
            majorRoads: majorRoadGenerator.current.allStreamlinesSimple,
            minorRoads: minorRoadGenerator.current.allStreamlinesSimple,
            coastalRoads: coastalRoads.map((road) => waterGenerator.current.simplifyStreamline(road)),
            bigParks,
            smallParks,
            buildings: buildings.buildingModels.map((lot) => ({
                data: lot.lotWorld,
                height: lot.height
            })),
            sea: waterGenerator.current.simplifyStreamline(seaPolygon),
            river: waterGenerator.current.simplifyStreamline(riverPolygon),
        }
    }, [mainRoads, coastalRoads, majorRoads, minorRoads, bigParks, smallParks, seaPolygon, riverPolygon, buildings])

    useEffect(() => {
        tensorField.smooth = fieldSmoothing
        triggerRedraw()
    }, [tensorField, fieldSmoothing, triggerRedraw])

    useEffect(() => {
        generateWater(false)
    }, [])

    useEffect(() => {
        generateRoads()
    }, [seaPolygon, riverPolygon])

    useEffect(() => {
        generateParks()
    }, [mainRoads, majorRoads])
    
    return (
        <MapCreateContext.Provider value={{
            tensorField,
            integrator,
            waterGenerator,
            generateWater,
            createWaterGenerator,
            mainRoadGenerator,
            majorRoadGenerator,
            minorRoadGenerator,
            createRoadGenerator,
            generateRoads,
            generateParks,
            generateBuildings,
            minorParams,
            majorParams,
            mainParams,
            waterParams, setWaterParams,
            parkParams, setParkParams,
            buildingParams, setBuildingParams,
            seaPolygon, riverPolygon,
            mainRoads, coastalRoads,
            majorRoads, minorRoads,
            bigParks, smallParks,
            buildings,
            dragController,
            drawRoadParks,
            drawBuildings,
            collectMapData,
            canvasEl, canvasRef,
            fieldSmoothing, setFieldSmoothing,
            redrawTrigger, triggerRedraw
        }}>
            { children }
        </MapCreateContext.Provider>
    )
}

export const useMapCreate = () => useContext(MapCreateContext)