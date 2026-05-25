const BGM={
  title:new Audio("assets/bgm/title.mp3"),
  stage1:new Audio("assets/bgm/stage1.mp3"),
  boss:new Audio("assets/bgm/boss.mp3")
};

BGM.title.loop=true;
BGM.title.volume=0.7;
BGM.title.preload="auto";

BGM.stage1.loop=true;
BGM.stage1.volume=0.7;
BGM.stage1.preload="auto";

BGM.boss.loop=true;
BGM.boss.volume=0.7;
BGM.boss.preload="auto";

const VOX={
  engage:new Audio("assets/voices/engage.mp3"),
  gameover:new Audio("assets/voices/gameover.mp3"),
  comboup:new Audio("assets/voices/comboup.mp3"),
  combofinish:new Audio("assets/voices/combofinish.mp3"),
  laserdepleted:new Audio("assets/voices/laserdepleted.mp3"),
  laserready:new Audio("assets/voices/laserready.mp3"),
  warningbossgracioli:new Audio("assets/voices/warningbossgracioli.mp3"),
  congratulations:new Audio("assets/voices/congratulations.mp3"),
  titlescreen:new Audio("assets/voices/titlescreen.mp3")
};

for(const k in VOX){
  VOX[k].preload="auto";
  VOX[k].volume=1.0;
}

let currentBGM=null;
let currentVoice=null;

function playBGM(key){
  const next=BGM[key]||null;
  if(currentBGM===next)return;

  if(currentBGM){
    currentBGM.pause();
    currentBGM.currentTime=0;
  }

  currentBGM=next;

  if(currentBGM){
    currentBGM.play().catch(()=>{});
  }
}

function stopBGM(){
  if(currentBGM){
    currentBGM.pause();
    currentBGM.currentTime=0;
    currentBGM=null;
  }
}

function stopVoice(){
  if(currentVoice){
    currentVoice.pause();
    currentVoice.currentTime=0;
    currentVoice=null;
  }
}

function playVoice(key){
  const a=VOX[key];
  if(!a)return;

  if(currentVoice && currentVoice!==a){
    currentVoice.pause();
    currentVoice.currentTime=0;
  }

  currentVoice=a;
  a.currentTime=0;
  a.play().catch(()=>{});
}

function preloadGameAudio(){
  for(const k in BGM){
    try{ BGM[k].load(); }catch(e){}
  }
  for(const k in VOX){
    try{ VOX[k].load(); }catch(e){}
  }
}