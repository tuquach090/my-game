class Character {
    constructor(x, y, assetManager) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.scale = 3; // Hệ số nhân tỷ lệ hình ảnh

        this.currentState = 'Idle';
        this.facingRight = true;

        this.frameX = 0;
        this.gameFrame = 0;
        this.staggerFrames = 6; // Tốc độ chạy khung hình hoạt ảnh

        this.assetManager = assetManager;
        
        // Các thuộc tính phục vụ hệ thống chiến đấu
        this.spritePrefix = ''; // Tiền tố ảnh động (ví dụ: 'Knight1_', 'Knight2_')
        this.maxHp = 100;
        this.hp = 100;
        this.isDead = false;
        this.isHurt = false;
    }

    /**
     * Vẽ nhân vật lên ngữ cảnh canvas 2D
     * @param {CanvasRenderingContext2D} ctx - Canvas Rendering Context 2D
     */
    draw(ctx) {
        const img = this.assetManager.getImage(this.spritePrefix + this.currentState);
        if (!img || !img.complete || img.naturalWidth === 0) return;

        // Giả sử mỗi khung hình (frame) là hình vuông có kích thước chiều rộng bằng chiều cao của ảnh gốc
        let frameWidth = img.naturalHeight;
        let numFrames = Math.floor(img.naturalWidth / frameWidth);

        if (numFrames === 0) numFrames = 1;

        // Khi chỉ số frame vượt quá tổng số lượng khung hình hiện có
        if (this.frameX >= numFrames) {
            this.handleAnimationEnd(numFrames);
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Vẽ bóng dưới chân nhân vật
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vẽ ảnh frame hiện tại cắt từ spritesheet lớn
        ctx.drawImage(
            img,
            this.frameX * frameWidth, 0, frameWidth, img.naturalHeight,
            -frameWidth * this.scale / 2, -img.naturalHeight * this.scale + (img.naturalHeight * this.scale * 0.1), // Căn chỉnh tọa độ chân khớp mặt đất
            frameWidth * this.scale, img.naturalHeight * this.scale
        );

        ctx.restore();

        this.updateAnimationFrame(numFrames);
    }

    /**
     * Xử lý logic khi hoạt ảnh chạy hết số lượng khung hình.
     * Mặc định là lặp lại (loop). Lớp con sẽ override để xử lý trạng thái cụ thể.
     * @param {number} numFrames - Số lượng khung hình
     */
    handleAnimationEnd(numFrames) {
        this.frameX = 0;
    }

    /**
     * Tăng số thứ tự của khung hình hoạt ảnh (frameX) dựa trên staggerFrames
     * @param {number} numFrames - Số lượng khung hình
     */
    updateAnimationFrame(numFrames) {
        if (this.gameFrame % this.staggerFrames === 0) {
            if (this.currentState === 'Dead' && this.frameX === numFrames - 1) {
                // Giữ nguyên frame cuối cùng của hoạt ảnh chết
            } else {
                this.frameX++;
            }
        }
        this.gameFrame++;
    }
}
