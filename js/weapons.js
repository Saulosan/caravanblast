// ============================================================
// WEAPONS & POWERUPS — tiros básicos, especiais e cápsulas
// ============================================================
//
// COMO AJUSTAR (tudo aqui é data-driven, mexa nos números):
//
// WEAPONS[cor]: tiro básico de cada cor. Campos:
//   spriteKey   : chave do gif em gc{} (assets.js)
//   sfxLoop     : nome do som em SFX{} (audio.js) tocado em loop ao atirar
//   mode        : "burst" (rajadas) ou "columns" (colunas contínuas)
//   speed       : velocidade do projétil (px/s)
//   scaleAt1/scaleAt5 : escala do sprite nos níveis 1 e 5 (interpolação linear)
//   nativeMul          : multiplicador extra do gif nativo (ex.: vermelho minúsculo)
//
//      burst:    burstCount (tiros/rajada; 0 = contínuo), fireInterval, burstGap,
//                ways (1/3/5 direções), waySpread (abertura total rad), damage
//      columns:  columns, colGap, fireInterval, damage
//
// SPECIALS[tipo]: especiais (laser/missile). Compartilham UMA barra
//   (laserEnergy/laserCD) — o pickup da MESMA cor enche 50% da barra.
//
//   cycleBasic / cycleSpecial : cores que cada tipo de cápsula alterna
//   moveSpeed     : velocidade ao quicar pelo playfield
//
// Balanceamento de dano (HP de referência): small=1, medA=4, medC=5,
//   miniboss(medB)=72, boss alto. Verde = maior dano, Vermelho = médio,
//   Roxo = menor dano (mas teleguiado). Ajuste "damage" por nível.
// ============================================================

const DEFAULT_WEAPON_COLOR="green";   // tiro inicial
const DEFAULT_SPECIAL_TYPE="laser";   // especial inicial
const WEAPON_COLORS=["red","green","purple"];

const WEAPONS={
  red:{
    label:"VERMELHO",
    spriteKey:"tiro03",
    sfxLoop:"redMachinegun",
    mode:"burst",
    speed:640,
    nativeMul:2.0,          // gif nativo pequeno — dobra a base no nv1
    scaleAt1:0.50,          // efetivo nv1 ≈ 1.0× (dobro do anterior)
    scaleAt5:0.78,          // cresce até ~1.56× no nv5
    levels:[
      null,
      {burstCount:5,  fireInterval:0.05,  burstGap:0.26, ways:1, waySpread:0,    damage:0.48},
      {burstCount:6,  fireInterval:0.05,  burstGap:0.24, ways:3, waySpread:0.50, damage:0.48},
      {burstCount:8,  fireInterval:0.045, burstGap:0.22, ways:3, waySpread:0.50, damage:0.48},
      {burstCount:8,  fireInterval:0.045, burstGap:0.20, ways:5, waySpread:0.95, damage:0.48},
      {burstCount:10, fireInterval:0.04,  burstGap:0.18, ways:5, waySpread:0.95, damage:0.52}
    ]
  },
  green:{
    label:"VERDE",
    spriteKey:"shot",
    sfxLoop:"greenLaser",
    mode:"columns",
    speed:580,
    nativeMul:1.0,
    scaleAt1:0.62,          // nv1 um pouco maior que antes
    scaleAt5:1.08,
    levels:[
      null,
      {columns:1, colGap:0,  fireInterval:0.075, damage:0.85},
      {columns:2, colGap:18, fireInterval:0.075, damage:0.85},
      {columns:2, colGap:20, fireInterval:0.070, damage:1.08},
      {columns:3, colGap:22, fireInterval:0.070, damage:1.08},
      {columns:3, colGap:24, fireInterval:0.065, damage:1.38}
    ]
  },
  purple:{
    label:"ROXO",
    spriteKey:"tiro04",
    sfxLoop:"purpleHoming",
    mode:"burst",
    speed:440,
    nativeMul:1.0,
    scaleAt1:1.0,
    scaleAt5:3.04,          // nv5 = dobro do tamanho anterior (1.52×2)
    turnRate:6.5,
    levels:[
      null,
      {burstCount:5,  fireInterval:0.07,  burstGap:0.30, ways:1, waySpread:0, damage:0.44},
      {burstCount:7,  fireInterval:0.07,  burstGap:0.28, ways:1, waySpread:0, damage:0.46},
      {burstCount:9,  fireInterval:0.065, burstGap:0.26, ways:1, waySpread:0, damage:0.48},
      {burstCount:12, fireInterval:0.06,  burstGap:0.24, ways:1, waySpread:0, damage:0.50},
      {burstCount:0,  fireInterval:0.05,  burstGap:0,    ways:1, waySpread:0, damage:0.52}
    ]
  }
};

