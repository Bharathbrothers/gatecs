'use strict';
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const H=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DAY=864e5,now=()=>Date.now(),day=t=>new Date(t).toISOString().slice(0,10);
const DEF={att:[],bm:{},sec:{},cards:{},custom:[],mocks:[],cfg:{}};
let S;try{S={...DEF,...JSON.parse(localStorage.getItem('gh')||'{}')}}catch{S={...DEF}}
let U=[],Q=[],QM={},LA={},P=null,M=null,timer=null,syncT=null,cardQ=null;
const save=()=>{localStorage.setItem('gh',JSON.stringify(S));clearTimeout(syncT);if(S.cfg.url)syncT=setTimeout(()=>sync(true),6000)};
const toast=m=>{const t=$('#toast');t.textContent=m;t.className='s';setTimeout(()=>t.className='',2200)};
document.documentElement.dataset.t=S.cfg.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
$('#th').onclick=()=>{const t=document.documentElement.dataset.t=='dark'?'light':'dark';document.documentElement.dataset.t=t;S.cfg.theme=t;save()};

/* ---------- data ---------- */
async function boot(){
 for(const v of[1,2,3]){const d=await fetch(`data/vol${v}.json`).then(r=>r.json());
  d.units.forEach(u=>{u.v=v;u.key=`${v}-${u.n}`;u.subj=u.name.split(':')[0];u.short=u.name.includes(':')?u.name.split(':')[1].trim():u.name;U.push(u);
   u.sections.forEach(s=>{s.u=u;s.key=`${u.key}~${s.id}`;s.qs.forEach(q=>{q.k=`${v}:${q.id}`;q.s=s;q.u=u;
    const a=q.ans;q.type=/^[A-D]$/.test(a)?'MCQ':/^[A-D](;[A-D])+$/.test(a)?'MSQ':/^-?[\d.]+(\s*:\s*-?[\d.]+)?$/.test(a)?'NAT':a=='N/A'?'DESC':'OTHER';
    if(!q.marks)q.marks=1;QM[q.k]=q;Q.push(q)})})})}
 buildLA();route()}
function buildLA(){LA={};S.att.forEach(a=>{LA[a.q]=a})}
const graded=q=>['MCQ','MSQ','NAT'].includes(q.type);
const pdf=(v,p)=>`pdfs/vol${v}.pdf#page=${p}`;
function grade(q,a){const k=q.ans;
 if(q.type=='NAT'){const m=k.split(':').map(x=>parseFloat(x)),v=parseFloat(a);if(isNaN(v))return false;
  return m.length>1&&!isNaN(m[1])?v>=Math.min(m[0],m[1])-1e-9&&v<=Math.max(m[0],m[1])+1e-9:Math.abs(v-m[0])<1e-6}
 if(q.type=='MSQ')return[...a].sort().join(';')==k.split(';').sort().join(';');
 return a==k}
function record(q,ok,mode,ms,a){S.att.push({q:q.k,ok:ok?1:0,ts:now(),m:mode,ms:ms||0,a:a||''});LA[q.k]=S.att[S.att.length-1];
 if(!ok){const id='q:'+q.k;if(!S.cards[id])S.cards[id]={due:now(),iv:0,ef:2.5,reps:0,u:now()}}save()}
const stats=qs=>{let a=0,c=0;qs.forEach(q=>{const l=LA[q.k];if(l){a++;if(l.ok)c++}});return{n:qs.length,a,c,acc:a?Math.round(100*c/a):0}};

/* ---------- router ---------- */
const NAV=[['home','🏠','Home'],['learn','📚','Learn'],['practice','✏️','Practice'],['mock','⏱️','Mock'],['cards','🃏','Cards'],['revise','🔁','Revise'],['more','⚙️','More']];
function route(){const h=(location.hash||'#/home').slice(2).split('/');const r=(h[0]||'home').split('#')[0],arg=decodeURIComponent(h.slice(1).join('/'));
 if(r!='cards')cardQ=null;if(r!='mockrun'&&timer){clearInterval(timer);timer=null}
 $('#nav').innerHTML=NAV.map(([k,i,l])=>`<a href="#/${k}" class="${r==k||(r=='unit'||r=='sec')&&k=='learn'?'on':''}"><b>${i}</b>${l}</a>`).join('');
 const f={home,learn,unit:()=>unit(arg),sec:()=>sec(arg),practice,session,mock,mockrun,mockres:()=>mockres(arg),cards,revise,more,search:()=>search(arg),notes}[r]||home;
 $('#main').innerHTML='';f();scrollTo(0,0)}
addEventListener('hashchange',()=>U.length&&route());
$('#srch').onkeydown=e=>{if(e.key=='Enter'&&e.target.value.trim())location.hash='#/search/'+encodeURIComponent(e.target.value.trim())};
const out=h=>{$('#main').innerHTML=h};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v;(ACT[a]||(()=>{}))(v,b,e)});

