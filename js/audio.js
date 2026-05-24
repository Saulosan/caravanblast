const BGM={
  title:new Audio("assets/bgm/title.mp3"),
  stage1:new Audio("assets/bgm/stage1.mp3"),
  boss:new Audio("assets/bgm/boss.mp3")
};
BGM.title.loop=true;  BGM.title.volume=0.7;
BGM.stage1.loop=true; BGM.stage1.volume=0.7;
BGM.boss.loop=true;   BGM.boss.volume=0.7;

let currentBGM=null;
function playBGM(key){
  if(currentBGM===BGM[key])return; // ja tocando
  if(currentBGM){currentBGM.pause();currentBGM.currentTime=0;}
  currentBGM=BGM[key]||null;
  if(currentBGM)currentBGM.play().catch(()=>{});
}
function stopBGM(){
  if(currentBGM){currentBGM.pause();currentBGM.currentTime=0;currentBGM=null;}
}
