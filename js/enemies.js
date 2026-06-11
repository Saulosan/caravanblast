const ENEMY1_FRAME_W=32;
const ENEMY1_FRAME_H=32;
const ENEMY1_FPS=12;
const ENEMY1_ANIMS={
  left:{start:0,count:6},
  center_from_left:{start:6,count:6},
  right:{start:12,count:6},
  center_from_right:{start:18,count:6}
};

const ENEMY_TEMPLATES={
  small:{
    id:"small",
    category:"common",
    spriteKey:"enemy1",
    hp:1,
    points:100,
    medals:1,
    hitColor:"#ffcc66",
    movementPattern:"zigzag",
    shotPattern:"aimed_burst",
    moveSpeed:112
  },
  medA:{
    id:"medA",
    category:"medium",
    spriteKey:"enemy4",
    hp:4,
    points:300,
    medals:2,
    hitColor:"#ffaa00",
    movementPattern:"sine",
    shotPattern:"aimed_plus_straight",
    moveSpeed:105
  },
  medB:{
    id:"medB",
    category:"miniboss",
    spriteKey:"enemy2",
    hp:72,
    points:500,
    medals:4,
    hitColor:"#cc44ff",
    movementPattern:"enter_hover_exit",
    shotPattern:"burst_aimed_ring",
    moveSpeed:100,
    moveSpeedLeave:130
  },
  medC:{
    id:"medC",
    category:"medium",
    spriteKey:"enemy3",
    hp:5,
    points:400,
    medals:2,
    hitColor:"#00ccff",
    movementPattern:"lemniscate",
    shotPattern:"spray_5",
    moveSpeed:65
  }
};

function enemyMoveSpeed(template){
  if(template.moveSpeed!=null)return template.moveSpeed;
  return MOVE_SPEED_DEFAULT[template.movementPattern]||100;
}

function mkSmallFormation(delayBase){
  return [0,1,2,3].map(idx=>({templateId:"small",delay:delayBase+idx*0.5,params:{formSlot:idx}}));
}

function mkMedBWithEscort(delayBase){
  return mkSmallFormation(delayBase).concat([{templateId:"medB",delay:delayBase+2.1}]);
}

const staggeredBursts=[];

function queueStaggeredBurst(x,y,n,spd,interval,track){
  staggeredBursts.push({x,y,n,spd,interval:interval||0.05,idx:0,timer:0,alive:true,track:track||null});
}

function medBShotPointRotated(e,lx,ly){
  const nw=rdy(gc.enemy2)?gc.enemy2.width:142;
  const nh=rdy(gc.enemy2)?gc.enemy2.height:142;
  const scaleX=e.w/nw,scaleY=e.h/nh;
  const ox=(lx-nw/2)*scaleX;
  const oy=(ly-nh/2)*scaleY;
  const rot=e.rot||0;
  const cos=Math.cos(rot),sin=Math.sin(rot);
  const cx=e.x+e.w/2,cy=e.drawY+e.h/2;
  return {x:cx+ox*cos-oy*sin,y:cy+ox*sin+oy*cos};
}

function updStaggeredBursts(dt){
  for(const b of staggeredBursts){
    if(!b.alive)continue;
    b.timer-=dt;
    while(b.timer<=0&&b.idx<b.n){
      let bx=b.x,by=b.y;
      if(b.track){
        const e=b.track.enemy;
        if(!e||(!e.alive&&!(e.kind==="medB"&&e.dead))){
          b.alive=false;
          break;
        }
        const p=medBShotPointRotated(e,b.track.lx,b.track.ly);
        bx=p.x;
        by=p.y;
      }
      const a=(b.idx/b.n)*Math.PI*2;
      mkBul(bx,by,Math.cos(a)*b.spd,Math.sin(a)*b.spd);
      b.idx++;
      b.timer+=b.interval;
    }
    if(b.idx>=b.n)b.alive=false;
  }
  for(let i=staggeredBursts.length-1;i>=0;i--){
    if(!staggeredBursts[i].alive)staggeredBursts.splice(i,1);
  }
}