const SPECIALS={
  laser:{
    label:"LASER",
    barColorA:"#0088ff", barColorB:"#00ffee",
    drainPerSec:1.0
  },
  missile:{
    label:"MISSEIS",
    barColorA:"#ff7a00", barColorB:"#ffd000",
    sfxLoop:"missileLaunch",
    drainPerSec:0.88,
    fireInterval:0.06,
    speedStart:120, speedMax:700, accel:920,
    spreadDeg:55,
    spriteScale:1.5,
    damage:1.15,
    areaDamage:3.4,
    areaRadius:52,
    clearsBullets:true
  }
};

const POWERUP={
  cycleBasic:["red","green","purple"],
  cycleSpecial:["blue","orange"],
  colorTime:3.0,
  cyclesBeforeLeave:3,
  testSpawnInterval:30.0,
  moveSpeed:118,
  scale:1.5,                               // entre 1× e 2× nativo
  angleMargin:0.32,                        // rad — evita ângulos retos (~18°)
  sprites:{red:"capRed",green:"capGreen",purple:"capPurple",blue:"capBlue",orange:"capOrange"},
  fallbackColors:{red:"#ff4040",green:"#40ff60",purple:"#b060ff",blue:"#3399ff",orange:"#ff9a30"}
};

const SPECIAL_TYPES=["laser","missile"];

// ── Estado da arma do jogador ───────────────────────────────────────────────
let weaponColor=DEFAULT_WEAPON_COLOR;
let weaponLevel=1;
let specialType=DEFAULT_SPECIAL_TYPE;
let specialActive=false;

let basicBurstShotsLeft=0;
let basicBurstTimer=0;
let basicBurstInGap=false;
let specialFireTimer=0;
let laserShotTimer=0;
let powerupSpawnTimer=POWERUP.testSpawnInterval;
let nextCapsuleKind="basic";

function resetWeapons(){
  weaponColor=DEFAULT_WEAPON_COLOR;
  weaponLevel=1;
  specialType=DEFAULT_SPECIAL_TYPE;
  specialActive=false;
  resetBasicBurst();
  specialFireTimer=0;
  laserShotTimer=0;
  powerupSpawnTimer=POWERUP.testSpawnInterval;
  nextCapsuleKind="basic";
}

function resetBasicBurst(){
  basicBurstShotsLeft=0;
  basicBurstTimer=0;
  basicBurstInGap=false;
}

// Morte: mantém cor/especial, mas o tiro volta pro nível 1
function onPlayerDeathWeaponReset(){
  weaponLevel=1;
  resetBasicBurst();
}

// ── Tamanho de projétil — escala por nível (todas as cores) ─────────────────
function weaponLevelScale(wpn){
  const s1=wpn.scaleAt1!=null?wpn.scaleAt1:0.5;
  const s5=wpn.scaleAt5!=null?wpn.scaleAt5:1.0;
  const mul=wpn.nativeMul!=null?wpn.nativeMul:1;
  const lv=clamp(weaponLevel,1,5);
  const t=(lv-1)/4;
  return (s1+(s5-s1)*t)*mul;
}

