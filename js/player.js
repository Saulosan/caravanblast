// ============================================================
//  PLAYER — movimento, tiro, laser + animação por spritesheet
// ============================================================

const PLAYER_FRAME_W = 32;
const PLAYER_FRAME_H = 32;

// Spritesheet: 18 frames em linha
// 0-3   = idle loop
// 4-6   = virando direita
// 7-9   = virando esquerda
// 10-13 = loop direita
// 14-17 = loop esquerda
const PANIM = {
  idle:             { frames:[0,1,2,3],       fps:12, loop:true  },
  turning_right:    { frames:[4,5,6],         fps:14, loop:false },
  turning_left:     { frames:[7,8,9],         fps:14, loop:false },
  loop_right:       { frames:[10,11,12,13],   fps:12, loop:true  },
  loop_left:        { frames:[14,15,16,17],   fps:12, loop:true  },
  returning_right:  { frames:[6,5,4],         fps:14, loop:false },
  returning_left:   { frames:[9,8,7],         fps:14, loop:false },
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
  const left  = !!K["ArrowLeft"];
  const cur   = playerAnimState.state;

  if(right && !left){
    if(cur === "idle"){
      setPlayerAnim("turning_right");
    } else if(cur === "loop_left"){
      setPlayerAnim("returning_left");
    } else if(cur === "turning_left"){
      setPlayerAnim("returning_left");
    }
    return;
  }

  if(left && !right){
    if(cur === "idle"){
      setPlayerAnim("turning_left");
    } else if(cur === "loop_right"){
      setPlayerAnim("returning_right");
    } else if(cur === "turning_right"){
      setPlayerAnim("returning_right");
    }
    return;
  }

  if(!right && !left){
    if(cur === "loop_right" || cur === "turning_right"){
      setPlayerAnim("returning_right");
    } else if(cur === "loop_left" || cur === "turning_left"){
      setPlayerAnim("returning_left");
    }
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
//  ESTADO DE ENTRADA / RESPAWN
// ============================================================

function startPlayerArrival(){
  const p = G.player;

  p.arriving = true;
  p.arrivalPhase = 0;
  p.arrivalTargetMidY = Math.floor(VH * 0.45);
  p.arrivalTargetEndY = VH - 120;
  p.arrivalSpeedFast = 420;
  p.arrivalSpeedSlow = 180;

  p.x = Math.floor(VW / 2 - p.w / 2);
  p.y = VH + 40;

  p.inv = 999;
  setPlayerAnim("idle");
}

function updatePlayerArrival(dt){
  const p = G.player;

  if(!p.arriving) return false;

  if(p.arrivalPhase === 0){
    p.y -= p.arrivalSpeedFast * dt;
    if(p.y <= p.arrivalTargetMidY){
      p.y = p.arrivalTargetMidY;
      p.arrivalPhase = 1;
    }
    return true;
  }

  if(p.arrivalPhase === 1){
    p.y += p.arrivalSpeedSlow * dt;
    if(p.y >= p.arrivalTargetEndY){
      p.y = p.arrivalTargetEndY;
      p.arriving = false;
      p.arrivalPhase = 0;
      p.inv = 1.5;
    }
    return true;
  }

  return false;
}

// ============================================================
//  UPDATE PRINCIPAL
// ============================================================

function updPlayer(dt){
  const p = G.player;

  if(p.inv > 0 && p.inv !== 999){
    p.inv = Math.max(0, p.inv - dt);
  }

  if(updatePlayerArrival(dt)){
    tickPlayerAnim(dt);
    return;
  }

  const spd = laserUsing ? p.spd * p.lMult : p.spd;

  let mx = 0, my = 0;
  if(K["ArrowLeft"])  mx -= 1;
  if(K["ArrowRight"]) mx += 1;
  if(K["ArrowUp"])    my -= 1;
  if(K["ArrowDown"])  my += 1;

  if(mx && my){
    mx *= Math.SQRT2 / 2;
    my *= Math.SQRT2 / 2;
  }

  p.x = clamp(p.x + mx * spd * dt, 8, VW - p.w - 8);
  p.y = clamp(p.y + my * spd * dt, 8, VH - p.h - 8);

  updatePlayerAnimFromInput();
  tickPlayerAnim(dt);

  p.fire -= dt;
  if(laserUsing){
    if(p.fire <= 0){
      G.pShots.push({
        type:"laser",
        px:p.x,
        py:p.y + Math.floor(p.h * 0.45),
        pw:p.w,
        alive:true,
        ttl:.05
      });
      p.fire = .04;
    }
  } else if(K["KeyX"]){
    const sw2 = sw(gc.shot,"shot");
    const sh2 = sh(gc.shot,"shot");
    if(p.fire <= 0){
      G.pShots.push({
        type:"shot",
        x:p.x + p.w/2 - sw2/2,
        y:p.y - sh2 + 4,
        w:sw2,
        h:sh2,
        vy:-580,
        alive:true
      });
      p.fire = .075;
    }
  }
}

function updShots(dt){
  for(const s of G.pShots){
    if(!s.alive) continue;

    if(s.type === "shot"){
      s.y += s.vy * dt;
      if(s.y + s.h < 0) s.alive = false;
    } else {
      s.ttl -= dt;
      if(s.ttl <= 0 || !laserUsing) s.alive = false;
    }
  }
  G.pShots = G.pShots.filter(s => s.alive);
}

function updLaser(dt){
  const p = G.player;
  if(p.arriving){
    laserUsing = false;
    return;
  }

  laserUsing = K["KeyC"] && laserEnergy > 0 && laserCD === 0;

  if(laserUsing){
    laserEnergy = Math.max(0, laserEnergy - dt);
    if(laserEnergy === 0) laserCD = LASER_COOLDOWN;
  } else if(laserCD > 0){
    laserCD = Math.max(0, laserCD - dt);
    laserEnergy = Math.min(LASER_MAX, (1 - (laserCD / LASER_COOLDOWN)) * LASER_MAX);
  }
}

function dmgPlayer(){
  const p = G.player;

  if(p.arriving) return;
  if(p.inv > 0) return;

  if(!infiniteLives) p.lives--;

  p.inv = 2.5;
  expl(p.x + p.w/2, p.y + p.h/2, "#6699ff");

  comboX = 1;
  comboKills = 0;
  comboT = COMBO_DUR;

  if(p.lives <= 0 && !infiniteLives){
    gameOver = true;
    stopBGM();
    appState = "gameover";
    return;
  }

  startPlayerArrival();
}