const WAVE_DEFINITIONS=[
  {id:"w01",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:4.2,enemies:mkSmallFormation(0)},
  {id:"w02",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:4.6,enemies:mkSmallFormation(0)},
  {id:"w03",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:4.8,enemies:[{templateId:"medA",delay:0},{templateId:"medA",delay:0.22}]},
  {id:"w04",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:4.6,enemies:mkSmallFormation(0)},
  {id:"w05",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:6.0,enemies:mkMedBWithEscort(0)},
  {id:"w06",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:4.6,enemies:mkSmallFormation(0)},
  {id:"w07",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:5.0,enemies:[{templateId:"medC",delay:0},{templateId:"medC",delay:0.25},{templateId:"medC",delay:0.50}]},
  {id:"w08",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:4.8,enemies:mkSmallFormation(0)},
  {id:"w09",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:4.6,enemies:mkSmallFormation(0)},
  {id:"w10",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:6.0,enemies:mkMedBWithEscort(0)},
  {id:"w11",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:5.0,enemies:[{templateId:"medA",delay:0},{templateId:"medA",delay:0.22},{templateId:"medA",delay:0.44}]},
  {id:"w12",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:5.0,enemies:mkSmallFormation(0)},
  {id:"w13",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:4.6,enemies:mkSmallFormation(0)},
  {id:"w14",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:6.2,enemies:mkMedBWithEscort(0)},
  {id:"w15",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:5.0,enemies:[{templateId:"medC",delay:0},{templateId:"medC",delay:0.25},{templateId:"medC",delay:0.50}]},
  {id:"w16",nextWaveTrigger:"all_dead_or_timer",nextWaveTimer:4.8,enemies:mkSmallFormation(0)}
];

const waveRuntime={active:null,timer:0,nextSpawnIdx:0};

function resetWaveFlow(){
  waveRuntime.active=null;
  waveRuntime.timer=0;
  waveRuntime.nextSpawnIdx=0;
  waveRuntime.smallFormX=null;
  waveRuntime.smallFormSpeed=null;
  waveRuntime.smallColumnId=null;
}

function mkBul(x,y,vx,vy){const w=sw(gc.bullet,"bullet"),h=sh(gc.bullet,"bullet");G.eBullets.push({x,y,vx,vy,w,h,alive:true,mHits:BULLET_MISSILE_HITS});}
function shootAim(x,y,spd){const a=ang(x,y,G.player.x+G.player.w/2,G.player.y+G.player.h/2);mkBul(x,y,Math.cos(a)*spd,Math.sin(a)*spd);}
function shootSpray(x,y,n,spread,spd){const base=ang(x,y,G.player.x+G.player.w/2,G.player.y+G.player.h/2);for(let i=0;i<n;i++){const a=base-spread/2+(i/(n-1))*spread;mkBul(x,y,Math.cos(a)*spd,Math.sin(a)*spd);}}
function shootRing(x,y,n,spd,offset){const off=offset||0;for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2+off;mkBul(x,y,Math.cos(a)*spd,Math.sin(a)*spd);}}
function shootDown(x,y,spd){mkBul(x,y,0,spd);}

function enemyBounds(e){
  return {x:e.x,y:e.drawY,w:e.w,h:e.h};
}

function spawnRectOverlaps(x,y,w,h,pad){
  const a={x:x-pad,y:y-pad,w:w+pad*2,h:h+pad*2};
  for(const e of G.enemies){
    if(!e.alive&&!(e.kind==="medB"&&e.dead))continue;
    const b=enemyBounds(e);
    b.x-=pad;b.y-=pad;b.w+=pad*2;b.h+=pad*2;
    if(rOvlp(a,b))return true;
  }
  return false;
}

function findClearSpawnPosition(w,h,prefX,prefY,pad){
  pad=pad||14;
  const minX=pad,maxX=VW-w-pad;
  const tryAt=(x,y)=>{
    const cx=clamp(x,minX,maxX);
    if(!spawnRectOverlaps(cx,y,w,h,pad))return {x:cx,y};
    return null;
  };
  if(prefX!=null&&prefY!=null){
    const hit=tryAt(prefX,prefY);
    if(hit)return hit;
  }
  for(let i=0;i<48;i++){
    const hit=tryAt(minX+Math.random()*(maxX-minX),prefY!=null?prefY:(-h-12));
    if(hit)return hit;
  }
  return {x:clamp(prefX!=null?prefX:(VW/2-w/2),minX,maxX),y:prefY!=null?prefY:(-h-12)};
}

function smallEnemyFrameW(){
  return Math.round(ENEMY1_FRAME_W*SCALE.enemy);
}
function smallEnemyFrameH(){
  return Math.round(ENEMY1_FRAME_H*SCALE.enemy);
}