/* ---------- home ---------- */
function home(){
 const all=stats(Q),days={};S.att.forEach(a=>{days[day(a.ts)]=(days[day(a.ts)]||0)+1});
 let streak=0;for(let t=now();days[day(t)];t-=DAY)streak++;if(!streak)for(let t=now()-DAY;days[day(t)];t-=DAY)streak++;
 const wk=[...Array(7)].map((_,i)=>{const t=now()-(6-i)*DAY;return[new Date(t).toLocaleDateString('en',{weekday:'short'}).slice(0,2),days[day(t)]||0]}),mx=Math.max(1,...wk.map(x=>x[1]));
 const due=Object.values(S.cards).filter(c=>c.due<=now()).length,weak=Q.filter(q=>LA[q.k]&&!LA[q.k].ok).length;
 const subj=[...new Set(U.map(u=>u.subj))];
 out(`<h2>Welcome back 👋</h2><div class="grid">
 <div class="card"><div class="num">${all.a}<span class="mu sm"> / ${all.n}</span></div>questions attempted<div class="bar"><i style="width:${100*all.a/all.n}%"></i></div></div>
 <div class="card"><div class="num">${all.acc}%</div>accuracy · ${all.c} correct</div>
 <div class="card"><div class="num">🔥 ${streak}</div>day streak</div>
 <div class="card"><div class="num">${due}</div>cards due · ${weak} weak questions<div class="row" style="margin-top:6px"><button class="p" data-a="go" data-v="cards">Review</button><button data-a="go" data-v="revise">Revise</button></div></div></div>
 <div class="card"><b>Last 7 days</b><div class="chart" style="margin:8px 0 24px">${wk.map(([l,n])=>`<div style="height:${Math.max(3,100*n/mx)}%"><span>${l}</span></div>`).join('')}</div></div>
 <h3>Progress by subject</h3><div class="grid">${subj.map(s=>{const us=U.filter(u=>u.subj==s),st=stats(us.flatMap(u=>u.sections.flatMap(x=>x.qs)));
 return`<div class="card" style="cursor:pointer" data-a="go" data-v="learn#${H(s)}"><b>${H(s)}</b><div class="bar"><i style="width:${100*st.a/st.n}%"></i></div><span class="mu sm">${st.a}/${st.n} attempted · ${st.acc}% accuracy</span></div>`}).join('')}</div>
 ${S.cfg.url?'':`<div class="card"><b>☁️ Sync with Google Sheets</b><p class="mu sm">Your progress is saved in this browser. Connect a Google Sheet in <a href="#/more">More → Settings</a> to back it up and track it in sheets.</p></div>`}`)}

/* ---------- learn ---------- */
function learn(){const sel=decodeURIComponent((location.hash.split('#')[2])||'');
 const subj=[...new Set(U.map(u=>u.subj))];
 out(`<h2>Learn by subject</h2>`+subj.map(s=>`<h3 id="${H(s)}">${H(s)}</h3><div class="grid">`+U.filter(u=>u.subj==s).map(u=>{const st=stats(u.sections.flatMap(x=>x.qs));
 return`<div class="card" style="cursor:pointer" data-a="go" data-v="unit/${u.key}"><b>${H(u.short)}</b><div class="mu sm">${u.sections.length} topics · ${st.n} PYQs</div><div class="bar"><i style="width:${100*st.a/st.n||0}%"></i></div><span class="mu sm">${st.a} attempted · ${st.acc}% acc</span></div>`}).join('')+`</div>`).join(''));
 if(sel)$('[id="'+sel+'"]')?.scrollIntoView()}
function unit(key){const u=U.find(x=>x.key==key);if(!u)return learn();
 const cs=u.concepts.map((c,i)=>`<details ${i?'':'open'}><summary>${H(c.name)} <a class="sm" target="_blank" href="${pdf(u.v,c.pg)}">📄 p.${c.pg}</a></summary>
  ${[['def','Overview'],['formulas','Formulas & results'],['props','Key properties'],['pitfalls','⚠️ Pitfalls'],['tech','⚡ Techniques']].filter(([k])=>c[k]).map(([k,l])=>`<div class="sm mu" style="margin-top:8px"><b>${l}</b></div><pre class="c">${H(c[k]).replace(/▢/g,'⬚')}</pre>`).join('')}
  <button class="sm" data-a="addc" data-v="${u.key}|${i}">🃏 Add to flashcards</button></details>`).join('');
 out(`<a href="#/learn">← All subjects</a><h2>${H(u.name)}</h2><div class="mu sm">${H(u.syllabus||'')}</div>
 <div class="card"><b>📘 Key concepts</b><p class="mu sm">Formulas drawn as images in the PDF can look blank here (⬚). Use the 📄 link to see the original page.</p>${cs||'<p class="mu">No concept notes extracted for this unit — use the PDF.</p>'}
 ${u.quick?`<details><summary>⚡ Quick formula reference & tips <a class="sm" target="_blank" href="${pdf(u.v,u.quickpg||u.page)}">📄</a></summary><pre class="c">${H(u.quick).replace(/▢/g,'⬚')}</pre></details>`:''}</div>
 <h3>Topics & PYQs</h3><div class="card">${u.sections.map(s=>{const st=stats(s.qs),sd=S.sec[s.key];return`<div class="ql" data-a="go" data-v="sec/${s.key}"><span class="dot ${st.a==st.n&&st.n?'ok':''}"></span><b class="sp">${H(s.name)}</b><span class="mu sm">${st.a}/${st.n}</span>${sd?'<span class="pill ok">studied</span>':''}</div>`}).join('')}</div>`)}
