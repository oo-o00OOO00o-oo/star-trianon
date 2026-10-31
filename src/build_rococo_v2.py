#!/usr/bin/env python3
"""Build rococo_v2.html — 合并版: one app where the die-cut tag rail switches between every page built so far.
  base     build_rococo_v1.py exec'd as is (its final write skipped) with rococo_v1.js patched at build time only
           (engine_v2's hooks + Context against 1M + rococo's own demo on #rkplay) — rococo_v1.* untouched
  rail     the rococo v2「模切吊牌」 swap (r2v/gen/t_*.png + rococo_v2.js + rococo_v2.css), as in the first rococo_v2
  pages    engine_v2.css/js, files_v2.css/js, settings_v3.css/js layered on the same page; their sources are only read.
           Every page's stylesheet goes through r2v/cssscope.py: rules that do not already name the page's own classes
           get a body.ly-eg / ly-fl / ly-st guard, :root vars and @keyframes get page-local names, shared @font-face once.
           JS patches (build time only): each page's own #play becomes #eplay / #fplay / #splay, its __demoXY/__playGo
           are only claimed on that hash; engine's demo palette only on #egdemo, its cold boot is skipped when the hash
           names a scene of another page.
  glue     rococo_v2_nav.js/.css (routing, chosen tag follows the page, rail pinned on pages, 「即将推出」 tag, merged #play)
  head     hash normaliser: files/x set/x eng/x rk/x nav/x -> x (…/play -> fplay/splay/eplay/rkplay/play); hashchange reloads
  size     identical embedded images are stored once (window.__IMG table + CSS custom properties)
Old standalone hashes keep working: #empty #chat #stream … (rococo) · #files #preview #at … (files) · #account #appearance
#permission #engine … (settings) · #boot #reconnect #crash … (engine). #play = merged navigation demo."""
import os, re, sys, base64, hashlib, json

HERE = './'
OUT = os.environ.get('TRIANON_OUT', '../dist/trianon.html')
sys.path.insert(0, HERE + 'r2v')
from cssscope import scope

def rd(p): return open(HERE + p, encoding='utf-8').read()
def patch(txt, pairs, name):
    for a, z in pairs:
        assert txt.count(a) == 1, (name, a[:80], txt.count(a))
        txt = txt.replace(a, z)
    return txt

# ---------------------------------------------------------------- base: rococo_v1 with engine hooks + 1M context
js = patch(rd('rococo_v1.js'), [
    ("const sendNow=txt=>{txt=(txt||ci.value||'').trim()||window.__rkPrompt;if(busy())return;",
     "const sendNow=txt=>{if(window.__engBlock&&window.__engBlock())return;txt=(txt||ci.value||'').trim()||window.__rkPrompt;if(busy())return;"),
    ("const busy=()=>running&&view==='live'&&!(tt>=T.END);", "const busy=()=>running&&view==='live'&&!(tt>=T.END)&&!window.__engHalt;"),
    ("const streaming=(t>=T.u&&t<T.sl+.2)||(t>=T.cp1&&t<T.q+.2)||(t>=T.qc1-.05&&t<T.c6z+.3);",
     "const streaming=!window.__engHalt&&((t>=T.u&&t<T.sl+.2)||(t>=T.cp1&&t<T.q+.2)||(t>=T.qc1-.05&&t<T.c6z+.3));"),
    ("const waiting=(t>=T.sl+.25&&t<T.pr+.1)||(t>=T.q+.25&&t<T.sel+.1);",
     "const waiting=!window.__engHalt&&((t>=T.sl+.25&&t<T.pr+.1)||(t>=T.q+.25&&t<T.sel+.1));"),
    ("const decideA=v=>{if(!running", "const decideA=v=>{if(window.__engHalt||!running"),
    ("const decideQ=k=>{if(!running", "const decideQ=k=>{if(window.__engHalt||!running"),
    ("const reset=()=>{running=false;", "const reset=()=>{window.__engReset&&window.__engReset();running=false;"),
    ("if(has('play'))setTimeout(play,500)", "if(has('rkplay'))setTimeout(play,500)"),
    ("window.__rk={get T(){return T},", "window.__rk={hold:v=>{frozen=v},resume:v=>{frozen=null;t0=now()-v},get running(){return running},get frozen(){return frozen},get T(){return T},"),
    ("const dt=Math.max(0,Math.min(.1,t-lastT));sc+=", "const dt=Math.max(0,Math.min(.1,(t-lastT)||(window.__egDt||0)));sc+="),
    ("const dtc=Math.max(0,Math.min(.1,t-lastT))", "const dtc=Math.max(0,Math.min(.1,(t-lastT)||(window.__egDt||0)))"),
    ("pcEl.textContent=Math.round(ctx)+'%';ofEl.textContent=Math.round(262*ctx/100)+'k of 262k';grI.style.width=ctx.toFixed(2)+'%';grB.style.left=ctx.toFixed(2)+'%';",
     "const ck=262*ctx/100,cp=ck/10;pcEl.textContent=(cp<10?cp.toFixed(1):Math.round(cp))+'%';ofEl.textContent=Math.round(ck)+'k of 1M';grI.style.width=cp.toFixed(2)+'%';grB.style.left=cp.toFixed(2)+'%';"),
    ("window.__playGo=play;", "if(has('rkplay'))window.__playGo=play;"),
    # 2026-10-27 21:40 global cursors: tell the cursor layer while Kimi is writing (progress cursor = butterfly + little pillow)
    ("setClock(cvBusy,cvWait,t);", "setClock(cvBusy,cvWait,t);window.__cuBusy=streaming&&running;"),
    ("window.__demoXY=()=>", "window[has('rkplay')?'__demoXY':'__demoXY_rk']=()=>"),
    # 2026-10-27 13:50 state #9 search: open a conversation in the history view and point at the message it found
    ("const mcM=$('mcM');", "window.__rkOpenHist=(title,mi)=>{histTitle=title||histTitle;railOn(-1);showView('hist');if(mi==null)return;const r=thH.querySelectorAll('.row')[mi];if(!r)return;"
     "const off=r.getBoundingClientRect().top-thH.getBoundingClientRect().top;hsT=Math.max(0,Math.min(hsMax(),off-28));histScroll();"
     "r.classList.remove('sr-hit');void r.offsetWidth;r.classList.add('sr-hit');setTimeout(()=>r.classList.remove('sr-hit'),2700)};\nconst mcM=$('mcM');"),
], 'rococo_v1.js')
src = patch(rd('build_rococo_v1.py'), [
    ("RK_JS = open(HERE + 'rococo_v1.js', encoding='utf-8').read()", "RK_JS = __RKJS__"),
    ("open(OUT, 'w', encoding='utf-8').write(s)\nprint('wrote', OUT, len(s))", "pass")], 'build_rococo_v1.py')
