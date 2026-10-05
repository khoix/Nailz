import { Duel, axisPosition, reticleRadius, DUEL_TIMING } from '../game/duel.ts';
import type { Difficulty, GameMode } from '../game/types.ts';
import { measureSwipe, type GesturePoint } from '../input/swipe.ts';
import type { GameAudio } from '../audio/controller.ts';
import type { NailzScene } from '../scene/createScene.ts';
export function mountDuel(scene: NailzScene, audio:GameAudio): () => void {
  const app = document.querySelector<HTMLElement>('#app')!;
  const shell = document.createElement('div'); shell.className = 'duel-ui';
  shell.innerHTML = `<header class="duel-header"><a class="wordmark" aria-label="Nailz">NAILZ<span>!</span></a><span class="duel-format">FIVE NAILS. ONE WINNER.</span><button id="sound" aria-label="Mute sound" title="Mute sound" aria-pressed="false">
    <svg class="sound-icon sound-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.1a5 5 0 0 1 0 7.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18.9 5.7a8.4 8.4 0 0 1 0 12.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    <svg class="sound-icon sound-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="m16 9 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
   </button><button id="pause" aria-label="Pause duel">Ⅱ</button></header>
    <div class="turn-badge"><span class="turn-dot"></span><span id="whose-turn">YOU vs OPERATOR</span><span id="strike-count"></span></div>
    <div id="match-score" class="match-score" aria-live="polite"></div><div class="depth-meter"><label for="depth">NAIL DEPTH <span id="depth-value"></span></label><progress id="depth" max="100" value="16"></progress></div><svg id="aim-overlay" viewBox="-3 -3 6 6" aria-hidden="true"><line class="guide" x1="-3" y1="0" x2="3" y2="0"/><line class="guide" x1="0" y1="-3" x2="0" y2="3"/><circle class="goal" r=".34"/><line id="line-y" class="aim-line" x1="-3" x2="3"/><line id="line-x" class="aim-line" y1="-3" y2="3"/><circle id="hit-dot" r=".065"/><circle id="local-goal" class="goal" r=".34"/><circle id="focus-ring" class="focus-ring"/></svg>
    <section class="duel-prompt"><span id="step-label"></span><h2 id="instruction"></h2><p id="hint"></p><div class="step-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div></section>
    <section id="duel-card" class="duel-card"><span class="eyebrow">STEP RIGHT UP</span><h2>Make the<br>last hit yours.</h2><p>Line it up. Find your focus.<br>Swipe down and drive it home.</p><div id="mode-controls"><label for="mode">Game mode</label><select id="mode"><option value="solo">Solo — vs. Operator</option><option value="pass-and-play">2 Players — Pass & Play</option></select><div id="name-controls" class="name-controls" hidden><label for="name-p1">Player 1 name <small>(optional)</small></label><input id="name-p1" type="text" maxlength="12" autocomplete="off" placeholder="Player 1"><label for="name-p2">Player 2 name <small>(optional)</small></label><input id="name-p2" type="text" maxlength="12" autocomplete="off" placeholder="Player 2"></div><label id="difficulty-label" for="difficulty">Operator difficulty</label><select id="difficulty"><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Hard</option><option value="champion">Champion</option></select></div><button id="begin" class="play-button">Start match <span>↗</span></button><button id="choose-mode" class="quiet-button" hidden>Change mode</button></section>
    <section id="handoff-card" class="duel-card" hidden><span class="eyebrow">PASS & PLAY</span><h2 id="handoff-title"></h2><p>Keep the phone upright. Take your time.<br>Only the next player should tap below.</p><button id="ready" class="play-button">I’m ready</button><small>Lift every finger before starting your turn.</small></section>
    <section id="pause-card" class="duel-card" hidden><span class="eyebrow">TAKE YOUR TIME</span><h2>Paused.</h2><p>Your aim and timing are saved.</p><fieldset class="audio-settings"><legend>Sound & motion</legend><label>Effects <input id="effects-volume" type="range" min="0" max="1" step=".05"></label><label>Music <input id="music-volume" type="range" min="0" max="1" step=".05"></label><label><input id="haptics-setting" type="checkbox"> Haptics (if supported)</label><label><input id="motion-setting" type="checkbox"> Reduced motion</label></fieldset><button id="resume" class="play-button">Resume match</button><button id="restart" class="quiet-button">Restart match</button></section>
    <div id="result-flash" role="status" aria-live="polite"></div>`;
  app.append(shell);
  const get = <T extends Element = HTMLElement>(id: string) => shell.querySelector<T>('#'+id)!;
  let game = new Duel(Date.now());
  let lastTime = performance.now();
  let raf = 0;
  let previousPhase = '';
  let readyPointer: number | null = null;
  let activePointers = new Set<number>();
  let blocked = false;
  let gesture: { id: number; phase: string; points: GesturePoint[]; height: number } | null = null;
  let lastAnnouncement = -1;
  let restartCount = 0;
  const isAiming = (phase: string) => ['TARGET_Y','TARGET_X','RETICLE'].includes(phase);
  function sync(now = performance.now()) { const dt = Math.max(0, (now-lastTime)/1000); lastTime = now; game.tick(dt); }
  function cancelGesture() { gesture = null; }
  function interruptInput() {
    cancelGesture(); readyPointer=null;
    for (const id of activePointers) if (app.hasPointerCapture(id)) app.releasePointerCapture(id);
    blocked=activePointers.size>0;
  }
  function render(dt: number) {
    const s = game.snapshot;
    audio.observe(s);scene.setReducedMotion(audio.settings.reducedMotion);
    const soundButton=get<HTMLButtonElement>('sound');soundButton.dataset.muted=String(audio.settings.muted);soundButton.setAttribute('aria-pressed',String(audio.settings.muted));soundButton.setAttribute('aria-label',audio.settings.muted?'Unmute sound':'Mute sound');soundButton.title=audio.settings.muted?'Unmute sound':'Mute sound';app.dataset.audio=audio.state;
    scene.present(s, s.paused || s.resumeIn > 0 ? 0 : dt);
    app.dataset.phase = s.phase; app.dataset.actor = s.actor;
    const active = !['MATCH_INTRO','ROUND_RESULT','MATCH_RESULT'].includes(s.phase);
    const name = (id: string) => s.participants.find(p=>p.id===id)!.name;
    get<HTMLButtonElement>('pause').hidden = !active || s.paused;
    get('pause-card').toggleAttribute('hidden', !s.paused);
    get('whose-turn').textContent = active ? `${name(s.actor).toUpperCase()}’S TURN` : s.mode === 'solo' ? 'PLAYER vs OPERATOR' : 'PLAYER 1 vs PLAYER 2';
    get('strike-count').textContent = `NAIL ${s.round}/5`;
    get<HTMLProgressElement>('depth').value=s.nail.depth/s.nail.length*100;get('depth-value').textContent=`${Math.round(s.nail.depth/s.nail.length*100)}%`;
    get('match-score').textContent = `${name('p1')}  ${s.nailsWon.p1} — ${s.nailsWon.p2}  ${name('p2')}  ·  ${s.points.p1} / ${s.points.p2} pts`;
    get('duel-card').toggleAttribute('hidden', active);
    get('mode-controls').toggleAttribute('hidden', s.phase !== 'MATCH_INTRO');
    get('choose-mode').toggleAttribute('hidden', s.phase !== 'MATCH_RESULT');
    get('handoff-card').toggleAttribute('hidden', s.phase !== 'TURN_HANDOFF' || s.paused);
    get<HTMLButtonElement>('ready').disabled = s.resumeIn > 0;
    if (s.phase === 'TURN_HANDOFF') get('handoff-title').textContent = s.previousHuman === s.actor ? `${name(s.actor)} — Next nail` : s.previousHuman ? `Pass to ${name(s.actor)}` : `${name(s.actor)} starts`;
    if (previousPhase !== s.phase) {
      const card=get('duel-card');
      if (s.phase === 'MATCH_INTRO') {
        card.querySelector('h2')!.textContent='Make the last hit yours.';
        card.querySelector('p')!.textContent='Five shared nails. The finishing striker wins each nail.';
        get('begin').textContent='Start match ↗';
      } else if (s.phase === 'ROUND_RESULT') {
        card.querySelector('h2')!.textContent=`${name(s.nail.winner!)} nailed it!`;
        card.querySelector('p')!.textContent=`Nail ${s.round} of 5 · ${s.nail.strikeCount} strikes. Every nail counts.`;
        get('begin').textContent=s.round===5?'Match results ↗':'Next nail ↗';
      } else if (s.phase === 'MATCH_RESULT') {
        card.querySelector('h2')!.textContent=`${name(s.winner!)} wins!`;
        card.querySelector('p')!.textContent=`${s.nailsWon.p1}–${s.nailsWon.p2} nails · ${s.points.p1}–${s.points.p2} performance points. Nails decide the winner.`;
        get('begin').textContent='Rematch ↗';
      }
    }
    let title = '', hint = '', label = '';
    if (s.resumeIn > 0) { title = 'Get ready…'; hint = 'Your turn picks up exactly where you left it.'; }
    else if (s.phase === 'NAIL_SETUP') { title = 'Line it up'; hint = 'Center the two lines on the nail head.'; }
    else if (!s.isHuman && s.phase === 'TARGET_Y') { title = 'Sizing it up…'; hint = 'Watch the operator’s contact point.'; label = 'OPERATOR'; }
    else if (s.phase === 'TARGET_Y') { title = 'Tap to lock height'; hint = 'Stop the moving line on the center guide.'; label = '01 / POSITION'; }
    else if (s.phase === 'TARGET_X') { title = 'Tap to lock the side'; hint = 'Bring the two lines together at the center.'; label = '02 / POSITION'; }
    else if (s.phase === 'RETICLE') { title = 'Tap when the rings match'; hint = 'One pass. Make it count.'; label = '03 / FOCUS'; }
    else if (s.phase === 'READY_TO_SWING') { title = s.elapsed >= DUEL_TIMING.ready ? 'SWIPE DOWN!' : 'Raise the hammer…'; hint = 'A fast, decisive swipe brings the power.'; label = '04 / SWING'; }
    else if (s.phase === 'NAIL_STRAIGHTEN') { title = 'Straightening up'; hint = 'Depth stays. The next striker gets a straight nail.'; }
    else if (s.phase === 'IMPACT_RESOLUTION' || s.phase === 'SWING') { title = s.isHuman ? 'Make it count.' : 'Here comes the operator.'; }
    get('instruction').textContent = title; get('hint').textContent = hint; get('step-label').textContent = label;
    shell.querySelector<HTMLElement>('.duel-prompt')!.hidden = !active || s.paused || s.phase === 'TURN_HANDOFF';
    const steps = ['TARGET_Y','TARGET_X','RETICLE','READY_TO_SWING'];
    shell.querySelectorAll<HTMLElement>('.step-dots i').forEach((dot,i)=>dot.classList.toggle('lit', i <= steps.indexOf(s.phase) && s.isHuman));
    const overlay = get<SVGSVGElement>('aim-overlay');
    const showAim = s.isHuman && isAiming(s.phase) && !s.paused && s.resumeIn === 0;
    overlay.style.display = showAim ? 'block' : 'none';
    if (showAim) {
      const rect = scene.getTargetRect(); const r = rect.radiusPixels;
      overlay.style.left = `${rect.centerX-r*3}px`; overlay.style.top = `${rect.centerY-r*3}px`;
      overlay.style.width = `${r*6}px`; overlay.style.height = `${r*6}px`;
      const y = s.isHuman && s.phase === 'TARGET_Y' ? axisPosition(s.elapsed) : s.aim.y;
      const x = s.isHuman && s.phase === 'TARGET_X' ? axisPosition(s.elapsed) : s.aim.x;
      const ly = get<SVGLineElement>('line-y'); ly.setAttribute('y1',String(-y));ly.setAttribute('y2',String(-y));
      const lx = get<SVGLineElement>('line-x'); lx.setAttribute('x1',String(x));lx.setAttribute('x2',String(x));
      lx.style.opacity = s.phase === 'TARGET_Y' && s.isHuman ? '0' : '1';
      get('hit-dot').setAttribute('cx',String(x));get('hit-dot').setAttribute('cy',String(-y));
      for (const id of ['focus-ring','local-goal']) { const node=get(id);node.setAttribute('cx',String(x));node.setAttribute('cy',String(-y));node.style.display=s.phase==='RETICLE'?'block':'none'; }
      get('focus-ring').setAttribute('r',String(reticleRadius(s.elapsed)*.34));
    }
    if (s.appliedActionId !== lastAnnouncement) {
      lastAnnouncement = s.appliedActionId;
      const r=s.lastResult;
      get('result-flash').textContent = r ? r.oneHit ? 'ONE HIT!' : r.finishing ? 'NAILED IT!' : !r.contact ? 'MISSED!' : Math.hypot(r.bend.x,r.bend.y)>.08 ? 'GLANCING HIT' : r.usablePower<.4 ? 'LIGHT TOUCH' : 'SOLID HIT' : '';
    }
    get('match-score').classList.toggle('score-celebrate',s.phase==='IMPACT_RESOLUTION'&&Boolean(s.lastResult?.finishing)&&!audio.settings.reducedMotion);
    get('result-flash').classList.toggle('visible',s.phase==='IMPACT_RESOLUTION' && !s.paused);
    previousPhase=s.phase;
  }
  function frame(now: number) { const dt=Math.max(0,(now-lastTime)/1000);sync(now);render(dt);raf=requestAnimationFrame(frame); }
  function down(event: PointerEvent) {
    sync();activePointers.add(event.pointerId);
    if (activePointers.size > 1) { blocked=true;cancelGesture();readyPointer=null;return; }
    const s=game.snapshot;
    if ((event.target as HTMLElement).closest('#ready') && !blocked && !s.paused && s.resumeIn===0 && s.phase==='TURN_HANDOFF') readyPointer=event.pointerId;
    if ((event.target as HTMLElement).closest('button,a,select,input,.inspector')) return;
    if (blocked || s.paused || s.resumeIn>0 || !s.isHuman || !(isAiming(s.phase)||s.phase==='READY_TO_SWING')) return;
    if (s.phase==='READY_TO_SWING' && s.elapsed<DUEL_TIMING.ready) return;
    app.setPointerCapture(event.pointerId);
    gesture={id:event.pointerId,phase:s.phase,points:[{x:event.clientX,y:event.clientY,time:event.timeStamp}],height:app.clientHeight};
    event.preventDefault();
  }
  function move(event: PointerEvent) { if(gesture?.id===event.pointerId) gesture.points.push({x:event.clientX,y:event.clientY,time:event.timeStamp}); }
  function up(event: PointerEvent) {
    sync();activePointers.delete(event.pointerId);
    const readyId=readyPointer;readyPointer=null;
    if (readyId===event.pointerId && !blocked && activePointers.size===0 && (event.target as HTMLElement).closest('#ready')) { game.ready();render(0);return; }
    const current=gesture;gesture=null;
    if (app.hasPointerCapture(event.pointerId)) app.releasePointerCapture(event.pointerId);
    if (blocked) { if(!activePointers.size)blocked=false;return; }
    if (!current || current.id!==event.pointerId || game.snapshot.phase!==current.phase) return;
    current.points.push({x:event.clientX,y:event.clientY,time:event.timeStamp});
    if (current.phase==='READY_TO_SWING') { const result=measureSwipe(current.points,current.height);if(result.valid)game.swing(result.power); }
    else { const a=current.points[0]!;if(Math.hypot(event.clientX-a.x,event.clientY-a.y)<24)game.tap(); }
    render(0);
  }
  function cancel(event: PointerEvent) { readyPointer=null;activePointers.delete(event.pointerId);if(gesture?.id===event.pointerId)cancelGesture();if(!activePointers.size)blocked=false; }
  function lostCapture() { cancelGesture();readyPointer=null;blocked=activePointers.size>0; }
  function click(event: MouseEvent) {
    const button=(event.target as HTMLElement).closest('button');if(!button)return;audio.activate();sync();interruptInput();
    if(button.id==='sound')audio.update({muted:!audio.settings.muted});
    if(button.id==='begin') {
      if(game.snapshot.phase==='MATCH_INTRO') { game=new Duel(Date.now()+ ++restartCount,{mode:get<HTMLSelectElement>('mode').value as GameMode,difficulty:get<HTMLSelectElement>('difficulty').value as Difficulty,names:{p1:get<HTMLInputElement>('name-p1').value,p2:get<HTMLInputElement>('name-p2').value}});game.start(); }
      else if(game.snapshot.phase==='ROUND_RESULT')game.advanceRound();
      else if(game.snapshot.phase==='MATCH_RESULT')game.restart(Date.now()+ ++restartCount);
    }
    if(button.id==='choose-mode' && game.snapshot.phase==='MATCH_RESULT') { game=new Duel(Date.now());previousPhase=''; }
    // Keyboard activation is also a fresh action, provided no finger remains on the screen.
    if(button.id==='ready' && event.detail===0 && activePointers.size===0)game.ready();
    if(button.id==='pause')game.pause();
    if(button.id==='resume')game.resume();
    if(button.id==='restart')game.restart(9271 + ++restartCount);
    render(0);
  }
  function selection() { const local=get<HTMLSelectElement>('mode').value==='pass-and-play';get('difficulty').toggleAttribute('hidden',local);get('difficulty-label').toggleAttribute('hidden',local);get('name-controls').toggleAttribute('hidden',!local); }
  get('mode').addEventListener('change',selection);
  get<HTMLInputElement>('effects-volume').value=String(audio.settings.effects);get<HTMLInputElement>('music-volume').value=String(audio.settings.music);
  get<HTMLInputElement>('haptics-setting').checked=audio.settings.haptics;get<HTMLInputElement>('motion-setting').checked=audio.settings.reducedMotion;
  function settingsChanged(){audio.update({effects:Number(get<HTMLInputElement>('effects-volume').value),music:Number(get<HTMLInputElement>('music-volume').value),haptics:get<HTMLInputElement>('haptics-setting').checked,reducedMotion:get<HTMLInputElement>('motion-setting').checked});render(0);}
  shell.addEventListener('input',settingsChanged);
  function hidden() { sync();interruptInput();if(document.hidden)game.pause();render(0); }
  function resize() { sync();interruptInput();if(game.snapshot.phase!=='MATCH_INTRO')game.pause();render(0); }
  function contextLost() { game.pause();interruptInput(); }
  app.addEventListener('pointerdown',down);app.addEventListener('pointermove',move);app.addEventListener('pointerup',up);app.addEventListener('pointercancel',cancel);app.addEventListener('lostpointercapture',lostCapture);
  shell.addEventListener('click',click);document.addEventListener('visibilitychange',hidden);window.addEventListener('resize',resize);app.addEventListener('webglcontextlost',contextLost,true);
  render(0);raf=requestAnimationFrame(frame);
  return ()=>{cancelAnimationFrame(raf);app.removeEventListener('pointerdown',down);app.removeEventListener('pointermove',move);app.removeEventListener('pointerup',up);app.removeEventListener('pointercancel',cancel);app.removeEventListener('lostpointercapture',lostCapture);shell.removeEventListener('input',settingsChanged);shell.removeEventListener('click',click);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('resize',resize);app.removeEventListener('webglcontextlost',contextLost,true);shell.remove();};
}
