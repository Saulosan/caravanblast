const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
const wrap=document.getElementById("canvas-wrap");
const shell=document.getElementById("shell");
const hudLeft=document.getElementById("hud-left");
const hudRight=document.getElementById("hud-right");
const bezelOverlay=document.getElementById("bezel-overlay");
ctx.imageSmoothingEnabled=false;
canvas.width=VW;
canvas.height=VH;

const gc={
  player:document.getElementById("gc-player"),
  shot:document.getElementById("gc-shot"),
  laser:document.getElementById("gc-laser"),
  laserSpark:document.getElementById("gc-laser-spark"),
  enemy:document.getElementById("gc-enemy"),
  enemy2:document.getElementById("gc-enemy2"),
  enemy3:document.getElementById("gc-enemy3"),
  enemy4:document.getElementById("gc-enemy4"),
  bullet:document.getElementById("gc-bullet"),
  boss:document.getElementById("gc-boss"),
  titleShip:document.getElementById("gc-title-ship"),
  tiro03:document.getElementById("gc-tiro03"),
  tiro04:document.getElementById("gc-tiro04"),
  missile:document.getElementById("gc-missile"),
  capRed:document.getElementById("gc-cap-red"),
  capGreen:document.getElementById("gc-cap-green"),
  capPurple:document.getElementById("gc-cap-purple"),
  capBlue:document.getElementById("gc-cap-blue"),
  capOrange:document.getElementById("gc-cap-orange"),
};

// Spritesheet do player
const playerSheet = new Image();
playerSheet.src = "assets/sprites/player.png";

function rdy(c){return c&&c.width>0&&c.height>0;}
function sw(c,key){if(!rdy(c))return 32;const s=SCALE[key];return s<1?Math.max(1,Math.floor(c.width*s)):c.width*s;}
function sh(c,key){if(!rdy(c))return 32;const s=SCALE[key];return s<1?Math.max(1,Math.floor(c.height*s)):c.height*s;}

const bgLayers=[
  {src:"assets/bg/bg-fase-01.png", speed:20, img:new Image(),scroll:0},
  {src:"assets/bg/bg-fase-01a.png",speed:45, img:new Image(),scroll:0},
  {src:"assets/bg/bg-fase-01b.png",speed:70, img:new Image(),scroll:0},
  {src:"assets/bg/bg-fase-01c.png",speed:100,img:new Image(),scroll:0},
  {src:"assets/bg/bg-fase-01d.png",speed:24, img:new Image(),scroll:0},
];

const GIF_SRCS={
  shot:"assets/sprites/tiro-01.gif",
  laser:"assets/sprites/tiro-02.gif",
  laserSpark:"assets/sprites/laser-spark.gif",
  enemy2:"assets/sprites/Enemy2.gif",
  enemy3:"assets/sprites/Enemy3.gif",
  enemy4:"assets/sprites/Enemy4.gif",
  bullet:"assets/sprites/bullet.gif",
  boss:"assets/sprites/Boss1.gif",
  tiro03:"assets/sprites/tiro-03.gif",
  tiro04:"assets/sprites/tiro-04.gif",
  missile:"assets/sprites/missile-orange.gif",
  capRed:"assets/sprites/power-up-red-1.gif",
  capGreen:"assets/sprites/power-up-green-2.gif",
  capPurple:"assets/sprites/power-up-purple-3.gif",
  capBlue:"assets/sprites/power-up-blue-L.gif",
  capOrange:"assets/sprites/power-up-orange-M.gif",
};

const enemy1Sheet=new Image();
enemy1Sheet.src="assets/sprites/Enemy1.png";
let enemy1Ready=false;

const titleLogo=new Image();
let titleLogoReady=false;
titleLogo.src="assets/sprites/title.png";

