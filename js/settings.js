// ============================================================
// SETTINGS — pause / options (menus em subníveis)
// ============================================================

let settingsItemIdx=0;
let settingsSubMenu=null;
let bezelIdx=0;
let bezelPanX=0;
let bezelPanY=0;
let bezelStretchX=1;
let bezelStretchY=1;
let fullscreenOn=false;

const OPTIONS_ROOT_ITEMS=[
  {id:"catGraphics",label:"Gráficos",type:"submenu",cat:"graphics"},
  {id:"catAudio",label:"Audio",type:"submenu",cat:"audio"},
  {id:"catGameplay",label:"Gameplay",type:"submenu",cat:"gameplay"},
  {id:"back",label:"Voltar",type:"action"}
];

const PAUSE_ROOT_ITEMS=[
  {id:"resume",label:"Continuar",type:"action"},
  {id:"catGraphics",label:"Gráficos",type:"submenu",cat:"graphics"},
  {id:"catAudio",label:"Audio",type:"submenu",cat:"audio"},
  {id:"catGameplay",label:"Gameplay",type:"submenu",cat:"gameplay"},
  {id:"title",label:"Voltar ao título",type:"action"}
];

const BEZEL_SUB_ITEMS=[
  {id:"bezelBack",label:"Voltar",type:"action"},
  {id:"bezelAuto",label:"Bezel Auto Alinhar",type:"action"},
  {id:"bezelPanX",label:"Bezel Pos X",type:"slider"},
  {id:"bezelPanY",label:"Bezel Pos Y",type:"slider"},
  {id:"bezelScaleX",label:"Bezel Escala X",type:"slider"},
  {id:"bezelScaleY",label:"Bezel Escala Y",type:"slider"}
];

const SETTINGS_TABS=[
  {
    id:"graphics",
    label:"Gráficos",
    items:[
      {id:"fullscreen",label:"Tela cheia",type:"toggle"},
      {id:"bezel",label:"Overlay",type:"cycle"},
      {id:"scanlines",label:"Scanlines",type:"toggle"},
      {id:"scanInt",label:"Int. Scanlines",type:"slider"},
      {id:"curve",label:"Curvatura CRT",type:"toggle"},
      {id:"curveInt",label:"Int. Curvatura",type:"slider"},
      {id:"bleed",label:"Color Bleeding",type:"toggle"},
      {id:"bleedInt",label:"Int. Bleeding",type:"slider"},
      {id:"colorFilter",label:"Filtro de Cor",type:"cycle"},
      {id:"brightness",label:"Brilho",type:"slider"},
      {id:"contrast",label:"Contraste",type:"slider"},
      {id:"displayFps",label:"Display FPS",type:"toggle"},
      {id:"gfxReset",label:"Restaurar padrão",type:"action"}
    ]
  },
  {
    id:"audio",
    label:"Audio",
    items:[
      {id:"volMusic",label:"Volume Músicas",type:"slider"},
      {id:"volSfx",label:"Volume Efeitos",type:"slider"}
    ]
  },
  {
    id:"gameplay",
    label:"Gameplay",
    items:[
      {id:"cheatBoss",label:"Ir ao Boss",type:"action"},
      {id:"cheatLives",label:"Vidas infinitas",type:"toggle"},
      {id:"cheatInv",label:"Invencibilidade",type:"toggle"}
    ]
  }
];

function resetSettingsMenuNav(){
  settingsItemIdx=0;
  settingsSubMenu=null;
}

function getTabItemsByCat(catId){
  if(catId==="graphics"){
    const items=SETTINGS_TABS[0].items.slice();
    if(bezelIdx>0){
      items.splice(2,0,{id:"bezelAdjust",label:"Ajustar Bezel",type:"action"});
    }
    return items;
  }
  const tab=SETTINGS_TABS.find(t=>t.id===catId);
  return tab?tab.items.slice():[];
}

