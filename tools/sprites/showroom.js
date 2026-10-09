'use strict';
(async () => {
  const byId = (id) => document.getElementById(id);
  try {
    const response = await fetch('comparison.json', { cache: 'no-store' });
    if (!response.ok) throw Error('Comparison data is unavailable');
    const data = await response.json();
    byId('name').textContent = data.name;
    byId('status').textContent = data.pending
      ? 'Preparation preview — no candidate artwork yet.'
      : 'Candidate preview — appearance approval is pending.';
    byId('question').textContent = data.pending
      ? 'No creative decision is needed yet.'
      : 'Does this preserve the existing identity and improve its appearance?';
    const load = (src) =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(Error('Unable to load comparison image'));
        image.src = src;
      });
    const [canonical, candidate] = await Promise.all([
      load('canonical-isolated.png'),
      load(data.candidateImage),
    ]);
    function draw() {
      const profile = data.comparisons[Number(byId('viewport').value) || 0],
        ratio = profile.ratio || 1,
        zoom = profile.cameraZoom || data.cameraZoom || 1,
        extent = 312;
      for (const id of ['canonical', 'candidate', 'overlay']) {
        const canvas = byId(id);
        canvas.width = Math.round(extent * ratio);
        canvas.height = Math.round(extent * ratio);
        canvas.style.width = extent + 'px';
        const ctx = canvas.getContext('2d'),
          size = 12;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        for (let y = 0; y < extent; y += size)
          for (let x = 0; x < extent; x += size) {
            ctx.fillStyle = ((x + y) / size) % 2 ? '#27342d' : '#1a2721';
            ctx.fillRect(x, y, size, size);
          }
        ctx.imageSmoothingEnabled = false;
        const dw = data.runtime.displayWidth * zoom,
          dh = data.runtime.displayHeight * zoom,
          x = (extent - dw) / 2,
          y = (extent - dh) / 2;
        ctx.globalAlpha = 1;
        ctx.drawImage(id === 'candidate' ? candidate : canonical, x, y, dw, dh);
        if (id === 'overlay') {
          ctx.globalAlpha = Number(byId('blend').value) / 100;
          ctx.drawImage(candidate, x, y, dw, dh);
          ctx.globalAlpha = 1;
        }
        if (byId('guides').checked) {
          const ax = x + dw * data.runtime.anchorX,
            ay = y + dh * data.runtime.anchorY;
          ctx.strokeStyle = '#efca74';
          ctx.beginPath();
          ctx.moveTo(ax - 15, ay);
          ctx.lineTo(ax + 15, ay);
          ctx.moveTo(ax, ay - 15);
          ctx.lineTo(ax, ay + 15);
          ctx.stroke();
          ctx.strokeStyle = '#83c5dc';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, ay - data.runtime.labelHeight * zoom);
          ctx.lineTo(extent, ay - data.runtime.labelHeight * zoom);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
    const select = byId('viewport');
    data.comparisons.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent =
        item.width +
        ' × ' +
        item.height +
        ' · ' +
        item.lighting +
        ' · ' +
        Math.round((item.cameraZoom || 1) * 100) +
        '% · ' +
        Number((item.ratio || 1).toFixed(2)) +
        '× pixels';
      select.append(option);
    });
    function scene() {
      const item = data.comparisons[Number(select.value)];
      byId('viewing-size').textContent =
        Math.round((item.cameraZoom || 1) * 100) +
        '% camera · ' +
        Number((item.ratio || 1).toFixed(2)) +
        '× canvas density · ' +
        (item.pixelWidth || item.width) +
        ' × ' +
        (item.pixelHeight || item.height) +
        ' raster. Open scene images for a 1:1 pixel inspection.';
      for (const [id, link, src] of [
        ['current-scene', 'current-link', item.canonical],
        ['proposed-scene', 'proposed-link', item.candidate],
      ]) {
        byId(id).src = src;
        byId(link).href = src;
        byId(id).width = item.width;
        byId(id).height = item.height;
      }
    }
    byId('blend').addEventListener('input', draw);
    byId('guides').addEventListener('change', draw);
    select.addEventListener('change', () => {
      scene();
      draw();
    });
    draw();
    scene();
    window.SpriteShowroom = { ready: true, key: data.key, pending: data.pending };
  } catch (error) {
    byId('error').hidden = false;
    byId('error').textContent = error.message;
  }
})();