function shotSize(spriteKey,scale){
  const c=gc[spriteKey];
  const nw=rdy(c)?c.width:16;
  const nh=rdy(c)?c.height:16;
  return {w:Math.max(3,Math.round(nw*scale)),h:Math.max(3,Math.round(nh*scale))};
}

function shotSizeForWeapon(wpn){
  const c=gc[wpn.spriteKey];
  const nw=rdy(c)?c.width:16;
  const nh=rdy(c)?c.height:16;
  const sc=weaponLevelScale(wpn);
  return {
    w:Math.max(3,Math.round(nw*sc)),
    h:Math.max(3,Math.round(nh*sc)),
    sc
  };
}

let missileWingSide=0;

// Pontos de disparo — bico e asas (coordenadas no playfield)
function playerMuzzle(){
  const p=G.player;
  return {
    cx:p.x+p.w/2,
    my:p.y+Math.round(p.h*0.04)
  };
}

function playerWingSlots(){
  const p=G.player;
  const m=playerMuzzle();
  const wing=Math.round(p.w*0.34);
  const wy=m.my+Math.round(p.h*0.28);
  return {
    left:{x:m.cx-wing,y:wy},
    right:{x:m.cx+wing,y:wy}
  };
}

function basicShotSpawnY(bulletH){
  const m=playerMuzzle();
  return m.my-Math.round(bulletH*0.82);
}

function weaponShotColor(){
  if(weaponColor==="red")return "#ff5544";
  if(weaponColor==="purple")return "#c070ff";
  return "#55ff77";
}

function emitMuzzleGlow(col){
  const m=playerMuzzle();
  G.muzzleGlows.push({
    x:m.cx,y:m.my,
    r:5,maxR:13,
    life:0.11,ml:0.11,
    col:col||weaponShotColor(),
    alpha:0.5
  });
}

function updMuzzleGlows(dt){
  for(const g of G.muzzleGlows){
    g.life-=dt;
    g.r+=(g.maxR-g.r)*Math.min(1,dt*18);
  }
  G.muzzleGlows=G.muzzleGlows.filter(g=>g.life>0);
}

function hitSparkForShot(s,x,y){
  let col="#ffffff";
  if(s.type==="missile")col="#ff9520";
  else if(s.type==="basic"){
    if(s.color==="red")col="#ff5544";
    else if(s.color==="purple")col="#c070ff";
    else col="#55ff77";
  }else if(s.type==="laser")col="#55ddff";
  spawnSparkBurst(x,y,"#ffffff",{n:4,sizeMin:4,sizeMax:8,life:0.2,speedMax:190,downBias:8,kind:"hit"});
  spawnSparkBurst(x,y,col,{n:12,sizeMin:3.5,sizeMax:7.5,life:0.24,speedMin:60,speedMax:210,downBias:12,kind:"hit"});
}

// ── Disparo básico ──────────────────────────────────────────────────────────
function updateBasicFire(dt,firing){
  const wpn=WEAPONS[weaponColor];
  if(!firing){
    resetBasicBurst();
    stopBasicLoops(null);
    return;
  }
  stopBasicLoops(wpn.sfxLoop);
  syncLoopSfx(wpn.sfxLoop,true);

  const lv=wpn.levels[weaponLevel];
  basicBurstTimer-=dt;

  if(wpn.mode==="columns"){
    if(basicBurstTimer<=0){
      fireColumns(wpn,lv);
      basicBurstTimer=lv.fireInterval;
    }
    return;
  }

  // modo burst (vermelho / roxo)
  if(lv.burstCount===0){               // contínuo (ex.: roxo nível 5)
    if(basicBurstTimer<=0){
      fireWays(wpn,lv);
      basicBurstTimer=lv.fireInterval;
    }
    return;
  }
  if(basicBurstInGap){
    if(basicBurstTimer<=0){
      basicBurstInGap=false;
      basicBurstShotsLeft=lv.burstCount;
    }
    return;
  }
  if(basicBurstShotsLeft<=0)basicBurstShotsLeft=lv.burstCount;
  if(basicBurstTimer<=0&&basicBurstShotsLeft>0){
    fireWays(wpn,lv);
    basicBurstShotsLeft--;
    basicBurstTimer=lv.fireInterval;
    if(basicBurstShotsLeft<=0){
      basicBurstInGap=true;
      basicBurstTimer=lv.burstGap;
    }
  }
}

