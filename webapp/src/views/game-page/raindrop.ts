export class Raindrop {
    private x: number
    private y: number
    private width: number
    private height: number
    private speed: number
    
    constructor(private canvas: HTMLCanvasElement) {
        this.x = Math.random() * this.canvas.width
        this.y = -15
        this.width = 2 + (Math.random() * 3)
        this.height = 6 + (Math.random() * 10)
        this.speed = 15 + (Math.random() * 10)
    }

    get offscreen() {
        return this.y > this.canvas.height
    }

    update() {
        this.y += this.speed
    }

    render() {
        const ctx = this.canvas.getContext("2d")
        if (!ctx) return
        
        ctx.fillStyle = "rgba(0, 0, 240, 0.4)"
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}