function sec(key){const s=U.flatMap(u=>u.sections).find(x=>x.key==key);if(!s)return learn();const u=s.u,c=u.concepts.find(c=>c.name==s.name);
 const F=P&&P.filterKey==key?P.f:{};
 out(`<a href="#/unit/${u.key}">← ${H(u.short)}</a><h2>${H(s.name)}</h2>
 <div class="row"><button class="p" data-a="pracsec" data-v="${key}">▶ Practice all (${s.qs.length})</button><button data-a="pracsec" data-v="${key}|wrong">Retry wrong</button><button data-a="studied" data-v="${key}">${S.sec[key]?'✓ Studied · reset':'Mark topic studied'}</button>${c?`<a class="sm" target="_blank" href="${pdf(u.v,c.pg)}">📄 concept page</a>`:''}</div>
 ${c?`<details class="card"><summary>Concept summary</summary>${[['def','Overview'],['formulas','Formulas'],['pitfalls','Pitfalls'],['tech','Techniques']].filter(([k])=>c[k]).map(([k,l])=>`<b class="sm mu">${l}</b><pre class="c">${H(c[k]).replace(/▢/g,'⬚')}</pre>`).join('')}</details>`:''}
 <div class="card">${s.qs.map((q,i)=>{const l=LA[q.k];return`<div class="ql" data-a="pracsec" data-v="${key}||${i}"><span class="dot ${l?(l.ok?'ok':'bad'):''}"></span><span class="sp">${H(q.exam)} <span class="mu sm">${H(q.qn)}</span></span><span class="pill">${q.type}</span><span class="pill">${q.marks}M</span>${S.bm[q.k]?'🔖':''}</div>`}).join('')}</div>`)}

/* ---------- practice ---------- */
function practice(){
 const subj=[...new Set(U.map(u=>u.subj))];
 out(`<h2>Practice</h2><div class="card"><div class="row"><select id="pu"><option value="">All subjects</option>${subj.map(s=>`<optgroup label="${H(s)}">${U.filter(u=>u.subj==s).map(u=>`<option value="${u.key}">${H(u.short)}</option>`).join('')}</optgroup>`).join('')}</select>
 <select id="pt"><option value="">Any type</option><option>MCQ</option><option>MSQ</option><option>NAT</option></select>
 <select id="ps"><option value="">All questions</option><option value="new">Unattempted</option><option value="wrong">Wrong last time</option><option value="bm">Bookmarked</option></select>
 <select id="pm"><option value="">1 & 2 marks</option><option value="1">1 mark</option><option value="2">2 marks</option></select></div>
 <div class="row" style="margin-top:8px"><label>From year <input id="py" type="number" value="1987" style="width:90px"></label><label>Count <input id="pn" type="number" value="20" style="width:80px"></label><label><input type="checkbox" id="psh" checked> shuffle</label></div>
 <p><button class="p" data-a="startp">Start practice</button></p></div>`)}
