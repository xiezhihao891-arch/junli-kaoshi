/* 军理复习 · 单页应用（无依赖） */
(function(){
'use strict';
var D=window.DATA;
var EXAM_DATE=new Date(2026,9,17,0,0,0);
var KEY='junli_review_v1';
var $view=document.getElementById('view');
var TYPE_NAME={S:'单选',M:'多选',T:'判断',F:'填空'};
var CH_SHORT={ch0:'时间整理',ch1:'中国国防',ch2:'国家安全',ch3:'军事思想',ch4:'现代战争',ch5:'信息化装备'};
var QBYID={};D.questions.forEach(function(q){QBYID[q.id]=q;});
var CBYID={};D.cards.forEach(function(c){CBYID[c.id]=c;});
var SBYID={};D.subj.forEach(function(s){SBYID[s.id]=s;});

/* ---------- storage ---------- */
var S=load();
function load(){
  var d;try{d=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){d={};}
  d.q=d.q||{};d.wrong=d.wrong||{};d.cards=d.cards||{};d.read=d.read||{};d.exams=d.exams||[];d.subj=d.subj||{};d.daily=d.daily||{};d.star=d.star||{};d.theme=d.theme||'auto';d.pref=d.pref||{};
  return d;
}
var saveT=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){toast('本地存储失败：'+e.message);}}
function today(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function pad(n){return n<10?'0'+n:''+n;}
function record(q,ok){
  var r=S.q[q.id]||{c:0,w:0};
  if(ok)r.c++;else r.w++;
  r.l=ok?1:0;r.ts=Date.now();S.q[q.id]=r;
  if(!ok)S.wrong[q.id]=Date.now();
  var t=today();S.daily[t]=S.daily[t]||{n:0,c:0};S.daily[t].n++;if(ok)S.daily[t].c++;
  save();
}

/* ---------- utils ---------- */
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function h(html){$view.innerHTML=html;$view.style.animation='none';void $view.offsetWidth;$view.style.animation='';window.scrollTo(0,0);}
function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('show');},1800);}
function go(hash){if(location.hash===hash)route();else location.hash=hash;}
function pct(a,b){return b?Math.round(a*100/b):0;}
function stripTags(s){return s.replace(/<[^>]+>/g,'');}
function icon(name){
  var p={back:'<path d="M15 18l-6-6 6-6"/>',moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',auto:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'}[name];
  return '<svg viewBox="0 0 24 24">'+p+'</svg>';
}
function topbar(title,opts){
  opts=opts||{};
  return '<div class="top">'+(opts.back?'<button class="iconbtn" data-act="back" aria-label="返回">'+icon('back')+'</button>':'')+
    '<h1>'+title+(opts.sub?' <span class="sub">'+opts.sub+'</span>':'')+'</h1>'+(opts.right||'')+'</div>';
}
function applyTheme(){var r=document.documentElement;if(S.theme==='auto')r.removeAttribute('data-theme');else r.setAttribute('data-theme',S.theme);}
applyTheme();

/* ---------- derived stats ---------- */
function qStats(filter){
  var tot=0,done=0,c=0,w=0;
  D.questions.forEach(function(q){if(filter&&!filter(q))return;tot++;var r=S.q[q.id];if(r){done++;c+=r.c;w+=r.w;}});
  return {tot:tot,done:done,c:c,w:w,acc:pct(c,c+w)};
}
function wrongList(){return Object.keys(S.wrong).filter(function(id){return QBYID[id];}).sort(function(a,b){return S.wrong[b]-S.wrong[a];});}
function cardStats(filter){var t=0,k=0,u=0;D.cards.forEach(function(c){if(filter&&!filter(c))return;t++;if(S.cards[c.id]==='k')k++;else if(S.cards[c.id]==='u')u++;});return{t:t,k:k,u:u};}
function sectionKeys(){var a=[];D.chapters.forEach(function(c){c.sections.forEach(function(s,i){a.push(c.id+'/'+i);});});return a;}
function countdown(){
  var now=new Date();var ms=EXAM_DATE-now;
  if(ms<=0){var end=new Date(2026,9,18);return now<end?{today:true}:{past:true};}
  var days=Math.floor(ms/864e5),hrs=Math.floor(ms%864e5/36e5),mins=Math.floor(ms%36e5/6e4);
  return {days:days,hrs:hrs,mins:mins};
}

/* ---------- router ---------- */
var cleanup=null;
function route(){
  if(cleanup){try{cleanup();}catch(e){}cleanup=null;}
  var hs=(location.hash||'#/home').slice(2).split('/');
  var page=hs[0]||'home';
  var tab={home:'home',stats:'home',learn:'learn',cards:'cards',timeline:'cards',practice:'practice',quiz:QZ&&QZ.fromExam?'exam':'practice',wrong:'practice',exam:'exam',subj:'exam'}[page]||'home';
  Array.prototype.forEach.call(document.querySelectorAll('.tabbar a'),function(a){a.classList.toggle('on',a.getAttribute('data-tab')===tab);});
  var fn=R[page]||R.home;fn(hs.slice(1));
}
window.addEventListener('hashchange',route);
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');if(!el)return;
  var a=el.getAttribute('data-act');
  if(a==='back'){if(history.length>1)history.back();else go('#/home');}
  else if(a==='theme'){S.theme={auto:'dark',dark:'light',light:'auto'}[S.theme];save();applyTheme();toast({auto:'跟随系统',dark:'深色模式',light:'浅色模式'}[S.theme]);route();}
  else if(a==='go'){go(el.getAttribute('data-to'));}
});
var R={};

/* ---------- HOME ---------- */
R.home=function(){
  var cd=countdown();
  var big=cd.past?'<div class="big">考试已结束</div>':cd.today?'<div class="big">就是今天<small>加油！</small></div>':'<div class="big">'+cd.days+'<small>天</small></div><div class="meta">'+cd.hrs+' 小时 '+cd.mins+' 分钟 · 2026年10月17日 军事理论考试</div>';
  var st=qStats(),cs=cardStats(),wl=wrongList().length;
  var sk=sectionKeys(),rd=sk.filter(function(k){return S.read[k];}).length;
  var t=S.daily[today()]||{n:0,c:0};
  var themeIco=S.theme==='dark'?'moon':S.theme==='light'?'sun':'auto';
  var lastExam=S.exams.length?S.exams[S.exams.length-1]:null;
  h(topbar('军理复习',{sub:'中大 · 军事理论',right:'<button class="iconbtn" data-act="theme" aria-label="切换主题">'+icon(themeIco)+'</button><button class="iconbtn" data-act="go" data-to="#/stats" aria-label="统计">'+icon('chart')+'</button>'})+
  '<div class="hero"><div class="lbl">距离考试还有</div>'+big+
  '<div class="fmt"><span>单选 20</span><span>多选 10</span><span>简答 2</span><span>论述 1</span></div></div>'+
  '<div class="grid3 mt">'+
    '<div class="stat"><div class="n">'+t.n+'</div><div class="t">今日做题</div></div>'+
    '<div class="stat"><div class="n">'+st.acc+'<small>%</small></div><div class="t">总正确率</div></div>'+
    '<div class="stat"><div class="n">'+wl+'</div><div class="t">错题待攻克</div></div>'+
  '</div>'+
  '<div class="card"><h3>复习进度</h3>'+
    prog('题库覆盖',st.done,st.tot)+prog('背诵卡已掌握',cs.k,cs.t)+prog('知识点已读',rd,sk.length)+
  '</div>'+
  '<div class="tiles">'+
    tile('⚡','每日 20 题','随机混合题型','#/practice/daily')+
    tile('📕','错题本',wl?'<span class="badge">'+wl+'</span> 道待重练':'暂无错题','#/wrong')+
    tile('⏱️','模拟考','20单选+10多选 限时','#/exam')+
    tile('🗓️','时间轴','课本时间整理','#/timeline')+
    tile('✍️','简答/论述','参考答案要点自查','#/subj')+
    tile('📊','学习统计','分章正确率','#/stats')+
  '</div>'+
  (lastExam?'<div class="card"><h3>最近一次模拟考</h3><div class="row"><div style="flex:1"><b style="font-size:24px">'+lastExam.score+'</b><span class="small"> / '+lastExam.total+' 题正确</span><div class="small">'+new Date(lastExam.ts).toLocaleString('zh-CN',{hour12:false})+' · 用时 '+fmtDur(lastExam.dur)+'</div></div><button class="btn soft" data-act="go" data-to="#/exam">再考一次</button></div></div>':'')+
  '<div class="note"><b>标注说明：</b>知识点中<b class="kb">红色加粗</b>为编者认为选择题可能考查的内容，<b class="ku">紫色加粗+下划线</b>为主观题（简答/论述）可能考查的内容（由 PDF 原文的加粗/下划线自动识别）。</div>'+
  '<div class="note"><b>资料勘误提示：</b><br>'+D.notes.map(esc).join('<br>')+'</div>'+
  '<p class="small center">内容整理自《中大军理新教材重点内容》（编者：詹哲轩）· 进度保存在本机浏览器</p>');
  var timer=setInterval(function(){if(location.hash===''||location.hash==='#/home'){var c=countdown();var m=document.querySelector('.hero .meta');if(m&&!c.past&&!c.today)m.textContent=c.hrs+' 小时 '+c.mins+' 分钟 · 2026年10月17日 军事理论考试';}},30000);
  cleanup=function(){clearInterval(timer);};
  function prog(n,a,b){return '<div class="mt"><div class="row" style="justify-content:space-between;font-size:14px"><span>'+n+'</span><span class="small">'+a+' / '+b+' · '+pct(a,b)+'%</span></div><div class="bar"><i style="width:'+pct(a,b)+'%"></i></div></div>';}
  function tile(ic,b,s,to){return '<button class="tile" data-act="go" data-to="'+to+'"><div class="ico">'+ic+'</div><b>'+b+'</b><span>'+s+'</span></button>';}
};
function fmtDur(s){s=Math.round(s);return Math.floor(s/60)+'分'+pad(s%60)+'秒';}

