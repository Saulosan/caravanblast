// ============================================================
// POST-FX — CRT, filtros de cor e brilho/contraste (CSS)
// ============================================================

const postFxCvs=document.createElement("canvas");

const NES_RGB=[
  [84,84,84],[0,30,116],[8,16,144],[48,0,136],[68,0,100],[92,0,48],[84,4,0],[60,24,0],
  [32,42,0],[8,58,0],[0,64,0],[0,60,0],[0,50,88],[0,0,0],[0,0,0],[0,0,0],
  [152,150,152],[8,76,196],[48,50,236],[92,30,228],[136,20,176],[160,20,100],[152,34,32],[120,60,0],
  [84,90,0],[40,114,0],[8,124,0],[0,118,40],[0,102,120],[0,0,0],[0,0,0],[0,0,0],
  [236,238,236],[76,154,236],[120,124,236],[176,98,236],[228,84,236],[236,88,180],[236,106,100],[212,136,32],
  [160,180,0],[116,208,0],[76,220,72],[56,204,137],[56,180,204],[60,60,60],[0,0,0],[0,0,0],
  [236,238,236],[168,204,236],[188,188,236],[212,178,236],[236,174,236],[236,174,212],[236,180,176],[228,196,144],
  [204,210,120],[180,222,120],[168,226,144],[152,226,180],[160,214,228],[160,162,160],[0,0,0],[0,0,0]
];

const DMG_PAL=[[15,56,15],[48,98,48],[139,172,15],[155,188,15]];
const VBOY_PAL=[[0,0,0],[68,0,0],[136,0,0],[255,32,32]];
const nesLookup=new Uint8Array(4096*3);

function postFxActive(){
  return fxScanlinesOn||fxCurveOn||fxBleedOn||colorFilterIdx>0;
}

function getColorFilterLabel(){
  return COLOR_FILTERS[colorFilterIdx].label;
}

function cycleColorFilter(dir){
  colorFilterIdx=(colorFilterIdx+dir+COLOR_FILTERS.length)%COLOR_FILTERS.length;
}

function applyDisplayBC(){
  const wrap=document.getElementById("canvas-wrap");
  if(!wrap)return;
  const parts=[];
  if(Math.abs(fxBrightness-0.5)>0.001){
    parts.push("brightness("+(100+(fxBrightness-0.5)*160)+"%)");
  }
  if(Math.abs(fxContrast-0.5)>0.001){
    parts.push("contrast("+(100+(fxContrast-0.5)*150)+"%)");
  }
  wrap.style.filter=parts.length?parts.join(" "):"";
}

function resetGraphicsDefaults(){
  fxScanlinesOn=true;
  fxCurveOn=false;
  fxScanlinesIntensity=0.35;
  fxCurveIntensity=0.22;
  fxBleedOn=false;
  fxBleedIntensity=0.35;
  colorFilterIdx=0;
  fxBrightness=0.5;
  fxContrast=0.5;
  displayFpsOn=false;
  applyDisplayBC();
  if(typeof setPauseDirty==="function")setPauseDirty();
}

function fxLum(r,g,b){
  return 0.299*r+0.587*g+0.114*b;
}

function nearestNES(r,g,b){
  let best=0,bestD=1e9;
  for(let j=0;j<NES_RGB.length;j++){
    const pr=NES_RGB[j][0],pg=NES_RGB[j][1],pb=NES_RGB[j][2];
    const dist=(r-pr)*(r-pr)+(g-pg)*(g-pg)+(b-pb)*(b-pb);
    if(dist<bestD){bestD=dist;best=j;}
  }
  return NES_RGB[best];
}

function buildNESLookup(){
  for(let ri=0;ri<16;ri++){
    for(let gi=0;gi<16;gi++){
      for(let bi=0;bi<16;bi++){
        const r=ri*17,g=gi*17,b=bi*17;
        const c=nearestNES(r,g,b);
        const idx=(ri<<8)|(gi<<4)|bi;
        nesLookup[idx*3]=c[0];
        nesLookup[idx*3+1]=c[1];
        nesLookup[idx*3+2]=c[2];
      }
    }
  }
}
buildNESLookup();

