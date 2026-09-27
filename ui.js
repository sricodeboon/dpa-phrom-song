// ส่วนแสดงผลของแบบ C เท่านั้น (ไม่แตะตรรกะใน app.js)
// 1) คอลัมน์ "เป้าหมาย" ในใบสรุป  2) แท็บบนบอกว่าอยู่ส่วนไหน  3) แถบนับเช็กลิสต์
const $ = (s) => document.querySelector(s);

// 1) เป้าหมายตามชนิดวิดีโอและขนาดที่เลือก — ใส่เป็นตัวแปร CSS ให้ ::after ของตารางแสดง
const ws = $('.ws-video');
function syncTarget() {
  const kind = document.querySelector('input[name=kind]:checked');
  const mb = Number($('#v-target').value);
  ws.style.setProperty('--req-dur', `"ไม่เกิน ${Number(kind.value) / 60} นาที"`);
  ws.style.setProperty('--req-size', `"ไม่เกิน ${mb >= 1000 ? `${mb / 1000} GB` : `${mb} MB`}"`);
}
document.querySelectorAll('input[name=kind]').forEach((r) => r.addEventListener('change', syncTarget));
$('#v-target').addEventListener('change', syncTarget);
syncTarget();

// 2) แท็บ
const tabs = [...document.querySelectorAll('.tabs a')];
const mark = (id) => tabs.forEach((a) => (a.dataset.tab === id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) mark(e.target.id); });
}, { rootMargin: '-45% 0px -50% 0px' });
['video', 'pdf', 'check'].forEach((id) => io.observe(document.getElementById(id)));
mark('video');

// 3) แถบนับเช็กลิสต์
const boxes = [...document.querySelectorAll('#checklist input')];
const cells = [...document.querySelectorAll('.meter i')];
function syncMeter() {
  const n = boxes.filter((b) => b.checked).length;
  cells.forEach((c, i) => c.classList.toggle('on', i < n));
}
$('#checklist').addEventListener('change', syncMeter);
document.addEventListener('ui:refresh', () => { syncTarget(); syncMeter(); });
syncMeter();

// 4) ปุ่มคัดลอกเบอร์พร้อมเพย์
const pp = $('#pp-copy');
pp?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(pp.dataset.no); pp.textContent = 'คัดลอกแล้ว'; } catch { pp.textContent = pp.dataset.no; }
  setTimeout(() => { pp.textContent = 'คัดลอกเบอร์'; }, 2500);
});
