/* Mug steam: a handful of soft sprites that rise, drift and fade. There is no permanent loop: a 15 fps timer wakes only while the
 * page is visible, motion is allowed and the mug is inside the camera frustum, and each tick asks for one on-demand render.
 * With reduced motion (or a hidden tab, or the mug off-screen) it costs nothing; reduced motion shows one still wisp pose. */
export function setupSteam({ THREE, scene, camera, markDirty, reduceMotion, origin }) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,248,235,0.9)'); g.addColorStop(0.45, 'rgba(255,244,228,0.35)'); g.addColorStop(1, 'rgba(255,244,228,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const N = 6, LIFE = 5.6, RISE = 240, PEAK = 0.26;
  const wisps = Array.from({ length: N }, (_, i) => {
    const mat = new THREE.SpriteMaterial({ map: tex, color: '#efe6d6', transparent: true, depthWrite: false, opacity: 0 });
    const sprite = new THREE.Sprite(mat);
    scene.add(sprite);
    return { sprite, phase: i / N, seed: i * 1.7 + 0.4 };
  });
  function place(t) {
    for (const w of wisps) {
      const u = (t / LIFE + w.phase) % 1;
      const fade = Math.pow(Math.sin(Math.PI * u), 1.6);          // in quickly, dissolve slowly
      w.sprite.position.set(origin.x + Math.sin(u * 4.5 + w.seed) * 20 * u + u * 14, origin.y + u * RISE, origin.z + Math.cos(u * 3.1 + w.seed) * 10 * u);
      w.sprite.scale.set(34 + u * 70, 70 + u * 160, 1);   // taller than wide: a wisp, not a puff
      w.sprite.material.opacity = PEAK * fade;
    }
  }

  const frustum = new THREE.Frustum(), m = new THREE.Matrix4(), probe = origin.clone().add(new THREE.Vector3(0, 90, 0));
  const inView = () => {
    camera.updateMatrixWorld();
    m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    return frustum.setFromProjectionMatrix(m).containsPoint(probe);
  };
  let timer = 0, suspended = false;
  const tick = () => { if (suspended || document.hidden || !inView()) return; place(performance.now() / 1000); markDirty(); };
  const start = () => { if (!timer && !suspended && !reduceMotion.matches && !document.hidden) timer = setInterval(tick, 66); };
  const stop = () => { clearInterval(timer); timer = 0; };
  const sync = () => {
    stop();
    if (reduceMotion.matches) { place(LIFE * 0.37); markDirty(); }  // one still pose, no animation
    else start();
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduceMotion.addEventListener('change', sync);
  sync();
  return {
    stop,
    start,
    suspend: () => { suspended = true; stop(); },   // the owning page is dormant: no timer, no frames
    resume: () => { suspended = false; sync(); },
  };
}