function getSettingsNavItems(isOptions){
  if(settingsSubMenu==="bezel")return BEZEL_SUB_ITEMS.slice();
  if(settingsSubMenu){
    return [...getTabItemsByCat(settingsSubMenu),{id:"subBack",label:"Voltar",type:"action"}];
  }
  return isOptions?OPTIONS_ROOT_ITEMS.slice():PAUSE_ROOT_ITEMS.slice();
}

function getSettingsMenuHeader(isOptions){
  if(settingsSubMenu==="bezel")return "AJUSTE BEZEL";
  if(settingsSubMenu){
    const tab=SETTINGS_TABS.find(t=>t.id===settingsSubMenu);
    if(tab)return tab.label;
  }
  return isOptions?"OPTIONS":"PAUSADO";
}

function getSettingsItemText(item){
  if(item.id==="fullscreen")return item.label+": "+(fullscreenOn?"ON":"OFF");
  if(item.id==="bezel")return item.label+": "+getBezelLabel();
  if(item.id==="bezelPanX")return item.label+": "+Math.round(bezelPanX)+"px";
  if(item.id==="bezelPanY")return item.label+": "+Math.round(bezelPanY)+"px";
  if(item.id==="bezelScaleX")return item.label+": "+Math.round(bezelStretchX*100)+"%";
  if(item.id==="bezelScaleY")return item.label+": "+Math.round(bezelStretchY*100)+"%";
  if(item.id==="scanlines")return item.label+": "+(fxScanlinesOn?"ON":"OFF");
  if(item.id==="curve")return item.label+": "+(fxCurveOn?"ON":"OFF");
  if(item.id==="scanInt")return item.label+": "+Math.round(fxScanlinesIntensity*100)+"%";
  if(item.id==="curveInt")return item.label+": "+Math.round(fxCurveIntensity*100)+"%";
  if(item.id==="bleed")return item.label+": "+(fxBleedOn?"ON":"OFF");
  if(item.id==="bleedInt")return item.label+": "+Math.round(fxBleedIntensity*100)+"%";
  if(item.id==="colorFilter")return item.label+": "+getColorFilterLabel();
  if(item.id==="brightness")return item.label+": "+Math.round(fxBrightness*100)+"%";
  if(item.id==="contrast")return item.label+": "+Math.round(fxContrast*100)+"%";
  if(item.id==="displayFps")return item.label+": "+(displayFpsOn?"ON":"OFF");
  if(item.id==="volMusic")return item.label+": "+Math.round(globalMusicVol*100)+"%";
  if(item.id==="volSfx")return item.label+": "+Math.round(globalSfxVol*100)+"%";
  if(item.id==="cheatLives")return item.label+": "+(infiniteLives?"ON":"OFF");
  if(item.id==="cheatInv")return item.label+": "+(invincible?"ON":"OFF");
  return item.label;
}

function settingsItemUsesHorizontal(item){
  return item.type==="slider"||item.type==="toggle"||item.type==="cycle";
}

function settingsSliderPct(item){
  if(item.id==="scanInt")return fxScanlinesIntensity;
  if(item.id==="curveInt")return fxCurveIntensity;
  if(item.id==="bleedInt")return fxBleedIntensity;
  if(item.id==="brightness")return fxBrightness;
  if(item.id==="contrast")return fxContrast;
  if(item.id==="volMusic")return globalMusicVol;
  if(item.id==="volSfx")return globalSfxVol;
  if(item.id==="bezelPanX")return(bezelPanX+BEZEL_PAN_MAX)/(BEZEL_PAN_MAX*2);
  if(item.id==="bezelPanY")return(bezelPanY+BEZEL_PAN_MAX)/(BEZEL_PAN_MAX*2);
  if(item.id==="bezelScaleX")return(bezelStretchX-BEZEL_STRETCH_MIN)/(BEZEL_STRETCH_MAX-BEZEL_STRETCH_MIN);
  if(item.id==="bezelScaleY")return(bezelStretchY-BEZEL_STRETCH_MIN)/(BEZEL_STRETCH_MAX-BEZEL_STRETCH_MIN);
  return 0;
}

