const bezelImg=new Image();
let bezelImgReady=false;

function isBezelSelected(){
  return bezelIdx>0&&!!BEZELS[bezelIdx]?.src;
}

function isBezelImageLoaded(){
  return bezelImgReady||(bezelImg.complete&&bezelImg.naturalWidth>0);
}

function isBezelActive(){
  return isBezelSelected()&&isBezelImageLoaded();
}

function getBezelLabel(){
  return BEZELS[bezelIdx]?.label||"Nenhum";
}

function disableBezelOverlay(){
  if(bezelOverlay)bezelOverlay.style.display="none";
  if(shell)shell.classList.remove("bezel-mode");
}

function computeGameLayout(W,H){
  const scale=Math.min(H/VH,W/VW);
  const pw=Math.round(VW*scale);
  const ph=Math.round(VH*scale);
  const pfLeft=Math.round((W-pw)/2);
  const pfTop=Math.round((H-ph)/2);
  return {scale,pfLeft,pfTop,pw,ph};
}

function applyBezelImage(){
  if(!bezelOverlay)return;
  if(!isBezelSelected()){
    disableBezelOverlay();
    return;
  }
  const b=BEZELS[bezelIdx];
  if(bezelImg.dataset.loadedId!==b.id){
    bezelImg.dataset.loadedId=b.id;
    bezelImgReady=false;
    bezelImg.onload=()=>{
      bezelImgReady=true;
      if(bezelOverlay){
        bezelOverlay.src=bezelImg.src;
        bezelOverlay.style.display="block";
      }
      autoAlignBezel();
      resize();
    };
    bezelImg.onerror=()=>{
      bezelImgReady=false;
      disableBezelOverlay();
      resize();
    };
    bezelImg.src=b.src;
    return;
  }
  if(isBezelImageLoaded()){
    bezelImgReady=true;
    bezelOverlay.src=bezelImg.src;
    bezelOverlay.style.display="block";
  }
}

function cycleBezel(dir){
  const wasOff=bezelIdx===0;
  bezelIdx=(bezelIdx+dir+BEZELS.length)%BEZELS.length;
  if(isBezelSelected()){
    if(wasOff)autoAlignBezel();
    applyBezelImage();
  }else{
    disableBezelOverlay();
  }
  if(typeof clampSettingsItemIdx==="function")clampSettingsItemIdx();
  resize();
}

function autoAlignBezel(){
  bezelPanX=0;
  bezelPanY=0;
  bezelStretchX=1;
  bezelStretchY=1;
}

function isBezelGuideVisible(){
  return(appState==="paused"||appState==="options")&&settingsSubMenu==="bezel";
}

function updateGameAreaGuide(g){
  const guide=document.getElementById("game-area-guide");
  if(!guide)return;
  if(isBezelGuideVisible()){
    guide.style.display="block";
    guide.style.left=g.pfLeft+"px";
    guide.style.top=g.pfTop+"px";
    guide.style.width=g.pw+"px";
    guide.style.height=g.ph+"px";
  }else{
    guide.style.display="none";
  }
}

function computeBezelTransform(g){
  // Altura do overlay = altura exata da área de jogo; largura proporcional 16:9; centrado
  const aspect=BEZEL_NAT_W/BEZEL_NAT_H;
  const bh=Math.round(g.ph*bezelStretchY);
  const bw=Math.round(bh*aspect*bezelStretchX);
  const bLeft=Math.round(g.pfLeft+(g.pw-bw)/2+bezelPanX);
  const bTop=Math.round(g.pfTop+(g.ph-bh)/2+bezelPanY);
  return {bLeft,bTop,bw,bh};
}

function layoutBezelOverlay(g){
  const t=computeBezelTransform(g);
  bezelOverlay.style.display="block";
  bezelOverlay.style.left=t.bLeft+"px";
  bezelOverlay.style.top=t.bTop+"px";
  bezelOverlay.style.width=t.bw+"px";
  bezelOverlay.style.height=t.bh+"px";
}

function applyGameLayout(g,H,bezelOn){
  canvas.style.transform="scale("+g.scale+")";
  canvas.style.width=VW+"px";
  canvas.style.height=VH+"px";
  wrap.style.left=g.pfLeft+"px";
  wrap.style.top=g.pfTop+"px";
  wrap.style.width=g.pw+"px";
  wrap.style.height=g.ph+"px";

  if(bezelOn){
    shell.classList.add("bezel-mode");
    hudLeft.style.width="0px";
    hudRight.style.width="0px";
    layoutBezelOverlay(g);
  }else{
    shell.classList.remove("bezel-mode");
    disableBezelOverlay();
    hudLeft.style.left="0px";
    hudLeft.style.top="0px";
    hudLeft.style.width=g.pfLeft+"px";
    hudLeft.style.height=H+"px";
    hudRight.style.left=(g.pfLeft+g.pw)+"px";
    hudRight.style.top="0px";
    hudRight.style.width=(window.innerWidth-g.pfLeft-g.pw)+"px";
    hudRight.style.height=H+"px";
  }
}
