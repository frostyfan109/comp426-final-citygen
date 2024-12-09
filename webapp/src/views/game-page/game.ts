import chroma from 'chroma-js'
import { Player } from './player'
import { Raindrop } from './raindrop'
import { GrayscalePalette, PastelPalette } from './palette'
import { MAP_HEIGHT, MAP_WIDTH } from '../map-create/map-create-context'
import { MapData } from '../../api'
import PolygonUtil from '../../MapGenerator/src/ts/impl/polygon_util'
import Vector from '../../MapGenerator/src/ts/vector'

const Raycaster = require('engine')

interface GameVector {
    x: number
    y: number
}

export class Game {
    WORLD_WIDTH = 20000
    WORLD_HEIGHT = 20000
    
    WATER_COLOR = new Raycaster.Color(0, 0, 255, 1)
    COASTLINE_COLOR = new Raycaster.Color(252, 246, 217, 1)
    MAIN_ROAD_COLOR = new Raycaster.Color(164, 164, 164, 1)
    MAJOR_ROAD_COLOR = new Raycaster.Color(164, 164, 164, 1)
    MINOR_ROAD_COLOR = new Raycaster.Color(164, 164, 164, 1)
    PARK_COLOR = new Raycaster.Color(0, 180, 0, 1)
    WORLD_BOUNDARY_COLOR = new Raycaster.Color(255, 165, 0, 1)

    
    private _raycaster
    private _game
    private _player
    private raining = false
    private rain: Raindrop[] = []

    constructor(private canvas, private mapData: MapData) {
    }

    get worldScaleX() {
        return this.WORLD_WIDTH / MAP_WIDTH
    }

    get worldScaleY() {
        return this.WORLD_HEIGHT / MAP_HEIGHT
    }

    get player() {
        return this._player
    }

    get game() {
        return this._game
    }

    get raycaster() {
        return this._raycaster
    }

    get soundEnabled() {
        return this._player.soundEnabled
    }
    
    set soundEnabled(value: boolean) {
        this._player.soundEnabled = value
    }

    // startRain() {
    //     this.raining = true
    //     setInterval(() => {
    //         this.rain.push(new Raindrop(this.canvas))
    //     }, 30)
    //     setInterval(() => {
    //         this.rain = this.rain.filter((drop) => {
    //             drop.update()
    //             if (drop.offscreen) return false
    //             return true
    //         })
    //     }, 15)
    // }

    findSpawnPoint() {
        // return { x: this.WORLD_WIDTH / 4, y: this.WORLD_HEIGHT / 4 }
        const rowIndex = Math.floor(Math.random() * this.mapData.mainRoads.length)
        const colIndex = Math.floor(Math.random() * this.mapData.mainRoads[rowIndex].length)
        const v = this.mapData.mainRoads[rowIndex][colIndex]
        // Retry
        if (
            v.x < 0 || v.y < 0 || v.x > MAP_WIDTH || v.y > MAP_HEIGHT ||
            PolygonUtil.insidePolygon(v, this.mapData.sea) || PolygonUtil.insidePolygon(v, this.mapData.river)
        ) return this.findSpawnPoint()
        return { x: v.x * this.worldScaleX, y: v.y * this.worldScaleY }
    }

    createWallPolygon(polygon: GameVector[], options: any={}) {
        const walls = polygon.map((vector, i) => {
            const nextVector = i === polygon.length - 1 ? polygon[0] : polygon[i + 1]
            return new Raycaster.Wall(
                this._raycaster,
                vector.x * this.worldScaleX,
                vector.y * this.worldScaleY,
                nextVector.x * this.worldScaleX,
                nextVector.y * this.worldScaleY,
                options
            )
        })
        if (options.filled) {
            walls.forEach((w) => {
                w.associated = walls
                w.polygon = PolygonUtil.polygonToPolygonArray(
                    polygon.map((v) => new Vector(v.x * this.worldScaleX, v.y * this.worldScaleY))
                )
            })
        }
        return walls
    }

