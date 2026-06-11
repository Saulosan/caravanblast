function doBossSkip(clearEnemies){
  if(clearEnemies!==false){
    G.enemies=[];
    G.eBullets=[];
  }
  stage=1;
}

function bossNatToScreen(b,sx,sy){
  const nw=rdy(gc.boss)?gc.boss.width:440;
  const nh=rdy(gc.boss)?gc.boss.height:400;
  const scaleX=b.w/nw,scaleY=b.h/nh;
  return {x:b.x+sx*scaleX,y:b.y+sy*scaleY};
}

function getBossHitboxes(b){
  const nw=rdy(gc.boss)?gc.boss.width:440;
  const nh=rdy(gc.boss)?gc.boss.height:400;
  const sx=b.w/nw,sy=b.h/nh;
  return BOSS_HITBOXES_NAT.map(h=>({
    x:b.x+h.x*sx,y:b.y+h.y*sy,w:h.w*sx,h:h.h*sy
  }));
}

function bossShotSpot(b,idx){
  const s=BOSS_SHOT_SPOTS[idx%BOSS_SHOT_SPOTS.length];
  return bossNatToScreen(b,s.x,s.y);
}

function bossBurstSpot(b,idx){
  const s=BOSS_BURST_SPOTS[idx%BOSS_BURST_SPOTS.length];
  return bossNatToScreen(b,s.x,s.y);
}

function bossLaserHitsPlayer(b,bw,bh){
  if(!b.laserActive||G.player.inv>0||invincible||flgPlayerControl===0)return false;
  const px=G.player.x+G.player.w/2,py=G.player.y+G.player.h/2;
  const cx=b.x+bw/2,cy=b.y+bh/2;
  const dx=px-cx,dy=py-cy;
  const rot=b.displayRot||0;
  const cos=Math.cos(-rot),sin=Math.sin(-rot);
  const lx=dx*cos-dy*sin;
  const ly=dx*sin+dy*cos;
  const emitY=bh*0.12;
  const halfW=b.enraged?24:20;
  return ly>emitY&&Math.abs(lx)<halfW;
}

function bossMouthWorld(b){
  const bw=b.w,bh=b.h;
  const cx=b.x+bw/2,cy=b.y+bh/2;
  const rot=b.displayRot||0;
  const lx=0,ly=bh*BOSS_MOUTH_Y_FRAC;
  const cos=Math.cos(rot),sin=Math.sin(rot);
  return {x:cx+lx*cos-ly*sin,y:cy+lx*sin+ly*cos};
}

function startBossLaserLinger(){
  const b=G.boss;
  if(!b||(!b.laserActive&&!b.laserCharging))return;
  b.laserLingerT=BOSS_LASER_DEATH_LINGER;
}

function stopBossLaser(force){
  const b=G.boss;
  if(!b)return;
  if(!force&&b.laserLingerT>0)return;
  b.laserLingerT=0;
  b.laserActive=false;
  b.laserCharging=false;
  b.laserTimer=0;
  b.laserVx=0;
  b.laserSweepT=null;
  b.laserChargeT=0;
  b.chargeOrbs=[];
  b.displayRot=0;
  b.cyclePhase="cannon";
  b.cycleTimer=0;
  b.cannonIdx=0;
  b.cannonTimer=1.5;
  b.diamondTimer=0.5;
  b.shotSpotIdx=0;
}

function spawnBossChargeOrb(b){
  const mouth=bossMouthWorld(b);
  const ang=Math.random()*Math.PI*2;
  const dist=36+Math.random()*72;
  if(!b.chargeOrbs)b.chargeOrbs=[];
  b.chargeOrbs.push({
    x:mouth.x+Math.cos(ang)*dist,
    y:mouth.y+Math.sin(ang)*dist,
    vx:(Math.random()-0.5)*18,
    vy:(Math.random()-0.5)*18,
    r:2.5+Math.random()*5.5,
    t:0,
    alive:true
  });
}

