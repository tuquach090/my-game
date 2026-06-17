class Monster extends Character {
    /**
     * @param {number} x - Vị trí trục X ban đầu của quái vật
     * @param {number} y - Vị trí trục Y ban đầu của quái vật
     * @param {AssetManager} assetManager - Bộ quản lý tài nguyên
     */
    constructor(x, y, assetManager) {
        super(x, y, assetManager);
        
        // Cấu hình riêng cho quái vật (Knight_2)
        this.spritePrefix = 'Knight2_';
        this.maxHp = 60;
        this.hp = 60;
        this.speed = 1.5; // Đi chậm hơn Player
        this.scale = 3;

        this.isAttacking = false;
        this.isDead = false;
        this.isHurt = false;
        
        // Trạng thái choáng (Stun)
        this.isStunned = false;
        this.stunTimer = 0;
        this.stunDuration = 0;
        
        // Logic AI
        this.attackRange = 80; // Khoảng cách có thể chém trúng Player
        this.chaseRange = 400; // Khoảng cách phát hiện và đuổi theo Player
        this.attackCooldown = 2000; // Thời gian giãn cách giữa các đòn đánh (ms)
        this.lastAttackTime = 0;
        this.hasDealtDamage = false; // Chỉ gây sát thương 1 lần mỗi đòn đánh
        
        this.patrolStartX = x;
        this.patrolRange = 150; // Khoảng cách tuần tra qua lại quanh điểm xuất phát
        
        // Hồi sinh
        this.respawnCooldown = 4000; // Hồi sinh sau 4 giây khi chết
        this.respawnTimer = 0;
    }

    /**
     * Cập nhật hành động của Quái vật
     * @param {Player} player - Đối tượng người chơi
     * @param {number} groundY - Tọa độ mặt đất
     * @param {number} canvasWidth - Chiều rộng khung hình
     */
    update(player, groundY, canvasWidth) {
        // Xử lý khi quái vật đã chết
        if (this.isDead) {
            const now = Date.now();
            if (now - this.respawnTimer > this.respawnCooldown) {
                this.respawn();
            }
            this.applyPhysics(groundY, canvasWidth);
            return;
        }

        // Xử lý khi đang bị choáng (Stun) - bị bất động trong thời gian chỉ định
        if (this.isStunned) {
            const now = Date.now();
            if (now - this.stunTimer > this.stunDuration) {
                this.isStunned = false;
                this.currentState = 'Idle';
            }
            this.applyPhysics(groundY, canvasWidth);
            this.updateStaggerFrames();
            return;
        }

        // Xử lý khi đang bị thương (Hurt) - bị giật lùi và không thể hành động
        if (this.isHurt) {
            this.applyPhysics(groundY, canvasWidth);
            this.updateStaggerFrames();
            return;
        }

        // Nếu quái vật không chết và không bị thương, tiến hành tính toán AI
        if (!this.isAttacking) {
            const distX = player.x - this.x;
            const distance = Math.abs(distX);

            if (!player.isDead && distance < this.attackRange) {
                // 1. Nếu Player đứng trong tầm đánh -> Dừng lại và chém
                this.vx = 0;
                this.facingRight = distX > 0;
                
                const now = Date.now();
                if (now - this.lastAttackTime > this.attackCooldown) {
                    this.isAttacking = true;
                    this.currentState = 'Attack 1';
                    this.frameX = 0;
                    this.lastAttackTime = now;
                    this.hasDealtDamage = false;
                }
            } else if (!player.isDead && distance < this.chaseRange) {
                // 2. Nếu Player trong tầm phát hiện -> Đuổi theo
                this.facingRight = distX > 0;
                this.vx = this.facingRight ? this.speed : -this.speed;
                this.currentState = 'Walk';
            } else {
                // 3. Nếu Player ở xa -> Đi tuần tra quanh khu vực ban đầu
                if (this.x > this.patrolStartX + this.patrolRange) {
                    this.facingRight = false;
                } else if (this.x < this.patrolStartX - this.patrolRange) {
                    this.facingRight = true;
                }
                this.vx = this.facingRight ? this.speed : -this.speed;
                this.currentState = 'Walk';
            }
        }

        // Áp dụng di chuyển vật lý
        this.applyPhysics(groundY, canvasWidth);
        this.updateStaggerFrames();
    }

    /**
     * Áp dụng di chuyển vật lý và trọng lực cho Quái vật
     */
    applyPhysics(groundY, canvasWidth) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.y < groundY) {
            this.vy += 0.5; // Trọng lực
        } else {
            this.vy = 0;
            this.y = groundY;
        }

        // Giới hạn biên màn hình
        if (this.x < 50) this.x = 50;
        if (this.x > canvasWidth - 50) this.x = canvasWidth - 50;
    }

    /**
     * Nhận sát thương từ người chơi
     * @param {number} amount - Sát thương
     * @param {number} playerX - Vị trí của Player
     * @returns {boolean} - Trả về true nếu quái vật bị tiêu diệt
     */
    takeDamage(amount, playerX) {
        if (this.isDead) return false;

        this.hp -= amount;
        this.isHurt = true;
        this.isAttacking = false;
        this.currentState = 'Hurt';
        this.frameX = 0;
        
        // Knockback ngược lại hướng người chơi đánh
        this.vx = playerX > this.x ? -3 : 3;

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            this.currentState = 'Dead';
            this.frameX = 0;
            this.vx = 0;
            this.respawnTimer = Date.now();
            return true;
        }
        return false;
    }

    /**
     * Kích hoạt trạng thái bị choáng (Stun) cho Quái vật
     * @param {number} duration - Thời gian bị choáng (ms)
     */
    triggerStun(duration) {
        if (this.isDead) return;
        this.isStunned = true;
        this.isHurt = false;
        this.isAttacking = false;
        this.stunTimer = Date.now();
        this.stunDuration = duration;
        
        this.currentState = 'Hurt'; // Sử dụng hoạt ảnh Hurt đại diện cho trạng thái bị choáng
        this.frameX = 0;
        this.vx = this.facingRight ? -4 : 4; // Knockback lùi lại một chút
    }

    /**
     * Hồi sinh quái vật
     */
    respawn() {
        this.hp = this.maxHp;
        this.isDead = false;
        this.isHurt = false;
        this.isAttacking = false;
        this.isStunned = false; // Reset trạng thái choáng
        this.x = this.patrolStartX;
        this.currentState = 'Idle';
        this.frameX = 0;
        this.vx = 0;
        console.log('Quái vật đã hồi sinh!');
    }

    /**
     * Override xử lý khi kết thúc chu kỳ hoạt ảnh
     */
    handleAnimationEnd(numFrames) {
        if (this.currentState === 'Dead') {
            this.frameX = numFrames - 1; // Giữ nguyên tư thế nằm chết
        } else if (this.isAttacking || this.isHurt) {
            this.isAttacking = false;
            this.isHurt = false;
            this.frameX = 0;
            this.currentState = 'Idle';
        } else {
            this.frameX = 0;
        }
    }

    /**
     * Cập nhật staggerFrames cho quái vật
     */
    updateStaggerFrames() {
        if (this.currentState === 'Run') {
            this.staggerFrames = 5;
        } else if (this.currentState === 'Walk') {
            this.staggerFrames = 7;
        } else if (this.currentState === 'Idle') {
            this.staggerFrames = 9;
        } else {
            this.staggerFrames = 6;
        }
    }
}
