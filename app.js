// DPA พร้อมส่ง — แปลง/ลดขนาดคลิปด้วย WebCodecs (Mediabunny) และจัด PDF (pdf-lib) ในเบราว์เซอร์ทั้งหมด
// เกณฑ์อ้างอิง: ว15/2565 (รูปแบบไฟล์วีดิทัศน์), คู่มือระบบ DPA ของ ก.ค.ศ. และคู่มือ HandBrake สำหรับ DPA ของ ก.ค.ศ.
const $ = (s) => document.querySelector(s);
const MB = 1_000_000;
const AUDIO_BPS = 128_000;
const SAFETY = 0.93; // เผื่อ bitrate แกว่ง ให้ไฟล์จริงไม่เกินเป้า
const EPS = 0.001; // เกณฑ์เขียนว่า "ไม่เกิน" จึงไม่เผื่อความยาว
const TEACH = 3600;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtSize = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(b < 1e7 ? 1 : 0)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
const thaiDigits = (s) => s.replace(/[๐-๙]/g, (d) => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(d)));
function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec + 1e-6));
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
// "1:30" = 1 นาที 30 วินาที · "1:02:05" = ชม:นาที:วินาที · เลขเดียว = นาที · รับเลขไทย
function parseTime(str) {
  const t = thaiDigits(str).trim().replace(/[.,]/g, ':');
  if (!t) return null;
  const parts = t.split(':');
  if (parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return NaN;
  const n = parts.map(Number);
  if (n.length === 1) return n[0] * 60;
  if (n.slice(1).some((v) => v >= 60)) return NaN; // นาที/วินาทีต้องไม่เกิน 59
  return n.reduce((a, v) => a * 60 + v, 0);
}
function baseName(name) { return name.replace(/\.[^.]+$/, ''); }
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  return url;
}
function store(key, value) { try { if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(value)); } catch { return null; } }

// ---------- ตรวจความสามารถเบราว์เซอร์ ----------
const canCodec = 'VideoEncoder' in window && 'VideoDecoder' in window;
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
(() => {
  const b = $('#support-banner');
  if (!canCodec) {
    b.innerHTML = '<b>เบราว์เซอร์นี้แปลงคลิปไม่ได้</b> กรุณาเปิดหน้านี้ด้วย Google Chrome หรือ Microsoft Edge บนคอมพิวเตอร์ (ส่วนจัด PDF ใช้ได้ตามปกติ)';
    b.hidden = false;
  } else if (isMobile) {
    b.innerHTML = '<b>ใช้บนมือถือได้ แต่แนะนำคอมพิวเตอร์</b> คลิปยาว 60 นาทีบนมือถืออาจช้ามากหรือหน่วยความจำไม่พอ';
    b.hidden = false;
  }
})();

let mbPromise;
const lib = () => (mbPromise ??= import('./vendor/mediabunny.min.mjs'));
if (canCodec) setTimeout(lib, 1500);

// ============================ คลิป ============================
const V = { file: null, info: null, plan: null, busy: false, conv: null, cancelled: false, url: null };

const kindLimit = () => Number(document.querySelector('input[name=kind]:checked').value);
const kindLabel = () => document.querySelector('input[name=kind]:checked').dataset.label;
const isTeach = () => kindLimit() === TEACH;

const REASON = {
  undecodable_source_codec: 'เบราว์เซอร์หรือเครื่องนี้เปิด{what}แบบนี้ไม่ได้',
  no_encodable_target_codec: 'เบราว์เซอร์นี้สร้าง{what}แบบมาตรฐาน (H.264/AAC) ไม่ได้',
  unknown_source_codec: 'ไม่รู้จักรูปแบบ{what}ของไฟล์นี้',
};
function trackProblem(conv, type) {
  const d = conv.discardedTracks.find((x) => x.track.type === type);
  const what = type === 'video' ? 'ภาพ' : 'เสียง';
  return (REASON[d?.reason] || 'แปลง{what}ของไฟล์นี้ไม่ได้').replace('{what}', what);
}
const ADVICE = 'ลองใช้ Google Chrome หรือ Microsoft Edge รุ่นล่าสุดบนคอมพิวเตอร์ ถ้ายังไม่ได้ ทักเพจศรีโค้ดบูรณ์พร้อมบอกชนิดไฟล์';

function trimRange() {
  const info = V.info;
  const s = parseTime($('#v-start').value), e = parseTime($('#v-end').value);
  const start = s == null ? 0 : s, end = e == null ? info.dur : e;
  if (Number.isNaN(start) || Number.isNaN(end)) return { error: 'พิมพ์เวลาเป็น นาที:วินาที เช่น 0:45 หรือ 58:30 (วินาทีไม่เกิน 59)' };
  if (start >= info.dur) return { error: `เวลาเริ่มเกินความยาวคลิป (${fmtTime(info.dur)})` };
  if (end <= start) return { error: 'เวลาจบต้องมากกว่าเวลาเริ่ม' };
  return { start, end: Math.min(end, info.dur), trimmed: start > 0.05 || end < info.dur - 0.05 };
}

const QUALITY = { 720: 'คมชัดระดับ HD (720p)', 540: 'ระดับ 540p ชัดพอใช้', 480: 'ระดับ 480p ต่ำสุดที่ ก.ค.ศ. แนะนำ' };