function updBossLaserCharge(b,dt){
  b.laserChargeT=(b.laserChargeT||0)+dt;
  b.chargeOrbTimer=(b.chargeOrbTimer||0)-dt;
  while(b.chargeOrbTimer<=0){
    spawnBossChargeOrb(b);
    b.chargeOrbTimer=BOSS_LASER_CHARGE_ORB_INTERVAL*(0.75+Math.random()*0.5);
  }
  const mouth=bossMouthWorld(b);
  for(const o of b.chargeOrbs){
    if(!o.alive)continue;
    const dx=mouth.x-o.x,dy=mouth.y-o.y;
    const d=Math.hypot(dx,dy)||1;
    const pull=140+360*clamp(o.t/0.9,0,1);
    o.vx+=dx/d*pull*dt;
    o.vy+=dy/d*pull*dt;
    o.vx*=0.9;
    o.vy*=0.9;
    o.x+=o.vx*dt;
    o.y+=o.vy*dt;
    o.t+=dt;
    if(d<o.r+6)o.alive=false;
  }
  b.chargeOrbs=b.chargeOrbs.filter(o=>o.alive);
  if(b.laserChargeT>=BOSS_LASER_CHARGE_DUR){
    b.laserCharging=false;
    b.laserActive=true;
    b.laserTimer=5.0;
    b.chargeOrbs=[];
    if(b.enraged){
      b.laserSweepT=0;
      b.displayRot=0;
    }else{
      b.laserVx=b.mDir*25;
      b.laserSweepT=null;
    }
    b.cyclePhase="laser";
  }
}

function bossLaserEase(p){
  return p*p*(3-2*p);
}

function updBossEnragedLaser(b,dt,bw,bh){
  b.laserSweepT=(b.laserSweepT||0)+dt;
  const t=b.laserSweepT;
  const w1=BOSS_LASER_WIND_D;
  const w2=w1+BOSS_LASER_SWEEP_D;
  const w3=w2+BOSS_LASER_RET_D;

  if(t<w1){
    b.displayRot=BOSS_LASER_ANG_L*bossLaserEase(t/w1);
  }else if(t<w2){
    const p=bossLaserEase((t-w1)/BOSS_LASER_SWEEP_D);
    b.displayRot=BOSS_LASER_ANG_L+(BOSS_LASER_ANG_R-BOSS_LASER_ANG_L)*p;
  }else if(t<w3){
    const p=bossLaserEase((t-w2)/BOSS_LASER_RET_D);
    b.displayRot=BOSS_LASER_ANG_R+(0-BOSS_LASER_ANG_R)*p;
  }else{
    b.laserActive=false;
    b.laserSweepT=null;
    b.displayRot=0;
    b.cyclePhase="cannon";
    b.cycleTimer=0;
    b.cannonIdx=0;
    b.cannonTimer=0.9;
    b.diamondTimer=0.5;
    b.shotSpotIdx=0;
    return;
  }
  if(bossLaserHitsPlayer(b,bw,bh))dmgPlayer();
}

function spawnBoss(){
  const bw=sw(gc.boss,"boss"),bh=sh(gc.boss,"boss");
  const startY=VH+bh+20;
  G.boss={x:VW/2-bw/2,y:startY,w:bw,h:bh,hp:1000,hpMax:1000,alive:true,
    entering:true,
    entryStartY:startY,
    entryScale:6.0,
    entryRot:Math.PI,
    entrySpeed:180,
    targetY:20,
    hitFlash:0,deathFlashT:0,vx:0,mDir:1,mT:0,baseY:20,yOffset:0,yTarget:0,yTimer:0,
    cannonIdx:0,cannonTimer:99,diamondTimer:0,shotSpotIdx:0,
    laserActive:false,laserCharging:false,laserTimer:0,laserVx:0,laserSweepT:null,
    laserChargeT:0,chargeOrbs:[],chargeOrbTimer:0,laserLingerT:0,
    displayRot:0,
    enraged:false,
    cycleTimer:0,cyclePhase:"cannon",dead:false,lastMedalHp:1000};
  document.getElementById("boss-hp-wrap").style.display="block";
}

