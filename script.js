const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Ngăn chặn việc làm nhòe điểm ảnh (pixel art smoothing)
ctx.imageSmoothingEnabled = false;

let groundY = canvas.height * 0.85; // Cột mốc mặt đất

// Khởi tạo các hệ thống Core trong Game
const assetManager = new AssetManager();
const input = new InputHandler();
const background = new Background(canvas, assetManager);

// Tải toàn bộ hoạt ảnh của nhân vật Knight 1 (Player) và Knight 2 (Monster)
const animations = [
    'Idle', 'Walk', 'Run', 'Jump', 'Attack 1', 'Attack 2', 'Attack 3',
    'Defend', 'Protect', 'Hurt', 'Dead', 'Run+Attack'
];

animations.forEach(anim => {
    assetManager.loadImage(`Knight1_${anim}`, `assets/Character/Knight_1/${anim}.png`);
    assetManager.loadImage(`Knight2_${anim}`, `assets/Character/Knight_2/${anim}.png`);
});

// Khởi tạo nhân vật chính (Player) ở chính giữa màn hình và đứng trên mặt đất
const player = new Player(canvas.width / 2, groundY, assetManager);

// Khởi tạo quái vật (Monster) ở phía bên phải màn hình
const monster = new Monster(canvas.width * 0.75, groundY, assetManager);

// Quản lý trạng thái khởi chạy game
let gameStarted = false;
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameStarted = true;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
    groundY = canvas.height * 0.85;
    
    // Đồng bộ lại điểm tuần tra của quái vật theo màn hình mới
    if (monster) {
        monster.patrolStartX = canvas.width * 0.75;
    }
});

/**
 * Xử lý va chạm chiến đấu, tính sát thương và cộng điểm số
 * @param {Player} player 
 * @param {Monster} monster 
 */
function handleCombatCollisions(player, monster) {
    if (player.isDead) return;

    // Tính toán khoảng cách giữa Player và Monster
    const distance = Math.abs(player.x - monster.x);
    const attackRange = 110; // Tầm chém hiệu quả của cả 2 bên

    // --- PLAYER TẤN CÔNG MONSTER ---
    // Điều kiện: Đang đánh, chưa gây sát thương đợt này, quái vật còn sống và trong cự ly tấn công
    if (player.isAttacking && !player.hasDealtDamage && !monster.isDead && distance < attackRange) {
        // Kiểm tra xem hướng của người chơi có quay về phía quái vật hay không
        const isFacingMonster = (monster.x > player.x && player.facingRight) || (monster.x < player.x && !player.facingRight);
        
        if (isFacingMonster) {
            let dmg = 10;
            // Tăng sát thương dựa theo đòn đánh Attack 1, 2, 3
            if (player.currentState === 'Attack 2') dmg = 15;
            if (player.currentState === 'Attack 3') dmg = 20;

            const isKilled = monster.takeDamage(dmg, player.x);
            player.hasDealtDamage = true; // Chỉ tính sát thương một lần cho mỗi lượt chém

            if (isKilled) {
                player.score += 10; // Tiêu diệt quái cộng 10 điểm
            }
        }
    }

    // --- MONSTER TẤN CÔNG PLAYER ---
    // Điều kiện: Quái đang đánh, chưa gây sát thương đợt này, quái còn sống và trong cự ly tấn công
    if (monster.isAttacking && !monster.hasDealtDamage && !monster.isDead && distance < attackRange) {
        // Kiểm tra xem hướng của quái vật có quay về phía người chơi hay không
        const isFacingPlayer = (player.x > monster.x && monster.facingRight) || (player.x < monster.x && !monster.facingRight);

        if (isFacingPlayer) {
            const dmg = 12; // Sát thương của quái vật lên người chơi
            const result = player.takeDamage(dmg, monster.x);
            monster.hasDealtDamage = true; // Chỉ nhận sát thương 1 lần cho mỗi lượt chém của quái

            if (result === 'parry') {
                // Phản đòn thành công -> Làm choáng quái vật trong 2.5 giây (2500ms)
                monster.triggerStun(2500);
            }
        }
    }
}

/**
 * Vẽ Giao diện Thông số của Game (HUD)
 */