    createMap() {
        const objects: any[] = []
        const palette = new PastelPalette({
            minLightness: 0.2,
            minBrightness: 0.2,
            maxBrightness: 0.6,
            maxLightness: 0.8,
            minSaturation: 0.2,
            mode: null
        })
        const heights = this.mapData.buildings.map((i) => i.height)
        const minHeight = Math.min(...heights)
        const maxHeight = Math.max(...heights)

        objects.push(this.createWallPolygon([
            {x: 0, y: 0}, {x: MAP_WIDTH, y: 0}, {x: MAP_WIDTH, y: MAP_HEIGHT}, {x: 0, y: MAP_HEIGHT}
        ], {
            color: this.WORLD_BOUNDARY_COLOR,
            varHeight: 25,
            worldBound: true
        }))

        PolygonUtil.subdividePolygon(this.mapData.river.map((v) => new Vector(v.x, v.y)), 500, true).forEach((riverChunk) => {
            objects.push(...this.createWallPolygon(riverChunk, {
                color: this.WATER_COLOR,
                collision: true,
                varHeight: 0.01,
                filled: true
            }))
        })

        objects.push(...this.createWallPolygon(this.mapData.sea, {
            color: this.WATER_COLOR,
            // collision: true,
            // varHeight: 0.5,
            collision: true,
            varHeight: 0.01,
            filled: true
        }))

        this.mapData.bigParks.forEach((park) => {
            objects.push(...this.createWallPolygon(park, {
                color: this.PARK_COLOR,
                collision: false,
                varHeight: 0.01,
                filled: true
            }))
        })


        this.mapData.buildings.forEach((building) => {
            // if (building.data.find((v) => v.x <= 0 || v.y <= 0 || v.x >= MAP_WIDTH || v.y >= MAP_HEIGHT)) return
            const color = palette.getNextColor()
            objects.push(...this.createWallPolygon(building.data, {
                color: new Raycaster.Color(...color.rgb(), 1),
                varHeight: 1 + 7.5 * (building.height - minHeight) / (maxHeight - minHeight)
            }))     
        })
        
        // this.mapData.mainRoads.concat(this.mapData.coastalRoads).forEach((road) => {
        this.mapData.mainRoads.forEach((road) => {
        // this.mapData.mainRoads.forEach((road) => {
            road.forEach((startVec, i) => {
                if (i === road.length - 1) return
                const endVec = road[i + 1]
                objects.push(...this.createWallPolygon(PolygonUtil.resizeGeometry([startVec, endVec], 3, false), {
                    color: this.MAIN_ROAD_COLOR,
                    varHeight: 0.01,
                    collision: false,
                    filled: true
                }))
            })
        })

        this.mapData.majorRoads.forEach((road) => {
            road.forEach((startVec, i) => {
                if (i === road.length - 1) return
                const endVec = road[i + 1]
                objects.push(...this.createWallPolygon(PolygonUtil.resizeGeometry([startVec, endVec], 1.5, false), {
                    color: this.MAJOR_ROAD_COLOR,
                    varHeight: 0.01,
                    collision: false,
                    filled: true
                }))
            })
        })

        this.mapData.minorRoads.forEach((road) => {
            road.forEach((startVec, i) => {
                if (i === road.length - 1) return
                const endVec = road[i + 1]
                objects.push(...this.createWallPolygon(PolygonUtil.resizeGeometry([startVec, endVec], 1.5, false), {
                    color: this.MINOR_ROAD_COLOR,
                    varHeight: 0.01,
                    collision: false,
                    filled: true
                }))
            })
        })
        
        return objects
    }

    preload() {
        this._game = this._raycaster.createGameFromCanvas(function() {
            this.preload = () => {}
            this.create = () => {}
            this.update = () => {}
            this.render = () => {}
        }, this.canvas);
        (Player as any).KEYS = [{
            w: this._raycaster.keyboard.addKey(Raycaster.Key.W),
            a: this._raycaster.keyboard.addKey(Raycaster.Key.A),
            s: this._raycaster.keyboard.addKey(Raycaster.Key.S),
            d: this._raycaster.keyboard.addKey(Raycaster.Key.D),
            q: this._raycaster.keyboard.addKey(Raycaster.Key.Q),
            e: this._raycaster.keyboard.addKey(Raycaster.Key.E),
            shift: this._raycaster.keyboard.addKey(Raycaster.Key.SHIFT),
            space: this._raycaster.keyboard.addKey(Raycaster.Key.SPACE),
            up:{},
            down:{}
        }]
        // this.raycaster.loadTexture("sun1", `${ process.env.PUBLIC_URL || window.location.origin }/sun1.png`)
    }

    async create() {
        const { x: spawnX, y: spawnY } = this.findSpawnPoint()
        this._player = new Player(this._raycaster, this._game, spawnX, spawnY, { color: new Raycaster.Color(255, 0, 0, 1) })
        this._player.setupMouse()
        this._raycaster.addGameObject(this._player)
        // this.raycaster.debugObjects.push(this.player)
        this._raycaster.addGameObjects(this.createMap())
    }

    update() {
    }

    render() {
        this._player.render()
        this.rain.forEach((drop) => drop.render())
    }

    startGame() {
        const _this = this
        this._raycaster = new Raycaster.Engine(
            MAP_WIDTH,
            MAP_HEIGHT,
            "",
            function() { return _this },
            40000,
            75,
            false,
            {
                variableHeight: true,
                assetLoadState: null,
                worldWidth: this.WORLD_WIDTH,
                worldHeight: this.WORLD_HEIGHT,
                automaticallyResize: false,
            }
        )
        // this.raycaster.renderFPS = true
        this._raycaster.init()
        this._player.mouse.start()
    }
    endGame() {
        this._raycaster.running = false
        this._raycaster.terminated = true
        this._player.mouse.stop()
    }
}