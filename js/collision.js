function laserMetrics(s){
  const baseW=rdy(gc.laser)?gc.laser.width*SCALE.laser:16;
  const baseH=rdy(gc.laser)?gc.laser.height*SCALE.laser:16;
  const lW=Math.round(baseW*2);
  const lH=Math.round(baseH*2);
  const startY=Math.round(s.py+20);
  const px=s.px+s.pw/2;
  const laserX=Math.round(px-lW/2);
  return {lW,lH,laserX,startY,px,baseW};
}

function beamHOverlap(bx,bw,rx,rw){
  return bx<rx+rw&&bx+bw>rx;
}

function resolveLaserBlock(s){
  const m=laserMetrics(s);
  let clipY=m.startY;
  let blocker=null;
  let bestBottom=-1;

  for(const e of G.enemies){
    if(!e.alive||e.dead)continue;
    const bottom=e.drawY+e.h;
    if(bottom<=0||e.drawY>=m.startY)continue;
    if(!beamHOverlap(m.laserX,m.lW,e.x,e.w))continue;
    if(bottom<=bestBottom)continue;
    bestBottom=bottom;
    clipY=bottom;
    blocker={type:"enemy",ref:e};
  }

  if(G.boss&&!G.boss.dead&&!G.boss.entering){
    for(const hb of getBossHitboxes(G.boss)){
      const bottom=hb.y+hb.h;
      if(bottom<=0||hb.y>=m.startY)continue;
      if(!beamHOverlap(m.laserX,m.lW,hb.x,hb.w))continue;
      if(bottom<=bestBottom)continue;
      bestBottom=bottom;
      clipY=bottom;
      blocker={type:"boss",ref:G.boss};
    }
  }

  s.laserTopY=blocker?clipY:0;
  s.laserBotY=m.startY;
  s.laserBlocked=!!blocker;
  return {m,blocker};
}

function damageBoss(d){
  const b=G.boss;
  if(!b||b.dead||b.entering)return;
  b.hp=Math.max(0,b.hp-d);
  b.hitFlash=0.10;
}

// Centro da sobreposição entre projétil e alvo — ponto onde o tiro “morre”
function shotHitPoint(shotRect,targetRect){
  const x1=Math.max(shotRect.x,targetRect.x);
  const y1=Math.max(shotRect.y,targetRect.y);
  const x2=Math.min(shotRect.x+shotRect.w,targetRect.x+targetRect.w);
  const y2=Math.min(shotRect.y+shotRect.h,targetRect.y+targetRect.h);
  if(x2<=x1||y2<=y1){
    return {x:shotRect.x+shotRect.w/2,y:shotRect.y+shotRect.h};
  }
  return {x:(x1+x2)*0.5,y:(y1+y2)*0.5};
}

// Dano de explosão do míssil em tiros inimigos (hits por explosão; mHits inicia em BULLET_MISSILE_HITS)
function damageBulletsInRadius(cx,cy,r,hits){
  for(const b of G.eBullets){
    if(!b.alive)continue;
    const bx=b.x+b.w/2,by=b.y+b.h/2;
    if(Math.hypot(bx-cx,by-cy)<=r+Math.max(b.w,b.h)*0.45){
      b.mHits=(b.mHits!=null?b.mHits:BULLET_MISSILE_HITS)-hits;
      if(b.mHits<=0)b.alive=false;
    }
  }
}

function tryMissileBulletImpact(missile){
  if(!SPECIALS.missile.clearsBullets)return false;
  const pad=Math.max(missile.w,missile.h)*0.35;
  const box={x:missile.x-pad,y:missile.y-pad,w:missile.w+pad*2,h:missile.h+pad*2};
  for(const b of G.eBullets){
    if(!b.alive)continue;
    if(rOvlp(box,{x:b.x,y:b.y,w:b.w,h:b.h})){
      missileExplode(missile);
      return true;
    }
  }
  return false;
}