const TW=52,TH=28;
function mkThumb(container,label){
  const w=document.createElement("div");w.className="thumb-wrap";
  const l=document.createElement("div");l.className="thumb-label";l.textContent=label;
  const c=document.createElement("canvas");c.className="thumb-canvas";c.width=TW;c.height=TH;
  w.appendChild(l);w.appendChild(c);container.appendChild(w);return c;
}
function updThumb(cvs,src,ok){
  const tc=cvs.getContext("2d");tc.imageSmoothingEnabled=false;tc.clearRect(0,0,TW,TH);
  if(ok&&src&&(src.naturalWidth||src.width)>0){tc.drawImage(src,0,0,TW,TH);cvs.classList.add("thumb-ok");cvs.classList.remove("thumb-err");}
  else{tc.fillStyle="#300";tc.fillRect(0,0,TW,TH);tc.fillStyle="#f55";tc.font="8px monospace";tc.fillText("ERR",4,18);cvs.classList.add("thumb-err");cvs.classList.remove("thumb-ok");}
}

let bgReady=0,gifReady=0,sheetReady=0;
const TOTAL_GIFS=Object.keys(GIF_SRCS).length;
const TOTAL_SHEETS=1;
const gifThumbs={};
let bgSpeedMult=1,bgSpeedTarget=1;

let titleShipReady=false;

(function loadTitleShip(){
  if(!window.gifler||!gc.titleShip)return;
  gifler("assets/sprites/Caravan-title.gif").frames(gc.titleShip,(c2,f)=>{
    gc.titleShip.width=f.width;gc.titleShip.height=f.height;
    c2.clearRect(0,0,f.width,f.height);c2.drawImage(f.buffer,0,0);
    titleShipReady=true;
  },true);
})();

function initAssets(onReady){
  const dbgBG=document.getElementById("dbg-bg");
  const dbgSpr=document.getElementById("dbg-spr");

  bgLayers.forEach(l=>{
    l.thumb=mkThumb(dbgBG,l.src.split("/").pop());
    l.img.onload=()=>{bgReady++;updThumb(l.thumb,l.img,true);checkReady(onReady);};
    l.img.onerror=()=>{bgReady++;updThumb(l.thumb,null,false);checkReady(onReady);};
    l.img.src=l.src;
  });

  const playerThumbCvs=mkThumb(dbgSpr,"player.png");
  playerSheet.onload=()=>{updThumb(playerThumbCvs,playerSheet,true);};
  playerSheet.onerror=()=>{updThumb(playerThumbCvs,null,false);};

  const enemy1ThumbCvs=mkThumb(dbgSpr,"Enemy1.png");
  enemy1Sheet.onload=()=>{enemy1Ready=true;sheetReady++;updThumb(enemy1ThumbCvs,enemy1Sheet,true);checkReady(onReady);};
  enemy1Sheet.onerror=()=>{sheetReady++;updThumb(enemy1ThumbCvs,null,false);checkReady(onReady);};

  const titleLogoThumbCvs=mkThumb(dbgSpr,"title.png");
  titleLogo.onload=()=>{titleLogoReady=true;updThumb(titleLogoThumbCvs,titleLogo,true);};
  titleLogo.onerror=()=>{updThumb(titleLogoThumbCvs,null,false);};

  Object.entries(GIF_SRCS).forEach(([key,src])=>{
    gifThumbs[key]=mkThumb(dbgSpr,src.split("/").pop());
    let first=true;
    gifler(src).frames(gc[key],(c2,f)=>{
      gc[key].width=f.width;gc[key].height=f.height;
      c2.clearRect(0,0,f.width,f.height);c2.drawImage(f.buffer,0,0);
      if(first){first=false;gifReady++;updThumb(gifThumbs[key],gc[key],true);checkReady(onReady);}
    },true);
    setInterval(()=>{if(rdy(gc[key]))updThumb(gifThumbs[key],gc[key],true);},300);
  });
}

function checkReady(onReady){if(bgReady>=5&&gifReady>=TOTAL_GIFS&&sheetReady>=TOTAL_SHEETS)onReady();}

function resize(){
  const W=window.innerWidth;
  const H=window.innerHeight;
  const g=computeGameLayout(W,H);
  applyGameLayout(g,H,isBezelActive());
  updateGameAreaGuide(g);
}
window.addEventListener("resize",resize);