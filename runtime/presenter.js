/* =============== 演讲者模式 / 观众屏同步 =============== */
window.__pptPresenter=(()=>{
  const query=new URLSearchParams(location.search);
  const requestedMode=query.get('mode')||'deck';
  const originalTitle=document.title;
  const notes=()=>Array.isArray(window.__SPEAKER_NOTES__)?window.__SPEAKER_NOTES__:[];
  const slideId=i=>slides[i]?.dataset.slideId||`slide-${String(i+1).padStart(2,'0')}`;
  const storageKey=name=>`guizang-ppt-${name}:${location.pathname}`;
  let mode='deck',session=query.get('session')||Math.random().toString(36).slice(2),audienceWindow=null;
  let channel=null,transportReady=false,popupBlocked=false,audienceOpenedAt=0,lastAckAt=0,lastAckIndex=-1,lastAckSeq=-1,seq=0,lastPingAt=0;
  let renderedNoteId='',saveTimer=0,noteSize=Number(localStorage.getItem('guizang-ppt-note-size')||17),presenterFrameObserver=null;
  let elapsed=0,timerRunning=false,timerStartedAt=0,timedSlideIndex=idx,slideTimerStartedAt=0,slideElapsed=Array(total).fill(0);
  let rehearsalActive=false,presenterOverviewOn=false,lowPowerBeforePresenter=window.__lowPowerMode;
  let layoutMode=localStorage.getItem(storageKey('layout'))||'balanced';
  let autoEnabled=localStorage.getItem(storageKey('auto-enabled'))==='1';
  let autoGlobalSeconds=Math.max(0,Number(localStorage.getItem(storageKey('auto-seconds'))||0));
  let autoDeadline=0,autoRemainingMs=0;
  let screenMode='normal',audienceFrozen=false;
  let annotationTool='none',annotationPointerDown=false,annotationStart=null,draftCircle=null,circles=[],audienceCircles=[];
  let laserPoint=null,audienceLaser=null,laserHideAt=0,audienceLaserHideAt=0,lastLaserSent=0;
  const seenNonces=[],seenNonceSet=new Set();
  const syncKey=()=>`guizang-ppt-sync:${location.pathname}:${session}`;
  const channelName=()=>`guizang-ppt:${location.pathname}:${session}`;

  function noteAt(i){
    const id=slideId(i);
    return notes().find(n=>n.id===id)||{id,title:slides[i]?.dataset.title||`第 ${i+1} 页`,purpose:'—',talk:[],transition:''};
  }
  function slideLabel(i){return `${i+1} / ${total} · ${noteAt(i).title||slideId(i)}`;}
  function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function valueLines(value){
    if(Array.isArray(value))return value.filter(Boolean).map(x=>`• ${x}`).join('\n');
    return value?String(value):'';
  }
  function generatedNote(n){
    const parts=[];
    if(Array.isArray(n.talk)&&n.talk.length)parts.push(`【讲述要点】\n${valueLines(n.talk)}`);
    if(n.transition)parts.push(`【转场】\n${n.transition}`);
    const optional=[['舞台提示',n.cue],['互动',n.interaction],['表达提示',n.delivery],['翻页时机',n.advance],['备用方案',n.fallback],['读音提醒',n.pronunciation]];
    optional.forEach(([label,value])=>{const text=valueLines(value);if(text)parts.push(`【${label}】\n${text}`);});
    return parts.join('\n\n')||'—';
  }
  function noteStorageKey(id){return `guizang-ppt-note:${location.pathname}:${id}`;}
  function loadNoteValue(id,i,n){
    const saved=localStorage.getItem(noteStorageKey(id));
    if(saved!==null)return saved;
    const prefix=window.__PPT_LEGACY_NOTE_KEY__;
    if(prefix){
      const legacy=localStorage.getItem(`${prefix}:${i}`);
      if(legacy!==null){localStorage.setItem(noteStorageKey(id),legacy);return legacy;}
    }
    return generatedNote(n);
  }
  function frameUrl(targetMode,i){
    const url=new URL(location.href);url.hash='';
    url.searchParams.set('mode',targetMode);url.searchParams.set('session',session);url.searchParams.set('slide',String(i+1));
    return url.href;
  }
  function postPreviewGoto(frame,i){
    try{frame.contentWindow?.postMessage({__guizangPptSync:1,session,role:'presenter',type:'preview-goto',index:i},'*');}catch(e){}
  }
  function updatePreviewFrame(frame,i){
    frame.dataset.slide=String(i);
    if(!frame.dataset.previewBound){frame.dataset.previewBound='1';frame.addEventListener('load',()=>postPreviewGoto(frame,Number(frame.dataset.slide)));}
    if(!frame.getAttribute('src'))frame.src=frameUrl('preview',i);else postPreviewGoto(frame,i);
  }
  function plannedMsAt(i){
    const minutes=Number(noteAt(i).minutes);
    return Number.isFinite(minutes)&&minutes>0?minutes*60000:null;
  }
  function totalPlannedMs(){
    const values=Array.from({length:total},(_,i)=>plannedMsAt(i));
    return values.length&&values.every(Number.isFinite)?values.reduce((sum,x)=>sum+x,0):null;
  }
  function sectionInfo(i){
    const name=String(noteAt(i).section||'').trim();
    if(!name)return null;
    let first=i,last=i;
    while(first>0&&String(noteAt(first-1).section||'').trim()===name)first--;
    while(last<total-1&&String(noteAt(last+1).section||'').trim()===name)last++;
    const targets=[];for(let x=first;x<=last;x++)targets.push(plannedMsAt(x));
    const planned=targets.every(Number.isFinite)?targets.reduce((sum,x)=>sum+x,0):null;
    const used=slideElapsed.slice(first,last+1).reduce((sum,x)=>sum+x,0)+(timerRunning&&timedSlideIndex>=first&&timedSlideIndex<=last?Date.now()-slideTimerStartedAt:0);
    return{name,position:i-first+1,count:last-first+1,planned,used};
  }
  function durationText(ms){
    const value=Math.max(0,Math.round(Number(ms)||0)),seconds=Math.floor(value/1000);
    const hours=Math.floor(seconds/3600),minutes=Math.floor((seconds%3600)/60),secs=seconds%60;
    return hours?`${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`:`${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }
  function signedDuration(ms){return `${ms>=0?'+':'−'}${durationText(Math.abs(ms))}`;}
  function clockTime(timestamp){return new Date(timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}

  function fitFrame(frame){
    const viewport=frame?.closest('.ppt-frame-viewport');
    if(!viewport)return;
    const availableWidth=viewport.clientWidth,availableHeight=viewport.clientHeight;
    if(!availableWidth||!availableHeight)return;
    const width=Math.min(availableWidth,availableHeight*(16/9)),height=width*(9/16);
    frame.style.width=`${width}px`;frame.style.height=`${height}px`;
    if(frame.id==='ppt-current-frame')sizeInk(document.getElementById('ppt-presenter-ink'),width,height);
  }
  function fitPresenterFrames(){
    fitFrame(document.getElementById('ppt-current-frame'));
    fitFrame(document.getElementById('ppt-next-frame'));
  }
  function sizeInk(canvas,width,height){
    if(!canvas||!width||!height)return;
    canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
    const dpr=Math.min(devicePixelRatio||1,2),pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
    if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
  }
  function drawEllipse(ctx,circle,width,height,alpha=1){
    const x1=circle.x1*width,y1=circle.y1*height,x2=circle.x2*width,y2=circle.y2*height;
    ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='#ff4f59';ctx.lineWidth=Math.max(3,width*.004);ctx.lineCap='round';
    ctx.beginPath();ctx.ellipse((x1+x2)/2,(y1+y2)/2,Math.abs(x2-x1)/2,Math.abs(y2-y1)/2,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  function drawInk(canvas,list,laser,draft){
    if(!canvas)return;const width=canvas.clientWidth,height=canvas.clientHeight;if(!width||!height)return;
    sizeInk(canvas,width,height);const dpr=canvas.width/width,ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    (list||[]).forEach(circle=>drawEllipse(ctx,circle,width,height));
    if(draft)drawEllipse(ctx,draft,width,height,.72);
    if(laser){
      const x=laser.x*width,y=laser.y*height,r=Math.max(6,width*.007);
      const glow=ctx.createRadialGradient(x,y,0,x,y,r*2.8);glow.addColorStop(0,'rgba(255,255,255,.98)');glow.addColorStop(.2,'rgba(255,64,72,.98)');glow.addColorStop(1,'rgba(255,64,72,0)');
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r*2.8,0,Math.PI*2);ctx.fill();
    }
  }
  function renderInks(){
    const now=Date.now();if(now>laserHideAt)laserPoint=null;if(now>audienceLaserHideAt)audienceLaser=null;
    drawInk(document.getElementById('ppt-presenter-ink'),circles,laserPoint,draftCircle);
    drawInk(document.getElementById('ppt-audience-ink'),audienceCircles,audienceLaser,null);
  }
  function setAnnotationTool(tool){
    annotationTool=annotationTool===tool?'none':tool;annotationPointerDown=false;draftCircle=null;
    const canvas=document.getElementById('ppt-presenter-ink');canvas?.classList.toggle('is-active',annotationTool!=='none');
    document.querySelectorAll('[data-ppt-tool]').forEach(button=>button.classList.toggle('is-active',button.dataset.pptTool===annotationTool));
    renderInks();
  }
  function annotationPoint(event){
    const canvas=event.currentTarget,rect=canvas.getBoundingClientRect();
    return{x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))};
  }
  function onAnnotationPointerDown(event){
    if(annotationTool!=='circle')return;event.preventDefault();annotationPointerDown=true;annotationStart=annotationPoint(event);draftCircle={x1:annotationStart.x,y1:annotationStart.y,x2:annotationStart.x,y2:annotationStart.y};event.currentTarget.setPointerCapture?.(event.pointerId);renderInks();
  }
  function onAnnotationPointerMove(event){
    if(annotationTool==='laser'){
      const point=annotationPoint(event);laserPoint=point;laserHideAt=Date.now()+650;
      if(Date.now()-lastLaserSent>32){lastLaserSent=Date.now();emit({type:'laser',index:idx,point},{persist:false});}renderInks();return;
    }
    if(annotationTool==='circle'&&annotationPointerDown&&draftCircle){const point=annotationPoint(event);draftCircle.x2=point.x;draftCircle.y2=point.y;renderInks();}
  }
  function onAnnotationPointerUp(event){
    if(annotationTool!=='circle'||!annotationPointerDown||!draftCircle)return;event.preventDefault();annotationPointerDown=false;
    const circle={...draftCircle};draftCircle=null;
    if(Math.abs(circle.x2-circle.x1)>.012&&Math.abs(circle.y2-circle.y1)>.012){circles.push(circle);emit({type:'circle',index:idx,circle});}
    renderInks();
  }
  function onAnnotationPointerLeave(){
    if(annotationTool==='laser'){laserPoint=null;emit({type:'laser',index:idx,point:null},{persist:false});renderInks();}
  }
  function clearAnnotations(broadcast=true){circles=[];draftCircle=null;laserPoint=null;if(broadcast)emit({type:'clear',index:idx});renderInks();}

  function buildPresenterOverview(){
    const grid=document.getElementById('ppt-presenter-overview-grid');if(!grid)return;grid.innerHTML='';
    slides.forEach((slide,i)=>{
      const n=noteAt(i),button=document.createElement('button');button.type='button';button.className=`ppt-overview-page${i===idx?' is-current':''}`;
      button.innerHTML=`<span class="ppt-overview-page-no">${String(i+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span><span class="ppt-overview-page-title">${escapeHTML(n.title||slideId(i))}</span><span class="ppt-overview-page-meta"><span>${escapeHTML(n.section||'未分组')}</span><span>${Math.round(((i+1)/total)*100)}%</span></span>`;
      button.onclick=()=>{togglePresenterOverview(false);go(i,{force:true});};grid.appendChild(button);
    });
    requestAnimationFrame(()=>grid.querySelector('.is-current')?.scrollIntoView({block:'nearest',inline:'nearest'}));
  }
  function togglePresenterOverview(force){
    presenterOverviewOn=typeof force==='boolean'?force:!presenterOverviewOn;
    if(presenterOverviewOn&&annotationTool!=='none')setAnnotationTool('none');
    const stack=document.querySelector('.ppt-preview-stack'),overview=document.getElementById('ppt-presenter-overview');
    stack?.classList.toggle('is-overview',presenterOverviewOn);if(overview)overview.hidden=!presenterOverviewOn;
    const button=document.getElementById('ppt-grid');if(button){button.classList.toggle('is-active',presenterOverviewOn);button.setAttribute('aria-pressed',String(presenterOverviewOn));}
    if(presenterOverviewOn)buildPresenterOverview();else requestAnimationFrame(fitPresenterFrames);renderAutoState();
  }

  function mountShell(){
    if(document.getElementById('ppt-presenter'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="ppt-presenter" data-layout="${layoutMode}" aria-label="演讲者视图">
      <div class="ppt-presenter-top"><div><div class="ppt-presenter-brand">演讲者视图</div><div class="ppt-presenter-meta"><span id="ppt-plan"></span><span id="ppt-section" hidden></span></div></div><div class="ppt-presenter-meta"><span id="ppt-sync" class="ppt-sync" data-state="disconnected" title="表示观众页面的软件同步状态，不代表 HDMI 等物理线缆状态">观众屏 · 未连接</span><button id="ppt-auto-toggle" class="ppt-ui-btn ppt-auto-state" type="button">自动翻页 · 关闭</button><button id="ppt-preflight" class="ppt-ui-btn" type="button">检查</button><button id="ppt-settings" class="ppt-ui-btn" type="button">设置</button><button id="ppt-reopen" class="ppt-ui-btn" type="button">重新打开观众屏</button><button id="ppt-exit" class="ppt-ui-btn" type="button">退出</button></div></div>
      <div class="ppt-presenter-main"><div class="ppt-preview-stack"><div class="ppt-stage-card"><div class="ppt-stage-label"><span>当前页</span><span class="ppt-annotation-tools"><button id="ppt-grid" class="ppt-ui-btn ppt-grid-btn" type="button" aria-pressed="false" title="宫格选页（Esc）"><span class="ppt-grid-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>宫格</button><button class="ppt-ui-btn" data-ppt-tool="laser" type="button" title="激光笔（L）">激光</button><button class="ppt-ui-btn" data-ppt-tool="circle" type="button" title="圈选（C）">圈选</button><button id="ppt-ink-clear" class="ppt-ui-btn ppt-clear-btn" type="button" title="清除标记（X）">清除</button></span><span id="ppt-current-label"></span></div><div class="ppt-frame-viewport"><iframe id="ppt-current-frame" class="ppt-frame" title="当前页预览"></iframe><canvas id="ppt-presenter-ink" class="ppt-annotation-layer" aria-label="演讲标注层"></canvas></div></div><div class="ppt-stage-card" id="ppt-next-card"><div class="ppt-stage-label"><span>下一页</span><span id="ppt-next-label"></span></div><div class="ppt-frame-viewport"><iframe id="ppt-next-frame" class="ppt-frame ppt-next-frame" title="下一页预览"></iframe></div></div><div id="ppt-presenter-overview" class="ppt-presenter-overview" hidden><div class="ppt-overview-head"><strong>选择页面</strong><button id="ppt-overview-close" class="ppt-ui-btn" type="button">返回预览</button></div><div id="ppt-presenter-overview-grid" class="ppt-overview-grid"></div></div></div>
      <div class="ppt-notes-card"><div class="ppt-notes-head"><div class="ppt-notes-label">标题</div><div id="ppt-notes-title" class="ppt-notes-title"></div><div class="ppt-purpose-block"><div class="ppt-notes-label">本页目的</div><div id="ppt-notes-purpose" class="ppt-purpose-copy"></div></div><div class="ppt-notes-draft-head"><div><div class="ppt-notes-label">草稿（备注）</div><div id="ppt-note-meta" class="ppt-note-meta"></div></div><span class="ppt-notes-tools"><span id="ppt-saved" class="ppt-saved">已保存</span><button id="ppt-note-smaller" class="ppt-ui-btn" type="button" title="缩小备注字号">A−</button><button id="ppt-note-larger" class="ppt-ui-btn" type="button" title="放大备注字号">A+</button></span></div></div><textarea id="ppt-note-editor" class="ppt-note-editor" spellcheck="false" aria-label="本页演讲备注"></textarea></div></div>
      <div class="ppt-presenter-bottom"><div class="ppt-time-dashboard"><div class="ppt-time-stat"><span class="ppt-time-label">已进行</span><strong id="ppt-clock" class="ppt-time-value">00:00</strong><span class="ppt-time-hint">总时长</span></div><div class="ppt-time-stat"><span class="ppt-time-label">本页</span><strong id="ppt-slide-clock" class="ppt-time-value">00:00</strong><span id="ppt-slide-plan" class="ppt-time-hint">计划 —</span></div><div id="ppt-slide-status-box" class="ppt-time-stat"><span id="ppt-slide-status-label" class="ppt-time-label">计划</span><strong id="ppt-slide-status" class="ppt-time-value">—</strong><span id="ppt-slide-status-hint" class="ppt-time-hint">未设置</span></div></div><div class="ppt-control-stack"><div class="ppt-controls"><button id="ppt-first" class="ppt-ui-btn" type="button">首页</button><button id="ppt-prev" class="ppt-ui-btn" type="button">上一页</button><button id="ppt-next" class="ppt-ui-btn" type="button">下一页</button><button id="ppt-last" class="ppt-ui-btn" type="button">尾页</button></div><div class="ppt-session-actions"><button id="ppt-timer-toggle" class="ppt-ui-btn" type="button">开始计时</button><button id="ppt-timer-reset" class="ppt-ui-btn" type="button">重置计时</button><button id="ppt-rehearsal" class="ppt-ui-btn" type="button">排练</button></div></div><div class="ppt-page-state"><strong id="ppt-page-count"></strong><span id="ppt-page-percent"></span></div></div>
      <div id="ppt-dialog" class="ppt-dialog" hidden><div class="ppt-dialog-panel" role="dialog" aria-modal="true"><div class="ppt-dialog-head"><div id="ppt-dialog-title" class="ppt-dialog-title"></div><button id="ppt-dialog-close" class="ppt-ui-btn" type="button">关闭</button></div><div id="ppt-dialog-body" class="ppt-dialog-body"></div></div></div>
    </div>`);
    document.getElementById('ppt-reopen').onclick=reopenAudience;
    document.getElementById('ppt-exit').onclick=exitPresenter;
    document.getElementById('ppt-preflight').onclick=openPreflight;
    document.getElementById('ppt-settings').onclick=openSettings;
    document.getElementById('ppt-first').onclick=()=>go(0,{force:true});
    document.getElementById('ppt-prev').onclick=()=>go(idx-1,{force:true});
    document.getElementById('ppt-grid').onclick=()=>togglePresenterOverview();
    document.getElementById('ppt-overview-close').onclick=()=>togglePresenterOverview(false);
    document.getElementById('ppt-next').onclick=()=>go(idx+1,{force:true});
    document.getElementById('ppt-last').onclick=()=>go(idx===total-1?0:total-1,{force:true});
    document.getElementById('ppt-timer-toggle').onclick=toggleTimer;
    document.getElementById('ppt-timer-reset').onclick=resetTimer;
    document.getElementById('ppt-rehearsal').onclick=toggleRehearsal;
    document.getElementById('ppt-auto-toggle').onclick=toggleAutoAdvance;
    document.getElementById('ppt-note-smaller').onclick=()=>setNoteSize(noteSize-1);
    document.getElementById('ppt-note-larger').onclick=()=>setNoteSize(noteSize+1);
    document.getElementById('ppt-note-editor').addEventListener('input',saveNote);
    document.querySelectorAll('[data-ppt-tool]').forEach(button=>button.onclick=()=>setAnnotationTool(button.dataset.pptTool));
    document.getElementById('ppt-ink-clear').onclick=()=>clearAnnotations(true);
    const ink=document.getElementById('ppt-presenter-ink');
    ink.addEventListener('pointerdown',onAnnotationPointerDown);ink.addEventListener('pointermove',onAnnotationPointerMove);ink.addEventListener('pointerup',onAnnotationPointerUp);ink.addEventListener('pointercancel',onAnnotationPointerUp);ink.addEventListener('pointerleave',onAnnotationPointerLeave);
    document.getElementById('ppt-dialog-close').onclick=closeDialog;
    document.getElementById('ppt-dialog').onclick=event=>{if(event.target.id==='ppt-dialog')closeDialog();};
    if('ResizeObserver'in window){presenterFrameObserver=new ResizeObserver(()=>requestAnimationFrame(fitPresenterFrames));presenterFrameObserver.observe(document.querySelector('.ppt-preview-stack'));}
    else addEventListener('resize',fitPresenterFrames);
    setNoteSize(noteSize,false);applyLayout(layoutMode,false);requestAnimationFrame(fitPresenterFrames);
  }
  function updateShell(){
    if(mode!=='presenter')return;mountShell();
    const n=noteAt(idx),next=Math.min(idx+1,total-1),id=slideId(idx),editor=document.getElementById('ppt-note-editor');
    const currentFrame=document.getElementById('ppt-current-frame'),nextFrame=document.getElementById('ppt-next-frame');
    if(currentFrame.dataset.slide!==String(idx))updatePreviewFrame(currentFrame,idx);
    if(nextFrame.dataset.slide!==String(next))updatePreviewFrame(nextFrame,next);
    document.getElementById('ppt-next-card').classList.toggle('is-end',idx===total-1);
    document.getElementById('ppt-current-label').textContent=`${idx+1} / ${total}`;
    document.getElementById('ppt-next-label').textContent=idx===total-1?'已到尾页':`${next+1} / ${total}`;
    document.getElementById('ppt-notes-title').textContent=n.title||`第 ${idx+1} 页`;
    document.getElementById('ppt-notes-purpose').textContent=n.purpose||'—';
    const target=plannedMsAt(idx);document.getElementById('ppt-note-meta').textContent=`建议 ${target?(target/60000).toFixed(1):'—'} 分钟 · ${id}`;
    document.getElementById('ppt-page-count').textContent=`第 ${idx+1} / ${total} 页`;
    document.getElementById('ppt-page-percent').textContent=`${Math.round(((idx+1)/total)*100)}%`;
    document.getElementById('ppt-first').disabled=idx===0;document.getElementById('ppt-prev').disabled=idx===0;document.getElementById('ppt-next').disabled=idx===total-1;
    document.getElementById('ppt-last').textContent=idx===total-1?'重新开始':'尾页';
    if(renderedNoteId!==id){renderedNoteId=id;editor.value=loadNoteValue(id,idx,n);editor.scrollTop=0;document.getElementById('ppt-saved').textContent='已保存';}
    if(presenterOverviewOn)buildPresenterOverview();requestAnimationFrame(fitPresenterFrames);renderTimer();updateSyncStatus();
  }
  function saveNote(){
    const saved=document.getElementById('ppt-saved');saved.textContent='保存中…';saved.classList.remove('ppt-saved');clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{localStorage.setItem(noteStorageKey(renderedNoteId),document.getElementById('ppt-note-editor').value);saved.textContent='已保存';saved.classList.add('ppt-saved');},300);
  }
  function setNoteSize(value,persist=true){noteSize=Math.max(14,Math.min(26,value));document.documentElement.style.setProperty('--ppt-note-size',`${noteSize}px`);if(persist)localStorage.setItem('guizang-ppt-note-size',String(noteSize));}
  function currentElapsed(){return elapsed+(timerRunning?Date.now()-timerStartedAt:0);}
  function currentSlideElapsed(i=idx){return slideElapsed[i]+(timerRunning&&timedSlideIndex===i?Date.now()-slideTimerStartedAt:0);}
  function commitRunningTime(now=Date.now()){
    if(!timerRunning)return;elapsed+=now-timerStartedAt;slideElapsed[timedSlideIndex]+=now-slideTimerStartedAt;timerStartedAt=now;slideTimerStartedAt=now;
  }
  function rollSlideTimer(nextIndex){if(timerRunning)commitRunningTime();timedSlideIndex=nextIndex;slideTimerStartedAt=Date.now();}
  function renderTimer(){
    const totalUsed=currentElapsed(),pageUsed=currentSlideElapsed(),target=plannedMsAt(idx),clock=document.getElementById('ppt-clock');
    if(clock)clock.textContent=durationText(totalUsed);
    const slideClock=document.getElementById('ppt-slide-clock'),slidePlan=document.getElementById('ppt-slide-plan'),statusBox=document.getElementById('ppt-slide-status-box'),statusLabel=document.getElementById('ppt-slide-status-label'),statusValue=document.getElementById('ppt-slide-status'),statusHint=document.getElementById('ppt-slide-status-hint');
    if(slideClock)slideClock.textContent=durationText(pageUsed);if(slidePlan)slidePlan.textContent=target?`计划 ${durationText(target)}`:'计划 —';
    if(statusBox&&statusLabel&&statusValue&&statusHint){
      const over=Boolean(target&&pageUsed>target),remaining=Boolean(target&&!over);statusBox.classList.toggle('is-over',over);statusBox.classList.toggle('is-remaining',remaining);
      statusLabel.textContent=over?'超时':(remaining?'剩余':'计划');statusValue.textContent=target?durationText(Math.abs(target-pageUsed)):'—';statusHint.textContent=over?'已超出本页计划':(remaining?'距本页计划':'未设置');
    }
    const totalPlan=totalPlannedMs(),plan=document.getElementById('ppt-plan');
    if(plan)plan.textContent=totalPlan?`计划 ${Number(totalPlan/60000).toFixed(1)} 分钟 · 预计 ${clockTime(Date.now()+Math.max(0,totalPlan-totalUsed))}`:'计划 —';
    const section=sectionInfo(idx),sectionEl=document.getElementById('ppt-section');
    if(sectionEl){sectionEl.hidden=!section;sectionEl.textContent=section?`${section.name} · ${section.position}/${section.count}${section.planned?` · 剩余 ${durationText(Math.max(0,section.planned-section.used))}`:''}`:'';}
    const timerButton=document.getElementById('ppt-timer-toggle');if(timerButton)timerButton.textContent=timerRunning?'暂停':(totalUsed?'继续计时':'开始计时');
    const rehearsalButton=document.getElementById('ppt-rehearsal');if(rehearsalButton){rehearsalButton.textContent=rehearsalActive?'结束排练':'排练';rehearsalButton.classList.toggle('ppt-rehearsal-on',rehearsalActive);}
    renderAutoState();
  }
  function toggleTimer(){const now=Date.now();if(timerRunning){commitRunningTime(now);timerRunning=false;}else{timerStartedAt=now;slideTimerStartedAt=now;timedSlideIndex=idx;timerRunning=true;}renderTimer();}
  function resetTimer(){
    elapsed=0;slideElapsed=Array(total).fill(0);timedSlideIndex=idx;
    if(timerRunning){timerStartedAt=Date.now();slideTimerStartedAt=timerStartedAt;}else{timerStartedAt=0;slideTimerStartedAt=0;}
    renderTimer();
  }
  function rehearsalHistory(){try{return JSON.parse(localStorage.getItem(storageKey('rehearsals'))||'[]');}catch(e){return[];}}
  function toggleRehearsal(){
    if(rehearsalActive){finishRehearsal(true);return;}
    rehearsalActive=true;if(timerRunning){commitRunningTime();timerRunning=false;}resetTimer();toggleTimer();renderTimer();
  }
  function finishRehearsal(showSummary){
    if(!rehearsalActive)return;if(timerRunning){commitRunningTime();timerRunning=false;}
    const result={endedAt:Date.now(),totalMs:elapsed,slides:slideElapsed.map((ms,i)=>({index:i,id:slideId(i),title:noteAt(i).title||slideId(i),ms,targetMs:plannedMsAt(i)}))};
    const history=rehearsalHistory();history.unshift(result);try{localStorage.setItem(storageKey('rehearsals'),JSON.stringify(history.slice(0,5)));}catch(e){}
    rehearsalActive=false;renderTimer();if(showSummary)openRehearsalSummary(result,history.slice(0,5));
  }
  function openRehearsalSummary(result,history){
    const rows=result.slides.filter(item=>item.ms>0).map(item=>`<tr><td>${item.index+1}</td><td>${escapeHTML(item.title)}</td><td>${durationText(item.ms)}</td><td>${item.targetMs?signedDuration(item.ms-item.targetMs):'—'}</td></tr>`).join('');
    const recent=history.map(item=>`<div class="ppt-dialog-row"><span>${new Date(item.endedAt).toLocaleString()}</span><strong>${durationText(item.totalMs)}</strong></div>`).join('');
    openDialog('排练记录',`<div class="ppt-dialog-section"><div class="ppt-dialog-row"><span>本次总时长</span><strong>${durationText(result.totalMs)}</strong></div><table class="ppt-summary"><thead><tr><th>#</th><th>页面</th><th>实际</th><th>与计划相比</th></tr></thead><tbody>${rows||'<tr><td colspan="4">没有记录到页面时间</td></tr>'}</tbody></table></div><div class="ppt-dialog-section"><h3>最近排练</h3>${recent}</div>`);
  }

  function autoDurationMs(i=idx){const explicit=Number(noteAt(i).autoAdvanceSeconds);const seconds=Number.isFinite(explicit)&&explicit>0?explicit:autoGlobalSeconds;return seconds>0?seconds*1000:null;}
  function armAutoAdvance(){autoDeadline=0;autoRemainingMs=autoDurationMs()||0;}
  function autoBlockedReason(){
    if(presenterOverviewOn||overviewOn)return'宫格选页中';if(annotationTool!=='none')return'标注中';if(screenMode!=='normal')return'观众屏已暂停';if(document.hidden)return'窗口不可见';
    const dialog=document.getElementById('ppt-dialog');if(dialog&&!dialog.hidden)return'设置中';
    if(audienceOpenedAt&&syncState()!=='synced')return'等待观众屏同步';return'';
  }
  function updateAutoAdvance(){
    if(!autoEnabled)return;
    const duration=autoDurationMs();if(!duration||idx===total-1)return;
    const blocked=autoBlockedReason(),now=Date.now();
    if(blocked){if(autoDeadline){autoRemainingMs=Math.max(0,autoDeadline-now);autoDeadline=0;}return;}
    if(!autoDeadline)autoDeadline=now+(autoRemainingMs||duration);
    autoRemainingMs=Math.max(0,autoDeadline-now);
    if(now>=autoDeadline){autoDeadline=0;autoRemainingMs=0;go(idx+1,{force:true});}
  }
  function renderAutoState(){
    const button=document.getElementById('ppt-auto-toggle');if(!button)return;
    const duration=autoDurationMs(),blocked=autoEnabled?autoBlockedReason():'';
    button.classList.toggle('is-on',autoEnabled&&!blocked);button.classList.toggle('is-paused',autoEnabled&&Boolean(blocked));
    if(!autoEnabled)button.textContent='自动翻页 · 关闭';
    else if(!duration)button.textContent='自动翻页 · 等待时长';
    else if(idx===total-1)button.textContent='自动翻页 · 已结束';
    else if(blocked)button.textContent=`自动翻页 · ${blocked}`;
    else button.textContent=`自动翻页 · ${durationText(autoRemainingMs||duration)}`;
  }
  function toggleAutoAdvance(){
    if(!autoEnabled&&!autoDurationMs()){openSettings();return;}
    autoEnabled=!autoEnabled;localStorage.setItem(storageKey('auto-enabled'),autoEnabled?'1':'0');armAutoAdvance();renderAutoState();
  }

  function openDialog(title,html){
    const dialog=document.getElementById('ppt-dialog');if(!dialog)return;
    document.getElementById('ppt-dialog-title').textContent=title;document.getElementById('ppt-dialog-body').innerHTML=html;dialog.hidden=false;renderAutoState();
  }
  function closeDialog(){const dialog=document.getElementById('ppt-dialog');if(dialog)dialog.hidden=true;renderAutoState();}
  function applyLayout(value,persist=true){
    layoutMode=['balanced','slides','notes'].includes(value)?value:'balanced';
    document.getElementById('ppt-presenter')?.setAttribute('data-layout',layoutMode);
    if(persist)localStorage.setItem(storageKey('layout'),layoutMode);requestAnimationFrame(fitPresenterFrames);
  }
  function applyAudienceScreen(value){
    const cover=document.getElementById('ppt-audience-cover');if(!cover)return;
    cover.classList.remove('is-ended');cover.textContent='';
    if(value==='black'||value==='white'){cover.style.display='block';cover.style.background=value;}else cover.style.display='none';
  }
  function showAudienceEnded(){
    const cover=document.getElementById('ppt-audience-cover');if(cover){cover.style.display='';cover.style.background='';cover.textContent='演示已结束';cover.classList.add('is-ended');}
    setTimeout(()=>{try{window.close();}catch(e){}},120);
  }
  function setScreenMode(value){
    const next=['normal','black','white','frozen'].includes(value)?value:'normal',wasFrozen=audienceFrozen;
    screenMode=next;audienceFrozen=next==='frozen';emit({type:'screen',mode:next});
    if(wasFrozen&&!audienceFrozen)sendGoto(true);updateSyncStatus();armAutoAdvance();renderAutoState();
  }
  function openSettings(){
    openDialog('演示设置',`<div class="ppt-settings-card"><label class="ppt-switch-row" for="ppt-auto-enabled-setting"><span><strong>自动翻页</strong><br><span class="ppt-muted">需要时手动开启，默认关闭</span></span><input id="ppt-auto-enabled-setting" type="checkbox" ${autoEnabled?'checked':''}><span class="ppt-switch" aria-hidden="true"></span></label><div class="ppt-field"><label for="ppt-auto-seconds-setting">全局间隔</label><div class="ppt-stepper"><button id="ppt-auto-minus" type="button" aria-label="减少一秒">−</button><input id="ppt-auto-seconds-setting" type="number" min="1" step="1" value="${autoGlobalSeconds||''}" placeholder="—"><span class="ppt-stepper-unit">秒</span><button id="ppt-auto-plus" type="button" aria-label="增加一秒">+</button></div></div><button id="ppt-settings-save" class="ppt-ui-btn ppt-settings-save" type="button">保存自动翻页</button><p class="ppt-settings-copy">单页 autoAdvanceSeconds 优先于全局间隔；minutes 只是讲述计划。</p></div><div class="ppt-settings-card"><h3>演讲者布局</h3><p class="ppt-settings-copy">根据屏幕宽度调整页面与备注的比例</p><div class="ppt-segmented"><button class="ppt-ui-btn" data-layout-choice="balanced" type="button">均衡</button><button class="ppt-ui-btn" data-layout-choice="slides" type="button">页面优先</button><button class="ppt-ui-btn" data-layout-choice="notes" type="button">备注优先</button></div></div><div class="ppt-settings-card"><h3>观众屏</h3><p class="ppt-settings-copy">临时遮挡或冻结观众屏</p><div class="ppt-segmented screen"><button class="ppt-ui-btn" data-screen-choice="normal" type="button">正常</button><button class="ppt-ui-btn" data-screen-choice="black" type="button">黑屏 B</button><button class="ppt-ui-btn" data-screen-choice="white" type="button">白屏 W</button><button class="ppt-ui-btn" data-screen-choice="frozen" type="button">冻结 F</button></div></div><div class="ppt-dialog-section"><button id="ppt-open-shortcuts" class="ppt-ui-btn" type="button">查看快捷键</button></div>`);
    document.querySelectorAll('[data-layout-choice]').forEach(button=>{button.classList.toggle('ppt-primary',button.dataset.layoutChoice===layoutMode);button.onclick=()=>{applyLayout(button.dataset.layoutChoice);openSettings();};});
    document.querySelectorAll('[data-screen-choice]').forEach(button=>{button.classList.toggle('ppt-primary',button.dataset.screenChoice===screenMode);button.onclick=()=>{setScreenMode(button.dataset.screenChoice);openSettings();};});
    const secondsInput=document.getElementById('ppt-auto-seconds-setting'),stepSeconds=delta=>{const current=Math.max(0,Number(secondsInput.value||0));secondsInput.value=String(Math.max(1,current+delta));};
    document.getElementById('ppt-auto-minus').onclick=()=>stepSeconds(-1);document.getElementById('ppt-auto-plus').onclick=()=>stepSeconds(1);
    document.getElementById('ppt-settings-save').onclick=()=>{autoEnabled=document.getElementById('ppt-auto-enabled-setting').checked;autoGlobalSeconds=Math.max(0,Number(secondsInput.value||0));localStorage.setItem(storageKey('auto-enabled'),autoEnabled?'1':'0');localStorage.setItem(storageKey('auto-seconds'),String(autoGlobalSeconds));armAutoAdvance();closeDialog();};
    document.getElementById('ppt-open-shortcuts').onclick=openShortcuts;
  }
  function openShortcuts(){
    const items=[['← / →','上一页 / 下一页'],['Home / End','首页 / 尾页'],['Esc','宫格选页；标注工具激活时先退出工具'],['L','激光笔'],['C','圈选'],['X','清除标记'],['B / W','观众屏黑屏 / 白屏'],['F','冻结 / 恢复观众屏'],['A','开启 / 关闭自动翻页'],['R','开始 / 结束排练'],['?','快捷键说明']];
    openDialog('快捷键',`<div class="ppt-shortcuts">${items.map(([key,label])=>`<kbd>${key}</kbd><span>${label}</span>`).join('')}</div>`);
  }
  function preflightChecks(){
    const images=[...document.images],videos=[...document.querySelectorAll('video')],frame=document.getElementById('ppt-current-frame'),rect=frame?.getBoundingClientRect();
    return[
      {label:'观众屏连接',ok:['synced','frozen'].includes(syncState()),detail:`当前状态：${document.getElementById('ppt-sync')?.textContent||'未连接'}`},
      {label:'弹窗权限',ok:!popupBlocked,detail:popupBlocked?'浏览器阻止了观众窗口':'未检测到弹窗拦截'},
      {label:'全屏状态',ok:Boolean(document.fullscreenElement),warn:true,detail:document.fullscreenElement?'已进入全屏':'尚未全屏，可在演讲前进入'},
      {label:'字体加载',ok:!document.fonts||document.fonts.status==='loaded',detail:document.fonts?`状态：${document.fonts.status}`:'浏览器不提供字体状态'},
      {label:'图片资源',ok:images.every(image=>image.complete&&image.naturalWidth>0),detail:`${images.filter(image=>image.complete&&image.naturalWidth>0).length} / ${images.length} 已加载`},
      {label:'视频资源',ok:videos.every(video=>video.readyState>=2),detail:videos.length?`${videos.filter(video=>video.readyState>=2).length} / ${videos.length} 可播放`:'没有视频'},
      {label:'当前页 16:9',ok:Boolean(rect&&Math.abs(rect.width/rect.height-16/9)<.003),detail:rect?`${Math.round(rect.width)} × ${Math.round(rect.height)}`:'尚未渲染'}
    ];
  }
  function openPreflight(){
    const checks=preflightChecks(),html=checks.map(item=>`<div class="ppt-dialog-row"><div class="ppt-check ${item.ok?'is-ok':(item.warn?'is-warn':'')}"><span class="ppt-check-dot"></span><span><strong>${item.label}</strong><br><span class="ppt-muted">${item.detail}</span></span></div><strong>${item.ok?'正常':(item.warn?'建议':'异常')}</strong></div>`).join('');
    openDialog('演前检查',`<div class="ppt-dialog-section">${html}</div><div class="ppt-dialog-section"><button id="ppt-preflight-refresh" class="ppt-ui-btn" type="button">重新检查</button> <button id="ppt-enter-fullscreen" class="ppt-ui-btn" type="button">进入全屏</button></div><p class="ppt-muted">这里只能检查浏览器和观众页面的软件状态，不能确认 HDMI、转接器或投影仪线缆是否物理连接。</p>`);
    document.getElementById('ppt-preflight-refresh').onclick=openPreflight;
    document.getElementById('ppt-enter-fullscreen').onclick=async()=>{try{await document.documentElement.requestFullscreen();}catch(e){}openPreflight();};
  }

  function initTransport(){
    if(transportReady)return;transportReady=true;
    if('BroadcastChannel'in window){try{channel=new BroadcastChannel(channelName());channel.onmessage=e=>receive(e.data);}catch(e){}}
    addEventListener('message',e=>receive(e.data));
    addEventListener('storage',e=>{if(e.key===syncKey()&&e.newValue){try{receive(JSON.parse(e.newValue));}catch(err){}}});
  }
  function emit(payload,{persist=true}={}){
    const message={__guizangPptSync:1,session,role:mode,...payload,at:Date.now(),nonce:Math.random().toString(36).slice(2)};
    try{channel?.postMessage(message);}catch(e){}
    if(persist)try{localStorage.setItem(syncKey(),JSON.stringify(message));}catch(e){}
    try{if(mode==='presenter'&&audienceWindow&&!audienceWindow.closed)audienceWindow.postMessage(message,'*');}catch(e){}
    try{if(mode==='audience'&&window.opener&&!window.opener.closed)window.opener.postMessage(message,'*');}catch(e){}
  }
  function receive(message){
    if(!message||message.__guizangPptSync!==1||message.session!==session||message.role===mode)return;
    if(message.nonce){if(seenNonceSet.has(message.nonce))return;seenNonceSet.add(message.nonce);seenNonces.push(message.nonce);if(seenNonces.length>256)seenNonceSet.delete(seenNonces.shift());}
    if(mode==='presenter'){
      if(message.type==='ready'){popupBlocked=false;sendGoto(true);}
      if(message.type==='ack'){lastAckAt=Date.now();lastAckIndex=Number(message.index);lastAckSeq=Number(message.seq);updateSyncStatus();}
      return;
    }
    if(mode!=='audience')return;
    if(message.type==='bye'){showAudienceEnded();return;}
    if(message.type==='screen'){applyAudienceScreen(message.mode);return;}
    if(message.type==='laser'&&Number(message.index)===idx){audienceLaser=message.point||null;audienceLaserHideAt=Date.now()+650;renderInks();return;}
    if(message.type==='circle'&&Number(message.index)===idx&&message.circle){audienceCircles.push(message.circle);renderInks();return;}
    if(message.type==='clear'&&Number(message.index)===idx){audienceCircles=[];renderInks();return;}
    if(message.type==='goto'||message.type==='ping'){
      if(message.type==='goto'){audienceCircles=Array.isArray(message.circles)?message.circles:[];applyAudienceScreen(message.screenMode);go(Number(message.index),{force:true});}
      emit({type:'ack',index:idx,seq:Number(message.seq)});
    }
  }
  function receivePreview(message){
    if(!message||message.__guizangPptSync!==1||message.session!==session||message.role!=='presenter'||message.type!=='preview-goto')return;
    go(Number(message.index),{force:true});
  }
  function sendGoto(force=false){
    if(mode!=='presenter'||audienceFrozen)return;if(force||lastAckIndex!==idx)seq++;
    emit({type:'goto',index:idx,seq,screenMode,circles});updateSyncStatus();
  }
  function syncState(){
    if(popupBlocked)return'blocked';if(audienceWindow&&audienceWindow.closed)return'disconnected';if(audienceFrozen)return'frozen';
    if(!lastAckAt)return audienceOpenedAt&&Date.now()-audienceOpenedAt<2600?'connecting':'disconnected';
    if(Date.now()-lastAckAt>2600)return'disconnected';if(lastAckIndex!==idx||lastAckSeq<seq)return'unsynced';return'synced';
  }
  function updateSyncStatus(){
    const el=document.getElementById('ppt-sync');if(!el)return;const state=syncState();
    const labels={blocked:'弹窗被拦截',disconnected:'未连接',connecting:'连接中',unsynced:'未同步',frozen:'已冻结',synced:`已同步 · 第 ${idx+1} 页`};
    el.dataset.state=state;el.textContent=`观众屏 · ${labels[state]}`;
  }
  function reopenAudience(){
    initTransport();popupBlocked=false;audienceOpenedAt=Date.now();lastAckAt=0;lastAckIndex=-1;lastAckSeq=-1;
    if(audienceFrozen){audienceFrozen=false;screenMode='normal';}
    audienceWindow=window.open(frameUrl('audience',idx),`guizang-ppt-audience-${session}`,'popup=yes,width=1440,height=900');
    if(!audienceWindow)popupBlocked=true;updateSyncStatus();
  }
  function enterPresenter(openAudience=true){
    if(mode==='presenter')return;if(overviewOn)toggleOverview();lowPowerBeforePresenter=window.__lowPowerMode;mode='presenter';initTransport();mountShell();
    document.body.classList.remove('ppt-audience','ppt-preview');document.body.classList.add('ppt-presenter');document.title=`演讲者视图 · ${originalTitle}`;
    window.__setLowPowerMode?.(true,{persist:false});updateShell();armAutoAdvance();if(openAudience)reopenAudience();
  }
  function exitPresenter(){
    if(rehearsalActive)finishRehearsal(false);else if(timerRunning){commitRunningTime();timerRunning=false;}togglePresenterOverview(false);emit({type:'bye'});audienceWindow=null;audienceOpenedAt=0;lastAckAt=0;lastAckIndex=-1;lastAckSeq=-1;mode='deck';document.body.classList.remove('ppt-presenter');document.title=originalTitle;window.__setLowPowerMode?.(lowPowerBeforePresenter,{persist:false});
  }
  function initAudience(){
    mode='audience';document.body.classList.add('ppt-audience');document.title=`观众屏 · ${originalTitle}`;
    document.body.insertAdjacentHTML('beforeend','<canvas id="ppt-audience-ink" aria-hidden="true"></canvas><div id="ppt-audience-cover" aria-hidden="true"></div>');
    const resize=()=>{sizeInk(document.getElementById('ppt-audience-ink'),innerWidth,innerHeight);renderInks();};addEventListener('resize',resize);resize();
    initTransport();emit({type:'ready',index:idx});
  }
  function initPreview(){mode='preview';document.body.classList.add('ppt-preview');window.__setLowPowerMode?.(true,{persist:false});addEventListener('message',e=>{if(e.source===parent)receivePreview(e.data);});}
  function onSlideChange(nextIndex){
    if(mode!=='presenter')return;rollSlideTimer(nextIndex);circles=[];draftCircle=null;laserPoint=null;annotationPointerDown=false;armAutoAdvance();updateShell();sendGoto();
  }
  function handleKey(e){
    const editable=e.target?.matches?.('input,textarea,[contenteditable="true"]');
    if(editable){if(e.key==='Escape')e.target.blur();return true;}
    if(mode==='audience'||mode==='preview'){e.preventDefault();return true;}
    if(mode==='deck'&&e.key?.toLowerCase()==='p'&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();enterPresenter(true);return true;}
    if(mode!=='presenter')return false;
    const key=e.key?.toLowerCase();
    const dialog=document.getElementById('ppt-dialog');
    if(!dialog?.hidden){if(e.key==='Escape'){e.preventDefault();closeDialog();}return true;}
    if(e.key==='?'||key==='/'){e.preventDefault();openShortcuts();return true;}
    if(e.key==='Escape'){e.preventDefault();if(annotationTool!=='none')setAnnotationTool('none');else togglePresenterOverview();return true;}
    if(presenterOverviewOn)return true;
    if(key==='l'){e.preventDefault();setAnnotationTool('laser');return true;}
    if(key==='c'){e.preventDefault();setAnnotationTool('circle');return true;}
    if(key==='x'){e.preventDefault();clearAnnotations(true);return true;}
    if(key==='b'){e.preventDefault();setScreenMode(screenMode==='black'?'normal':'black');return true;}
    if(key==='w'){e.preventDefault();setScreenMode(screenMode==='white'?'normal':'white');return true;}
    if(key==='f'){e.preventDefault();setScreenMode(audienceFrozen?'normal':'frozen');return true;}
    if(key==='a'){e.preventDefault();toggleAutoAdvance();return true;}
    if(key==='r'){e.preventDefault();toggleRehearsal();return true;}
    if(['ArrowRight','PageDown',' ','ArrowDown'].includes(e.key)){e.preventDefault();go(idx+1,{force:true});return true;}
    if(['ArrowLeft','PageUp','ArrowUp'].includes(e.key)){e.preventDefault();go(idx-1,{force:true});return true;}
    if(e.key==='Home'){e.preventDefault();go(0,{force:true});return true;}
    if(e.key==='End'){e.preventDefault();go(total-1,{force:true});return true;}
    return false;
  }
  function initMode(){
    document.getElementById('ppt-low-power-btn')?.addEventListener('click',()=>window.__setLowPowerMode(!window.__lowPowerMode));
    document.getElementById('ppt-overview-btn')?.addEventListener('click',toggleOverview);
    document.getElementById('ppt-presenter-btn')?.addEventListener('click',()=>enterPresenter(true));
    if(requestedMode==='audience')initAudience();else if(requestedMode==='preview')initPreview();else if(requestedMode==='presenter')enterPresenter(false);
  }
  setInterval(()=>{
    renderTimer();renderInks();updateAutoAdvance();
    if(mode==='presenter'&&Date.now()-lastPingAt>900){lastPingAt=Date.now();if(audienceWindow?.closed)updateSyncStatus();emit({type:'ping',index:idx,seq});updateSyncStatus();}
  },250);
  return{initMode,onSlideChange,handleKey,slideLabel,enterPresenter,reopenAudience,toggleOverview:togglePresenterOverview,debugState:()=>({mode,idx,session,syncState:syncState(),timerRunning,rehearsalActive,presenterOverviewOn,autoEnabled,autoGlobalSeconds,autoRemainingMs,screenMode,annotationTool,circles:[...circles],audienceCircles:[...audienceCircles],layoutMode})};
})();
/* =============== /演讲者模式 / 观众屏同步 =============== */
