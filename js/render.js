const flashCvs=document.createElement("canvas");

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

function drawBG(dt){
  bgSpeedMult+=(bgSpeedTarget-bgSpeedMult)*1.2*dt;
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,VW,VH);

  for(const l of bgLayers){
    if(!l.img||l.img.naturalWidth===0){
      l.scroll=l.scroll||0;
      continue;
    }
    const scale=Math.max(1,Math.floor(VW/l.img.naturalWidth));
    const dw=l.img.naturalWidth*scale;
    const dh=l.img.naturalHeight*scale;
    const dx=Math.floor((VW-dw)/2);
    l.scroll=(l.scroll+l.speed*bgSpeedMult*dt)%dh;
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(l.img,dx,l.scroll,dw,dh);
    ctx.drawImage(l.img,dx,l.scroll-dh,dw,dh);
  }
}

function drawBossHPBar(b){
  if(!b||b.dead||b.entering)return;
  const pct=b.hp/b.hpMax,bx=8,by=4,bw2=VW-16,bh2=8;
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
  ctx.fillText("BOSS",bx,by-1);
}

function drawBoss(b){
  if(!b)return;
  const bw=sw(gc.boss,"boss"),bh=sh(gc.boss,"boss");
  const cx=b.x+bw/2,cy=b.y+bh/2;

  if(!b.dead&&!b.entering&&b.laserActive){
    const pulse=0.6+0.4*Math.sin(Date.now()*.015),lw=18+Math.floor(pulse*8);
    ctx.save();
    ctx.shadowColor="#00ff44";
    ctx.shadowBlur=30;
    ctx.fillStyle="rgba(0,255,68,"+(pulse*.22)+")";
    ctx.fillRect(cx-lw*2,cy,lw*4,VH);
    ctx.restore();

    ctx.save();
    ctx.shadowColor="#aaffbb";
    ctx.shadowBlur=16;
    ctx.fillStyle="rgba(180,255,200,"+(0.7+pulse*0.3)+")";
    ctx.fillRect(cx-lw/2,cy,lw,VH);
    ctx.fillStyle="rgba(255,255,255,"+(pulse*0.6)+")";
    ctx.fillRect(cx-lw/4,cy,lw/2,VH);
    ctx.restore();
  }

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
    ctx.translate(-bw/2,-bh/2);
    if(b.hitFlash>0&&Math.floor(b.hitFlash/.04)%2===0){
      sprFlash(gc.boss,"boss",0,0,255,255,255,0.6);
    } else {
      spr(gc.boss,"boss",0,0);
    }
  }

  ctx.restore();
}

function drawPlayer(){
  const p=G.player;
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

  if(laserUsing||laserCD>0){
    const bw=p.w,bh=5,bx=p.x,by=p.y+p.h+4;
    ctx.fillStyle="#111";
    ctx.fillRect(bx,by,bw,bh);
    const pct=laserEnergy/LASER_MAX;
    const lg=ctx.createLinearGradient(bx,0,bx+bw,0);
    if(laserCD>0){
      lg.addColorStop(0,"#444");
      lg.addColorStop(1,"#888");
    } else {
      lg.addColorStop(0,"#0088ff");
      lg.addColorStop(1,"#00ffee");
    }
    ctx.fillStyle=lg;
    ctx.fillRect(bx,by,bw*pct,bh);
    ctx.strokeStyle=laserCD>0?"#555":"#0ff";
    ctx.lineWidth=1;
    ctx.strokeRect(bx,by,bw,bh);
  }

  const frame=getPlayerSpriteFrame();
  const sx=frame*PLAYER_FRAME_W;
  const dw=Math.round(PLAYER_FRAME_W*SCALE.player);
  const dh=Math.round(PLAYER_FRAME_H*SCALE.player);

  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(
    playerSheet,
    sx,0,PLAYER_FRAME_W,PLAYER_FRAME_H,
    p.x,p.y,dw,dh
  );
}

function drawShots(){
  const lW=rdy(gc.laser)?gc.laser.width*SCALE.laser:16;
  const lH=rdy(gc.laser)?gc.laser.height*SCALE.laser:16;

  for(const s of G.pShots){
    if(s.type==="shot"){
      spr(gc.shot,"shot",s.x,s.y);
    } else {
      const lx=Math.round(s.px+s.pw/2-lW/2),yE=Math.round(s.py+10);
      ctx.save();
      ctx.globalAlpha=.25;
      ctx.fillStyle="#0ff";
      ctx.fillRect(lx-8,0,lW+16,yE);
      ctx.restore();
      let ty=0;
      while(ty<yE){
        spr(gc.laser,"laser",lx,ty);
        ty+=Math.max(1,lH);
      }
    }
  }
}

