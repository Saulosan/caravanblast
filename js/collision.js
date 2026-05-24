function collisions(){
  const p=G.player;
  for(const s of G.pShots){
    if(!s.alive)continue;
    if(G.boss&&!G.boss.dead)hitBoss(s);
    if(!s.alive)continue;
    for(const e of G.enemies){
      if(!e.alive||e.dead)continue;
      const er={x:e.x,y:e.drawY,w:e.w,h:e.h};
      const lw=rdy(gc.laser)?gc.laser.width*SCALE.laser:16;
      const hit=s.type==="shot"?rOvlp({x:s.x,y:s.y,w:s.w,h:s.h},er):rOvlp({x:s.px+s.pw/2-lw/2,y:0,w:lw,h:s.py},er);
      if(hit){
        e.hp-=(s.type==="laser"?2:1);e.hitFlash=0.10;
        if(s.type==="shot")s.alive=false;
        if(e.hp<=0&&!e.dead)killEnemy(e);
        if(s.type==="shot")break;
      }
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
