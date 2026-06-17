class Background {
    constructor(canvas, assetManager) {
        this.canvas = canvas;
        this.assetManager = assetManager;
        this.imageName = 'background';
        
        // Yêu cầu AssetManager tải ảnh nền bản đồ
        this.assetManager.loadImage(this.imageName, 'assets/map/nature_1/origbig.png');
    }

    /**
     * Vẽ ảnh nền phủ kín canvas hiện tại
     * @param {CanvasRenderingContext2D} ctx - Canvas Rendering Context 2D
     */
    draw(ctx) {
        const bgImage = this.assetManager.getImage(this.imageName);
        if (bgImage && bgImage.complete && bgImage.naturalWidth !== 0) {
            ctx.drawImage(bgImage, 0, 0, this.canvas.width, this.canvas.height);
        }
    }
}