function drawEnemies(){
  for(const e of G.enemies){
    if(!e.alive&&!e.dying)continue;
    const isDying=e.dying;
    const flash=e.hitFlash>0&&Math.floor(e.hitFlash/0.035)%2===0;

    if(e.kind==="small"){
      if(flash)sprFlash(gc.enemy,"enemy",e.x,e.drawY,255,255,255,0.55);
      else spr(gc.enemy,"enemy",e.x,e.drawY);
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

function drawComboPopup(){
  if(comboX<=1&&!comboBossLock)return;
  ctx.save();
  ctx.textAlign="right";
  const fs=comboX>=5?22:16;
  ctx.font="bold "+fs+"px monospace";
  const col=comboX>=5?"#f55":comboX>=3?"#fa0":"#ff0";
  ctx.strokeStyle="rgba(0,0,0,0.8)";
  ctx.lineWidth=3;
  ctx.strokeText("x"+comboX,VW-8,VH-8);
  ctx.fillStyle=col;
  ctx.fillText("x"+comboX,VW-8,VH-8);
  ctx.textAlign="left";
  ctx.restore();
}

function drawWarning(){
  if(stage!==2)return;
  if(Math.sin(warnB*Math.PI)<=0)return;
  ctx.save();
  ctx.fillStyle="rgba(200,0,0,.45)";
  ctx.fillRect(0,VH/2-54,VW,108);
  ctx.textAlign="center";
  ctx.font="bold 24px monospace";
  ctx.strokeStyle="#f00";
  ctx.lineWidth=3;
  ctx.strokeText("PERIGO! PERIGO!",VW/2,VH/2-14);
  ctx.fillStyle="#fff";
  ctx.fillText("PERIGO! PERIGO!",VW/2,VH/2-14);
  ctx.font="bold 12px monospace";
  ctx.strokeText("NAVE MASSIVA SE APROXIMANDO!!",VW/2,VH/2+16);
  ctx.fillText("NAVE MASSIVA SE APROXIMANDO!!",VW/2,VH/2+16);
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

function drawTitle(dt){
  drawBG(dt);
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,0.55)";
  ctx.fillRect(0,0,VW,VH);
  ctx.textAlign="center";
  ctx.font="bold 54px Georgia,serif";
  ctx.strokeStyle="#ff8800";
  ctx.lineWidth=6;
  ctx.strokeText("Caravan",VW/2,VH/2-210);
  ctx.strokeText("Blast!",VW/2,VH/2-152);
  const grad=ctx.createLinearGradient(0,VH/2-270,0,VH/2-140);
  grad.addColorStop(0,"#fff");
  grad.addColorStop(0.4,"#ffe066");
  grad.addColorStop(1,"#ff8800");
  ctx.fillStyle=grad;
  ctx.fillText("Caravan",VW/2,VH/2-210);
  ctx.fillText("Blast!",VW/2,VH/2-152);

  const tsw=320,tsh=284;
  const tsx=Math.floor(VW/2-tsw/2);
  const tsy=Math.floor(VH/2-tsh/2)+10;
  if(titleShipReady&&rdy(gc.titleShip)){
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(gc.titleShip,tsx,tsy,tsw,tsh);
  }

  const pulse=0.6+0.4*Math.sin(titleT*3.5);
  ctx.font="14px monospace";
  ctx.globalAlpha=pulse;
  ctx.fillStyle="#fff";
  ctx.strokeStyle="#000";
  ctx.lineWidth=2;
  ctx.strokeText("Aperte qualquer tecla para iniciar",VW/2,tsy+tsh+24);
  ctx.fillText("Aperte qualquer tecla para iniciar",VW/2,tsy+tsh+24);
  ctx.globalAlpha=1;

  if(gpConnected){
    ctx.font="11px monospace";
    ctx.fillStyle="#0f0";
    ctx.globalAlpha=0.8;
    ctx.fillText("Controle conectado",VW/2,tsy+tsh+46);
  }

  ctx.globalAlpha=1;
  ctx.font="10px monospace";
  ctx.fillStyle="#556";
  ctx.fillText("2026 - First Demo by SauloSan",VW/2,VH-20);
  ctx.textAlign="left";
  ctx.restore();
}

function drawIntro(dt){
  drawBG(dt);
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,0.55)";
  ctx.fillRect(0,0,VW,VH);
  if(introFlashOn){
    ctx.textAlign="center";
    ctx.font="14px monospace";
    ctx.fillStyle="#fff";
    ctx.fillText("Aperte qualquer tecla para iniciar",VW/2,VH-90);
    ctx.textAlign="left";
  }
  ctx.restore();
}

function drawWin(){
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
  const pulse=0.5+0.5*Math.sin(Date.now()*.004);
  ctx.globalAlpha=pulse;
  ctx.fillStyle="#aef";
  ctx.fillText("Aperte qualquer tecla para voltar ao menu",VW/2,VH/2+34);
  ctx.globalAlpha=1;
  ctx.textAlign="left";
  ctx.restore();
}

function drawGO(){
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
  const pulse=0.5+0.5*Math.sin(Date.now()*.004);
  ctx.globalAlpha=pulse;
  ctx.fillStyle="#fff";
  ctx.fillText("Aperte qualquer tecla para voltar ao menu",VW/2,VH/2+34);
  ctx.globalAlpha=1;
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