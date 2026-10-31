(()=>{
/* ===================================================================================================
   右侧卷宗栏 · 方案 D「Dossier à Rubans · 半开的系带卷宗」 2026-10-29 00:05（设计者自己的 brief）
   结构：屏幕右缘是一截燕麦色亚麻书脊（#rpTab 本身，拉手 = 书脊 + 系好的丝绒蝴蝶结）；打开时结解开、两条丝带垂在书脊边，
   背板从书脊绕轴转出来（门一样），前封面只张开一条缝（半开）。背板内：两张错开的图书馆索引卡（Plan 计划 / Changes 改动，
   圆角索引签一左一右露出来，点签把那张卡换到前面）；右上角一枚雾蓝火漆印（Kimi 在写时微微发光呼吸，写完定住并轻按一下）；
   下方的卡袋上是一道金色星轨弧（对数刻度 1k–1M），一弯小月亮指在当前上下文用量上，平滑滑动。
   rococo_v1 的三个 .sec 原样"搬"进卡片/卡袋（移动节点，不复制），所有 id 与桥接照常。图：rpv2/（见 rpv2/SOURCES.md）。
   调试 hash：#rp-open&rd-chg（打开并把 Changes 放到前面）。window.__rd = {front(kind), get busy}。
   =================================================================================================== */
const b=document.body,folio=document.querySelector('.folio');if(!folio)return;
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const IMG={board:'%%RD_BOARD%%',cover:'%%RD_COVER%%',spine:'%%RD_SPINE%%',pocket:'%%RD_POCKET%%',cp:'%%RD_CARD_PLAN%%',cc:'%%RD_CARD_CHG%%',
  bow:'%%RD_BOW%%',tail:'%%RD_TAIL%%',band:'%%RD_BAND%%',seal:'%%RD_SEAL%%',moon:'%%RD_MOON%%'};
b.classList.add('rd-on');folio.classList.add('rd-on');

/* ---- folder board + header + wax seal (folio level) ---- */
folio.insertAdjacentHTML('afterbegin',`<img class="rd-board" src="${IMG.board}" alt="" draggable="false">`);
folio.insertAdjacentHTML('beforeend',`<div class="rd-head" aria-hidden="true"><em>Dossier</em><span class="rd-hz">卷 宗</span><span class="rd-ht"></span></div>`+
  `<div class="rd-seal" aria-hidden="true"><i class="rd-halo"></i><img src="${IMG.seal}" alt="" draggable="false"></div>`);
const seal=folio.querySelector('.rd-seal'),ht=folio.querySelector('.rd-ht');

/* ---- 书脊 / 丝带 / 半开封面不再挂到 #rpTab 上：拉手换成了那位人物（starry/rp_actor.js）。
        卷宗本身的开合（.folio 绕书脊转出来、火漆印呼吸、索引卡与星轨）不受影响。 ---- */

/* ---- per dossier: two index cards + the pocket with the star track ---- */
const A0=46*Math.PI/180,R=157,CX=125,CY=179;          // arc geometry in the 250x96 svg (apex at y 22)
const pt=(f,r=R)=>{const p=-A0+2*A0*f;return [CX+r*Math.sin(p),CY-r*Math.cos(p),p]};
const arcPath=(f0,f1)=>{const [x0,y0]=pt(f0),[x1,y1]=pt(f1);return `M${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)}`};
const lf=k=>Math.max(0,Math.min(1,Math.log10(Math.max(1,k))/3));   // k = thousands of tokens: 1k → 0 · 1M → 1
const ticks=()=>{let s='';[1,2,5,10,20,50,100,200,500,1000].forEach(k=>{const maj=[1,10,100,1000].includes(k),f=lf(k),[x0,y0]=pt(f,R+2),[x1,y1]=pt(f,R+(maj?10:6));
    s+=`<line class="${maj?'mj':'mn'}" x1="${x0.toFixed(2)}" y1="${y0.toFixed(2)}" x2="${x1.toFixed(2)}" y2="${y1.toFixed(2)}"/>`;
    if(maj){const [lx,ly]=pt(f,R-13);s+=`<text x="${lx.toFixed(1)}" y="${(ly+3).toFixed(1)}">${k<1000?k+'k':'1M'}</text>`;
      const [sx,sy]=pt(f,R+17);s+=`<text class="st" x="${sx.toFixed(1)}" y="${(sy+3).toFixed(1)}">✦</text>`}});return s};
const all=[],pockets=[];
const build=ds=>{
  const secs=[...ds.children].filter(e=>e.classList.contains('sec'));if(secs.length<3)return;
  const [sp,sc,sx]=secs;ds.classList.add('rd-ds');
  const box=document.createElement('div');box.className='rd-cards';ds.appendChild(box);
  const mk=(kind,img,sec,lat,zh,num)=>{const c=document.createElement('div');c.className='rd-card rd-'+kind;
    c.innerHTML=`<img class="rd-cf" src="${img}" alt="" draggable="false"><button type="button" class="rd-tab" aria-label="${zh}"><i>${num}</i><em>${lat}</em><b>${zh}</b></button><div class="rd-in"></div>`;
    c.querySelector('.rd-in').appendChild(sec);box.appendChild(c);return c};
  const cp=mk('plan',IMG.cp,sp,'Plan','计 划','I'),cc=mk('chg',IMG.cc,sc,'Changes','改 动','II');
  const st={ds,box,cards:{plan:cp,chg:cc},front:'plan',busy:0};all.push(st);
  const setF=(kind,anim)=>{if(st.front===kind&&anim)return;const inc=st.cards[kind],out=st.cards[kind==='plan'?'chg':'plan'];st.front=kind;
    inc.setAttribute('aria-current','true');out.removeAttribute('aria-current');
    if(!anim||RM.matches){inc.classList.add('fr');out.classList.remove('fr');return}
    inc.classList.add('lift');clearTimeout(st.busy);
    inc.animate([{translate:'0 0',rotate:'0deg'},{translate:'-4px -30px',rotate:'-1.4deg',offset:.42},{translate:'0 0',rotate:'0deg'}],{duration:640,easing:'cubic-bezier(.3,.7,.3,1)'});
    out.animate([{translate:'0 0'},{translate:'3px 8px',offset:.42},{translate:'0 0'}],{duration:640,easing:'cubic-bezier(.3,.7,.3,1)'});
    st.busy=setTimeout(()=>{inc.classList.add('fr');out.classList.remove('fr')},250);setTimeout(()=>inc.classList.remove('lift'),660)};
  st.setF=setF;setF('plan',false);
  [cp,cc].forEach(c=>{const k=c===cp?'plan':'chg';c.querySelector('.rd-tab').addEventListener('click',e=>{e.stopPropagation();setF(k,true)});
    c.addEventListener('click',e=>{if(st.front!==k){e.stopPropagation();setF(k,true)}})});
  ds.querySelectorAll(':scope>.orn').forEach(o=>o.style.display='none');
  const pk=document.createElement('div');pk.className='rd-pocket';
  pk.innerHTML=`<img class="rd-pf" src="${IMG.pocket}" alt="" draggable="false"><svg class="rd-trk" viewBox="0 0 250 96" aria-hidden="true"><path class="bg" d="${arcPath(0,1)}"/>${ticks()}<path class="fg" d=""/></svg>`+
    `<img class="rd-moon" src="${IMG.moon}" alt="" draggable="false"><i class="rd-gl">✦</i>`+
    `<div class="rd-cap"><span class="rd-t"><em>Context</em>上 下 文</span><span class="rd-v"></span><span class="rd-d"></span></div><div class="rd-hide"></div>`;
  pk.querySelector('.rd-hide').appendChild(sx);ds.appendChild(pk);
  pockets.push({ds,sec:sx,fg:pk.querySelector('.fg'),moon:pk.querySelector('.rd-moon'),gl:pk.querySelector('.rd-gl'),v:pk.querySelector('.rd-v'),d:pk.querySelector('.rd-d'),f:-1,last:''});
};
document.querySelectorAll('.folio .dossier').forEach(build);
if(!all.length)return;
const vis=()=>[...document.querySelectorAll('.folio .dossier')].find(d=>d.style.display!=='none')||document.querySelector('.folio .dossier');
window.__rd={front(kind){const st=all.find(o=>o.ds===vis());if(st)st.setF(kind,true)},get busy(){return busy()}};

/* ---- context: moon slides along the star track ---- */
const readCtx=(P,dt)=>{const s=P.sec;
  const pcT=(s.querySelector('.pc')||{}).textContent||'0%',ofT=(s.querySelector('.of')||{}).textContent||'',mdT=((s.querySelector('h5 small')||{}).textContent||'K3.1 Pro').trim();
  const km=ofT.match(/([\d.]+)\s*k/i),k=km?parseFloat(km[1]):(parseFloat(pcT)||0)*10,tg=lf(k);
  if(P.f<0||RM.matches||dt<=0)P.f=tg;else P.f+=(tg-P.f)*(1-Math.exp(-dt/.5));
  const [x,y,p]=pt(P.f),deg=p*180/Math.PI;
  P.moon.style.transform=`translate(${(x*1.0-10).toFixed(2)}px,${(y-12).toFixed(2)}px) rotate(${deg.toFixed(2)}deg)`;
  P.gl.style.transform=`translate(${(x+Math.cos(p)*13-4).toFixed(2)}px,${(y+Math.sin(p)*13-20).toFixed(2)}px)`;
  P.fg.setAttribute('d',arcPath(0,Math.max(.002,P.f)));
  const key=pcT+'|'+ofT+'|'+mdT;if(key===P.last)return;P.last=key;
  P.v.innerHTML=`${mdT} · <b>${pcT}</b> <i>/ 1M</i>`;P.d.textContent=ofT?`${ofT} tokens`:''};

/* ---- wax seal: breathes while Kimi is writing, freezes (one soft press) when the turn ends ---- */
const busy=()=>{const pen=document.getElementById('pen12');return pen?(parseFloat(pen.style.getPropertyValue('--pen'))||0)>.3:false};
let amp=0,was=false,raf=0,lt=-1;
const tick=now=>{raf=0;const open=b.classList.contains('rp-open');
  const t=now/1000,dt=lt<0?0:Math.min(.1,t-lt);lt=t;const run=busy()&&!RM.matches;
  amp+=((run?1:0)-amp)*(dt?1-Math.exp(-dt/(run?.6:.35)):0);if(!run&&amp<.004)amp=0;
  const g=amp*(.55+.45*Math.sin(2*Math.PI*t/2.6));seal.style.setProperty('--g',g.toFixed(3));seal.classList.toggle('on',amp>0);
  if(was&&!busy()&&open&&!RM.matches)seal.animate([{scale:'1'},{scale:'1.07',offset:.35},{scale:'.985',offset:.7},{scale:'1'}],{duration:520,easing:'ease-out'});
  was=busy();
  const cb=document.querySelector('.folio .cap b');if(cb&&ht.textContent!==cb.textContent)ht.textContent=cb.textContent;
  for(const P of pockets)if(P.ds.style.display!=='none')readCtx(P,dt);
  if(open||amp>0)raf=requestAnimationFrame(tick);else lt=-1};
const kick=()=>{if(!raf)raf=requestAnimationFrame(tick)};
new MutationObserver(()=>{if(b.classList.contains('rp-open'))kick()}).observe(b,{attributes:true,attributeFilter:['class']});
pockets.forEach(P=>readCtx(P,0));tick(performance.now());
const HASH=window.__navHash||decodeURIComponent(location.hash.slice(1)).split(/[&,]/).filter(Boolean);
if(HASH.includes('rd-chg'))setTimeout(()=>window.__rd.front('chg'),1500);
})();
