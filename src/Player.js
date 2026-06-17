class Player extends Character {
    /**
     * @param {number} x - Vị trí trục X ban đầu
     * @param {number} y - Vị trí trục Y ban đầu
     * @param {AssetManager} assetManager - Bộ quản lý tài nguyên ảnh
     */
    constructor(x, y, assetManager) {
        super(x, y, assetManager);
        
        this.isAttacking = false;
        this.isDefending = false;
        this.isDead = false;

        // Các thuộc tính bổ sung cho hệ thống chiến đấu & điểm số
        this.spritePrefix = 'Knight1_';
        this.maxHp = 100;
        this.hp = 100;
        this.score = 0;
        this.hasDealtDamage = false; // Đảm bảo chỉ gây sát thương 1 lần cho mỗi đòn đánh
        
        this.defendStartTime = 0; // Thời điểm bắt đầu nhấn giữ nút đỡ đòn
        this.parryTime = 0;       // Thời điểm phản đòn thành công gần nhất

        // Sử dụng mô hình Composition để chia nhỏ logic di chuyển và chiến đấu
        this.movement = new MovementController(this, 3, 6, 0.5, -10);
        this.combat = new CombatController(this);
    }

    /**
     * Cập nhật trạng thái người chơi
     * @param {InputHandler} input - Trạng thái phím nhấn
     * @param {number} groundY - Tọa độ mặt đất
     * @param {number} canvasWidth - Chiều rộng khung hình
     */
    update(input, groundY, canvasWidth) {
        if (this.isDead) return;

        // Nếu đang bị thương (Hurt) hoặc Chặn đòn (Protect), bỏ qua điều khiển phím nhấn
        if (this.isHurt || this.currentState === 'Protect') {
            this.movement.applyPhysics(groundY, canvasWidth);
            this.updateStaggerFrames();
            return;
        }

        // 1. Ưu tiên xử lý trạng thái chiến đấu (Đỡ đòn, Tấn công) trước
        this.combat.handleCombat(input);

        // 2. Xử lý di chuyển (Trái, Phải, Nhảy)
        this.movement.handleMovement(input, groundY);

        // 3. Áp dụng các tính toán vật lý chuyển động, trọng lực và biên
        this.movement.applyPhysics(groundY, canvasWidth);

        // 4. Cập nhật tốc độ thay đổi frame ảnh dựa trên trạng thái hành động
        this.updateStaggerFrames();
    }

    /**
     * Thiết lập nhân vật chuyển sang hoạt ảnh tấn công
     * @param {string} attackState - Trạng thái tấn công ('Attack 1', 'Attack 2', 'Attack 3')
     */
    startAttack(attackState) {
        this.isAttacking = true;
        this.currentState = attackState;
        this.frameX = 0;
        this.vx = 0;
        this.hasDealtDamage = false; // Reset cờ để gây sát thương đòn đánh mới
    }

    /**
     * Nhận sát thương từ quái vật
     * @param {number} amount - Lượng sát thương nhận vào
     * @param {number} attackerX - Vị trí của kẻ địch
     * @returns {string} - Kết quả: 'hit' (trúng đòn), 'block' (đỡ đòn), hoặc 'parry' (phản đòn)
     */
    takeDamage(amount, attackerX) {
        if (this.isDead) return 'none';

        // Kiểm tra xem người chơi có quay mặt về phía quái vật khi đỡ đòn hay không
        const isFacingAttacker = (attackerX > this.x && this.facingRight) || (attackerX < this.x && !this.facingRight);
        let result = 'hit';

        if (this.isDefending && isFacingAttacker) {
            const now = Date.now();
            const parryWindow = 250; // Khoảng thời gian (ms) vàng để thực hiện phản đòn

            if (now - this.defendStartTime <= parryWindow) {
                // --- PHẢN ĐÒN THÀNH CÔNG (PARRY) ---
                result = 'parry';
                this.currentState = 'Protect';
                this.frameX = 0;
                this.vx = 0;
                this.parryTime = now; // Ghi nhận thời điểm để vẽ text hiệu ứng
            } else {
                // --- ĐỠ ĐÒN THƯỜNG (BLOCK) ---
                result = 'block';
                const finalDamage = Math.round(amount * 0.15); // Giảm 85% sát thương
                this.hp -= finalDamage;
                this.currentState = 'Protect';
                this.frameX = 0;
                this.vx = 0;
            }
        } else {
            // --- TRÚNG ĐÒN (HIT) ---
            this.hp -= amount;
            this.isHurt = true;
            this.isAttacking = false;
            this.currentState = 'Hurt';
            this.frameX = 0;
            this.vx = attackerX > this.x ? -4 : 4; // Knockback lùi lại
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            this.currentState = 'Dead';
            this.frameX = 0;
            this.vx = 0;
        }

        return result;
    }

    /**
     * Override hành vi khi một chuỗi ảnh động kết thúc
     * @param {number} numFrames - Tổng số frame trong hoạt ảnh hiện tại
     */
    handleAnimationEnd(numFrames) {
        if (this.isAttacking || this.currentState === 'Dead' || this.currentState === 'Hurt' || this.currentState === 'Protect') {
            if (this.currentState === 'Dead') {
                this.frameX = numFrames - 1; // Giữ nguyên frame cuối cùng khi chết
            } else {
                // Kết thúc đòn đánh, bị thương, hoặc đỡ đòn thành công, đưa trạng thái về Idle
                this.isAttacking = false;
                this.isHurt = false;
                this.frameX = 0;
                this.currentState = 'Idle';
            }
        } else {
            this.frameX = 0;
        }
    }

    /**
     * Điều chỉnh độ trễ chuyển đổi frame ảnh (staggerFrames) theo từng hành động để hoạt họa mượt mà hơn
     */
    updateStaggerFrames() {
        if (this.currentState === 'Run') {
            this.staggerFrames = 4;
        } else if (this.currentState === 'Walk') {
            this.staggerFrames = 6;
        } else if (this.currentState === 'Idle') {
            this.staggerFrames = 8;
        } else {
            this.staggerFrames = 5;
        }
    }
}
