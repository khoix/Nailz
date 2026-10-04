import type { NailzScene, CameraView } from '../scene/createScene.ts';
import { applyStrike, createNail, resolveStrike, straightenNail } from '../game/strike.ts';
import { FIXTURES } from './fixtures.ts';
export function mountInspector(scene: NailzScene): () => void {
  const panel = document.createElement('aside'); panel.className = 'inspector';
  panel.setAttribute('aria-label', 'Development strike fixtures');
  panel.innerHTML = `<div class="panel-heading"><span>STRIKE LAB</span><span class="tag">DEV ONLY</span></div>
    <div class="views" aria-label="Camera"><button data-view="booth">Booth</button><button data-view="target">Target</button><button data-view="impact">Impact</button></div>
    <label for="fixture">Select a deterministic strike</label><select id="fixture">${Object.keys(FIXTURES).map(name => `<option>${name}</option>`).join('')}</select>
    <div class="actions"><button id="resolve" class="primary">Resolve strike ↗</button><button id="reset">Reset</button><button id="straighten">Straighten</button><button id="profile">Profile</button></div>
    <output id="result" aria-live="polite">Fresh nail · 84% exposed</output>`;
  document.querySelector('#app')!.append(panel);
  const output = panel.querySelector<HTMLOutputElement>('#result')!;
  let nail = createNail();
  const click = (event: Event) => {
    const button = (event.target as HTMLElement).closest('button'); if (!button) return;
    if (button.dataset.view) { scene.setView(button.dataset.view as CameraView); panel.dataset.metrics=JSON.stringify(scene.metrics()); return; }
    if(button.id==='profile'){void scene.profile().then(result=>{panel.dataset.profile=JSON.stringify(result);output.textContent=`${result.medianMs.toFixed(2)}ms median CPU render submission · ${result.calls} draws · ${result.triangles} triangles`;});return;}
    if (button.id === 'reset') { nail = createNail(); scene.setNail(nail); output.textContent = 'Fresh nail · 84% exposed'; return; }
    if (button.id === 'straighten') { nail = straightenNail(nail); scene.setNail(nail); return; }
    // Fixtures always resolve against a fresh nail for repeatable visual comparisons.
    const name = panel.querySelector<HTMLSelectElement>('#fixture')!.value;
    const input = FIXTURES[name]; if (!input) return;
    const result = resolveStrike(createNail(), input); nail = applyStrike(createNail(), result);
    scene.setNail(nail); scene.showStrike(result);
    output.textContent = `${result.oneHit ? 'ONE HIT! · ' : result.contact ? '' : 'MISS · '}Depth ${(result.depthAfter * 100).toFixed(1)}% · Power ${(result.usablePower * 100).toFixed(0)}% · Bend ${(Math.hypot(result.bend.x, result.bend.y) * 180 / Math.PI).toFixed(0)}°`;
    output.dataset.fixture = name;
  };
  panel.addEventListener('click', click);
  return () => { panel.removeEventListener('click', click); panel.remove(); };
}