ns = {'__name__': 'rococo_v1_for_rococo_v2_merged', '__RKJS__': js}
exec(compile(src, 'build_rococo_v1.py', 'exec'), ns)
s = ns['s']

def sub1(a, z):
    global s
    assert s.count(a) == 1, (a[:80], s.count(a))
    s = s.replace(a, z)

sub1('<input class="ci" id="ci" type="text" autocomplete="off" spellcheck="false" aria-label="说一句话">',
     '<textarea class="ci" id="ci" rows="3" autocomplete="off" spellcheck="false" aria-label="说一句话"></textarea>')

def uri(p, mime='image/png'):
    return f'data:{mime};base64,' + base64.b64encode(open(HERE + p, 'rb').read()).decode()
def furi(p):
    return 'data:font/woff;base64,' + base64.b64encode(open(HERE + p, 'rb').read()).decode()

# Context: K3.1 Pro's 1M window (live dossier + the past conversation's dossier)
sub1('<span class="pc" id="rkPc">6%</span><span class="of" id="rkOf">16k of 262k</span>', '<span class="pc" id="rkPc">1.6%</span><span class="of" id="rkOf">16k of 1M</span>')
sub1('<i id="rkGi" style="width:6%"></i>', '<i id="rkGi" style="width:1.6%"></i>')
sub1('<b id="rkGb" style="left:6%">', '<b id="rkGb" style="left:1.6%">')
sub1('<span class="pc">42%</span><span class="of">110k of 262k</span>', '<span class="pc">11%</span><span class="of">110k of 1M</span>')

# ---------------------------------------------------------------- rail → die-cut hang tags (same as the first rococo_v2)
NAMES = ['new', 'history', 'files', 'search', 'terminal', 'model', 'fav', 'look', 'account', 'settings']
nav0 = s.index('<nav class="rail">'); nav1 = s.index('</nav>', nav0)
nav = s[nav0:nav1]
imgs = list(re.finditer(r'<img src="data:image/png;base64,[A-Za-z0-9+/=]+" alt="">', nav))
assert len(imgs) == 10, len(imgs)
out, last = [], 0
for k, m in enumerate(imgs):
    tag = f'<img class="tg" src="{uri("starry/out/nav-" + NAMES[k] + ".png")}" alt="" draggable="false">'
    pre = nav[last:m.start()]
    if pre.endswith('<b class="hgw">'):
        out.append(pre[:-len('<b class="hgw">')] + '<b class="hgw tgw">' + tag)
    else:
        out.append(pre + '<b class="tgw">' + tag + '</b>')
    last = m.end()
out.append(nav[last:])
nav = ''.join(out)
assert nav.count('class="tgw"') == 9 and nav.count('class="hgw tgw"') == 1
# state #10 browser: the 11th tag uses the starry house icon; existing navigation indexes stay unchanged.
LOOK_END = '<em>Parure</em>外观<i class="lb"></i><i class="xs">✕<b style="font-size:4px">●</b>✕</i></span></div>'
assert nav.count(LOOK_END) == 1
nav = nav.replace(LOOK_END, LOOK_END + f'<div class="it" style="--i:8"><b class="tgw"><img class="tg" src="{uri("starry/out/nav-browser.png")}" alt="" draggable="false"></b>'
                  '<span><em>Navigateur</em>浏览器<i class="lb"></i><i class="xs">✕<b style="font-size:4px">●</b>✕</i></span></div>')