function clampSettingsItemIdx(){
  if(appState!=="paused"&&appState!=="options")return;
  const items=getSettingsNavItems(appState==="options");
  if(settingsItemIdx>=items.length)settingsItemIdx=Math.max(0,items.length-1);
}

function refreshBezelGuide(){
  updateGameAreaGuide(computeGameLayout(window.innerWidth,window.innerHeight));
}

function settingsMenuMove(dir){
  if(appState!=="paused"&&appState!=="options")return;
  const isOptions=appState==="options";
  const items=getSettingsNavItems(isOptions);
  const prev=settingsItemIdx;
  settingsItemIdx=(settingsItemIdx+dir+items.length)%items.length;
  if(settingsItemIdx!==prev)playSelectSfx();
  refreshBezelGuide();
}

function settingsMenuCancel(){
  if(!settingsSubMenu)return false;
  if(settingsSubMenu==="bezel"){
    settingsSubMenu="graphics";
  }else{
    settingsSubMenu=null;
  }
  settingsItemIdx=0;
  playSelectSfx();
  setPauseDirty();
  refreshBezelGuide();
  return true;
}

function settingsToggleBool(getVal,setVal,dir){
  if(!dir)return;
  setVal(!getVal());
  playSelectSfx();
  setPauseDirty();
}

function settingsMenuAdjust(dir){
  if(appState!=="paused"&&appState!=="options")return;
  if(!dir)return;
  const isOptions=appState==="options";
  const items=getSettingsNavItems(isOptions);
  const item=items[settingsItemIdx];
  if(!item||!settingsItemUsesHorizontal(item))return;

  if(item.id==="scanInt"){
    fxScanlinesIntensity=clamp(fxScanlinesIntensity+dir*0.05,0,1);
    setPauseDirty();
  }else if(item.id==="curveInt"){
    fxCurveIntensity=clamp(fxCurveIntensity+dir*0.05,0,1);
    setPauseDirty();
  }else if(item.id==="bleedInt"){
    fxBleedIntensity=clamp(fxBleedIntensity+dir*0.05,0,1);
    setPauseDirty();
  }else if(item.id==="brightness"){
    fxBrightness=clamp(fxBrightness+dir*0.05,0,1);
    applyDisplayBC();
    setPauseDirty();
  }else if(item.id==="contrast"){
    fxContrast=clamp(fxContrast+dir*0.05,0,1);
    applyDisplayBC();
    setPauseDirty();
  }else if(item.id==="displayFps"){
    settingsToggleBool(()=>displayFpsOn,v=>{displayFpsOn=v;},dir);
  }else if(item.id==="colorFilter"){
    cycleColorFilter(dir);
    playSelectSfx();
    setPauseDirty();
  }else if(item.id==="volMusic"){
    globalMusicVol=clamp(globalMusicVol+dir*0.05,0,1);
    applyGlobalVolumes();
    setPauseDirty();
  }else if(item.id==="volSfx"){
    globalSfxVol=clamp(globalSfxVol+dir*0.05,0,1);
    applyGlobalVolumes();
    setPauseDirty();
  }else if(item.id==="bezel"){
    cycleBezel(dir);
    if(!bezelIdx)settingsSubMenu="graphics";
    playSelectSfx();
    setPauseDirty();
  }else if(item.id==="bezelPanX"){
    bezelPanX=clamp(bezelPanX+dir*BEZEL_PAN_STEP,-BEZEL_PAN_MAX,BEZEL_PAN_MAX);
    resize();
    setPauseDirty();
  }else if(item.id==="bezelPanY"){
    bezelPanY=clamp(bezelPanY+dir*BEZEL_PAN_STEP,-BEZEL_PAN_MAX,BEZEL_PAN_MAX);
    resize();
    setPauseDirty();
  }else if(item.id==="bezelScaleX"){
    bezelStretchX=clamp(bezelStretchX+dir*BEZEL_STRETCH_STEP,BEZEL_STRETCH_MIN,BEZEL_STRETCH_MAX);
    resize();
    setPauseDirty();
  }else if(item.id==="bezelScaleY"){
    bezelStretchY=clamp(bezelStretchY+dir*BEZEL_STRETCH_STEP,BEZEL_STRETCH_MIN,BEZEL_STRETCH_MAX);
    resize();
    setPauseDirty();
  }else if(item.id==="scanlines"){
    settingsToggleBool(()=>fxScanlinesOn,v=>{fxScanlinesOn=v;},dir);
  }else if(item.id==="curve"){
    settingsToggleBool(()=>fxCurveOn,v=>{fxCurveOn=v;},dir);
  }else if(item.id==="bleed"){
    settingsToggleBool(()=>fxBleedOn,v=>{fxBleedOn=v;},dir);
  }else if(item.id==="fullscreen"){
    toggleFullscreenSetting();
    playSelectSfx();
  }else if(item.id==="cheatLives"){
    settingsToggleBool(()=>infiniteLives,v=>{
      infiniteLives=v;
      document.getElementById("dbg-lives-lbl").classList.toggle("dbg-on",infiniteLives);
    },dir);
  }else if(item.id==="cheatInv"){
    settingsToggleBool(()=>invincible,v=>{
      invincible=v;
      document.getElementById("dbg-inv-lbl").classList.toggle("dbg-on",invincible);
    },dir);
  }
}

