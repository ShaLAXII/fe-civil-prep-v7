(()=>{'use strict';
const Q=window.ALL_FE_QUESTIONS||[],byId=new Map(Q.map(q=>[String(q.id),q]));
const TOPIC_MATCHES=window.FE_EXAM_TOPIC_MATCHES||{};
Q.forEach(q=>{const m=TOPIC_MATCHES[q.id];q.studySubject=m?.subject||(q.subject==='Companion Practice Exams'?'Mixed practice — topic unclassified':q.subject);q.studySubtopic=m?.subtopic||(q.subject==='Companion Practice Exams'?'Companion exam (unclassified)':q.subtopic);});
const canScore=q=>!!q && !!q.eligible && /^[ABCD]$/.test(q.answer||'') && ((Array.isArray(q.options)&&q.options.length===4)||!!VISUAL_MANIFEST?.[q.id]);
const acceptedLetters=q=>q?.acceptedAnswers?.length?q.acceptedAnswers:[q?.answer];
const matchesKey=(q,letter)=>!!letter&&canScore(q)&&acceptedLetters(q).includes(letter);
const DRAWINGS=window.FE_SOURCE_DIAGRAMS||{}, FIGURE_IDS=new Set(window.FE_VISUAL_FIGURE_IDS||[]), CONTEXT_IDS=new Set(window.FE_VISUAL_CONTEXT_IDS||[]), DRAWING_COUNT=Q.filter(q=>DRAWINGS[q.id]||q.diagram||FIGURE_IDS.has(q.id)||CONTEXT_IDS.has(q.id)).length;
const SUBJECTS=[...new Set(Q.map(q=>q.studySubject))].sort(),SOURCES=['All books','Learnova','Learnova Exam 1','Learnova Exam 2','Learnova Exam 3','Learnova Exam 4'];
const KEY='fe_source_complete_visual_2026_v1';
const VISUAL_MANIFEST=window.FE_VISUAL_MANIFEST||{};
const VISUAL_PENDING=new Map();
const VISUAL_SHARDS=new Map();
function visualAsset(id){
 const k=String(id),part=VISUAL_MANIFEST[k];
 if(!part)return Promise.reject(new Error('Missing visual index'));
 if(window.FE_VISUAL_EXCERPTS?.[k])return Promise.resolve(window.FE_VISUAL_EXCERPTS[k]);
 if(!VISUAL_SHARDS.has(part)){
  const name='visual_'+String(part).padStart(2,'0')+'.js';
  VISUAL_SHARDS.set(part,new Promise((resolve,reject)=>{
   const scr=document.createElement('script');scr.src='./'+name;
   scr.onload=()=>resolve();scr.onerror=()=>{VISUAL_SHARDS.delete(part);reject(new Error('Could not load '+name))};
   document.head.appendChild(scr)
  }));
 }
 return VISUAL_SHARDS.get(part).then(()=>{const a=window.FE_VISUAL_EXCERPTS?.[k];if(!a)throw new Error('Question visual unavailable');return a});
}
const $=sel=>document.querySelector(sel),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}}let save=load();
let state={view:'home',qid:'1',source:'All books',subject:'All subjects',level:'All questions',search:'',limit:50,answers:save.answers||{},checked:save.checked||{},revealed:save.revealed||{},bookmarks:save.bookmarks||{},flags:save.flags||{},history:save.history||{},reports:save.reports||[],session:save.session||null,menu:false,reference:{},libraryTopic:'All subtopics',builderMode:'practice',studySubjects:save.preferences?.subjects||[],studyTopic:save.preferences?.topic||'All subtopics',studySource:save.preferences?.source||'All books',studyLength:save.preferences?.length||20,studyMinutes:save.preferences?.minutes??0,studySelection:save.preferences?.selection||'all',studyStrategy:save.preferences?.strategy||'balanced'};
state.pageOffsets={};state.zoomed={};state.book='learnova';state.bookPage=9;
// Reconcile saved history when switching from the two-book website.
for(const key of ['answers','checked','revealed','bookmarks','flags','history']){
  state[key]=Object.fromEntries(Object.entries(state[key]||{}).filter(([id])=>byId.has(String(id))));
}
state.reports=(state.reports||[]).filter(r=>byId.has(String(r.id)));
// Existing browser progress retains selected responses. Recalculate previously ungraded attempts with the newly available publisher keys.
for(const [id,entry] of Object.entries(state.history)){if(entry&&entry.correct==null&&entry.chosen&&byId.has(id)&&canScore(byId.get(id)))entry.correct=matchesKey(byId.get(id),entry.chosen);}
if(state.session?.ids?.some(id=>!byId.has(String(id))))state.session=null;
if(!SOURCES.includes(state.studySource))state.studySource='All books';
state.studySubjects=(state.studySubjects||[]).filter(s=>SUBJECTS.includes(s)||s==='__none__');