function makePlan(info, keep, targetMB) {
  const copySize = info.size * (keep / info.dur);
  const audioAac = !info.acodec || info.acodec === 'aac';
  const reasons = [];
  if (!info.isMp4) reasons.push(info.container === 'MP4' ? `นามสกุล .${info.ext} ควรเป็น .mp4` : `ไฟล์เป็น ${info.container} ต้องเป็น MP4`);
  if (info.codec !== 'avc') reasons.push(`ภาพเป็นแบบ ${info.codecName} บางเครื่องเปิดไม่ได้ ต้องแปลงเป็น MP4 มาตรฐาน`);
  if (!audioAac) reasons.push(`เสียงเป็นแบบ ${info.acodec.toUpperCase()} ต้องแปลงเป็น AAC`);
  if (copySize > targetMB * MB * 0.97) reasons.push(`ขนาดประมาณ ${fmtSize(copySize)} เกิน ${fmtSize(targetMB * MB)}`);

  // ภาพเป็น H.264 และขนาดไม่เกิน: คัดลอกภาพเดิม (เร็ว ภาพเท่าต้นฉบับ) แปลงแค่เสียงถ้าไม่ใช่ AAC
  if (info.codec === 'avc' && copySize <= targetMB * MB * 0.97) {
    if (audioAac) return { mode: 'copy', audioMode: 'copy', estSize: copySize, reasons };
    if (info.caps.aacEnc) return { mode: 'copy', audioMode: 'encode', estSize: copySize, reasons };
    return { mode: 'copy', error: 'เบราว์เซอร์นี้แปลงเสียงเป็น AAC ไม่ได้ ใช้ Chrome หรือ Edge บนคอมพิวเตอร์', reasons };
  }

  // เสียง: แปลงเป็น AAC 128 kbps เพื่อคุมขนาดได้แม่น ถ้าเบราว์เซอร์สร้าง AAC ไม่ได้แต่ต้นฉบับเป็น AAC อยู่แล้วจึงคัดลอก
  let audioMode = 'none', abps = 0;
  if (info.acodec) {
    if (info.caps.aacEnc) { audioMode = 'encode'; abps = AUDIO_BPS; }
    else if (audioAac) { audioMode = 'copy'; abps = info.abps || 256_000; }
    else return { mode: 'transcode', error: 'เบราว์เซอร์นี้แปลงเสียงเป็น AAC ไม่ได้ ใช้ Chrome หรือ Edge บนคอมพิวเตอร์', reasons };
  }
  const budget = (targetMB * MB * 8 * SAFETY) / keep;
  let vbps = budget - abps;
  // สูงสุด 720p ตามที่ ก.ค.ศ. แนะนำ และทดสอบแล้วตัวเข้ารหัสฮาร์ดแวร์ที่ 1080p ใช้ bitrate เกินที่ตั้งเกือบ 2 เท่า
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
    mode: 'transcode', vbps, width, height, fps, reasons, audioMode, tShort,
    tooSmall: vbps < 250_000,
    estSize: ((vbps + abps) * keep) / 8,
  };
}

function setStatus(kind, title, detail = '') {
  $('#v-status').className = `status ${kind}`;
  $('#v-status').innerHTML = `<i class="dot"></i><div><b>${title}</b>${detail ? `<span>${detail}</span>` : ''}</div>`;
}

function setRule() {
  $('#v-rule').innerHTML = isTeach()
    ? '<b>คลิปการสอนต้องถ่ายต่อเนื่องครั้งเดียว</b> ตัดได้เฉพาะช่วงตั้งกล้องก่อนเริ่มสอนหรือหลังจบคาบ ห้ามตัดกลางคลิปและห้ามเร่งความเร็ว'
    : 'คลิปนี้ตัดต่อได้ ความยาวรวมไม่เกิน 10 นาที';
  $('#v-planmin-wrap').hidden = !isTeach();
}

// เทียบความยาวคลิปกับเวลาในแผน (กรรมการดูว่าตรงกันไหม)
function planTimeNote(keep) {
  if (!isTeach()) return '';
  const n = Number(thaiDigits($('#v-planmin').value.trim()));
  if (!n || n <= 0) return '';
  const clipMin = keep / 60;
  if (Math.abs(clipMin - n) < 1) return `<span class="plan-ok">ความยาวคลิปตรงกับเวลาในแผน (${n} นาที)</span>`;
  return `<span class="plan-warn">คลิปยาว ${fmtDuration(keep)} แต่แผนเขียน ${n} นาที กรรมการอาจให้ไม่ผ่าน ควรแก้เวลาในแผนให้ตรงกับคลิปจริง</span>`;
}

