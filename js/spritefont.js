// Spritefont "basic" — células 16×16, grade 10×12 (160×192 px)
// Temas: silver (padrão), orange (selecionado), green
const SF_CELL=16;
const SF_COLS=10;

const SF_THEMES={
  silver:"assets/fonts/basic-silver.png",
  orange:"assets/fonts/basic-orange.png",
  green:"assets/fonts/basic-green.png"
};

const SF_ROWS=[
  "!'\"#$%&'ÂÎ",
  "()*+,-./ÊÔ",
  "01234567ÛÃ",
  "89:;<=>?ÁÍ",
  "@ABCDEFGÉÓ",
  "HIJKLMNOÚÕ",
  "PQRSTUVWÀÌ",
  "XYZ[\\]^_ÈÒ",
  "`abcdefgÙ",
  "hijklmno",
  "pqrstuvw",
  "xyz{|}~Ç"
];

const SF_MAP={};
for(let r=0;r<SF_ROWS.length;r++){
  const row=SF_ROWS[r];
  for(let c=0;c<row.length;c++){
    const ch=row[c];
    if(ch)SF_MAP[ch]={col:c,row:r};
  }
}
SF_MAP[" "]={col:7,row:0};

const SF_ACCENT={
  "á":"Á","à":"À","â":"Â","ã":"Ã",
  "é":"É","ê":"Ê",
  "í":"Í",
  "ó":"Ó","ô":"Ô","õ":"Õ",
  "ú":"Ú","ù":"Ù",
  "ç":"Ç",
  "î":"Î","û":"Û",
  "è":"È","ì":"Ì","ò":"Ò"
};
for(const [from,to] of Object.entries(SF_ACCENT)){
  if(SF_MAP[to])SF_MAP[from]=SF_MAP[to];
}

const sfImgs={};
const sfReady={silver:false,orange:false,green:false};

function initSpriteFont(){
  for(const [name,src] of Object.entries(SF_THEMES)){
    const img=new Image();
    img.onload=()=>{sfReady[name]=true;};
    img.onerror=()=>{sfReady[name]=false;};
    img.src=src;
    sfImgs[name]=img;
  }
}

function sfThemeImg(theme){
  return sfImgs[theme]||sfImgs.silver;
}

function sfThemeReady(theme){
  return sfReady[theme]||(theme!=="silver"&&sfReady.silver);
}

function sfGlyph(ch){
  if(SF_MAP[ch])return SF_MAP[ch];
  if(ch>="a"&&ch<="z"){
    const up=ch.toUpperCase();
    if(SF_MAP[up])return SF_MAP[up];
  }
  return null;
}

function sfMeasureText(text,scale){
  scale=scale||1;
  const cell=SF_CELL*scale;
  let w=0;
  for(const ch of text){
    if(ch===" "){w+=cell;continue;}
    w+=sfGlyph(ch)?cell:cell*0.5;
  }
  return w;
}

function sfDrawText(text,x,y,opts){
  opts=opts||{};
  const scale=opts.scale||1;
  const alpha=opts.alpha!=null?opts.alpha:1;
  const theme=opts.theme||"silver";
  const cell=SF_CELL*scale;
  const img=sfThemeImg(theme);

  if(!sfThemeReady(theme)){
    ctx.save();
    ctx.font=Math.round(14*scale)+"px monospace";
    ctx.fillStyle=opts.fallbackColor||"#d3d9e8";
    ctx.textAlign="left";
    ctx.textBaseline="top";
    ctx.globalAlpha=alpha;
    ctx.fillText(text,x,y);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.imageSmoothingEnabled=false;
  if(alpha<1)ctx.globalAlpha=alpha;
  let cx=x;
  for(const ch of text){
    if(ch===" "){cx+=cell;continue;}
    const g=sfGlyph(ch);
    if(!g){cx+=cell*0.5;continue;}
    ctx.drawImage(
      img,g.col*SF_CELL,g.row*SF_CELL,SF_CELL,SF_CELL,
      Math.round(cx),Math.round(y),Math.ceil(cell),Math.ceil(cell)
    );
    cx+=cell;
  }
  ctx.restore();
}

function sfDrawTextCenter(text,cx,y,opts){
  sfDrawText(text,cx-sfMeasureText(text,opts&&opts.scale)/2,y,opts);
}

initSpriteFont();
