import './style.css';
import { createScene } from './scene/createScene.ts';
const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
try {
  const scene = createScene(canvas);
  let cleanupInspector: (() => void) | undefined;
  if (import.meta.env.DEV) {
    const { mountInspector } = await import('./dev/inspector.ts');
    cleanupInspector = mountInspector(scene);
  }
  import.meta.hot?.dispose(() => { cleanupInspector?.(); scene.dispose(); });
} catch (error) {
  document.querySelector('#notice')!.textContent = 'The 3D scene could not start. Enable hardware acceleration or try a WebGL-capable browser.';
  console.error('Nailz scene startup failed', error);
}