s = s[:nav0] + nav + s[nav1:]
head = "(()=>{const b=document.body,rail=document.querySelector('.rail'),its=[...rail.querySelectorAll('.it')];"
assert s.count(head) == 1, s.count(head)
i0 = s.index(head); i1 = s.index('</script>', i0)
assert s[i0:i1].rstrip().endswith('})();'), s[i1-60:i1]
s = s[:i0] + rd('rococo_v2.js') + '\n' + s[i1:]

# ---------------------------------------------------------------- empty page: v11's drop / staff / fog script -> the user's welcome spec (rococo_v2_empty.js)
e0 = s.index("(()=>{\nconst LINES=[")
e1 = s.index('</script>', e0)
assert s[e0:e1].count('window.__v11restart') == 1
# 2026-10-28 12:54 开场 Ouverture: the empty page's one new switch — start in the resting pose with no entrance (window.__emptyAtRest, set by
# rococo_v2_opening.js before this runs) and window.__emptyRest() to re-anchor that pose; without the flag nothing changes.
EMPTY_JS = patch(rd('rococo_v2_empty.js'), [
    ("const run=()=>{tod='';t0=performance.now();", "const run=()=>{tod='';t0=performance.now()-(window.__emptyAtRest?5700:0);"),
    ("\nframe(0);\n", "\nwindow.__emptyRest=()=>{t0=performance.now()-5700};\nframe(window.__emptyAtRest?5.7:0);\n"),
], 'rococo_v2_empty.js')
s = s[:e0] + EMPTY_JS + '\n' + s[e1:]
# 2026-10-27 11:35 · center v3「拱窗 · 纸雕 · 钟罩」: the letter card + lotus markup is replaced by e3v/empty3.py's window scene;
# the caption and the three quick-start buttons move inside #invite (same .tagcap / .tag elements, same order, so rococo's
# click handlers and exit animation are untouched) and hang from the window sill.
# 2026-10-27 12:30 · center v4「欧式复古拼贴」replaces v3: e4v/empty4.py builds its own tagcap + three die-cut label buttons
# (same <button class="tag tN"> order and labels, so rococo's click handlers keep working).
# 2026-10-27 13:10 · center v5 (the user's own centre-motion spec) replaces v4: e5v/empty5.py (public-domain source art, e5v/SOURCES.md)
sys.path.insert(0, HERE + 'e4v')
sys.path.insert(0, HERE + 'e5v')
import empty5
i0 = s.index('<div class="invite" id="invite">')
i1 = s.index('<div class="tagcap">', i0)
i2 = s.index('<svg width="0" height="0" style="position:absolute"', i1)
tags_html = s[i1:i2].rstrip()
assert tags_html.count('class="tag t') == 3 and tags_html.endswith('</div>'), tags_html[-200:]
for lab in ('Tidy this repo', 'Fix a bug', 'Just chat'):
    assert lab in tags_html, lab
s = s[:i0] + empty5.build(HERE) + '\n      ' + s[i2:]
# on send the collage plays its own exit (Envoyé stamp, parts to both sides) instead of rococo's lift-off of #invite
EX0 = "$('invite').animate([{opacity:1,translate:'0 0',rotate:'0deg',scale:'1'},"
assert s.count(EX0) == 1
s = s.replace(EX0, "if(window.__emptyExit)window.__emptyExit();else $('invite').animate([{opacity:1,translate:'0 0',rotate:'0deg',scale:'1'},")

# ---------------------------------------------------------------- page layers
def fonts_in(css, table):
    for k, p in table:
        assert css.count(k) == 1, k
        css = css.replace(k, furi(p))
    return css

# engine_v2
EG_CSS = rd('engine_v2.css')
EG_JS = patch(rd('engine_v2.js'), [
    ("else if(has('play')){setMode('boot');", "else if(has('eplay')){setMode('boot');"),
    ("else{demo();mock.boot()}};", "else{if(has('egdemo'))demo();if(!window.__navQuiet)mock.boot()}};"),
    ("window.__demoXY=()=>", "window[has('eplay')?'__demoXY':'__demoXY_eg']=()=>"),
    ("window.__playGo=play;", "if(has('eplay'))window.__playGo=play;"),
], 'engine_v2.js')

# files_v2 (same substitutions as build_files_v2.py)
FL_CSS = fonts_in(rd('files_v2.css'), [('__FONT_TW__', 's2v/tw.woff'), ('__FONT_TWB__', 's2v/twb.woff'), ('__FONT_PX__', 's2v/pinyonx.woff')])
assert FL_CSS.count('__IMG_GATE_CSS__') == 1
FL_CSS = FL_CSS.replace('__IMG_GATE_CSS__', uri('f2v/gen/gate_lt.png'))
FL_JS = rd('files_v2.js')
G = 'f2v/gen/'
for k, p, m in [('__IMG_LILY__', G+'w_sk_lily.png', 'image/png'), ('__IMG_LILY_LT__', G+'lily_lt.png', 'image/png'), ('__IMG_HORSE__', G+'w_sk_horse.png', 'image/png'),
                ('__IMG_SLIPPERS__', G+'w_sk_slippers.png', 'image/png'), ('__IMG_BEAR__', G+'w_sk_bear.png', 'image/png'), ('__IMG_RABBIT__', G+'w_sk_rabbit.png', 'image/png'),
                ('__IMG_GATE__', G+'gate_lt.png', 'image/png'), ('__IMG_FENCE_LT__', G+'fence_lt.png', 'image/png'), ('__IMG_FENCE__', G+'fence_ink.png', 'image/png'),
                ('__IMG_ROSE__', G+'w_rose.png', 'image/png'), ('__IMG_BOW__', G+'w_bow.png', 'image/png'), ('__IMG_KEY__', 's2v/gen/sk_key.png', 'image/png'),
                ('__IMG_FMN__', 's2v/gen/sk_forgetmenot.png', 'image/png'), ('__IMG_SHOT__', 'f1v/thumb_end.jpg', 'image/jpeg'), ('__IMG_GRAIN__', 's2v/grain.png', 'image/png')]:
    assert FL_JS.count(k) == 1, (k, FL_JS.count(k))
    FL_JS = FL_JS.replace(k, uri(p, m))