// Garante que apenas o loop da arma atual toque
function stopBasicLoops(keep){
  for(const col of WEAPON_COLORS){
    const sfx=WEAPONS[col].sfxLoop;
    if(sfx!==keep)syncLoopSfx(sfx,false);
  }
}

function fireWays(wpn,lv){
  const p=G.player;
  const sz=shotSizeForWeapon(wpn);
  const cx=p.x+p.w/2;
  const spawnY=basicShotSpawnY(sz.h);
  const n=lv.ways;
  emitMuzzleGlow();
  for(let i=0;i<n;i++){
    let a=-Math.PI/2;
    if(n>1)a+=-lv.waySpread/2+(i/(n-1))*lv.waySpread;
    let vx=Math.cos(a)*wpn.speed;
    let vy=Math.sin(a)*wpn.speed;
    const homing=weaponColor==="purple";
    let target=null;
    if(homing){
      target=acquireSpreadTarget(cx,spawnY);
      if(target){
        const tp=targetPos(target);
        if(tp){
          const ta=Math.atan2(tp.y-spawnY,tp.x-cx);
          vx=Math.cos(ta)*wpn.speed;
          vy=Math.sin(ta)*wpn.speed;
        }
      }
    }
    G.pShots.push({
      type:"basic",color:weaponColor,spriteKey:wpn.spriteKey,
      x:cx-sz.w/2,y:spawnY,w:sz.w,h:sz.h,
      vx,vy,dmg:lv.damage,alive:true,
      homing,target,turnRate:wpn.turnRate||0,sc:sz.sc
    });
  }
}

function fireColumns(wpn,lv){
  const p=G.player;
  const sz=shotSizeForWeapon(wpn);
  const cx=p.x+p.w/2;
  const spawnY=basicShotSpawnY(sz.h);
  emitMuzzleGlow();
  const cols=lv.columns;
  const gap=lv.colGap;
  const startX=cx-(cols-1)*gap/2;
  for(let i=0;i<cols;i++){
    const x=startX+i*gap-sz.w/2;
    G.pShots.push({
      type:"basic",color:"green",spriteKey:wpn.spriteKey,
      x,y:spawnY,w:sz.w,h:sz.h,
      vx:0,vy:-wpn.speed,dmg:lv.damage,alive:true,homing:false,sc:sz.sc
    });
  }
}

// ── Teleguiado (roxo) ───────────────────────────────────────────────────────
// Distribui alvos entre inimigos vivos: prioriza quem ainda não tem míssil
// roxo apontando. Trava no alvo ao nascer; se morrer, segue reto.
const HOMING_BOSS={boss:true};

function listHomingTargets(fromX,fromY){
  const list=[];
  for(const e of G.enemies){
    if(!e.alive||e.dead)continue;
    const x=e.x+e.w/2,y=e.drawY+e.h/2;
    list.push({ref:e,x,y,d:(x-fromX)*(x-fromX)+(y-fromY)*(y-fromY)});
  }
  if(G.boss&&!G.boss.dead&&!G.boss.entering){
    const b=G.boss;
    const x=b.x+b.w/2,y=b.y+b.h/2;
    list.push({ref:HOMING_BOSS,x,y,d:(x-fromX)*(x-fromX)+(y-fromY)*(y-fromY)});
  }
  list.sort((a,b)=>a.d-b.d);
  return list;
}

function homingLockCount(){
  const counts=new Map();
  for(const s of G.pShots){
    if(!s.alive||!s.homing||!s.target)continue;
    counts.set(s.target,(counts.get(s.target)||0)+1);
  }
  return counts;
}