/* ---------- LEARN ---------- */
R.learn=function(p){
  if(p[0]&&p[1]!==undefined&&p[0]!=='search')return learnSection(p[0],+p[1],p[2]);
  var q=decodeURIComponent(p[0]==='search'?(p[1]||''):'');
  h(topbar('知识点',{sub:'按章节阅读'})+
    '<div class="search">'+icon('search')+'<input id="kw" type="search" placeholder="搜索知识点，如：积极防御、RCEP、孙子兵法" value="'+esc(q)+'" enterkeyhint="search" autocomplete="off"><button class="x" id="kwx" aria-label="清除">×</button></div>'+
    '<div id="kres"></div><div id="klist"></div>');
  var kw=document.getElementById('kw');
  function renderList(){
    var html='<div class="legend"><span><i class="kb" style="background:var(--kb-bg);color:var(--kb);font-weight:700">加粗</i> 选择题重点</span><span><i style="background:var(--ku-bg);color:var(--ku);font-weight:700;text-decoration:underline">加粗+下划线</i> 主观题重点</span></div>';
    html+='<div class="list"><button class="li" data-act="go" data-to="#/timeline"><div class="num">🗓</div><div class="main"><b>课本时间整理</b><span>时间轴 · '+D.timeline.reduce(function(a,g){return a+g.items.length;},0)+' 个时间点</span></div><span class="arr">›</span></button></div>';
    D.chapters.forEach(function(c,ci){
      var rd=c.sections.filter(function(s,i){return S.read[c.id+'/'+i];}).length;
      html+='<div class="label">'+esc(c.title)+'</div><div class="list">';
      c.sections.forEach(function(s,i){
        var nk=s.blocks.filter(function(b){return b.k===2;}).length;
        html+='<button class="li" data-act="go" data-to="#/learn/'+c.id+'/'+i+'"><div class="num">'+(S.read[c.id+'/'+i]?'✓':(i+1))+'</div><div class="main"><b>'+esc(s.title)+'</b><span>'+s.blocks.length+' 条 · 主观题重点 '+nk+' 处</span></div><span class="arr">›</span></button>';
      });
      html+='</div><div class="small" style="margin:-4px 4px 0">已读 '+rd+' / '+c.sections.length+'</div>';
    });
    document.getElementById('klist').innerHTML=html;
  }
  function doSearch(){
    var v=kw.value.trim();var box=document.getElementById('kres');
    if(!v){box.innerHTML='';document.getElementById('klist').style.display='';return;}
    document.getElementById('klist').style.display='none';
    var res=[],re=new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');
    D.chapters.forEach(function(c){c.sections.forEach(function(s,si){s.blocks.forEach(function(b,bi){var t=stripTags(b.h);if(t.indexOf(v)>=0)res.push({c:c,s:s,si:si,bi:bi,t:t});});});});
    var cards=D.cards.filter(function(c){return (c.f+c.b).indexOf(v)>=0;});
    var html='<div class="label">知识点 '+res.length+' 条</div>';
    if(res.length){html+='<div class="list">'+res.slice(0,80).map(function(r){
      var t=r.t,i=t.indexOf(v),st=Math.max(0,i-30);var snip=(st>0?'…':'')+t.slice(st,i+v.length+60)+(i+v.length+60<t.length?'…':'');
      return '<div class="res" data-act="go" data-to="#/learn/'+r.c.id+'/'+r.si+'/'+r.bi+'"><div class="where">'+esc(CH_SHORT[r.c.id]+' · '+r.s.title)+'</div><div class="txt">'+esc(snip).replace(re,'<mark>'+esc(v)+'</mark>')+'</div></div>';}).join('')+'</div>';}
    else html+='<div class="empty"><div class="e">🔍</div>没有找到"'+esc(v)+'"</div>';
    if(cards.length)html+='<div class="label">背诵卡 '+cards.length+' 张</div><div class="list">'+cards.slice(0,20).map(function(c){return '<div class="res"><div class="where">'+(c.tl?'时间轴 · '+esc(c.b):esc(CH_SHORT[c.c]+' · '+c.f))+'</div><div class="txt">'+esc(c.tl?c.f:c.b).replace(re,'<mark>'+esc(v)+'</mark>')+'</div></div>';}).join('')+'</div>';
    box.innerHTML=html;
  }
  renderList();
  var tmr;kw.addEventListener('input',function(){clearTimeout(tmr);tmr=setTimeout(function(){doSearch();history.replaceState(null,'','#/learn/search/'+encodeURIComponent(kw.value.trim()));},200);});
  document.getElementById('kwx').onclick=function(){kw.value='';doSearch();history.replaceState(null,'','#/learn');kw.focus();};
  if(q)doSearch();
};
function learnSection(cid,si,bi){
  var ci=-1;D.chapters.forEach(function(c,i){if(c.id===cid)ci=i;});
  var c=D.chapters[ci];if(!c||!c.sections[si])return go('#/learn');
  var s=c.sections[si];var only=!!S.pref.onlyKey;
  var html=s.blocks.map(function(b,i){
    if(b.t==='h3')return '<h3 id="b'+i+'">'+esc(b.h)+'</h3>';
    if(b.t==='h4')return '<h4 id="b'+i+'">'+esc(b.h)+'</h4>';
    return '<p id="b'+i+'" class="k'+b.k+'">'+b.h+'</p>';
  }).join('');
  var prev=si>0?[cid,si-1]:(ci>0?[D.chapters[ci-1].id,D.chapters[ci-1].sections.length-1]:null);
  var next=si<c.sections.length-1?[cid,si+1]:(ci<D.chapters.length-1?[D.chapters[ci+1].id,0]:null);
  var key=cid+'/'+si;
  var nq=D.questions.filter(function(q){return q.c===cid&&q.s.indexOf(s.title.split(' ')[0])>=0;}).length;
  h(topbar(esc(s.title),{back:true,sub:esc(CH_SHORT[cid])})+
    '<div class="seg"><button class="'+(only?'':'on')+'" id="m0">全部内容</button><button class="'+(only?'on':'')+'" id="m1">只看重点</button></div>'+
    '<div class="doc'+(only?' only-key':'')+'" id="doc">'+html+'</div>'+
    '<div class="row"><button class="btn '+(S.read[key]?'soft':'')+'" id="rd">'+(S.read[key]?'✓ 已读（点此取消）':'标记本节已读')+'</button></div>'+
    (nq?'<div class="row mt"><button class="btn ghost" id="pq">练习本节相关题（'+nq+'）</button></div>':'')+
    '<div class="secnav">'+(prev?'<button class="btn ghost" data-act="go" data-to="#/learn/'+prev[0]+'/'+prev[1]+'">‹ 上一节</button>':'')+(next?'<button class="btn ghost" data-act="go" data-to="#/learn/'+next[0]+'/'+next[1]+'">下一节 ›</button>':'')+'</div>');
  document.getElementById('m0').onclick=function(){S.pref.onlyKey=0;save();learnSection(cid,si);};
  document.getElementById('m1').onclick=function(){S.pref.onlyKey=1;save();learnSection(cid,si);};
  document.getElementById('rd').onclick=function(){if(S.read[key])delete S.read[key];else{S.read[key]=Date.now();toast('已标记为已读');}save();learnSection(cid,si);};
  var pq=document.getElementById('pq');if(pq)pq.onclick=function(){var sec=s.title.split(' ')[0];startQuiz(shuffle(D.questions.filter(function(q){return q.c===cid&&q.s.indexOf(sec)>=0;})),{title:s.title});};
  if(bi!==undefined){var el=document.getElementById('b'+bi);if(el){if(only&&el.className==='k0'){document.getElementById('doc').classList.remove('only-key');}setTimeout(function(){el.scrollIntoView({block:'center'});el.classList.add('flash');},60);}}
}

