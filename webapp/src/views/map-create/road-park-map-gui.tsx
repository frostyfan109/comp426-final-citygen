import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Checkbox, InputNumber } from 'antd'
import { useMapCreate } from './map-create-context'
import { SettingsMenu } from '../../components/settings-menu'

export const RoadParkMapGUI = () => {
    const {
        canvasEl, drawRoadParks,
        parkParams, setParkParams, generateRoads, generateParks,
        redrawTrigger, triggerRedraw
    } = useMapCreate()

    useEffect(() => {
        drawRoadParks()
    }, [drawRoadParks, redrawTrigger])

    return (
        <div className="canvas-container">
            { canvasEl }
            <SettingsMenu
                floating="top-right"
                containerProps={{ style: { left: "calc(100% + 8px)", top: 0 } }}
                items={[
                    {
                        key: 1,
                        label: "Generate",
                        onClick: () => (generateRoads(), generateParks())
                    },
                    {
                        key: "parks",
                        label: "Parks",
                        children: [
                            {
                                key: "parks.generate",
                                label: "Regenerate parks",
                                onClick: () => generateParks(),
                                style: { paddingLeft: 32 }
                            },
                            {
                                key: `parks.numbig`,
                                label: (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        Big parks
                                        <InputNumber
                                            value={ parkParams.numBigParks }
                                            size="small"
                                            min={ 0 }
                                            max={ 5 }
                                            onChange={ (value) => {
                                                if (value !== null) {
                                                    parkParams.numBigParks = Math.round(value)
                                                    setParkParams(parkParams)
                                                    triggerRedraw()
                                                }
                                            } }
                                            style={{ width: 64, color: "black" }}
                                        />
                                    </div>
                                ),
                                style: { paddingLeft: 32 }
                            },
                            // {
                            //     key: `parks.numsmall`,
                            //     label: (
                            //         <div style={{ display: "flex", justifyContent: "space-between" }}>
                            //             Small parks
                            //             <InputNumber
                            //                 value={ parkParams.numSmallParks }
                            //                 size="small"
                            //                 min={ 0 }
                            //                 max={ 5 }
                            //                 onChange={ (value) => {
                            //                     if (value !== null) {
                            //                         parkParams.numSmallParks = Math.round(value)
                            //                         setParkParams(parkParams)
                            //                         triggerRedraw()
                            //                     }
                            //                 } }
                            //                 style={{ width: 64, color: "black" }}
                            //             />
                            //         </div>
                            //     ),
                            //     style: { paddingLeft: 32 }
                            // },
                            {
                                key: "parks.clustering",
                                label: (
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        Cluster big parks
                                        <Checkbox
                                            checked={ parkParams.clusterBigParks }
                                            onChange={ () => {
                                                parkParams.clusterBigParks = !parkParams.clusterBigParks
                                                setParkParams(parkParams)
                                                triggerRedraw()
                                            } }
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