function renderVideo() {
  setRule();
  const info = V.info;
  V.plan = null;
  if (!info || V.busy) return;
  const limit = kindLimit();
  const targetMB = Number($('#v-target').value);
  const go = $('#v-go');
  go.hidden = false; go.disabled = true;
  $('#v-facts').innerHTML = [
    ['ไฟล์', esc(info.name), 'th'],
    ['ความยาว', `<span class="${info.dur > limit + EPS ? 'over' : ''}">${fmtTime(info.dur)}</span>`],
    ['ขนาด', fmtSize(info.size)],
    ['ภาพ', `${info.dw}×${info.dh}${info.fps ? ` · ${Math.round(info.fps)} fps` : ''}`],
    ['ชนิดไฟล์', `${info.container} · ${info.codecName}${info.acodec ? ` + ${info.acodec.toUpperCase()}` : ' · ไม่มีเสียง'}`],
  ].map(([k, v, c]) => `<div><dt>${k}</dt><dd class="${c || ''}">${v}</dd></div>`).join('');
  $('#v-end').placeholder = fmtTime(info.dur);

  if (!info.caps.vDecode) {
    setStatus('bad', 'เครื่องนี้เปิดภาพของไฟล์นี้ไม่ได้', `ภาพแบบ ${esc(info.codecName)} ต้องใช้ตัวถอดรหัสที่เครื่องนี้ไม่มี · ${ADVICE}${info.codec === 'hevc' ? ' · บน Windows อาจต้องติดตั้ง "HEVC Video Extensions" จาก Microsoft Store' : ''}`);
    $('#v-plan').textContent = '';
    return;
  }
  if (info.acodec && !info.caps.aDecode) {
    setStatus('bad', 'เครื่องนี้เปิดเสียงของไฟล์นี้ไม่ได้', `เสียงแบบ ${esc(info.acodec.toUpperCase())} ถ้าแปลงต่อจะได้คลิปไม่มีเสียง · ${ADVICE}`);
    $('#v-plan').textContent = '';
    return;
  }

  const tr = trimRange();
  if (tr.error) { setStatus('bad', 'เวลาตัดหัว-ตัดท้ายไม่ถูกต้อง', tr.error); $('#v-plan').textContent = ''; return; }
  const keep = tr.end - tr.start;
  const note = planTimeNote(keep);
  if (keep > limit + EPS) {
    const over = fmtDuration(keep - limit);
    if (isTeach()) {
      setStatus('bad', `คลิปการสอนยาว ${fmtTime(keep)} เกิน 60 นาทีไป ${over}`,
        'ตัดได้เฉพาะช่วงตั้งกล้องก่อนเริ่มสอนหรือหลังจบคาบ ในช่อง "ตัดหัว-ตัดท้าย" ห้ามตัดกลางคลิปหรือเร่งความเร็ว ถ้าตัวบทเรียนเองยาวเกิน 60 นาทีควรถ่ายใหม่');
    } else {
      setStatus('bad', `${kindLabel()} ยาว ${fmtTime(keep)} เกิน 10 นาทีไป ${over}`,
        `ตั้งเวลาในช่อง "ตัดหัว-ตัดท้าย" หรือ <button type="button" class="btn btn-small btn-gold" id="v-autotrim">ตัดท้ายให้เหลือ ${fmtTime(limit - 1)}</button>`);
      $('#v-autotrim').onclick = () => { $('#v-end').value = fmtTime(tr.start + limit - 1); renderVideo(); };
    }
    $('#v-plan').innerHTML = note;
    return;
  }
  const plan = makePlan(info, keep, targetMB);
  if (plan.error) { setStatus('bad', 'แปลงไฟล์นี้ในเบราว์เซอร์นี้ไม่ได้', plan.error); $('#v-plan').textContent = ''; return; }
  if (plan.mode === 'copy' && !plan.reasons.length && !tr.trimmed) {
    setStatus('ok', 'ไฟล์นี้พร้อมส่งแล้ว ไม่ต้องแปลง', `MP4 ขนาด ${fmtSize(info.size)} ความยาว ${fmtTime(info.dur)} อยู่ในเกณฑ์`);
    $('#v-plan').innerHTML = note;
    go.hidden = true;
    return;
  }
  const why = [...plan.reasons.map(esc), tr.trimmed ? `ตัดหัว-ตัดท้าย เหลือ ${fmtTime(tr.start)}–${fmtTime(tr.end)}` : ''].filter(Boolean);
  setStatus('warn', 'ต้องแปลงก่อนส่ง', why.join(' · '));
  if (plan.mode === 'copy') {
    const what = [!info.isMp4 && 'เปลี่ยนเป็น MP4', plan.audioMode === 'encode' && 'แปลงเสียงเป็น AAC', tr.trimmed && 'ตัดหัว-ตัดท้าย'].filter(Boolean).join(' และ');
    $('#v-plan').innerHTML = `<b>แปลงแบบเร็ว ภาพเท่าต้นฉบับ</b> ${what} · ได้ไฟล์ประมาณ <b>${fmtSize(plan.estSize)}</b> · ใช้เวลาไม่กี่นาที${note ? `<br>${note}` : ''}`;
  } else if (plan.tooSmall) {
    $('#v-plan').innerHTML = `คลิปยาว ${fmtDuration(keep)} ถ้าลดเหลือ ${fmtSize(targetMB * MB)} ภาพจะไม่ชัด <b>กรุณาเลือกขนาดใหญ่ขึ้น</b>`;
    return;
  } else {
    const q = QUALITY[plan.tShort] || `ขนาดภาพ ${plan.width}×${plan.height}`;
    const hint = plan.tShort < 720 && targetMB < 1000 && Math.min(info.dw, info.dh) >= 720 ? ' · ถ้าต้องการภาพชัดระดับ HD เลือกขนาด 1 GB' : '';
    $('#v-plan').innerHTML = `ได้ไฟล์ MP4 <b>${q}</b> ขนาดประมาณ <b>${fmtSize(plan.estSize)}</b>
      <br><span class="muted small">ขนาดลดลงมากเป็นเรื่องปกติ ไม่ผิดเกณฑ์${hint} · เครื่องทั่วไปใช้เวลาราว 1/4 ถึง 1 เท่าของความยาวคลิป</span>${note ? `<br>${note}` : ''}`;
  }
  V.plan = { ...plan, ...tr };
  go.disabled = !canCodec && plan.mode === 'transcode';
}

