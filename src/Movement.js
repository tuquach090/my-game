class MovementController {
    /**
     * @param {Character} character - Đối tượng nhân vật cần điều khiển di chuyển
     * @param {number} [speed=3] - Tốc độ đi bộ
     * @param {number} [runSpeed=6] - Tốc độ chạy nhanh
     * @param {number} [gravity=0.5] - Gia tốc trọng lực
     * @param {number} [jumpStrength=-10] - Lực nhảy ban đầu
     */
    constructor(character, speed = 3, runSpeed = 6, gravity = 0.5, jumpStrength = -10) {
        this.character = character;
        this.speed = speed;
        this.runSpeed = runSpeed;
        this.gravity = gravity;
        this.jumpStrength = jumpStrength;
    }

    /**
     * Xử lý di chuyển dựa trên phím nhập từ bàn phím
     * @param {InputHandler} input - Đối tượng quản lý phím nhấn
     * @param {number} groundY - Tọa độ trục Y của mặt đất
     */
    handleMovement(input, groundY) {
        // Nếu nhân vật đã chết hoặc đang ở giữa động tác tấn công thì bỏ qua di chuyển mới
        if (this.character.isDead || this.character.isAttacking) return;

        // Nếu nhân vật đang trong trạng thái đỡ đòn, không cho phép di chuyển
        if (this.character.isDefending) {
            this.character.vx = 0;
            return;
        }

        // Di chuyển sang trái
        if (input.isPressed('a') || input.isPressed('ArrowLeft')) {
            this.character.facingRight = false;
            if (input.isPressed('Shift')) {
                this.character.vx = -this.runSpeed;
                this.character.currentState = 'Run';
            } else {
                this.character.vx = -this.speed;
                this.character.currentState = 'Walk';
            }
        }
        // Di chuyển sang phải
        else if (input.isPressed('d') || input.isPressed('ArrowRight')) {
            this.character.facingRight = true;
            if (input.isPressed('Shift')) {
                this.character.vx = this.runSpeed;
                this.character.currentState = 'Run';
            } else {
                this.character.vx = this.speed;
                this.character.currentState = 'Walk';
            }
        }
        // Dừng di chuyển ngang
        else {
            this.character.vx = 0;
            if (!this.character.isDefending && this.character.y === groundY) {
                this.character.currentState = 'Idle';
            }
        }

        // Nhảy lên (Chỉ khi đang tiếp đất và không trong trạng thái đỡ đòn)
        if ((input.isPressed(' ') || input.isPressed('ArrowUp')) && 
            this.character.y === groundY && 
            !this.character.isDefending) {
            this.character.vy = this.jumpStrength;
            this.character.currentState = 'Jump';
        }
    }

    /**
     * Áp dụng chuyển động vật lý, trọng lực và giữ nhân vật nằm trong vùng canvas
     * @param {number} groundY - Tọa độ trục Y của mặt đất
     * @param {number} canvasWidth - Chiều rộng của canvas
     */
    applyPhysics(groundY, canvasWidth) {
        this.character.x += this.character.vx;
        this.character.y += this.character.vy;

        // Trọng lực kéo nhân vật rơi xuống đất
        if (this.character.y < groundY) {
            this.character.vy += this.gravity;
            if (!this.character.isAttacking && !this.character.isDefending) {
                this.character.currentState = 'Jump';
            }
        } else {
            this.character.vy = 0;
            this.character.y = groundY;
        }

        // Kiểm tra giới hạn biên trái và phải màn hình
        if (this.character.x < 50) this.character.x = 50;
        if (this.character.x > canvasWidth - 50) this.character.x = canvasWidth - 50;
    }
}