/* ---------- TIMELINE ---------- */
R.timeline=function(){
  var hide=!!S.pref.tlHide;
  var html=D.timeline.map(function(g,gi){return '<div class="tl-g">'+esc(g.g)+'</div>'+g.items.map(function(it,j){return '<div class="tl-i" data-i="'+gi+'_'+j+'"><div class="d">'+esc(it[0])+'</div><div class="e">'+esc(it[1])+'</div></div>';}).join('');}).join('');
  h(topbar('时间轴',{back:true,sub:'课本时间整理'})+
    '<div class="seg"><button class="'+(hide?'':'on')+'" id="t0">显示日期</button><button class="'+(hide?'on':'')+'" id="t1">遮住日期（点按查看）</button></div>'+
    '<div class="row mt"><button class="btn" data-act="go" data-to="#/cards/tl">时间轴闪卡练习</button></div>'+
    '<div class="tl'+(hide?' hide':'')+'">'+html+'</div>'+
    '<div class="note"><b>提示：</b>资料原文"时间整理"中个别日期与正文不一致（总体国家安全观、新四军），已在条目中注明；带"原文作"的为原文笔误。</div>');
  document.getElementById('t0').onclick=function(){S.pref.tlHide=0;save();R.timeline();};
  document.getElementById('t1').onclick=function(){S.pref.tlHide=1;save();R.timeline();};
  Array.prototype.forEach.call(document.querySelectorAll('.tl-i'),function(el){el.onclick=function(){el.classList.toggle('show');};});
};

/* ---------- CARDS ---------- */
R.cards=function(p){
  if(p[0])return runDeck(p[0],p[1]);
  var decks=[{id:'tl',n:'🗓 时间轴',f:function(c){return c.tl;}}].concat(D.chs.slice(1).map(function(c){return{id:c.id,n:c.title,f:function(x){return !x.tl&&x.c===c.id;}};}));
  var all=cardStats(),un=all.u;
  h(topbar('背诵卡',{sub:all.t+' 张'})+
    '<div class="card"><div class="row"><div style="flex:1"><b style="font-size:26px">'+all.k+'</b><span class="small"> / '+all.t+' 已掌握</span><div class="bar"><i style="width:'+pct(all.k,all.t)+'%"></i></div></div></div>'+
    '<div class="row mt"><button class="btn" data-act="go" data-to="#/cards/all">全部随机</button><button class="btn red" data-act="go" data-to="#/cards/unknown" '+(un?'':'disabled')+'>只练"不会" ('+un+')</button></div></div>'+
    '<div class="label">按模块</div><div class="list">'+decks.map(function(d){var s=cardStats(d.f);return '<button class="li" data-act="go" data-to="#/cards/'+d.id+'"><div class="ring" style="--p:'+pct(s.k,s.t)+'" data-v="'+pct(s.k,s.t)+'%"></div><div class="main"><b>'+esc(d.n)+'</b><span>'+s.t+' 张 · 会 '+s.k+' · 不会 '+s.u+'</span></div><span class="arr">›</span></button>';}).join('')+'</div>'+
    '<div class="row"><button class="btn ghost" data-act="go" data-to="#/timeline">查看时间轴总览</button></div>'+
    '<p class="small center mt">点卡片翻面，标记"会/不会"；"不会"的卡片会进入专项复习。</p>');
};
function runDeck(id,mode){
  var list;
  if(id==='all')list=shuffle(D.cards);
  else if(id==='unknown')list=shuffle(D.cards.filter(function(c){return S.cards[c.id]==='u';}));
  else if(id==='tl')list=D.cards.filter(function(c){return c.tl;});
  else list=D.cards.filter(function(c){return !c.tl&&c.c===id;});
  if(id!=='all'&&id!=='unknown'&&S.pref.cardShuffle)list=shuffle(list);
  var title=id==='all'?'全部卡片':id==='unknown'?'不会的卡片':id==='tl'?'时间轴闪卡':CH_SHORT[id];
  if(!list.length){h(topbar(title,{back:true})+'<div class="empty"><div class="e">🎉</div>这里没有卡片了</div>');return;}
  var i=0,flipped=false,stats={k:0,u:0};
  function render(){
    if(i>=list.length){
      h(topbar(title,{back:true})+'<div class="card summary"><div class="e" style="font-size:48px">🎯</div><h2>本轮完成</h2><p>会 <b style="color:var(--ok)">'+stats.k+'</b> · 不会 <b style="color:var(--bad)">'+stats.u+'</b></p><div class="row mt"><button class="btn" id="again">再来一轮</button>'+(stats.u?'<button class="btn red" data-act="go" data-to="#/cards/unknown">练不会的</button>':'')+'</div></div>');
      document.getElementById('again').onclick=function(){runDeck(id);};return;
    }
    var c=list[i],st=S.cards[c.id];flipped=false;
    var front=c.tl?'<span class="tag">时间轴 · '+esc(c.g)+'</span><div class="q" style="font-size:20px">'+esc(c.f)+'</div><div class="center small mt">是哪一年 / 哪一天？</div>':'<span class="tag">'+esc(CH_SHORT[c.c])+'</span><div class="q">'+esc(c.f)+'</div>';
    var back=c.tl?'<span class="tag">答案</span><div class="a date">'+esc(c.b)+'</div><div class="center small mt">'+esc(c.f)+'</div>':'<span class="tag">'+esc(c.f)+'</span><div class="a">'+esc(c.b)+'</div>';
    h(topbar(title,{back:true,right:'<button class="iconbtn" id="shf" aria-label="乱序">🔀</button>'})+
      '<div class="fc-meta"><span>'+(i+1)+' / '+list.length+(st?'<span class="fc-state '+(st==='k'?'k">会':'u">不会')+'</span>':'')+'</span><span>会 '+stats.k+' · 不会 '+stats.u+'</span></div>'+
      '<div class="bar"><i style="width:'+pct(i,list.length)+'%"></i></div>'+
      '<div class="fc-wrap"><div class="fc" id="fc"><div class="face front">'+front+'<div class="hint">点击翻面</div></div><div class="face back">'+back+'</div></div></div>'+
      '<div class="fc-btns"><button class="btn red" id="no">✗ 不会</button><button class="btn green" id="yes">✓ 会了</button></div>'+
      '<div class="row mt"><button class="btn ghost" id="prev" '+(i?'':'disabled')+'>‹ 上一张</button><button class="btn ghost" id="skip">跳过 ›</button></div>');
    var fc=document.getElementById('fc');
    fitCard();
    fc.onclick=function(){flipped=!flipped;fc.classList.toggle('flip',flipped);};
    document.getElementById('yes').onclick=function(){S.cards[c.id]='k';save();stats.k++;i++;render();};
    document.getElementById('no').onclick=function(){S.cards[c.id]='u';save();stats.u++;i++;render();};
    document.getElementById('prev').onclick=function(){i=Math.max(0,i-1);render();};
    document.getElementById('skip').onclick=function(){i++;render();};
    document.getElementById('shf').onclick=function(){list=list.slice(0,i).concat(shuffle(list.slice(i)));S.pref.cardShuffle=1;save();toast('已打乱剩余卡片');render();};
    var sx=null;fc.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});
    fc.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>70){if(dx>0)document.getElementById('yes').click();else document.getElementById('no').click();}},{passive:true});
  }
  function fitCard(){var fc=document.getElementById('fc');var m=0;Array.prototype.forEach.call(fc.querySelectorAll('.face'),function(f){f.style.position='relative';m=Math.max(m,f.scrollHeight);f.style.position='';});fc.style.minHeight=Math.max(330,m+10)+'px';}
  render();
}