async function toggleFullscreenSetting(){
  try{
    if(!document.fullscreenElement){
      await document.documentElement.requestFullscreen();
      fullscreenOn=true;
    }else{
      await document.exitFullscreen();
      fullscreenOn=false;
    }
  }catch(e){
    fullscreenOn=!!document.fullscreenElement;
  }
  setPauseDirty();
  resize();
}

function settingsMenuConfirm(){
  if(appState!=="paused"&&appState!=="options")return;
  const isOptions=appState==="options";
  const items=getSettingsNavItems(isOptions);
  const item=items[settingsItemIdx];
  if(!item)return;

  if(item.type==="submenu"){
    settingsSubMenu=item.cat;
    settingsItemIdx=0;
    playSelectSfx();
    setPauseDirty();
    refreshBezelGuide();
    return;
  }
  if(item.type!=="action")return;

  if(item.id==="resume")togglePause();
  else if(item.id==="title")beginScreenTransition(()=>{resetGame();});
  else if(item.id==="back")closeOptionsMenu();
  else if(item.id==="subBack"){
    settingsSubMenu=null;
    settingsItemIdx=0;
    playSelectSfx();
    setPauseDirty();
    refreshBezelGuide();
  }
  else if(item.id==="bezelAdjust"){settingsSubMenu="bezel";settingsItemIdx=0;playSelectSfx();setPauseDirty();refreshBezelGuide();}
  else if(item.id==="bezelBack"){settingsSubMenu="graphics";settingsItemIdx=0;playSelectSfx();setPauseDirty();refreshBezelGuide();}
  else if(item.id==="bezelAuto"){autoAlignBezel();resize();setPauseDirty();}
  else if(item.id==="gfxReset"){resetGraphicsDefaults();playSelectSfx();}
  else if(item.id==="cheatBoss"){if(stage===0)doBossSkip(true);setPauseDirty();}
}

document.addEventListener("fullscreenchange",()=>{
  fullscreenOn=!!document.fullscreenElement;
  setPauseDirty();
  resize();
});

function quitGame(){
  try{
    window.open("","_self");
    window.close();
  }catch(e){}
  setTimeout(()=>{
    alert("Nao foi possivel fechar automaticamente.\nFeche a aba ou janela do navegador manualmente.");
  },250);
}
