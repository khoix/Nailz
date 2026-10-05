# E4 visual and rendering checkpoint

2026-10-04. Original procedural carnival environment, bevelled hammer/nail, textured log, and versioned asset loader.

- `booth-390.png`, `target-390.png`, `impact-390.png`: 390×844 portrait.
- `booth-844.png`, `target-844.png`, `impact-844.png`: 844×390 landscape.
- Captures use the development fixture inspector with UI hidden for unobstructed scene review. Production E2E captures retain the real UI.
- `render-profile.json`: Chromium 153.0.8010.0, SwiftShader, DPR 1, 60 render submissions. Median 1.2 ms, p95 1.9 ms, 109 draw calls and 46,248 triangles in the sampled impact view. This is CPU submission cost, not hardware frame time or a mobile FPS promise.
- The first unbatched sample was 334 calls. Static material batching, instanced bulbs, and instanced log/rivet/grip details reduced draw overhead. Full scene triangles vary by camera and shadow pass.
- Reviewed: marquee/hero framing, nail contrast, beveled target rim, contact shadow, landscape coverage, perfect-finish and left-glance fixtures. The unchanged nail-local coordinate conversion and raised hammer contact face preserve hit geometry.
- Asset bytes: 84,090 raw SVG bytes / 28,228 bytes with gzip. Production JS build: about 582 KB /149 KB gzip; CSS about 8.6 KB /2.7 KB gzip. No music bytes or requests.

Physical iPhone/Android/Safari, human comfort, GPU timings, and context-loss recovery with the new reflection environment are not certified here. These remain E8/device-validation work. The operator is the next art milestone; E4 does not add acting, impact particles, audio, or final title/menu presentation.
