function doBossSkip(){G.enemies=[];G.eBullets=[];stage=1;}

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
    cannonIdx:0,cannonTimer:99,diamondTimer:0,
    laserActive:false,laserTimer:0,laserVx:0,
    cycleTimer:0,cyclePhase:"cannon",dead:false,lastMedalHp:1000};
  document.getElementById("boss-hp-wrap").style.display="block";
}

function updBoss(dt){
  const b=G.boss;if(!b)return;

  if(b.dead){
    bossDeathT+=dt;b.deathFlashT+=dt;

    if(bossDeathPhase==="dying"){
      bossDeathRot+=0.6*dt;
      bossDeathScale=Math.max(0.6,bossDeathScale-dt*0.06);
      if(Math.random()<0.55){
        const ox=(Math.random()-0.5)*b.w*bossDeathScale*0.8;
        const oy=(Math.random()-0.5)*b.h*bossDeathScale*0.8;
        expl(VW/2+ox,b.y+b.h/2+oy,Math.random()<0.5?"#ff2200":"#ffcc00");
      }
      if(bossDeathT>=5.0){
        bossDeathPhase="nova";
        bossNova=0;
        bossNovaStartScale=bossDeathScale;
      }
    }

    else if(bossDeathPhase==="nova"){
      bossNova+=VW*1.6*dt;
      if(bossNova>=VW*1.2){
        screenFlash=1.0;
        bossDeathPhase="flash";
        bossDeathT=0;
      }
    }

    else if(bossDeathPhase==="flash"){
      bossDeathT+=dt;
      if(bossDeathT>=0.15){
        G.boss=null;
        stage=4;
        document.getElementById("boss-hp-wrap").style.display="none";
        bgSpeedTarget=1;
        stopBGM();
        appState="win";
      }
    }

    return;
  }

  if(b.hitFlash>0)b.hitFlash-=dt;
  b.deathFlashT=0;

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
      b.cannonTimer=2;
    }
    return;
  }

  if(b.laserActive){
    b.laserVx=clamp(b.laserVx+(b.mDir*180*dt),-160,160);
    if(b.x<=10||b.x>=VW-b.w-10){b.mDir=-b.mDir;b.laserVx*=-1;}
    b.x=clamp(b.x+b.laserVx*dt,10,VW-b.w-10);
  } else {
    b.mT-=dt;if(b.mT<=0){b.vx=b.mDir*(22+Math.random()*18);b.mDir=-b.mDir;b.mT=1.8+Math.random()*1.2;}
    b.x=clamp(b.x+b.vx*dt,10,VW-b.w-10);
  }
  b.yTimer-=dt;if(b.yTimer<=0){b.yTarget=(Math.random()-0.5)*70;b.yTimer=2.5+Math.random()*2.5;}
  b.yOffset+=(b.yTarget-b.yOffset)*1.2*dt;b.y=b.baseY+b.yOffset;

  const milestone=Math.floor(b.hp/50)*50;
  if(milestone<b.lastMedalHp&&b.hp>0){b.lastMedalHp=milestone;spawnMedal(b.x+b.w/2,b.y+b.h/2,2);}

  const bx=b.x,by=b.y,bw2=b.w,bh2=b.h;
  const cannons=[{x:bx+bw2*.22,y:by+bh2*.12},{x:bx+bw2*.78,y:by+bh2*.12},{x:bx+bw2*.18,y:by+bh2*.62},{x:bx+bw2*.82,y:by+bh2*.62}];
  const diamonds=[{x:bx+bw2*.38,y:by+bh2*.32},{x:bx+bw2*.62,y:by+bh2*.32},{x:bx+bw2*.38,y:by+bh2*.68},{x:bx+bw2*.62,y:by+bh2*.68}];

  if(b.cyclePhase==="cannon"){
    b.cycleTimer+=dt;b.diamondTimer-=dt;
    if(b.diamondTimer<=0){for(const d of diamonds)shootDown(d.x,d.y,80+Math.random()*60);b.diamondTimer=1.1+Math.random()*0.5;}
    b.cannonTimer-=dt;
    if(b.cannonTimer<=0&&b.cannonIdx<4){
      const c=cannons[b.cannonIdx];shootRing(c.x,c.y,6,185,0);
      setTimeout(()=>{if(!b||b.dead)return;shootRing(c.x,c.y,6,185,Math.PI/6);},350);
      b.cannonIdx++;b.cannonTimer=1.2;
    }
    if(b.cannonIdx>=4&&b.cycleTimer>=b.cannonIdx*1.2+2){b.laserActive=true;b.laserTimer=5.0;b.laserVx=b.mDir*25;b.cyclePhase="laser";}
  } else {
    b.laserTimer-=dt;
    const lx=b.x+b.w/2,p=G.player;
    if(p.inv<=0&&!invincible&&Math.abs(p.x+p.w/2-lx)<20)dmgPlayer();
    if(b.laserTimer<=0){b.laserActive=false;b.laserVx=0;b.cyclePhase="cannon";b.cycleTimer=0;b.cannonIdx=0;b.cannonTimer=1.5;b.diamondTimer=0.5;}
  }

  if(b.hp<=0&&!b.dead){
    b.dead=true;b.alive=false;
    bossDeathPhase="dying";bossDeathT=0;bossDeathRot=0;bossDeathScale=1.0;bossNovaStartScale=1.0;bossNova=0;
    comboBossLock=false;score+=80000*comboX;
    spawnMedal(b.x+b.w/2,b.y+b.h/2,10);
    document.getElementById("boss-hp-wrap").style.display="none";bgSpeedTarget=1;stopBGM();
  }
  document.getElementById("ui-bosshp").textContent=Math.max(0,Math.ceil(b.hp));
}

function hitBoss(s){
  const b=G.boss;if(!b||b.dead||b.entering)return false;
  const lw=rdy(gc.laser)?gc.laser.width*SCALE.laser:16;
  const sr=s.type==="shot"?{x:s.x,y:s.y,w:s.w,h:s.h}:{x:s.px+s.pw/2-lw/2,y:0,w:lw,h:s.py};
  if(!rOvlp(sr,{x:b.x,y:b.y,w:b.w,h:b.h}))return false;
  b.hp=Math.max(0,b.hp-(s.type==="laser"?1.2:1));b.hitFlash=0.10;
  if(s.type==="shot")s.alive=false;return true;
}