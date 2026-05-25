let appState="loading",titleT=0;
let introFlash=0,introFlashCount=0,introFlashOn=false;
let score=0,medals=0,gameOver=false,lastT=0,phaseT=0;
let stage=0,warnT=0,warnB=0;
let comboX=1,comboT=COMBO_DUR,comboKills=0,comboBossLock=false;
let laserEnergy=LASER_MAX,laserCD=0,laserUsing=false;
let screenFlash=0;
let infiniteLives=false,invincible=false;
let bossDeathT=0,bossDeathPhase="",bossNova=0,bossFadeAlpha=1;
let bossDeathRot=0,bossDeathScale=1,bossNovaStartScale=1;

if(typeof endScreenResetLocked!=="undefined")endScreenResetLocked=false;
if(typeof endScreenResetTimer!=="undefined")endScreenResetTimer=0;

const G={
  player:{x:VW/2-40,y:VH-120,w:80,h:80,spd:280,lMult:0.5,lives:3,inv:0,fire:0,hbr:6,collectR:104},
  pShots:[],eBullets:[],enemies:[],expl:[],medals:[],
  boss:null,spawnT:1.5,waveIdx:0,killN:0
};

function resetGame(){
  stopBGM();
  stopVoice();
  score=0;medals=0;gameOver=false;phaseT=0;
  stage=0;warnT=0;warnB=0;
  comboX=1;comboT=COMBO_DUR;comboKills=0;comboBossLock=false;
  laserEnergy=LASER_MAX;laserCD=0;laserUsing=false;screenFlash=0;
  G.player.x=VW/2-40;G.player.y=VH-120;G.player.lives=3;G.player.inv=0;G.player.fire=0;
  G.pShots=[];G.eBullets=[];G.enemies=[];G.expl=[];G.medals=[];
  G.boss=null;G.spawnT=1.5;G.waveIdx=0;G.killN=0;
  bgSpeedMult=1;bgSpeedTarget=1;
  bossDeathT=0;bossDeathPhase="";bossNova=0;bossFadeAlpha=1;bossDeathRot=0;bossDeathScale=1;bossNovaStartScale=1;
  document.getElementById("boss-hp-wrap").style.display="none";

  titleT=0;
  introFlash=0;
  introFlashCount=0;
  introFlashOn=false;

  if(typeof playerRespawning!=="undefined")playerRespawning=false;
  if(typeof playerRespawnTimer!=="undefined")playerRespawnTimer=0;
  if(typeof playerArriving!=="undefined")playerArriving=false;
  if(typeof playerArrivalPhase!=="undefined")playerArrivalPhase=0;
  if(typeof flgPlayerControl!=="undefined")flgPlayerControl=1;

  if(typeof bossWarningVoicePlayed!=="undefined")bossWarningVoicePlayed=false;
  if(typeof bossMusicDelayTimer!=="undefined")bossMusicDelayTimer=0;
  if(typeof bossMusicQueued!=="undefined")bossMusicQueued=false;
  if(typeof gameCompletedVoicePlayed!=="undefined")gameCompletedVoicePlayed=false;
  if(typeof gameOverVoicePlayed!=="undefined")gameOverVoicePlayed=false;
  if(typeof titleVoicePlayed!=="undefined")titleVoicePlayed=false;
  if(typeof titleBGMStarted!=="undefined")titleBGMStarted=false;
  if(typeof endScreenInputLockTimer!=="undefined")endScreenInputLockTimer=0;

  appState="title";
}