function pickSmallAnimFromPhase(zigT,zigFreq,prevAnim){
  const s=Math.sin(zigT*zigFreq);
  if(s<-0.18)return "left";
  if(s>0.18)return "right";
  if(prevAnim==="left"||prevAnim==="center_from_left")return "center_from_left";
  if(prevAnim==="right"||prevAnim==="center_from_right")return "center_from_right";
  return s<=0?"center_from_left":"center_from_right";
}

function tickSmallAnim(e,dt){
  const animKey=pickSmallAnimFromPhase(e.zigT,e.zigFreq,e.animKey);
  if(animKey!==e.animKey){
    e.animKey=animKey;
    e.animFrame=0;
    e.animTimer=0;
  }
  e.animTimer+=dt;
  const frameDur=1/ENEMY1_FPS;
  const anim=ENEMY1_ANIMS[e.animKey];
  while(e.animTimer>=frameDur){
    e.animTimer-=frameDur;
    e.animFrame=(e.animFrame+1)%anim.count;
  }
}

function getSmallEnemySpriteFrame(e){
  const anim=ENEMY1_ANIMS[e.animKey||"left"];
  return anim.start+(e.animFrame||0);
}

function getOccupiedMedBColumns(){
  const occ=new Set();
  for(const e of G.enemies){
    if(e.templateId!=="medB")continue;
    if(!e.alive&&!(e.dead&&e.deathScale>0.01))continue;
    if(e.columnId)occ.add(e.columnId);
  }
  return occ;
}

function pickPlayColumn(){
  const occ=getOccupiedMedBColumns();
  const free=PLAY_COLUMNS.filter(c=>!occ.has(c.id));
  if(!free.length)return null;
  return free[Math.floor(Math.random()*free.length)];
}

function medBShotPoint(e,sx,sy){
  return medBShotPointRotated(e,sx,sy);
}

function countAliveEnemiesForWave(){
  return G.enemies.filter(e=>e.alive&&!e.dead).length;
}

function canSpawnTemplate(templateId){
  if(templateId!=="medB")return true;
  if(G.enemies.some(e=>e.templateId==="medB"&&e.alive&&!e.dead))return false;
  if(waveRuntime.smallColumnId)return true;
  return pickPlayColumn()!==null;
}

function beginWave(def){
  waveRuntime.active=def;
  waveRuntime.timer=0;
  waveRuntime.nextSpawnIdx=0;
  const hasSmall=def.enemies.some(sp=>sp.templateId==="small");
  if(hasSmall){
    const col=pickPlayColumn()||PLAY_COLUMNS[Math.floor(Math.random()*PLAY_COLUMNS.length)];
    waveRuntime.smallColumnId=col.id;
    waveRuntime.smallFormX=col.cx;
    waveRuntime.smallFormSpeed=enemyMoveSpeed(ENEMY_TEMPLATES.small);
  }else{
    waveRuntime.smallColumnId=null;
    waveRuntime.smallFormX=null;
    waveRuntime.smallFormSpeed=null;
  }
}

function nextWave(){
  if(stage!==0)return;
  const def=WAVE_DEFINITIONS[G.waveIdx%WAVE_DEFINITIONS.length];
  G.waveIdx++;
  beginWave(def);
}

function updWaveFlow(dt){
  if(stage!==0)return;
  if(!waveRuntime.active){
    nextWave();
    return;
  }

  const wv=waveRuntime.active;
  waveRuntime.timer+=dt;

  while(waveRuntime.nextSpawnIdx<wv.enemies.length){
    const spawnDef=wv.enemies[waveRuntime.nextSpawnIdx];
    if(waveRuntime.timer<spawnDef.delay)break;
    if(canSpawnTemplate(spawnDef.templateId)){
      const spawned=spawnEnemyFromTemplate(spawnDef.templateId,waveRuntime.nextSpawnIdx,spawnDef.params||null);
      if(spawned)G.enemies.push(spawned);
    }
    waveRuntime.nextSpawnIdx++;
  }

  const allScheduled=waveRuntime.nextSpawnIdx>=wv.enemies.length;
  if(!allScheduled)return;

  const byTimer=waveRuntime.timer>=wv.nextWaveTimer;
  const byAllDead=countAliveEnemiesForWave()===0;
  const trig=wv.nextWaveTrigger||"all_dead_or_timer";
  const shouldAdvance=(trig==="all_dead_or_timer"&&(byTimer||byAllDead))||(trig==="timer"&&byTimer)||(trig==="all_dead"&&byAllDead);
  if(shouldAdvance)nextWave();
}

