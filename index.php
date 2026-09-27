<?php
declare(strict_types=1);
// DPA พร้อมส่ง (ดีไซน์ "โต๊ะช่าง") · ทำงานในเบราว์เซอร์ทั้งหมด ไม่มีไฟล์ของครูขึ้นเซิร์ฟเวอร์
if (PHP_SAPI !== 'cli' && extension_loaded('zlib') && !ini_get('zlib.output_compression')) ob_start('ob_gzhandler');
$url = 'https://sricodeboon.infinityfreeapp.com/dpa/';
$title = 'DPA พร้อมส่ง · แปลงไฟล์ MOV เป็น MP4 ลดขนาดคลิปสอน จัดผลงานนักเรียนเป็น PDF ฟรี';
$desc = 'แปลงไฟล์คลิปสอนจาก iPhone (MOV) เป็น MP4 ลดขนาดไฟล์หลาย GB ตรวจความยาวตามเกณฑ์ 60/10 นาที ตัดหัว-ตัดท้าย และจัดรูปผลงานนักเรียนเป็น PDF หน้าละไม่เกิน 6 ภาพ ทำในเครื่องของครูเอง ไม่ต้องลงโปรแกรม ไม่อัปโหลดไฟล์';
$v = (string) max(@filemtime(__DIR__ . '/app.js'), @filemtime(__DIR__ . '/ui.js'), @filemtime(__DIR__ . '/style.css'));
?>
<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= htmlspecialchars($title) ?></title>
<meta name="description" content="<?= htmlspecialchars($desc) ?>">
<meta property="og:type" content="website">
<meta property="og:url" content="<?= $url ?>">
<meta property="og:title" content="DPA พร้อมส่ง · แปลงไฟล์ลดขนาดคลิปสอนฟรี">
<meta property="og:description" content="<?= htmlspecialchars($desc) ?>">
<meta property="og:image" content="<?= $url ?>og.png">
<meta name="theme-color" content="#0F2438">
<link rel="canonical" href="<?= $url ?>">
<link rel="icon" href="/dpa/brand/dpa-favicon.svg" type="image/svg+xml">
<link rel="icon" href="/dpa/brand/dpa-favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/dpa/brand/dpa-app-icon-180.png">
<link rel="preload" href="/assets/fonts/IBMPlexSansThai-400-thai.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/ChakraPetch-700-thai.woff2" as="font" type="font/woff2" crossorigin>
<link rel="modulepreload" href="/dpa/vendor/mediabunny.min.mjs">
<style><?php readfile(dirname(__DIR__) . '/assets/fonts/fonts.css'); ?></style>
<style><?php readfile(__DIR__ . '/style.css'); ?></style>
</head>
<body>
<noscript><p class="noscript">หน้านี้ต้องเปิด JavaScript ในเบราว์เซอร์จึงจะใช้งานได้</p></noscript>
<a class="skip" href="#video">ข้ามไปที่เครื่องมือ</a>

<header class="top">
  <div class="top-in">
    <a class="brand" href="/dpa/" aria-label="DPA พร้อมส่ง">
      <img class="emblem" src="/dpa/brand/dpa-mark-on-dark.svg" width="36" height="36" alt="">
      <span class="wordmark"><span class="d">DPA</span> พร้อมส่ง</span>
    </a>
    <a class="tool-name" href="/">โดย ศรี<span class="b">{</span><span class="c">โค้ด</span><span class="b">}</span>บูรณ์</a>
    <nav class="tabs" aria-label="ส่วนของเครื่องมือ">
      <a href="#video" data-tab="video">
        <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4.5" width="11" height="11" rx="1.5"/><path d="M13.5 8.5l4-2.5v8l-4-2.5"/></svg>คลิป</a>
      <a href="#pdf" data-tab="pdf">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2.5h7l3.5 3.5v11.5H5z"/><path d="M12 2.5V6h3.5M7.5 10h5M7.5 13h5"/></svg>PDF</a>
      <a href="#check" data-tab="check">
        <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="14" height="14" rx="1.5"/><path d="M6.5 10.2l2.4 2.4 4.6-5"/></svg>เช็กลิสต์</a>
    </nav>
    <p class="local-note">
      <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="9" width="12" height="8.5" rx="1.5"/><path d="M6.5 9V6.5a3.5 3.5 0 017 0V9"/></svg>
      ไฟล์อยู่ในเครื่องนี้ ไม่อัปโหลด
    </p>
  </div>
