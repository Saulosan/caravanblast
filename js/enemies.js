const WAVES=[
  {t:"small",n:3},{t:"small",n:5},{t:"medA",n:2},{t:"small",n:3},
  {t:"medB",n:1},{t:"small",n:5},{t:"medC",n:3},{t:"medA",n:2},
  {t:"small",n:3},{t:"medB",n:1},{t:"medA",n:3},{t:"medC",n:3},
  {t:"small",n:5},{t:"medB",n:2},{t:"medC",n:3},{t:"medA",n:2},
];
function countMedB(){return G.enemies.filter(e=>e.kind==="medB"&&e.alive&&!e.dead).length;}
function nextWave(){
  if(stage!==0)return;
  const w=WAVES[G.waveIdx%WAVES.length];G.waveIdx++;
  for(let i=0;i<w.n;i++){
    const off=i*(w.t==="small"?0.15:0.22);
    if(w.t==="small")G.enemies.push(mkSmall(off));
    else if(w.t==="medA")G.enemies.push(mkMedA(off));
    else if(w.t==="medB"){if(countMedB()<2)G.enemies.push(mkMedB(off));}
    else if(w.t==="medC")G.enemies.push(mkMedC(off,i));
  }
}

function mkSmall(tOff){
  const w=sw(gc.enemy,"enemy"),h=sh(gc.enemy,"enemy");
  const startX=40+Math.random()*(VW-80),goRight=startX<VW/2;
  const endX=goRight?VW+80:-80,endY=120+Math.random()*280;
  const cpX=goRight?startX+VW*0.6:startX-VW*0.6,cpY=endY*0.5;
  return{kind:"small",t:0,dur:4.2+Math.random()*1.2,startX,startY:-h-10,endX,endY,cpX,cpY,
    x:startX,drawY:-h-10,w,h,hp:1,hpMax:1,alive:true,hitFlash:0,sTimer:0.5+Math.random()*0.4,sFired:0,sMax:3};
}
function mkMedA(tOff){
  const w=sw(gc.enemy4,"enemy4"),h=sh(gc.enemy4,"enemy4");
  const baseY=60+Math.random()*200;
  return{kind:"medA",t:-tOff,dur:4.5+Math.random()*0.8,baseY,x:VW+40,drawY:baseY,w,h,
    hp:4,hpMax:4,alive:true,hitFlash:0,sTimer:0.8+Math.random()*0.5,sFired:0,sMax:6};
}
function mkMedB(tOff){
  const w=sw(gc.enemy2,"enemy2"),h=sh(gc.enemy2,"enemy2");
  const existing=G.enemies.filter(e=>e.kind==="medB"&&e.alive);
  let bestX=80+Math.random()*(VW-200);
  for(let a=0;a<20;a++){const c=80+Math.random()*(VW-200);if(!existing.some(e=>Math.abs(e.x-c)<160)){bestX=c;break;}}
  return{kind:"medB",phase:"enter",t:-tOff,x:bestX,y:-60,drawY:-60,w,h,
    targetY:80+Math.random()*140,hp:36,hpMax:36,alive:true,hitFlash:0,
    dead:false,deathT:0,deathFlashT:0,deathRot:0,deathScale:1,
    iTimer:3.5+Math.random()*2,sTimer:0.25,bCnt:0,bMax:3,rot:0,rotSpd:0.8+Math.random()*0.5};
}
function mkMedC(tOff,i){
  const w=sw(gc.enemy3,"enemy3"),h=sh(gc.enemy3,"enemy3");
  const ox=60+Math.random()*(VW-120),oy=60+Math.random()*((VH/2)-80);
  return{kind:"medC",t:-(i*0.3),ox,oy,x:ox,drawY:oy,w,h,
    scaleIn:0,scaleReady:false,
    hp:5,hpMax:5,alive:true,hitFlash:0,sTimer:1.2+Math.random()*0.6,lTimer:6+Math.random()*3};
}

function mkBul(x,y,vx,vy){const w=sw(gc.bullet,"bullet"),h=sh(gc.bullet,"bullet");G.eBullets.push({x,y,vx,vy,w,h,alive:true});}
function shootAim(x,y,spd){const a=ang(x,y,G.player.x+G.player.w/2,G.player.y+G.player.h/2);mkBul(x,y,Math.cos(a)*spd,Math.sin(a)*spd);}
function shootSpray(x,y,n,spread,spd){const base=ang(x,y,G.player.x+G.player.w/2,G.player.y+G.player.h/2);for(let i=0;i<n;i++){const a=base-spread/2+(i/(n-1))*spread;mkBul(x,y,Math.cos(a)*spd,Math.sin(a)*spd);}}
function shootRing(x,y,n,spd,offset){const off=offset||0;for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2+off;mkBul(x,y,Math.cos(a)*spd,Math.sin(a)*spd);}}
function shootDown(x,y,spd){mkBul(x,y,0,spd);}