FL_JS = patch(FL_JS, [
    ("else if(has('play')){boot0();", "else if(has('fplay')){boot0();"),
    ("window.__demoXY=()=>", "window[has('fplay')?'__demoXY':'__demoXY_fl']=()=>"),
    ("window.__playGo=play;", "if(has('fplay'))window.__playGo=play;"),
], 'files_v2.js')

# settings_v3 (same substitutions as build_settings_v3.py)
ST_CSS = fonts_in(rd('settings_v3.css'), [('__FONT_TW__', 's2v/tw.woff'), ('__FONT_TWB__', 's2v/twb.woff'), ('__FONT_NP__', 's2v/np.woff'), ('__FONT_NPR__', 's2v/npr.woff'), ('__FONT_PX__', 's2v/pinyonx.woff')])
ST_CSS = ST_CSS.replace('__IMG_GRAIN__', uri('s2v/grain.png'))
# 2026-10-28 16:48: the permission confirm letter (#stCf) sat inside .st-sec (pointer-events:none) without the .an opt-in, so a real mouse
# fell through it to the sheet (OK / checkbox / scrim never received the click; the #splay demo used el.click()). Only while it is open.
ST_CSS += '\n#stSet .st-cf.on{pointer-events:auto}\n'
ST_JS = rd('settings_v3.js')
for k, p in [('__IMG_BOW__', 'icons/w_bow.png'), ('__IMG_SK_LILY__', 's2v/gen/sk_lily.png'), ('__IMG_SK_FMN__', 's2v/gen/sk_forgetmenot.png'),
             ('__IMG_SK_BFLY__', 's2v/gen/sk_butterfly.png'), ('__IMG_SK_MOON__', 's2v/gen/sk_moon.png'), ('__IMG_SK_KEY__', 's2v/gen/sk_key.png'),
             ('__IMG_WL_LILY__', 's2v/gen/wl_lily.png'), ('__IMG_GRAIN__', 's2v/grain.png')]:
    assert ST_JS.count(k) == 1, k
    ST_JS = ST_JS.replace(k, uri(p))
for n in ['frame','column','clockbooks','scroll','quills','dove','shell','mirror','lamp','candle','follow','teacup','bell','key','angel','gramophone','hourglass']:
    k = '__IMG_O_' + n.upper() + '__'
    assert ST_JS.count(k) == 1, k
    ST_JS = ST_JS.replace(k, 'data:image/webp;base64,' + base64.b64encode(open(HERE + 's3v/gen/w_' + n + '.webp', 'rb').read()).decode())
assert '__IMG_' not in ST_JS, re.findall(r'__IMG_[A-Z_]+__', ST_JS)
ST_JS = patch(ST_JS, [
    ("else if(has('play')){setTimeout(play,600)}};", "else if(has('splay')){setTimeout(play,600)}};"),
    ("window.__demoXY=()=>", "window[has('splay')?'__demoXY':'__demoXY_st']=()=>"),
    ("window.__playGo=play;", "if(has('splay'))window.__playGo=play;"),
    # 2026-10-28 16:48: the confirm row was a <label> around the checkbox <button>: a real click on its text fired twice (text + the label's
    # synthetic click on the button) and cfCheck toggled back off, so OK stayed disabled. A plain div keeps the look (.cf-ck is display:flex).
    ('<label class="cf-ck" id="stCfCk">', '<div class="cf-ck" id="stCfCk">'),
    ('会自动执行</span></label>', '会自动执行</span></div>'),
], 'settings_v3.js')

# state #9 search (rococo_v2_search.js/.css + s9v/ art, sources in s9v/SOURCES.md)
SR_JS = rd('rococo_v2_search.js')
# search v2 (2026-10-27 15:50, sky collage + dashboard motion): stickers from s9v/proc9c.py (Met CC0 temple + generate_image), sources in s9v/SOURCES.md; v1 assets kept in s9v_v1/
for k, p in [('__S9_BUILDING__', 'building'), ('__S9_TEMPLE__', 'temple'), ('__S9_COLUMN__', 'column'), ('__S9_LADDER__', 'ladder'),
             ('__S9_ANGEL__', 'angel'), ('__S9_DOVE__', 'dove'), ('__S9_SKY__', 'stairs')]:
    assert SR_JS.count(k) == 1, k
    SR_JS = SR_JS.replace(k, uri(f's9v/out/{p}.webp', 'image/webp'))

