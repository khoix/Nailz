import { Duel, axisPosition, reticleRadius, DUEL_TIMING } from '../game/duel.ts';
import { measureSwipe, type GesturePoint } from '../input/swipe.ts';
import type { NailzScene } from '../scene/createScene.ts';
export function mountDuel(scene: NailzScene): () => void {
  const app = document.querySelector<HTMLElement>('#app')!;
  const shell = document.createElement('div'); shell.className = 'duel-ui';
  shell.innerHTML = `<header class="duel-header"><a class="wordmark" aria-label="Nailz">NAILZ<span>!</span></a><span class="duel-format">ONE NAIL. TWO RIVALS.</span><button id="pause" aria-label="Pause duel">Ⅱ</button></header>
    <div class="turn-badge"><span class="turn-dot"></span><span id="whose-turn">YOU vs OPERATOR</span><span id="strike-count"></span></div>
    <svg id="aim-overlay" viewBox="-3 -3 6 6" aria-hidden="true"><line class="guide" x1="-3" y1="0" x2="3" y2="0"/><line class="guide" x1="0" y1="-3" x2="0" y2="3"/><circle class="goal" r=".34"/><line id="line-y" class="aim-line" x1="-3" x2="3"/><line id="line-x" class="aim-line" y1="-3" y2="3"/><circle id="hit-dot" r=".065"/><circle id="local-goal" class="goal" r=".34"/><circle id="focus-ring" class="focus-ring"/></svg>
    <section class="duel-prompt"><span id="step-label"></span><h2 id="instruction"></h2><p id="hint"></p><div class="step-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div></section>
    <section id="duel-card" class="duel-card"><span class="eyebrow">THE SINGLE-NAIL CHALLENGE</span><h2>Make the<br>last hit yours.</h2><p>Line it up. Find your focus.<br>Swipe down and drive it home.</p><button id="begin" class="play-button">Start duel <span>↗</span></button><small>Take turns with the operator on the same nail.</small></section>
    <section id="pause-card" class="duel-card" hidden><span class="eyebrow">TAKE YOUR TIME</span><h2>Paused.</h2><p>Your aim and timing are saved.</p><button id="resume" class="play-button">Resume duel</button><button id="restart" class="quiet-button">Restart nail</button></section>
    <div id="result-flash" role="status" aria-live="polite"></div>`;
  app.append(shell);
  const get = <T extends Element = HTMLElement>(id: string) => shell.querySelector<T>('#'+id)!;
  const game = new Duel();
  let lastTime = performance.now();
  let raf = 0;
  let previousPhase = '';
  let activePointers = new Set<number>();
  let blocked = false;
  let gesture: { id: number; phase: string; points: GesturePoint[]; height: number } | null = null;
  let lastAnnouncement = -1;
  let restartCount = 0;
  const isAiming = (phase: string) => ['TARGET_Y','TARGET_X','RETICLE'].includes(phase);
  function sync(now = performance.now()) { const dt = Math.max(0, (now-lastTime)/1000); lastTime = now; game.tick(dt); }
  function cancelGesture() { gesture = null; }
  function interruptInput() {
    cancelGesture();
    for (const id of activePointers) if (app.hasPointerCapture(id)) app.releasePointerCapture(id);
    activePointers.clear();blocked=false;
  }
  function render(dt: number) {
    const s = game.snapshot;
    scene.present(s, s.paused || s.resumeIn > 0 ? 0 : dt);
    app.dataset.phase = s.phase; app.dataset.actor = s.actor;
    const active = s.phase !== 'MATCH_INTRO' && s.phase !== 'ROUND_RESULT';
    get<HTMLButtonElement>('pause').hidden = !active || s.paused;
    get('pause-card').toggleAttribute('hidden', !s.paused);
    get('whose-turn').textContent = !active ? 'YOU vs OPERATOR' : s.actor === 'p1' ? 'YOUR TURN' : 'OPERATOR’S TURN';
    get('strike-count').textContent = s.nail.strikeCount ? `${s.nail.strikeCount} STRIKES` : '';
    get('duel-card').toggleAttribute('hidden', active);
    if (s.phase === 'ROUND_RESULT' && previousPhase !== s.phase) {
      get('duel-card').querySelector('h2')!.textContent = s.nail.winner === 'p1' ? 'Nailed it!' : 'The house takes it.';
      get('duel-card').querySelector('p')!.textContent = `${s.nail.strikeCount} strikes. ${s.nail.winner === 'p1' ? 'The finishing blow was yours.' : 'The operator landed the finishing blow.'}`;
      get('begin').innerHTML = 'Another nail <span>↗</span>';
    }
    let title = '', hint = '', label = '';
    if (s.resumeIn > 0) { title = 'Get ready…'; hint = 'Your turn picks up exactly where you left it.'; }
    else if (s.phase === 'NAIL_SETUP') { title = 'Line it up'; hint = 'Center the two lines on the nail head.'; }
    else if (s.actor === 'p2' && s.phase === 'TARGET_Y') { title = 'Sizing it up…'; hint = 'Watch the operator’s contact point.'; label = 'OPERATOR'; }
    else if (s.phase === 'TARGET_Y') { title = 'Tap to lock height'; hint = 'Stop the moving line on the center guide.'; label = '01 / POSITION'; }
    else if (s.phase === 'TARGET_X') { title = 'Tap to lock the side'; hint = 'Bring the two lines together at the center.'; label = '02 / POSITION'; }
    else if (s.phase === 'RETICLE') { title = 'Tap when the rings match'; hint = 'One pass. Make it count.'; label = '03 / FOCUS'; }
    else if (s.phase === 'READY_TO_SWING') { title = s.elapsed >= DUEL_TIMING.ready ? 'SWIPE DOWN!' : 'Raise the hammer…'; hint = 'A fast, decisive swipe brings the power.'; label = '04 / SWING'; }
    else if (s.phase === 'NAIL_STRAIGHTEN') { title = 'Straightening up'; hint = 'Depth stays. The next striker gets a straight nail.'; }
    else if (s.phase === 'IMPACT_RESOLUTION' || s.phase === 'SWING') { title = s.actor === 'p1' ? 'Make it count.' : 'Here comes the operator.'; }
    get('instruction').textContent = title; get('hint').textContent = hint; get('step-label').textContent = label;
    shell.querySelector<HTMLElement>('.duel-prompt')!.hidden = !active || s.paused;
    const steps = ['TARGET_Y','TARGET_X','RETICLE','READY_TO_SWING'];
    shell.querySelectorAll<HTMLElement>('.step-dots i').forEach((dot,i)=>dot.classList.toggle('lit', i <= steps.indexOf(s.phase) && s.actor === 'p1'));
    const overlay = get<SVGSVGElement>('aim-overlay');
    const showAim = isAiming(s.phase) && !s.paused && s.resumeIn === 0;
    overlay.style.display = showAim ? 'block' : 'none';
    if (showAim) {
      const rect = scene.getTargetRect(); const r = rect.radiusPixels;
      overlay.style.left = `${rect.centerX-r*3}px`; overlay.style.top = `${rect.centerY-r*3}px`;
      overlay.style.width = `${r*6}px`; overlay.style.height = `${r*6}px`;
      const y = s.actor === 'p1' && s.phase === 'TARGET_Y' ? axisPosition(s.elapsed) : s.aim.y;
      const x = s.actor === 'p1' && s.phase === 'TARGET_X' ? axisPosition(s.elapsed) : s.aim.x;
      const ly = get<SVGLineElement>('line-y'); ly.setAttribute('y1',String(-y));ly.setAttribute('y2',String(-y));
      const lx = get<SVGLineElement>('line-x'); lx.setAttribute('x1',String(x));lx.setAttribute('x2',String(x));
      lx.style.opacity = s.phase === 'TARGET_Y' && s.actor === 'p1' ? '0' : '1';
      get('hit-dot').setAttribute('cx',String(x));get('hit-dot').setAttribute('cy',String(-y));
      for (const id of ['focus-ring','local-goal']) { const node=get(id);node.setAttribute('cx',String(x));node.setAttribute('cy',String(-y));node.style.display=s.phase==='RETICLE'?'block':'none'; }
      get('focus-ring').setAttribute('r',String(reticleRadius(s.elapsed)*.34));
    }
    if (s.appliedActionId !== lastAnnouncement) {
      lastAnnouncement = s.appliedActionId;
      const r=s.lastResult;
      get('result-flash').textContent = r ? r.oneHit ? 'ONE HIT!' : r.finishing ? 'NAILED IT!' : !r.contact ? 'MISSED!' : Math.hypot(r.bend.x,r.bend.y)>.08 ? 'GLANCING HIT' : r.usablePower<.4 ? 'LIGHT TOUCH' : 'SOLID HIT' : '';
    }
    get('result-flash').classList.toggle('visible',s.phase==='IMPACT_RESOLUTION' && !s.paused);
    previousPhase=s.phase;
  }
  function frame(now: number) { const dt=Math.max(0,(now-lastTime)/1000);sync(now);render(dt);raf=requestAnimationFrame(frame); }
  function down(event: PointerEvent) {
    if ((event.target as HTMLElement).closest('button,a,select,input,.inspector')) return;
    sync();activePointers.add(event.pointerId);
    if (activePointers.size > 1) { blocked=true;cancelGesture();return; }
    const s=game.snapshot;
    if (blocked || s.paused || s.resumeIn>0 || s.actor!=='p1' || !(isAiming(s.phase)||s.phase==='READY_TO_SWING')) return;
    if (s.phase==='READY_TO_SWING' && s.elapsed<DUEL_TIMING.ready) return;
    app.setPointerCapture(event.pointerId);
    gesture={id:event.pointerId,phase:s.phase,points:[{x:event.clientX,y:event.clientY,time:event.timeStamp}],height:app.clientHeight};
    event.preventDefault();
  }
  function move(event: PointerEvent) { if(gesture?.id===event.pointerId) gesture.points.push({x:event.clientX,y:event.clientY,time:event.timeStamp}); }
  function up(event: PointerEvent) {
    sync();activePointers.delete(event.pointerId);
    const current=gesture;gesture=null;
    if (app.hasPointerCapture(event.pointerId)) app.releasePointerCapture(event.pointerId);
    if (blocked) { if(!activePointers.size)blocked=false;return; }
    if (!current || current.id!==event.pointerId || game.snapshot.phase!==current.phase) return;
    current.points.push({x:event.clientX,y:event.clientY,time:event.timeStamp});
    if (current.phase==='READY_TO_SWING') { const result=measureSwipe(current.points,current.height);if(result.valid)game.swing(result.power); }
    else { const a=current.points[0]!;if(Math.hypot(event.clientX-a.x,event.clientY-a.y)<24)game.tap(); }
    render(0);
  }
  function cancel(event: PointerEvent) { activePointers.delete(event.pointerId);if(gesture?.id===event.pointerId)cancelGesture();if(!activePointers.size)blocked=false; }
  function click(event: MouseEvent) {
    const button=(event.target as HTMLElement).closest('button');if(!button)return;sync();interruptInput();
    if(button.id==='begin') { if(game.snapshot.phase==='MATCH_INTRO')game.start();else game.restart(9271 + ++restartCount); }
    if(button.id==='pause')game.pause();
    if(button.id==='resume')game.resume();
    if(button.id==='restart')game.restart(9271 + ++restartCount);
    render(0);
  }
  function hidden() { sync();interruptInput();if(document.hidden)game.pause();render(0); }
  function resize() { interruptInput();if(game.snapshot.phase!=='MATCH_INTRO')game.pause(); }
  function contextLost() { game.pause();interruptInput(); }
  app.addEventListener('pointerdown',down);app.addEventListener('pointermove',move);app.addEventListener('pointerup',up);app.addEventListener('pointercancel',cancel);app.addEventListener('lostpointercapture',cancel);
  shell.addEventListener('click',click);document.addEventListener('visibilitychange',hidden);window.addEventListener('resize',resize);app.addEventListener('webglcontextlost',contextLost,true);
  render(0);raf=requestAnimationFrame(frame);
  return ()=>{cancelAnimationFrame(raf);app.removeEventListener('pointerdown',down);app.removeEventListener('pointermove',move);app.removeEventListener('pointerup',up);app.removeEventListener('pointercancel',cancel);app.removeEventListener('lostpointercapture',cancel);shell.removeEventListener('click',click);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('resize',resize);app.removeEventListener('webglcontextlost',contextLost,true);shell.remove();};
}