const ACT={
 go:v=>{location.hash='#/'+v},
 startp:()=>{let l=Q.filter(graded);const u=$('#pu').value,t=$('#pt').value,s=$('#ps').value,m=$('#pm').value,y=+$('#py').value;
  if(u)l=l.filter(q=>q.u.key==u);if(t)l=l.filter(q=>q.type==t);if(m)l=l.filter(q=>q.marks==+m);l=l.filter(q=>q.year>=y);
  if(s=='new')l=l.filter(q=>!LA[q.k]);if(s=='wrong')l=l.filter(q=>LA[q.k]&&!LA[q.k].ok);if(s=='bm')l=l.filter(q=>S.bm[q.k]);
  if($('#psh').checked)l.sort(()=>Math.random()-.5);else l.sort((a,b)=>a.year-b.year);
  if(!l.length)return toast('No questions match');startSession(l.slice(0,+$('#pn').value||20))},
 pracsec:v=>{const[key,f,i]=v.split('|');const s=U.flatMap(u=>u.sections).find(x=>x.key==key);let l=s.qs;
  if(f=='wrong')l=l.filter(q=>LA[q.k]&&!LA[q.k].ok);if(!l.length)return toast('Nothing to practise here');startSession(l,i?+i:0)},
 studied:key=>{if(S.sec[key])delete S.sec[key];else S.sec[key]={ts:now(),n:0,next:now()+DAY};save();sec(key)},
 ans:(v,b)=>answer(v),
 tog:(v,b)=>{b.classList.toggle('on')},
 sub:()=>{const q=P.l[P.i];if(q.type=='NAT')answer($('#nat').value);else answer($$('.opt.on').map(b=>b.dataset.v).join(''))},
 rev:()=>{P.shown=1;renderQ()},self:v=>{const q=P.l[P.i];P.done[P.i]=v=='1'?1:0;record(q,v=='1','prac',0);renderQ()},
 nx:v=>{P.i=Math.max(0,Math.min(P.l.length-1,P.i+ +v));renderQ()},
 bm:v=>{if(S.bm[v])delete S.bm[v];else S.bm[v]={u:now()};save();(M?mockq:renderQ)()},
 orig:(v,b)=>{const q=QM[v],box=b.nextElementSibling;box.innerHTML=box.innerHTML?'':`<iframe src="${pdf(q.u.v,q.pg)}"></iframe>`},
 addc:v=>{const[k,i]=v.split('|'),u=U.find(x=>x.key==k),c=u.concepts[+i];
  [['formulas','Formulas'],['props','Properties'],['pitfalls','Pitfalls'],['tech','Techniques'],['def','Overview']].forEach(([f,l])=>{if(c[f]&&c[f].length>20){const id=`c:${k}|${i}|${f}`;if(!S.cards[id])S.cards[id]={due:now(),iv:0,ef:2.5,reps:0,u:now()}}});save();toast('Added to flashcards')}
};
function startSession(l,i=0){P={l,i,done:{},t0:now(),f:{}};location.hash='#/session'}
function session(){if(!P)return practice();renderQ()}
function renderQ(){if(!P)return;const q=P.l[P.i],l=P.done[P.i];
 const ans=l!==undefined;const opts=['A','B','C','D'];
 let ctl='';
 if(!ans){ctl=q.type=='MCQ'?`<div class="row">${opts.map(o=>`<button class="opt" data-a="ans" data-v="${o}">${o}</button>`).join('')}</div>`:
  q.type=='MSQ'?`<div class="row">${opts.map(o=>`<button class="opt" data-a="tog" data-v="${o}">${o}</button>`).join('')}<button class="p" data-a="sub">Submit</button></div>`:
  q.type=='NAT'?`<div class="row"><input id="nat" inputmode="decimal" placeholder="Your answer" style="width:160px"><button class="p" data-a="sub">Submit</button></div>`:
  P.shown?`<div class="row"><b>Did you get it right?</b><button class="g" data-a="self" data-v="1">Yes</button><button class="r" data-a="self" data-v="0">No</button></div>`:`<button class="p" data-a="rev">Show answer</button>`}
 const fb=ans||P.shown?`<div class="card ${ans?(l?'ans-ok':'ans-bad'):''}">${ans?(l?'✅ Correct':'❌ Incorrect'):''} ${q.ans!='N/A'?`<b>Answer: ${H(q.ans)}</b>`:''} ${q.sol?`<a target="_blank" href="${q.sol}">View solution on GATE Overflow ↗</a>`:''}<br><span class="mu sm">${P.mya&&P.mya[P.i]?'Your answer: '+H(P.mya[P.i]):''}</span></div>`:'';
 out(`<div class="row"><a href="#/practice">← Setup</a><span class="sp"></span><span class="mu sm">${P.i+1} / ${P.l.length}</span></div><div class="bar"><i style="width:${100*(P.i+1)/P.l.length}%"></i></div>
 <div class="card"><div class="row"><span class="pill">${H(q.u.short)} › ${H(q.s.name)}</span><span class="pill">${H(q.exam)} ${H(q.qn)}</span><span class="pill">${q.type}</span><span class="pill">${q.marks}M</span><span class="sp"></span><button data-a="bm" data-v="${q.k}">${S.bm[q.k]?'🔖':'🏷️'}</button></div>
 <div class="q">${H(q.text||'(see original)').replace(/▢/g,'⬚')}</div>${q.text.includes('▢')?'<p class="mu sm">⬚ = formula/figure missing from the text — open the original below.</p>':''}
 <button class="sm" data-a="orig" data-v="${q.k}">📄 View original question</button><div></div></div>
 ${ctl}${fb}<div class="row" style="margin-top:12px"><button data-a="nx" data-v="-1" ${P.i?'':'disabled'}>← Prev</button><button class="p" data-a="nx" data-v="1" ${P.i<P.l.length-1?'':'disabled'}>Next →</button></div>`);
}
function answer(a){const q=P.l[P.i];if(P.done[P.i]!==undefined)return;if(!a)return toast('Pick an answer');
 (P.mya=P.mya||{})[P.i]=a;const ok=grade(q,a);P.done[P.i]=ok?1:0;record(q,ok,'prac',now()-(P.tq||P.t0),a);P.tq=now();renderQ()}