function acquireSpreadTarget(fromX,fromY){
  const candidates=listHomingTargets(fromX,fromY);
  if(!candidates.length)return null;
  const locks=homingLockCount();
  let best=null,bestLocks=1e9,bestDist=1e18;
  for(const c of candidates){
    const n=locks.get(c.ref)||0;
    if(n<bestLocks||(n===bestLocks&&c.d<bestDist)){
      bestLocks=n;
      bestDist=c.d;
      best=c.ref;
    }
  }
  return best;
}

function targetPos(t){
  if(!t)return null;
  if(t.boss){
    const b=G.boss;
    if(b&&!b.dead&&!b.entering)return {x:b.x+b.w/2,y:b.y+b.h/2};
    return null;
  }
  if(t.alive&&!t.dead)return {x:t.x+t.w/2,y:t.drawY+t.h/2};
  return null;
}

function updHomingShot(s,dt){
  const tp=targetPos(s.target);
  if(!tp){s.target=null;return;}   // alvo sumiu → segue reto
  const cxp=s.x+s.w/2,cyp=s.y+s.h/2;
  const desired=Math.atan2(tp.y-cyp,tp.x-cxp);
  let cur=Math.atan2(s.vy,s.vx);
  let diff=desired-cur;
  while(diff>Math.PI)diff-=Math.PI*2;
  while(diff<-Math.PI)diff+=Math.PI*2;
  const maxTurn=s.turnRate*dt;
  cur+=clamp(diff,-maxTurn,maxTurn);
  const spd=Math.hypot(s.vx,s.vy)||WEAPONS.purple.speed;
  s.vx=Math.cos(cur)*spd;
  s.vy=Math.sin(cur)*spd;
}

// ── Especial (laser / míssil) ───────────────────────────────────────────────
let weaponSpecialWasAvailable=true;

function syncSpecialBarVoices(prevEnergy,prevCD){
  const depletedKey=specialType==="missile"?"outofmissiles":"laserdepleted";
  const readyKey=specialType==="missile"?"missilesrestocked":"laserready";
  if(prevEnergy>0&&laserEnergy===0){
    playVoice(depletedKey);
    weaponSpecialWasAvailable=false;
  }
  if(!weaponSpecialWasAvailable&&prevCD>0&&laserCD===0&&laserEnergy>0){
    playVoice(readyKey);
    weaponSpecialWasAvailable=true;
  }
}

function refillSpecial(frac){
  const prevEnergy=laserEnergy;
  const prevCD=laserCD;
  if(laserCD>0){
    laserCD=Math.max(0,laserCD-LASER_COOLDOWN*frac);
    laserEnergy=(1-laserCD/LASER_COOLDOWN)*LASER_MAX;
  }else{
    laserEnergy=Math.min(LASER_MAX,laserEnergy+LASER_MAX*frac);
  }
  syncSpecialBarVoices(prevEnergy,prevCD);
}

function updSpecial(dt){
  const prevEnergy=laserEnergy;
  const prevCD=laserCD;
  const controllable=flgPlayerControl===1&&!playerArriving;
  const want=controllable&&!!K["KeyC"]&&laserEnergy>0&&laserCD===0;

  specialActive=want;
  laserUsing=want&&specialType==="laser";

  if(want){
    const drain=SPECIALS[specialType].drainPerSec||1.0;
    laserEnergy=Math.max(0,laserEnergy-dt*drain);
    if(laserEnergy===0)laserCD=LASER_COOLDOWN;

    if(specialType==="laser"){
      laserShotTimer-=dt;
      if(laserShotTimer<=0){
        const p=G.player;
        G.pShots.push({type:"laser",px:p.x,py:p.y,pw:p.w,alive:true,ttl:0.05});
        emitMuzzleGlow("#55ddff");
        laserShotTimer=0.04;
      }
    }else{ // missile
      specialFireTimer-=dt;
      if(specialFireTimer<=0){
        spawnMissile();
        specialFireTimer=SPECIALS.missile.fireInterval;
      }
    }
  }else if(laserCD>0){
    laserCD=Math.max(0,laserCD-dt);
    laserEnergy=Math.min(LASER_MAX,(1-laserCD/LASER_COOLDOWN)*LASER_MAX);
  }

  syncSpecialBarVoices(prevEnergy,prevCD);

  syncLoopSfx("blueLaser",laserUsing);
  if(SPECIALS.missile.sfxLoop)syncLoopSfx(SPECIALS.missile.sfxLoop,want&&specialType==="missile");
}