function updEnemies(dt){
  for(const e of G.enemies){
    if(!e.alive&&!(e.kind==="medB"&&e.dead))continue;
    if(e.hitFlash>0)e.hitFlash-=dt;
    if(e.kind==="small")updSmall(e,dt);
    else if(e.kind==="medA")updMedA(e,dt);
    else if(e.kind==="medB")updMedB(e,dt);
    else if(e.kind==="medC")updMedC(e,dt);
  }
  G.enemies=G.enemies.filter(e=>e.alive||(e.kind==="medB"&&e.dead&&e.deathScale>0.01));
}
function updSmall(e,dt){
  e.t+=dt/e.dur;const t=clamp(e.t,0,1);const mt=1-t;
  e.x=mt*mt*e.startX+2*mt*t*e.cpX+t*t*e.endX;
  e.drawY=mt*mt*e.startY+2*mt*t*e.cpY+t*t*e.endY;
  if(t>0.15&&t<0.85&&e.sFired<e.sMax){e.sTimer-=dt;if(e.sTimer<=0){shootAim(e.x+e.w/2,e.drawY+e.h/2,160);e.sFired++;e.sTimer=0.5+Math.random()*0.4;}}
  if(t>=1.0)e.alive=false;
}
function updMedA(e,dt){
  e.t+=dt/e.dur;const t=clamp(e.t,0,1);
  e.x=VW+40-(VW+80)*e.t;e.drawY=e.baseY+Math.sin(t*Math.PI*2)*70;
  if(e.t>0.1&&e.t<0.9&&e.sFired<e.sMax){e.sTimer-=dt;if(e.sTimer<=0){shootAim(e.x+e.w/2,e.drawY+e.h/2,180);mkBul(e.x+e.w/2,e.drawY+e.h/2,-50,150);e.sFired++;e.sTimer=0.5+Math.random()*0.35;}}
  if(e.t>=1.05)e.alive=false;
}
function updMedB(e,dt){
  if(e.dead){
    e.deathT+=dt;e.deathFlashT+=dt;e.deathRot+=6*dt;
    e.deathScale=Math.max(0,e.deathScale-dt*0.55);
    if(Math.random()<0.4)expl(e.x+e.w/2+(Math.random()-0.5)*e.w*0.7,e.drawY+e.h/2+(Math.random()-0.5)*e.h*0.7,"#ff2200");
    if(e.deathScale<=0.01)e.alive=false;return;
  }
  e.rot+=e.rotSpd*dt;const cx=e.x+e.w/2,cy=e.drawY+e.h/2;
  switch(e.phase){
    case"enter":e.y+=100*dt;e.drawY=e.y;if(e.y>=e.targetY){e.y=e.targetY;e.drawY=e.y;e.phase="idle";}break;
    case"idle":
      e.drawY=e.y;e.iTimer-=dt;e.sTimer-=dt;
      if(e.sTimer<=0){if(e.bCnt<e.bMax){shootAim(cx,cy,155);e.bCnt++;e.sTimer=0.18;}else{e.bCnt=0;e.sTimer=0.6+Math.random()*0.25;if(Math.random()<0.45)shootRing(cx,cy,8,105);}}
      if(e.iTimer<=0)e.phase="leave";break;
    case"leave":e.y-=110*dt;e.drawY=e.y;if(e.y<-70)e.alive=false;break;
  }
}
function updMedC(e,dt){
  if(!e.scaleReady){e.scaleIn+=dt*2.2;if(e.scaleIn>=1){e.scaleIn=1;e.scaleReady=true;}}
  e.t+=dt*0.65;e.lTimer-=dt;
  const a=e.t,den=1+Math.sin(a)*Math.sin(a);
  e.x=e.ox+(VW*0.28*Math.cos(a))/den;e.drawY=e.oy+(VW*0.14*Math.sin(a)*Math.cos(a))/den;
  if(e.scaleReady){e.sTimer-=dt;if(e.sTimer<=0){shootSpray(e.x+e.w/2,e.drawY+e.h/2,5,Math.PI*0.5,150);e.sTimer=1.2+Math.random()*0.6;}}
  if(e.lTimer<=0)e.alive=false;
}

function killEnemy(e){
  const cx=e.x+e.w/2,cy=e.drawY+e.h/2;
  const medals_n=e.kind==="small"?1:e.kind==="medA"?2:e.kind==="medB"?4:2;
  const pts=e.kind==="small"?100:e.kind==="medA"?300:e.kind==="medB"?500:400;
  const col=e.kind==="small"?"#ffcc66":e.kind==="medA"?"#ffaa00":e.kind==="medB"?"#cc44ff":"#00ccff";
  if(e.kind==="medB"){e.dead=true;e.alive=true;e.deathT=0;e.deathFlashT=0;e.deathRot=0;e.deathScale=1;}
  else e.alive=false;
  expl(cx,cy,col);onEnemyKilled(pts);spawnMedal(cx,cy,medals_n);
}
function expl(x,y,col){G.expl.push({x,y,r:4,mr:28,r2:2,mr2:16,life:.32,ml:.32,col:col||"#ffb347"});}
