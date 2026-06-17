class CombatController {
    /**
     * @param {Character} character - Nhân vật cần điều khiển chiến đấu
     */
    constructor(character) {
        this.character = character;
    }

    /**
     * Xử lý trạng thái tấn công và phòng thủ dựa trên phím nhập từ bàn phím
     * @param {InputHandler} input - Đối tượng quản lý phím nhấn
     */
    handleCombat(input) {
        if (this.character.isDead) return;

        // Chỉ xử lý hành động chiến đấu mới khi nhân vật KHÔNG đang thực hiện đòn tấn công dở dang
        if (!this.character.isAttacking) {
            this.character.isDefending = false;

            // Phòng thủ / Đỡ đòn
            if (input.isPressed('s') || input.isPressed('ArrowDown')) {
                if (!this.character.isDefending) {
                    this.character.defendStartTime = Date.now();
                }
                this.character.isDefending = true;
                this.character.currentState = 'Defend';
                this.character.vx = 0; // Dừng di chuyển ngang khi đỡ đòn
            }
            // Tấn công đòn 1 (phím Q)
            else if (input.isPressed('q')) {
                this.character.startAttack('Attack 1');
            }
            // Tấn công đòn 2 (phím W)
            else if (input.isPressed('w')) {
                this.character.startAttack('Attack 2');
            }
            // Tấn công đòn 3 (phím E)
            else if (input.isPressed('e')) {
                this.character.startAttack('Attack 3');
            }
        }
    }
}