try{const params=new URLSearchParams(location.search);const q=params.get('question');if(q&&byId.has(q)){state.qid=q;state.view='single'}}catch{}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({answers:state.answers,checked:state.checked,revealed:state.revealed,bookmarks:state.bookmarks,flags:state.flags,history:state.history,reports:state.reports,session:state.session,preferences:{subjects:state.studySubjects,topic:state.studyTopic,source:state.studySource,length:state.studyLength,minutes:state.studyMinutes,selection:state.studySelection,strategy:state.studyStrategy}}))}catch{}}
function btn(t,action,cl='button',extra=''){return `<button class="${cl}" data-action="${action}" ${extra}>${t}</button>`}
function heading(k,t,desc,right=''){return `<div class="hero"><div><div class="eyebrow">${esc(k)}</div><h1>${esc(t)}</h1><p>${esc(desc)}</p></div>${right}</div>`}
function toast(msg){let el=$('#toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3200)}

// The visual excerpts and figures are standalone web assets, not PDF viewers.
function assetFrame(q,role){
 const kind=role==='solution'?'s':'q', alt=role==='solution'?'Original typeset worked solution':'Original typeset question with diagrams, tables and choices';
 return `<div class="excerpt-frame"><div class="scan-loading">Loading ${esc(alt.toLowerCase())}…</div><img class="excerpt-image" alt="${esc(alt)} for question ${esc(q.id)}" data-excerpt-id="${esc(q.id)}" data-excerpt-kind="${kind}" loading="eager"/></div>`;
}
function sourceScan(q,role,force=false){
 const scope=role+':'+q.id;
 const defaultOpen=force||(role==='solution'&&q.status!=='manually-checked');
 const open=state.reference[scope]??defaultOpen;
 const label=role==='solution'?'Publisher worked solution':'Original question typesetting';
 return `<section class="source-reference inline-source"><div class="reference-top"><div><strong>${label}</strong><p class="hint">${role==='solution'?'View the original mathematical steps without opening a textbook.':'Exact printed equations, tables, diagrams and answer choices, extracted into this question.'}</p></div>${btn(open?'Hide excerpt':'Show excerpt','toggleReference','button-secondary',`data-id="${esc(q.id)}" data-role="${role}"`)}</div>${open?assetFrame(q,role):''}</section>`;
}
function figureInline(q){
 if(!FIGURE_IDS.has(q.id)||DRAWINGS[q.id])return '';
 return `<figure class="inline-figure"><div class="sketch-head"><strong>Diagram or sketch</strong><span>Exact extracted figure</span></div><div class="excerpt-frame"><div class="scan-loading">Loading figure…</div><img alt="Engineering diagram from question ${esc(q.id)}" data-excerpt-id="${esc(q.id)}" data-excerpt-kind="f" class="excerpt-image"/></div><figcaption>Graphics preserved from the supplied question rather than redrawn with guessed measurements.</figcaption></figure>`;
}
function hydrateScans(){
 document.querySelectorAll('img[data-excerpt-id]').forEach(img=>{
  const parent=img.closest('.excerpt-frame'),id=img.dataset.excerptId,kind=img.dataset.excerptKind;
  visualAsset(id).then(asset=>{
   if(!img.isConnected)return;
   if(!asset?.[kind])throw new Error('Image not available');
   img.onload=()=>{if(parent?.isConnected){parent.classList.add('loaded');const t=parent.querySelector('.scan-loading');if(t)t.textContent='';}};
   img.onerror=()=>{const t=parent?.querySelector('.scan-loading');if(t)t.textContent='Image could not be displayed.'};
   img.src='data:image/'+(asset[kind].startsWith('iVBOR')?'png':'webp')+';base64,'+asset[kind];
  }).catch(e=>{if(parent?.isConnected){let t=parent.querySelector('.scan-loading');if(t)t.textContent='Visual unavailable: '+e.message;}})
 });
}
function books(){
 const picks=Q.filter(q=>DRAWINGS[q.id]||q.diagram||FIGURE_IDS.has(q.id)||CONTEXT_IDS.has(q.id));
 return heading('FIGURE LIBRARY','Diagrams, sketches and tables','Illustrations appear directly in their question cards. Every question also has a self-contained image of its exact original printed text, diagrams and solution.')+
 `<div class="card pad"><p><strong>${picks.length} illustrated entries</strong> with extracted source graphics or reconstructed SVG sketches. Other questions can contain formatted math, tables or special notation in their exact-print excerpts.</p></div>`+resultRows(picks.slice(0,100));
}
function getStats(){
 const a=Object.values(state.history);const scored=a.filter(x=>x.correct===true||x.correct===false);
 const right=scored.filter(x=>x.correct===true);return {attempted:a.length,scored:scored.length,correct:right.length,accuracy:scored.length?Math.round(100*right.length/scored.length):0};
}
function noteText(q){if(q.status==='manually-checked')return 'Reconstructed and manually checked against the supplied book; not externally certified.';if(q.status==='source-transcribed')return 'Extracted from the Learnova PDF. Source key and technical solution have not been independently verified.';if(q.status==='ocr-review')return 'Reconstructed from a scanned page using OCR. Browse only: automatic grading is disabled until the math, choices, and key are manually checked.';return 'REVIEW ONLY: transcription, missing figure, ambiguous answer or solution requires validation. Publisher letter (if shown) is not a verified correct answer.'}
function home(){
 const stats=getStats();return heading('YOUR FE CIVIL STUDY SPACE','Practice your way','One connected question bank, customizable sessions, and standalone figures and solutions.',btn('Build a practice set','practice'))+
 `<div class="cards"><div class="card metric"><b>${Q.length.toLocaleString()}</b><span>Book question positions</span></div><div class="card metric"><b>${SUBJECTS.filter(x=>x!=='Mixed practice — topic unclassified').length}</b><span>FE subjects</span></div><div class="card metric"><b>${stats.attempted}</b><span>Questions attempted</span></div></div>`+
 (state.session&&!state.session.submitted?`<div class="card resume-card"><div><h2>Continue your session</h2><p>Your previous session is saved in this browser.</p></div>${btn('Resume session','resumeSession')}</div>`:'')+
 `<div class="section-head"><h2>Choose how to study</h2></div><div class="action-grid">
 <article class="card action"><div class="symbol">✎</div><h3>Custom practice</h3><p>Choose questions, multiple subjects, time limit, and selection style.</p>${btn('Customize practice','practice')}</article>
 <article class="card action"><div class="symbol">◷</div><h3>Custom timed exams</h3><p>Set your own exam length and duration, or use a quick preset.</p>${btn('Build an exam','exams')}</article>
 <article class="card action"><div class="symbol">▦</div><h3>Question library</h3><p>Find questions by original book number, subtopic, and source.</p>${btn('Open library','library','button-secondary')}</article>
 <article class="card action"><div class="symbol">◎</div><h3>Study by subject</h3><p>Explore each civil engineering topic and its available questions.</p>${btn('Choose a subject','subjects','button-secondary')}</article>
 <article class="card action"><div class="symbol">⌁</div><h3>Questions with diagrams</h3><p>Explore ${DRAWING_COUNT} illustrated question cards with redraws and exact source figures.</p>${btn('Browse diagrams','browseIllustrated','button-secondary')}</article>
 <article class="card action"><div class="symbol">▤</div><h3>Visual question collection</h3><p>Every diagram, equation, and solution is included as an independent web asset, without a PDF viewer.</p>${btn('Open books','books','button-secondary')}</article></div>`;
}
function matches(q){
 const h=`${q.id} ${q.source} ${q.studySubject} ${q.studySubtopic} ${q.question}`.toLowerCase();
 return (state.source==='All books'||q.source===state.source)&&(state.subject==='All subjects'||q.studySubject===state.subject)&&
 (state.libraryTopic==='All subtopics'||q.studySubtopic===state.libraryTopic)&&
 (state.level==='All questions'||(state.level==='With diagrams'&&!!(DRAWINGS[q.id]||q.diagram||FIGURE_IDS.has(q.id)||CONTEXT_IDS.has(q.id)))||(state.level==='Bookmarked'&&state.bookmarks[q.id])||(state.level==='Not attempted'&&!state.history[q.id])||(state.level==='Previously missed'&&state.history[q.id]?.correct===false))&&
 (!state.search||h.includes(state.search.toLowerCase()));
}
function topicList(subject,source='All books',pool=Q){return [...new Set(pool.filter(q=>(subject==='All subjects'||q.studySubject===subject)&&(source==='All books'||q.source===source)).map(q=>q.studySubtopic))].sort()}
function resultRows(rows){return rows.map(q=>`<article class="list-row"><div><div class="small-caps">${esc(q.source).toUpperCase()} · QUESTION ${esc(q.id)} · ${esc(q.studySubtopic)}</div><h3>${esc(q.question).slice(0,300)}${(q.question||'').length>300?'…':''}</h3><p>${esc(q.studySubject)} · PDF page ${q.sourcePage||'see original'}</p></div>${btn('Open question','open','button-secondary',`data-id="${esc(q.id)}"`)}</article>`).join('')||'<div class="empty">No questions match these filters.</div>'}
function library(){let results=Q.filter(matches);let subjects=['All subjects',...SUBJECTS];let topics=['All subtopics',...topicList(state.subject,state.source)];return heading('YOUR COMPLETE QUESTION BANK','Question library','All sources together, with subject, subtopic and search filters.')+`<div class="toolbar"><input id="librarySearch" class="field search" placeholder="Search for a question, topic or number" aria-label="Search questions" value="${esc(state.search)}"/><span class="library-count">${results.length} matching</span></div><div class="filterbox"><select id="sourceFilter" class="field">${SOURCES.map(v=>`<option ${v===state.source?'selected':''}>${esc(v)}</option>`).join('')}</select><select id="subjectFilter" class="field">${subjects.map(v=>`<option ${v===state.subject?'selected':''}>${esc(v)}</option>`).join('')}</select><select id="topicFilter" class="field" aria-label="Filter subtopic">${topics.map(v=>`<option ${v===state.libraryTopic?'selected':''}>${esc(v)}</option>`).join('')}</select><select id="levelFilter" class="field">${['All questions','With diagrams','Bookmarked','Not attempted','Previously missed'].map(v=>`<option ${v===state.level?'selected':''}>${v}</option>`).join('')}</select></div><div id="libraryResults">${resultRows(results.slice(0,state.limit))}</div>${results.length>state.limit?`<div style="text-align:center;margin:20px">${btn('Show 50 more','more','button-secondary')}</div>`:''}<div class="footer-note">Showing ${Math.min(state.limit,results.length)} of ${results.length} question positions.</div>`;}
function poolForBuilder(){
 let pool=Q.filter(q=>(state.studySource==='All books'||q.source===state.studySource)&&(!state.studySubjects.length||state.studySubjects.includes(q.studySubject)));
 if(state.studyTopic!=='All subtopics')pool=pool.filter(q=>q.studySubtopic===state.studyTopic);
 if(state.studySelection==='scorable')pool=pool.filter(canScore);
 if(state.studySelection==='unseen')pool=pool.filter(q=>!state.history[q.id]);
 if(state.studySelection==='missed')pool=pool.filter(q=>state.history[q.id]?.correct===false);
 if(state.studySelection==='saved')pool=pool.filter(q=>state.bookmarks[q.id]);
 if(state.studySelection==='illustrated')pool=pool.filter(q=>!!(DRAWINGS[q.id]||q.diagram));
 return pool;
}
function builderPage(examMode){
 const mode=examMode?'exam':'practice';const pool=poolForBuilder();const count=Math.min(250,Math.max(1,Number(state.studyLength)||20));
 const topics=['All subtopics',...new Set(Q.filter(q=>(state.studySource==='All books'||q.source===state.studySource)&&(!state.studySubjects.length||state.studySubjects.includes(q.studySubject))).map(q=>q.studySubtopic))].sort();
 const presets=[[10,0,'10 questions · untimed'],[20,60,'20 questions · 60 min'],[40,120,'40 questions · 120 min'],[110,320,'110 questions · 320 min']];
 return heading(examMode?'TIMED EXAM BUILDER':'CUSTOM PRACTICE BUILDER',examMode?'Create your timed exam':'Create your practice set',examMode?'Choose your subject mix, question count and exact exam duration. You can review your answers once the exam is submitted.':'Choose your question mix and pace. Get feedback after submitting each question.')+
 `<div class="card practice-builder"><div class="builder-head"><h2>${examMode?'Exam settings':'Practice settings'}</h2><span class="tag green">${pool.length} matching problems</span></div>
 <div class="builder-grid">
 <label>Number of questions <input id="studyLength" class="field" type="number" min="1" max="250" step="1" value="${count}"></label>
 <label>Time limit in minutes <input id="studyMinutes" class="field" type="number" min="0" max="900" step="1" value="${state.studyMinutes}"></label>
 <label>Source book<select class="field" id="studySource">${SOURCES.map(v=>`<option ${v===state.studySource?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
 <label>Pick questions from<select class="field" id="studySelection">${[['all','All questions'],['scorable','Questions with automatic scoring'],['unseen','Not attempted yet'],['missed','Previously missed'],['saved','Bookmarks only'],['illustrated','With diagrams']].map(([k,t])=>`<option value="${k}" ${state.studySelection===k?'selected':''}>${t}</option>`).join('')}</select></label>
 <label>Subject order<select class="field" id="studyStrategy"><option value="balanced" ${state.studyStrategy==='balanced'?'selected':''}>Balanced across selected subjects</option><option value="random" ${state.studyStrategy==='random'?'selected':''}>Fully random</option><option value="book" ${state.studyStrategy==='book'?'selected':''}>Original book order</option></select></label>
 <label>Subtopic<select class="field" id="studyTopic">${topics.map(v=>`<option ${state.studyTopic===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
 </div>
 <div class="subject-pick-head"><h3>Subjects</h3><div class="subject-pick-buttons">${btn('Select all','clearSubjects','button-quiet')}${btn('Clear selection','selectNoSubjects','button-quiet')}</div></div>
 <div class="subject-picker">${SUBJECTS.map(x=>`<label class="subject-choice"><input type="checkbox" data-study-subject="${esc(x)}" ${!state.studySubjects.length||state.studySubjects.includes(x)?'checked':''}> <span>${esc(x)}</span></label>`).join('')}</div>
 <p class="hint">Leave every subject selected for a varied exam. Select only the subjects you want to focus on. A 0-minute limit means untimed practice${examMode?' (choose a positive value for a timed exam)':''}.</p>
 <div class="preset-row"><span class="small-caps">QUICK SETTINGS</span>${presets.map(([n,m,t])=>btn(t,'setPreset','preset-button',`data-count="${n}" data-minutes="${m}"`)).join('')}</div>
 <div class="footer-actions">${btn(examMode?'Start timed exam →':'Start practice →','startConfigured','button',pool.length<count?'disabled':'')}${btn(examMode?'Switch to practice':'Switch to timed exam',examMode?'practice':'exams','button-secondary')}</div>
 ${pool.length<count?`<p class="warningline">Only ${pool.length} questions match your filters. Reduce the number or widen your selection.</p>`:''}
 </div><p class="footer-note">All sources are in one practice bank. Answer letters are compared with publisher keys using the original printed choices, including when editable equations are unavailable. Source-key grading is not independent technical verification. Original questions and printed solutions are one click away.</p>`;
}
function practice(){return builderPage(false)}
function exams(){return builderPage(true)}
function subjects(){const groups=SUBJECTS.map(s=>Q.filter(q=>q.studySubject===s));return heading('FOCUS YOUR STUDY','Study by subject','Open any subject, or select multiple subjects using Custom practice.')+`<div class="subject-grid">${SUBJECTS.map((s,i)=>`<div class="card subject-card"><div class="small-caps">${groups[i].length} QUESTIONS</div><h3>${esc(s)}</h3><p>${esc([...new Set(groups[i].map(q=>q.studySubtopic))].slice(0,6).join(' · '))}</p>${btn('Browse questions','subjectBrowse','button-secondary',`data-subject="${esc(s)}"`)}</div>`).join('')}</div>`;}
function progress(){let st=getStats();return heading('MY STUDY HISTORY','Progress and accuracy','Your questions are tracked together. Accuracy is calculated only where an answer can be automatically compared with the source key.')+`<div class="cards"><div class="card metric"><b>${st.attempted}</b><span>Questions attempted</span></div><div class="card metric"><b>${st.scored}</b><span>Scored responses</span></div><div class="card metric"><b>${st.accuracy}%</b><span>Source-key accuracy</span></div></div><div class="card"><h2>By subject</h2>${SUBJECTS.map(s=>{let a=Q.filter(q=>q.studySubject===s),done=a.filter(q=>state.history[q.id]),graded=done.filter(q=>state.history[q.id].correct===true||state.history[q.id].correct===false),right=graded.filter(q=>state.history[q.id].correct===true);return `<div class="row-line"><span>${esc(s)}</span><span>${done.length}/${a.length} attempted · ${right.length}/${graded.length} scored correct</span></div><div class="progress-line"><span style="width:${a.length?100*done.length/a.length:0}%"></span></div>`}).join('')}</div>`;}
function savedPage(){let a=Q.filter(q=>state.bookmarks[q.id]);return heading('SAVED QUESTIONS','Bookmarks','Your saved questions are stored only in this browser.')+resultRows(a.slice(0,150))}
function reports(){return heading('QUESTION FEEDBACK','Mistake reports','Flag unclear equations, missing diagrams, answer-key errors, or OCR problems. Reports stay in this browser until you export them.')+`<div class="card"><div class="quiz-head"><h2>${state.reports.length} submitted reports</h2>${btn('Export reports JSON','exportReports','button-secondary')}</div>${state.reports.length?state.reports.map(r=>`<div class="list-row"><div><div class="small-caps">${esc(r.id)} · ${esc(r.date)}</div><p>${esc(r.message)}</p></div>${btn('Open question','open','button-secondary',`data-id="${esc(r.id)}"`)}</div>`).join(''):'<p class="hint">No reports yet.</p>'}</div>`}
function about(){return heading('ABOUT THIS COLLECTION','About and backup','One combined question bank from Learnova and the four companion practice exams. Sessions and progress are saved only in this browser.')+`<div class="card section-narrow"><h2>Sources and reference material</h2><p>Learnova FE Civil Exam Prep: 1,052 main-book questions and 440 companion-exam question positions. Some companion-exam questions may repeat main-book questions.</p><p>All ${Q.length} positions are available together through the question library and custom practice. ${DRAWING_COUNT} redrawn diagrams are included; original book diagrams and printed solutions are accessible through the optional reference views.</p><p class="hint">Responses are compared with the publisher's printed answer letters, including image-based A–D choices. Automatic grading is not independent engineering verification; the publisher and transcription may have errors. Question 3 uses the nearest listed answer; Question 68 accepts both statistical interpretations. The included CSV review records preserve the detailed review history.</p><p class="hint">These source materials are copyrighted; confirm the publishers' permission covers redistribution if deploying them on a public website.</p><div class="footer-actions">${btn('Export progress JSON','exportProgress','button-secondary')}${btn('Download issue reports','exportReports','button-secondary')}${btn('Clear saved progress','clear','button-quiet')}</div></div>`}
function drawDiagram(kind,q){if(q&&DRAWINGS[q.id]){const d=DRAWINGS[q.id];return `<figure class="svg-diagram source-sketch"><div class="sketch-head"><strong>${esc(d.title)}</strong><span>${d.source==='source-figure'?'Source-matched diagram':'Conceptual sketch'}</span></div><svg viewBox="0 0 560 270" role="img" aria-label="${esc(d.title)}" xmlns="http://www.w3.org/2000/svg">${d.svg}</svg><figcaption>Source: ${q.source} PDF p. ${esc(d.figurePage||q.sourcePage)}. ${esc(d.note)}</figcaption></figure>`}if(kind==='chord')return `<div class="svg-diagram"><svg viewBox="0 0 460 210" role="img" aria-label="Circle with chord offset from center"><circle cx="226" cy="103" r="85" fill="none" stroke="#42669e" stroke-width="3"/><line x1="189" y1="27" x2="189" y2="179" stroke="#2d74b6" stroke-width="3"/><line x1="189" y1="103" x2="226" y2="103" stroke="#ca734d" stroke-width="3" stroke-dasharray="4 5"/><line x1="226" y1="103" x2="286" y2="44" stroke="#2e6497" stroke-width="2"/><text x="197" y="96" font-size="17" fill="#c56a42">5</text><text x="273" y="62" font-size="17" fill="#345674">13</text></svg></div>`;
if(kind==='moment')return `<div class="svg-diagram"><svg viewBox="0 0 460 230" role="img" aria-label="Force vector applied at coordinates 3,4"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#3d61a2"/></marker></defs><path d="M44 196V24M44 196H433" stroke="#61718b" stroke-width="2"/><circle cx="190" cy="68" r="5" fill="#3969ab"/><text x="158" y="56" font-size="16" fill="#435775">P(3,4)</text><path d="M190 68L331 4" stroke="#3d61a2" stroke-width="4" marker-end="url(#arrow)"/><text x="307" y="50" font-size="16" fill="#435775">80 N</text><path d="M190 68V196" stroke="#9aa0ac" stroke-dasharray="5 5"/><text x="112" y="214" font-size="15" fill="#435775">3 m</text><text x="53" y="134" font-size="15" fill="#435775">4 m</text></svg></div>`;
if(kind==='beam20')return `<div class="svg-diagram"><svg viewBox="0 0 520 190" role="img" aria-label="Simply supported 20-ft beam with point C 4 feet from left support"><line x1="55" y1="60" x2="470" y2="60" stroke="#425d7a" stroke-width="13"/><path d="M55 75l-13 21h26z" fill="none" stroke="#345f88" stroke-width="2"/><circle cx="470" cy="85" r="10" fill="none" stroke="#345f88" stroke-width="2"/><line x1="138" y1="52" x2="138" y2="76" stroke="#c8784d" stroke-width="3"/><text x="127" y="43" fill="#3f5675" font-size="18">C</text><text x="39" y="48" fill="#3f5675" font-size="18">A</text><text x="464" y="48" fill="#3f5675" font-size="18">B</text><path d="M55 123H138M138 123H470" stroke="#526a86" stroke-width="1.5"/><text x="76" y="147" fill="#3f5675" font-size="16">4 ft</text><text x="267" y="147" fill="#3f5675" font-size="16">16 ft</text><text x="202" y="174" fill="#3f5675" font-size="16">20 ft total span</text></svg></div>`;
return ''}
function mathText(s){return esc(s).replace(/\^([0-9]{1,3})/g,(_,p)=>`<sup>${p}</sup>`).replace(/_([0-9]{1,3})/g,(_,p)=>`<sub>${p}</sub>`)}
function renderQuestion(q,scope){
 const s=scope==='session'?state.session:null, choice=s?s.answers[q.id]:state.answers[q.id];
 const done=s?(s.submitted||(!s.examMode&&!!s.checked?.[q.id])):!!state.checked[q.id];
 const revealed=s?(!!s.revealed?.[q.id]&&(s.submitted||(!s.examMode&&!!s.checked?.[q.id]))):!!state.revealed[q.id];
 const scored=canScore(q), hasOptions=Array.isArray(q.options)&&q.options.length===4;
 // For source-extracted math/choices that haven't been rechecked, show the exact printed crop instead of repeating potentially damaged notation.
 const exactPrimary=!hasOptions||q.status==='needs-review'||CONTEXT_IDS.has(q.id);
 const letterOptions=hasOptions&&!exactPrimary?q.options:['A','B','C','D'].map(a=>'Select '+a+' from the printed choices above');
 const options=`<div class="options">${letterOptions.map((txt,i)=>{let letter='ABCD'[i],correct=done&&scored&&acceptedLetters(q).includes(letter),wrong=done&&scored&&choice===letter&&!matchesKey(q,letter);return `<button class="option${choice===letter?' selected':''}${correct?' correct':''}${wrong?' incorrect':''}" data-action="choose" data-id="${esc(q.id)}" data-letter="${letter}" ${done?'disabled':''}><span class="letter">${letter}</span><span>${mathText(txt)}</span></button>`}).join('')}</div>`;
 const result=done&&!revealed?`<div class="result-next">${scored?(matchesKey(q,choice)?'Your answer is accepted under the available answer policy.':'Your answer is not accepted under the available answer policy.'):'Your response is saved. Compare it with the printed solution.'} Choose <strong>View solution</strong> to continue.</div>`:'';
 const solText=q.solution||'Please consult the accompanying printed solution.';
 const solBox=revealed?`<section class="solution"><h3>Worked solution${scored&&q.answer?' · Answer '+esc(acceptedLetters(q).join(' or ')):''}</h3>${q.status==='manually-checked'?`<div class="text-stack">${mathText(solText)}</div>`:`<p class="hint">The original solution is displayed below with its mathematical layout preserved.</p>`}${sourceScan(q,'solution',q.status!=='manually-checked')}${q.note?`<div class="note">${esc(q.note)}</div>`:''}</section>`:'';
 const prompt=exactPrimary?`<h2 class="question-text">Question ${esc(q.id)}</h2><p class="hint">Read the exact question and its original choices below; use A–D buttons to answer.</p>${sourceScan(q,'question',true)}`:`<h2 class="question-text">${mathText(q.question||'Refer to the printed question.')}</h2>${drawDiagram(q.diagram,q)}${figureInline(q)}${sourceScan(q,'question',false)}`;
 return `<article class="card question-card"><div class="question-top"><span class="tag purple">${esc(q.source)} · ${esc(q.id)}</span><span class="tag">${esc(q.studySubject)}</span>${btn(state.bookmarks[q.id]?'★ Saved':'☆ Bookmark','bookmark','button-quiet',`data-id="${esc(q.id)}"`)}</div><div class="tag-row"><span class="tag green">${esc(q.studySubtopic)}</span></div>${prompt}<div class="answer-area"><h3>Choose an answer</h3>${options}</div>${result}${solBox}<div class="footer-actions">${!done&&(!s||!s.examMode)?btn('Submit answer','check','button',`data-id="${esc(q.id)}" ${!choice?'disabled':''}`):''}${!revealed&&((!s&&done)||(s&&(s.submitted||(!s.examMode&&done))))?btn('View solution','reveal','button-secondary',`data-id="${esc(q.id)}"`):''}${!s?btn('Next question →','next','button-secondary'):''}${btn('Download question','exportQuestion','button-quiet',`data-id="${esc(q.id)}"`)}${btn('Report a problem','reportQuestion','button-quiet',`data-id="${esc(q.id)}"`)}${btn(state.flags[q.id]?'⚑ Flagged':'⚑ Flag question','flag','button-quiet',`data-id="${esc(q.id)}"`)}</div><div class="meta-foot">${esc(q.source)} · Question ${esc(q.id)}. No PDF required for study.</div></article>`;
}
function single(){let q=byId.get(state.qid)||Q[0],idx=Q.findIndex(x=>x.id===q.id);return `<div class="quiz-head"><div><div class="eyebrow">SOURCE-BOOK QUESTION</div><h1>${esc(q.source)} ${esc(q.id)}</h1></div><div class="toolbar">${btn('← Previous','prev','button-secondary',idx===0?'disabled':'')}${btn('Next →','next','button-secondary',idx===Q.length-1?'disabled':'')}</div></div><div class="section-head"><span class="hint">Source item ${idx+1} of ${Q.length}</span>${btn('Return to library','library','button-quiet')}</div>${renderQuestion(q,'single')}`}
function shuffle(a){let b=[...a];for(let i=b.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function balancedSample(pool,count){
  // Equalize available subject coverage first, then avoid immediate topic repeats.
  const bags=new Map(),usedSubjects=new Map(),usedTopics=new Map();
  for(const q of shuffle(pool)){const key=q.studySubject;if(!bags.has(key))bags.set(key,[]);bags.get(key).push(q)}
  const result=[];let lastSubject='',lastTopic='';
  while(result.length<count){
    const available=[...bags].filter(([_,arr])=>arr.length);if(!available.length)break;
    available.sort((a,b)=>(usedSubjects.get(a[0])||0)-(usedSubjects.get(b[0])||0));
    const lowest=usedSubjects.get(available[0][0])||0;
    const poolSubjects=available.filter(([key])=>(usedSubjects.get(key)||0)===lowest);
    const pick=poolSubjects.find(([key])=>key!==lastSubject)||poolSubjects[0]||available.find(([key])=>key!==lastSubject)||available[0];
    const list=pick[1];let bestIx=0,bestScore=Infinity;
    list.forEach((q,i)=>{let k=q.studySubject+'|'+q.studySubtopic;const score=(usedTopics.get(k)||0)*10+(q.studySubtopic===lastTopic?3:0);if(score<bestScore){bestIx=i;bestScore=score}});
    const q=list.splice(bestIx,1)[0],topicKey=q.studySubject+'|'+q.studySubtopic;
    usedSubjects.set(q.studySubject,(usedSubjects.get(q.studySubject)||0)+1);
    usedTopics.set(topicKey,(usedTopics.get(topicKey)||0)+1);
    result.push(q);lastSubject=q.studySubject;lastTopic=q.studySubtopic;
  }
  return result;
}
function pickQuestions(pool,count,strategy='balanced'){
 if(strategy==='random')return shuffle(pool).slice(0,count);
 if(strategy==='book')return pool.slice(0,count);
 return balancedSample(pool,count);
}
function start(n,mins,mode='practice',opts={}){
 const pool=opts.pool||poolForBuilder();n=Math.floor(Number(n));mins=Math.floor(Number(mins));
 if(!Number.isFinite(n)||n<1||n>250){toast('Choose between 1 and 250 questions.');return}
 if(!Number.isFinite(mins)||mins<0||mins>900){toast('Choose a time from 0 to 900 minutes.');return}
 if(mode==='exam'&&mins<1){toast('Enter an exam time limit greater than zero.');return}
 if(pool.length<n){toast(`Only ${pool.length} questions match. Reduce your question count or widen the filters.`);return}
 if(state.session&&!state.session.submitted&&!confirm('Start a new session? Your unfinished session will be replaced.'))return;
 const ids=pickQuestions(pool,n,opts.strategy||state.studyStrategy).map(q=>String(q.id));
 state.session={ids,answers:{},index:0,started:Date.now(),minutes:mins,submitted:false,examMode:mode==='exam',checked:{},revealed:{}};
 state.reference={};persist();state.view='session';render();
}
function sessionPage(){
 const s=state.session;if(!s)return builderPage(false);
 const id=s.ids[s.index],q=byId.get(id);if(!q)return home();
 const answered=s.ids.filter(i=>s.answers[i]).length;
 const remain=s.minutes?Math.max(0,Math.floor(s.minutes*60-(Date.now()-s.started)/1000)):0;
 const timer=s.minutes?`<span id="clock" class="timer ${remain<300?'warn':''}">${Math.floor(remain/60)}:${String(remain%60).padStart(2,'0')}</span>`:'<span class="hint">Untimed</span>';
 let summary='';if(s.submitted){
   const scorable=s.ids.filter(i=>canScore(byId.get(i)));const answeredScorable=scorable.filter(i=>!!s.answers[i]);
   const right=answeredScorable.filter(i=>matchesKey(byId.get(i),s.answers[i]));const notScored=s.ids.length-scorable.length;
   summary=`<div class="card session-summary"><h2>Session complete</h2><p class="score-strong">${right.length} / ${scorable.length}</p><p class="hint">Compared with available source answer keys. ${answered} of ${s.ids.length} questions answered. ${notScored?`${notScored} could not be automatically scored and are available for self-review.`:''} This is not an official FE examination score.</p></div>`;
 }
 return `<div class="quiz-head"><div><div class="eyebrow">${s.examMode?'EXAM MODE':'PRACTICE MODE'}</div><h1>${s.submitted?'Review your session':'Question '+(s.index+1)+' of '+s.ids.length}</h1></div>${timer}</div><div class="progress-line"><span style="width:${100*answered/s.ids.length}%"></span></div><div class="question-nav">${s.ids.map((qid,i)=>`<button class="${i===s.index?'current':''} ${s.answers[qid]?'answered':''}" data-action="jump" data-index="${i}" aria-label="Go to question ${i+1}">${i+1}</button>`).join('')}</div>${summary}${renderQuestion(q,'session')}<div class="footer-actions" style="margin-top:15px">${btn('← Previous','sessionPrev','button-secondary',s.index===0?'disabled':'')}${btn('Next →','sessionNext','button-secondary',s.index===s.ids.length-1?'disabled':'')}${!s.submitted?btn('Finish & view results','submit','button right'):btn('Back to dashboard','home','button right')}</div>`;
}
const pages={home,library,practice,exams,subjects,books,progress,bookmarks:savedPage,reports,about,single,session:sessionPage};
const labels={home:'Dashboard',library:'Question library',practice:'Practice questions',exams:'Timed exams',subjects:'Study by subject',books:'Figure gallery',progress:'My progress',bookmarks:'Bookmarks',reports:'Mistake reports',about:'Settings & info',single:'Question',session:'Session'};
function render(){document.querySelectorAll('[data-view]').forEach(e=>e.classList.toggle('active',e.dataset.view===state.view));$('#breadcrumb').textContent=labels[state.view]||'FE Civil Prep';$('#view').innerHTML=(pages[state.view]||home)();hydrateScans();if(state.menu){state.menu=false;$('#sidebar').classList.remove('open')}}
function choose(id,letter){let q=byId.get(id);if(!q)return;if(state.view==='session'){if(state.session?.submitted)return;state.session.answers[id]=letter;if(!state.session.examMode){delete state.session.checked?.[id];delete state.session.revealed?.[id]}}else{state.answers[id]=letter;delete state.checked[id]}persist();render()}
function check(id){const q=byId.get(id);if(!q){return}
 const s=state.view==='session'?state.session:null;
 if(s){if(s.examMode||!s.answers[id]){toast('Select an answer first.');return}s.checked=s.checked||{};s.checked[id]=true;
   state.history[id]={correct:canScore(q)?matchesKey(q,s.answers[id]):null,chosen:s.answers[id],date:new Date().toISOString()};
 }else{if(!state.answers[id]){toast('Select an answer first.');return}state.checked[id]=true;
   state.history[id]={correct:canScore(q)?matchesKey(q,state.answers[id]):null,chosen:state.answers[id],date:new Date().toISOString()};}
 persist();render();
}
function reveal(id){if(state.view==='session'){state.session.revealed=state.session.revealed||{};state.session.revealed[id]=true}else{state.revealed[id]=true}persist();render()}
function submit(){const s=state.session;if(!s||s.submitted)return;
 s.submitted=true;for(const id of s.ids){if(!s.answers[id])continue;const q=byId.get(id);state.history[id]={correct:canScore(q)?matchesKey(q,s.answers[id]):null,chosen:s.answers[id],date:new Date().toISOString()}}
 persist();render();toast('Session completed.');}
function downloadBlob(n,b){let a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.hidden=true;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1400)}
function exportJSON(n,obj){downloadBlob(n,new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}))}
async function exportQuestion(id){
 const q=byId.get(id);if(!q)return;
 const z=new JSZip();z.file('question.json',JSON.stringify(q,null,2));
 const x=await visualAsset(id);
 if(x.q)z.file('question.webp',x.q,{base64:true});
 if(x.s)z.file('worked_solution.webp',x.s,{base64:true});
 if(x.f)z.file('diagram.webp',x.f,{base64:true});
 if(DRAWINGS[id]){const d=DRAWINGS[id];z.file('redrawn_diagram.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 270">${d.svg}</svg>`)}
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>Question ${esc(id)}</title><style>body{font:16px/1.6 system-ui;max-width:760px;margin:30px auto;padding:20px}img{width:100%;height:auto}figure{margin:16px 0}.solution{margin-top:20px;background:#f1f7ff;padding:20px}</style></head><body><h1>Question ${esc(id)}</h1><img src="question.webp" alt="Question and original choices"><div class="solution"><h2>Worked solution</h2><img src="worked_solution.webp" alt="Publisher worked solution"></div></body></html>`;
 z.file('index.html',html);
 downloadBlob('FE_Question_'+String(id).replace(/[^A-Za-z0-9.-]/g,'_')+'.zip',await z.generateAsync({type:'blob',compression:'DEFLATE'}));toast('Question downloaded.');
}
function reportIssue(id){let msg=window.prompt('Report a problem with question '+id+':');if(!msg?.trim())return;state.reports.unshift({id,message:msg.trim(),date:new Date().toLocaleString()});persist();toast('Saved in this browser. Export from Mistake reports.')}
function act(name,d={}){const id=d.id;switch(name){
 case 'toggleReference':{const k=d.role+':'+d.id;const q=byId.get(d.id);state.reference[k]=!(state.reference[k]??(q&&(d.role==='question'?(!q.options?.length||q.status==='needs-review'||CONTEXT_IDS.has(q.id)):q.status!=='manually-checked')));render();break}
 case 'setPreset':{state.studyLength=Number(d.count)||20;state.studyMinutes=Number(d.minutes)||0;persist();render();break}
 case 'clearSubjects':{state.studySubjects=[];state.studyTopic='All subtopics';persist();render();break}
 case 'selectNoSubjects':{state.studySubjects=['__none__'];state.studyTopic='All subtopics';persist();render();break}
 case 'startConfigured':{const mode=state.view==='exams'?'exam':'practice';start(state.studyLength,state.studyMinutes,mode);break}
 case 'resumeSession':{state.view='session';render();break}
 case 'browseIllustrated':state.source='All books';state.subject='All subjects';state.libraryTopic='All subtopics';state.level='With diagrams';state.search='';state.limit=50;state.view='library';render();break;
 case 'subjectBrowse':state.subject=d.subject;state.source='All books';state.libraryTopic='All subtopics';state.level='All questions';state.search='';state.limit=50;state.view='library';render();break;
 case 'open':if(byId.has(id)){state.qid=id;state.reference={};state.view='single';render()}break;
 case 'more':state.limit+=50;render();break;
 case 'choose':choose(id,d.letter);break;case 'check':check(id);break;case 'reveal':reveal(id);break;
 case 'bookmark':state.bookmarks[id]=!state.bookmarks[id];persist();render();break;
 case 'flag':state.flags[id]=!state.flags[id];persist();render();break;
 case 'reportQuestion':reportIssue(id);break;
 case 'exportQuestion':exportQuestion(id).catch(e=>toast('Unable to export: '+e.message));break;
 case 'prev':{let n=Q.findIndex(x=>x.id===state.qid);state.qid=Q[Math.max(0,n-1)].id;state.reference={};render();break}
 case 'next':{let n=Q.findIndex(x=>x.id===state.qid);state.qid=Q[Math.min(Q.length-1,n+1)].id;state.reference={};render();break}
 case 'sessionPrev':if(state.session.index>0){state.session.index--;state.reference={};persist();render()}break;
 case 'sessionNext':if(state.session.index<state.session.ids.length-1){state.session.index++;state.reference={};persist();render()}break;
 case 'jump':state.session.index=Number(d.index);persist();render();break;
 case 'submit':submit();break;
 case 'exportReports':exportJSON('FE_Civil_Mistake_Reports.json',state.reports);break;
 case 'exportProgress':exportJSON('FE_Civil_Saved_Progress.json',load());break;
 case 'clear':if(confirm('Clear saved answers, history, flags, bookmarks and reports for this website?')){try{localStorage.removeItem(KEY)}catch{}location.reload()}break;
 default:if(pages[name]){state.view=name;if(name==='exams'&&!state.studyMinutes)state.studyMinutes=60;render()}
}}
document.addEventListener('click',e=>{let t=e.target.closest('[data-view],[data-action]');if(!t)return;if(t.dataset.view){state.view=t.dataset.view;state.limit=50;if(state.view==='exams'&&!state.studyMinutes)state.studyMinutes=60;render();return}act(t.dataset.action,t.dataset)});
document.addEventListener('input',e=>{if(e.target.id==='librarySearch'){state.search=e.target.value;state.limit=50;let results=Q.filter(matches);$('#libraryResults').innerHTML=resultRows(results.slice(0,50));let count=$('.library-count');if(count)count.textContent=results.length+' matching';const more=$('[data-action="more"]');if(more)more.hidden=results.length<=50}});
document.addEventListener('change',e=>{
 const el=e.target;
 if(el.dataset.studySubject){const values=[...document.querySelectorAll('[data-study-subject]:checked')].map(x=>x.dataset.studySubject);state.studySubjects=values.length===SUBJECTS.length?[]:values;state.studyTopic='All subtopics';persist();render();return;}
 if(el.id==='studyLength'){state.studyLength=Math.min(250,Math.max(1,Math.floor(Number(el.value)||20)));persist();render();return}
 if(el.id==='studyMinutes'){state.studyMinutes=Math.min(900,Math.max(0,Math.floor(Number(el.value)||0)));persist();render();return}
 if(el.id==='studySource'){state.studySource=el.value;state.studyTopic='All subtopics';persist();render();return}
 if(el.id==='studyTopic'){state.studyTopic=el.value;persist();render();return}
 if(el.id==='studySelection'){state.studySelection=el.value;persist();render();return}
 if(el.id==='studyStrategy'){state.studyStrategy=el.value;persist();render();return}
 if(el.id==='sourceFilter'){state.source=el.value;state.libraryTopic='All subtopics';state.limit=50;render();return}
 if(el.id==='subjectFilter'){state.subject=el.value;state.libraryTopic='All subtopics';state.limit=50;render();return}
 if(el.id==='levelFilter'){state.level=el.value;state.limit=50;render();return}
 if(el.id==='topicFilter'){state.libraryTopic=el.value;state.limit=50;render();return}
});
$('#menuButton').addEventListener('click',()=>{state.menu=!state.menu;$('#sidebar').classList.toggle('open',state.menu)});
$('#quickNew').addEventListener('click',()=>{state.view='practice';render()});
setInterval(()=>{let s=state.session;if(!s||state.view!=='session'||s.submitted||!s.minutes)return;let rem=Math.max(0,Math.floor(s.minutes*60-(Date.now()-s.started)/1000)),c=$('#clock');if(c)c.textContent=Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0');if(rem===0)submit()},1000);
render();
})();