function spawnEnemyFromTemplate(templateId,spawnIndex,spawnParams){
  const t=ENEMY_TEMPLATES[templateId];
  if(!t)return null;
  const e={
    templateId:t.id,
    kind:t.id,
    category:t.category,
    movementPattern:t.movementPattern,
    shotPattern:t.shotPattern,
    spriteKey:t.spriteKey,
    hp:t.hp,
    hpMax:t.hp,
    points:t.points,
    medals:t.medals,
    hitColor:t.hitColor,
    alive:true,
    dead:false,
    dying:false,
    hitFlash:0,
    spawnIndex:spawnIndex||0,
    spawnParams:spawnParams||{},
    templateRef:t
  };

  e.moveSpeed=enemyMoveSpeed(t);
  e.moveSpeedLeave=t.moveSpeedLeave!=null?t.moveSpeedLeave:e.moveSpeed;

  if(t.id==="small")initSmall(e);
  else if(t.id==="medA")initMedA(e);
  else if(t.id==="medB"){
    if(!initMedB(e))return null;
  }
  else if(t.id==="medC")initMedC(e);
  return e;
}

function initSmall(e){
  const w=smallEnemyFrameW(),h=smallEnemyFrameH();
  const formX=waveRuntime.smallFormX!=null?waveRuntime.smallFormX:PLAY_COLUMNS[1].cx;
  e.w=w;e.h=h;
  e.pathCenterX=formX;
  e.columnId=waveRuntime.smallColumnId||null;
  e.zigT=0;
  e.zigFreq=1.15+Math.random()*0.35;
  e.zigAmp=32+Math.random()*28;
  e.vy=waveRuntime.smallFormSpeed!=null?waveRuntime.smallFormSpeed:e.moveSpeed;
  e.baseY=-h-16;
  e.x=e.pathCenterX-w/2;
  e.drawY=e.baseY;
  e.animKey="left";
  e.animFrame=0;
  e.animTimer=0;
  e.sTimer=0.55+Math.random()*0.35;
  e.sFired=0;
  e.sMax=2;
}
function initMedA(e){
  const w=sw(gc.enemy4,"enemy4"),h=sh(gc.enemy4,"enemy4");
  const side=Math.random()<0.5?-1:1;
  e.w=w;e.h=h;
  e.side=side;
  e.t=0;
  e.dur=(VW+e.w+80)/e.moveSpeed;
  let baseY=60+Math.random()*200;
  const startX=side===1?VW+40:-w-40;
  for(let i=0;i<48;i++){
    baseY=60+Math.random()*200;
    if(!spawnRectOverlaps(startX,baseY,w,h,16))break;
  }
  e.baseY=baseY;
  e.x=startX;
  e.drawY=baseY;
  e.sTimer=0.8+Math.random()*0.5;e.sFired=0;e.sMax=6;
}
function initMedB(e){
  const w=sw(gc.enemy2,"enemy2"),h=sh(gc.enemy2,"enemy2");
  let col=null;
  if(waveRuntime.smallColumnId){
    col=PLAY_COLUMNS.find(c=>c.id===waveRuntime.smallColumnId)||null;
  }
  if(!col)col=pickPlayColumn();
  if(!col)return false;
  e.w=w;e.h=h;
  e.columnId=col.id;
  e.phase="enter";e.t=0;
  e.x=col.cx-w/2;
  e.y=-h-20;e.drawY=e.y;
  e.targetY=80+Math.random()*140;
  e.deathT=0;e.deathFlashT=0;e.deathRot=0;e.deathScale=1;
  e.iTimer=5.5+Math.random()*2.5;
  e.sTimer=0.25;e.bCnt=0;e.bMax=3;
  e.rot=MEDB_ROT_FACE_PLAYER;
  e.leaveBurstStarted=false;
  return true;
}
function initMedC(e){
  const w=sw(gc.enemy3,"enemy3"),h=sh(gc.enemy3,"enemy3");
  const side=Math.random()<0.5?-1:1;
  const ox=(side===1?(VW*0.62+Math.random()*80):(VW*0.38-Math.random()*80));
  const oy=60+Math.random()*((VH/2)-80);
  const pos=findClearSpawnPosition(w,h,ox,oy,18);
  e.w=w;e.h=h;
  e.side=side;
  e.t=-(e.spawnIndex*0.3);e.ox=pos.x;e.oy=pos.y;e.x=pos.x;e.drawY=pos.y;
  e.scaleIn=0;e.scaleReady=false;e.exiting=false;e.exitScale=1;
  e.sTimer=1.2+Math.random()*0.6;e.lTimer=6+Math.random()*3;
}

