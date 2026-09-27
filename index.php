<?php
declare(strict_types=1);
// DPA พร้อมส่ง (ดีไซน์ "โต๊ะช่าง") · ทำงานในเบราว์เซอร์ทั้งหมด ไม่มีไฟล์ของครูขึ้นเซิร์ฟเวอร์
if (PHP_SAPI !== 'cli' && extension_loaded('zlib') && !ini_get('zlib.output_compression')) ob_start('ob_gzhandler');
$url = 'https://sricodeboon.infinityfreeapp.com/dpa/';
$title = 'DPA พร้อมส่ง · ย่อไฟล์วิดีโอการสอน แปลง MOV เป็น MP4 รวม PDF ฟรี';
$desc = 'ย่อไฟล์วิดีโอการสอน 5 GB ให้เหลือไม่เกิน 500 MB แปลง MOV จาก iPhone เป็น MP4 ตัดคลิปให้ไม่เกิน 60 นาที รวม PDF ไม่เกิน 10 หน้า ทำในเครื่องของครูเอง ไม่ต้องลงโปรแกรม ไม่อัปโหลดไฟล์';
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
<meta property="og:title" content="DPA พร้อมส่ง · ย่อไฟล์วิดีโอการสอนฟรี">
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
        <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4.5" width="11" height="11" rx="1.5"/><path d="M13.5 8.5l4-2.5v8l-4-2.5"/></svg>วิดีโอ</a>
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
      <p class="lede">ย่อวิดีโอการสอนที่ใหญ่หลาย GB แปลง MOV จาก iPhone เป็น MP4 ตัดส่วนที่เกินเวลา และรวม PDF ไม่เกิน 10 หน้า</p>
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
        <h2 id="video-h">ย่อและแปลงวิดีโอ</h2>
        <p>ไฟล์จากมือถือหรือกล้อง MOV, MP4, M4V, WebM</p>
      </div>
    </header>

    <div class="ws ws-video">
      <fieldset class="cell kinds">
        <legend class="cell-label"><span class="n" aria-hidden="true">1</span>ไฟล์นี้คือ</legend>
        <div class="seg">
          <label><input type="radio" name="kind" value="3600" data-label="วิดีโอการสอน" checked><span class="seg-t">วิดีโอการสอน</span><span class="seg-s">ไม่เกิน 60 นาที</span></label>
          <label><input type="radio" name="kind" value="600" data-label="วิดีโอแรงบันดาลใจ"><span class="seg-t">วิดีโอแรงบันดาลใจ</span><span class="seg-s">ไม่เกิน 10 นาที</span></label>
          <label><input type="radio" name="kind" value="600" data-label="วิดีโอผลลัพธ์ผู้เรียน"><span class="seg-t">วิดีโอผลลัพธ์ผู้เรียน</span><span class="seg-s">ไม่เกิน 10 นาที</span></label>
        </div>
      </fieldset>

      <div class="cell pick">
        <p class="cell-label"><span class="n" aria-hidden="true">2</span>เลือกไฟล์วิดีโอ</p>
        <label class="drop" id="v-drop">
          <input type="file" id="v-file" accept="video/*,.mov,.mp4,.m4v,.webm,.mkv">
          <svg class="drop-icon" viewBox="0 0 32 32" aria-hidden="true"><rect x="3.5" y="7.5" width="18" height="17" rx="2"/><path d="M21.5 13.5l7-4v13l-7-4"/></svg>
          <span class="drop-main">ลากไฟล์วิดีโอมาวางตรงนี้</span>
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
              <option value="300">ไม่เกิน 300 MB (เน็ตช้า)</option>
              <option value="500" selected>ไม่เกิน 500 MB (แนะนำ)</option>
              <option value="800">ไม่เกิน 800 MB</option>
              <option value="1000">ไม่เกิน 1 GB</option>
            </select>
          </div>
          <div class="field">
            <span class="cell-label"><span class="n" aria-hidden="true">4</span>ช่วงที่จะเก็บไว้ <em>ไม่บังคับ</em></span>
            <div class="trim">
              <label><span>เริ่มที่</span><input id="v-start" inputmode="numeric" placeholder="0:00" autocomplete="off"></label>
              <span class="trim-to" aria-hidden="true">→</span>
              <label><span>จบที่</span><input id="v-end" inputmode="numeric" placeholder="60:00" autocomplete="off"></label>
            </div>
            <p class="hint">ใช้ตัดช่วงเตรียมกล้องตอนต้นหรือท้ายคลิป · พิมพ์ <code>1:30</code> = นาทีที่ 1 วินาทีที่ 30 · พิมพ์เลขเดียว = นาที</p>
          </div>
          <div class="know-wrap">
            <p class="know-h">ข้อควรรู้ก่อนกดเริ่ม</p>
            <ul class="know">
              <li>ไฟล์ต้นฉบับไม่ถูกแก้ไข ได้ไฟล์ใหม่ชื่อลงท้ายว่า <code>-DPA.mp4</code></li>
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
        <p class="empty-note">เลือกไฟล์วิดีโอก่อน ระบบจะอ่านไฟล์แล้วบอกว่า <b>ต้องแปลงหรือไม่</b> และจะได้ไฟล์ขนาดเท่าไร</p>
      </div>
    </div>
  </section>

  <!-- ============ 2 PDF ============ -->
  <section class="win wrap-win" id="pdf" aria-labelledby="pdf-h">
    <header class="win-head">
      <span class="win-no" aria-hidden="true">2</span>
      <div>
        <h2 id="pdf-h">รวมเป็น PDF</h2>
        <p>รวม PDF และรูปถ่ายผลงานนักเรียนเป็นไฟล์เดียว เลือกเฉพาะหน้าที่ต้องการ</p>
      </div>
    </header>

    <div class="ws ws-pdf">
      <div class="cell pick">
        <p class="cell-label"><span class="n" aria-hidden="true">1</span>เพิ่มไฟล์</p>
        <label class="drop drop-sm" id="p-drop">
          <input type="file" id="p-file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" multiple>
          <svg class="drop-icon" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 3.5h11l5.5 5.5v19.5H8z"/><path d="M19 3.5V9h5.5M12 15h9M12 19.5h9M12 24h5"/></svg>
          <span class="drop-main">ลาก PDF หรือรูป JPG/PNG มาวาง</span>
          <span class="drop-btn">กดเลือกไฟล์ (หลายไฟล์ได้)</span>
        </label>
      </div>

      <div id="p-panel" hidden>
        <div class="cell settings">
          <div class="field">
            <label for="p-pages" class="cell-label"><span class="n" aria-hidden="true">2</span>เลือกหน้า <em>เว้นว่าง = ทุกหน้า</em></label>
            <input id="p-pages" placeholder="เช่น 1-5, 8, 10" inputmode="numeric" autocomplete="off">
            <p class="hint">นับเลขหน้าต่อกันทั้งชุด ตามลำดับในรายการ</p>
          </div>
          <div class="field">
            <label for="p-name" class="cell-label"><span class="n" aria-hidden="true">3</span>ชื่อไฟล์</label>
            <div class="suffix"><input id="p-name" value="ผลงานนักเรียน" autocomplete="off"><span aria-hidden="true">.pdf</span></div>
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
          <li><label><input type="checkbox" data-k="teach"> <span><b>วิดีโอการสอน</b> MP4 ความยาวไม่เกิน 60 นาที เห็นบรรยากาศและผู้เรียนชัด</span></label></li>
          <li><label><input type="checkbox" data-k="inspire"> <span><b>วิดีโอแรงบันดาลใจ</b> ไม่เกิน 10 นาที เล่าสภาพปัญหาและที่มา</span></label></li>
          <li><label><input type="checkbox" data-k="result"> <span><b>ผลลัพธ์การเรียนรู้ของผู้เรียน</b> เป็นวิดีโอหรือ PDF ตามจำนวนที่ระบบให้แนบ</span></label></li>
          <li><label><input type="checkbox" data-k="play"> <span>เปิดไฟล์ที่ย่อแล้วดูจนจบ <b>ภาพและเสียงชัด</b> ไม่กระตุก</span></label></li>
          <li><label><input type="checkbox" data-k="name"> <span>ตั้งชื่อไฟล์ให้อ่านรู้เรื่อง เช่น <code>วิดีโอการสอน-คณิต-ป4.mp4</code></span></label></li>
          <li><label><input type="checkbox" data-k="backup"> <span>เก็บต้นฉบับไว้ในไดรฟ์หรือแฟลชไดรฟ์ จนกว่าผลประเมินจะออก</span></label></li>
        </ul>
      </div>
      <aside class="cell sheet check-side">
        <p class="sheet-title">ความคืบหน้า</p>
        <p class="check-count" id="check-count"></p>
        <div class="meter" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
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

  <!-- ============ เลี้ยงโอวัลติน (พร้อมเพย์) ============ -->
  <section class="win wrap-win donate" id="donate" aria-labelledby="donate-h">
    <header class="win-head">
      <span class="win-no win-cup" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M4 7h10v5a4 4 0 01-4 4H8a4 4 0 01-4-4z"/><path d="M14 8.5h1.3a2 2 0 010 4H14"/><path d="M7 2.5c-.8 1 .8 1.8 0 3M10.5 2.5c-.8 1 .8 1.8 0 3"/></svg></span>
      <div>
        <h2 id="donate-h">เลี้ยงโอวัลตินครูแจ็กสักแก้ว</h2>
        <p>ไม่บังคับ ใช้ฟรีทุกฟีเจอร์เหมือนเดิม</p>
      </div>
    </header>
    <div class="donate-body">
      <div class="donate-text">
        <p>DPA พร้อมส่ง ทำโดยครูคนหนึ่งในเวลาหลังเลิกสอน ถ้าช่วยให้ครูส่งงานได้ทันและไม่ต้องนั่งแปลงไฟล์ทั้งคืน เลี้ยงโอวัลตินสักแก้วเป็นกำลังใจได้ครับ</p>
        <p class="donate-use">เงินสนับสนุนใช้เป็นค่าโดเมน ค่าโฮสต์ และเวลาพัฒนาเครื่องมือตัวต่อไปสำหรับครู เช่น <b>ปพ.5 ที่ส่งคะแนนเข้า SchoolMIS/SGS ได้</b></p>
        <p class="note">ยอดเท่าไรก็ได้ตามสะดวก · บนมือถือ กด "บันทึกรูป QR" แล้วเปิดรูปในแอปธนาคาร</p>
      </div>
      <figure class="pp-card">
        <figcaption class="pp-head">พร้อมเพย์ · PromptPay</figcaption>
        <img class="pp-qr" src="/dpa/brand/promptpay-qr.svg" width="220" height="220" alt="QR พร้อมเพย์ 093-073-2896 รัชเดช ศรีแก้ว">
        <p class="pp-name">รัชเดช ศรีแก้ว</p>
        <p class="pp-no"><span class="mono">093-073-2896</span></p>
        <div class="pp-btns">
          <button class="btn" id="pp-copy" type="button" data-no="0930732896">คัดลอกเบอร์</button>
          <a class="btn" href="/dpa/brand/promptpay-qr.png" download="พร้อมเพย์-ศรีโค้ดบูรณ์.png">บันทึกรูป QR</a>
        </div>
      </figure>
    </div>
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