/* ---------- PRACTICE ---------- */
R.practice=function(p){
  if(p[0]==='daily'){var pool=shuffle(D.questions).slice(0,20);return startQuiz(pool,{title:'每日 20 题',replace:true});}
  var pf=S.pref.pr||{ch:['all'],ty:['S','M','T','F'],n:20,order:'rand',src:'all'};S.pref.pr=pf;
  function render(){
    var pool=filterPool(pf);
    var chs=[{id:'all',n:'全部'}].concat(D.chs.map(function(c){return{id:c.id,n:CH_SHORT[c.id]};}));
    var st=qStats();
    h(topbar('刷题',{sub:D.questions.length+' 题'})+
      '<div class="grid2">'+['S','M','T','F'].map(function(t){var s=qStats(function(q){return q.t===t;});return '<div class="stat"><div class="n">'+s.tot+'<small> 题</small></div><div class="t">'+TYPE_NAME[t]+'题 · 已做 '+s.done+' · 正确率 '+s.acc+'%</div><div class="bar"><i style="width:'+pct(s.done,s.tot)+'%"></i></div></div>';}).join('')+'</div>'+
      '<div class="label">章节</div><div class="chips" id="chs">'+chs.map(function(c){return '<button class="chip'+(pf.ch.indexOf(c.id)>=0?' on':'')+'" data-v="'+c.id+'">'+esc(c.n)+'</button>';}).join('')+'</div>'+
      '<div class="label">题型</div><div class="chips" id="tys">'+['S','M','T','F'].map(function(t){return '<button class="chip'+(pf.ty.indexOf(t)>=0?' on':'')+'" data-v="'+t+'">'+TYPE_NAME[t]+'</button>';}).join('')+'</div>'+
      '<div class="label">题目范围</div><div class="seg" id="src">'+[['all','全部'],['new','未做过'],['wrong','做错过'],['star','收藏']].map(function(x){return '<button class="'+(pf.src===x[0]?'on':'')+'" data-v="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>'+
      '<div class="label">数量与顺序</div><div class="seg" id="num">'+[10,20,50,0].map(function(n){return '<button class="'+(pf.n===n?'on':'')+'" data-v="'+n+'">'+(n?n+' 题':'全部')+'</button>';}).join('')+'</div>'+
      '<div class="seg mt" id="ord"><button class="'+(pf.order==='rand'?'on':'')+'" data-v="rand">随机</button><button class="'+(pf.order==='seq'?'on':'')+'" data-v="seq">顺序</button></div>'+
      '<div class="qfoot"><button class="btn" id="go" '+(pool.length?'':'disabled')+'>开始练习（可选 '+pool.length+' 题）</button></div>'+
      '<div class="list mt"><button class="li" data-act="go" data-to="#/wrong"><div class="num">📕</div><div class="main"><b>错题本</b><span>'+wrongList().length+' 道错题，自动收集</span></div><span class="arr">›</span></button><button class="li" data-act="go" data-to="#/practice/daily"><div class="num">⚡</div><div class="main"><b>每日 20 题</b><span>全库随机混合</span></div><span class="arr">›</span></button></div>');
    bindChips('chs',function(v){if(v==='all')pf.ch=['all'];else{pf.ch=pf.ch.filter(function(x){return x!=='all';});toggle(pf.ch,v);if(!pf.ch.length)pf.ch=['all'];}});
    bindChips('tys',function(v){toggle(pf.ty,v);if(!pf.ty.length)pf.ty=[v];});
    bindSeg('src',function(v){pf.src=v;});bindSeg('num',function(v){pf.n=+v;});bindSeg('ord',function(v){pf.order=v;});
    document.getElementById('go').onclick=function(){
      var list=filterPool(pf);if(pf.order==='rand')list=shuffle(list);
      if(pf.n)list=list.slice(0,pf.n);
      startQuiz(list,{title:'刷题练习'});
    };
  }
  function bindChips(id,fn){Array.prototype.forEach.call(document.querySelectorAll('#'+id+' .chip'),function(b){b.onclick=function(){fn(b.getAttribute('data-v'));save();render();};});}
  function bindSeg(id,fn){Array.prototype.forEach.call(document.querySelectorAll('#'+id+' button'),function(b){b.onclick=function(){fn(b.getAttribute('data-v'));save();render();};});}
  function toggle(a,v){var i=a.indexOf(v);if(i>=0)a.splice(i,1);else a.push(v);}
  render();
};
function filterPool(pf){
  return D.questions.filter(function(q){
    if(pf.ch.indexOf('all')<0&&pf.ch.indexOf(q.c)<0)return false;
    if(pf.ty.indexOf(q.t)<0)return false;
    if(pf.src==='new'&&S.q[q.id])return false;
    if(pf.src==='wrong'&&!(S.q[q.id]&&S.q[q.id].w))return false;
    if(pf.src==='star'&&!S.star[q.id])return false;
    return true;
  });
}

/* ---------- QUIZ ENGINE ---------- */
var QZ=null;
function prep(q){
  var o={q:q,ans:null,ok:null};
  if(q.t==='S'||q.t==='M'){o.order=shuffle(q.o.map(function(_,i){return i;}));}
  return o;
}
function startQuiz(list,opt){
  if(!list.length){toast('没有符合条件的题目');return;}
  QZ={items:list.map(prep),i:0,title:opt.title||'练习',wrongMode:!!opt.wrongMode,fromExam:false};
  if(opt.replace)history.replaceState(null,'','#/quiz');
  go('#/quiz');
}
function normFill(s){return String(s).replace(/[\s，。、,.;；:：“”"'‘’「」《》（）()!！?？·]/g,'').replace(/[０-９]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-65248);}).replace(/[～~\-—至到]/g,'~').toLowerCase();}
function checkFill(q,vals){return q.a.map(function(alts,i){var v=normFill(vals[i]||'');return v.length>0&&alts.some(function(a){return normFill(a)===v;});});}
function fmtAnswer(q){
  if(q.t==='S'||q.t==='M')return q.a.map(function(i){return q.o[i];}).join('；');
  if(q.t==='T')return q.a?'正确':'错误';
  return q.a.map(function(x){return x[0];}).join('；');
}
function qtext(q){
  var t=esc(q.q);if(q.t==='F'){var n=0;t=t.replace(/____/g,function(){n++;return '<span class="blank">（'+n+'）</span>';});}
  return t;
}
function renderQuestionBody(it,mode){ // mode: 'practice' | 'exam' | 'review'
  var q=it.q,html='',done=it.ok!==null&&mode!=='exam';
  var showRes=mode==='review'||(mode==='practice'&&done);
  if(q.t==='S'||q.t==='M'){
    html+='<div class="opts'+(showRes?' done':'')+'">'+it.order.map(function(oi,k){
      var cls='',sel=it.ans&&it.ans.indexOf(oi)>=0;
      if(showRes){var right=q.a.indexOf(oi)>=0;if(right&&sel)cls='ok';else if(sel)cls='bad';else if(right)cls=q.t==='M'?'ok miss':'ok';}
      else if(sel)cls='sel';
      return '<button class="opt '+cls+'" data-oi="'+oi+'"><span class="k">'+'ABCDE'[k]+'</span><span>'+esc(q.o[oi])+'</span></button>';}).join('')+'</div>';
  }else if(q.t==='T'){
    html+='<div class="tf opts'+(showRes?' done':'')+'">'+[true,false].map(function(v){
      var cls='',sel=it.ans===v;
      if(showRes){if(v===q.a)cls='ok';else if(sel)cls='bad';}else if(sel)cls='sel';
      return '<button class="opt '+cls+'" data-tf="'+(v?1:0)+'">'+(v?'✓ 正确':'✗ 错误')+'</button>';}).join('')+'</div>';
  }else{
    var res=showRes?checkFill(q,it.ans||[]):null;
    html+='<div class="fill">'+q.a.map(function(_,i){return '<input data-fi="'+i+'" placeholder="第 '+(i+1)+' 空" autocomplete="off" autocapitalize="off" enterkeyhint="done" value="'+esc((it.ans||[])[i]||'')+'" '+(showRes?'readonly class="'+(res[i]||it.selfOk?'ok':'bad')+'"':'')+'>';}).join('')+'</div>';
  }
  if(showRes){
    html+='<div class="fb '+(it.ok?'ok':'bad')+'"><div class="h">'+(it.ok?'✓ 回答正确':'✗ 回答错误')+'</div>'+
      (it.ok&&q.t!=='F'?'':'<div>正确答案：<b>'+esc(fmtAnswer(q))+'</b></div>')+
      '<div style="margin-top:6px">'+esc(q.e)+'</div><div class="src">出处：'+esc(q.s)+'</div>'+
      (q.t==='F'&&!it.ok&&mode==='practice'?'<button class="btn soft mt" id="selfok" style="min-height:42px;font-size:14px">我的答案意思一致，算我对</button>':'')+'</div>';
  }
  return html;
}
R.quiz=function(){
  if(!QZ){go('#/practice');return;}
  var it=QZ.items[QZ.i];
  if(!it)return quizSummary();
  var q=it.q,done=it.ok!==null;
  var tc={S:'',M:'m',T:'t',F:'f'}[q.t];
  h(topbar(esc(QZ.title),{back:true,right:'<button class="star'+(S.star[q.id]?' on':'')+'" id="star" aria-label="收藏">★</button>'})+
    '<div class="qhead"><div class="prog"><div class="bar"><i style="width:'+pct(QZ.i+(done?1:0),QZ.items.length)+'%"></i></div></div><div class="cnt">'+(QZ.i+1)+' / '+QZ.items.length+'</div></div>'+
    '<div class="qcard"><span class="qtype '+tc+'">'+TYPE_NAME[q.t]+'题</span><span class="qsec">'+esc(q.s)+'</span>'+
    '<div class="qtext">'+qtext(q)+'</div><div id="qb">'+renderQuestionBody(it,'practice')+'</div></div>'+
    '<div class="qfoot">'+(QZ.i>0?'<button class="btn ghost" id="prev" style="flex:0 0 90px">‹</button>':'')+
    (done?'<button class="btn" id="next">'+(QZ.i===QZ.items.length-1?'查看结果':'下一题 ›')+'</button>':(q.t==='M'||q.t==='F')?'<button class="btn" id="submit">提交答案</button>':'<button class="btn ghost" id="skip">跳过</button>')+'</div>');
  bindQuestion(it,'practice',function(){answered(it);});
  var st=document.getElementById('star');st.onclick=function(){if(S.star[q.id])delete S.star[q.id];else S.star[q.id]=1;save();st.classList.toggle('on');toast(S.star[q.id]?'已收藏':'已取消收藏');};
  var pv=document.getElementById('prev');if(pv)pv.onclick=function(){QZ.i--;R.quiz();};
  var nx=document.getElementById('next');if(nx)nx.onclick=function(){QZ.i++;R.quiz();};
  var sk=document.getElementById('skip');if(sk)sk.onclick=function(){QZ.i++;R.quiz();};
  var sb=document.getElementById('submit');if(sb)sb.onclick=function(){
    if(q.t==='M'&&(!it.ans||it.ans.length<1)){toast('请至少选择一个选项');return;}
    if(q.t==='F'){it.ans=readFill();if(!it.ans.some(function(x){return x.trim();})){toast('请先填写答案');return;}}
    answered(it);
  };
  var so=document.getElementById('selfok');if(so)so.onclick=selfOk;
  function readFill(){return Array.prototype.map.call(document.querySelectorAll('[data-fi]'),function(x){return x.value;});}
  function selfOk(){
    it.ok=true;it.selfOk=true;var r=S.q[q.id];if(r){r.w=Math.max(0,r.w-1);r.c++;r.l=1;}
    var t=S.daily[today()];if(t)t.c++;
    if(QZ.wrongMode)delete S.wrong[q.id];else if(r&&!r.w)delete S.wrong[q.id];
    save();R.quiz();
  }
  var inp=document.querySelector('[data-fi]');if(inp&&!done){Array.prototype.forEach.call(document.querySelectorAll('[data-fi]'),function(x){x.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var n=document.querySelector('[data-fi="'+(+x.getAttribute('data-fi')+1)+'"]');if(n)n.focus();else document.getElementById('submit').click();}});});}
};
function judge(it){
  var q=it.q;
  if(q.t==='S'||q.t==='M'){var a=(it.ans||[]).slice().sort(function(x,y){return x-y;});return a.length===q.a.length&&a.every(function(v,i){return v===q.a[i];});}
  if(q.t==='T')return it.ans===q.a;
  return checkFill(q,it.ans||[]).every(Boolean);
}
function answered(it){
  it.ok=judge(it);record(it.q,it.ok);
  if(it.ok&&QZ.wrongMode){delete S.wrong[it.q.id];save();}
  if(navigator.vibrate&&!it.ok)try{navigator.vibrate(30);}catch(e){}
  R.quiz();
  setTimeout(function(){var fb=document.querySelector('.fb');if(fb&&fb.getBoundingClientRect().bottom>window.innerHeight-140)fb.scrollIntoView({behavior:'smooth',block:'center'});},50);
}
function bindQuestion(it,mode,onDone){
  var q=it.q;var locked=mode==='review'||(mode==='practice'&&it.ok!==null);
  if(locked)return;
  Array.prototype.forEach.call(document.querySelectorAll('[data-oi]'),function(b){b.onclick=function(){
    var oi=+b.getAttribute('data-oi');
    if(q.t==='S'){it.ans=[oi];if(mode==='practice')onDone();else{refreshOpts();onDone&&onDone();}}
    else{it.ans=it.ans||[];var k=it.ans.indexOf(oi);if(k>=0)it.ans.splice(k,1);else it.ans.push(oi);refreshOpts();if(mode==='exam'&&onDone)onDone();}
  };});
  Array.prototype.forEach.call(document.querySelectorAll('[data-tf]'),function(b){b.onclick=function(){it.ans=b.getAttribute('data-tf')==='1';if(mode==='practice')onDone();else{refreshOpts();onDone&&onDone();}};});
  function refreshOpts(){Array.prototype.forEach.call(document.querySelectorAll('[data-oi]'),function(b){b.classList.toggle('sel',it.ans.indexOf(+b.getAttribute('data-oi'))>=0);});}
}
function quizSummary(){
  var n=QZ.items.length,ans=QZ.items.filter(function(x){return x.ok!==null;}),ok=ans.filter(function(x){return x.ok;}).length;
  var wrong=QZ.items.filter(function(x){return x.ok===false;});
  h(topbar('练习完成',{back:true})+
    '<div class="card summary"><div class="score">'+ok+'<small> / '+ans.length+'</small></div><p class="small">共 '+n+' 题，作答 '+ans.length+' 题，正确率 '+pct(ok,ans.length)+'%</p>'+
    '<div class="row mt">'+(wrong.length?'<button class="btn red" id="rw">重做本轮错题（'+wrong.length+'）</button>':'')+'<button class="btn" data-act="go" data-to="#/practice">返回刷题</button></div></div>'+
    (wrong.length?'<div class="label">本轮错题</div><div class="list">'+wrong.map(function(x){return '<div class="res"><div class="where">'+TYPE_NAME[x.q.t]+' · '+esc(x.q.s)+'</div><div class="txt">'+esc(x.q.q)+'<br><span class="small">答案：'+esc(fmtAnswer(x.q))+'</span></div></div>';}).join('')+'</div>':''));
  var rw=document.getElementById('rw');if(rw)rw.onclick=function(){startQuiz(shuffle(wrong.map(function(x){return x.q;})),{title:'重做错题',wrongMode:true,replace:true});};
}

/* ---------- WRONG BOOK ---------- */
R.wrong=function(){
  var ids=wrongList();var by={S:[],M:[],T:[],F:[]};ids.forEach(function(id){by[QBYID[id].t].push(QBYID[id]);});
  if(!ids.length){h(topbar('错题本',{back:true})+'<div class="empty"><div class="e">📕</div><p>还没有错题。<br>刷题和模拟考中答错的题会自动收集到这里。</p><button class="btn" data-act="go" data-to="#/practice">去刷题</button></div>');return;}
  h(topbar('错题本',{back:true,sub:ids.length+' 题'})+
    '<div class="card"><div class="row"><button class="btn red" id="all">全部重练（'+ids.length+'）</button></div><p class="small mt" style="margin-bottom:0">在"错题重练"中答对即自动移出错题本。</p>'+
    '<div class="chips mt">'+['S','M','T','F'].filter(function(t){return by[t].length;}).map(function(t){return '<button class="chip" data-t="'+t+'">只练'+TYPE_NAME[t]+'（'+by[t].length+'）</button>';}).join('')+'</div></div>'+
    '<div class="list">'+ids.map(function(id){var q=QBYID[id],r=S.q[id]||{c:0,w:0};return '<div class="res" data-id="'+id+'"><div class="where">'+TYPE_NAME[q.t]+' · '+esc(q.s)+' · 错 '+r.w+' 次</div><div class="txt">'+esc(q.q)+'</div><div class="small">答案：'+esc(fmtAnswer(q))+'</div><div class="row" style="margin-top:6px"><button class="chip" data-rm="'+id+'">移出错题本</button></div></div>';}).join('')+'</div>');
  document.getElementById('all').onclick=function(){startQuiz(shuffle(ids.map(function(id){return QBYID[id];})),{title:'错题重练',wrongMode:true});};
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'),function(b){b.onclick=function(){startQuiz(shuffle(by[b.getAttribute('data-t')]),{title:'错题重练',wrongMode:true});};});
  Array.prototype.forEach.call(document.querySelectorAll('[data-rm]'),function(b){b.onclick=function(e){e.stopPropagation();delete S.wrong[b.getAttribute('data-rm')];save();toast('已移出');R.wrong();};});
};

/* ---------- MOCK EXAM ---------- */
var EX=null;
function loadExam(){if(EX)return EX;try{var e=JSON.parse(localStorage.getItem(KEY+'_exam')||'null');if(e){e.items=e.items.map(function(x){return{q:QBYID[x.id],order:x.order,ans:x.ans,ok:x.ok===undefined?null:x.ok};}).filter(function(x){return x.q;});EX=e;}}catch(err){}return EX;}
function saveExam(){if(!EX){localStorage.removeItem(KEY+'_exam');return;}localStorage.setItem(KEY+'_exam',JSON.stringify({start:EX.start,dur:EX.dur,i:EX.i,done:EX.done,subj:EX.subj,end:EX.end,items:EX.items.map(function(x){return{id:x.q.id,order:x.order,ans:x.ans,ok:x.ok};})}));}
R.exam=function(p){
  loadExam();
  if(p[0]==='run'&&EX&&!EX.done)return examRun();
  if(p[0]==='result'&&EX&&EX.done)return examResult();
  if(p[0]==='review'&&EX&&EX.done)return examReview(+(p[1]||0));
  if(p[0]==='subj'&&EX&&EX.done)return examSubj();
  var dur=S.pref.exDur||30;
  var hist=S.exams.slice(-8).reverse();
  h(topbar('模拟考',{sub:'仿真题型'})+
    '<div class="hero"><div class="lbl">客观题限时测验</div><div class="big" style="font-size:40px">20<small>单选</small> + 10<small>多选</small></div><div class="meta">从题库随机抽题 · 自动判分 · 错题自动进错题本<br>交卷后继续练习 2 道简答 + 1 道论述（对照参考要点自评）</div></div>'+
    (EX&&!EX.done?'<div class="card"><b>你有一场未完成的模拟考</b><div class="row mt"><button class="btn" data-act="go" data-to="#/exam/run">继续作答</button><button class="btn ghost" id="drop">放弃</button></div></div>':'')+
    '<div class="label">考试时长</div><div class="seg" id="dur">'+[20,30,45].map(function(m){return '<button class="'+(dur===m?'on':'')+'" data-v="'+m+'">'+m+' 分钟</button>';}).join('')+'</div>'+
    '<p class="small" style="margin:8px 4px">真实考试时长与分值以学校通知为准；多选题须全部选对才得分。</p>'+
    '<div class="row mt"><button class="btn block" id="start">开始模拟考</button></div>'+
    (EX&&EX.done?'<div class="row mt"><button class="btn ghost" data-act="go" data-to="#/exam/result">查看上次结果</button></div>':'')+
    '<div class="list mt"><button class="li" data-act="go" data-to="#/subj"><div class="num">✍️</div><div class="main"><b>简答 / 论述题库</b><span>'+D.subj.filter(function(s){return s.type==='简答';}).length+' 道简答 · '+D.subj.filter(function(s){return s.type==='论述';}).length+' 道论述 · 参考要点均出自资料</span></div><span class="arr">›</span></button></div>'+
    (hist.length?'<div class="label">历史成绩</div><div class="list">'+hist.map(function(x){return '<div class="li"><div class="ring" style="--p:'+pct(x.score,x.total)+'" data-v="'+pct(x.score,x.total)+'"></div><div class="main"><b>'+x.score+' / '+x.total+'（单选 '+x.s+'/20 · 多选 '+x.m+'/10）</b><span>'+new Date(x.ts).toLocaleString('zh-CN',{hour12:false})+' · 用时 '+fmtDur(x.dur)+'</span></div></div>';}).join('')+'</div>':''));
  Array.prototype.forEach.call(document.querySelectorAll('#dur button'),function(b){b.onclick=function(){S.pref.exDur=+b.getAttribute('data-v');save();R.exam([]);};});
  var dr=document.getElementById('drop');if(dr)dr.onclick=function(){if(confirm('确定放弃这场模拟考吗？')){EX=null;saveExam();R.exam([]);}};
  document.getElementById('start').onclick=function(){
    if(EX&&!EX.done&&!confirm('将放弃未完成的模拟考并重新开始，确定吗？'))return;
    var ss=shuffle(D.questions.filter(function(q){return q.t==='S';})).slice(0,20);
    var mm=shuffle(D.questions.filter(function(q){return q.t==='M';})).slice(0,10);
    EX={start:Date.now(),dur:(S.pref.exDur||30)*60,i:0,done:false,items:ss.concat(mm).map(prep)};
    var sj=shuffle(D.subj.filter(function(s){return s.type==='简答';})).slice(0,2).concat(shuffle(D.subj.filter(function(s){return s.type==='论述';})).slice(0,1));
    EX.subj=sj.map(function(s){return s.id;});
    saveExam();go('#/exam/run');
  };
};
function examRun(){
  var it=EX.items[EX.i],q=it.q;
  var remain=function(){return Math.max(0,Math.round(EX.dur-(Date.now()-EX.start)/1000));};
  var answeredN=EX.items.filter(function(x){return x.ans&&x.ans.length;}).length;
  h(topbar('模拟考',{right:'<span class="timer" id="tm">--:--</span>'})+
    '<div class="qhead"><div class="prog"><div class="bar"><i style="width:'+pct(answeredN,30)+'%"></i></div></div><div class="cnt">已答 '+answeredN+' / 30</div></div>'+
    '<div class="qcard"><span class="qtype '+(q.t==='M'?'m':'')+'">'+(q.t==='S'?'一、单选题':'二、多选题')+'</span><span class="qsec">第 '+(EX.i+1)+' 题</span>'+
    '<div class="qtext">'+qtext(q)+'</div><div id="qb">'+renderQuestionBody(it,'exam')+'</div></div>'+
    '<div class="qfoot"><button class="btn ghost" id="prev" '+(EX.i?'':'disabled')+' style="flex:0 0 80px">‹</button><button class="btn ghost" id="sheet" style="flex:0 0 80px">'+icon('list').replace('<svg','<svg style="width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2"')+'</button>'+
    (EX.i<29?'<button class="btn" id="next">下一题 ›</button>':'<button class="btn red" id="submit">交卷</button>')+'</div>');
  bindQuestion(it,'exam',function(){saveExam();if(q.t==='S'&&EX.i<29)setTimeout(function(){if(EX&&!EX.done&&EX.items[EX.i]===it){EX.i++;saveExam();examRun();}},280);});
  document.getElementById('prev').onclick=function(){EX.i--;saveExam();examRun();};
  var nx=document.getElementById('next');if(nx)nx.onclick=function(){EX.i++;saveExam();examRun();};
  var sb=document.getElementById('submit');if(sb)sb.onclick=function(){trySubmit();};
  document.getElementById('sheet').onclick=showSheet;
  function tick(){var r=remain(),el=document.getElementById('tm');if(el){el.textContent=pad(Math.floor(r/60))+':'+pad(r%60);el.classList.toggle('warn',r<=120);}if(r<=0){clearInterval(t);toast('时间到，自动交卷');submitExam();}}
  var t=setInterval(tick,1000);tick();
  cleanup=function(){clearInterval(t);var m=document.querySelector('.modal-bg');if(m)m.remove();};
  function trySubmit(){var un=30-EX.items.filter(function(x){return x.ans&&x.ans.length;}).length;if(un&&!confirm('还有 '+un+' 题未作答，确定交卷吗？'))return;submitExam();}
  function showSheet(){
    var m=document.createElement('div');m.className='modal-bg';
    m.innerHTML='<div class="modal"><h2>答题卡</h2><div class="label">单选题</div><div class="sheet">'+EX.items.slice(0,20).map(cell).join('')+'</div><div class="label">多选题</div><div class="sheet">'+EX.items.slice(20).map(function(x,k){return cell(x,k+20);}).join('')+'</div><div class="row mt"><button class="btn ghost" id="cl">继续答题</button><button class="btn red" id="sub2">交卷</button></div></div>';
    function cell(x,k){return '<button class="'+(x.ans&&x.ans.length?'done':'')+(k===EX.i?' cur':'')+'" data-k="'+k+'">'+(k+1)+'</button>';}
    document.body.appendChild(m);
    m.onclick=function(e){if(e.target===m)m.remove();var k=e.target.getAttribute('data-k');if(k!==null){EX.i=+k;saveExam();m.remove();examRun();}};
    m.querySelector('#cl').onclick=function(){m.remove();};
    m.querySelector('#sub2').onclick=function(){m.remove();trySubmit();};
  }
}
function submitExam(){
  if(!EX||EX.done)return;
  EX.done=true;EX.end=Date.now();
  var s=0,m=0;EX.items.forEach(function(it,k){it.ok=judge(it);record(it.q,it.ok);if(it.ok){if(k<20)s++;else m++;}});
  S.exams.push({ts:EX.end,score:s+m,total:30,s:s,m:m,dur:Math.min(EX.dur,(EX.end-EX.start)/1000)});save();saveExam();
  go('#/exam/result');
}
function examResult(){
  var s=EX.items.slice(0,20).filter(function(x){return x.ok;}).length,m=EX.items.slice(20).filter(function(x){return x.ok;}).length;
  h(topbar('模拟考成绩',{back:true})+
    '<div class="card summary"><div class="score">'+(s+m)+'<small> / 30</small></div><p>单选 <b>'+s+'</b>/20 · 多选 <b>'+m+'</b>/10 · 正确率 '+pct(s+m,30)+'%</p><p class="small">用时 '+fmtDur(Math.min(EX.dur,(EX.end-EX.start)/1000))+' · 错题已加入错题本</p></div>'+
    '<div class="card"><h3>答题情况（点题号查看解析）</h3><div class="label">单选题</div><div class="sheet">'+EX.items.slice(0,20).map(function(x,k){return '<button class="'+(x.ok?'ok':'bad')+'" data-act="go" data-to="#/exam/review/'+k+'">'+(k+1)+'</button>';}).join('')+'</div><div class="label">多选题</div><div class="sheet">'+EX.items.slice(20).map(function(x,k){return '<button class="'+(x.ok?'ok':'bad')+'" data-act="go" data-to="#/exam/review/'+(k+20)+'">'+(k+21)+'</button>';}).join('')+'</div></div>'+
    '<div class="row"><button class="btn" data-act="go" data-to="#/exam/subj">继续：简答 + 论述自测 ›</button></div>'+
    '<div class="row mt"><button class="btn ghost" data-act="go" data-to="#/exam/review/0">逐题查看解析</button><button class="btn ghost" data-act="go" data-to="#/exam">返回</button></div>');
}
function examReview(k){
  var it=EX.items[k];if(!it)return go('#/exam/result');
  h(topbar('解析 '+(k+1)+' / 30',{back:true})+
    '<div class="qcard"><span class="qtype '+(it.q.t==='M'?'m':'')+'">'+TYPE_NAME[it.q.t]+'题</span><span class="qsec">'+esc(it.q.s)+'</span><div class="qtext">'+qtext(it.q)+'</div>'+(it.ans&&it.ans.length?'':'<p class="small" style="color:var(--bad)">（未作答）</p>')+renderQuestionBody(it,'review')+'</div>'+
    '<div class="qfoot"><button class="btn ghost" '+(k?'':'disabled')+' data-act="go" data-to="#/exam/review/'+(k-1)+'">‹ 上一题</button>'+(k<29?'<button class="btn" data-act="go" data-to="#/exam/review/'+(k+1)+'">下一题 ›</button>':'<button class="btn" data-act="go" data-to="#/exam/result">返回成绩</button>')+'</div>');
  history.replaceState(null,'','#/exam/review/'+k);
}
function examSubj(){
  var list=(EX.subj||[]).map(function(id){return SBYID[id];}).filter(Boolean);
  h(topbar('主观题自测',{back:true,sub:'2 简答 + 1 论述'})+
    '<p class="small" style="margin:4px">先独立作答（可打字或在纸上写），再展开参考要点逐条自查，并给自己评分。</p>'+
    list.map(function(s,k){return subjCard(s,(k<2?'三、简答题 ':'四、论述题 ')+(k+1));}).join('')+
    '<div class="row"><button class="btn" data-act="go" data-to="#/exam">完成</button></div>');
  bindSubj();
}
function subjCard(s,label){
  var r=S.subj[s.id];
  return '<div class="card" data-sid="'+s.id+'"><span class="qtype '+(s.type==='论述'?'f':'m')+'">'+esc(label||s.type)+'</span><span class="qsec">'+esc(CH_SHORT[s.c])+'</span>'+
    '<div class="subj-q mt">'+esc(s.q)+'</div>'+
    '<textarea placeholder="在这里写下你的答案要点（仅保存在本页，不会上传）"></textarea>'+
    '<div class="row mt"><button class="btn soft" data-show="'+s.id+'">查看参考要点</button></div>'+
    '<div class="subj-a" id="a_'+s.id+'" style="display:none"><b>参考答案要点（整理自资料）</b><ol>'+s.p.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol>'+
    '<div class="label">自评</div><div class="chips">'+[['3','掌握'],['2','一般'],['1','不会']].map(function(x){return '<button class="chip'+(r===+x[0]?' on':'')+'" data-rate="'+s.id+':'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div></div></div>';
}
function bindSubj(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-show]'),function(b){b.onclick=function(){var a=document.getElementById('a_'+b.getAttribute('data-show'));var vis=a.style.display!=='none';a.style.display=vis?'none':'';b.textContent=vis?'查看参考要点':'收起参考要点';};});
  Array.prototype.forEach.call(document.querySelectorAll('[data-rate]'),function(b){b.onclick=function(){var p=b.getAttribute('data-rate').split(':');S.subj[p[0]]=+p[1];save();Array.prototype.forEach.call(b.parentNode.children,function(c){c.classList.toggle('on',c===b);});toast('已记录自评');};});
}
R.subj=function(p){
  var ty=p[0]==='lun'?'论述':p[0]==='all'?'':'简答';
  var list=D.subj.filter(function(s){return !ty||s.type===ty;});
  var done=list.filter(function(s){return S.subj[s.id]===3;}).length;
  h(topbar('简答 / 论述',{back:true})+
    '<div class="seg"><button class="'+(ty==='简答'?'on':'')+'" data-act="go" data-to="#/subj/jian">简答 '+D.subj.filter(function(s){return s.type==='简答';}).length+'</button><button class="'+(ty==='论述'?'on':'')+'" data-act="go" data-to="#/subj/lun">论述 '+D.subj.filter(function(s){return s.type==='论述';}).length+'</button><button class="'+(!ty?'on':'')+'" data-act="go" data-to="#/subj/all">全部</button></div>'+
    '<p class="small" style="margin:10px 4px">已自评"掌握" '+done+' / '+list.length+'。参考要点全部摘自资料中的<b class="ku">加粗+下划线</b>等内容。</p>'+
    list.map(function(s){return subjCard(s);}).join(''));
  bindSubj();
};

/* ---------- STATS ---------- */
R.stats=function(){
  var st=qStats(),cs=cardStats();
  var chRows=D.chs.map(function(c){var s=qStats(function(q){return q.c===c.id;});return '<div class="hbar"><span class="nm">'+esc(CH_SHORT[c.id])+'</span><div class="bar"><i style="width:'+s.acc+'%"></i></div><span class="v">'+(s.c+s.w?s.acc+'%':'—')+'</span></div><div class="small" style="margin:-6px 0 6px 102px">已做 '+s.done+'/'+s.tot+'</div>';}).join('');
  var tyRows=['S','M','T','F'].map(function(t){var s=qStats(function(q){return q.t===t;});return '<div class="hbar"><span class="nm">'+TYPE_NAME[t]+'题</span><div class="bar"><i style="width:'+s.acc+'%"></i></div><span class="v">'+(s.c+s.w?s.acc+'%':'—')+'</span></div>';}).join('');
  var days=[];for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var k=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());days.push({k:k,l:(d.getMonth()+1)+'/'+d.getDate(),n:(S.daily[k]||{n:0}).n});}
  var mx=Math.max.apply(null,days.map(function(x){return x.n;}).concat([1]));
  var sk=sectionKeys(),rd=sk.filter(function(k){return S.read[k];}).length;
  var subjM=Object.keys(S.subj).filter(function(k){return S.subj[k]===3;}).length;
  var tot=Object.keys(S.daily).reduce(function(a,k){return a+S.daily[k].n;},0);
  var streak=0;for(var j=0;j<365;j++){var dd=new Date();dd.setDate(dd.getDate()-j);var kk=dd.getFullYear()+'-'+pad(dd.getMonth()+1)+'-'+pad(dd.getDate());if(S.daily[kk]&&S.daily[kk].n)streak++;else if(j>0)break;}
  h(topbar('学习统计',{back:true})+
    '<div class="grid2"><div class="stat"><div class="n">'+tot+'</div><div class="t">累计作答次数</div></div><div class="stat"><div class="n">'+streak+'<small> 天</small></div><div class="t">连续学习</div></div>'+
    '<div class="stat"><div class="n">'+st.done+'<small>/'+st.tot+'</small></div><div class="t">题库覆盖</div><div class="bar"><i style="width:'+pct(st.done,st.tot)+'%"></i></div></div><div class="stat"><div class="n">'+st.acc+'<small>%</small></div><div class="t">总正确率</div><div class="bar"><i style="width:'+st.acc+'%"></i></div></div>'+
    '<div class="stat"><div class="n">'+cs.k+'<small>/'+cs.t+'</small></div><div class="t">背诵卡已掌握</div></div><div class="stat"><div class="n">'+rd+'<small>/'+sk.length+'</small></div><div class="t">知识点小节已读</div></div>'+
    '<div class="stat"><div class="n">'+wrongList().length+'</div><div class="t">错题本</div></div><div class="stat"><div class="n">'+subjM+'<small>/'+D.subj.length+'</small></div><div class="t">主观题自评掌握</div></div></div>'+
    '<div class="card"><h3>近 7 天做题量</h3><div class="week">'+days.map(function(x){return '<div><em>'+(x.n||'')+'</em><i style="height:'+Math.round(x.n/mx*80)+'%"></i><span>'+x.l+'</span></div>';}).join('')+'</div></div>'+
    '<div class="card"><h3>分章节正确率</h3>'+chRows+'</div>'+
    '<div class="card"><h3>分题型正确率</h3>'+tyRows+'</div>'+
    (S.exams.length?'<div class="card"><h3>模拟考成绩走势</h3><div class="week">'+S.exams.slice(-10).map(function(x,i){return '<div><em>'+x.score+'</em><i style="height:'+Math.round(x.score/30*80)+'%"></i><span>#'+(S.exams.length-Math.min(10,S.exams.length)+i+1)+'</span></div>';}).join('')+'</div></div>':'')+
    '<div class="card"><h3>数据管理</h3><p class="small">所有进度仅保存在本机浏览器（localStorage）。清除浏览器数据或换设备会丢失进度。</p><div class="row"><button class="btn ghost" id="exp">导出进度</button><button class="btn ghost" id="imp">导入进度</button></div><div class="row mt"><button class="btn red" id="reset">清空全部进度</button></div></div>');
  document.getElementById('reset').onclick=function(){if(confirm('确定清空所有做题记录、错题本、背诵卡进度和模考成绩吗？此操作不可恢复。')){localStorage.removeItem(KEY);localStorage.removeItem(KEY+'_exam');S=load();EX=null;QZ=null;toast('已清空');R.stats();}};
  document.getElementById('exp').onclick=function(){var txt=JSON.stringify(S);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){toast('进度已复制到剪贴板');},function(){prompt('复制以下内容保存：',txt);});}else prompt('复制以下内容保存：',txt);};
  document.getElementById('imp').onclick=function(){var t=prompt('粘贴之前导出的进度内容：');if(!t)return;try{var d=JSON.parse(t);if(typeof d!=='object'||!d.q)throw 0;localStorage.setItem(KEY,JSON.stringify(d));S=load();toast('导入成功');R.stats();}catch(e){toast('内容格式不正确');}};
};

route();
})();