/* ---------- mock ---------- */
function mock(){const subj=[...new Set(U.map(u=>u.subj))];
 const past=S.mocks.slice(-5).reverse();
 out(`<h2>Mock tests</h2><div class="card"><p class="mu sm">GATE pattern: MCQ negative marking (⅓ for 1-mark, ⅔ for 2-mark), no negative for MSQ & NAT. Questions are drawn from the PYQ bank.</p>
 <div class="row"><select id="mu"><option value="">Full mix (all subjects)</option>${subj.map(s=>`<option value="s:${H(s)}">${H(s)}</option>`).join('')}${U.map(u=>`<option value="u:${u.key}">${H(u.short)}</option>`).join('')}</select>
 <label>Questions <input id="mn" type="number" value="30" style="width:80px"></label><label>Minutes <input id="mt" type="number" value="60" style="width:80px"></label></div>
 <p><label><input type="checkbox" id="mnew" checked> prefer unattempted</label></p><button class="p" data-a="startm">Start mock</button></div>
 ${past.length?`<h3>Recent mocks</h3>`+past.map(m=>`<div class="card ql" data-a="go" data-v="mockres/${m.id}"><b class="sp">${H(m.name)}</b><span class="pill">${m.score}/${m.max}</span><span class="mu sm">${day(m.ts)}</span></div>`).join(''):''}`)}
ACT.startm=()=>{const v=$('#mu').value;let l=Q.filter(q=>graded(q)&&q.year>=2000);if(v.startsWith('s:'))l=l.filter(q=>q.u.subj==v.slice(2));if(v.startsWith('u:'))l=l.filter(q=>q.u.key==v.slice(2));
 l.sort(()=>Math.random()-.5);if($('#mnew').checked)l.sort((a,b)=>!!LA[a.k]-!!LA[b.k]);const n=+$('#mn').value||30;l=l.slice(0,n);if(!l.length)return toast('No questions');
 M={l,ans:{},mk:{},i:0,end:now()+(+$('#mt').value||60)*60000,name:`Mock · ${v?(v.startsWith('s:')?v.slice(2):U.find(u=>u.key==v.slice(2)).short):'Full mix'}`,t0:now()};location.hash='#/mockrun'};
function mockrun(){if(!M)return mock();mockq();if(!timer)timer=setInterval(tick,1000)}
function tick(){const r=Math.max(0,M.end-now()),t=$('#tmr');if(t)t.textContent=`${String(Math.floor(r/60000)).padStart(2,'0')}:${String(Math.floor(r/1000)%60).padStart(2,'0')}`;if(!r){ACT.submitm()}}
function mockq(){const q=M.l[M.i],a=M.ans[M.i]||'',o=['A','B','C','D'];
 out(`<div class="row"><b>${H(M.name)}</b><span class="sp"></span><span class="pill" style="font-size:15px">⏱ <span id="tmr"></span></span><button class="r" data-a="submitm">Submit</button></div>
 <div class="card"><div class="row"><span class="pill">Q${M.i+1}/${M.l.length}</span><span class="pill">${q.type}</span><span class="pill">${q.marks}M</span><span class="pill">${H(q.exam)}</span></div><div class="q">${H(q.text||'(see original)').replace(/▢/g,'⬚')}</div>
 <button class="sm" data-a="orig" data-v="${q.k}">📄 View original question</button><div></div>
 <div class="row" style="margin-top:10px">${q.type=='NAT'?`<input id="nat" inputmode="decimal" value="${H(a)}" placeholder="Answer" oninput="M.ans[M.i]=this.value">`:o.map(x=>`<button class="opt ${a.includes(x)?'on':''}" data-a="mset" data-v="${x}">${x}</button>`).join('')}<button data-a="mclr">Clear</button></div></div>
 <div class="row"><button data-a="mnx" data-v="-1">← Prev</button><button data-a="mmk">${M.mk[M.i]?'★ Marked':'☆ Mark for review'}</button><button class="p" data-a="mnx" data-v="1">Next →</button></div>
 <div class="card pal" style="margin-top:12px">${M.l.map((_,i)=>`<button class="${M.ans[i]?'a':''} ${M.mk[i]?'m':''} ${i==M.i?'cur':''}" data-a="mjump" data-v="${i}">${i+1}</button>`).join('')}</div>`);tick()}