function drawHUD(ctx, player, monster) {
    // 1. Vẽ Thanh máu Player (góc trên bên trái)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 200, 24);
    
    // Tỷ lệ HP Player
    const hpRatio = player.hp / player.maxHp;
    ctx.fillStyle = hpRatio > 0.4 ? '#4caf50' : hpRatio > 0.15 ? '#ffeb3b' : '#f44336';
    ctx.fillRect(22, 22, 196 * hpRatio, 20);
    ctx.strokeRect(20, 20, 200, 24);

    // Chữ số HP
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 30, 36);

    // 2. Vẽ Điểm số Player (góc trên bên phải)
    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${player.score}`, canvas.width - 20, 40);
    ctx.textAlign = 'left'; // Trả lại mặc định

    // 3. Vẽ Thanh máu Quái vật (trực tiếp trên đầu quái vật)
    if (!monster.isDead) {
        const mBarWidth = 70;
        const mBarHeight = 6;
        const mBarX = monster.x - mBarWidth / 2;
        const mBarY = monster.y - 120;

        ctx.fillStyle = '#333';
        ctx.fillRect(mBarX, mBarY, mBarWidth, mBarHeight);
        
        const mHpRatio = monster.hp / monster.maxHp;
        ctx.fillStyle = '#f44336'; // Màu đỏ cho máu quái vật
        ctx.fillRect(mBarX + 1, mBarY + 1, (mBarWidth - 2) * mHpRatio, mBarHeight - 2);
        ctx.strokeRect(mBarX, mBarY, mBarWidth, mBarHeight);
    }

    // --- HIỆU ỨNG PHẢN ĐÒN & CHOÁNG ---
    const now = Date.now();
    
    // Hiển thị chữ PARRY! trên đầu người chơi trong 1 giây sau khi phản đòn thành công
    if (now - player.parryTime < 1000) {
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        // Hiệu ứng nảy nhẹ theo hàm sin
        const bounceY = Math.sin((now - player.parryTime) * 0.01) * 8;
        ctx.fillText('PARRY! ⚡', player.x, player.y - 150 + bounceY);
        ctx.textAlign = 'left';
    }

    // Hiển thị chữ STUNNED 💫 trên đầu quái vật khi bị choáng
    if (monster.isStunned && !monster.isDead) {
        ctx.fillStyle = '#ff9800';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        // Hiệu ứng lắc lư nhẹ qua lại
        const shakeX = Math.sin(now * 0.02) * 2;
        ctx.fillText('STUNNED 💫', monster.x + shakeX, monster.y - 140);
        ctx.textAlign = 'left';
    }

    // 4. Màn hình Game Over nếu Player chết
    if (player.isDead) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#f44336';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText(`Điểm số của bạn: ${player.score}`, canvas.width / 2, canvas.height / 2 + 10);

        ctx.fillStyle = '#bbb';
        ctx.font = '16px Arial';
        ctx.fillText('Nhấn F5 để tải lại và chơi lại', canvas.width / 2, canvas.height / 2 + 50);
        ctx.textAlign = 'left';
    }
}

/**
 * Vòng lặp chính của Game (Game Loop)
 */
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (assetManager.isAllLoaded()) {
        // 1. Vẽ bản đồ nền (hiển thị phía sau menu mờ)
        background.draw(ctx);

        if (gameStarted) {
            // 2. Cập nhật trạng thái của Player và Monster
            player.update(input, groundY, canvas.width);
            monster.update(player, groundY, canvas.width);

            // 3. Xử lý tương tác va chạm chiến đấu
            handleCombatCollisions(player, monster);

            // 4. Vẽ các thực thể lên khung hình
            player.draw(ctx);
            monster.draw(ctx);

            // 5. Vẽ HUD và Game Over
            drawHUD(ctx, player, monster);
        } else {
            // Khi chưa nhấn bắt đầu: Chỉ vẽ tĩnh các nhân vật ở tư thế đứng yên (Idle)
            player.draw(ctx);
            monster.draw(ctx);
        }
    } else {
        // Màn hình chờ tải tài nguyên
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(
            `Loading... ${assetManager.loadedCount}/${assetManager.totalImages}`,
            canvas.width / 2 - 50,
            canvas.height / 2
        );
    }

    requestAnimationFrame(animate);
}

// Bắt đầu vòng lặp game
animate();