function updEnemies(dt){
  for(const e of G.enemies){
    if(!e.alive&&!(e.kind==="medB"&&e.dead))continue;
    if(e.hitFlash>0)e.hitFlash-=dt;
    if(e.movementPattern==="zigzag")updSmall(e,dt);
    else if(e.movementPattern==="sine")updMedA(e,dt);
    else if(e.movementPattern==="enter_hover_exit")updMedB(e,dt);
    else if(e.movementPattern==="lemniscate")updMedC(e,dt);
  }
  G.enemies=G.enemies.filter(e=>e.alive||(e.kind==="medB"&&e.dead&&e.deathScale>0.01));
}
function updSmall(e,dt){
  e.zigT+=dt;
  e.baseY+=e.vy*dt;
  const offset=Math.sin(e.zigT*e.zigFreq)*e.zigAmp;
  e.x=e.pathCenterX-e.w/2+offset;
  e.drawY=e.baseY;
  tickSmallAnim(e,dt);
  if(e.drawY>0.2&&e.drawY<VH-40&&e.sFired<e.sMax){
    e.sTimer-=dt;
    if(e.sTimer<=0){
      shootAim(e.x+e.w/2,e.drawY+e.h/2,160);
      e.sFired++;
      e.sTimer=0.5+Math.random()*0.4;
    }
  }
  if(e.drawY>VH+e.h+20)e.alive=false;
}
function updMedA(e,dt){
  e.t+=dt/e.dur;const t=clamp(e.t,0,1);
  const side=e.side||1;
  const travel=(VW+80)*e.t;
  e.x=side===1?(VW+40-travel):(-e.w-40+travel);
  e.drawY=e.baseY+Math.sin(t*Math.PI*2)*70;
  if(e.t>0.1&&e.t<0.9&&e.sFired<e.sMax){e.sTimer-=dt;if(e.sTimer<=0){shootAim(e.x+e.w/2,e.drawY+e.h/2,180);mkBul(e.x+e.w/2,e.drawY+e.h/2,-50,150);e.sFired++;e.sTimer=0.5+Math.random()*0.35;}}
  if(e.t>=1.05)e.alive=false;
}
function updMedB(e,dt){
  if(e.dead){
    e.dying=true;
    e.deathT+=dt;e.deathFlashT+=dt;e.deathRot+=6*dt;
    e.deathScale=Math.max(0,e.deathScale-dt*0.55);
    if(Math.random()<0.4)expl(e.x+e.w/2+(Math.random()-0.5)*e.w*0.7,e.drawY+e.h/2+(Math.random()-0.5)*e.h*0.7,"#ff2200",true);
    if(e.deathScale<=0.01)e.alive=false;return;
  }
  const aimPt=()=>medBShotPoint(e,MEDB_SHOT_AIM.x,MEDB_SHOT_AIM.y);
  switch(e.phase){
    case"enter":
      e.y+=e.moveSpeed*dt;e.drawY=e.y;
      e.rot=MEDB_ROT_FACE_PLAYER;
      if(e.y>=e.targetY){e.y=e.targetY;e.drawY=e.y;e.phase="idle";e.rot=MEDB_ROT_FACE_PLAYER;}
      break;
    case"idle":
      e.drawY=e.y;e.rot=MEDB_ROT_FACE_PLAYER;
      e.iTimer-=dt;e.sTimer-=dt;
      if(e.sTimer<=0){
        if(e.bCnt<e.bMax){
          const p=aimPt();
          shootAim(p.x,p.y,155);
          e.bCnt++;
          e.sTimer=0.18;
        }else{
          e.bCnt=0;
          e.sTimer=0.6+Math.random()*0.25;
          if(Math.random()<0.45){
            queueStaggeredBurst(0,0,16,105,0.05,{enemy:e,lx:MEDB_SHOT_BURST.x,ly:MEDB_SHOT_BURST.y});
          }
        }
      }
      if(e.iTimer<=0){
        e.phase="leave_rotate";
        e.leaveBurstStarted=false;
        e.leaveRotStart=MEDB_ROT_FACE_PLAYER;
        e.leaveRotTarget=MEDB_ROT_FACE_UP;
        e.leaveRotT=0;
        e.leaveRotDur=0.9;
      }
      break;
    case"leave_rotate":
      e.leaveRotT+=dt;
      const lt=Math.min(1,e.leaveRotT/e.leaveRotDur);
      const ease=lt*lt*(3-2*lt);
      e.rot=e.leaveRotStart+(e.leaveRotTarget-e.leaveRotStart)*ease;
      e.drawY=e.y;
      if(!e.leaveBurstStarted){
        queueStaggeredBurst(0,0,16,135,0.05,{enemy:e,lx:MEDB_SHOT_BURST.x,ly:MEDB_SHOT_BURST.y});
        e.leaveBurstStarted=true;
      }
      if(lt>=1)e.phase="leave_exit";
      break;
    case"leave_exit":
      e.y-=e.moveSpeedLeave*dt;
      e.drawY=e.y;
      if(e.y<-e.h-50)e.alive=false;
      break;
  }
}
function updMedC(e,dt){
  if(!e.scaleReady){e.scaleIn+=dt*2.2;if(e.scaleIn>=1){e.scaleIn=1;e.scaleReady=true;}}
  if(e.exiting){
    e.exitScale=Math.max(0,e.exitScale-dt*2.3);
    e.scaleIn=e.exitScale;
    e.drawY-=e.moveSpeed*0.54*dt;
    if(e.exitScale<=0.02)e.alive=false;
    return;
  }
  e.t+=dt*(e.moveSpeed/65)*0.65;e.lTimer-=dt;
  const a=e.t,den=1+Math.sin(a)*Math.sin(a);
  const dir=e.side||1;
  e.x=e.ox+(dir*VW*0.28*Math.cos(a))/den;e.drawY=e.oy+(VW*0.14*Math.sin(a)*Math.cos(a))/den;
  if(e.scaleReady){e.sTimer-=dt;if(e.sTimer<=0){shootSpray(e.x+e.w/2,e.drawY+e.h/2,5,Math.PI*0.5,150);e.sTimer=1.2+Math.random()*0.6;}}
  if(e.lTimer<=0)e.exiting=true;
}