Object.assign(ACT,{
 mset:v=>{const q=M.l[M.i];let a=M.ans[M.i]||'';if(q.type=='MSQ')a=a.includes(v)?a.replace(v,''):[...a+v].sort().join('');else a=a==v?'':v;M.ans[M.i]=a;mockq()},
 mclr:()=>{delete M.ans[M.i];mockq()},mmk:()=>{M.mk[M.i]=!M.mk[M.i];mockq()},
 mnx:v=>{M.i=Math.max(0,Math.min(M.l.length-1,M.i+ +v));mockq()},mjump:v=>{M.i=+v;mockq()},
 submitm:()=>{if(!M)return;let sc=0,mx=0,c=0,w=0,sk=0;const items=M.l.map((q,i)=>{mx+=q.marks;const a=M.ans[i];let r=0,st='skip';
  if(a){const ok=grade(q,a);st=ok?'ok':'bad';if(ok){r=q.marks;c++}else{w++;if(q.type=='MCQ')r=-q.marks/3}record(q,ok,'mock',0,a)}else sk++;sc+=r;return{q:q.k,a:a||'',st,r}});
  const m={id:'m'+now(),ts:now(),name:M.name,score:+sc.toFixed(2),max:mx,c,w,sk,dur:Math.round((now()-M.t0)/1000),items};S.mocks.push(m);save();clearInterval(timer);timer=null;M=null;location.hash='#/mockres/'+m.id}});
function mockres(id){const m=S.mocks.find(x=>x.id==id);if(!m)return mock();const by={};
 m.items.forEach(it=>{const q=QM[it.q];const k=q.u.short;by[k]=by[k]||{c:0,n:0};by[k].n++;if(it.st=='ok')by[k].c++});
 out(`<a href="#/mock">← Mocks</a><h2>${H(m.name)}</h2><div class="grid"><div class="card"><div class="num">${m.score}/${m.max}</div>score</div><div class="card"><div class="num">${m.c}</div>correct · ${m.w} wrong · ${m.sk} skipped</div><div class="card"><div class="num">${Math.floor(m.dur/60)}m</div>time taken</div></div>
 <div class="card"><b>By topic</b>${Object.entries(by).map(([k,v])=>`<div class="row sm"><span class="sp">${H(k)}</span>${v.c}/${v.n}</div><div class="bar ok"><i style="width:${100*v.c/v.n}%"></i></div>`).join('')}</div>
 <h3>Review</h3><div class="card">${m.items.map((it,i)=>{const q=QM[it.q];return`<div class="ql"><span class="dot ${it.st=='ok'?'ok':it.st=='bad'?'bad':''}"></span><span class="sp sm">Q${i+1}. ${H(q.s.name)} · ${H(q.exam)}<br><span class="mu">You: ${H(it.a||'—')} · Key: ${H(q.ans)}</span></span><a target="_blank" href="${q.sol}">sol ↗</a></div>`}).join('')}</div>`)}

/* ---------- flashcards ---------- */
function cardData(id){
 if(id.startsWith('q:')){const q=QM[id.slice(2)];return{f:`${q.u.short} › ${q.s.name}\n${q.exam} ${q.qn}\n\n${q.text.slice(0,700)}`,b:`Answer: ${q.ans}`,link:q.sol,q}}
 if(id.startsWith('c:')){const[k,i,f]=id.slice(2).split('|'),u=U.find(x=>x.key==k),c=u.concepts[+i];const L={formulas:'Formulas',props:'Properties',pitfalls:'Pitfalls',tech:'Techniques',def:'Overview'};
  return{f:`${u.short}\n${c.name}\n\n${L[f]}?`,b:c[f]}}
 const c=S.custom.find(x=>'x:'+x.id==id);return c?{f:c.f,b:c.b}:null}
function cards(){const dueIds=Object.keys(S.cards).filter(id=>S.cards[id].due<=now()&&cardData(id));
 if(!cardQ)cardQ={ids:dueIds.sort(()=>Math.random()-.5),i:0,flip:0};
 const id=cardQ.ids[cardQ.i];
 out(`<h2>Flashcards</h2><div class="row"><span class="pill">${dueIds.length} due</span><span class="pill">${Object.keys(S.cards).length} in deck</span><span class="sp"></span><button data-a="newcard">＋ New card</button></div>
 ${id?`<div class="card flip" data-a="flip">${H(cardQ.flip?cardData(id).b:cardData(id).f)}</div>
  ${cardQ.flip?`<div class="row" style="justify-content:center"><button class="r" data-a="rate" data-v="0">Again</button><button data-a="rate" data-v="1">Hard</button><button class="g" data-a="rate" data-v="2">Good</button><button class="p" data-a="rate" data-v="3">Easy</button></div>${cardData(id).link?`<p style="text-align:center"><a target="_blank" href="${cardData(id).link}">Solution ↗</a></p>`:''}`:'<p class="mu" style="text-align:center">Tap card to flip</p>'}`:
  `<div class="card"><b>🎉 All caught up!</b><p class="mu sm">Cards are created from: wrong answers (automatic), “Add to flashcards” on any concept topic, or your own custom cards.</p></div>`}`)}