async function loadVideo(file) {
  if (V.busy) { $('#v-eta').textContent = 'กำลังแปลงไฟล์อยู่ รอให้เสร็จหรือกดยกเลิกก่อนเลือกไฟล์ใหม่'; return; }
  V.file = file; V.info = null; V.plan = null;
  $('#v-panel').hidden = false;
  $('#v-result').hidden = true;
  $('#v-progress').hidden = true;
  $('#v-start').value = ''; $('#v-end').value = '';
  $('#v-facts').innerHTML = '';
  $('#v-plan').textContent = '';
  $('#v-go').hidden = false; $('#v-go').disabled = true;
  setStatus('warn', 'กำลังอ่านไฟล์…', esc(file.name));
  let input;
  try {
    const mb = await lib();
    input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    let mime;
    try { mime = await input.getMimeType(); } catch { throw new Error('ไฟล์นี้ไม่ใช่วิดีโอที่รองรับ หรือไฟล์เสีย/คัดลอกมาไม่ครบ'); }
    const [dur, vt, at] = await Promise.all([input.computeDuration(), input.getPrimaryVideoTrack(), input.getPrimaryAudioTrack()]);
    if (!vt) throw new Error('ไม่พบภาพในไฟล์ อาจเป็นไฟล์เสียงอย่างเดียว หรือไฟล์คัดลอกมาไม่ครบ');
    if (!(dur > 0)) throw new Error('อ่านความยาวคลิปไม่ได้ ไฟล์อาจเสียหรือคัดลอกมาไม่ครบ');
    const [codec, dw, dh, stats, acodec, vDecode, aDecode, abps] = await Promise.all([
      vt.getCodec(), vt.getDisplayWidth(), vt.getDisplayHeight(), vt.computePacketStats(120).catch(() => null),
      at ? at.getCodec() : null, vt.canDecode().catch(() => false), at ? at.canDecode().catch(() => false) : true,
      at ? at.getBitrate().catch(() => null) : null,
    ]);
    const aacEnc = await mb.canEncodeAudio('aac', { numberOfChannels: 2, sampleRate: 48000, bitrate: AUDIO_BPS }).catch(() => false);
    const base = mime.split(';')[0].trim(); // อย่าดูส่วน codecs (MKV มีคำว่า mp4a)
    const ext = (file.name.match(/\.([^.]+)$/)?.[1] || '').toLowerCase();
    const container = base === 'video/quicktime' ? 'MOV' : base === 'video/mp4' ? 'MP4' : base === 'video/webm' ? 'WebM'
      : base.includes('matroska') ? 'MKV' : (base.split('/')[1] || '?').toUpperCase();
    const codecNames = { avc: 'H.264', hevc: 'HEVC (H.265)', vp9: 'VP9', vp8: 'VP8', av1: 'AV1', prores: 'ProRes' };
    V.info = {
      name: file.name, size: file.size, dur, dw, dh, codec, acodec, container, ext,
      isMp4: container === 'MP4' && ext === 'mp4', codecName: codecNames[codec] || (codec ? String(codec).toUpperCase() : 'ไม่ทราบ'),
      fps: stats?.averagePacketRate || 0, abps, caps: { vDecode, aDecode, aacEnc },
    };
    renderVideo();
  } catch (err) {
    console.error(err);
    const msg = /[ก-๙]/.test(err?.message || '') ? err.message : 'ไฟล์นี้ไม่ใช่วิดีโอที่รองรับ หรือไฟล์เสีย/คัดลอกมาไม่ครบ';
    setStatus('bad', 'อ่านไฟล์นี้ไม่ได้', `${esc(msg)} · ลองเปิดคลิปในเครื่องดูก่อน ถ้าเปิดได้ ทักเพจศรีโค้ดบูรณ์พร้อมบอกชนิดไฟล์`);
    $('#v-go').hidden = true;
  } finally {
    input?.dispose?.();
  }
}

let wake = null;
async function keepAwake() { try { wake = await navigator.wakeLock?.request('screen'); } catch { /* ไม่รองรับก็ไม่เป็นไร */ } }
document.addEventListener('visibilitychange', () => { if (V.busy && document.visibilityState === 'visible') keepAwake(); });

