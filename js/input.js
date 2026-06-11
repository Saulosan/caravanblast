const K={};
let gpConnected=false;
const gpInd=document.getElementById("gp-indicator");

window.addEventListener("gamepadconnected",e=>{
  gpConnected=true;
  gpInd.textContent="🎮 "+e.gamepad.id.slice(0,22);
  gpInd.classList.add("on");
  if(appState==="title")titleGpMsgT=TITLE_GP_MSG_DUR;
});

window.addEventListener("gamepaddisconnected",()=>{
  gpConnected=false;
  gpInd.textContent="🎮 sem controle";
  gpInd.classList.remove("on");
});

// Estado anterior dos botoes para detectar pressao
const gpPrev={start:false,select:false,a:false,up:false,down:false,left:false,right:false};

function readGamepad(){
  const gps=navigator.getGamepads();
  let gp=null;
  for(let i=0;i<gps.length;i++){
    if(gps[i]){
      gp=gps[i];
      break;
    }
  }
  if(!gp)return;

  // ── Eixos analógicos (Xbox One XInput) ──────────────────────────────────
  // Eixo 0: Analog L horizontal  (-1=esq, +1=dir)
  // Eixo 1: Analog L vertical    (-1=cima, +1=baixo)
  const axLX=gp.axes[0]||0;
  const axLY=gp.axes[1]||0;

  // D-Pad no Xbox via Gamepad API vem como botões 12-15
  // buttons[12]=cima 13=baixo 14=esq 15=dir
  const dUp=gp.buttons[12]?.pressed||false;
  const dDown=gp.buttons[13]?.pressed||false;
  const dLeft=gp.buttons[14]?.pressed||false;
  const dRight=gp.buttons[15]?.pressed||false;

  const DEAD=0.25;

  K["ArrowLeft"]=dLeft||axLX<-DEAD;
  K["ArrowRight"]=dRight||axLX>DEAD;
  K["ArrowUp"]=dUp||axLY<-DEAD;
  K["ArrowDown"]=dDown||axLY>DEAD;

  // ── Botoes de acao (Xbox One XInput) ────────────────────────────────────
  // buttons[0] = A  → Tiro
  // buttons[1] = B
  // buttons[2] = X  → Laser
  // buttons[3] = Y
  // buttons[4] = LB
  // buttons[5] = RB → Tiro alternativo
  // buttons[6] = LT (trigger, valor 0..1)
  // buttons[7] = RT (trigger, valor 0..1) → Laser alternativo
  // buttons[8] = Select/Back
  // buttons[9] = Start

  K["KeyX"]=gp.buttons[0]?.pressed||gp.buttons[5]?.pressed||((gp.buttons[7]?.value||0)>0.5);
  K["KeyC"]=gp.buttons[2]?.pressed||gp.buttons[4]?.pressed||((gp.buttons[6]?.value||0)>0.5);

  // Start/Select: detecta borda de subida para nao repetir
  const startNow=gp.buttons[9]?.pressed||false;
  const selectNow=gp.buttons[8]?.pressed||false;

  const aNow=gp.buttons[0]?.pressed||false;
  const upNow=gp.buttons[12]?.pressed||false;
  const downNow=gp.buttons[13]?.pressed||false;
  const leftNow=gp.buttons[14]?.pressed||false;
  const rightNow=gp.buttons[15]?.pressed||false;

  if(startNow&&!gpPrev.start){
    if(appState==="game"||appState==="paused"){
      togglePause();
    } else if(appState==="options"){
      closeOptionsMenu();
    } else if(appState==="title"){
      titleMenuConfirm();
    } else if(appState==="intro"){
      skipIntroToGame();
    } else if(appState==="gameover"||appState==="win"){
      endMenuConfirm();
    }
  }

  if(appState==="paused" || appState==="options"){
    if((upNow&&!gpPrev.up))pauseMenuMove(-1);
    if((downNow&&!gpPrev.down))pauseMenuMove(1);
    if((leftNow&&!gpPrev.left))pauseMenuAdjust(-1);
    if((rightNow&&!gpPrev.right))pauseMenuAdjust(1);
    if(aNow&&!gpPrev.a)pauseMenuConfirm();
  } else if(appState==="title"){
    if(titleExitConfirm){
      if((leftNow&&!gpPrev.left)||(rightNow&&!gpPrev.right))titleMenuAdjust(rightNow?1:-1);
      if(aNow&&!gpPrev.a)titleMenuConfirm();
    }else{
      if((upNow&&!gpPrev.up))titleMenuMove(-1);
      if((downNow&&!gpPrev.down))titleMenuMove(1);
      if(aNow&&!gpPrev.a)titleMenuConfirm();
    }
  } else if(appState==="gameover"||appState==="win"){
    if((upNow&&!gpPrev.up))endMenuMove(-1);
    if((downNow&&!gpPrev.down))endMenuMove(1);
    if(aNow&&!gpPrev.a)endMenuConfirm();
  } else if(appState==="intro" && !isScreenTransitionBlockingInput()){
    if(aNow&&!gpPrev.a)skipIntroToGame();
  }

  gpPrev.start=startNow;
  gpPrev.select=selectNow;
  gpPrev.a=aNow;
  gpPrev.up=upNow;
  gpPrev.down=downNow;
  gpPrev.left=leftNow;
  gpPrev.right=rightNow;
}

