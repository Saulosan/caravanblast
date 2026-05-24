const K={};
let gpConnected=false;
const gpInd=document.getElementById("gp-indicator");

window.addEventListener("gamepadconnected",e=>{
  gpConnected=true;
  gpInd.textContent="🎮 "+e.gamepad.id.slice(0,22);
  gpInd.classList.add("on");
});
window.addEventListener("gamepaddisconnected",()=>{
  gpConnected=false;
  gpInd.textContent="🎮 sem controle";
  gpInd.classList.remove("on");
});

// Estado anterior dos botoes para detectar pressao (evita disparo continuo no menu)
const gpPrev={start:false,select:false};

function readGamepad(){
  const gps=navigator.getGamepads();
  let gp=null;
  for(let i=0;i<gps.length;i++){if(gps[i]){gp=gps[i];break;}}
  if(!gp)return;

  // ── Eixos analógicos (Xbox One XInput) ──────────────────────────────────
  // Eixo 0: Analog L horizontal  (-1=esq, +1=dir)
  // Eixo 1: Analog L vertical    (-1=cima, +1=baixo)
  const axLX = gp.axes[0] || 0;
  const axLY = gp.axes[1] || 0;

  // D-Pad no Xbox via Gamepad API vem como botões 12-15
  // buttons[12]=cima 13=baixo 14=esq 15=dir
  const dUp    = gp.buttons[12]?.pressed || false;
  const dDown  = gp.buttons[13]?.pressed || false;
  const dLeft  = gp.buttons[14]?.pressed || false;
  const dRight = gp.buttons[15]?.pressed || false;

  const DEAD = 0.25;

  K["ArrowLeft"]  = dLeft  || axLX < -DEAD;
  K["ArrowRight"] = dRight || axLX >  DEAD;
  K["ArrowUp"]    = dUp    || axLY < -DEAD;
  K["ArrowDown"]  = dDown  || axLY >  DEAD;

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

  K["KeyX"] = gp.buttons[0]?.pressed || gp.buttons[5]?.pressed || (gp.buttons[7]?.value||0) > 0.5;
  K["KeyC"] = gp.buttons[2]?.pressed || gp.buttons[4]?.pressed || (gp.buttons[6]?.value||0) > 0.5;

  // Start/Select: detecta borda de subida para nao repetir
  const startNow  = gp.buttons[9]?.pressed || false;
  const selectNow = gp.buttons[8]?.pressed || false;

  if(startNow && !gpPrev.start){
    if(appState==="title")     startFromTitle();
    else if(appState==="gameover") resetGame();
    else if(appState==="win")      resetGame();
  }
  gpPrev.start  = startNow;
  gpPrev.select = selectNow;
}

// ── Teclado ─────────────────────────────────────────────────────────────────
window.addEventListener("keydown",e=>{
  K[e.code]=true;
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight",
      "KeyX","KeyC","Space","KeyB","KeyN","KeyM"].includes(e.code))
    e.preventDefault();

  if(appState==="title"){startFromTitle();return;}
  if(appState==="gameover"){resetGame();return;}
  if(appState==="win"){resetGame();return;}

  if(e.code==="KeyB"&&stage===0) doBossSkip();
  if(e.code==="KeyN"){
    infiniteLives=!infiniteLives;
    document.getElementById("dbg-lives-lbl").classList.toggle("dbg-on",infiniteLives);
  }
  if(e.code==="KeyM"){
    invincible=!invincible;
    document.getElementById("dbg-inv-lbl").classList.toggle("dbg-on",invincible);
  }
});

window.addEventListener("keyup",e=>{K[e.code]=false;});