async function convert() {
  if (V.busy || !V.file || !V.info || !V.plan) return;
  V.busy = true; // ตั้งก่อน await ทุกตัว กันกดซ้ำแล้วแปลงซ้อน
  const go = $('#v-go');
  go.disabled = true; $('#v-reset').disabled = true;
  const { file, info, plan } = V;
  const outName = `${baseName(file.name)}-DPA.mp4`;
  let handle = null, writable = null, input = null;
  const guard = (e) => { e.preventDefault(); e.returnValue = ''; };
  const t0 = performance.now();
  try {
    const mb = await lib();
    // เลือกที่บันทึก (Chrome/Edge) — เขียนลงดิสก์ตรง
    if (window.showSaveFilePicker) {
      try {
        handle = await window.showSaveFilePicker({ suggestedName: outName, types: [{ description: 'วิดีโอ MP4', accept: { 'video/mp4': ['.mp4'] } }] });
        writable = await handle.createWritable();
      } catch (e) {
        if (e.name === 'AbortError') throw e;
        handle = null; writable = null; // เปิดหน้าต่างบันทึกไม่ได้ → เก็บในหน่วยความจำแล้วดาวน์โหลด
      }
    }
    V.cancelled = false;
    $('#v-result').hidden = true;
    $('#v-progress').hidden = false;
    $('#v-bar').style.width = '0%'; $('#v-pct').textContent = '0%'; $('#v-eta').textContent = 'กำลังเริ่ม…';
    await keepAwake();
    addEventListener('beforeunload', guard);

    // Web Optimized (ข้อมูลดัชนีอยู่ต้นไฟล์) ตามคำแนะนำของ ก.ค.ศ. — เครื่องแรมน้อยมากที่เขียนลงดิสก์จึงยอมวางดัชนีท้ายไฟล์
    const fastStart = writable && (navigator.deviceMemory ?? 8) < 4 ? false : 'in-memory';
    const target = writable ? new mb.StreamTarget(writable, { chunked: true }) : new mb.BufferTarget();
    input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart }), target });

    let video, audio;
    const aacEncode = { codec: 'aac', forceTranscode: true, quality: new mb.Quality({ bitrate: AUDIO_BPS }) };
    if (plan.mode === 'copy') {
      video = { codec: 'avc' };
      audio = plan.audioMode === 'encode' ? aacEncode : { codec: 'aac' };
    } else {
      const ok = await mb.canEncodeVideo('avc', { width: plan.width, height: plan.height, bitrate: plan.vbps });
      if (!ok) throw new Error(`เครื่องนี้สร้างไฟล์ภาพแบบ H.264 ไม่ได้ · ${ADVICE}`);
      video = {
        // forceTranscode: ถ้าขนาดภาพเท่าต้นฉบับ ไลบรารีจะคัดลอกภาพเดิมโดยไม่ลดขนาด
        codec: 'avc', width: plan.width, height: plan.height, fit: 'contain', forceTranscode: true,
        quality: new mb.Quality({ bitrate: plan.vbps, bitrateMode: 'variable' }),
        ...(plan.fps ? { frameRate: plan.fps } : {}),
      };
      audio = plan.audioMode === 'encode' ? aacEncode : { codec: 'aac' };
    }
    const conv = await mb.Conversion.init({
      input, output, tracks: 'primary', video, audio, showWarnings: false,
      ...(plan.trimmed ? { trim: { start: plan.start, end: plan.end } } : {}),
    });
    V.conv = conv;
    // ห้ามปล่อยให้ได้ไฟล์ที่ภาพหรือเสียงหายไปเงียบ ๆ
    const used = (type) => conv.utilizedTracks.some((t) => t.type === type);
    if (!used('video')) throw new Error(`${trackProblem(conv, 'video')} · ${ADVICE}`);
    if (info.acodec && !used('audio')) throw new Error(`${trackProblem(conv, 'audio')} ถ้าแปลงต่อจะได้คลิปไม่มีเสียง · ${ADVICE}`);
    if (!conv.isValid) throw new Error(`แปลงไฟล์นี้ไม่ได้ · ${ADVICE}`);

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
      if (V.url) URL.revokeObjectURL(V.url);
      V.url = download(outFile, outName);
    }
    await showResult(outFile, outName, (performance.now() - t0) / 1000, !writable);
  } catch (err) {
    const cancelled = V.cancelled || err?.name === 'ConversionCanceledError';
    if (err?.name !== 'AbortError') {
      try { await writable?.abort?.(); } catch { /* ปิดไปแล้ว */ }
      try { await handle?.remove?.(); } catch { /* ลบไฟล์ครึ่งทางไม่ได้ก็ปล่อย */ }
      if (!cancelled) console.error(err);
      const msg = /[ก-๙]/.test(err?.message || '') ? err.message : `เกิดข้อผิดพลาดระหว่างแปลง · ${ADVICE}`;
      $('#v-result').className = 'result bad';
      $('#v-result').innerHTML = cancelled ? '<p>ยกเลิกแล้ว ไม่มีไฟล์ค้างในเครื่อง</p>'
        : `<h3>แปลงไม่สำเร็จ</h3><p>${esc(msg)}</p><p class="small">ชนิดไฟล์: ${esc(info.container)} · ${esc(info.codecName)}${info.acodec ? ` + ${esc(info.acodec.toUpperCase())}` : ''}</p>`;
      $('#v-result').hidden = false;
    }
  } finally {
    input?.dispose?.();
    removeEventListener('beforeunload', guard);
    try { await wake?.release(); } catch { /* ปล่อยไปแล้ว */ }
    wake = null;
    V.busy = false; V.conv = null;
    $('#v-progress').hidden = true;
    $('#v-reset').disabled = false;
    go.disabled = !V.plan;
  }
}