Object.assign(ACT,{flip:()=>{cardQ.flip=1;cards()},
 rate:v=>{const id=cardQ.ids[cardQ.i],c=S.cards[id],r=+v;c.ef=Math.max(1.3,c.ef+[-.3,-.15,0,.15][r]);
  c.iv=r==0?0:c.reps==0?1:c.reps==1?3:Math.round(c.iv*c.ef*(r==1?.7:r==3?1.3:1));c.reps=r==0?0:c.reps+1;c.due=now()+(r==0?10*60000:Math.max(1,c.iv)*DAY);c.u=now();save();
  cardQ.i++;cardQ.flip=0;if(cardQ.i>=cardQ.ids.length)cardQ=null;cards()},
 newcard:()=>{const f=prompt('Front (question):');if(!f)return;const b=prompt('Back (answer):');if(!b)return;const id='x'+now();S.custom.push({id,f,b});S.cards['x:'+id]={due:now(),iv:0,ef:2.5,reps:0,u:now()};save();cardQ=null;cards()}});

/* ---------- revision ---------- */
function revise(){
 const weak=Q.filter(q=>LA[q.k]&&!LA[q.k].ok),bm=Q.filter(q=>S.bm[q.k]);
 const secs=U.flatMap(u=>u.sections).filter(s=>S.sec[s.key]),dueS=secs.filter(s=>S.sec[s.key].next<=now());
 const wk={};weak.forEach(q=>{wk[q.s.key]=(wk[q.s.key]||0)+1});const top=Object.entries(wk).sort((a,b)=>b[1]-a[1]).slice(0,8);
 out(`<h2>Revision</h2><div class="grid"><div class="card"><div class="num">${weak.length}</div>wrong questions<p><button class="p" data-a="revq" data-v="weak">Redo wrong</button></p></div>
 <div class="card"><div class="num">${bm.length}</div>bookmarked<p><button data-a="revq" data-v="bm">Practice bookmarks</button></p></div>
 <div class="card"><div class="num">${Object.values(S.cards).filter(c=>c.due<=now()).length}</div>cards due<p><button data-a="go" data-v="cards">Open cards</button></p></div></div>
 <h3>Topics due for spaced revision</h3><div class="card">${dueS.length?dueS.map(s=>`<div class="ql"><b class="sp" data-a="go" data-v="sec/${s.key}">${H(s.u.short)} › ${H(s.name)}</b><button class="g sm" data-a="revdone" data-v="${s.key}">Revised ✓</button></div>`).join(''):'<p class="mu sm">Nothing due. Mark topics as “studied” inside a topic page; they come back after 1, 3, 7, 14 and 30 days.</p>'}</div>
 <h3>Weakest topics</h3><div class="card">${top.length?top.map(([k,n])=>{const s=U.flatMap(u=>u.sections).find(x=>x.key==k);return`<div class="ql" data-a="go" data-v="sec/${k}"><span class="sp">${H(s.u.short)} › ${H(s.name)}</span><span class="pill bad">${n} wrong</span></div>`}).join(''):'<p class="mu sm">Attempt some questions to see your weak spots.</p>'}</div>`)}
Object.assign(ACT,{revq:v=>{const l=Q.filter(q=>graded(q)&&(v=='weak'?LA[q.k]&&!LA[q.k].ok:S.bm[q.k]));l.length?startSession(l.sort(()=>Math.random()-.5).slice(0,30)):toast('Nothing here')},
 revdone:k=>{const s=S.sec[k],iv=[1,3,7,14,30,60];s.n=Math.min(s.n+1,5);s.next=now()+iv[s.n]*DAY;save();revise()}});

/* ---------- search / notes / more ---------- */
function search(t){const w=t.toLowerCase().split(/\s+/);
 const m=Q.filter(q=>{const s=(q.text+' '+q.title+' '+q.tags.join(' ')+' '+q.exam+' '+q.s.name).toLowerCase();return w.every(x=>s.includes(x))});
 out(`<h2>Search: ${H(t)}</h2><p class="mu sm">${m.length} questions</p><div class="card">${m.slice(0,80).map(q=>`<div class="ql" data-a="pracsec" data-v="${q.s.key}||${q.s.qs.indexOf(q)}"><span class="dot ${LA[q.k]?(LA[q.k].ok?'ok':'bad'):''}"></span><span class="sp sm"><b>${H(q.u.short)} › ${H(q.s.name)}</b> · ${H(q.exam)}<br><span class="mu">${H(q.text.slice(0,120))}</span></span></div>`).join('')}</div>`)}