function updBoss(dt){
  const b=G.boss;if(!b)return;

  if(b.laserLingerT>0){
    b.laserLingerT-=dt;
    if(b.laserLingerT<=0)stopBossLaser(true);
    return;
  }

  if(b.dead){
    bossDeathT+=dt;b.deathFlashT+=dt;

    if(bossDeathPhase==="dying"){
      bossDeathRot+=0.6*dt;
      bossDeathScale=Math.max(0.6,bossDeathScale-dt*0.06);
      b.deathExplCD=(b.deathExplCD||0)-dt;
      if(b.deathExplCD<=0){
        b.deathExplCD=0.28+Math.random()*0.10;
        const ox=(Math.random()-0.5)*b.w*bossDeathScale*0.8;
        const oy=(Math.random()-0.5)*b.h*bossDeathScale*0.8;
        expl(VW/2+ox,b.y+b.h/2+oy,Math.random()<0.5?"#ff2200":"#ffcc00",true);
      }
      if(bossDeathT>=5.0){
        bossDeathPhase="nova";
        bossNova=0;
        bossNovaStartScale=bossDeathScale;
        playExplosionFinalSfx();
        screenFlash=1.0;
      }
    } else if(bossDeathPhase==="nova"){
      bossNova+=VW*1.6*dt;
      if(bossNova>=VW*1.2){
        bossDeathPhase="flash";
        bossDeathT=0;
      }
    } else if(bossDeathPhase==="flash"){
      bossDeathT+=dt;
      if(bossDeathT>=0.15){
        G.boss=null;
        stage=4;
        document.getElementById("boss-hp-wrap").style.display="none";
        bgSpeedTarget=1;
        beginScreenTransition(()=>{appState="win";});
      }
    }
    return;
  }

  if(b.hitFlash>0)b.hitFlash-=dt;
  b.deathFlashT=0;

  if(!b.enraged&&b.hp<=b.hpMax*0.5){
    b.enraged=true;
    b.cannonTimer=Math.min(b.cannonTimer,0.5);
  }

  const pace=b.enraged?0.62:1;

  if(b.entering){
    b.y-=b.entrySpeed*dt;
    const totalDist=b.entryStartY-b.targetY;
    const traveled=b.entryStartY-b.y;
    const prog=clamp(traveled/totalDist,0,1);
    b.entryScale=6.0-(5.0*prog);
    b.entryRot=Math.PI*(1-prog);
    if(b.y<=b.targetY){
      b.y=b.targetY;
      b.entryScale=1.0;
      b.entryRot=0;
      b.entering=false;
      b.baseY=b.targetY;
      b.displayRot=0;
      b.cannonTimer=2;
    }
    return;
  }

  if(b.laserCharging){
    updBossLaserCharge(b,dt);
  }else if(b.laserActive){
    const bw=b.w,bh=b.h;
    if(b.enraged){
      updBossEnragedLaser(b,dt,bw,bh);
    }else{
      b.displayRot=0;
      b.laserVx=clamp(b.laserVx+(b.mDir*180*dt),-160,160);
      if(b.x<=10||b.x>=VW-b.w-10){b.mDir=-b.mDir;b.laserVx*=-1;}
      b.x=clamp(b.x+b.laserVx*dt,10,VW-b.w-10);
      b.laserTimer-=dt;
      if(bossLaserHitsPlayer(b,bw,bh))dmgPlayer();
      if(b.laserTimer<=0){
        b.laserActive=false;
        b.laserVx=0;
        b.cyclePhase="cannon";
        b.cycleTimer=0;
        b.cannonIdx=0;
        b.cannonTimer=1.5;
        b.diamondTimer=0.5;
        b.shotSpotIdx=0;
      }
    }
  }else if(!b.laserCharging){
    b.displayRot=0;
    b.laserSweepT=null;
    b.mT-=dt;
    if(b.mT<=0){b.vx=b.mDir*(22+Math.random()*18);b.mDir=-b.mDir;b.mT=(b.enraged?1.1:1.8)+Math.random()*(b.enraged?0.8:1.2);}
    b.x=clamp(b.x+b.vx*dt,10,VW-b.w-10);
  }

  if(!b.laserActive&&!b.laserCharging){
    b.yTimer-=dt;
    if(b.yTimer<=0){b.yTarget=(Math.random()-0.5)*70;b.yTimer=(b.enraged?1.6:2.5)+Math.random()*(b.enraged?1.2:2.5);}
    b.yOffset+=(b.yTarget-b.yOffset)*1.2*dt;
    b.y=b.baseY+b.yOffset;
  }else if(!b.laserActive||!b.enraged){
    b.yTimer-=dt;
    if(b.yTimer<=0){b.yTarget=(Math.random()-0.5)*70;b.yTimer=2.5+Math.random()*2.5;}
    b.yOffset+=(b.yTarget-b.yOffset)*1.2*dt;
    b.y=b.baseY+b.yOffset;
  }

  const milestone=Math.floor(b.hp/50)*50;
  if(milestone<b.lastMedalHp&&b.hp>0){b.lastMedalHp=milestone;spawnMedal(b.x+b.w/2,b.y+b.h/2,2);}

  if(b.cyclePhase==="cannon"&&!b.laserActive&&!b.laserCharging){
    b.cycleTimer+=dt;
    b.diamondTimer-=dt;
    if(b.diamondTimer<=0){
      const spot=bossShotSpot(b,b.shotSpotIdx);
      shootDown(spot.x,spot.y,80+Math.random()*60);
      b.shotSpotIdx=(b.shotSpotIdx+1)%BOSS_SHOT_SPOTS.length;
      b.diamondTimer=(b.enraged?0.75:1.1)+Math.random()*0.45;
    }
    b.cannonTimer-=dt*pace;
    if(b.cannonTimer<=0&&b.cannonIdx<BOSS_BURST_SPOTS.length){
      const spot=bossBurstSpot(b,b.cannonIdx);
      queueStaggeredBurst(spot.x,spot.y,16,185,0.05);
      b.cannonIdx++;
      b.cannonTimer=(b.enraged?0.75:1.2);
    }
    const cycleEnd=(b.enraged?3.2:5.2)+b.cannonIdx*1.2;
    if(b.cannonIdx>=BOSS_BURST_SPOTS.length&&b.cycleTimer>=cycleEnd){
      b.laserCharging=true;
      b.laserChargeT=0;
      b.chargeOrbTimer=0;
      b.chargeOrbs=[];
      b.cyclePhase="laserCharge";
    }
  }

  if(b.hp<=0&&!b.dead){
    b.dead=true;b.alive=false;
    bossDeathPhase="dying";bossDeathT=0;bossDeathRot=0;bossDeathScale=1.0;bossNovaStartScale=1.0;bossNova=0;
    b.deathExplCD=0;
    startBossBGMFade();
    score+=80000*comboX*(maxComboBonusActive?2:1);
    if(comboX>=20){
      maxComboBonusActive=true;
      maxComboBonusT=MAX_COMBO_BONUS_DUR;
      screenFlash=Math.max(screenFlash,0.85);
    } else {
      comboX=Math.min(20,comboX*2);
    }
    comboBossLock=false;
    spawnMedal(b.x+b.w/2,b.y+b.h/2,10);
    document.getElementById("boss-hp-wrap").style.display="none";
  }
  document.getElementById("ui-bosshp").textContent=Math.max(0,Math.ceil(b.hp));
}

function hitBoss(s){
  const b=G.boss;if(!b||b.dead||b.entering)return false;
  const lw=rdy(gc.laser)?gc.laser.width*SCALE.laser:16;
  const sr=s.type==="shot"?{x:s.x,y:s.y,w:s.w,h:s.h}:{x:s.px+s.pw/2-lw/2,y:0,w:lw,h:s.py};
  const boxes=getBossHitboxes(b);
  let hit=false;
  for(const hb of boxes){
    if(rOvlp(sr,hb)){hit=true;break;}
  }
  if(!hit)return false;
  b.hp=Math.max(0,b.hp-(s.type==="laser"?1.2:1));
  b.hitFlash=0.10;
  if(s.type==="shot")s.alive=false;
  return true;
}
