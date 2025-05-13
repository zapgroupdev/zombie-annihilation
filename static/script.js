// --- Global Game Object ---
const Game = {
    // --- DOM Elements ---
    dom: {
        canvas: null,
        ctx: null,
        scoreElement: null,
        playerHealthElement: null,
        playerArmorElement: null,
        playerCoinsElement: null,
        waveInfoElement: null,
        weaponInfoElement: null,
        gameOverScreen: null,
        finalScoreElement: null,
        finalWaveElement: null,
        restartButton: null,
        startScreen: null,
        startButton: null,
        shopScreenElement: null,
        shopWaveNumberElement: null,
        shopPlayerCoinsElement: null,
        shopItemsContainerElement: null,
        shopNextWaveButton: null,
        onScreenMessagesElement: null,
        pauseMessageElement: null,
        visualEffectsContainer: null
    },
    // --- Game Configuration ---
    config: {
        CANVAS_WIDTH: 800,
        CANVAS_HEIGHT: 600,
        PLAYER_SIZE: 20,
        PLAYER_BASE_SPEED: 180, // Pixels per second
        PLAYER_MAX_HEALTH: 100,
        PLAYER_MAX_ARMOR: 50,
        BULLET_RADIUS: 5,
        POWERUP_RADIUS: 12,
        POWERUP_LIFESPAN_SECONDS: 10, // Formerly 600 frames
        WEAPON_DROP_CHANCE: 0.05,
        HEALTH_DROP_CHANCE: 0.05,
        ARMOR_DROP_CHANCE: 0.08,
        COIN_DROP_CHANCE: 0.6,
        COIN_VALUE_MIN: 5,
        COIN_VALUE_MAX: 20,
        FPS: 60, // Target FPS for converting frame-based values
        SHOP_HEALTH_REWARD: 20,
        SHOP_ARMOR_REWARD: 15,
        SHOP_COIN_REWARD_PER_WAVE_MULTIPLIER: 10,
        SHOP_FULL_HEALTH_COST: 100,
        SHOP_FULL_ARMOR_COST: 75,
        BARREL_HEALTH: 30,
        BARREL_RADIUS: 20,
        BARREL_COLOR: '#A1887F',
        BARREL_EXPLOSION_RADIUS: 100,
        BARREL_EXPLOSION_DAMAGE: 75,
        ON_SCREEN_MESSAGE_DEFAULT_DURATION_MS: 3000,
        EXPLOSION_VISUAL_DURATION_FRAMES: 30,
        ZOMBIE_SPAWN_BASE_CHANCE: 0.030, // Base chance per update cycle
        ZOMBIE_SPAWN_WAVE_MULTIPLIER: 0.05,
        BOSS_SPAWN_CHANCE: 0.05 // Chance per update cycle if boss active
    },
    // --- Weapon Definitions ---
    // fireRate, particleLife, fuseTime converted to seconds
    // bulletSpeed, projectileSpeed kept as pixels per frame for now, will be scaled by deltaTime
    // To convert to pixels per second for speed: multiply by Game.config.FPS
    weapons: {
        pistol: { name: "Pistol", damage: 25, fireRate: 15 / 60, bulletsPerShot: 1, spread: 0.05, ammo: Infinity, maxAmmo: Infinity, color: '#FFEB3B', bulletSpeed: 7, cost: 0, ammoCost: 0 },
        shotgun: { name: "Shotgun", damage: 20, fireRate: 45 / 60, bulletsPerShot: 6, spread: 0.4, ammo: 24, maxAmmo: 24, color: '#FF9800', bulletSpeed: 6, cost: 150, ammoCost: 50 },
        rifle: { name: "Rifle", damage: 40, fireRate: 10 / 60, bulletsPerShot: 1, spread: 0.02, ammo: 30, maxAmmo: 30, color: '#F44336', bulletSpeed: 10, cost: 250, ammoCost: 75 },
        flamethrower: { name: "Flamer", damage: 3, fireRate: 2 / 60, bulletsPerShot: 1, spread: 0.25, ammo: 150, maxAmmo: 150, color: '#FF5722', bulletSpeed: 5.5, isStream: true, particleLife: 28 / 60, cost: 300, ammoCost: 100 },
        grenadelauncher: { name: "NoobTube", damage: 100, fireRate: 60 / 60, bulletsPerShot: 1, spread: 0, ammo: 5, maxAmmo: 5, color: '#4CAF50', bulletSpeed: 5, isExplosive: true, explosionRadius: 80, fuseTime: 90 / 60, cost: 400, ammoCost: 150 }
    },
    // --- Zombie Type Definitions ---
    // baseSpeed (pixels per frame) and attackCooldownTime (seconds)
    zombieTypes: {
        normal: { name: "Walker", baseHealth: 50, baseSpeed: 0.6, size: 15, color: '#7CB342', damage: 10, points: 10, attackCooldownTime: 60 / 60 },
        fast: { name: "Runner", baseHealth: 30, baseSpeed: 1.2, size: 12, color: '#AED581', damage: 7, points: 15, attackCooldownTime: 45 / 60 },
        tank: { name: "Brute", baseHealth: 150, baseSpeed: 0.4, size: 25, color: '#558B2F', damage: 20, points: 30, attackCooldownTime: 90 / 60 },
        spitter: { name: "Spitter", baseHealth: 40, baseSpeed: 0.5, size: 16, color: '#FFC107', damage: 0, points: 20, attackCooldownTime: 90 / 60, shootRange: 250, projectileSpeed: 4, projectileDamage: 10, projectileColor: '#CDDC39', projectileSize: 6 },
        boss: { name: "Abomination", baseHealth: 800, baseSpeed: 0.5, size: 40, color: '#D50000', damage: 35, points: 250, attackCooldownTime: 75 / 60, isBoss: true }
    },
    // --- Game State ---
    state: {
        player: null,
        bullets: [],
        flameParticles: [],
        grenades: [],
        zombies: [],
        zombieProjectiles: [],
        powerUps: [],
        environmentObjects: [],
        score: 0,
        currentWave: 1,
        zombiesToSpawnThisWave: 0,
        zombiesSpawnedThisWave: 0,
        zombiesKilledThisWave: 0,
        bossActive: false,
        mousePos: { x: 0, y: 0 },
        keys: {},
        gameRunning: false,
        isShopOpen: false,
        isManuallyPaused: false,
        animationFrameId: null,
        isMouseDown: false,
        lastTimestamp: 0,
        onScreenMessageTimeout: null
    },

    // --- Initialization ---
    initDomElements: function() {
        this.dom.canvas = document.getElementById('gameCanvas');
        this.dom.ctx = this.dom.canvas.getContext('2d');
        this.dom.scoreElement = document.getElementById('score');
        this.dom.playerHealthElement = document.getElementById('player-health');
        this.dom.playerArmorElement = document.getElementById('player-armor');
        this.dom.playerCoinsElement = document.getElementById('player-coins');
        this.dom.waveInfoElement = document.getElementById('wave-info');
        this.dom.weaponInfoElement = document.getElementById('weapon-info');
        this.dom.gameOverScreen = document.getElementById('game-over-screen');
        this.dom.finalScoreElement = document.getElementById('final-score');
        this.dom.finalWaveElement = document.getElementById('final-wave');
        this.dom.restartButton = document.getElementById('restart-button');
        this.dom.startScreen = document.getElementById('start-screen');
        this.dom.startButton = document.getElementById('start-button');
        this.dom.shopScreenElement = document.getElementById('shop-screen');
        this.dom.shopWaveNumberElement = document.getElementById('shop-wave-number');
        this.dom.shopPlayerCoinsElement = document.getElementById('shop-player-coins');
        this.dom.shopItemsContainerElement = document.getElementById('shop-items-container');
        this.dom.shopNextWaveButton = document.getElementById('shop-next-wave-button');
        this.dom.onScreenMessagesElement = document.getElementById('on-screen-messages');
        this.dom.pauseMessageElement = document.getElementById('pause-message');
        this.dom.visualEffectsContainer = document.getElementById('visual-effects-container');

        this.dom.canvas.width = this.config.CANVAS_WIDTH;
        this.dom.canvas.height = this.config.CANVAS_HEIGHT;
    },

    initEventListeners: function() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase(); this.state.keys[key] = true;
            if (this.state.gameRunning && !this.state.isShopOpen && !this.state.isManuallyPaused) {
                const currentWeapon = this.weapons[this.state.player.availableWeaponKeys[this.state.player.currentWeaponSlot]];
                if (key === ' ' && this.state.player.shootCooldownTimer <= 0 && !currentWeapon.isStream) {
                    e.preventDefault(); this.shoot();
                }
                if (key === 'q') { this.cycleWeapon(); }
            }
            if (key === 'p' && this.state.gameRunning && !this.state.isShopOpen) { this.toggleManualPause(); }
        });
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase(); this.state.keys[key] = false;
        });
        this.dom.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.state.isMouseDown = true;
                if (this.state.gameRunning && !this.state.isShopOpen && !this.state.isManuallyPaused) {
                    const currentWeapon = this.weapons[this.state.player.availableWeaponKeys[this.state.player.currentWeaponSlot]];
                    if (this.state.player.shootCooldownTimer <= 0 && !currentWeapon.isStream) {
                        this.shoot();
                    }
                }
            }
        });
        this.dom.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.state.isMouseDown = false;
        });
        this.dom.canvas.addEventListener('mousemove', (e) => {
            if (this.state.isManuallyPaused || this.state.isShopOpen) return;
            const rect = this.dom.canvas.getBoundingClientRect();
            this.state.mousePos.x = e.clientX - rect.left; this.state.mousePos.y = e.clientY - rect.top;
        });
        this.dom.startButton.addEventListener('click', () => this.startGame());
        this.dom.restartButton.addEventListener('click', () => this.startGame());
        this.dom.shopNextWaveButton.addEventListener('click', () => this.proceedToNextWaveFromShop());
    },

    // --- Entity Creation ---
    createPlayer: function() {
        return {
            x: this.config.CANVAS_WIDTH / 2, y: this.config.CANVAS_HEIGHT / 2, radius: this.config.PLAYER_SIZE,
            speed: this.config.PLAYER_BASE_SPEED, // Pixels per second
            health: this.config.PLAYER_MAX_HEALTH, armor: 0, maxArmor: this.config.PLAYER_MAX_ARMOR,
            coins: 0,
            color: '#4A90E2', gunColor: '#555', gunLength: this.config.PLAYER_SIZE * 1.5, gunWidth: this.config.PLAYER_SIZE * 0.4,
            shootCooldownTimer: 0, // Seconds
            ownedWeapons: { 'pistol': this.weapons.pistol.maxAmmo }, availableWeaponKeys: ['pistol'], currentWeaponSlot: 0,
        };
    },
    createBullet: function(startX, startY, angle, weaponKey) {
        const weapon = this.weapons[weaponKey];
        return {
            x: startX, y: startY, radius: this.config.BULLET_RADIUS,
            dx: Math.cos(angle) * weapon.bulletSpeed, dy: Math.sin(angle) * weapon.bulletSpeed, // speed in pixels per frame
            color: weapon.color, damage: weapon.damage, owner: 'player'
        };
    },
    createFlameParticle: function(startX, startY, angle, weaponKey) {
        const weapon = this.weapons[weaponKey];
        const angleOffset = (Math.random() - 0.5) * weapon.spread;
        return {
            x: startX, y: startY, radius: Math.random() * 3 + 3,
            dx: Math.cos(angle + angleOffset) * (weapon.bulletSpeed + (Math.random() - 0.5) * 2),
            dy: Math.sin(angle + angleOffset) * (weapon.bulletSpeed + (Math.random() - 0.5) * 2),
            color: `rgba(255, ${Math.floor(Math.random() * 100 + 120)}, 0, ${Math.random() * 0.4 + 0.6})`,
            damage: weapon.damage, owner: 'player',
            lifeTimer: weapon.particleLife, initialLifeTimer: weapon.particleLife // Seconds
        };
    },
    createGrenade: function(startX, startY, angle, weaponKey) {
        const weapon = this.weapons[weaponKey];
        return {
            x: startX, y: startY, radius: 8,
            dx: Math.cos(angle) * weapon.bulletSpeed, dy: Math.sin(angle) * weapon.bulletSpeed,
            color: weapon.color, damage: weapon.damage, owner: 'player', weaponKey: weaponKey,
            fuseTimer: weapon.fuseTime, initialFuseTimer: weapon.fuseTime, hasHit: false // Seconds
        };
    },
    createZombieProjectile: function(startX, startY, angle, zombieType) {
        return {
            x: startX, y: startY, radius: zombieType.projectileSize,
            dx: Math.cos(angle) * zombieType.projectileSpeed, dy: Math.sin(angle) * zombieType.projectileSpeed,
            color: zombieType.projectileColor, damage: zombieType.projectileDamage, owner: 'zombie'
        };
    },
    createPowerUp: function(x, y, type, subType) {
        let color = '#AF00FF', letter = '?', value = subType;
        if (type === 'weapon') {
            color = this.weapons[subType] ? this.weapons[subType].color : '#AF00FF';
            letter = this.weapons[subType] ? this.weapons[subType].name.substring(0, 1).toUpperCase() : 'W';
        } else if (type === 'health') {
            color = '#FF4081'; letter = 'H';
        } else if (type === 'armor') {
            color = '#607D8B'; letter = 'A';
        } else if (type === 'coin') {
            color = '#FFD700'; letter = '$';
        }
        return {
            x, y, type, subType, value, radius: this.config.POWERUP_RADIUS, color, letter,
            lifeSpanTimer: this.config.POWERUP_LIFESPAN_SECONDS // Seconds
        };
    },
    createBarrel: function(x, y) {
        return {
            x, y, radius: this.config.BARREL_RADIUS, health: this.config.BARREL_HEALTH, maxHealth: this.config.BARREL_HEALTH,
            color: this.config.BARREL_COLOR, type: 'barrel',
            explosionRadius: this.config.BARREL_EXPLOSION_RADIUS, explosionDamage: this.config.BARREL_EXPLOSION_DAMAGE
        };
    },
    createZombie: function(zombieTypeName) {
        const type = this.zombieTypes[zombieTypeName];
        if (!type) { console.error("Unknown zombie type:", zombieTypeName); return this.createZombie('normal'); }
        let x, y; const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { x = Math.random() * this.config.CANVAS_WIDTH; y = -type.size; }
        else if (edge === 1) { x = this.config.CANVAS_WIDTH + type.size; y = Math.random() * this.config.CANVAS_HEIGHT; }
        else if (edge === 2) { x = Math.random() * this.config.CANVAS_WIDTH; y = this.config.CANVAS_HEIGHT + type.size; }
        else { x = -type.size; y = Math.random() * this.config.CANVAS_HEIGHT; }
        const waveMultiplier = 1 + (this.state.currentWave * 0.02);
        return {
            x, y, typeName: zombieTypeName, radius: type.size, speed: type.baseSpeed, // Pixels per frame, scaled by deltaTime
            health: type.baseHealth * (type.isBoss ? 1 + this.state.currentWave * 0.15 : 1 + this.state.currentWave * 0.08),
            maxHealth: type.baseHealth * (type.isBoss ? 1 + this.state.currentWave * 0.15 : 1 + this.state.currentWave * 0.08),
            color: type.color, damage: type.damage, points: type.points,
            attackCooldownTimer: 0, attackCooldownTime: type.attackCooldownTime, // Seconds
            isBoss: type.isBoss || false,
            shootRange: type.shootRange, projectileSpeed: type.projectileSpeed, projectileDamage: type.projectileDamage,
            projectileColor: type.projectileColor, projectileSize: type.projectileSize
        };
    },

    // --- Game Logic ---
    toggleManualPause: function() {
        this.state.isManuallyPaused = !this.state.isManuallyPaused;
        this.dom.pauseMessageElement.classList.toggle('hidden', !this.state.isManuallyPaused);
    },
    initWaveSettings: function() {
        this.state.zombiesKilledThisWave = 0; this.state.zombiesSpawnedThisWave = 0; this.state.bossActive = false;
        if (this.state.currentWave % 5 === 0) { this.state.zombiesToSpawnThisWave = 1; this.state.bossActive = true; }
        else { this.state.zombiesToSpawnThisWave = Math.floor(5 + this.state.currentWave * 2.0); }
        if (this.state.currentWave === 1 || this.state.currentWave % 3 === 0) {
            this.state.environmentObjects = [];
            for (let i = 0; i < 2 + Math.floor(this.state.currentWave / 3); i++) {
                this.state.environmentObjects.push(this.createBarrel(Math.random() * (this.config.CANVAS_WIDTH - 100) + 50, Math.random() * (this.config.CANVAS_HEIGHT - 100) + 50));
            }
        }
    },
    startGame: function() {
        try {
            this.state.player = this.createPlayer();
            this.state.bullets = []; this.state.flameParticles = []; this.state.grenades = [];
            this.state.zombies = []; this.state.zombieProjectiles = []; this.state.powerUps = []; this.state.environmentObjects = [];
            this.state.score = 0; this.state.currentWave = 1; this.initWaveSettings(); this.updateUI();
            this.dom.gameOverScreen.classList.add('hidden'); this.dom.startScreen.classList.add('hidden');
            this.dom.shopScreenElement.classList.add('hidden'); this.dom.pauseMessageElement.classList.add('hidden');
            this.state.gameRunning = true; this.state.isShopOpen = false; this.state.isManuallyPaused = false; this.state.isMouseDown = false;
            this.state.lastTimestamp = performance.now(); // Initialize for deltaTime
            if (this.state.animationFrameId) cancelAnimationFrame(this.state.animationFrameId);
            this.gameLoop(performance.now());
            this.displayOnScreenMessage(`Wave ${this.state.currentWave} Started!`);
        } catch (error) {
            console.error("Error starting game:", error);
            this.displayOnScreenMessage("Error starting game. Check console.", 5000);
        }
    },
    cycleWeapon: function() {
        if (!this.state.player || this.state.player.availableWeaponKeys.length <= 1) return;
        this.state.player.currentWeaponSlot = (this.state.player.currentWeaponSlot + 1) % this.state.player.availableWeaponKeys.length;
        const newWeaponKey = this.state.player.availableWeaponKeys[this.state.player.currentWeaponSlot];
        this.displayOnScreenMessage(`Switched to ${this.weapons[newWeaponKey].name}`, 1500); this.updateUI();
    },
    shoot: function() {
        if (!this.state.player || (this.state.player.health <= 0 && this.state.player.armor <= 0) || this.state.player.shootCooldownTimer > 0) return;
        const currentWeaponKey = this.state.player.availableWeaponKeys[this.state.player.currentWeaponSlot];
        const weapon = this.weapons[currentWeaponKey];
        let currentAmmo = this.state.player.ownedWeapons[currentWeaponKey];

        if (currentAmmo === 0 && currentWeaponKey !== 'pistol') {
            this.displayOnScreenMessage(`${weapon.name} out of ammo! Switching to Pistol.`, 2000);
            this.state.player.currentWeaponSlot = this.state.player.availableWeaponKeys.indexOf('pistol');
            if (this.state.player.currentWeaponSlot === -1) this.state.player.currentWeaponSlot = 0;
            this.updateUI(); return;
        }

        const baseAngle = Math.atan2(this.state.mousePos.y - this.state.player.y, this.state.mousePos.x - this.state.player.x);
        const gunTipX = this.state.player.x + Math.cos(baseAngle) * this.state.player.gunLength;
        const gunTipY = this.state.player.y + Math.sin(baseAngle) * this.state.player.gunLength;

        if (weapon.isStream) {
            this.state.flameParticles.push(this.createFlameParticle(gunTipX, gunTipY, baseAngle, currentWeaponKey));
        } else if (weapon.isExplosive) {
            this.state.grenades.push(this.createGrenade(gunTipX, gunTipY, baseAngle, currentWeaponKey));
        } else {
            for (let i = 0; i < weapon.bulletsPerShot; i++) {
                let shotAngle = baseAngle + (Math.random() - 0.5) * weapon.spread * (weapon.bulletsPerShot > 1 ? 1 : 0);
                this.state.bullets.push(this.createBullet(gunTipX, gunTipY, shotAngle, currentWeaponKey));
            }
        }
        if (weapon.ammo !== Infinity) this.state.player.ownedWeapons[currentWeaponKey]--;
        this.state.player.shootCooldownTimer = weapon.fireRate; this.updateUI();
    },
    applyDamageToPlayer: function(damageAmount) {
        if (!this.state.player || (this.state.player.health <= 0 && this.state.player.armor <= 0)) return;
        let damageRemaining = damageAmount;
        if (this.state.player.armor > 0) {
            const armorDamage = Math.min(this.state.player.armor, damageRemaining);
            this.state.player.armor -= armorDamage; damageRemaining -= armorDamage;
        }
        if (damageRemaining > 0) this.state.player.health -= damageRemaining;
        this.updateUI(); if (this.state.player.health <= 0) this.gameOver();
    },
    updatePlayer: function(deltaTime) {
        if (!this.state.player || (this.state.player.health <= 0 && this.state.player.armor <= 0)) return;
        const actualSpeed = this.state.player.speed * deltaTime;
        if (this.state.keys['w'] || this.state.keys['arrowup']) this.state.player.y -= actualSpeed;
        if (this.state.keys['s'] || this.state.keys['arrowdown']) this.state.player.y += actualSpeed;
        if (this.state.keys['a'] || this.state.keys['arrowleft']) this.state.player.x -= actualSpeed;
        if (this.state.keys['d'] || this.state.keys['arrowright']) this.state.player.x += actualSpeed;
        this.state.player.x = Math.max(this.state.player.radius, Math.min(this.config.CANVAS_WIDTH - this.state.player.radius, this.state.player.x));
        this.state.player.y = Math.max(this.state.player.radius, Math.min(this.config.CANVAS_HEIGHT - this.state.player.radius, this.state.player.y));

        if (this.state.player.shootCooldownTimer > 0) this.state.player.shootCooldownTimer -= deltaTime;

        const currentWeapon = this.weapons[this.state.player.availableWeaponKeys[this.state.player.currentWeaponSlot]];
        if (currentWeapon.isStream && (this.state.keys[' '] || this.state.isMouseDown) && this.state.player.shootCooldownTimer <= 0) {
            this.shoot();
        }

        for (let i = this.state.powerUps.length - 1; i >= 0; i--) {
            const p = this.state.powerUps[i]; const dist = Math.hypot(this.state.player.x - p.x, this.state.player.y - p.y);
            if (dist < this.state.player.radius + p.radius) { this.collectPowerUp(p); this.state.powerUps.splice(i, 1); }
        }
    },
    collectPowerUp: function(powerUp) {
        if (powerUp.type === 'weapon') {
            const weaponKey = powerUp.subType;
            if (!this.state.player.ownedWeapons.hasOwnProperty(weaponKey)) {
                this.state.player.ownedWeapons[weaponKey] = this.weapons[weaponKey].maxAmmo; this.state.player.availableWeaponKeys.push(weaponKey);
                this.state.player.currentWeaponSlot = this.state.player.availableWeaponKeys.length - 1;
                this.displayOnScreenMessage(`Picked up ${this.weapons[weaponKey].name}!`);
            } else {
                this.state.player.ownedWeapons[weaponKey] = this.weapons[weaponKey].maxAmmo;
                this.state.player.currentWeaponSlot = this.state.player.availableWeaponKeys.indexOf(weaponKey);
                this.displayOnScreenMessage(`${this.weapons[weaponKey].name} ammo refilled!`);
            }
        } else if (powerUp.type === 'health') {
            this.state.player.health = Math.min(this.config.PLAYER_MAX_HEALTH, this.state.player.health + powerUp.subType);
            this.displayOnScreenMessage(`+${powerUp.subType} Health!`);
        } else if (powerUp.type === 'armor') {
            this.state.player.armor = Math.min(this.state.player.maxArmor, this.state.player.armor + powerUp.subType);
            this.displayOnScreenMessage(`+${powerUp.subType} Armor!`);
        } else if (powerUp.type === 'coin') {
            this.state.player.coins += powerUp.value;
            this.displayOnScreenMessage(`+${powerUp.value} Coins!`, 1000);
        }
        this.updateUI();
    },
    updateProjectiles: function(projectileArray, deltaTime, isFlame = false) {
        for (let i = projectileArray.length - 1; i >= 0; i--) {
            const p = projectileArray[i];
            p.x += p.dx * deltaTime * this.config.FPS; // Scale speed by deltaTime
            p.y += p.dy * deltaTime * this.config.FPS; // Scale speed by deltaTime

            if (isFlame) {
                p.lifeTimer -= deltaTime;
                if (p.lifeTimer <= 0) { projectileArray.splice(i, 1); continue; }
            } else if (p.x < -p.radius || p.x > this.config.CANVAS_WIDTH + p.radius || p.y < -p.radius || p.y > this.config.CANVAS_HEIGHT + p.radius) {
                projectileArray.splice(i, 1); continue;
            }

            if (p.owner === 'zombie' && this.state.player && (this.state.player.health > 0 || this.state.player.armor > 0)) {
                const dist = Math.hypot(this.state.player.x - p.x, this.state.player.y - p.y);
                if (dist < this.state.player.radius + p.radius) {
                    this.applyDamageToPlayer(p.damage); projectileArray.splice(i, 1); continue;
                }
            }
            if (p.owner === 'player') {
                for (let zIdx = this.state.zombies.length - 1; zIdx >= 0; zIdx--) {
                    const z = this.state.zombies[zIdx];
                    const distPZ = Math.hypot(z.x - p.x, z.y - p.y);
                    if (distPZ < z.radius + p.radius) {
                        z.health -= p.damage;
                        if (!isFlame) projectileArray.splice(i, 1);
                        if (z.health <= 0) {
                            this.handleZombieDeath(z);
                        }
                        if (!isFlame && i >= projectileArray.length) break; // projectile was removed
                        if (!isFlame) break; 
                    }
                }
                if (p.owner === 'player' && projectileArray[i]) { // Check if projectile still exists
                    for (let k = this.state.environmentObjects.length - 1; k >= 0; k--) {
                        const envObj = this.state.environmentObjects[k];
                        if (envObj.type === 'barrel') {
                            const dist = Math.hypot(envObj.x - p.x, envObj.y - p.y);
                            if (dist < envObj.radius + p.radius) {
                                envObj.health -= p.damage;
                                if (!isFlame) projectileArray.splice(i, 1);
                                if (envObj.health <= 0) {
                                    this.handleExplosion(envObj.x, envObj.y, envObj.explosionRadius, envObj.explosionDamage, 'barrel');
                                    this.state.environmentObjects.splice(k, 1);
                                }
                                if (!isFlame && i >= projectileArray.length) break; // projectile was removed
                                if (!isFlame) break;
                            }
                        }
                    }
                }
            }
        }
    },
    updateGrenades: function(deltaTime) {
        for (let i = this.state.grenades.length - 1; i >= 0; i--) {
            const g = this.state.grenades[i];
            g.x += g.dx * deltaTime * this.config.FPS;
            g.y += g.dy * deltaTime * this.config.FPS;
            g.fuseTimer -= deltaTime;

            let exploded = false;
            for (let zIdx = this.state.zombies.length - 1; zIdx >= 0; zIdx--) {
                const z = this.state.zombies[zIdx];
                const distGZ = Math.hypot(z.x - g.x, z.y - g.y);
                if (distGZ < z.radius + g.radius) {
                    this.handleExplosion(g.x, g.y, this.weapons[g.weaponKey].explosionRadius, g.damage, 'grenade');
                    this.state.grenades.splice(i, 1); exploded = true; break;
                }
            }
            if (exploded) continue;

            if (g.fuseTimer <= 0 || g.x < 0 || g.x > this.config.CANVAS_WIDTH || g.y < 0 || g.y > this.config.CANVAS_HEIGHT) {
                this.handleExplosion(g.x, g.y, this.weapons[g.weaponKey].explosionRadius, g.damage, 'grenade');
                this.state.grenades.splice(i, 1);
            }
        }
    },
    updatePowerUps: function(deltaTime) {
        for (let i = this.state.powerUps.length - 1; i >= 0; i--) {
            this.state.powerUps[i].lifeSpanTimer -= deltaTime;
            if (this.state.powerUps[i].lifeSpanTimer <= 0) this.state.powerUps.splice(i, 1);
        }
    },
    updateEnvironmentObjects: function(deltaTime) { /* Currently no updates needed per frame */ },

    spawnZombies: function() {
        if (this.state.bossActive && this.state.zombies.some(z => z.isBoss)) return;
        if (this.state.zombiesSpawnedThisWave < this.state.zombiesToSpawnThisWave) {
            let zombieTypeToSpawn = 'normal'; const rand = Math.random();
            if (this.state.currentWave > 1 && rand < 0.25) zombieTypeToSpawn = 'spitter';
            else if (this.state.currentWave > 2 && rand < 0.50) zombieTypeToSpawn = 'fast';
            else if (this.state.currentWave > 3 && rand < 0.75) zombieTypeToSpawn = 'tank';

            if (this.state.bossActive && this.state.zombiesSpawnedThisWave === 0) zombieTypeToSpawn = 'boss';
            
            const spawnChance = this.state.bossActive ? this.config.BOSS_SPAWN_CHANCE : this.config.ZOMBIE_SPAWN_BASE_CHANCE * (1 + this.state.currentWave * this.config.ZOMBIE_SPAWN_WAVE_MULTIPLIER);
            if (Math.random() < spawnChance) {
                this.state.zombies.push(this.createZombie(zombieTypeToSpawn));
                this.state.zombiesSpawnedThisWave++;
            }
        }
    },
    updateZombies: function(deltaTime) {
        for (let i = this.state.zombies.length - 1; i >= 0; i--) {
            const z = this.state.zombies[i];
            if (!this.state.player || (this.state.player.health <= 0 && this.state.player.armor <= 0)) continue;
            
            const actualSpeed = z.speed * deltaTime * this.config.FPS;

            if (z.attackCooldownTimer > 0) z.attackCooldownTimer -= deltaTime;
            else {
                const angleToPlayer = Math.atan2(this.state.player.y - z.y, this.state.player.x - z.x);
                const distToPlayer = Math.hypot(this.state.player.x - z.x, this.state.player.y - z.y);
                if (z.typeName === 'spitter') {
                    if (distToPlayer > z.shootRange * 0.8) {
                        z.x += Math.cos(angleToPlayer) * actualSpeed; z.y += Math.sin(angleToPlayer) * actualSpeed;
                    } else if (distToPlayer < z.shootRange * 0.5) {
                        z.x -= Math.cos(angleToPlayer) * actualSpeed * 0.5; z.y -= Math.sin(angleToPlayer) * actualSpeed * 0.5;
                    }
                    if (z.attackCooldownTimer <= 0 && distToPlayer < z.shootRange) {
                        this.state.zombieProjectiles.push(this.createZombieProjectile(z.x, z.y, angleToPlayer, z));
                        z.attackCooldownTimer = z.attackCooldownTime;
                    }
                } else {
                    z.x += Math.cos(angleToPlayer) * actualSpeed; z.y += Math.sin(angleToPlayer) * actualSpeed;
                    if (distToPlayer < this.state.player.radius + z.radius) {
                        this.applyDamageToPlayer(z.damage); z.attackCooldownTimer = z.attackCooldownTime;
                        z.x -= Math.cos(angleToPlayer) * (z.radius * 0.5); z.y -= Math.sin(angleToPlayer) * (z.radius * 0.5);
                    }
                }
            }
        }
        if (this.state.zombiesKilledThisWave >= this.state.zombiesToSpawnThisWave && this.state.zombies.length === 0 && !this.state.isShopOpen) {
            this.openShop();
        }
    },
    handleZombieDeath: function(zombie) {
        try {
            this.state.score += zombie.points * this.state.currentWave;
            this.state.zombiesKilledThisWave++;

            const rand = Math.random();
            if (rand < this.config.WEAPON_DROP_CHANCE && Object.keys(this.weapons).filter(w => w !== 'pistol').length > 0) {
                const weaponKeys = Object.keys(this.weapons).filter(w => w !== 'pistol');
                this.state.powerUps.push(this.createPowerUp(zombie.x, zombie.y, 'weapon', weaponKeys[Math.floor(Math.random() * weaponKeys.length)]));
            } else if (rand < this.config.WEAPON_DROP_CHANCE + this.config.HEALTH_DROP_CHANCE) {
                this.state.powerUps.push(this.createPowerUp(zombie.x, zombie.y, 'health', 25));
            } else if (rand < this.config.WEAPON_DROP_CHANCE + this.config.HEALTH_DROP_CHANCE + this.config.ARMOR_DROP_CHANCE) {
                this.state.powerUps.push(this.createPowerUp(zombie.x, zombie.y, 'armor', 25));
            } else if (rand < this.config.WEAPON_DROP_CHANCE + this.config.HEALTH_DROP_CHANCE + this.config.ARMOR_DROP_CHANCE + this.config.COIN_DROP_CHANCE) {
                this.state.powerUps.push(this.createPowerUp(zombie.x, zombie.y, 'coin', Math.floor(Math.random() * (this.config.COIN_VALUE_MAX - this.config.COIN_VALUE_MIN + 1)) + this.config.COIN_VALUE_MIN));
            }

            if (zombie.isBoss) {
                this.state.bossActive = false;
                this.displayOnScreenMessage(`${this.zombieTypes[zombie.typeName].name} Defeated!`, 3000);
            }

            const index = this.state.zombies.indexOf(zombie);
            if (index > -1) {
                this.state.zombies.splice(index, 1);
            }
            this.updateUI();
        } catch (error) {
            console.error("Error in handleZombieDeath:", error, zombie);
        }
    },
    handleExplosion: function(x, y, radius, damage, sourceType) {
        try {
            this.createVisualExplosion(x, y, radius, sourceType === 'grenade' ? '#8BC34A' : 'rgba(255,100,0,0.8)');
            if (this.state.player && (this.state.player.health > 0 || this.state.player.armor > 0)) {
                const distToPlayer = Math.hypot(this.state.player.x - x, this.state.player.y - y);
                if (distToPlayer < this.state.player.radius + radius) this.applyDamageToPlayer(damage);
            }
            for (let k = this.state.zombies.length - 1; k >= 0; k--) {
                const otherZombie = this.state.zombies[k];
                const distToOtherZombie = Math.hypot(otherZombie.x - x, otherZombie.y - y);
                if (distToOtherZombie < otherZombie.radius + radius) {
                    otherZombie.health -= damage;
                    if (otherZombie.health <= 0) {
                        this.handleZombieDeath(otherZombie); // Refactored
                    }
                }
            }
            if (sourceType !== 'barrel-chain') {
                for (let k = this.state.environmentObjects.length - 1; k >= 0; k--) {
                    const envObj = this.state.environmentObjects[k];
                    if (envObj.type === 'barrel' && (envObj.x !== x || envObj.y !== y)) {
                        const distToBarrel = Math.hypot(envObj.x - x, envObj.y - y);
                        if (distToBarrel < envObj.radius + radius) {
                            envObj.health -= damage * 0.5;
                            if (envObj.health <= 0) {
                                this.handleExplosion(envObj.x, envObj.y, envObj.explosionRadius, envObj.explosionDamage, 'barrel-chain');
                                this.state.environmentObjects.splice(k, 1);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error handling explosion:", error);
        }
    },
    createVisualExplosion: function(x, y, radius, color) {
        const explosionEl = document.createElement('div');
        explosionEl.classList.add('explosion-effect');
        const canvasRect = this.dom.canvas.getBoundingClientRect();
        explosionEl.style.left = (canvasRect.left + window.scrollX + x - radius) + 'px';
        explosionEl.style.top = (canvasRect.top + window.scrollY + y - radius) + 'px';
        explosionEl.style.width = (radius * 2) + 'px';
        explosionEl.style.height = (radius * 2) + 'px';
        explosionEl.style.backgroundColor = color;
        explosionEl.style.animationDuration = (this.config.EXPLOSION_VISUAL_DURATION_FRAMES / this.config.FPS) + 's';
        this.dom.visualEffectsContainer.appendChild(explosionEl);
        setTimeout(() => { if (this.dom.visualEffectsContainer.contains(explosionEl)) this.dom.visualEffectsContainer.removeChild(explosionEl); }, (this.config.EXPLOSION_VISUAL_DURATION_FRAMES / this.config.FPS) * 1000 + 50);
    },

    // --- Shop Logic ---
    openShop: function() {
        this.state.isShopOpen = true;
        this.dom.shopScreenElement.classList.remove('hidden');
        this.dom.shopWaveNumberElement.textContent = this.state.currentWave;
        this.dom.shopPlayerCoinsElement.textContent = this.state.player.coins;
        this.populateShopItems();
        this.state.player.health = Math.min(this.config.PLAYER_MAX_HEALTH, this.state.player.health + this.config.SHOP_HEALTH_REWARD);
        this.state.player.armor = Math.min(this.config.PLAYER_MAX_ARMOR, this.state.player.armor + this.config.SHOP_ARMOR_REWARD);
        this.state.player.coins += this.state.currentWave * this.config.SHOP_COIN_REWARD_PER_WAVE_MULTIPLIER;
        this.updateUI();
    },
    populateShopItems: function() {
        this.dom.shopItemsContainerElement.innerHTML = '';
        Object.keys(this.weapons).forEach(weaponKey => {
            const weapon = this.weapons[weaponKey];
            if (weaponKey === 'pistol') return;

            const itemDiv = document.createElement('div');
            itemDiv.classList.add('shop-item');

            let actionButton;
            if (!this.state.player.ownedWeapons.hasOwnProperty(weaponKey)) {
                itemDiv.innerHTML = `<span>${weapon.name} (Cost: ${weapon.cost} Coins)</span>`;
                actionButton = document.createElement('button');
                actionButton.classList.add('shop-button');
                actionButton.textContent = 'Buy Weapon';
                if (this.state.player.coins < weapon.cost) actionButton.classList.add('disabled');
                actionButton.onclick = () => this.buyWeapon(weaponKey);
            } else {
                const currentAmmo = this.state.player.ownedWeapons[weaponKey];
                const maxAmmo = weapon.maxAmmo;
                itemDiv.innerHTML = `<span>${weapon.name} Ammo (${currentAmmo}/${maxAmmo}) (Cost: ${weapon.ammoCost} Coins)</span>`;
                actionButton = document.createElement('button');
                actionButton.classList.add('shop-button');
                actionButton.textContent = 'Buy Ammo';
                if (this.state.player.coins < weapon.ammoCost || currentAmmo === maxAmmo) actionButton.classList.add('disabled');
                actionButton.onclick = () => this.buyAmmo(weaponKey);
            }
            itemDiv.appendChild(actionButton);
            this.dom.shopItemsContainerElement.appendChild(itemDiv);
        });
        const healthItemDiv = document.createElement('div');
        healthItemDiv.classList.add('shop-item');
        healthItemDiv.innerHTML = `<span>Full Health (Cost: ${this.config.SHOP_FULL_HEALTH_COST} Coins)</span>`;
        const buyHealthButton = document.createElement('button');
        buyHealthButton.classList.add('shop-button');
        buyHealthButton.textContent = 'Buy Health';
        if (this.state.player.coins < this.config.SHOP_FULL_HEALTH_COST || this.state.player.health === this.config.PLAYER_MAX_HEALTH) buyHealthButton.classList.add('disabled');
        buyHealthButton.onclick = () => this.buyHealth();
        healthItemDiv.appendChild(buyHealthButton);
        this.dom.shopItemsContainerElement.appendChild(healthItemDiv);

        const armorItemDiv = document.createElement('div');
        armorItemDiv.classList.add('shop-item');
        armorItemDiv.innerHTML = `<span>Full Armor (Cost: ${this.config.SHOP_FULL_ARMOR_COST} Coins)</span>`;
        const buyArmorButton = document.createElement('button');
        buyArmorButton.classList.add('shop-button');
        buyArmorButton.textContent = 'Buy Armor';
        if (this.state.player.coins < this.config.SHOP_FULL_ARMOR_COST || this.state.player.armor === this.state.player.maxArmor) buyArmorButton.classList.add('disabled');
        buyArmorButton.onclick = () => this.buyArmor();
        armorItemDiv.appendChild(buyArmorButton);
        this.dom.shopItemsContainerElement.appendChild(armorItemDiv);
    },
    buyWeapon: function(weaponKey) {
        const weapon = this.weapons[weaponKey];
        if (this.state.player.coins >= weapon.cost && !this.state.player.ownedWeapons.hasOwnProperty(weaponKey)) {
            this.state.player.coins -= weapon.cost;
            this.state.player.ownedWeapons[weaponKey] = weapon.maxAmmo;
            if (!this.state.player.availableWeaponKeys.includes(weaponKey)) this.state.player.availableWeaponKeys.push(weaponKey);
            this.state.player.currentWeaponSlot = this.state.player.availableWeaponKeys.indexOf(weaponKey);
            this.displayOnScreenMessage(`Purchased ${weapon.name}!`);
            this.updateUI(); this.populateShopItems(); this.dom.shopPlayerCoinsElement.textContent = this.state.player.coins;
        }
    },
    buyAmmo: function(weaponKey) {
        const weapon = this.weapons[weaponKey];
        if (this.state.player.coins >= weapon.ammoCost && this.state.player.ownedWeapons[weaponKey] < weapon.maxAmmo) {
            this.state.player.coins -= weapon.ammoCost;
            this.state.player.ownedWeapons[weaponKey] = weapon.maxAmmo;
            this.displayOnScreenMessage(`${weapon.name} ammo refilled!`);
            this.updateUI(); this.populateShopItems(); this.dom.shopPlayerCoinsElement.textContent = this.state.player.coins;
        }
    },
    buyHealth: function() {
        if (this.state.player.coins >= this.config.SHOP_FULL_HEALTH_COST && this.state.player.health < this.config.PLAYER_MAX_HEALTH) {
            this.state.player.coins -= this.config.SHOP_FULL_HEALTH_COST; this.state.player.health = this.config.PLAYER_MAX_HEALTH;
            this.displayOnScreenMessage(`Health restored!`);
            this.updateUI(); this.populateShopItems(); this.dom.shopPlayerCoinsElement.textContent = this.state.player.coins;
        }
    },
    buyArmor: function() {
        if (this.state.player.coins >= this.config.SHOP_FULL_ARMOR_COST && this.state.player.armor < this.state.player.maxArmor) {
            this.state.player.coins -= this.config.SHOP_FULL_ARMOR_COST; this.state.player.armor = this.state.player.maxArmor;
            this.displayOnScreenMessage(`Armor restored!`);
            this.updateUI(); this.populateShopItems(); this.dom.shopPlayerCoinsElement.textContent = this.state.player.coins;
        }
    },
    proceedToNextWaveFromShop: function() {
        this.dom.shopScreenElement.classList.add('hidden');
        this.state.isShopOpen = false;
        this.state.currentWave++; this.initWaveSettings(); this.updateUI();
        this.displayOnScreenMessage(`Wave ${this.state.currentWave} Started!`);
    },

    // --- UI & Drawing ---
    updateUI: function() {
        try {
            this.dom.scoreElement.textContent = `Score: ${this.state.score}`;
            this.dom.waveInfoElement.textContent = `Wave: ${this.state.currentWave}`;
            if (this.state.player) {
                this.dom.playerHealthElement.textContent = `Health: ${Math.max(0, Math.ceil(this.state.player.health))}`;
                this.dom.playerArmorElement.textContent = `Armor: ${Math.max(0, Math.ceil(this.state.player.armor))}`;
                this.dom.playerCoinsElement.textContent = `Coins: ${this.state.player.coins}`;
                if (this.state.player.availableWeaponKeys.length > 0) {
                    const currentWeaponKey = this.state.player.availableWeaponKeys[this.state.player.currentWeaponSlot];
                    const weapon = this.weapons[currentWeaponKey]; const ammo = this.state.player.ownedWeapons[currentWeaponKey];
                    const ammoDisplay = weapon.ammo === Infinity ? "∞" : `${ammo}/${weapon.maxAmmo}`;
                    this.dom.weaponInfoElement.textContent = `${weapon.name} | ${ammoDisplay}`;
                } else { this.dom.weaponInfoElement.textContent = `Pistol | ∞`; }
            } else {
                this.dom.playerHealthElement.textContent = `Health: --`; this.dom.playerArmorElement.textContent = `Armor: --`;
                this.dom.playerCoinsElement.textContent = `Coins: --`; this.dom.weaponInfoElement.textContent = `Pistol | ∞`;
            }
        } catch (error) {
            console.error("Error updating UI:", error);
        }
    },
    displayOnScreenMessage: function(text, duration = this.config.ON_SCREEN_MESSAGE_DEFAULT_DURATION_MS) {
        const p = document.createElement('p'); p.textContent = text;
        this.dom.onScreenMessagesElement.innerHTML = ''; this.dom.onScreenMessagesElement.appendChild(p);
        this.dom.onScreenMessagesElement.classList.remove('hidden');
        clearTimeout(this.state.onScreenMessageTimeout);
        this.state.onScreenMessageTimeout = setTimeout(() => this.dom.onScreenMessagesElement.classList.add('hidden'), duration);
    },
    gameOver: function() {
        this.state.gameRunning = false; if (this.state.animationFrameId) cancelAnimationFrame(this.state.animationFrameId);
        this.dom.gameOverScreen.classList.remove('hidden');
        this.dom.finalScoreElement.textContent = `Your Score: ${this.state.score}`;
        this.dom.finalWaveElement.textContent = `You reached Wave: ${this.state.currentWave}`;
    },
    drawPlayer: function() {
        if (!this.state.player || (this.state.player.health <= 0 && this.state.player.armor <= 0)) return;
        const ctx = this.dom.ctx;
        if (this.state.player.armor > 0) {
            ctx.beginPath(); ctx.arc(this.state.player.x, this.state.player.y, this.state.player.radius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = '#607D8B'; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.save(); ctx.translate(this.state.player.x, this.state.player.y);
        const angle = Math.atan2(this.state.mousePos.y - this.state.player.y, this.state.mousePos.x - this.state.player.x);
        ctx.rotate(angle); ctx.fillStyle = this.state.player.gunColor;
        ctx.fillRect(0, -this.state.player.gunWidth / 2, this.state.player.gunLength, this.state.player.gunWidth);
        ctx.restore();
        ctx.beginPath(); ctx.arc(this.state.player.x, this.state.player.y, this.state.player.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.state.player.color; ctx.fill();
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
    },
    drawProjectiles: function(projectileArray, isFlame = false) {
        const ctx = this.dom.ctx;
        projectileArray.forEach(p => {
            ctx.beginPath();
            if (isFlame) {
                ctx.globalAlpha = p.lifeTimer / p.initialLifeTimer; // Use timer
                ctx.arc(p.x, p.y, p.radius * (p.lifeTimer / p.initialLifeTimer), 0, Math.PI * 2);
            } else {
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            }
            ctx.fillStyle = p.color; ctx.fill();
            ctx.globalAlpha = 1.0;
        });
    },
    drawPowerUps: function() {
        const ctx = this.dom.ctx;
        this.state.powerUps.forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color; ctx.fill();
            ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; ctx.stroke();
            const weaponRifle = this.weapons['rifle']; // Check specific weapon if needed
            const isDarkBg = (weaponRifle && p.color === weaponRifle.color) || p.color === '#AF00FF' || p.color === '#607D8B';
            ctx.fillStyle = isDarkBg ? '#FFF' : '#000';
            ctx.font = "bold 11px 'Press Start 2P'";
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(p.letter, p.x, p.y + 1);
        });
    },
    drawZombies: function() {
        const ctx = this.dom.ctx;
        this.state.zombies.forEach(z => {
            ctx.beginPath(); let currentColor = z.color;
            if (z.attackCooldownTimer > 0 && Math.floor(z.attackCooldownTimer * 10) % 10 < 5) currentColor = '#FF5252'; // Blink effect based on timer
            ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            ctx.fillStyle = currentColor; ctx.fill();
            ctx.strokeStyle = this.zombieTypes[z.typeName] ? this.zombieTypes[z.typeName].color : '#2E7D32';
            ctx.lineWidth = 2; ctx.stroke();
            if (z.health < z.maxHealth) {
                const hbW = z.radius * 1.5, hbH = 5, hbX = z.x - hbW / 2, hbY = z.y - z.radius - hbH - 5;
                ctx.fillStyle = '#D32F2F'; ctx.fillRect(hbX, hbY, hbW, hbH);
                ctx.fillStyle = '#4CAF50'; ctx.fillRect(hbX, hbY, (z.health / z.maxHealth) * hbW, hbH);
            }
        });
    },
    drawEnvironmentObjects: function() {
        const ctx = this.dom.ctx;
        this.state.environmentObjects.forEach(obj => {
            if (obj.type === 'barrel') {
                ctx.beginPath(); ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.fillStyle = obj.color; ctx.fill();
                ctx.strokeStyle = '#4E342E'; ctx.lineWidth = 3; ctx.stroke();
                ctx.fillStyle = '#FFFDE7'; ctx.font = "bold 18px 'Press Start 2P'";
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText("!", obj.x, obj.y + 2); // Changed from L!L
            }
        });
    },

    // --- Game Loop ---
    gameLoop: function(timestamp) {
        try {
            if (!this.state.gameRunning) { if (this.state.animationFrameId) cancelAnimationFrame(this.state.animationFrameId); return; }

            const deltaTime = (timestamp - this.state.lastTimestamp) / 1000; // deltaTime in seconds
            this.state.lastTimestamp = timestamp;

            if (!this.state.isManuallyPaused && !this.state.isShopOpen) {
                this.updatePlayer(deltaTime);
                this.spawnZombies(); // Spawning is event/chance based, not directly tied to deltaTime scaling for time
                this.updateZombies(deltaTime);
                this.updateProjectiles(this.state.bullets, deltaTime);
                this.updateProjectiles(this.state.flameParticles, deltaTime, true);
                this.updateGrenades(deltaTime);
                this.updateProjectiles(this.state.zombieProjectiles, deltaTime);
                this.updatePowerUps(deltaTime);
                this.updateEnvironmentObjects(deltaTime);
            }

            this.dom.ctx.clearRect(0, 0, this.config.CANVAS_WIDTH, this.config.CANVAS_HEIGHT);
            this.drawEnvironmentObjects();
            this.drawPlayer();
            this.drawZombies();
            this.drawProjectiles(this.state.bullets);
            this.drawProjectiles(this.state.flameParticles, true);
            this.drawProjectiles(this.state.grenades); // Grenades need their own draw or be part of general projectiles
            this.drawProjectiles(this.state.zombieProjectiles);
            this.drawPowerUps();
            
            this.state.animationFrameId = requestAnimationFrame((newTimestamp) => this.gameLoop(newTimestamp));
        } catch (error) {
            console.error("Error in gameLoop:", error);
            this.state.gameRunning = false; // Stop the game on critical error
            this.displayOnScreenMessage("A critical error occurred. Check console.", 10000);
        }
    },

    // --- Entry Point ---
    run: function() {
        this.initDomElements();
        this.initEventListeners();
        this.updateUI(); // Initial UI state
        // Game doesn't start automatically, waits for startButton click.
        this.dom.startScreen.classList.remove('hidden'); // Show start screen
    }
};

// --- Start the Game ---
window.onload = () => {
    Game.run();
}; 