// เปิดไฟล์ที่ได้มาตรวจซ้ำ: มีภาพ H.264 จริงไหม มีเสียงไหม ยาวเท่าไร ขนาดเท่าไร
async function showResult(outFile, outName, secs, downloaded) {
  const mb = await lib();
  const limit = kindLimit(), targetMB = Number($('#v-target').value);
  let dur = null, vcodec = null, hasAudio = false, readOk = true;
  const input = new mb.Input({ source: new mb.BlobSource(outFile), formats: mb.ALL_FORMATS });
  try {
    dur = await input.computeDuration();
    vcodec = await (await input.getPrimaryVideoTrack())?.getCodec() ?? null;
    hasAudio = !!(await input.getPrimaryAudioTrack());
  } catch { readOk = false; } finally { input.dispose?.(); }
  const problems = [];
  if (!readOk) problems.push('เปิดไฟล์ผลลัพธ์ตรวจซ้ำไม่ได้ ไฟล์อาจเสีย ให้ลองแปลงใหม่');
  if (readOk && vcodec !== 'avc') problems.push('ไฟล์ผลลัพธ์ไม่มีภาพแบบ H.264 ห้ามส่งไฟล์นี้');
  if (readOk && V.info?.acodec && !hasAudio) problems.push('ไฟล์ผลลัพธ์ไม่มีเสียง ห้ามส่งไฟล์นี้');
  if (dur != null && dur > limit + EPS) problems.push(`ความยาว ${fmtTime(dur)} ยังเกิน ${limit / 60} นาที ตั้งเวลาตัดท้ายให้สั้นลง`);
  if (outFile.size > targetMB * MB) {
    const pct = Math.round((outFile.size / (targetMB * MB) - 1) * 100);
    problems.push(`ไฟล์ใหญ่กว่า ${fmtSize(targetMB * MB)} ไป ${pct}% (ภาพต้นฉบับมีรายละเอียดมาก) เลือกขนาดเล็กลงหนึ่งขั้นแล้วแปลงใหม่`);
  }
  const good = !problems.length;
  if (good) setStatus('ok', 'แปลงเสร็จ ไฟล์ใหม่ผ่านเกณฑ์', `${esc(outName)} · ${fmtSize(outFile.size)}${dur != null ? ` · ${fmtTime(dur)}` : ''}`);
  else setStatus('bad', 'ไฟล์ที่ได้ยังไม่ผ่านเกณฑ์', esc(problems[0]));
  $('#v-result').className = good ? 'result' : 'result bad';
  $('#v-result').innerHTML = `
    <h3>${good ? 'เสร็จแล้ว พร้อมอัปโหลด' : 'เสร็จแล้ว แต่ยังไม่ผ่านเกณฑ์'}</h3>
    <p><b>${esc(outName)}</b> · ${fmtSize(outFile.size)}${dur != null ? ` · ยาว ${fmtTime(dur)}` : ''} · ใช้เวลา ${fmtDuration(secs)}</p>
    ${problems.map((p) => `<p>${esc(p)}</p>`).join('')}
    <p class="small">${downloaded ? `ไฟล์อยู่ในโฟลเดอร์ดาวน์โหลด · ถ้าไม่เห็นไฟล์ <a href="${V.url}" download="${esc(outName)}">กดดาวน์โหลดอีกครั้ง</a>` : 'ไฟล์บันทึกไว้ตรงที่ครูเลือก'} · เปิดดูให้จบก่อนส่ง แล้วติ๊กเช็กลิสต์ด้านล่าง</p>`;
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
['#v-target', '#v-start', '#v-end', '#v-planmin'].forEach((s) => $(s).addEventListener(s === '#v-target' ? 'change' : 'input', renderVideo));
$('#v-go').addEventListener('click', convert);
$('#v-cancel').addEventListener('click', async () => { V.cancelled = true; await V.conv?.cancel(); });
$('#v-reset').addEventListener('click', () => { if (V.busy) return; V.file = V.info = V.plan = null; $('#v-panel').hidden = true; $('#v-file').click(); });
setRule();

// ============================ PDF ============================
// รายการ: { file, type: 'pdf'|'img', pages, bytes, caption }
const P = { items: [], notes: [] };
let pdfPromise;
const pdfLib = () => (pdfPromise ??= import('./vendor/pdf-lib.esm.min.js'));
const perPage = () => Number($('#p-per').value);

async function addPdfFiles(files) {
  const { PDFDocument } = await pdfLib();
  P.notes = [];
  for (const file of files) {
    const n = file.name;
    if (/\.hei[cf]$/i.test(n) || /image\/hei[cf]/.test(file.type)) { P.notes.push(`${n}: รูป HEIC ยังใช้ไม่ได้ ส่งรูปผ่าน LINE หรืออีเมลเพื่อให้เป็น JPG ก่อน`); continue; }
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(n);
    const isImg = /^image\/(jpeg|png)$/.test(file.type) || /\.(jpe?g|png)$/i.test(n);
    if (!isPdf && !isImg) { P.notes.push(`${n}: ใช้ได้เฉพาะ PDF, JPG, PNG`); continue; }
    if (isImg) { P.items.push({ file, type: 'img', pages: 1, caption: '' }); continue; }
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes); // ไม่ข้ามการเข้ารหัส: ไฟล์ติดรหัสจะได้หน้าว่าง
      P.items.push({ file, type: 'pdf', pages: doc.getPageCount(), bytes });
    } catch (e) {
      const locked = /encrypt/i.test(`${e?.name} ${e?.message}`);
      P.notes.push(`${n}: ${locked ? 'ไฟล์ติดรหัส ให้เปิดไฟล์แล้วสั่งพิมพ์ (Print) เป็น PDF ใหม่ก่อน' : 'เปิดไฟล์ PDF นี้ไม่ได้ ไฟล์อาจเสีย'}`);
    }
  }
  renderPdf();
}

// จัดหน้า: PDF หน้าละหน้า · รูปที่อยู่ติดกันรวมกันหน้าละ perPage() ภาพ
function layoutPages() {
  const per = perPage(), pages = [];
  let group = [];
  const flush = () => { if (group.length) { pages.push({ type: 'imgs', items: group }); group = []; } };
  for (const it of P.items) {
    if (it.type === 'img') { group.push(it); if (group.length === per) flush(); }
    else { flush(); for (let i = 0; i < it.pages; i++) pages.push({ type: 'pdf', it, i }); }
  }
  flush();
  return pages;
}

