function updHUD(){
  document.getElementById("ui-score").textContent=String(score).padStart(6,"0");
  document.getElementById("ui-medals").textContent=medals;
  const cx=document.getElementById("ui-combo-x"),cb=document.getElementById("ui-combo-bar");
  cx.textContent="x"+comboX;cx.style.color=comboX>=5?"#f55":comboX>=3?"#fa0":"#ff0";
  if(comboBossLock){cb.style.width="100%";cb.style.background="linear-gradient(90deg,#f44,#fa0)";}
  else{cb.style.width=((comboT/COMBO_DUR)*100)+"%";cb.style.background=comboX>=5?"linear-gradient(90deg,#f44,#f80)":comboX>=3?"linear-gradient(90deg,#f80,#ff0)":"linear-gradient(90deg,#ff8800,#ffdd00)";}
  const el=document.getElementById("ui-lives");
  if(parseInt(el.dataset.l||"99")!==G.player.lives){
    el.dataset.l=G.player.lives;el.innerHTML="";
    for(let i=0;i<G.player.lives;i++){const d=document.createElement("div");d.className="life-pip";el.appendChild(d);}
  }
  const barEl=document.getElementById("ui-laser-bar"),stEl=document.getElementById("ui-laser-status");
  barEl.style.width=((laserEnergy/LASER_MAX)*100)+"%";
  if(laserCD>0){barEl.style.background="linear-gradient(90deg,#444,#888)";stEl.textContent="cooldown "+laserCD.toFixed(1)+"s";stEl.style.color="#888";}
  else{barEl.style.background="linear-gradient(90deg,#0088ff,#00ffee)";stEl.textContent=laserUsing?"usando...":"pronto";stEl.style.color=laserUsing?"#0ff":"#446";}
}
