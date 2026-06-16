const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Prevent pixel blurring
ctx.imageSmoothingEnabled = false;

let groundY = canvas.height * 0.85; // Ground level

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
    groundY = canvas.height * 0.85;
});

// Load Images
const images = {};
const animations = [
    'Idle', 'Walk', 'Run', 'Jump', 'Attack 1', 'Attack 2', 'Attack 3', 
    'Defend', 'Protect', 'Hurt', 'Dead', 'Run+Attack'
];

let imagesLoaded = 0;
const totalImagesToLoad = animations.length + 1;

animations.forEach(anim => {
    const img = new Image();
    img.src = `assets/Character/Knight_1/${anim}.png`;
    img.onload = () => {
        imagesLoaded++;
    };
    images[anim] = img;
});

const bgImage = new Image();
bgImage.src = 'assets/map/nature_1/origbig.png';
bgImage.onload = () => {
    imagesLoaded++;
};

// Input handling
const keys = {
    a: false, d: false, w: false, s: false, 
    ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false,
    Shift: false, ' ': false, q: false, e: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key) || e.key === ' ') keys[e.key] = true;
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key) || e.key === ' ') keys[e.key] = false;
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = groundY;
        this.vx = 0;
        this.vy = 0;
        this.speed = 3;
        this.runSpeed = 6;
        this.gravity = 0.5;
        this.jumpStrength = -10;
        
        this.scale = 3; // Scale up the sprite
        
        this.currentState = 'Idle';
        this.facingRight = true;
        
        this.frameX = 0;
        this.gameFrame = 0;
        this.staggerFrames = 6; // Animation speed
        
        this.isAttacking = false;
        this.isDead = false;
        this.isDefending = false;
    }
    
    draw(context) {
        if (!images[this.currentState] || !images[this.currentState].complete || images[this.currentState].naturalWidth === 0) return;
        
        const img = images[this.currentState];
        // Assuming the sprite sheet has frames laid out horizontally and each frame is a square (height = frame width)
        // If they are not square, assuming width is a multiple of height is common for these assets.
        // Usually, Craftpix sprites are roughly square or at least a fixed width per frame.
        // Let's assume frameWidth = img.naturalHeight, so numFrames = img.naturalWidth / img.naturalHeight.
        let frameWidth = img.naturalHeight;
        let numFrames = Math.floor(img.naturalWidth / frameWidth);
        
        // Failsafe in case frameWidth is different
        if (numFrames === 0) numFrames = 1;

        if (this.frameX >= numFrames) {
            if (this.isAttacking || this.currentState === 'Dead' || this.currentState === 'Hurt') {
                if (this.currentState === 'Dead') {
                    this.frameX = numFrames - 1; // Stay dead
                } else {
                    this.isAttacking = false;
                    this.frameX = 0;
                    this.currentState = 'Idle';
                }
            } else {
                this.frameX = 0;
            }
        }
        
        // Draw the current frame
        context.save();
        context.translate(this.x, this.y);
        if (!this.facingRight) {
            context.scale(-1, 1);
        }
        
        // Draw shadow
        context.fillStyle = 'rgba(0,0,0,0.3)';
        context.beginPath();
        context.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
        context.fill();

        context.drawImage(
            img, 
            this.frameX * frameWidth, 0, frameWidth, img.naturalHeight, 
            -frameWidth * this.scale / 2, -img.naturalHeight * this.scale + (img.naturalHeight * this.scale * 0.1), // Adjusted for alignment
            frameWidth * this.scale, img.naturalHeight * this.scale
        );
        
        context.restore();
        
        if (this.gameFrame % this.staggerFrames === 0) {
            if (this.currentState === 'Dead' && this.frameX === numFrames - 1) {
                // Do not loop dead animation
            } else {
                this.frameX++;
            }
        }
        this.gameFrame++;
    }
    
    update() {
        if (this.isDead) return;

        // Reset state
        if (!this.isAttacking) {
            this.isDefending = false;
            
            // Defend
            if (keys.s || keys.ArrowDown) {
                this.isDefending = true;
                this.currentState = 'Defend';
                this.vx = 0;
            } 
            // Attack
            else if (keys.q) {
                this.isAttacking = true;
                this.currentState = 'Attack 1';
                this.frameX = 0;
                this.vx = 0;
            }
            else if (keys.w) {
                this.isAttacking = true;
                this.currentState = 'Attack 2';
                this.frameX = 0;
                this.vx = 0;
            }
            else if (keys.e) {
                this.isAttacking = true;
                this.currentState = 'Attack 3';
                this.frameX = 0;
                this.vx = 0;
            }
            // Move
            else if (keys.a || keys.ArrowLeft) {
                this.facingRight = false;
                if (keys.Shift) {
                    this.vx = -this.runSpeed;
                    this.currentState = 'Run';
                } else {
                    this.vx = -this.speed;
                    this.currentState = 'Walk';
                }
            } else if (keys.d || keys.ArrowRight) {
                this.facingRight = true;
                if (keys.Shift) {
                    this.vx = this.runSpeed;
                    this.currentState = 'Run';
                } else {
                    this.vx = this.speed;
                    this.currentState = 'Walk';
                }
            } else {
                this.vx = 0;
                this.currentState = 'Idle';
            }

            // Jump
            if ((keys[' '] || keys.ArrowUp) && this.y === groundY && !this.isDefending) {
                this.vy = this.jumpStrength;
                this.currentState = 'Jump';
            }
        }
        
        // Physics
        this.x += this.vx;
        this.y += this.vy;
        
        // Gravity
        if (this.y < groundY) {
            this.vy += this.gravity;
            if (!this.isAttacking && !this.isDefending) this.currentState = 'Jump';
        } else {
            this.vy = 0;
            this.y = groundY;
        }
        
        // Screen bounds
        if (this.x < 50) this.x = 50;
        if (this.x > canvas.width - 50) this.x = canvas.width - 50;
        
        // Adjust animation speed based on state
        if (this.currentState === 'Run') this.staggerFrames = 4;
        else if (this.currentState === 'Walk') this.staggerFrames = 6;
        else if (this.currentState === 'Idle') this.staggerFrames = 8;
        else this.staggerFrames = 5;
    }
}

const player = new Player();

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imagesLoaded === totalImagesToLoad) {
        // Draw map background
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        player.update();
        player.draw(ctx);
    } else {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Loading... ${imagesLoaded}/${totalImagesToLoad}`, canvas.width/2 - 50, canvas.height/2);
    }
    
    requestAnimationFrame(animate);
}

animate();