async function notes(){const d=await fetch('data/topics.json').then(r=>r.json());
 out(`<a href="#/more">← More</a><h2>Study notes (your original PDF)</h2>`+d.subjects.map(s=>`<details class="card"><summary>${H(s.name)}</summary>${s.chapters.map(c=>`<div class="sm"><b>${H(c.title)}</b> <a target="_blank" href="pdfs/notes.pdf#page=${c.page}">p.${c.page}</a></div>`).join('')}</details>`).join(''))}
function more(){const sy=S.cfg.url;
 out(`<h2>More</h2><div class="card"><b>☁️ Google Sheets sync</b><p class="mu sm">Back up progress and get readable tabs (Progress, Attempts, Mocks, Flashcards, Revision). Setup: see <code>sheets/Code.gs</code> and README.</p>
 <div class="row"><input id="url" style="flex:1;min-width:200px" placeholder="Apps Script Web App URL (…/exec)" value="${H(sy||'')}"><button class="p" data-a="saveurl">Save</button><button data-a="syncnow">Sync now</button></div></div>
 <div class="card row"><a href="#/notes"><button>📖 Study notes</button></a><button data-a="exp">Export backup</button><label class="pill" style="cursor:pointer">Import backup<input type="file" id="imp" hidden></label><button class="r" data-a="reset">Reset all</button></div>`);
 $('#imp').onchange=async e=>{S={...DEF,...JSON.parse(await e.target.files[0].text())};save();buildLA();toast('Imported');more()}}
Object.assign(ACT,{saveurl:()=>{S.cfg.url=$('#url').value.trim();save();toast('Saved');sync()},syncnow:()=>sync(),
 exp:()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S)]));a.download='gate-hub-backup.json';a.click()},
 reset:()=>{if(confirm('Erase all progress in this browser?')){S={...DEF};save();buildLA();route()}}});

/* ---------- Google Sheets sync ---------- */
const newer=(a,b)=>(a?.u||0)>=(b?.u||0)?a:b;
function merge(r){if(!r)return;const k=new Set(S.att.map(a=>a.q+a.ts));r.att?.forEach(a=>{if(!k.has(a.q+a.ts))S.att.push(a)});S.att.sort((a,b)=>a.ts-b.ts);
 for(const f of['bm','cards','sec']){const o=S[f];for(const id in r[f]||{})o[id]=o[id]?newer(o[id],r[f][id]):r[f][id]}
 const ids=new Set(S.custom.map(c=>c.id));r.custom?.forEach(c=>{if(!ids.has(c.id))S.custom.push(c)});
 const mi=new Set(S.mocks.map(m=>m.id));r.mocks?.forEach(m=>{if(!mi.has(m.id))S.mocks.push(m)});buildLA()}
function report(){const R={},sec=U.flatMap(u=>u.sections);
 R.Progress=[['Subject','Unit','Topic','Total','Attempted','Correct','Accuracy %','Studied']].concat(sec.map(s=>{const t=stats(s.qs);return[s.u.subj,s.u.short,s.name,t.n,t.a,t.c,t.acc,S.sec[s.key]?'yes':'']}));
 R.Attempts=[['Date','Question','Unit','Topic','Exam','Result','Mode','Your answer']].concat(S.att.slice(-3000).map(a=>{const q=QM[a.q];return q?[new Date(a.ts).toISOString(),q.id,q.u.short,q.s.name,q.exam,a.ok?'correct':'wrong',a.m,a.a]:null}).filter(Boolean));
 R.Mocks=[['Date','Name','Score','Max','Correct','Wrong','Skipped','Minutes']].concat(S.mocks.map(m=>[day(m.ts),m.name,m.score,m.max,m.c,m.w,m.sk,Math.round(m.dur/60)]));
 R.Flashcards=[['Card','Due','Interval (d)','Reps']].concat(Object.entries(S.cards).map(([id,c])=>[id,day(c.due),c.iv,c.reps]));
 R.Revision=[['Question','Topic','Unit','Reason']].concat(Q.filter(q=>(LA[q.k]&&!LA[q.k].ok)||S.bm[q.k]).map(q=>[q.id,q.s.name,q.u.short,S.bm[q.k]?'bookmarked':'wrong']));return R}
async function sync(quiet){const url=S.cfg.url;if(!url)return;const el=$('#sy');el.textContent='syncing…';
 try{const r=await fetch(url).then(x=>x.json());merge(r.state);localStorage.setItem('gh',JSON.stringify(S));
  await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'push',state:S,report:report()})});
  el.textContent='☁️ synced '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});if(!quiet)toast('Synced with Google Sheets')}
 catch(e){el.textContent='⚠️ sync failed';if(!quiet)toast('Sync failed — check URL & deployment access')}}
boot().then(()=>S.cfg.url&&sync(true));
