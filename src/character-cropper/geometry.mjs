const limit = (n, min, max) => Math.max(min, Math.min(max, n));
const pixel = (n, fallback = 0) => Number.isFinite(Number(n)) ? Math.round(Number(n)) : fallback;

export function clampCrop(crop, width, height) {
  const x = limit(pixel(crop.x), 0, width - 1);
  const y = limit(pixel(crop.y), 0, height - 1);
  return {...crop, x, y, width: limit(pixel(crop.width, 1), 1, width - x), height: limit(pixel(crop.height, 1), 1, height - y)};
}

export function createCrops(width, height, layout = 'reference') {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error('Invalid image dimensions.');
  const names = ['Front', 'Back', 'Left', 'Right'];
  const reference = [[12, 14, 459, 630], [477, 14, 861, 630], [880, 14, 1187, 630], [1207, 14, 1522, 630]];
  return names.map((name, i) => {
    let edges;
    if (layout === 'reference') edges = reference[i].map((n, j) => Math.floor(n * (j % 2 ? height / 1024 : width / 1536)));
    else if (layout === 'grid') edges = [Math.floor(i % 2 * width / 2), Math.floor(Math.floor(i / 2) * height / 2), Math.floor((i % 2 + 1) * width / 2), Math.floor((Math.floor(i / 2) + 1) * height / 2)];
    else edges = [Math.floor(i * width / 4), 0, Math.floor((i + 1) * width / 4), height];
    return clampCrop({name, x: edges[0], y: edges[1], width: edges[2] - edges[0], height: edges[3] - edges[1]}, width, height);
  });
}

export function moveCrop(crop, dx, dy, width, height) {
  return {...crop, x: limit(pixel(crop.x + dx), 0, width - crop.width), y: limit(pixel(crop.y + dy), 0, height - crop.height)};
}

export function createGridCrops(width, height, columns, rows) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1 || columns > 24 || rows > 24) throw new Error('Grid rows and columns must be between 1 and 24.');
  return Array.from({length: columns * rows}, (_, i) => {
    const x = Math.floor(i % columns * width / columns), y = Math.floor(Math.floor(i / columns) * height / rows);
    const right = Math.floor((i % columns + 1) * width / columns), bottom = Math.floor((Math.floor(i / columns) + 1) * height / rows);
    return clampCrop({name: `View ${i + 1}`, x, y, width: right-x, height: bottom-y}, width, height);
  });
}

export function createManualCrop(crops, width, height) {
  const used = new Set(crops.map(crop => crop.name.toLowerCase()));
  let number = crops.length + 1;
  while (used.has(`view ${number}`)) number++;
  return clampCrop({name: `View ${number}`, x: Math.floor(width*.35), y: Math.floor(height*.2), width: Math.max(1, Math.round(width*.3)), height: Math.max(1, Math.round(height*.6))}, width, height);
}

export function resizeCrop(crop, handle, dx, dy, width, height) {
  let left = crop.x, top = crop.y, right = left + crop.width, bottom = top + crop.height;
  if (handle.includes('w')) left = limit(pixel(left + dx), 0, right - 1);
  if (handle.includes('e')) right = limit(pixel(right + dx), left + 1, width);
  if (handle.includes('n')) top = limit(pixel(top + dy), 0, bottom - 1);
  if (handle.includes('s')) bottom = limit(pixel(bottom + dy), top + 1, height);
  return {...crop, x: left, y: top, width: right - left, height: bottom - top};
}

export function safeStem(value, fallback = 'character') {
  return String(value || '').normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\./g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || fallback;
}

export function buildExportNames(prefix, crops, format) {
  if (!['png', 'jpg'].includes(format)) throw new Error('Unsupported image format.');
  const seen = new Set();
  return crops.map((crop, i) => {
    const base = `${safeStem(prefix)}-${safeStem(crop.name, `view-${i + 1}`).toLowerCase()}`;
    let name = `${base}.${format}`, suffix = 2;
    while (seen.has(name.toLowerCase())) name = `${base}-${suffix++}.${format}`;
    seen.add(name.toLowerCase());
    return name;
  });
}
