// DPA พร้อมส่ง — ย่อ/แปลงวิดีโอด้วย WebCodecs (Mediabunny) และรวม PDF (pdf-lib) ในเบราว์เซอร์ทั้งหมด
const $ = (s) => document.querySelector(s);
const MB = 1_000_000;
const AUDIO_BPS = 128_000;
const SAFETY = 0.93; // เผื่อ bitrate แกว่ง ให้ไฟล์จริงไม่เกินเป้า

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtSize = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(b < 1e7 ? 1 : 0)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(r)}` : `${m}:${p(r)}`;
}
function fmtDuration(sec) {
  if (sec < 1) return 'ไม่ถึง 1 วินาที';
  const s = Math.round(sec);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return [h && `${h} ชม.`, m && `${m} นาที`, (r || !(h || m)) && `${r} วินาที`].filter(Boolean).join(' ');
}
// "1:30" = 1 นาที 30 วินาที · "1:02:05" = ชม:นาที:วินาที · เลขเดียว = นาที
function parseTime(str) {
  const t = str.trim().replace(/[.,]/g, ':');
  if (!t) return null;
  const parts = t.split(':');
  if (parts.some((p) => p === '' || !/^\d+$/.test(p)) || parts.length > 3) return NaN;
  const n = parts.map(Number);
  if (n.length === 1) return n[0] * 60;
  return n.reduce((a, v) => a * 60 + v, 0);
}
function baseName(name) { return name.replace(/\.[^.]+$/, ''); }
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
}
function store(key, value) { try { if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(value)); } catch { return null; } }

// ---------- ตรวจความสามารถเบราว์เซอร์ ----------
const canCodec = 'VideoEncoder' in window && 'VideoDecoder' in window;
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
(() => {
  const b = $('#support-banner');
  if (!canCodec) {
    b.innerHTML = '<b>เบราว์เซอร์นี้ย่อวิดีโอไม่ได้</b> กรุณาเปิดหน้านี้ด้วย Google Chrome หรือ Microsoft Edge บนคอมพิวเตอร์ (ส่วนรวม PDF ใช้ได้ตามปกติ)';
    b.hidden = false;
  } else if (isMobile) {
    b.innerHTML = '<b>ใช้บนมือถือได้ แต่แนะนำคอมพิวเตอร์</b> วิดีโอยาว 60 นาทีบนมือถืออาจช้ามากหรือหน่วยความจำไม่พอ';
    b.hidden = false;
  }
})();

let mbPromise;
const lib = () => (mbPromise ??= import('./vendor/mediabunny.min.mjs'));
if (canCodec) setTimeout(lib, 1500);

// ============================ วิดีโอ ============================
const V = { file: null, info: null, busy: false, conv: null, cancelled: false };

const kindLimit = () => Number(document.querySelector('input[name=kind]:checked').value);
const kindLabel = () => document.querySelector('input[name=kind]:checked').dataset.label;

function trimRange() {
  const info = V.info;
  const s = parseTime($('#v-start').value), e = parseTime($('#v-end').value);
  const start = s == null ? 0 : s, end = e == null ? info.dur : e;
  if (Number.isNaN(start) || Number.isNaN(end)) return { error: 'พิมพ์เวลาเป็น นาที:วินาที เช่น 0:45 หรือ 58:30' };
  if (start >= info.dur) return { error: `เวลาเริ่มเกินความยาวคลิป (${fmtTime(info.dur)})` };
  if (end <= start) return { error: 'เวลาจบต้องมากกว่าเวลาเริ่ม' };
  return { start, end: Math.min(end, info.dur), trimmed: start > 0.05 || end < info.dur - 0.05 };
}

function makePlan(info, keep, targetMB) {
  const copySize = info.size * (keep / info.dur);
  const audioOk = !info.acodec || info.acodec === 'aac' || info.acodec === 'mp3';
  const reasons = [];
  if (!info.isMp4) reasons.push(`ไฟล์เป็น ${info.container} ต้องเป็น MP4`);
  if (info.codec !== 'avc') reasons.push(`ภาพบีบอัดแบบ ${info.codecName} ซึ่งบางเครื่องเปิดไม่ได้ ควรแปลงเป็น H.264`);
  if (!audioOk) reasons.push(`เสียงเป็น ${info.acodec} ควรแปลงเป็น AAC`);
  if (copySize > targetMB * MB * 0.97) reasons.push(`ขนาดประมาณ ${fmtSize(copySize)} เกิน ${targetMB} MB`);

  const mustTranscode = info.codec !== 'avc' || !audioOk || copySize > targetMB * MB * 0.97;
  if (!mustTranscode) return { mode: 'copy', estSize: copySize, reasons };

  const budget = (targetMB * MB * 8 * SAFETY) / keep;
  let vbps = budget - AUDIO_BPS;
  // สูงสุด 720p: ทดสอบแล้วตัวเข้ารหัสฮาร์ดแวร์ที่ 1080p ใช้ bitrate เกินที่ตั้งเกือบ 2 เท่า ขณะที่ 720p/540p ตรงเป้า ±5%
  const short = Math.min(info.dw, info.dh);
  let tShort = vbps >= 1_100_000 ? 720 : vbps >= 650_000 ? 540 : 480;
  tShort = Math.min(tShort, short);
  const cap = tShort >= 720 ? 2_500_000 : tShort >= 540 ? 1_500_000 : 1_200_000;
  vbps = Math.round(Math.min(vbps, cap)); // WebCodecs รับเฉพาะจำนวนเต็ม
  const even = (n) => Math.max(2, Math.round(n / 2) * 2);
  const landscape = info.dw >= info.dh;
  const width = landscape ? even((info.dw * tShort) / info.dh) : even(tShort);
  const height = landscape ? even(tShort) : even((info.dh * tShort) / info.dw);
  const fps = info.fps > 31 ? 30 : undefined;
  return {
    mode: 'transcode', vbps, width, height, fps, reasons,
    tooSmall: vbps < 250_000,
    copyAudio: info.acodec === 'aac',
    estSize: ((vbps + AUDIO_BPS) * keep) / 8,
  };
}

function setStatus(kind, title, detail = '') {
  $('#v-status').className = `status ${kind}`;
  $('#v-status').innerHTML = `<i class="dot"></i><div><b>${title}</b>${detail ? `<span>${detail}</span>` : ''}</div>`;
}

function renderVideo() {
  const info = V.info;
  if (!info) return;
  const limit = kindLimit();
  const targetMB = Number($('#v-target').value);
  const over = info.dur > limit + 0.5;
  $('#v-facts').innerHTML = [
    ['ไฟล์', esc(info.name), 'th'],
    ['ความยาว', `<span class="${over ? 'over' : ''}">${fmtTime(info.dur)}</span>`],
    ['ขนาด', fmtSize(info.size)],
    ['ภาพ', `${info.dw}×${info.dh}${info.fps ? ` · ${Math.round(info.fps)} fps` : ''}`],
    ['ชนิดไฟล์', `${info.container} · ${info.codecName}${info.acodec ? ` + ${info.acodec.toUpperCase()}` : ''}`],
  ].map(([k, v, c]) => `<div><dt>${k}</dt><dd class="${c || ''}">${v}</dd></div>`).join('');
  $('#v-end').placeholder = fmtTime(info.dur);

  const tr = trimRange();
  const go = $('#v-go');
  if (tr.error) { setStatus('bad', 'ช่วงเวลาไม่ถูกต้อง', tr.error); $('#v-plan').textContent = ''; go.disabled = true; return; }
  const keep = tr.end - tr.start;
  if (keep > limit + 0.5) {
    setStatus('bad', `${kindLabel()} ยาว ${fmtDuration(keep)} เกิน ${limit / 60} นาที`,
      `ต้องตัดออก ${fmtDuration(keep - limit)} ตั้งเวลาในช่อง "ช่วงที่จะเก็บไว้" หรือ <button type="button" class="btn btn-small btn-gold" id="v-autotrim">ตัดท้ายให้เหลือ ${limit / 60} นาทีพอดี</button>`);
    $('#v-autotrim').onclick = () => { $('#v-end').value = fmtTime(tr.start + limit); renderVideo(); };
    $('#v-plan').textContent = '';
    go.disabled = true;
    return;
  }
  const plan = makePlan(info, keep, targetMB);
  V.plan = { ...plan, ...tr };
  go.disabled = !canCodec && plan.mode === 'transcode';
  if (plan.mode === 'copy' && !plan.reasons.length && !tr.trimmed) {
    setStatus('ok', 'ไฟล์นี้พร้อมส่งแล้ว ไม่ต้องแปลง', `MP4 ขนาด ${fmtSize(info.size)} ความยาว ${fmtTime(info.dur)} อยู่ในเกณฑ์`);
    $('#v-plan').textContent = '';
    go.hidden = true;
    return;
  }
  go.hidden = false;
  const why = [...plan.reasons, tr.trimmed ? `ตัดเหลือช่วง ${fmtTime(tr.start)}–${fmtTime(tr.end)}` : ''].filter(Boolean);
  setStatus('warn', 'ต้องแปลงก่อนส่ง', why.map(esc).join(' · '));
  if (plan.mode === 'copy') {
    const what = [!info.isMp4 && 'เปลี่ยนเป็น MP4', tr.trimmed && 'ตัดช่วง'].filter(Boolean).join(' และ');
    $('#v-plan').innerHTML = `<b>แปลงแบบเร็ว ภาพไม่ลดคุณภาพ</b> ${what} · ได้ไฟล์ประมาณ <b>${fmtSize(plan.estSize)}</b> · ใช้เวลาไม่กี่นาที`;
  } else if (plan.tooSmall) {
    $('#v-plan').innerHTML = `คลิปยาว ${fmtDuration(keep)} ย่อให้เหลือ ${targetMB} MB แล้วภาพจะไม่ชัด <b>กรุณาเลือกขนาดใหญ่ขึ้น</b>`;
    go.disabled = true;
  } else {
    $('#v-plan').innerHTML = `ย่อเป็น <b>MP4 ${plan.width}×${plan.height}${plan.fps ? ` ${plan.fps} fps` : ''}</b> ได้ไฟล์ประมาณ <b>${fmtSize(plan.estSize)}</b>
      <br><span class="muted small">เครื่องทั่วไปใช้เวลาราว 1/4 ถึง 1 เท่าของความยาวคลิป · เครื่องจะเลือกที่บันทึกไฟล์ให้ก่อนเริ่ม</span>`;
  }
}

async function loadVideo(file) {
  if (V.busy) return;
  V.file = file; V.info = null;
  $('#v-panel').hidden = false;
  $('#v-result').hidden = true;
  $('#v-progress').hidden = true;
  $('#v-start').value = ''; $('#v-end').value = '';
  $('#v-facts').innerHTML = '';
  $('#v-plan').textContent = '';
  $('#v-go').hidden = false;
  setStatus('warn', 'กำลังอ่านไฟล์…', esc(file.name));
  let input;
  try {
    const mb = await lib();
    input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    const [mime, dur, vt, at] = await Promise.all([
      input.getMimeType(), input.computeDuration(), input.getPrimaryVideoTrack(), input.getPrimaryAudioTrack(),
    ]);
    if (!vt) throw new Error('ไม่พบภาพในไฟล์นี้');
    const [codec, dw, dh, stats, acodec] = await Promise.all([
      vt.getCodec(), vt.getDisplayWidth(), vt.getDisplayHeight(), vt.computePacketStats(120).catch(() => null), at ? at.getCodec() : null,
    ]);
    const container = /quicktime/.test(mime) ? 'MOV' : /mp4/.test(mime) ? 'MP4' : /webm/.test(mime) ? 'WebM' : /matroska/.test(mime) ? 'MKV' : (mime.split(';')[0].split('/')[1] || '?').toUpperCase();
    const codecNames = { avc: 'H.264', hevc: 'HEVC (H.265)', vp9: 'VP9', vp8: 'VP8', av1: 'AV1' };
    V.info = {
      name: file.name, size: file.size, dur, dw, dh, codec, acodec, container,
      isMp4: container === 'MP4', codecName: codecNames[codec] || codec || '?', fps: stats?.averagePacketRate || 0,
    };
    renderVideo();
  } catch (err) {
    console.error(err);
    setStatus('bad', 'อ่านไฟล์นี้ไม่ได้', `${esc(err.message || err)} · ลองเปิดด้วย Chrome/Edge บนคอม หรือส่งไฟล์นี้มาให้เพจดูได้`);
  } finally {
    input?.dispose?.();
  }
}

async function convert() {
  const { file, info, plan } = V;
  if (!file || !info || !plan || V.busy) return;
  const outName = `${baseName(file.name)}-DPA.mp4`;
  const mb = await lib();

  // เลือกที่บันทึกก่อน (ต้องอยู่ในจังหวะกดปุ่ม) — เขียนลงดิสก์ตรง ไม่กินแรม
  let handle = null, writable = null;
  if (window.showSaveFilePicker) {
    try {
      handle = await window.showSaveFilePicker({ suggestedName: outName, types: [{ description: 'วิดีโอ MP4', accept: { 'video/mp4': ['.mp4'] } }] });
      writable = await handle.createWritable();
    } catch (e) {
      if (e.name === 'AbortError') return;
      handle = null; writable = null;
    }
  }

  V.busy = true; V.cancelled = false;
  $('#v-go').disabled = true; $('#v-reset').disabled = true;
  $('#v-result').hidden = true;
  $('#v-progress').hidden = false;
  $('#v-bar').style.width = '0%'; $('#v-pct').textContent = '0%'; $('#v-eta').textContent = 'กำลังเริ่ม…';
  let wake = null;
  try { wake = await navigator.wakeLock?.request('screen'); } catch { /* ไม่รองรับก็ไม่เป็นไร */ }
  const guard = (e) => { e.preventDefault(); e.returnValue = ''; };
  addEventListener('beforeunload', guard);

  const target = writable ? new mb.StreamTarget(writable, { chunked: true }) : new mb.BufferTarget();
  const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
  const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: writable ? false : 'in-memory' }), target });
  const t0 = performance.now();
  try {
    let video, audio;
    if (plan.mode === 'copy') {
      video = { codec: 'avc' };
      audio = { codec: 'aac' };
    } else {
      const ok = await mb.canEncodeVideo('avc', { width: plan.width, height: plan.height, bitrate: plan.vbps });
      if (!ok) throw new Error('เครื่องนี้เข้ารหัส H.264 ไม่ได้ ลองใช้ Chrome หรือ Edge รุ่นล่าสุดบนคอมพิวเตอร์');
      video = {
        // forceTranscode: ถ้าขนาดภาพเท่าต้นฉบับ ไลบรารีจะคัดลอกภาพเดิมโดยไม่ย่อ
        codec: 'avc', width: plan.width, height: plan.height, fit: 'contain', forceTranscode: true,
        quality: new mb.Quality({ bitrate: Math.round(plan.vbps), bitrateMode: 'variable' }),
        ...(plan.fps ? { frameRate: plan.fps } : {}),
      };
      audio = plan.copyAudio ? { codec: 'aac' } : { codec: 'aac', quality: new mb.Quality({ bitrate: AUDIO_BPS }) };
    }
    const conv = await mb.Conversion.init({
      input, output, tracks: 'primary', video, audio, showWarnings: false,
      ...(plan.trimmed ? { trim: { start: plan.start, end: plan.end } } : {}),
    });
    V.conv = conv;
    if (!conv.isValid) {
      const why = conv.discardedTracks.map((d) => `${d.track.type}: ${d.reason}`).join(', ');
      throw new Error(`แปลงไฟล์นี้ไม่ได้ (${why})`);
    }
    conv.onProgress = (p) => {
      const pct = Math.min(100, p * 100);
      $('#v-bar').style.width = `${pct}%`;
      $('#v-pct').textContent = `${pct.toFixed(pct < 10 ? 1 : 0)}%`;
      const el = (performance.now() - t0) / 1000;
      if (p >= 0.995) $('#v-eta').textContent = 'กำลังปิดไฟล์…';
      else if (p > 0.015) $('#v-eta').textContent = `เหลืออีกประมาณ ${fmtDuration((el / p) * (1 - p))}`;
    };
    await conv.execute();

    let outFile;
    if (writable) {
      outFile = await handle.getFile();
    } else {
      outFile = new File([target.buffer], outName, { type: 'video/mp4' });
      download(outFile, outName);
    }
    await showResult(outFile, outName, (performance.now() - t0) / 1000, !writable);
  } catch (err) {
    if (V.cancelled || err?.name === 'ConversionCanceledError') {
      try { await handle?.remove?.(); } catch { /* ลบไฟล์ครึ่งทางไม่ได้ก็ปล่อย */ }
      $('#v-result').className = 'result bad';
      $('#v-result').innerHTML = '<p>ยกเลิกแล้ว</p>';
    } else {
      console.error(err);
      try { await writable?.abort?.(); } catch { /* ปิดไปแล้ว */ }
      $('#v-result').className = 'result bad';
      $('#v-result').innerHTML = `<h3>แปลงไม่สำเร็จ</h3><p>${esc(err.message || err)}</p>
        <p class="small">ถ้าเกิดซ้ำ ทักเพจศรีโค้ดบูรณ์พร้อมบอกชนิดไฟล์ (${esc(info.container)} ${esc(info.codecName)}) และเบราว์เซอร์ที่ใช้</p>`;
    }
    $('#v-result').hidden = false;
  } finally {
    input.dispose?.();
    removeEventListener('beforeunload', guard);
    try { await wake?.release(); } catch { /* ปล่อยไปแล้ว */ }
    V.busy = false; V.conv = null;
    $('#v-progress').hidden = true;
    $('#v-go').disabled = false; $('#v-reset').disabled = false;
  }
}

// เปิดไฟล์ที่ได้มาตรวจซ้ำ: ยาวเท่าไร ขนาดเท่าไร เป็น H.264 จริงไหม
async function showResult(outFile, outName, secs, downloaded) {
  const mb = await lib();
  const limit = kindLimit(), targetMB = Number($('#v-target').value);
  let dur = null, codec = null;
  const input = new mb.Input({ source: new mb.BlobSource(outFile), formats: mb.ALL_FORMATS });
  try {
    dur = await input.computeDuration();
    codec = await (await input.getPrimaryVideoTrack())?.getCodec();
  } catch { /* อ่านซ้ำไม่ได้ก็แสดงเท่าที่มี */ } finally { input.dispose?.(); }
  const sizeOk = outFile.size <= targetMB * MB;
  const durOk = dur == null || dur <= limit + 0.5;
  const good = sizeOk && durOk && (codec == null || codec === 'avc');
  // สถานะด้านบนยังเป็นของไฟล์ต้นฉบับ ("ต้องแปลงก่อนส่ง") — เปลี่ยนให้ตรงกับไฟล์ใหม่
  if (good) setStatus('ok', 'แปลงเสร็จ ไฟล์ใหม่ผ่านเกณฑ์', `${esc(outName)} · ${fmtSize(outFile.size)}${dur != null ? ` · ${fmtTime(dur)}` : ''}`);
  $('#v-result').className = good ? 'result' : 'result bad';
  $('#v-result').innerHTML = `
    <h3>${good ? 'เสร็จแล้ว พร้อมอัปโหลด' : 'เสร็จแล้ว แต่ยังไม่ผ่านเกณฑ์'}</h3>
    <p><b>${esc(outName)}</b> · ${fmtSize(outFile.size)}${dur != null ? ` · ยาว ${fmtTime(dur)}` : ''} · ใช้เวลา ${fmtDuration(secs)}</p>
    ${!sizeOk ? `<p>ไฟล์ใหญ่กว่า ${targetMB} MB เล็กน้อย เลือกขนาดเล็กลงหนึ่งขั้นแล้วแปลงใหม่</p>` : ''}
    ${!durOk ? `<p>ความยาวยังเกิน ${limit / 60} นาที ตั้งเวลาจบให้สั้นลง</p>` : ''}
    <p class="small">${downloaded ? 'ไฟล์อยู่ในโฟลเดอร์ดาวน์โหลด' : 'ไฟล์บันทึกไว้ตรงที่ครูเลือก'} · เปิดดูให้จบก่อนส่ง แล้วติ๊กเช็กลิสต์ด้านล่าง</p>`;
  $('#v-result').hidden = false;
}

// ---------- ผูกเหตุการณ์ ----------
function bindDrop(zone, onFiles) {
  const el = $(zone);
  ['dragenter', 'dragover'].forEach((t) => el.addEventListener(t, () => el.classList.add('over')));
  ['dragleave', 'drop'].forEach((t) => el.addEventListener(t, () => el.classList.remove('over')));
  el.querySelector('input').addEventListener('change', (e) => { if (e.target.files.length) onFiles([...e.target.files]); e.target.value = ''; });
}
bindDrop('#v-drop', (files) => loadVideo(files[0]));
document.querySelectorAll('input[name=kind]').forEach((r) => r.addEventListener('change', renderVideo));
$('#v-target').addEventListener('change', renderVideo);
$('#v-start').addEventListener('input', renderVideo);
$('#v-end').addEventListener('input', renderVideo);
$('#v-go').addEventListener('click', convert);
$('#v-cancel').addEventListener('click', async () => { V.cancelled = true; await V.conv?.cancel(); });
$('#v-reset').addEventListener('click', () => { V.file = V.info = null; $('#v-panel').hidden = true; $('#v-file').click(); });

// ============================ PDF ============================
const P = { items: [] }; // { file, type: 'pdf'|'img', pages, bytes }
let pdfPromise;
const pdfLib = () => (pdfPromise ??= import('./vendor/pdf-lib.esm.min.js'));

async function addPdfFiles(files) {
  const { PDFDocument } = await pdfLib();
  for (const file of files) {
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isImg = /^image\/(jpeg|png)$/.test(file.type) || /\.(jpe?g|png)$/i.test(file.name);
    if (!isPdf && !isImg) continue;
    if (isImg) { P.items.push({ file, type: 'img', pages: 1 }); continue; }
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      P.items.push({ file, type: 'pdf', pages: doc.getPageCount(), bytes });
    } catch (e) {
      console.error(e);
      P.items.push({ file, type: 'bad', pages: 0 });
    }
  }
  renderPdf();
}

function parsePages(str, total) {
  const t = str.trim();
  if (!t) return Array.from({ length: total }, (_, i) => i);
  const out = [];
  for (const part of t.split(/[,\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) throw new Error(`อ่าน "${part}" ไม่ออก พิมพ์แบบ 1-5, 8`);
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b > total || a > b) throw new Error(`หน้า ${part} ไม่มี (ทั้งชุดมี ${total} หน้า)`);
    for (let i = a; i <= b; i++) out.push(i - 1);
  }
  return out;
}

function renderPdf() {
  $('#p-panel').hidden = !P.items.length;
  let n = 0;
  $('#p-list').innerHTML = P.items.map((it, i) => {
    const from = n + 1; n += it.pages;
    const pg = it.type === 'bad' ? 'เปิดไม่ได้ (อาจติดรหัส)' : it.pages === 1 ? `หน้า ${from}` : `หน้า ${from}–${n}`;
    return `<li><span class="nm" title="${esc(it.file.name)}">${esc(it.file.name)}</span><span class="pg">${pg}</span>
      <button type="button" data-a="up" data-i="${i}" aria-label="เลื่อนขึ้น" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button type="button" data-a="down" data-i="${i}" aria-label="เลื่อนลง" ${i === P.items.length - 1 ? 'disabled' : ''}>↓</button>
      <button type="button" data-a="del" data-i="${i}" aria-label="เอาออก">×</button></li>`;
  }).join('');
  const total = n;
  try {
    const sel = parsePages($('#p-pages').value, total);
    const over = sel.length > 10;
    $('#p-plan').innerHTML = `ได้ PDF <b>${sel.length} หน้า</b>${over ? ' · <span style="color:var(--pink)">เกิน 10 หน้า ถ้าเป็นไฟล์ผลงานนักเรียนให้เลือกหน้าที่สำคัญที่สุด</span>' : ''}`;
    $('#p-go').disabled = !sel.length;
  } catch (e) {
    $('#p-plan').innerHTML = `<span style="color:var(--pink)">${esc(e.message)}</span>`;
    $('#p-go').disabled = true;
  }
}

// รูปถ่ายจากมือถือใหญ่หลาย MB — ย่อด้านยาวเหลือ 1754px (A4 ที่ 150 dpi) แล้วบีบเป็น JPEG
async function imageToJpeg(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, 1754 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
  return { bytes: await blob.arrayBuffer(), w, h };
}

async function buildPdf() {
  const { PDFDocument } = await pdfLib();
  const total = P.items.reduce((a, it) => a + it.pages, 0);
  let sel;
  try { sel = new Set(parsePages($('#p-pages').value, total)); } catch { return; }
  $('#p-go').disabled = true;
  $('#p-result').hidden = true;
  try {
    const out = await PDFDocument.create();
    let n = 0;
    for (const it of P.items) {
      const from = n; n += it.pages;
      const idx = Array.from({ length: it.pages }, (_, i) => i).filter((i) => sel.has(from + i));
      if (!idx.length) continue;
      if (it.type === 'pdf') {
        const src = await PDFDocument.load(it.bytes, { ignoreEncryption: true });
        (await out.copyPages(src, idx)).forEach((p) => out.addPage(p));
      } else if (it.type === 'img') {
        const { bytes, w, h } = await imageToJpeg(it.file);
        const img = await out.embedJpg(bytes);
        const [pw, ph] = w > h ? [841.89, 595.28] : [595.28, 841.89]; // A4 ตามแนวรูป
        const m = 24, s = Math.min((pw - 2 * m) / w, (ph - 2 * m) / h);
        const page = out.addPage([pw, ph]);
        page.drawImage(img, { x: (pw - w * s) / 2, y: (ph - h * s) / 2, width: w * s, height: h * s });
      }
    }
    const bytes = await out.save();
    const name = `${($('#p-name').value.trim() || 'เอกสาร').replace(/[\\/:*?"<>|]/g, '-')}.pdf`;
    download(new Blob([bytes], { type: 'application/pdf' }), name);
    $('#p-result').className = 'result';
    $('#p-result').innerHTML = `<h3>สร้าง PDF แล้ว</h3><p><b>${esc(name)}</b> · ${out.getPageCount()} หน้า · ${fmtSize(bytes.length)} · อยู่ในโฟลเดอร์ดาวน์โหลด</p>`;
  } catch (e) {
    console.error(e);
    $('#p-result').className = 'result bad';
    $('#p-result').innerHTML = `<h3>สร้างไม่สำเร็จ</h3><p>${esc(e.message || e)}</p>`;
  } finally {
    $('#p-result').hidden = false;
    $('#p-go').disabled = false;
  }
}

bindDrop('#p-drop', addPdfFiles);
$('#p-list').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const i = Number(b.dataset.i), a = b.dataset.a;
  if (a === 'del') P.items.splice(i, 1);
  if (a === 'up' && i > 0) [P.items[i - 1], P.items[i]] = [P.items[i], P.items[i - 1]];
  if (a === 'down' && i < P.items.length - 1) [P.items[i + 1], P.items[i]] = [P.items[i], P.items[i + 1]];
  renderPdf();
});
$('#p-pages').addEventListener('input', renderPdf);
$('#p-go').addEventListener('click', buildPdf);
$('#p-reset').addEventListener('click', () => { P.items = []; $('#p-pages').value = ''; $('#p-result').hidden = true; renderPdf(); });

// ============================ เช็กลิสต์ + แชร์ ============================
const checks = store('dpa-check') || {};
const boxes = [...document.querySelectorAll('#checklist input')];
function countChecks() {
  const done = boxes.filter((b) => b.checked).length;
  $('#check-count').textContent = done === boxes.length ? 'ครบทุกข้อแล้ว ขอให้ผ่านการประเมินนะครับ' : `ทำแล้ว ${done} จาก ${boxes.length} ข้อ`;
}
boxes.forEach((b) => {
  b.checked = !!checks[b.dataset.k];
  b.addEventListener('change', () => { checks[b.dataset.k] = b.checked; store('dpa-check', checks); countChecks(); });
});
countChecks();

const pageUrl = location.origin + location.pathname;
$('#share-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
$('#share-line').href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}`;
$('#share-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(pageUrl); $('#share-copy').textContent = 'คัดลอกแล้ว'; } catch { prompt('คัดลอกลิงก์นี้', pageUrl); }
});
