const flashCvs=document.createElement("canvas");
const pausedCvs=document.createElement("canvas");
const pausedCtx=pausedCvs.getContext("2d");

function spr(c,key,x,y){
  if(!rdy(c)){
    ctx.fillStyle="#f0f";
    ctx.fillRect(x,y,sw(c,key),sh(c,key));
    return;
  }
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(c,x,y,sw(c,key),sh(c,key));
}

function sprFlash(c,key,x,y,r,g,b,alpha){
  const fw=sw(c,key),fh=sh(c,key);
  if(!rdy(c)){
    ctx.save();
    ctx.globalAlpha=alpha||0.5;
    ctx.fillStyle="rgb("+r+","+g+","+b+")";
    ctx.fillRect(x,y,fw,fh);
    ctx.restore();
    return;
  }
  flashCvs.width=Math.max(1,Math.ceil(fw));
  flashCvs.height=Math.max(1,Math.ceil(fh));
  const fc=flashCvs.getContext("2d");
  fc.imageSmoothingEnabled=false;
  fc.clearRect(0,0,fw,fh);
  fc.drawImage(c,0,0,fw,fh);
  fc.globalCompositeOperation="source-atop";
  fc.fillStyle="rgba("+r+","+g+","+b+","+(alpha||0.5)+")";
  fc.fillRect(0,0,fw,fh);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(flashCvs,x,y);
}

function drawBGLayer(img,scroll,dt,speed){
  if(!img||img.naturalWidth===0)return scroll||0;
  const scale=Math.max(1,Math.floor(VW/img.naturalWidth));
  const dw=img.naturalWidth*scale;
  const dh=img.naturalHeight*scale;
  const dx=Math.floor((VW-dw)/2);
  scroll=(scroll+speed*bgSpeedMult*dt)%dh;
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(img,dx,scroll,dw,dh);
  ctx.drawImage(img,dx,scroll-dh,dw,dh);
  return scroll;
}

