class InputHandler {
    constructor() {
        // Trạng thái các phím điều khiển cần theo dõi
        this.keys = {
            a: false, d: false, w: false, s: false,
            ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false,
            Shift: false, ' ': false, q: false, e: false
        };
        
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key) || e.key === ' ') {
                this.keys[e.key] = true;
            }
            const lowerKey = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(lowerKey)) {
                this.keys[lowerKey] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key) || e.key === ' ') {
                this.keys[e.key] = false;
            }
            const lowerKey = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(lowerKey)) {
                this.keys[lowerKey] = false;
            }
        });
    }

    /**
     * Kiểm tra xem một phím nhất định có đang được nhấn hay không
     * @param {string} key - Tên phím nhấn (ví dụ: 'a', 'Shift', ' ')
     * @returns {boolean}
     */
    isPressed(key) {
        return !!this.keys[key];
    }
}
