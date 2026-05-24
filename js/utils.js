const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ang=(ax,ay,bx,by)=>Math.atan2(by-ay,bx-ax);
function rOvlp(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function cRHit(cx,cy,cr,rx,ry,rw,rh){const tx=clamp(cx,rx,rx+rw),ty=clamp(cy,ry,ry+rh);return(cx-tx)**2+(cy-ty)**2<=cr*cr;}