# state #10 built-in browser (rococo_v2_browser.js/.css + b10v/ art, sources in b10v/SOURCES.md)
BR_JS = rd('rococo_v2_browser.js')
# 2026-10-27 21:00 v6「Carnet de voyage · 法式版画手账」: art from b10v/v6/out (b10v/v6/proc6.py; sources in b10v/SOURCES.md, last section)
for k, p in [('__B10_TOILE__', 'toile_base'), ('__B10_TBAL__', 'toile_balloon'), ('__B10_BALLOON__', 'balloon'), ('__B10_PIGEON__', 'pigeon'),
             ('__B10_CORNER__', 'corner'), ('__B10_WATCH__', 'watch'), ('__B10_CLIP__', 'clip'), ('__B10_PAPER__', 'paper')]:
    if k not in BR_JS: continue   # v8 (2026-10-28) only keeps the paper; v6 placeholders still work if rolled back
    assert BR_JS.count(k) == 1, k
    BR_JS = BR_JS.replace(k, uri(f'b10v/v6/out/{p}.webp', 'image/webp'))
# 2026-10-28 v8「Édition du jour」: art from b10v/v8/out (b10v/v8/proc8.py; sources b10v/SOURCES.md「v8」)
for k in sorted(set(re.findall(r'__B10V8_([A-Z0-9_]+)__', BR_JS))):
    assert BR_JS.count(f'__B10V8_{k}__') == 1, k
    BR_JS = BR_JS.replace(f'__B10V8_{k}__', uri(f'b10v/v8/out/{k.lower()}.webp', 'image/webp'))

# state #11 collection album (rococo_v2_collection.js/.css + b11v/ art, sources in b11v/SOURCES.md) — 2026-10-27 23:00
CL_JS = rd('rococo_v2_collection.js')
# v2 (23:40): the engraved stamp/postcard vignettes and the corner flourish were replaced by watercolour art; v1 list kept in build_rococo_v2.bak-2335.py
for k, p in [('__B11_ALBUM__', 'album'), ('__B11_CLIP__', 'clip'), ('__B11_PAPER__', 'paper')]:
    assert CL_JS.count(k) == 1, k
    CL_JS = CL_JS.replace(k, uri(f'b11v/out/{p}.webp', 'image/webp'))
# 2026-10-27 23:40 收藏 v2「绘本水彩」: watercolour bunny / bow / tea / vine / icons / vignettes from b11v/v2/out (b11v/v2/proc_v2.py; sources b11v/SOURCES.md v2)
for k in sorted(set(re.findall(r'__B11V2_([A-Z0-9_]+)__', CL_JS))):
    assert CL_JS.count(f'__B11V2_{k}__') == 1, k
    CL_JS = CL_JS.replace(f'__B11V2_{k}__', uri(f'b11v/v2/out/{k.lower()}.webp', 'image/webp'))
# 2026-10-28 收藏 v3 封面「编辑排版 + 拼贴」: cover collage art from b11v/v3/out (b11v/v3/proc_v3.py; sources b11v/SOURCES.md v3 封面)
for k in sorted(set(re.findall(r'__B11V3_([A-Z0-9_]+)__', CL_JS))):
    assert CL_JS.count(f'__B11V3_{k}__') == 1, k
    CL_JS = CL_JS.replace(f'__B11V3_{k}__', uri(f'b11v/v3/out/{k.lower()}.webp', 'image/webp'))

# state #12 terminal「Billet de Terminal · 终端票根」(rococo_v2_terminal.js/.css + b12v/ art, sources in b12v/SOURCES.md) — 2026-10-28 10:10
TM_JS = rd('rococo_v2_terminal.js')
for k in sorted(set(re.findall(r'__B12_([A-Z0-9_]+)__', TM_JS))):
    assert TM_JS.count(f'__B12_{k}__') == 1, k
    TM_JS = TM_JS.replace(f'__B12_{k}__', uri('b11v/out/paper.webp' if k == 'PAPER' else f'b12v/out/{k.lower()}.webp', 'image/webp'))
TM_CSS = rd('rococo_v2_terminal.css')
for k, f in [('__B12_FONT_R__', 'jbm_r'), ('__B12_FONT_B__', 'jbm_b'), ('__B12_FONT_I__', 'jbm_i')]:
    assert TM_CSS.count(k) == 1, k
    TM_CSS = TM_CSS.replace(k, 'data:font/woff2;base64,' + base64.b64encode(open(HERE + f'b12v/fonts/{f}.woff2', 'rb').read()).decode())

# CSS scope isolation
layers_css, all_fonts = [], []
for name, css, pfx in [('eg', EG_CSS, ['eg']), ('fl', FL_CSS, ['fl']), ('st', ST_CSS, ['st'])]:
    sc, ff, ren = scope(css, name, pfx, 'ly-' + name)
    for f in ff:
        if f not in all_fonts: all_fonts.append(f)
    layers_css.append((name, sc))
# JS of files / settings reads their CSS vars? (they do not — checked at build)
for J, nm in [(FL_JS, 'fl'), (ST_JS, 'st'), (EG_JS, 'eg')]:
    for v in ['--tw', '--scr', '--it', '--pg', '--pp', '--u']:
        assert f"var({v})" not in J, (nm, v)