function spawnMissile(){
  const m=SPECIALS.missile;
  missileWingSide=1-missileWingSide;
  const wings=playerWingSlots();
  const wp=missileWingSide?wings.left:wings.right;
  const sz=shotSize("missile",m.spriteScale);
  const a=-Math.PI/2+(Math.random()-0.5)*(m.spreadDeg*Math.PI/180);
  G.pShots.push({
    type:"missile",
    x:wp.x-sz.w/2,y:wp.y-Math.round(sz.h*0.55),w:sz.w,h:sz.h,
    ang:a,speed:m.speedStart,dmg:m.damage,alive:true
  });
}

function updMissile(s,dt){
  const m=SPECIALS.missile;
  s.speed=Math.min(m.speedMax,s.speed+m.accel*dt);
  s.x+=Math.cos(s.ang)*s.speed*dt;
  s.y+=Math.sin(s.ang)*s.speed*dt;
  if(m.clearsBullets&&tryMissileBulletImpact(s))return;
  if(s.y+s.h<-20||s.x+s.w<-30||s.x>VW+30)s.alive=false;
}

// ── Cápsulas de powerup ─────────────────────────────────────────────────────
function capsuleCycle(kind){
  return kind==="special"?POWERUP.cycleSpecial:POWERUP.cycleBasic;
}

function capsuleSpriteKey(kind,color){
  return POWERUP.sprites[color]||(kind==="special"?"capBlue":"capRed");
}

function randomDiagonalVelocity(downOnly){
  const spd=POWERUP.moveSpeed;
  const m=POWERUP.angleMargin;
  let angle;
  if(downOnly){
    if(Math.random()<0.5){
      angle=m+Math.random()*(Math.PI/2-2*m);
    }else{
      angle=Math.PI/2+m+Math.random()*(Math.PI/2-2*m);
    }
  }else{
    const quad=Math.floor(Math.random()*4);
    angle=quad*(Math.PI/2)+m+Math.random()*(Math.PI/2-2*m);
  }
  return {vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd};
}

function spawnCapsule(kind){
  const cycle=capsuleCycle(kind);
  const sk=capsuleSpriteKey(kind,cycle[0]);
  const img=gc[sk];
  const w=Math.round((rdy(img)?img.width:28)*POWERUP.scale);
  const h=Math.round((rdy(img)?img.height:28)*POWERUP.scale);
  const x=Math.random()*(VW-w);
  const y=-h-4;
  const vel=randomDiagonalVelocity(true);
  G.capsules.push({
    kind,x,y,w,h,
    vx:vel.vx,vy:vel.vy,
    colorIdx:0,colorT:0,cycles:0,
    leaving:false,alive:true
  });
}

function bounceCapsule(c){
  let hit=false;
  if(c.x<0){c.x=0;hit=true;}
  if(c.x+c.w>VW){c.x=VW-c.w;hit=true;}
  if(c.y<0){c.y=0;hit=true;}
  if(c.y+c.h>VH){c.y=VH-c.h;hit=true;}
  if(hit){
    const vel=randomDiagonalVelocity(false);
    c.vx=vel.vx;
    c.vy=vel.vy;
  }
}

