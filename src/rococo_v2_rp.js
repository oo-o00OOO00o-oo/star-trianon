(()=>{
/* ===================================================================================================
   右侧卷宗栏（rococo_v1 的 .folio）开关 · 2026-10-27 15:55
   默认收起。拉手不再是那截书脊，而是一位站在右缘的人物（starry/rp_actor.js）：
   指针进屏幕右侧 1/3、上半 42% 的热区 → 人物从火花里浮现、站住循环；此时点她 → 卷宗掀开；
   HOLD_MS 内没点 → 火花倒放收拢、人物散掉。点拉手 / 栏上的 ✕ / Esc / 点外部 → 收回。
   弹出方式 = 覆盖（主栏 720–760px 本就居中、与卷宗栏不重叠，弹出时不重排、不跳动）。
   调试 hash：#rp-peek（直接喊出人物）#rp-open（卷宗栏打开）。window.__rp = {open, close, toggle, peek, get isOpen}
   =================================================================================================== */
const b=document.body,folio=document.querySelector('.folio');if(!folio)return;
const HASH=window.__navHash||decodeURIComponent(location.hash.slice(1)).split(/[&,]/).filter(Boolean);
const tab=document.createElement('button');tab.id='rpTab';tab.type='button';tab.setAttribute('aria-label','展开卷宗栏');tab.setAttribute('aria-expanded','false');tab.tabIndex=-1;
b.appendChild(tab);
const x=document.createElement('button');x.className='rp-x';x.type='button';x.setAttribute('aria-label','收起卷宗栏');x.innerHTML='<span>✕</span>';folio.appendChild(x);
let open=false;
const actor=()=>window.__rpa;
const busy=()=>b.classList.contains('fl-open')||b.classList.contains('st-open')||b.classList.contains('sr-on');
const set=()=>{b.classList.toggle('rp-open',open);tab.setAttribute('aria-expanded',open?'true':'false');tab.setAttribute('aria-label',open?'收起卷宗栏':'展开卷宗栏')};
const api={open(){if(busy())return;open=true;set();if(actor())actor().hide()},
  close(){open=false;set();if(actor())actor().hide()},
  toggle(){open?api.close():api.open()},
  peek(v=true){if(actor())v?actor().summon():actor().hide()},
  get isOpen(){return open}};
window.__rp=api;
/* 感应区只贴着人物自己那一块（右缘、她站的位置），不再是原来拉手那一大片右三分之一 */
let armed=true;
const nearActor=(x,y)=>{const r=tab.getBoundingClientRect();
  return x>=r.left+r.width*.2&&x<=r.right&&y>=r.top-24&&y<=r.bottom+24};
addEventListener('pointermove',e=>{
  if(!nearActor(e.clientX,e.clientY)){armed=true;return}
  if(!armed||open||busy()||!actor())return;
  armed=false;actor().summon();
},{passive:true});
tab.addEventListener('click',e=>{e.stopPropagation();api.toggle()});
x.addEventListener('click',e=>{e.stopPropagation();api.close()});
addEventListener('keydown',e=>{if(open&&e.key==='Escape'&&!b.classList.contains('sr-on')){api.close()}},true);
addEventListener('pointerdown',e=>{if(!open)return;if(folio.contains(e.target)||tab.contains(e.target))return;api.close()},true);
/* other pages take the right side: fold away */
new MutationObserver(()=>{if(busy()){if(open){open=false;set()}if(actor())actor().hide()}}).observe(b,{attributes:true,attributeFilter:['class']});
if(HASH.includes('rp-open'))setTimeout(()=>api.open(),60);else if(HASH.includes('rp-peek'))setTimeout(()=>api.peek(true),60);
})();