// Míssil: explode no contato e causa dano em área (raio configurável em SPECIALS)
function missileExplode(s){
  const cx=s.x+s.w/2,cy=s.y+s.h/2;
  s.alive=false;
  expl(cx,cy,"#ff8a00",true);
  if(SPECIALS.missile.clearsBullets)damageBulletsInRadius(cx,cy,SPECIALS.missile.areaRadius,1);
  const r=SPECIALS.missile.areaRadius;
  const ad=SPECIALS.missile.areaDamage;
  for(const e of G.enemies){
    if(!e.alive||e.dead)continue;
    const ex=e.x+e.w/2,ey=e.drawY+e.h/2;
    if(Math.hypot(ex-cx,ey-cy)<=r+Math.max(e.w,e.h)*0.3){
      e.hp-=ad;
      e.hitFlash=0.10;
      if(e.hp<=0&&!e.dead)killEnemy(e);
    }
  }
  if(G.boss&&!G.boss.dead&&!G.boss.entering){
    for(const hb of getBossHitboxes(G.boss)){
      const hx=hb.x+hb.w/2,hy=hb.y+hb.h/2;
      if(Math.hypot(hx-cx,hy-cy)<=r+Math.max(hb.w,hb.h)*0.3){damageBoss(ad);break;}
    }
  }
}

function collisions(){
  const p=G.player;
  for(const s of G.pShots){
    if(!s.alive)continue;

    if(s.type==="laser"){
      const {m,blocker}=resolveLaserBlock(s);
      if(blocker){
        if(blocker.type==="boss"){
          const b=blocker.ref;
          b.hp=Math.max(0,b.hp-1.2);
          b.hitFlash=0.10;
          if(Math.random()<0.22)hitSparkForShot(s,m.px,s.laserTopY!=null?s.laserTopY:m.startY-4);
        }else{
          const e=blocker.ref;
          e.hp-=2;
          e.hitFlash=0.10;
          if(Math.random()<0.22)hitSparkForShot(s,m.px,s.laserTopY!=null?s.laserTopY:e.drawY+e.h);
          if(e.hp<=0&&!e.dead)killEnemy(e);
        }
      }
      continue;
    }

    // Tiros básicos (basic) e mísseis (missile)
    const sr={x:s.x,y:s.y,w:s.w,h:s.h};
    let contactEnemy=null;
    let contactRect=null;

    if(G.boss&&!G.boss.dead&&!G.boss.entering){
      for(const hb of getBossHitboxes(G.boss)){
        if(rOvlp(sr,hb)){contactRect=hb;break;}
      }
    }
    if(!contactRect){
      for(const e of G.enemies){
        if(!e.alive||e.dead)continue;
        const er={x:e.x,y:e.drawY,w:e.w,h:e.h};
        if(rOvlp(sr,er)){contactEnemy=e;contactRect=er;break;}
      }
    }
    if(!contactRect)continue;

    const hitPt=shotHitPoint(sr,contactRect);

    if(s.type==="missile"){
      hitSparkForShot(s,hitPt.x,hitPt.y);
      missileExplode(s);
    }else{
      hitSparkForShot(s,hitPt.x,hitPt.y);
      if(contactEnemy){
        contactEnemy.hp-=s.dmg;
        contactEnemy.hitFlash=0.10;
        if(contactEnemy.hp<=0&&!contactEnemy.dead)killEnemy(contactEnemy);
      }else{
        damageBoss(s.dmg);
      }
      s.alive=false;
    }
  }
  G.pShots=G.pShots.filter(s=>s.alive);
  if(p.inv<=0&&!invincible){
    for(const b of G.eBullets){
      if(!b.alive)continue;
      if(cRHit(p.x+p.w/2,p.y+p.h/2,p.hbr,b.x,b.y,b.w,b.h)){b.alive=false;dmgPlayer();break;}
    }
    for(const e of G.enemies){
      if(!e.alive||e.dead)continue;
      if(rOvlp({x:p.x+8,y:p.y+8,w:p.w-16,h:p.h-16},{x:e.x,y:e.drawY,w:e.w,h:e.h})){killEnemy(e);dmgPlayer();}
    }
  }
}