function updCapsules(dt){
  powerupSpawnTimer-=dt;
  if(powerupSpawnTimer<=0){
    spawnCapsule(nextCapsuleKind);
    nextCapsuleKind=nextCapsuleKind==="basic"?"special":"basic";
    powerupSpawnTimer=POWERUP.testSpawnInterval;
  }

  const p=G.player;
  const canPick=flgPlayerControl===1&&!playerArriving;

  for(const c of G.capsules){
    if(!c.alive)continue;
    const cycle=capsuleCycle(c.kind);

    if(!c.leaving){
      c.colorT+=dt;
      if(c.colorT>=POWERUP.colorTime){
        c.colorT-=POWERUP.colorTime;
        c.colorIdx++;
        if(c.colorIdx>=cycle.length){
          c.colorIdx=0;
          c.cycles++;
          if(c.cycles>=POWERUP.cyclesBeforeLeave)startCapsuleLeaving(c);
        }
      }
    }

    c.x+=c.vx*dt;
    c.y+=c.vy*dt;

    if(c.leaving){
      if(c.x+c.w<-12||c.x>VW+12||c.y+c.h<-12||c.y>VH+12)c.alive=false;
    }else{
      bounceCapsule(c);
    }

    if(canPick&&rOvlp({x:p.x+8,y:p.y+8,w:p.w-16,h:p.h-16},{x:c.x,y:c.y,w:c.w,h:c.h})){
      applyPowerup(cycle[c.colorIdx]);
      c.alive=false;
    }
  }
  G.capsules=G.capsules.filter(c=>c.alive);
}

function startCapsuleLeaving(c){
  c.leaving=true;
  const dl=c.x,dr=VW-(c.x+c.w),dtp=c.y,db=VH-(c.y+c.h);
  const mn=Math.min(dl,dr,dtp,db);
  let vx=0,vy=0;
  if(mn===dl)vx=-1;else if(mn===dr)vx=1;else if(mn===dtp)vy=-1;else vy=1;
  const spd=POWERUP.moveSpeed*1.35;
  c.vx=vx*spd;
  c.vy=vy*spd;
}

function applyPowerup(color){
  if(color==="red"||color==="green"||color==="purple"){
    if(weaponColor===color){
      weaponLevel=Math.min(5,weaponLevel+1);
    }else{
      weaponColor=color;   // troca de cor mantém o nível
    }
    resetBasicBurst();
  }else if(color==="blue"){
    if(specialType==="laser")refillSpecial(0.5);
    else specialType="laser";
  }else if(color==="orange"){
    if(specialType==="missile")refillSpecial(0.5);
    else specialType="missile";
  }
  playSelectSfx();
}

// ── Debug de armas (J/H/K/L — funciona em jogo e pausa) ─────────────────────
function debugWeaponLevelUp(){
  weaponLevel=Math.min(5,weaponLevel+1);
  resetBasicBurst();
  playSelectSfx();
}

function debugWeaponLevelReset(){
  weaponLevel=1;
  resetBasicBurst();
  playSelectSfx();
}

function debugCycleBasicWeapon(){
  const idx=WEAPON_COLORS.indexOf(weaponColor);
  weaponColor=WEAPON_COLORS[(idx+1)%WEAPON_COLORS.length];
  resetBasicBurst();
  playSelectSfx();
}

function debugCycleSpecialWeapon(){
  const idx=SPECIAL_TYPES.indexOf(specialType);
  specialType=SPECIAL_TYPES[(idx+1)%SPECIAL_TYPES.length];
  playSelectSfx();
}

function handleWeaponDebugKey(code){
  if(code==="KeyJ")debugWeaponLevelUp();
  else if(code==="KeyH")debugWeaponLevelReset();
  else if(code==="KeyK")debugCycleBasicWeapon();
  else if(code==="KeyL")debugCycleSpecialWeapon();
}

function getWeaponDebugLines(){
  const wpn=WEAPONS[weaponColor];
  const sp=SPECIALS[specialType]||SPECIALS.laser;
  return [
    wpn.label+"  Nv "+weaponLevel+"  |  ESP: "+sp.label,
    "Debug: J +nivel   H reset   K tiro   L especial"
  ];
}