# ---------------------------------------------------------------- assemble
sub1('<title>Kimi Code · 蓝雾厅 · 洛可可桌面端 rococo v1</title>', '<title>Trianon · 蓝雾厅 · a rococo desktop UI for Kimi Code (unofficial)</title>')
NORM = r"""<script>/* rococo v2 合并版: hash normaliser — prefixed scene hashes (files/… set/… eng/… rk/… nav/…) map onto each page's own names */
(()=>{const raw=decodeURIComponent(location.hash.slice(1));const PL={files:'fplay',set:'splay',settings:'splay',eng:'eplay',engine:'eplay',rk:'rkplay',nav:'play'};
const parts=raw.split(/[&,]/).filter(Boolean).map(k=>{const e=k.match(/^empty-(morning|noon|dusk|night)$/);if(e){window.__emptyTOD=e[1];return 'empty'}if(k==='br')return 'browser';const mb=k.match(/^br[\/:](.+)$/);if(mb)return /^browser/.test(mb[1])?mb[1]:'browser-'+mb[1];const m=k.match(/^(files|set|settings|eng|engine|rk|nav)[\/:](.+)$/);if(!m)return k;return m[2]==='play'?PL[m[1]]:m[2]});
const n=parts.join('&');if(n!==raw)history.replaceState(null,'','#'+n);window.__navHash=parts;
const OTHER=['empty','chat','hist','stream','tools','approval','pend','q','qok','diff','fail','end','sessions','model','cat','rkplay','fplay','splay','play',
 'files','files-search','files-nomatch','preview','preview-bin','at','at-folder','drag','compose','empty-ws',
 'account','appearance','permission','permission-confirm','engine','engine-check-ok','engine-check-fail','soon-search','soon-fav','soon-terminal',
 'search','search-typing','search-empty','search-loading','search-play','rp-peek','rp-open',
 'browser','browser-loading','browser-error','browser-newtab','browser-agent','browser-play',
 'collection','collection-list','collection-empty','collection-detail','collection-play',
 'terminal','terminal-run','terminal-split','terminal-kimi','terminal-empty','terminal-play'];
window.__navQuiet=parts.some(k=>OTHER.includes(k)||/^t=/.test(k))})();
/* ★3 right dossier: Esc closes it first — registered here (head, first window-capture keydown) so rococo_v1's approval/question Esc handlers (stopImmediatePropagation) can't swallow it */
addEventListener('keydown',e=>{const R=window.__rp;if(e.key==='Escape'&&R&&R.isOpen&&!document.body.classList.contains('sr-on')){e.preventDefault();e.stopImmediatePropagation();if(window.__bq&&window.__bq.fold())return;R.close()}},true);
/* #12 terminal: its page shortcuts (⌘K clear · ⌘D split · ⌘F find · ⌘T new · Esc) win over search's ⌘K while the terminal page is open */
addEventListener('keydown',e=>{if(window.__tmKey&&window.__tmKey(e)){e.preventDefault();e.stopImmediatePropagation()}},true);</script>"""
i = s.index('<head>') + len('<head>')
s = s[:i] + '\n' + NORM + s[i:]
idx = s.rfind('</head>')
css_all = '<style id="rococoV2">\n' + rd('rococo_v2.css') + '\n</style>\n'
css_all += '<style id="rococoV2Empty">\n' + rd('rococo_v2_empty.css') + '\n</style>\n'
css_all += '<style id="pageFonts">\n' + '\n'.join(all_fonts) + '\n</style>\n'
for name, sc in layers_css:
    css_all += f'<style id="ly-{name}">\n{sc}\n</style>\n'
css_all += '<style id="rococoV2Nav">\n' + rd('rococo_v2_nav.css') + '\n</style>\n'
css_all += '<style id="rococoV2Search">\n' + rd('rococo_v2_search.css') + '\n</style>\n'   # state #9 search (2026-10-27 13:50)
css_all += '<style id="rococoV2Browser">\n' + rd('rococo_v2_browser.css') + '\n</style>\n'   # state #10 browser (2026-10-27 17:40)
css_all += '<style id="rococoV2Collection">\n' + rd('rococo_v2_collection.css') + '\n</style>\n'   # state #11 collection (2026-10-27 23:00)
css_all += '<style id="rococoV2Terminal">\n' + TM_CSS + '\n</style>\n'   # state #12 terminal (2026-10-28 10:10)
# right dossier → concept D "Dossier à Rubans" (rpv2/, rococo_v2_rpd.css/.js)
def _rd(t):
    for k in ['board','cover','spine','pocket','card_plan','card_chg','bow','tail','band','seal','moon']:
        t = t.replace('%%RD_' + k.upper() + '%%', 'data:image/webp;base64,' + base64.b64encode(open(HERE + 'rpv2/w_rd_' + k + '.webp', 'rb').read()).decode())
    assert '%%RD_' not in t; return t
