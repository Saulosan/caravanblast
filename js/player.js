// ============================================================
// PLAYER — movimento, tiro, laser + animação por spritesheet
// ============================================================
const PLAYER_FRAME_W = 32;
const PLAYER_FRAME_H = 32;

// Spritesheet: 18 frames em linha
// 0-3 = idle loop
// 4-6 = virando direita
// 7-9 = virando esquerda
// 10-13 = loop direita
// 14-17 = loop esquerda
const PANIM = {
    idle: { frames:[0,1,2,3], fps:12, loop:true },
    turning_right: { frames:[4,5,6], fps:16, loop:false },
    turning_left: { frames:[7,8,9], fps:16, loop:false },
    loop_right: { frames:[10,11,12,13], fps:12, loop:true },
    loop_left: { frames:[14,15,16,17], fps:12, loop:true },
    returning_right: { frames:[6,5,4], fps:16, loop:false },
    returning_left: { frames:[9,8,7], fps:16, loop:false },
    arriving: { frames:[0,1,2,3], fps:12, loop:true },
};

const playerAnimState = {
    state: "idle",
    frameIdx: 0,
    timer: 0,
};

function setPlayerAnim(newState){
    if(playerAnimState.state === newState) return;
    playerAnimState.state = newState;
    playerAnimState.frameIdx = 0;
    playerAnimState.timer = 0;
}

function tickPlayerAnim(dt){
    const anim = PANIM[playerAnimState.state];
    const dur = 1 / anim.fps;
    playerAnimState.timer += dt;
    while(playerAnimState.timer >= dur){
        playerAnimState.timer -= dur;
        playerAnimState.frameIdx++;
        if(playerAnimState.frameIdx >= anim.frames.length){
            if(anim.loop){
                playerAnimState.frameIdx = 0;
            } else {
                if(playerAnimState.state === "turning_right"){
                    setPlayerAnim("loop_right");
                } else if(playerAnimState.state === "turning_left"){
                    setPlayerAnim("loop_left");
                } else if(playerAnimState.state === "returning_right" || playerAnimState.state === "returning_left"){
                    setPlayerAnim("idle");
                } else {
                    playerAnimState.frameIdx = anim.frames.length - 1;
                }
                break;
            }
        }
    }
}

function updatePlayerAnimFromInput(){
    const right = !!K["ArrowRight"];
    const left = !!K["ArrowLeft"];
    const cur = playerAnimState.state;

    if(right && !left){
        if(cur === "idle"){ setPlayerAnim("turning_right"); }
        else if(cur === "loop_left"){ setPlayerAnim("returning_left"); }
        else if(cur === "turning_left"){ setPlayerAnim("returning_left"); }
        return;
    }

    if(left && !right){
        if(cur === "idle"){ setPlayerAnim("turning_left"); }
        else if(cur === "loop_right"){ setPlayerAnim("returning_right"); }
        else if(cur === "turning_right"){ setPlayerAnim("returning_right"); }
        return;
    }

    if(!right && !left){
        if(cur === "loop_right" || cur === "turning_right"){ setPlayerAnim("returning_right"); }
        else if(cur === "loop_left" || cur === "turning_left"){ setPlayerAnim("returning_left"); }
    }
}

function getPlayerSpriteFrame(){
    return PANIM[playerAnimState.state].frames[playerAnimState.frameIdx];
}

function syncPlayerSize(){
    G.player.w = PLAYER_FRAME_W * SCALE.player;
    G.player.h = PLAYER_FRAME_H * SCALE.player;
}

// ============================================================
// STATE FLAGS
// ============================================================
let flgPlayerControl = 1;
let playerArriving = false;
let playerArrivalPhase = 0;
const ARRIVAL_SPEED_UP = 820;
const ARRIVAL_SPEED_DOWN = 420;

let laserWasAvailable = true;

// ============================================================
// PLAYER ARRIVAL LOGIC
// ============================================================
function updPlayerArrival(dt){
    if(!playerArriving) return;

    const p = G.player;
    const targetX = VW/2 - p.w/2;
    const midY = VH * 0.5 - p.h/2;
    const finalY = VH - 120;

    p.x = targetX;

    if(playerArrivalPhase === 0){
        p.y -= ARRIVAL_SPEED_UP * dt;
        if(p.y <= midY){
            p.y = midY;
            playerArrivalPhase = 1;
        }
    } else {
        p.y += ARRIVAL_SPEED_DOWN * dt;
        if(p.y >= finalY){
            p.y = finalY;
            playerArriving = false;
            playerArrivalPhase = 0;
            flgPlayerControl = 1;
            p.inv = 1.5;
            setPlayerAnim("idle");
        }
    }

    tickPlayerAnim(dt);
}

function updPlayer(dt){
    const p = G.player;

    if(playerArriving){
        updPlayerArrival(dt);
        return;
    }

    if(flgPlayerControl === 0){
        tickPlayerAnim(dt);
        return;
    }

    const spd = laserUsing ? p.spd * p.lMult : p.spd;
    let mx = 0, my = 0;

    if(K["ArrowLeft"]) mx -= 1;
    if(K["ArrowRight"]) mx += 1;
    if(K["ArrowUp"]) my -= 1;
    if(K["ArrowDown"]) my += 1;

    if(mx && my){
        mx *= Math.SQRT2 / 2;
        my *= Math.SQRT2 / 2;
    }

    p.x = clamp(p.x + mx * spd * dt, 8, VW - p.w - 8);
    p.y = clamp(p.y + my * spd * dt, 8, VH - p.h - 8);

    updatePlayerAnimFromInput();
    tickPlayerAnim(dt);
    // O disparo básico é processado em update() (main.js) via updateBasicFire,
    // para que o loop de som pare corretamente mesmo sem controle do jogador.
}

function updShots(dt){
    for(const s of G.pShots){
        if(!s.alive) continue;

        if(s.type === "laser"){
            s.ttl -= dt;
            if(s.ttl <= 0 || !laserUsing) s.alive = false;
        } else if(s.type === "missile"){
            updMissile(s, dt);
        } else { // basic (red/green/purple)
            if(s.homing) updHomingShot(s, dt);
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if(s.y + s.h < 0 || s.x + s.w < -20 || s.x > VW + 20 || s.y > VH + 20) s.alive = false;
        }
    }
    G.pShots = G.pShots.filter(s => s.alive);
}

// O laser/míssil é gerido por updSpecial() em weapons.js.

function dmgPlayer(){
    const p = G.player;
    if(!infiniteLives) p.lives--;

    flgPlayerControl = 0;
    playerArriving = false;
    playerArrivalPhase = 0;
    laserUsing = false;
    specialActive = false;
    if(typeof startBossLaserLinger==="function")startBossLaserLinger();
    onPlayerDeathWeaponReset();
    p.inv = 0;

    expl(p.x + p.w/2, p.y + p.h/2, "#6699ff");

    p.x = -200;
    p.y = VH + 200;
    p.fire = 0;

    setPlayerAnim("idle");

    comboX = 1;
    comboKills = 0;
    comboT = COMBO_DUR;

    if(p.lives <= 0 && !infiniteLives){
        gameOver = true;
        stopBGM();
        stopAllLoopSfx();
        beginScreenTransition(()=>{ appState = "gameover"; });
    } else {
        beginPlayerRespawn();
    }
}