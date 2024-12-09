import { Tooltip } from 'antd'
import { TooltipPropsWithOverlay } from 'antd/es/tooltip'

interface InfoTooltipProps extends TooltipPropsWithOverlay {
}

export const InfoTooltip = ({ }: InfoTooltipProps) => {
    return (
        <Tooltip
            className="info-tooltip"
        >
            <div style={{
                borderRadius: "50%",
                border: "1px solid darkgray",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: 16,
                height: 16,
                fontSize: 13 }}
            >
                <span style={{marginBottom: 1}}>?</span>
            </div>
        </Tooltip>
    )
}