css_all += '<style id="rococoV2Rpd">\n' + _rd(rd('rococo_v2_rpd.css')) + '\n</style>\n'
RP_JS = _rd(rd('rococo_v2_rpd.js'))
# 卷宗拉手 → 人物：fx-sparkle（30 帧）+ ballet-spin（61 帧），素材已压成无损 webp 放在 src/rpa/
RPA_JS = rd('starry/rp_actor.js')
RPA_JS = RPA_JS.replace('__RPA_FX__', json.dumps([uri('rpa/fx/f%02d.webp' % i, 'image/webp') for i in range(1, 31)]))
RPA_JS = RPA_JS.replace('__RPA_SPIN__', json.dumps([uri('rpa/spin/f%02d.webp' % i, 'image/webp') for i in range(1, 62)]))
css_all += '<style id="rococoV2Rpa">\n' + rd('starry/rp_actor.css') + '\n</style>\n'
STARRY_CSS = rd('starry/starry.css')
for key, filename in [('SKY', 'sky-field.png'), ('STAR', 'star-unit.png'), ('CASTLE', 'castle-silhouette.png'), ('RIVER', 'river-reflection.png')]:
    placeholder = '__STARRY_' + key + '__'
    assert STARRY_CSS.count(placeholder) == 1, placeholder
    STARRY_CSS = STARRY_CSS.replace(placeholder, uri('starry/out/' + filename))
assert STARRY_CSS.count('__STARRY_TOOL_CASTLE__') == 1
STARRY_CSS = STARRY_CSS.replace('__STARRY_TOOL_CASTLE__', uri('starry/out/castle-field-pixel.png'))
css_all += '<style id="starryPhase1">\n' + STARRY_CSS + '\n</style>\n'
# 对话记录卡片的三段式异形像素轮廓（starry/pixel_cards.css + pixel_cards.js）
css_all += '<style id="starryPixelCards">\n' + rd('starry/pixel_cards.css') + '\n</style>\n'
# 像素字体：Ark Pixel 12px proportional（src/fonts/ark_pixel_12_zh.woff2，OFL）
PIXEL_FONT_CSS = rd('starry/pixel_font.css').replace(
    '__ARK_PIXEL__',
    'data:font/woff2;base64,' + base64.b64encode(open(HERE + 'fonts/ark_pixel_12_zh.woff2', 'rb').read()).decode())
css_all += '<style id="pixelFont">\n' + PIXEL_FONT_CSS + '\n</style>\n'
s, send_count = re.subn(r'(<div class="send"[^>]*><img src=")data:image/png;base64,[A-Za-z0-9+/=]+(")', lambda match: match.group(1) + uri('starry/out/send-lamp.png') + match.group(2), s, count=1)
assert send_count == 1, send_count
s = s[:idx] + css_all + s[idx:]
sub1('<body class="v-empty">', '<body class="v-empty ly-eg">')
STARRY_SKY_JS = rd('starry/sky.js').replace('__STARRY_BACKGROUND__', uri('starry/out/night-river-bg.jpg', 'image/jpeg'))
idx = s.rfind('</body>')
s = s[:idx] + ''.join(f'<script>\n{J}\n</script>\n' for J in [EG_JS, FL_JS, ST_JS, SR_JS, BR_JS, CL_JS, TM_JS, rd('rococo_v2_nav.js'), RP_JS, rd('rococo_v2_rp.js'), RPA_JS, STARRY_SKY_JS, rd('starry/water_reflection.js'), rd('starry/pixel_cards.js')]) + s[idx:]

# ---------------------------------------------------------------- big PNGs -> lossless WebP (pixel-identical, exact alpha) when smaller
import io
from PIL import Image
_webp_cache = {}
def _to_webp(m):
    u = m.group(0)
    if u in _webp_cache: return _webp_cache[u]
    raw = base64.b64decode(u.split(',', 1)[1]); r = u
    try:
        im = Image.open(io.BytesIO(raw)); im.load()
        if im.mode not in ('RGBA', 'RGB'): im = im.convert('RGBA')
        bio = io.BytesIO(); im.save(bio, 'WEBP', lossless=True, exact=True, method=5, quality=100)
        if bio.tell() < len(raw) * .92: r = 'data:image/webp;base64,' + base64.b64encode(bio.getvalue()).decode()
    except Exception as e:
        print('webp skip', e)
    _webp_cache[u] = r; return r
if not os.environ.get('NOWEBP'):
    n0 = len(s); s = re.sub(r'data:image/png;base64,[A-Za-z0-9+/=]{40000,}', _to_webp, s)
    print('lossless webp:', sum(1 for k, v in _webp_cache.items() if k != v), 'of', len(_webp_cache), 'images,', n0 - len(s), 'bytes saved')

# ---------------------------------------------------------------- de-duplicate embedded images (same bytes stored once)
# a repeated data URI is kept once in a head table: window.__IMG.k for scripts and --im-k for stylesheets.
#   script  'data…'          -> __IMG.k            (whole string literal)
#   script  href="data…" in a template literal -> ${__IMG.k}
#   style   url(data…)       -> var(--im-k)
pat = re.compile(r'data:image/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]{3000,}')
cnt = {}
for m in pat.finditer(s):
    cnt[m.group(0)] = cnt.get(m.group(0), 0) + 1
dups = [u for u, n in cnt.items() if n > 1]
if os.environ.get('NODEDUPE'): dups = []
keys = {u: 'i' + hashlib.md5(u.encode()).hexdigest()[:8] for u in dups}
saved, left = 0, 0
def blocks(tag, fn):
    global s
    parts, pos = [], 0
    for m in re.finditer(r'(<%s[^>]*>)(.*?)(</%s>)' % (tag, tag), s, flags=re.S):
        parts.append(s[pos:m.start()]); parts.append(m.group(1) + fn(m.group(2)) + m.group(3)); pos = m.end()
    parts.append(s[pos:]); s = ''.join(parts)
