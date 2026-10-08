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
      for (const id of ['canonical', 'candidate', 'overlay']) {
        const canvas = byId(id),
          ctx = canvas.getContext('2d'),
          size = 12;
        for (let y = 0; y < canvas.height; y += size)
          for (let x = 0; x < canvas.width; x += size) {
            ctx.fillStyle = ((x + y) / size) % 2 ? '#27342d' : '#1a2721';
            ctx.fillRect(x, y, size, size);
          }
        ctx.imageSmoothingEnabled = false;
        const x = (canvas.width - data.runtime.displayWidth) / 2,
          y = (canvas.height - data.runtime.displayHeight) / 2;
        ctx.globalAlpha = 1;
        ctx.drawImage(
          id === 'candidate' ? candidate : canonical,
          x,
          y,
          data.runtime.displayWidth,
          data.runtime.displayHeight,
        );
        if (id === 'overlay') {
          ctx.globalAlpha = Number(byId('blend').value) / 100;
          ctx.drawImage(candidate, x, y, data.runtime.displayWidth, data.runtime.displayHeight);
          ctx.globalAlpha = 1;
        }
        if (byId('guides').checked) {
          const ax = x + data.runtime.displayWidth * data.runtime.anchorX,
            ay = y + data.runtime.displayHeight * data.runtime.anchorY;
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
          ctx.moveTo(0, ay - data.runtime.labelHeight);
          ctx.lineTo(canvas.width, ay - data.runtime.labelHeight);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
    const select = byId('viewport');
    data.comparisons.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = item.width + ' × ' + item.height + ' · ' + item.lighting;
      select.append(option);
    });
    function scene() {
      const item = data.comparisons[Number(select.value)];
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
    select.addEventListener('change', scene);
    draw();
    scene();
    window.SpriteShowroom = { ready: true, key: data.key, pending: data.pending };
  } catch (error) {
    byId('error').hidden = false;
    byId('error').textContent = error.message;
  }
})();
