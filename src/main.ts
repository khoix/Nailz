import './style.css';
import { createScene } from './scene/createScene.ts';
import { mountDuel } from './ui/duelUI.ts';
const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
try {
  const scene = createScene(canvas);
  let cleanup: (() => void) | undefined;
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('lab')) {
    const { mountInspector } = await import('./dev/inspector.ts');
    cleanup = mountInspector(scene);
  } else {
    document.querySelector('.masthead')?.remove();document.querySelector('.scene-caption')?.remove();
    cleanup = mountDuel(scene);
  }
  import.meta.hot?.dispose(() => { cleanup?.(); scene.dispose(); });
} catch (error) {
  document.querySelector('#notice')!.textContent = 'The 3D scene could not start. Enable hardware acceleration or try a WebGL-capable browser.';
  console.error('Nailz scene startup failed', error);
}