def in_script(t):
    global saved
    for u, k in keys.items():
        n0 = t.count(u)
        if not n0: continue
        t = t.replace("'" + u + "'", '__IMG.' + k)
        t = t.replace('href="' + u + '"', 'href="${__IMG.' + k + '}"')
        saved += (n0 - t.count(u)) * len(u)
    return t
def in_style(t):
    global saved
    for u, k in keys.items():
        n0 = t.count(u)
        if not n0: continue
        for q in ['', "'", '"']:
            t = t.replace('url(' + q + u + q + ')', 'var(--im-' + k + ')')
        saved += (n0 - t.count(u)) * len(u)
    return t
if keys:
    blocks('script', in_script); blocks('style', in_style)
    left = sum(s.count(u) for u in keys)
    tbl = ('<script>window.__IMG={' + ','.join(f'{k}:"{u}"' for u, k in keys.items()) + '};'
           'for(const k in __IMG)document.documentElement.style.setProperty("--im-"+k,"url("+__IMG[k]+")");</script>')
    i = s.index('</script>', s.index('<head>')) + len('</script>')
    s = s[:i] + '\n' + tbl + s[i:]
    assert left == 0, ('duplicate image left in an unhandled context', left)
print('duplicate images:', len(keys), 'bytes saved', saved - sum(len(u) for u in keys))

ids = re.findall(r'\sid="([^"]+)"', re.sub(r'<script>.*?</script>', '', s, flags=re.S))
dup = sorted({i for i in ids if ids.count(i) > 1} - {'tvPearl', 'tvSteel'})
assert not dup, dup
assert '262k' not in re.sub(r'data:[^"\')]+', '', s), 'a 262k is left'
# 2026-10-27 21:40 global custom cursors (butterfly / ink I-beam / pillow) — cur/inject_cur.py
from importlib.machinery import SourceFileLoader
s = SourceFileLoader('inject_cur', HERE + 'cur/inject_cur.py').load_module().inject(s)
# 2026-10-28 12:54 开场「Ouverture」(o1v v1c) — rococo_v2_opening.css/.tpl.html (o1v/mg/make_opening.py) + rococo_v2_opening.js, art o1v/a/
# (fonts subset by o1v/prep.py; landing stills by o1v/cap_land.py → o1v/mg/prep_merged.py). Goes into <head> ahead of every page script
# so its input guard runs before the page's own listeners; it removes itself (and these blocks) when the opening ends or does not play.
import json as _json
OA = HERE + 'o1v/a/'
def _b64(p): return base64.b64encode(open(p, 'rb').read()).decode()
OP_CSS = rd('rococo_v2_opening.css')
for k in ['pinyon', 'corm', 'play', 'bodoni', 'mono', 'frak', 'elite']:
    assert OP_CSS.count('{{%s}}' % k) == 1, k
    OP_CSS = OP_CSS.replace('{{%s}}' % k, _b64(OA + k + '.woff2'))
OP_TPL = rd('rococo_v2_opening.tpl.html')
MG = _json.load(open(OA + 'm_land.json')) if os.path.exists(OA + 'm_land.json') else None
for k, f in [('v5', 'm_v5.webp' if MG else 'v5.webp'), ('v5hi', 'm_v5hi.webp' if MG else 'v5hi.webp'), ('wax', 'wax.webp'), ('wash', 'wash.webp')]:
    assert OP_TPL.count('{{%s}}' % k) == 1, k
    OP_TPL = OP_TPL.replace('{{%s}}' % k, _b64(OA + f))
for sc in (1, 2):
    tags = ''
    if MG:
        x, y, w, h = MG['patch']
        for tod in MG['tods']:
            tags += (f'<img class="kop-patch" data-tod="{tod}" alt="" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px" '
                     f'src="data:image/webp;base64,{_b64(OA + "m_patch_%s_%dx.webp" % (tod, sc))}">')
    assert OP_TPL.count(f'<!--PATCH{sc}x-->') == 1
    OP_TPL = OP_TPL.replace(f'<!--PATCH{sc}x-->', tags)
assert '{{' not in OP_CSS + OP_TPL
OPENING = ('<style id="kOpCss">\n' + OP_CSS + '</style>\n<template id="kOpTpl">' + OP_TPL.strip() + '</template>\n'
           '<script type="application/json" id="kOpMeta">' + _json.dumps(MG or {}) + '</script>\n<script>\n' + rd('rococo_v2_opening.js') + '\n</script>\n')
# right after <title>: still ahead of every page script, and after <meta charset> (a <div> in the template before it would end
# Blink's charset prescan and the page would decode as windows-1252)
NM = '<meta charset="utf-8">'
assert s.count(NM) == 1
i = s.index('</title>', s.index(NM)) + len('</title>')
s = s[:i] + '\n' + OPENING + s[i:]
open(OUT, 'w', encoding='utf-8').write(s)
print('wrote', OUT, len(s), 'opening', len(OPENING))
