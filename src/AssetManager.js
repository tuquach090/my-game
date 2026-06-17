class AssetManager {
    constructor() {
        this.images = {};
        this.totalImages = 0;
        this.loadedCount = 0;
        this.onProgress = null;
    }

    /**
     * Tải hình ảnh mới và đưa vào bộ quản lý
     * @param {string} name - Tên định danh của ảnh (ví dụ: 'Idle', 'background')
     * @param {string} src - Đường dẫn tới file ảnh
     * @returns {HTMLImageElement}
     */
    loadImage(name, src) {
        this.totalImages++;
        const img = new Image();
        img.src = src;
        img.onload = () => {
            this.loadedCount++;
            if (this.onProgress) {
                this.onProgress(this.loadedCount, this.totalImages);
            }
        };
        img.onerror = () => {
            console.error(`Không thể tải tài nguyên tại đường dẫn: ${src}`);
        };
        this.images[name] = img;
        return img;
    }

    /**
     * Lấy đối tượng Image đã tải bằng tên định danh
     * @param {string} name - Tên định danh của ảnh
     * @returns {HTMLImageElement|undefined}
     */
    getImage(name) {
        return this.images[name];
    }

    /**
     * Kiểm tra xem tất cả ảnh đã tải xong chưa
     * @returns {boolean}
     */
    isAllLoaded() {
        return this.totalImages > 0 && this.loadedCount === this.totalImages;
    }
}