function applyColorFilterImageData(data,filterId){
  const d=data.data;
  if(filterId==="dmg"){
    for(let i=0;i<d.length;i+=4){
      const l=fxLum(d[i],d[i+1],d[i+2]);
      const idx=l<64?0:l<128?1:l<192?2:3;
      d[i]=DMG_PAL[idx][0];d[i+1]=DMG_PAL[idx][1];d[i+2]=DMG_PAL[idx][2];
    }
  }else if(filterId==="vboy"){
    for(let i=0;i<d.length;i+=4){
      const l=fxLum(d[i],d[i+1],d[i+2]);
      const idx=l<64?0:l<128?1:l<192?2:3;
      d[i]=VBOY_PAL[idx][0];d[i+1]=VBOY_PAL[idx][1];d[i+2]=VBOY_PAL[idx][2];
    }
  }else if(filterId==="bw"){
    for(let i=0;i<d.length;i+=4){
      const l=Math.round(fxLum(d[i],d[i+1],d[i+2]));
      d[i]=l;d[i+1]=l;d[i+2]=l;
    }
  }else if(filterId==="nes"){
    for(let i=0;i<d.length;i+=4){
      const idx=((d[i]>>4)<<8)|((d[i+1]>>4)<<4)|(d[i+2]>>4);
      d[i]=nesLookup[idx*3];
      d[i+1]=nesLookup[idx*3+1];
      d[i+2]=nesLookup[idx*3+2];
    }
  }
}

function applyColorBleedImageData(data,w,h,amount){
  const s=data.data;
  const out=new Uint8ClampedArray(s.length);
  const off=Math.max(1,Math.round(1+amount*4));
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i=(y*w+x)*4;
      const xr=Math.max(0,Math.min(w-1,x-off));
      const xb=Math.max(0,Math.min(w-1,x+off));
      const ir=(y*w+xr)*4;
      const ib=(y*w+xb)*4;
      out[i]=s[ir];
      out[i+1]=s[i+1];
      out[i+2]=s[ib+2];
      out[i+3]=s[i+3];
    }
  }
  s.set(out);
}

function drawCRTCurve(srcCvs){
  const strips=120;
  for(let i=0;i<strips;i++){
    const sy=(i/strips)*VH;
    const shh=Math.ceil(VH/strips)+1;
    const ny=(i/(strips-1))*2-1;
    const curve=(ny*ny);
    const inset=Math.floor(curve*VW*0.035*fxCurveIntensity*4);
    const wobble=Math.floor((1-curve)*2*fxCurveIntensity);
    const dx=inset,dy=sy+wobble,dw=VW-inset*2;
    if(dw<=0)continue;
    ctx.drawImage(srcCvs,0,sy,VW,shh+1,dx,dy,dw,shh+1);
  }
  const vign=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.28,VW/2,VH/2,Math.max(VW,VH)*0.65);
  vign.addColorStop(0,"rgba(0,0,0,0)");
  vign.addColorStop(1,"rgba(0,0,0,"+(0.16+fxCurveIntensity*0.24)+")");
  ctx.fillStyle=vign;
  ctx.fillRect(0,0,VW,VH);
}

function drawScanlines(){
  const a=0.04+fxScanlinesIntensity*0.30;
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,"+a+")";
  for(let y=0;y<VH;y+=3){
    ctx.fillRect(0,y,VW,1);
  }
  ctx.globalAlpha=0.07+fxScanlinesIntensity*0.14;
  ctx.fillStyle="#99ccff";
  ctx.fillRect(0,0,VW,2);
  ctx.restore();
}

function ensurePostFxSize(){
  if(postFxCvs.width!==VW){
    postFxCvs.width=VW;
    postFxCvs.height=VH;
  }
}

function applyPostFX(){
  if(!postFxActive())return;

  ensurePostFxSize();
  const pctx=postFxCvs.getContext("2d");
  pctx.imageSmoothingEnabled=false;
  pctx.drawImage(canvas,0,0,VW,VH);

  if(colorFilterIdx>0||fxBleedOn){
    const id=pctx.getImageData(0,0,VW,VH);
    if(colorFilterIdx>0){
      applyColorFilterImageData(id,COLOR_FILTERS[colorFilterIdx].id);
    }
    if(fxBleedOn&&fxBleedIntensity>0){
      applyColorBleedImageData(id,VW,VH,fxBleedIntensity);
    }
    pctx.putImageData(id,0,0);
  }

  ctx.clearRect(0,0,VW,VH);
  if(fxCurveOn){
    drawCRTCurve(postFxCvs);
  }else{
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(postFxCvs,0,0,VW,VH);
  }

  if(fxScanlinesOn){
    drawScanlines();
  }
}

applyDisplayBC();
