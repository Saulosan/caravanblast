function syncPlayerSize(){if(!rdy(gc.player))return;G.player.w=sw(gc.player,"player");G.player.h=sh(gc.player,"player");}

function updPlayer(dt){
  const p=G.player,spd=laserUsing?p.spd*p.lMult:p.spd;
  let mx=0,my=0;
  if(K["ArrowLeft"])mx-=1;if(K["ArrowRight"])mx+=1;if(K["ArrowUp"])my-=1;if(K["ArrowDown"])my+=1;
  if(mx&&my){mx*=Math.SQRT2/2;my*=Math.SQRT2/2;}
  p.x=clamp(p.x+mx*spd*dt,8,VW-p.w-8);p.y=clamp(p.y+my*spd*dt,8,VH-p.h-8);
  p.fire-=dt;
  if(laserUsing){if(p.fire<=0){G.pShots.push({type:"laser",px:p.x,py:p.y,pw:p.w,alive:true,ttl:.05});p.fire=.04;}}
  else if(K["KeyX"]){
    const sw2=sw(gc.shot,"shot"),sh2=sh(gc.shot,"shot");
    if(p.fire<=0){G.pShots.push({type:"shot",x:p.x+p.w/2-sw2/2,y:p.y-sh2,w:sw2,h:sh2,vy:-580,alive:true});p.fire=.075;}
  }
}
function updShots(dt){
  for(const s of G.pShots){if(!s.alive)continue;if(s.type==="shot"){s.y+=s.vy*dt;if(s.y+s.h<0)s.alive=false;}else{s.ttl-=dt;if(s.ttl<=0||!laserUsing)s.alive=false;}}
  G.pShots=G.pShots.filter(s=>s.alive);
}
function updLaser(dt){
  laserUsing=K["KeyC"]&&laserEnergy>0&&laserCD===0;
  if(laserUsing){laserEnergy=Math.max(0,laserEnergy-dt);if(laserEnergy===0)laserCD=LASER_COOLDOWN;}
  else if(laserCD>0){laserCD=Math.max(0,laserCD-dt);laserEnergy=Math.min(LASER_MAX,(1-(laserCD/LASER_COOLDOWN))*LASER_MAX);}
}
function dmgPlayer(){
  const p=G.player;if(!infiniteLives)p.lives--;
  p.inv=1.8;expl(p.x+p.w/2,p.y+p.h/2,"#6699ff");
  p.x=VW/2-p.w/2;p.y=VH-120;
  comboX=1;comboKills=0;comboT=COMBO_DUR;
  if(p.lives<=0&&!infiniteLives){gameOver=true;stopBGM();appState="gameover";}
}