function killEnemy(e){
  const cx=e.x+e.w/2,cy=e.drawY+e.h/2;
  if(e.kind==="medB"){e.dead=true;e.alive=true;e.dying=true;e.deathT=0;e.deathFlashT=0;e.deathRot=0;e.deathScale=1;}
  else e.alive=false;
  expl(cx,cy,e.hitColor,true);onEnemyKilled(e.points);spawnMedal(cx,cy,e.medals);
}
function expl(x,y,col,withSfx){
  if(withSfx)playExplosionSfx();
  G.expl.push({x,y,r:4,mr:28,r2:2,mr2:16,life:.32,ml:.32,col:col||"#ffb347"});
  const n=5+Math.floor(Math.random()*4);
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2;
    const sp=70+Math.random()*170;
    G.debris.push({
      x,y,
      vx:Math.cos(a)*sp,
      vy:Math.sin(a)*sp-40,
      s:2+Math.random()*3,
      rot:Math.random()*Math.PI*2,
      vr:(Math.random()-0.5)*6,
      life:0.35+Math.random()*0.35,
      col:Math.random()<0.45?"#ffffff":(col||"#ffb347"),
      alive:true
    });
  }
}

// Partículas de faísca (muzzle + hit) — sem sprites
function spawnSparkBurst(x,y,col,opt){
  opt=opt||{};
  const n=opt.n||6;
  const life=opt.life||0.16;
  const spdMin=opt.speedMin||40;
  const spdMax=opt.speedMax||120;
  const down=opt.downBias!=null?opt.downBias:20;
  const szMin=opt.sizeMin!=null?opt.sizeMin:2;
  const szMax=opt.sizeMax!=null?opt.sizeMax:5;
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2;
    const sp=spdMin+Math.random()*(spdMax-spdMin);
    G.sparks.push({
      x,y,
      vx:Math.cos(a)*sp,
      vy:Math.sin(a)*sp+down*(0.35+Math.random()*0.65),
      life:life*(0.65+Math.random()*0.55),
      ml:life,
      size:szMin+Math.random()*(szMax-szMin),
      col:col||"#fff",
      kind:opt.kind||"hit"
    });
  }
}

function updSparks(dt){
  for(const s of G.sparks){
    s.life-=dt;
    s.x+=s.vx*dt;
    s.y+=s.vy*dt;
    s.vx*=Math.max(0,1-dt*10);
    s.vy*=Math.max(0,1-dt*10);
  }
  G.sparks=G.sparks.filter(s=>s.life>0);
}