</header>

<main>
  <section class="intro wrap" aria-labelledby="intro-h">
    <div class="intro-text">
      <p class="eyebrow">DPA พร้อมส่ง · ประเมินวิทยฐานะ</p>
      <h1 id="intro-h">เตรียมไฟล์ส่ง DPA<br>ในเครื่องของครูเอง</h1>
      <p class="lede">แปลงไฟล์ MOV จากไอโฟนเป็น MP4 ลดขนาดคลิปสอนที่ใหญ่หลาย GB ตรวจความยาวตามเกณฑ์ และจัดรูปผลงานนักเรียนเป็น PDF (ไม่เกิน 10 หน้าต่อไฟล์)</p>
    </div>
    <dl class="plate" aria-label="ข้อมูลเครื่องมือ">
      <div><dt>ค่าใช้จ่าย</dt><dd><b>ฟรี</b> ไม่ต้องสมัครสมาชิก</dd></div>
      <div><dt>ติดตั้ง</dt><dd><b>ไม่ต้องลงโปรแกรม</b> เปิดในเบราว์เซอร์</dd></div>
      <div><dt>ไฟล์ของครู</dt><dd><b>ไม่ออกจากเครื่อง</b> ไม่มีการอัปโหลด</dd></div>
      <div><dt>ใช้ได้ดีกับ</dt><dd>Chrome หรือ Edge บนคอมพิวเตอร์</dd></div>
    </dl>
    <div class="banner" id="support-banner" hidden></div>
  </section>

  <!-- ============ 1 วิดีโอ ============ -->
  <section class="win wrap-win" id="video" aria-labelledby="video-h">
    <header class="win-head">
      <span class="win-no" aria-hidden="true">1</span>
      <div>
        <h2 id="video-h">แปลงไฟล์และลดขนาดคลิป</h2>
        <p>คลิปจากไอโฟน มือถือ หรือกล้อง (MOV, MP4, M4V, WebM)</p>
      </div>
    </header>

    <div class="ws ws-video">
      <fieldset class="cell kinds">
        <legend class="cell-label"><span class="n" aria-hidden="true">1</span>ไฟล์นี้คือ</legend>
        <div class="seg">
          <label><input type="radio" name="kind" value="3600" data-label="คลิปการสอน" checked><span class="seg-t">คลิปการสอน</span><span class="seg-s">ไม่เกิน 60 นาที</span></label>
          <label><input type="radio" name="kind" value="600" data-label="คลิปแรงบันดาลใจ"><span class="seg-t">คลิปแรงบันดาลใจ</span><span class="seg-s">ไม่เกิน 10 นาที</span></label>
          <label><input type="radio" name="kind" value="600" data-label="คลิปผลลัพธ์ผู้เรียน"><span class="seg-t">คลิปผลลัพธ์ผู้เรียน</span><span class="seg-s">ไม่เกิน 10 นาที</span></label>
        </div>
      </fieldset>

      <div class="cell pick">
        <p class="cell-label"><span class="n" aria-hidden="true">2</span>เลือกไฟล์คลิป</p>
        <label class="drop" id="v-drop">
          <input type="file" id="v-file" accept="video/*,.mov,.mp4,.m4v,.webm,.mkv">
          <svg class="drop-icon" viewBox="0 0 32 32" aria-hidden="true"><rect x="3.5" y="7.5" width="18" height="17" rx="2"/><path d="M21.5 13.5l7-4v13l-7-4"/></svg>
          <span class="drop-main">ลากไฟล์คลิปมาวางตรงนี้</span>
          <span class="drop-or">หรือ</span>
          <span class="drop-btn">กดเลือกไฟล์จากเครื่อง</span>
          <span class="drop-sub">ไฟล์ใหญ่แค่ไหนก็ได้ ระบบอ่านจากเครื่องโดยตรง</span>
          <span class="drop-swap"><b>เปลี่ยนไฟล์</b> ลากไฟล์อื่นมาวาง หรือกดตรงนี้</span>
        </label>
      </div>

      <div id="v-panel" hidden>
        <div class="cell settings">
          <div class="field">
            <label for="v-target" class="cell-label"><span class="n" aria-hidden="true">3</span>ขนาดไฟล์ที่ต้องการ</label>
            <select id="v-target">
              <option value="1000" selected>ไม่เกิน 1 GB (แนะนำ · ชัดระดับ HD)</option>
              <option value="800">ไม่เกิน 800 MB</option>
              <option value="500">ไม่เกิน 500 MB</option>
              <option value="300">ไม่เกิน 300 MB (เน็ตช้ามาก)</option>
            </select>
            <p class="hint">ก.ค.ศ. ไม่ได้กำหนดขนาดสูงสุด ระบบ DPA รับไฟล์เกิน 1 GB ได้ ตัวเลือกนี้มีไว้ให้อัปโหลดง่ายขึ้น</p>
          </div>
          <div class="field">
            <span class="cell-label"><span class="n" aria-hidden="true">4</span>ตัดหัว-ตัดท้าย <em>ไม่บังคับ</em></span>
            <div class="trim">
              <label><span>เริ่มที่</span><input id="v-start" inputmode="numeric" placeholder="0:00" autocomplete="off"></label>
              <span class="trim-to" aria-hidden="true">→</span>
              <label><span>จบที่</span><input id="v-end" inputmode="numeric" placeholder="60:00" autocomplete="off"></label>
            </div>
            <p class="hint">พิมพ์ <code>1:30</code> = นาทีที่ 1 วินาทีที่ 30 · พิมพ์เลขเดียว = นาที</p>
            <p class="rule" id="v-rule"></p>
          </div>
          <div class="field" id="v-planmin-wrap">
            <label for="v-planmin" class="cell-label"><span class="n" aria-hidden="true">5</span>เวลาในแผนการสอน <em>นาที · ไม่บังคับ</em></label>
            <input id="v-planmin" inputmode="numeric" placeholder="เช่น 50" autocomplete="off">
            <p class="hint">ใส่ไว้เพื่อเทียบกับความยาวคลิป กรรมการดูว่าเวลาในแผนตรงกับคลิปจริงหรือไม่</p>
          </div>
          <div class="know-wrap">
            <p class="know-h">ข้อควรรู้ก่อนกดเริ่ม</p>
            <ul class="know">
              <li>ไฟล์ต้นฉบับไม่ถูกแก้ไข ได้ไฟล์ใหม่ชื่อลงท้ายว่า <code>-DPA.mp4</code></li>
              <li>การแปลงเป็น MP4 และลดขนาดไฟล์ <b>ไม่นับเป็นการตัดต่อ</b> ตามแนวทางของ ก.ค.ศ.</li>
              <li>ใน Chrome และ Edge เครื่องจะถามที่บันทึกไฟล์ก่อนเริ่ม</li>
              <li>ระหว่างแปลงใช้โปรแกรมอื่นได้ แต่อย่าปิดแท็บหรือพับฝาโน้ตบุ๊ก</li>
            </ul>
          </div>
        </div>

        <div class="cell sheet" aria-label="ใบสรุปไฟล์">
          <p class="sheet-title">ใบสรุปไฟล์</p>
          <div class="status" id="v-status" role="status"></div>
          <div class="spec">
            <div class="spec-head" aria-hidden="true"><span>รายการ</span><span>ไฟล์ของครู</span><span>เป้าหมาย</span></div>
            <dl class="facts" id="v-facts"></dl>
          </div>
          <p class="plan" id="v-plan"></p>

          <div class="progress" id="v-progress" hidden>
            <div class="progress-top">
              <span class="progress-label">กำลังแปลงไฟล์</span>
              <span id="v-pct" class="pct">0%</span>
            </div>
            <div class="bar"><span id="v-bar"></span></div>
            <div class="progress-row">
              <span id="v-eta"></span>
              <button class="btn btn-small" id="v-cancel" type="button">ยกเลิก</button>
            </div>
            <p class="hint">เปิดหน้านี้ค้างไว้ ใช้โปรแกรมอื่นได้ แต่อย่าปิดแท็บหรือพับฝาโน้ตบุ๊ก</p>
          </div>

          <div class="result" id="v-result" hidden></div>
        </div>

        <div class="cell act">
          <button class="btn btn-primary" id="v-go" type="button">เริ่มแปลงไฟล์</button>
          <button class="btn" id="v-reset" type="button">เลือกไฟล์ใหม่</button>
        </div>
      </div>

      <div class="cell sheet sheet-empty" aria-hidden="true">
        <p class="sheet-title">ใบสรุปไฟล์</p>
        <div class="spec">
          <div class="spec-head"><span>รายการ</span><span>ไฟล์ของครู</span><span>เป้าหมาย</span></div>
          <dl class="facts">
            <div><dt>ไฟล์</dt><dd class="th">ยังไม่ได้เลือก</dd></div>
            <div><dt>ความยาว</dt><dd>—</dd></div>
            <div><dt>ขนาด</dt><dd>—</dd></div>
            <div><dt>ภาพ</dt><dd>—</dd></div>
            <div><dt>ชนิดไฟล์</dt><dd>—</dd></div>
          </dl>
        </div>
        <p class="empty-note">เลือกไฟล์คลิปก่อน ระบบจะอ่านไฟล์แล้วบอกว่า <b>ต้องแปลงหรือไม่</b> และจะได้ไฟล์ขนาดเท่าไร</p>
      </div>
    </div>
  </section>

  <!-- ============ 2 PDF ============ -->
  <section class="win wrap-win" id="pdf" aria-labelledby="pdf-h">
    <header class="win-head">
      <span class="win-no" aria-hidden="true">2</span>
      <div>
        <h2 id="pdf-h">จัดผลงานนักเรียนเป็น PDF</h2>
        <p>รวม PDF และรูปถ่ายผลงาน จัดหน้าละไม่เกิน 6 ภาพพร้อมคำอธิบายใต้ภาพ แยกไฟล์ละไม่เกิน 10 หน้า</p>
      </div>
    </header>

    <div class="ws ws-pdf">
      <div class="cell pick">
        <p class="cell-label"><span class="n" aria-hidden="true">1</span>เพิ่มไฟล์</p>
        <label class="drop drop-sm" id="p-drop">
          <input type="file" id="p-file" accept="application/pdf,image/jpeg,image/png,image/heic,.pdf,.jpg,.jpeg,.png,.heic" multiple>
          <svg class="drop-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 3.5h11l5.5 5.5v19.5H8z"/><path d="M19 3.5V9h5.5M12 15h9M12 19.5h9M12 24h5"/></svg>
          <span class="drop-main">ลาก PDF หรือรูป JPG/PNG มาวาง</span>
          <span class="drop-btn">กดเลือกไฟล์ (หลายไฟล์ได้)</span>
        </label>
      </div>

      <div id="p-panel" hidden>
        <div class="cell settings">
          <div class="field">
            <label for="p-per" class="cell-label"><span class="n" aria-hidden="true">2</span>รูปต่อหน้า</label>
            <select id="p-per">
              <option value="1">1 ภาพต่อหน้า</option>
              <option value="2">2 ภาพต่อหน้า</option>
              <option value="4" selected>4 ภาพต่อหน้า</option>
              <option value="6">6 ภาพต่อหน้า (สูงสุดตามเกณฑ์)</option>
            </select>
            <p class="hint">ใช้กับรูป JPG/PNG · เกณฑ์ ก.ค.ศ. หน้าละไม่เกิน 6 ภาพ และต้องมีคำอธิบายใต้ภาพ พิมพ์คำอธิบายได้ในรายการด้านข้าง</p>
          </div>
          <div class="field">
            <label for="p-pages" class="cell-label"><span class="n" aria-hidden="true">3</span>เลือกหน้า <em>เว้นว่าง = ทุกหน้า</em></label>
            <input id="p-pages" placeholder="เช่น 1-5, 8, 10" inputmode="numeric" autocomplete="off">
            <p class="hint">นับเลขหน้าต่อกันทั้งชุด ตามลำดับในรายการ</p>
          </div>
          <div class="field">
            <label for="p-name" class="cell-label"><span class="n" aria-hidden="true">4</span>ชื่อไฟล์</label>
            <div class="suffix"><input id="p-name" value="ผลงานนักเรียน" autocomplete="off"><span aria-hidden="true">.pdf</span></div>
            <label class="check-inline"><input type="checkbox" id="p-split" checked> แยกเป็นไฟล์ละไม่เกิน 10 หน้าให้อัตโนมัติ</label>
          </div>
        </div>

        <div class="cell sheet" aria-label="ชุดเอกสาร">
          <p class="sheet-title">ชุดเอกสาร <span>เรียงตามลำดับนี้</span></p>
          <ol class="files" id="p-list"></ol>
          <p class="plan" id="p-plan"></p>
          <div class="result" id="p-result" hidden></div>
        </div>

        <div class="cell act">
          <button class="btn btn-primary" id="p-go" type="button">สร้าง PDF</button>
          <button class="btn" id="p-reset" type="button">ล้างรายการ</button>
        </div>
      </div>

      <div class="cell sheet sheet-empty" aria-hidden="true">
        <p class="sheet-title">ชุดเอกสาร</p>
        <ol class="files files-ghost"><li></li><li></li><li></li></ol>
        <p class="empty-note">เพิ่มไฟล์แล้วรายการจะขึ้นตรงนี้ พร้อมเลขหน้า เลื่อนลำดับขึ้นลงได้</p>
      </div>
    </div>
  </section>

  <!-- ============ 3 เช็กลิสต์ ============ -->
  <section class="win wrap-win" id="check" aria-labelledby="check-h">
    <header class="win-head">
      <span class="win-no" aria-hidden="true">3</span>
      <div>
        <h2 id="check-h">เช็กลิสต์ก่อนกดส่ง</h2>
        <p>ติ๊กเก็บไว้ในเครื่องนี้ ปิดแล้วกลับมาดูต่อได้</p>
      </div>
    </header>
    <div class="ws ws-check">
      <div class="cell">
        <ul class="checklist" id="checklist">
          <li><label><input type="checkbox" data-k="plan"> <span><b>แผนการจัดการเรียนรู้</b> เป็น PDF 1 ไฟล์ ตรงกับคาบที่ถ่ายวิดีโอ</span></label></li>
          <li><label><input type="checkbox" data-k="teach"> <span><b>คลิปการสอน</b> MP4 ไม่เกิน 60 นาที ถ่ายต่อเนื่องครั้งเดียว ไม่ตัดต่อ ไม่มีไตเติล ไม่มีดนตรีประกอบ เห็นบรรยากาศและผู้เรียนชัด</span></label></li>
          <li><label><input type="checkbox" data-k="inspire"> <span><b>คลิปแรงบันดาลใจ</b> ไม่เกิน 10 นาที ครูนำเสนอเอง เล่าสภาพปัญหาและที่มา แทรกภาพได้ แต่ไม่มีไตเติล ดนตรี เอฟเฟกต์เสียง หรือตัวอักษรวิ่ง</span></label></li>
          <li><label><input type="checkbox" data-k="result"> <span><b>ผลลัพธ์การเรียนรู้ของผู้เรียน</b> รวมไม่เกิน 3 ไฟล์ เป็นคลิปได้ 1 ไฟล์ (ไม่เกิน 10 นาที) ที่เหลือเป็น PDF ไฟล์ละไม่เกิน 10 หน้า รูปหน้าละไม่เกิน 6 ภาพพร้อมคำอธิบาย</span></label></li>
          <li><label><input type="checkbox" data-k="play"> <span>เปิดไฟล์ที่ย่อแล้วดูจนจบ <b>ภาพและเสียงชัด</b> ไม่กระตุก</span></label></li>
          <li><label><input type="checkbox" data-k="name"> <span>ตั้งชื่อไฟล์ให้อ่านรู้เรื่อง เช่น <code>วิดีโอการสอน-คณิต-ป4.mp4</code></span></label></li>
          <li><label><input type="checkbox" data-k="plantime"> <span><b>เวลาในแผน</b> ตรงกับความยาวคลิปการสอนจริง</span></label></li>
          <li><label><input type="checkbox" data-k="recheck"> <span>หลังอัปโหลด ให้สถานศึกษา<b>ดาวน์โหลดไฟล์กลับมาเปิดตรวจ</b>ก่อนกดส่งคำขอ</span></label></li>
          <li><label><input type="checkbox" data-k="backup"> <span>เก็บต้นฉบับไว้ในไดรฟ์หรือแฟลชไดรฟ์ จนกว่าผลประเมินจะออก</span></label></li>
        </ul>
      </div>
      <aside class="cell sheet check-side">
        <p class="sheet-title">ความคืบหน้า</p>
        <p class="check-count" id="check-count"></p>
        <div class="meter" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <p class="note">ตรวจกับประกาศและคู่มือ ก.ค.ศ. ฉบับล่าสุดอีกครั้งก่อนยื่น</p>
        <div class="share">
          <p class="share-h">ช่วยบอกต่อเพื่อนครู</p>
          <p class="note">เครื่องมือนี้ฟรีตลอด ถ้าช่วยประหยัดเวลาได้ ฝากส่งต่อให้เพื่อนครูที่กำลังยื่น DPA</p>
          <div class="share-btns">
            <a class="btn" id="share-fb" target="_blank" rel="noopener">แชร์ใน Facebook</a>
            <a class="btn" id="share-line" target="_blank" rel="noopener">ส่งทาง LINE</a>
            <button class="btn" id="share-copy" type="button">คัดลอกลิงก์</button>
          </div>
        </div>
      </aside>
    </div>
  </section>

  <!-- ============ คำถามที่ครูถามบ่อย ============ -->
  <section class="win wrap-win faq" id="faq" aria-labelledby="faq-h">
    <header class="win-head">
      <span class="win-no" aria-hidden="true">?</span>
      <div>
        <h2 id="faq-h">คำถามที่ครูถามบ่อย</h2>
        <p>รวบรวมจากคำถามในกลุ่มครูที่ยื่นประเมินวิทยฐานะ</p>
      </div>
    </header>
    <div class="faq-list">
      <details>
        <summary>คลิปการสอนยาวเกิน 60 นาทีนิดหน่อย ทำอย่างไรได้บ้าง</summary>
        <p>คลิปการสอนต้องถ่ายต่อเนื่องครั้งเดียว (One-Take) ห้ามตัดต่อ ตัดได้เฉพาะช่วงตั้งกล้องก่อนเริ่มสอนหรือหลังจบคาบ <b>ห้ามตัดกลางคลิปและห้ามเร่งความเร็ว</b> ถ้าตัวบทเรียนเองยาวเกิน 60 นาทีควรถ่ายใหม่ และตั้งเวลาในแผนให้ตรงกับคลิปจริง</p>
      </details>
      <details>
        <summary>ไฟล์ลดจาก 5 GB เหลือไม่ถึง 1 GB ผิดเกณฑ์ไหม</summary>
        <p>ไม่ผิด การแปลงเป็น MP4 และลดขนาดไฟล์ไม่นับเป็นการตัดต่อ ก.ค.ศ. เองก็แนะนำให้แปลงเป็น MP4 ความละเอียด 720p ซึ่งเป็นค่าที่เครื่องมือนี้ใช้เมื่อเลือกขนาด 1 GB</p>
      </details>
      <details>
        <summary>เอาคลิปใหญ่ออกจากไอโฟนมาใส่คอมอย่างไร</summary>
        <p>ต่อสายชาร์จเข้าคอม Windows แล้วเปิดแอป "รูปภาพ" (Photos) เลือก "นำเข้า" · ถ้าเป็น Mac ใช้ AirDrop หรือแอป "จับภาพ" (Image Capture) · อัปขึ้น Google Drive ก็ได้ถ้าพื้นที่พอ (บัญชีฟรีมี 15 GB)</p>
      </details>
      <details>
        <summary>ตั้งค่าไอโฟนก่อนอัดคลิปยาวอย่างไรให้ไม่มีปัญหา</summary>
        <p>ไปที่ การตั้งค่า › กล้อง › บันทึกวิดีโอ เลือก 1080p ที่ 30 fps · ถ้าเลือก การตั้งค่า › กล้อง › รูปแบบ › "เข้ากันได้มากที่สุด" จะได้ไฟล์ที่เปิดได้ทุกเครื่องแต่ใหญ่ขึ้นเกือบเท่าตัว · ก่อนอัดเปิดโหมดเครื่องบิน เสียบสายชาร์จ ถอดเคส และตรวจพื้นที่ว่าง คลิป 1 ชั่วโมงใช้พื้นที่ราว 4–8 GB</p>
      </details>
      <details>
        <summary>อัปขึ้นระบบ DPA แล้วค้างที่ process นาน</summary>
        <p>ระบบต้องประมวลผลไฟล์ใหญ่สักพัก ให้รอจนขึ้นภาพตัวอย่างก่อนกดส่ง ถ้าค้างนานหลายชั่วโมงให้รีเฟรชแล้วอัปใหม่ · ก.ค.ศ. แนะนำให้ลองเปลี่ยนเบราว์เซอร์ถ้าอัปไฟล์ใหญ่ไม่ผ่าน · ไฟล์จากเครื่องมือนี้จัดเรียงแบบ Web Optimized ตามที่ ก.ค.ศ. แนะนำ</p>
      </details>
      <details>
        <summary>รูปจากไอโฟนเป็น HEIC ใช้ได้ไหม</summary>
        <p>ยังใช้ไม่ได้ ให้ตั้งค่าไอโฟนเป็น "เข้ากันได้มากที่สุด" ก่อนถ่าย หรือส่งรูปผ่าน LINE หรืออีเมลซึ่งจะแปลงเป็น JPG ให้เอง</p>
      </details>
    </div>
  </section>

  <!-- ============ เลี้ยงโอวัลติน (พร้อมเพย์) ============ -->
  <section class="win wrap-win donate" id="donate" aria-labelledby="donate-h">
    <details class="donate-d" id="donate-d">
    <summary class="win-head donate-sum">
      <span class="win-no win-cup" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M4 7h10v5a4 4 0 01-4 4H8a4 4 0 01-4-4z"/><path d="M14 8.5h1.3a2 2 0 010 4H14"/><path d="M7 2.5c-.8 1 .8 1.8 0 3M10.5 2.5c-.8 1 .8 1.8 0 3"/></svg></span>
      <div>
        <h2 id="donate-h">เลี้ยงโอวัลตินครูแจ็กสักแก้ว</h2>
        <p>ไม่บังคับ ใช้ฟรีทุกฟีเจอร์เหมือนเดิม</p>
      </div>
      <span class="donate-toggle" aria-hidden="true"><span class="t-open">ดูช่องทางสนับสนุน</span><span class="t-close">ซ่อน</span><svg viewBox="0 0 20 20"><path d="M5.5 8l4.5 4.5L14.5 8"/></svg></span>
    </summary>
    <div class="donate-body">
      <div class="donate-text">
        <p>DPA พร้อมส่ง ทำโดยครูคนหนึ่งในเวลาหลังเลิกสอน ถ้าช่วยให้ครูส่งงานได้ทันและไม่ต้องนั่งแปลงไฟล์ทั้งคืน เลี้ยงโอวัลตินสักแก้วเป็นกำลังใจได้ครับ</p>
        <p class="donate-use">เงินสนับสนุนใช้เป็นค่าโดเมน ค่าโฮสต์ และเวลาพัฒนาเครื่องมือตัวต่อไปสำหรับครู เช่น <b>ปพ.5 ที่ส่งคะแนนเข้า SchoolMIS/SGS ได้</b></p>
        <p class="note">ยอดเท่าไรก็ได้ตามสะดวก · บนมือถือ กด "บันทึกรูป QR" แล้วเปิดรูปในแอปธนาคาร</p>
      </div>
      <figure class="pp-card">
        <figcaption class="pp-head">พร้อมเพย์ · PromptPay</figcaption>
        <img class="pp-qr" src="/dpa/brand/promptpay-qr.svg" width="220" height="220" loading="lazy" alt="QR พร้อมเพย์ 093-073-2896 รัชเดช ศรีแก้ว">
        <p class="pp-name">รัชเดช ศรีแก้ว</p>
        <p class="pp-no"><span class="mono">093-073-2896</span></p>
        <div class="pp-btns">
          <button class="btn" id="pp-copy" type="button" data-no="0930732896">คัดลอกเบอร์</button>
          <a class="btn" href="/dpa/brand/promptpay-qr.png" download="พร้อมเพย์-ศรีโค้ดบูรณ์.png">บันทึกรูป QR</a>
        </div>
      </figure>
    </div>
    </details>
  </section>
</main>

<footer class="foot wrap">
  <p>ทำโดย <a href="https://www.facebook.com/sricodeboon" target="_blank" rel="noopener">ครูแจ็ก · ศรีโค้ดบูรณ์</a> ครูที่เขียนโปรแกรมเอง อยากได้ฟีเจอร์ไหนเพิ่ม ทักเพจได้เลย · <a href="#donate">เลี้ยงโอวัลติน</a></p>
  <p class="fine">ทุกขั้นตอนทำในเบราว์เซอร์ของเครื่องนี้ ไม่มีไฟล์หรือข้อมูลส่วนตัวถูกส่งออกไป · เครื่องมือนี้ไม่ใช่ของ ก.ค.ศ. ·
    ใช้ <a href="/dpa/vendor/LICENSE-mediabunny.txt">Mediabunny</a> (MPL-2.0) และ <a href="/dpa/vendor/LICENSE-pdf-lib.txt">pdf-lib</a> (MIT)</p>
</footer>

<script type="module" src="/dpa/app.js?v=<?= $v ?>"></script>
<script type="module" src="/dpa/ui.js?v=<?= $v ?>"></script>
</body>
</html>