function drawBG(dt){
  bgSpeedMult+=(bgSpeedTarget-bgSpeedMult)*1.2*dt;
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,VW,VH);
  for(const l of bgLayers){
    l.scroll=drawBGLayer(l.img,l.scroll,dt,l.speed);
  }

  // Hyperspace streak overlay when scrolling is very fast
  if(bgSpeedMult>4.5){
    const n=Math.floor(14+bgSpeedMult*3);
    const alpha=Math.min(0.34,(bgSpeedMult-4.0)*0.06);
    ctx.save();
    ctx.strokeStyle="rgba(180,220,255,"+alpha+")";
    for(let i=0;i<n;i++){
      const x=((i*37)+17)%VW;
      const y=((i*73)+(Date.now()*0.38))%VH;
      const len=10+bgSpeedMult*3;
      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x,y+len);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawBossHPBar(b){
  if(!b||b.dead||b.entering)return;
  const pct=b.hp/b.hpMax;
  const bx=HUD_MARGIN,by=HUD_MARGIN,bw2=VW-HUD_MARGIN*2,bh2=HUD_BAR_H;
  ctx.fillStyle="rgba(0,0,0,0.65)";
  ctx.fillRect(bx-1,by-1,bw2+2,bh2+2);
  ctx.fillStyle="#111";
  ctx.fillRect(bx,by,bw2,bh2);
  const gr=ctx.createLinearGradient(bx,0,bx+bw2,0);
  gr.addColorStop(0,"#ff2200");
  gr.addColorStop(.5,"#ff8800");
  gr.addColorStop(1,"#ffdd00");
  ctx.fillStyle=gr;
  ctx.fillRect(bx,by,bw2*pct,bh2);
  ctx.strokeStyle="#555";
  ctx.lineWidth=1;
  ctx.strokeRect(bx,by,bw2,bh2);
  ctx.fillStyle="#aaa";
  ctx.font="bold 7px monospace";
  ctx.textAlign="left";
  ctx.fillText("BOSS",bx,by+bh2+8);
}

function drawBoss(b){
  if(!b)return;
  const bw=sw(gc.boss,"boss"),bh=sh(gc.boss,"boss");
  const cx=b.x+bw/2,cy=b.y+bh/2;

  ctx.save();
  ctx.translate(cx,cy);

  if(b.dead){
    ctx.rotate(bossDeathRot);
    ctx.scale(bossDeathScale,bossDeathScale);
    ctx.translate(-bw/2,-bh/2);
    const ft=Math.floor(b.deathFlashT*10)%2;
    if(ft===0)sprFlash(gc.boss,"boss",0,0,255,40,0,0.75);
    else sprFlash(gc.boss,"boss",0,0,255,200,0,0.65);

    if(bossDeathPhase==="nova"){
      const nr=bossNova;
      const gr=ctx.createRadialGradient(bw/2,bh/2,0,bw/2,bh/2,nr);
      gr.addColorStop(0,"rgba(255,255,255,0.95)");
      gr.addColorStop(0.6,"rgba(255,255,255,0.85)");
      gr.addColorStop(0.88,"rgba(180,220,255,0.6)");
      gr.addColorStop(1,"rgba(255,255,255,0)");
      ctx.globalAlpha=1;
      ctx.fillStyle=gr;
      ctx.beginPath();
      ctx.arc(bw/2,bh/2,nr,0,Math.PI*2);
      ctx.fill();
    }
  } else if(b.entering){
    const sc=b.entryScale;
    ctx.rotate(b.entryRot||0);
    ctx.scale(sc,sc);
    ctx.translate(-bw/2,-bh/2);
    ctx.imageSmoothingEnabled=false;
    if(rdy(gc.boss))ctx.drawImage(gc.boss,0,0,bw,bh);
    else{
      ctx.fillStyle="#f0f";
      ctx.fillRect(0,0,bw,bh);
    }
  } else {
    if(b.displayRot)ctx.rotate(b.displayRot);

    if(!b.dead&&!b.entering&&b.laserActive){
      const pulse=0.6+0.4*Math.sin(Date.now()*.015);
      const lw=18+Math.floor(pulse*8);
      const emitY=bh*0.12;
      const laserLen=VH+120;
      ctx.save();
      ctx.shadowColor="#00ff44";
      ctx.shadowBlur=30;
      ctx.fillStyle="rgba(0,255,68,"+(pulse*.22)+")";
      ctx.fillRect(-lw*2,emitY,lw*4,laserLen);
      ctx.shadowColor="#aaffbb";
      ctx.shadowBlur=16;
      ctx.fillStyle="rgba(180,255,200,"+(0.7+pulse*0.3)+")";
      ctx.fillRect(-lw/2,emitY,lw,laserLen);
      ctx.fillStyle="rgba(255,255,255,"+(pulse*0.6)+")";
      ctx.fillRect(-lw/4,emitY,lw/2,laserLen);
      ctx.restore();
    }

    ctx.translate(-bw/2,-bh/2);
    if(b.hitFlash>0&&Math.floor(b.hitFlash/.04)%2===0){
      sprFlash(gc.boss,"boss",0,0,255,255,255,0.6);
    } else {
      spr(gc.boss,"boss",0,0);
    }
  }

  ctx.restore();
}

function drawBossChargeOrbs(b){
  if(!b||!b.laserCharging||!b.chargeOrbs||!b.chargeOrbs.length)return;
  ctx.save();
  for(const o of b.chargeOrbs){
    if(!o.alive)continue;
    const pulse=0.55+0.45*Math.sin((o.t||0)*14+o.r);
    ctx.globalAlpha=0.45+pulse*0.45;
    ctx.fillStyle="#55ff77";
    ctx.beginPath();
    ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=pulse*0.35;
    ctx.fillStyle="#ccffcc";
    ctx.beginPath();
    ctx.arc(o.x,o.y,o.r*0.45,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayer(){
  const p=G.player;

  if(p.x<-150 || p.y>VH+120)return;
  if(p.inv>0&&Math.floor(p.inv*14)%2===0)return;

  if(invincible){
    ctx.save();
    ctx.strokeStyle="rgba(80,200,255,0.5)";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(p.x+p.w/2,p.y+p.h/2,p.hbr+4,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  if(specialActive||laserUsing||laserCD>0){
    const sp=SPECIALS[specialType]||SPECIALS.laser;
    const bw=p.w,bh=5,bx=p.x,by=p.y+p.h+4;
    ctx.fillStyle="#111";
    ctx.fillRect(bx,by,bw,bh);
    const pct=laserEnergy/LASER_MAX;
    const lg=ctx.createLinearGradient(bx,0,bx+bw,0);
    if(laserCD>0){
      lg.addColorStop(0,"#444");
      lg.addColorStop(1,"#888");
    } else {
      lg.addColorStop(0,sp.barColorA);
      lg.addColorStop(1,sp.barColorB);
    }
    ctx.fillStyle=lg;
    ctx.fillRect(bx,by,bw*pct,bh);
    ctx.strokeStyle=laserCD>0?"#555":sp.barColorB;
    ctx.lineWidth=1;
    ctx.strokeRect(bx,by,bw,bh);
  }

  const frame=getPlayerSpriteFrame();
  const sx=frame*PLAYER_FRAME_W;
  const dw=Math.round(PLAYER_FRAME_W*SCALE.player);
  const dh=Math.round(PLAYER_FRAME_H*SCALE.player);

  if(playerArriving && playerArrivalPhase===0){
    ctx.save();
    ctx.globalAlpha=0.28;
    ctx.fillStyle="#00ff44";
    const cx=p.x+dw/2;
    const topY=p.y+dh-6;
    const beamW=18;
    ctx.fillRect(cx-beamW/2,topY,beamW,VH-topY+30);
    ctx.restore();
  }

  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(
    playerSheet,
    sx,0,PLAYER_FRAME_W,PLAYER_FRAME_H,
    p.x,p.y,dw,dh
  );
}

function drawShots(){
  for(const s of G.pShots){
    if(s.type==="basic"){
      const img=gc[s.spriteKey];
      ctx.imageSmoothingEnabled=false;
      if(rdy(img)){
        ctx.drawImage(img,s.x,s.y,s.w,s.h);
      }else{
        ctx.fillStyle=s.color==="red"?"#ff4040":s.color==="purple"?"#b060ff":"#40ff60";
        ctx.fillRect(s.x,s.y,s.w,s.h);
      }
    } else if(s.type==="missile"){
      const img=gc.missile;
      ctx.save();
      ctx.imageSmoothingEnabled=false;
      ctx.translate(s.x+s.w/2,s.y+s.h/2);
      ctx.rotate(s.ang+Math.PI/2);
      if(rdy(img)){
        ctx.drawImage(img,-s.w/2,-s.h/2,s.w,s.h);
      }else{
        ctx.fillStyle="#ff9a30";
        ctx.fillRect(-s.w/2,-s.h/2,s.w,s.h);
      }
      ctx.restore();
    } else { // laser
      if(s.laserTopY==null)resolveLaserBlock(s);
      const m=laserMetrics(s);
      const topY=s.laserTopY!=null?s.laserTopY:0;
      const botY=s.laserBotY!=null?s.laserBotY:m.startY;
      ctx.save();
      ctx.globalAlpha=1;
      ctx.imageSmoothingEnabled=false;

      let ty=topY;
      while(ty<botY){
        if(rdy(gc.laser)){
          ctx.drawImage(gc.laser,m.laserX,ty,m.lW,m.lH);
        } else {
          ctx.fillStyle="#44f0ff";
          ctx.fillRect(m.laserX,ty,m.lW,m.lH);
        }
        ty+=Math.max(1,m.lH-2);
      }

      if(s.laserBlocked&&rdy(gc.laserSpark)){
        const sparkNatW=gc.laserSpark.width||32;
        const sparkNatH=gc.laserSpark.height||24;
        const sparkW=m.lW;
        const sparkH=Math.round(sparkNatH*(sparkW/sparkNatW));
        const lift=Math.round(LASER_SPARK_HIT_LIFT*(sparkW/sparkNatW));
        const sparkX=Math.round(m.px-sparkW/2);
        const sparkY=Math.round(topY-sparkH+lift);
        ctx.drawImage(gc.laserSpark,sparkX,sparkY,sparkW,sparkH);
      }

      ctx.restore();
    }
  }
}

function drawEnemies(){
  for(const e of G.enemies){
    if(!e.alive&&!e.dying)continue;
    const isDying=e.dying;
    const flash=e.hitFlash>0&&Math.floor(e.hitFlash/0.035)%2===0;

    if(e.kind==="small"){
      const frame=getSmallEnemySpriteFrame(e);
      const sx=frame*ENEMY1_FRAME_W;
      const dw=e.w,dh=e.h;
      ctx.imageSmoothingEnabled=false;
      if(enemy1Ready&&rdy(enemy1Sheet)){
        if(flash){
          flashCvs.width=Math.max(1,dw);
          flashCvs.height=Math.max(1,dh);
          const fc=flashCvs.getContext("2d");
          fc.clearRect(0,0,dw,dh);
          fc.drawImage(enemy1Sheet,sx,0,ENEMY1_FRAME_W,ENEMY1_FRAME_H,0,0,dw,dh);
          fc.globalCompositeOperation="source-atop";
          fc.fillStyle="rgba(255,255,255,0.55)";
          fc.fillRect(0,0,dw,dh);
          ctx.drawImage(flashCvs,e.x,e.drawY);
        } else {
          ctx.drawImage(enemy1Sheet,sx,0,ENEMY1_FRAME_W,ENEMY1_FRAME_H,e.x,e.drawY,dw,dh);
        }
      } else {
        if(flash)sprFlash(gc.enemy2,"enemy2",e.x,e.drawY,255,255,255,0.55);
        else spr(gc.enemy2,"enemy2",e.x,e.drawY);
      }
    }
    else if(e.kind==="medA"){
      if(flash)sprFlash(gc.enemy4,"enemy4",e.x,e.drawY,255,255,255,0.55);
      else spr(gc.enemy4,"enemy4",e.x,e.drawY);
    }
    else if(e.kind==="medB"){
      const sc=isDying?e.deathScale:1,ecx=e.x+e.w/2,ecy=e.drawY+e.h/2;
      ctx.save();
      ctx.translate(ecx,ecy);
      if(isDying)ctx.rotate(e.deathRot);
      else ctx.rotate(e.rot);
      ctx.scale(sc,sc);
      ctx.globalAlpha=isDying?Math.max(0,e.deathScale):1;
      const ox=-e.w/2,oy=-e.h/2;
      if(isDying){
        const ft=Math.floor(e.deathFlashT*12)%2;
        if(ft===0)sprFlash(gc.enemy2,"enemy2",ox,oy,255,40,0,0.7);
        else sprFlash(gc.enemy2,"enemy2",ox,oy,255,220,0,0.7);
      } else if(flash){
        sprFlash(gc.enemy2,"enemy2",ox,oy,255,255,255,0.55);
      } else {
        spr(gc.enemy2,"enemy2",ox,oy);
      }
      ctx.restore();
    }
    else if(e.kind==="medC"){
      const sc=e.scaleIn||1;
      if(sc<1){
        const dw=Math.ceil(e.w*sc),dh2=Math.ceil(e.h*sc);
        if(dw>0&&dh2>0){
          const dx2=e.x+(e.w-dw)/2,dy2=e.drawY+(e.h-dh2)/2;
          ctx.save();
          ctx.imageSmoothingEnabled=false;
          if(flash){
            flashCvs.width=dw;
            flashCvs.height=dh2;
            const fc=flashCvs.getContext("2d");
            fc.clearRect(0,0,dw,dh2);
            if(rdy(gc.enemy3))fc.drawImage(gc.enemy3,0,0,dw,dh2);
            fc.globalCompositeOperation="source-atop";
            fc.fillStyle="rgba(255,255,255,0.55)";
            fc.fillRect(0,0,dw,dh2);
            ctx.drawImage(flashCvs,dx2,dy2);
          } else {
            if(rdy(gc.enemy3))ctx.drawImage(gc.enemy3,dx2,dy2,dw,dh2);
          }
          ctx.restore();
        }
      } else {
        if(flash)sprFlash(gc.enemy3,"enemy3",e.x,e.drawY,255,255,255,0.55);
        else spr(gc.enemy3,"enemy3",e.x,e.drawY);
      }
    }
  }
}

function drawBullets(){
  for(const b of G.eBullets){
    if(!b.alive)continue;
    spr(gc.bullet,"bullet",b.x,b.y);
  }
}

function drawExpl(){
  for(const e of G.expl){
    const a=clamp(e.life/e.ml,0,1);
    ctx.save();
    ctx.globalAlpha=a;
    ctx.fillStyle=e.col;
    ctx.beginPath();
    ctx.arc(e.x,e.y,e.r,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,"+(a*.6)+")";
    ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.arc(e.x,e.y,e.r,0,Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(e.x,e.y,e.r2,0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawDebris(){
  for(const d of G.debris){
    if(!d.alive)continue;
    const a=clamp(d.life/0.7,0,1);
    ctx.save();
    ctx.globalAlpha=a;
    ctx.translate(d.x,d.y);
    ctx.rotate(d.rot);
    ctx.fillStyle=d.col;
    ctx.fillRect(-d.s/2,-d.s/2,d.s,d.s);
    ctx.restore();
  }
}

function drawSparksOfKind(kind){
  for(const s of G.sparks){
    if((s.kind||"hit")!==kind)continue;
    const ml=s.ml||0.16;
    const a=clamp(s.life/ml,0,1);
    const sz=Math.max(2,s.size);
    const x=Math.round(s.x-sz/2);
    const y=Math.round(s.y-sz/2);
    ctx.save();
    ctx.globalAlpha=a;
    ctx.fillStyle=s.col;
    ctx.fillRect(x,y,sz,sz);
    if(sz>=4){
      ctx.globalAlpha=a*0.45;
      ctx.fillRect(x-1,y-1,sz+2,sz+2);
    }
    ctx.restore();
  }
}

function drawHitSparks(){drawSparksOfKind("hit");}

function drawMuzzleGlows(){
  for(const g of G.muzzleGlows){
    const a=clamp(g.life/g.ml,0,1)*g.alpha;
    if(a<=0)continue;
    ctx.save();
    ctx.globalAlpha=a;
    ctx.fillStyle=g.col;
    ctx.beginPath();
    ctx.arc(g.x,g.y,g.r,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

function drawMedals(){
  for(const m of G.medals){
    if(!m.alive)continue;
    ctx.save();
    ctx.translate(m.x,m.y);
    ctx.rotate(m.a);
    const r=m.att?9:7;
    ctx.fillStyle="#ffdd00";
    ctx.strokeStyle="#ff8800";
    ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=0;i<10;i++){
      const a2=(i/10)*Math.PI*2-Math.PI/2,rd=i%2===0?r:r*.45;
      if(i===0)ctx.moveTo(Math.cos(a2)*rd,Math.sin(a2)*rd);
      else ctx.lineTo(Math.cos(a2)*rd,Math.sin(a2)*rd);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawCapsules(){
  if(!G.capsules)return;
  for(const c of G.capsules){
    if(!c.alive)continue;
    const cycle=c.kind==="special"?POWERUP.cycleSpecial:POWERUP.cycleBasic;
    const color=cycle[c.colorIdx];
    const img=gc[POWERUP.sprites[color]];
    ctx.imageSmoothingEnabled=false;
    if(rdy(img)){
      ctx.drawImage(img,c.x,c.y,c.w,c.h);
    }else{
      ctx.fillStyle=POWERUP.fallbackColors[color]||"#fff";
      ctx.fillRect(c.x,c.y,c.w,c.h);
    }
  }
}

function drawHudMiniBar(x,y,w,h,pct,cA,cB,cooldown){
  ctx.fillStyle="rgba(0,0,0,0.55)";
  ctx.fillRect(x-1,y-1,w+2,h+2);
  ctx.fillStyle="#141414";
  ctx.fillRect(x,y,w,h);
  pct=clamp(pct,0,1);
  if(pct>0){
    if(cooldown){
      ctx.fillStyle="#555";
      ctx.fillRect(x,y,w*pct,h);
    }else{
      const lg=ctx.createLinearGradient(x,0,x+w,0);
      lg.addColorStop(0,cA);
      lg.addColorStop(1,cB);
      ctx.fillStyle=lg;
      ctx.fillRect(x,y,w*pct,h);
    }
  }
  ctx.strokeStyle="rgba(255,255,255,0.22)";
  ctx.lineWidth=1;
  ctx.strokeRect(x,y,w,h);
}

function drawMiniShipIcon(x,y){
  const iw=Math.round(PLAYER_FRAME_W*SCALE.player*0.19);
  const ih=Math.round(PLAYER_FRAME_H*SCALE.player*0.19);
  if(rdy(gc.player)){
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(gc.player,0,0,PLAYER_FRAME_W,PLAYER_FRAME_H,x,y,iw,ih);
  }else{
    ctx.fillStyle="#ff5555";
    ctx.fillRect(x,y,iw,ih);
  }
  return iw+4;
}

function drawGameHUD(){
  const mx=HUD_MARGIN,my=HUD_MARGIN;
  const bottom=VH-HUD_MARGIN;
  ctx.save();

  // Combo — canto superior direito
  if(comboX>1||comboBossLock){
    ctx.textAlign="right";
    const fs=comboX>=5?18:14;
    ctx.font="bold "+fs+"px monospace";
    const col=comboX>=5?"#f55":comboX>=3?"#fa0":"#ff0";
    ctx.strokeStyle="rgba(0,0,0,0.85)";
    ctx.lineWidth=3;
    ctx.strokeText("x"+comboX,VW-mx,my+fs-2);
    ctx.fillStyle=col;
    ctx.fillText("x"+comboX,VW-mx,my+fs-2);
  }

  // Pontuação — canto inferior direito
  ctx.textAlign="right";
  ctx.font="bold 13px monospace";
  ctx.strokeStyle="rgba(0,0,0,0.85)";
  ctx.lineWidth=3;
  const scoreTxt=String(score).padStart(6,"0");
  ctx.strokeText(scoreTxt,VW-mx,bottom);
  ctx.fillStyle="#ffffff";
  ctx.fillText(scoreTxt,VW-mx,bottom);

  // Bloco inferior esquerdo: vidas, barras, arma
  const barX=mx+18;
  const barW=HUD_BAR_W;
  const barH=HUD_BAR_H;
  let y=bottom-46;

  // Vidas (ícones da nave)
  let lx=mx;
  const lives=G.player.lives;
  for(let i=0;i<lives;i++){
    lx+=drawMiniShipIcon(lx,y);
  }

  // Barra de combo
  y+=14;
  ctx.textAlign="left";
  ctx.font="7px monospace";
  ctx.fillStyle="rgba(200,200,200,0.75)";
  ctx.fillText("C",mx,y+barH-1);
  const comboPct=comboBossLock?1:comboT/COMBO_DUR;
  const comboA=comboBossLock?"#f44":comboX>=5?"#f44":comboX>=3?"#f80":"#f80";
  const comboB=comboBossLock?"#fa0":comboX>=5?"#f80":"#fd0";
  drawHudMiniBar(barX,y,barW,barH,comboPct,comboA,comboB,false);

  // Barra de especial
  y+=10;
  ctx.fillStyle="rgba(200,200,200,0.75)";
  ctx.fillText("S",mx,y+barH-1);
  const sp=SPECIALS[specialType]||SPECIALS.laser;
  const specPct=laserEnergy/LASER_MAX;
  const onCD=laserCD>0;
  drawHudMiniBar(barX,y,barW,barH,specPct,onCD?"#444":sp.barColorA,onCD?"#888":sp.barColorB,onCD);

  // Arma atual + nível
  y+=11;
  const wcol=weaponColor==="red"?"#ff6666":weaponColor==="purple"?"#c090ff":"#66ff88";
  const wShort=weaponColor==="red"?"VM":weaponColor==="purple"?"RX":"VD";
  const wLine=wShort+" Lv"+weaponLevel+" · "+sp.label;
  ctx.font="8px monospace";
  ctx.strokeStyle="rgba(0,0,0,0.85)";
  ctx.lineWidth=2;
  ctx.strokeText(wLine,mx,y);
  ctx.fillStyle=wcol;
  ctx.fillText(wLine,mx,y);

  ctx.textAlign="left";
  ctx.restore();
}

function drawWarning(){
  if(stage!==2)return;
  ctx.save();

  ctx.textAlign="left";
  ctx.font="11px monospace";
  let maxW=ctx.measureText(WARN_HEADER).width;
  ctx.font="14px monospace";
  for(const ln of WARN_LINES)maxW=Math.max(maxW,ctx.measureText(ln).width);
  const bandX=26-18;
  const bandY=VH/2-72;
  const bandW=maxW+36;
  const bandH=108;
  ctx.fillStyle="rgba(0,0,0,"+warnDim+")";
  ctx.fillRect(bandX,bandY,bandW,bandH);

  ctx.font="11px monospace";
  ctx.fillStyle="#6fcf66";
  ctx.fillText(WARN_HEADER,26,VH/2-58);

  ctx.font="14px monospace";
  ctx.fillStyle="#66ff66";
  const baseY=VH/2-24;
  for(let i=0;i<WARN_LINES.length;i++){
    const full=WARN_LINES[i];
    const shown=full.slice(0,warnLineChars[i]||0);
    if(!shown&&i>0&&(warnLineChars[i-1]||0)<WARN_LINES[i-1].length)continue;
    const y=baseY+i*28;
    ctx.fillText(shown,26,y);
    const typing=(i===0&&warnLineChars[0]<full.length)||(i===1&&warnLineChars[0]>=WARN_LINES[0].length&&warnLineChars[1]<full.length);
    if(typing&&Math.floor(Date.now()*0.004)%2===0){
      const cw=ctx.measureText(shown).width;
      ctx.fillRect(26+cw+2,y-12,8,14);
    }
  }

  ctx.textAlign="left";
  ctx.restore();
}

function drawScreenFlash(){
  if(screenFlash<=0)return;
  ctx.save();
  ctx.globalAlpha=screenFlash;
  ctx.fillStyle="#ffffff";
  ctx.fillRect(0,0,VW,VH);
  ctx.restore();
}

function drawScreenFade(){
  if(!screenTrans.active&&screenTrans.alpha<=0)return;
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,"+screenTrans.alpha+")";
  ctx.fillRect(0,0,VW,VH);
  ctx.restore();
}

function drawSettingsMenu(isOptions){
  const items=getSettingsNavItems(isOptions);
  const menuSc=0.88;
  const titleSc=0.88;
  const lineH=28;
  const textTopOff=14;
  const topPad=64;

  ctx.save();
  ctx.fillStyle="rgba(0,0,0,0.2)";
  ctx.fillRect(0,0,VW,VH);
  const boxW=400;
  const boxH=Math.min(VH-32,topPad+items.length*lineH);
  const boxX=Math.floor((VW-boxW)/2),boxY=Math.floor((VH-boxH)/2);
  ctx.fillStyle="rgba(12,14,20,0.72)";
  ctx.fillRect(boxX,boxY,boxW,boxH);
  ctx.strokeStyle="#7aa8ff";
  ctx.lineWidth=2;
  ctx.strokeRect(boxX,boxY,boxW,boxH);

  sfDrawTextCenter(getSettingsMenuHeader(isOptions),VW/2,boxY+14,{
    scale:titleSc,
    theme:"silver",
    fallbackColor:"#d8e6ff"
  });

  const startY=boxY+56;
  for(let i=0;i<items.length;i++){
    const yTop=startY+i*lineH-textTopOff;
    const selected=i===settingsItemIdx;
    const item=items[i];
    sfDrawText(getSettingsItemText(item),boxX+28,yTop,{
      scale:menuSc,
      theme:selected?"orange":"silver",
      alpha:selected?1:0.82,
      fallbackColor:selected?"#ffffff":"#c4d3ef"
    });
  }
  ctx.restore();
}

function drawPauseMenu(items,isOptions){
  drawSettingsMenu(!!isOptions);
}

function drawPausedFrame(){
  if(pausedCvs.width!==VW||pausedCvs.height!==VH){
    pausedCvs.width=VW;
    pausedCvs.height=VH;
  }
  ctx.clearRect(0,0,VW,VH);
  ctx.drawImage(pausedCvs,0,0,VW,VH);
  applyPostFX();
  drawSettingsMenu(false);
  drawFPSIfNeeded();
}

function drawTitle(dt,menuItems,selectedIdx){
  drawBG(dt);
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,0.55)";
  ctx.fillRect(0,0,VW,VH);

  const tsw=320,tsh=284;
  const tsx=Math.floor(VW/2-tsw/2);
  const tsy=Math.floor(VH/2-tsh/2)+10;

  const zoomP=clamp(titleLogoZoomT/TITLE_LOGO_ZOOM_DUR,0,1);
  const zoomEase=1-Math.pow(1-zoomP,3);
  const logoSc=TITLE_LOGO_ZOOM_START+(1-TITLE_LOGO_ZOOM_START)*zoomEase;
  const lw=Math.round(TITLE_LOGO_W*logoSc);
  const lh=Math.round(TITLE_LOGO_H*logoSc);
  const lx=Math.floor(VW/2-lw/2);
  const ly=Math.floor(tsy-lh+72);

  if(titleLogoReady&&titleLogo.naturalWidth>0){
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(titleLogo,lx,ly,lw,lh);
  }

  if(titleShipReady&&rdy(gc.titleShip)){
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(gc.titleShip,tsx,tsy,tsw,tsh);
  }

  ctx.textAlign="center";
  menuItems=menuItems||["Start Caravan","Options"];
  const by=tsy+tsh+16;
  const menuSc=0.88;
  const menuH=menuItems.length*26+12;
  let menuW=0;
  for(const item of menuItems)menuW=Math.max(menuW,sfMeasureText(item,menuSc));
  ctx.fillStyle="rgba(8,10,16,0.78)";
  ctx.fillRect(VW/2-menuW/2-16,by-6,menuW+32,menuH);
  for(let i=0;i<menuItems.length;i++){
    const selected=i===selectedIdx;
    const yTop=by+i*26;
    sfDrawTextCenter(menuItems[i],VW/2,yTop,{
      scale:menuSc,
      theme:selected?"orange":"silver",
      alpha:selected?1:0.82,
      fallbackColor:selected?"#ffffff":"#d3d9e8"
    });
  }

  if(gpConnected&&titleGpMsgT>0){
    const fade=Math.min(1,titleGpMsgT/0.6);
    sfDrawTextCenter("Controle conectado",VW/2,VH-40,{
      scale:0.75,
      alpha:0.75*fade,
      fallbackColor:"#0f0"
    });
  }

  sfDrawTextCenter("2026 - First Demo by SauloSan",VW/2,VH-22,{
    scale:0.65,
    alpha:0.85,
    fallbackColor:"#556"
  });

  ctx.textAlign="left";
  ctx.restore();
}

function drawTitleExitConfirm(){
  if(!titleExitConfirm)return;
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,0.72)";
  ctx.fillRect(0,0,VW,VH);
  const dw=320,dh=130;
  const dx=Math.floor((VW-dw)/2),dy=Math.floor((VH-dh)/2);
  ctx.fillStyle="rgba(12,14,20,0.96)";
  ctx.fillRect(dx,dy,dw,dh);
  ctx.strokeStyle="#ff8866";
  ctx.lineWidth=2;
  ctx.strokeRect(dx,dy,dw,dh);
  sfDrawTextCenter("Sair do jogo?",VW/2,dy+18,{scale:1,fallbackColor:"#ffe0d0"});
  sfDrawTextCenter("Fechar janela / voltar ao desktop",VW/2,dy+40,{
    scale:0.78,
    alpha:0.9,
    fallbackColor:"#aab4cc"
  });
  const opts=["Sim","Não"];
  const optSc=0.88;
  for(let i=0;i<opts.length;i++){
    const yTop=dy+72;
    const ox=VW/2+(i===0?-70:70);
    const selected=i===titleExitIdx;
    sfDrawTextCenter(opts[i],ox,yTop,{
      scale:optSc,
      theme:selected?"orange":"silver",
      alpha:selected?1:0.82,
      fallbackColor:selected?"#ffffff":"#c8d0e0"
    });
  }
  sfDrawTextCenter("<-/-> escolher  |  Enter: confirmar  |  Esc: cancelar",VW/2,dy+dh-20,{
    scale:0.62,
    alpha:0.9,
    fallbackColor:"#7a8aa8"
  });
  ctx.textAlign="left";
  ctx.restore();
}

function drawFPSOverlay(){
  ctx.save();
  ctx.textAlign="right";
  ctx.font="bold 11px monospace";
  ctx.fillStyle="rgba(0,0,0,0.62)";
  ctx.fillRect(VW-108,24,58,17);
  ctx.fillStyle="#8fd48f";
  ctx.fillText(fpsDisplay+" FPS",VW-12,37);
  ctx.restore();
}

function shouldShowFPS(){
  return displayFpsOn||appState==="paused"||appState==="options";
}

function drawFPSIfNeeded(){
  if(shouldShowFPS())drawFPSOverlay();
}

function drawIntro(dt){
  drawBG(dt);
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,0.58)";
  ctx.fillRect(0,0,VW,VH);
  ctx.textAlign="center";
  ctx.font="bold 24px Georgia,serif";
  ctx.fillStyle="#8bff8b";
  ctx.fillText("FEDERATION TRANSMISSION",VW/2,88);
  ctx.font="14px monospace";
  ctx.fillStyle="#d8e0ef";
  const slotsY=[140,198,290,356,420,520];
  const maxChars=58;
  for(let idx=0;idx<INTRO_LINES.length;idx++){
    const full=INTRO_LINES[idx];
    const shown=full.slice(0,introLineShown[idx]||0);
    if(!shown)continue;
    const words=shown.split(" ");
    const lines=[];
    let cur="";
    for(const w of words){
      const test=cur?cur+" "+w:w;
      if(test.length>maxChars){ if(cur)lines.push(cur); cur=w; }
      else cur=test;
    }
    if(cur)lines.push(cur);
    for(let i=0;i<lines.length;i++){
      ctx.fillText(lines[i],VW/2,slotsY[idx]+i*22);
    }
  }
  ctx.font="12px monospace";
  ctx.fillStyle="#9fb3d6";
  ctx.fillText("...incoming military briefing...",VW/2,VH-52);
  ctx.textAlign="left";
  ctx.restore();
}

function drawWin(menuItems,selectedIdx){
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.75)";
  ctx.fillRect(40,VH/2-70,VW-80,130);
  ctx.textAlign="center";
  ctx.fillStyle="#ffdd00";
  ctx.font="28px monospace";
  ctx.fillText("FASE COMPLETA!",VW/2,VH/2-18);
  ctx.fillStyle="#fff";
  ctx.font="13px monospace";
  ctx.fillText("Score: "+String(score).padStart(6,"0"),VW/2,VH/2+10);
  menuItems=menuItems||["Restart Game","View Score"];
  const sy=VH/2+34;
  for(let i=0;i<menuItems.length;i++){
    const selected=i===selectedIdx;
    const y=sy+i*24;
    if(selected){
      ctx.fillStyle="rgba(130,200,255,0.25)";
      ctx.fillRect(VW/2-120,y-14,240,20);
    }
    ctx.fillStyle=selected?"#eaffff":"#aef";
    ctx.fillText(menuItems[i],VW/2,y);
  }
  ctx.textAlign="left";
  ctx.restore();
}

function drawGO(menuItems,selectedIdx){
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.85)";
  ctx.fillRect(40,VH/2-80,VW-80,150);
  ctx.textAlign="center";
  ctx.fillStyle="#f44";
  ctx.font="28px monospace";
  ctx.fillText("GAME OVER",VW/2,VH/2-24);
  ctx.fillStyle="#aaa";
  ctx.font="12px monospace";
  ctx.fillText("Score final: "+String(score).padStart(6,"0"),VW/2,VH/2+8);
  menuItems=menuItems||["Restart Game","View Score"];
  const sy=VH/2+34;
  for(let i=0;i<menuItems.length;i++){
    const selected=i===selectedIdx;
    const y=sy+i*24;
    if(selected){
      ctx.fillStyle="rgba(255,120,120,0.25)";
      ctx.fillRect(VW/2-120,y-14,240,20);
    }
    ctx.fillStyle=selected?"#ffffff":"#ddd";
    ctx.fillText(menuItems[i],VW/2,y);
  }
  ctx.textAlign="left";
  ctx.restore();
}

function drawLoading(){
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,VW,VH);
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.font="14px monospace";
  ctx.fillText("Carregando...",VW/2,VH/2-10);
  ctx.font="11px monospace";
  ctx.fillStyle="#aaa";
  ctx.fillText("GIFs e backgrounds...",VW/2,VH/2+14);
  ctx.textAlign="left";
}