function parsePages(str, total) {
  const t = thaiDigits(str).replace(/[–—]/g, '-').replace(/\s*-\s*/g, '-').trim();
  if (!t) return Array.from({ length: total }, (_, i) => i);
  const out = new Set();
  for (const part of t.split(/[,\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) throw new Error(`อ่าน "${part}" ไม่ออก พิมพ์แบบ 1-5, 8`);
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b > total || a > b) throw new Error(`หน้า ${part} ไม่มี (ทั้งชุดมี ${total} หน้า)`);
    for (let i = a; i <= b; i++) out.add(i - 1);
  }
  return [...out].sort((x, y) => x - y); // เรียงตามลำดับในรายการเสมอ
}

function renderPdf(list = true) {
  $('#p-panel').hidden = !P.items.length && !P.notes.length;
  const pages = layoutPages();
  const pageOf = new Map();
  pages.forEach((pg, i) => { (pg.type === 'imgs' ? pg.items : [pg.it]).forEach((it) => { const r = pageOf.get(it) || [i + 1, i + 1]; r[1] = i + 1; pageOf.set(it, r); }); });
  if (list) $('#p-list').innerHTML = P.items.map((it, i) => {
    const [a, b] = pageOf.get(it) || [0, 0];
    const pg = a === b ? `หน้า ${a}` : `หน้า ${a}–${b}`;
    const cap = it.type === 'img' ? `<input class="cap" data-i="${i}" value="${esc(it.caption)}" placeholder="คำอธิบายใต้ภาพ เช่น ผลงานกลุ่มที่ 1" aria-label="คำอธิบายใต้ภาพ ${esc(it.file.name)}">` : '';
    return `<li><span class="nm" title="${esc(it.file.name)}">${esc(it.file.name)}</span><span class="pg">${pg}</span>
      <button type="button" data-a="up" data-i="${i}" aria-label="เลื่อนขึ้น" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button type="button" data-a="down" data-i="${i}" aria-label="เลื่อนลง" ${i === P.items.length - 1 ? 'disabled' : ''}>↓</button>
      <button type="button" data-a="del" data-i="${i}" aria-label="เอาออก">×</button>${cap}</li>`;
  }).join('');
  const notes = P.notes.map((n) => `<span class="plan-warn">${esc(n)}</span>`).join('<br>');
  const total = pages.length;
  try {
    const sel = parsePages($('#p-pages').value, total);
    const split = $('#p-split').checked;
    const files = split ? Math.ceil(sel.length / 10) : 1;
    const imgs = P.items.filter((it) => it.type === 'img');
    const noCap = imgs.filter((it) => !it.caption.trim()).length;
    const lines = [`ได้ PDF <b>${sel.length} หน้า</b>${files > 1 ? ` แยกเป็น <b>${files} ไฟล์</b> (ไฟล์ละไม่เกิน 10 หน้า)` : ''}`];
    if (!split && sel.length > 10) lines.push('<span class="plan-warn">เกิน 10 หน้า ไฟล์ผลงานนักเรียนต้องไม่เกิน 10 หน้าต่อไฟล์ ติ๊ก "แยกเป็นไฟล์ละไม่เกิน 10 หน้า" หรือเลือกเฉพาะหน้าที่สำคัญ</span>');
    if (files > 3) lines.push('<span class="plan-warn">เกิน 3 ไฟล์ ผลลัพธ์ผู้เรียนส่งได้รวมไม่เกิน 3 ไฟล์ ลองเพิ่มจำนวนรูปต่อหน้า หรือเลือกเฉพาะงานที่เด่น</span>');
    if (noCap) lines.push(`<span class="plan-warn">ยังไม่มีคำอธิบายใต้ภาพ ${noCap} รูป เกณฑ์ ก.ค.ศ. กำหนดให้มีคำอธิบายใต้ภาพ</span>`);
    $('#p-plan').innerHTML = [notes, ...lines].filter(Boolean).join('<br>');
    $('#p-go').disabled = !sel.length;
  } catch (e) {
    $('#p-plan').innerHTML = [notes, `<span class="plan-warn">${esc(e.message)}</span>`].filter(Boolean).join('<br>');
    $('#p-go').disabled = true;
  }
}

// รูป + คำอธิบายใต้ภาพ → JPEG (วาดตัวอักษรไทยด้วยเบราว์เซอร์ สระ/วรรณยุกต์จึงถูกตำแหน่ง)
async function imageCell(file, caption, maxSide) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const text = caption.trim();
  const fs = Math.max(22, Math.round(w * 0.045));
  const lines = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (text) {
    ctx.font = `500 ${fs}px "IBM Plex Sans Thai", sans-serif`;
    let line = '';
    for (const ch of [...new Intl.Segmenter('th', { granularity: 'word' }).segment(text)].map((s) => s.segment)) {
      if (ctx.measureText(line + ch).width > w - fs && line) { lines.push(line); line = ch.trimStart(); } else line += ch;
    }
    if (line) lines.push(line);
    lines.splice(2); // ไม่เกิน 2 บรรทัด
  }
  const band = text ? Math.round(fs * (0.9 + lines.length * 1.55)) : 0;
  canvas.width = w; canvas.height = h + band;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h + band);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  if (text) {
    ctx.fillStyle = '#0F2438'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = `500 ${fs}px "IBM Plex Sans Thai", sans-serif`;
    lines.forEach((l, i) => ctx.fillText(l, w / 2, h + fs * 0.45 + i * fs * 1.55));
  }
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
  return { bytes: await blob.arrayBuffer(), w: canvas.width, h: canvas.height };
}