// ── Teclado ────────────────────────────────────────────────────────────────
window.addEventListener("keydown",e=>{
  K[e.code]=true;

  if([
    "ArrowUp","ArrowDown","ArrowLeft","ArrowRight",
    "KeyX","KeyC","Space","KeyB","KeyN","KeyM","KeyP","KeyJ","KeyH","KeyK","KeyL","Enter","Escape"
  ].includes(e.code)){
    e.preventDefault();
  }

  if((appState==="game"||appState==="paused")&&["KeyJ","KeyH","KeyK","KeyL"].includes(e.code)){
    handleWeaponDebugKey(e.code);
    if(appState==="paused")pauseFrameDirty=true;
    return;
  }

  if(e.code==="KeyP"){
    if(appState==="game"||appState==="paused")togglePause();
    return;
  }

  if(appState==="intro" && !isScreenTransitionBlockingInput()){
    skipIntroToGame();
    return;
  }

  if(appState==="title"){
    if(titleExitConfirm){
      if(e.code==="ArrowLeft"||e.code==="ArrowRight")titleMenuAdjust(e.code==="ArrowRight"?1:-1);
      else if(e.code==="Enter"||e.code==="Space"||e.code==="KeyX")titleMenuConfirm();
      else if(e.code==="Escape")titleMenuCancel();
    }else{
      if(e.code==="ArrowUp")titleMenuMove(-1);
      else if(e.code==="ArrowDown")titleMenuMove(1);
      else if(e.code==="Enter"||e.code==="Space"||e.code==="KeyX")titleMenuConfirm();
    }
    return;
  }

  if(appState==="paused" || appState==="options"){
    if(e.code==="ArrowUp")pauseMenuMove(-1);
    else if(e.code==="ArrowDown")pauseMenuMove(1);
    else if(e.code==="ArrowLeft")pauseMenuAdjust(-1);
    else if(e.code==="ArrowRight")pauseMenuAdjust(1);
    else if(e.code==="Enter"||e.code==="KeyX"||e.code==="Space")pauseMenuConfirm();
    else if(e.code==="Escape"){
      if(appState==="options"){
        if(!settingsMenuCancel())closeOptionsMenu();
      }else if(appState==="paused"){
        if(!settingsMenuCancel())togglePause();
      }
    }
    return;
  }

  if(appState==="gameover"||appState==="win"){
    if(e.code==="ArrowUp")endMenuMove(-1);
    else if(e.code==="ArrowDown")endMenuMove(1);
    else if(e.code==="Enter"||e.code==="Space"||e.code==="KeyX")endMenuConfirm();
    return;
  }

  if(e.code==="KeyB"&&stage===0){
    doBossSkip(true);
  }

  if(e.code==="KeyN"){
    infiniteLives=!infiniteLives;
    document.getElementById("dbg-lives-lbl").classList.toggle("dbg-on",infiniteLives);
  }

  if(e.code==="KeyM"){
    invincible=!invincible;
    document.getElementById("dbg-inv-lbl").classList.toggle("dbg-on",invincible);
  }
});

window.addEventListener("keyup",e=>{
  K[e.code]=false;
});