const A4 = [595.28, 841.89];
const GRID = { 1: [1, 1], 2: [1, 2], 4: [2, 2], 6: [2, 3] };

async function buildPdf() {
  const { PDFDocument } = await pdfLib();
  const pages = layoutPages();
  let sel;
  try { sel = parsePages($('#p-pages').value, pages.length); } catch { return; }
  $('#p-go').disabled = true;
  $('#p-result').hidden = true;
  const skipped = [];
  try {
    if (P.items.some((it) => it.type === 'img')) { try { await document.fonts.load('500 32px "IBM Plex Sans Thai"'); } catch { /* ใช้ฟอนต์สำรอง */ } }
    const per = perPage();
    const chunks = $('#p-split').checked ? Array.from({ length: Math.ceil(sel.length / 10) }, (_, i) => sel.slice(i * 10, i * 10 + 10)) : [sel];
    const srcCache = new Map();
    const baseNameOut = ($('#p-name').value.trim() || 'เอกสาร').replace(/[\\/:*?"<>|]/g, '-');
    const outs = [];
    for (const [ci, chunk] of chunks.entries()) {
      const out = await PDFDocument.create();
      for (const pi of chunk) {
        const pg = pages[pi];
        if (pg.type === 'pdf') {
          if (!srcCache.has(pg.it)) srcCache.set(pg.it, await PDFDocument.load(pg.it.bytes));
          const [cp] = await out.copyPages(srcCache.get(pg.it), [pg.i]);
          out.addPage(cp);
          continue;
        }
        const cells = [];
        for (const it of pg.items) {
          try { cells.push(await imageCell(it.file, it.caption, per === 1 ? 1754 : 1100)); }
          catch { skipped.push(it.file.name); }
        }
        if (!cells.length) continue;
        const [cols, rows] = GRID[per] || [2, 3];
        const land = per === 1 && cells[0].w > cells[0].h;
        const [pw, ph] = land ? [A4[1], A4[0]] : A4;
        const m = 28, gap = 14;
        const cw = (pw - 2 * m - (cols - 1) * gap) / cols, chh = (ph - 2 * m - (rows - 1) * gap) / rows;
        const page = out.addPage([pw, ph]);
        for (const [k, c] of cells.entries()) {
          const img = await out.embedJpg(c.bytes);
          const s = Math.min(cw / c.w, chh / c.h);
          const col = k % cols, row = Math.floor(k / cols);
          const x = m + col * (cw + gap) + (cw - c.w * s) / 2;
          const yTop = ph - m - row * (chh + gap);
          page.drawImage(img, { x, y: yTop - c.h * s, width: c.w * s, height: c.h * s }); // ชิดบน แถวจึงเสมอกันแม้คำอธิบายยาวไม่เท่ากัน
        }
      }
      if (!out.getPageCount()) continue;
      const bytes = await out.save();
      const name = chunks.length > 1 ? `${baseNameOut}-${ci + 1}.pdf` : `${baseNameOut}.pdf`;
      const url = download(new Blob([bytes], { type: 'application/pdf' }), name);
      outs.push({ name, url, pages: out.getPageCount(), size: bytes.length });
    }
    if (!outs.length) throw new Error('ไม่มีหน้าที่สร้างได้');
    $('#p-result').className = 'result';
    $('#p-result').innerHTML = `<h3>สร้าง PDF แล้ว ${outs.length > 1 ? `${outs.length} ไฟล์` : ''}</h3>
      ${outs.map((o) => `<p><a href="${o.url}" download="${esc(o.name)}"><b>${esc(o.name)}</b></a> · ${o.pages} หน้า · ${fmtSize(o.size)}</p>`).join('')}
      ${skipped.length ? `<p>ข้ามรูปที่เปิดไม่ได้: ${skipped.map(esc).join(', ')}</p>` : ''}
      <p class="small">ไฟล์อยู่ในโฟลเดอร์ดาวน์โหลด ถ้าไม่ครบ กดชื่อไฟล์เพื่อดาวน์โหลดอีกครั้ง</p>`;
  } catch (e) {
    console.error(e);
    $('#p-result').className = 'result bad';
    $('#p-result').innerHTML = `<h3>สร้างไม่สำเร็จ</h3><p>${/[ก-๙]/.test(e?.message || '') ? esc(e.message) : 'มีไฟล์ที่เปิดไม่ได้ ลองเอาไฟล์ที่เพิ่มล่าสุดออกแล้วสร้างใหม่'}</p>`;
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
// พิมพ์คำอธิบาย: เก็บค่าโดยไม่วาดรายการใหม่ (ไม่ให้เคอร์เซอร์หลุด) แล้วอัปเดตสรุปตอนออกจากช่อง
$('#p-list').addEventListener('input', (e) => { if (e.target.matches('.cap')) P.items[Number(e.target.dataset.i)].caption = e.target.value; });
$('#p-list').addEventListener('focusout', (e) => { if (e.target.matches('.cap')) renderPdf(false); });
$('#p-pages').addEventListener('input', renderPdf);
$('#p-per').addEventListener('change', renderPdf);
$('#p-split').addEventListener('change', renderPdf);
$('#p-go').addEventListener('click', buildPdf);
$('#p-reset').addEventListener('click', () => { P.items = []; P.notes = []; $('#p-pages').value = ''; $('#p-result').hidden = true; renderPdf(); });

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
  try { await navigator.clipboard.writeText(pageUrl); $('#share-copy').textContent = 'คัดลอกแล้ว'; } catch { $('#share-copy').textContent = pageUrl; }
});
