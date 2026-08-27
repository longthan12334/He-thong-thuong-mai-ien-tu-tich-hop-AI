/* =============================================================
   ShopAI — app.js
   HTTMDTTHA-52  Giao diện trang cá nhân & upload ảnh đại diện
   HTTMDTTHA-53  Giao diện sổ địa chỉ nhận hàng
   Gọi tới API: HTTMDTTHA-48 / 49 / 50
   ============================================================= */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const VIEW = 188, MAX_BYTES = 5 * 1024 * 1024, OUT = 512;
  const API = '';                       // cùng origin với server
  const TOKEN = 'shopai-demo-token';    // thực tế lấy từ phiên đăng nhập

  let NGOAI_TUYEN = false;              // bật khi không gọi được máy chủ

  /* ===================== LỚP GỌI API ===================== */
  async function api(duongDan, tuyChon = {}) {
    const res = await fetch(API + duongDan, {
      ...tuyChon,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        ...(tuyChon.headers || {})
      }
    });
    let data = {};
    try { data = await res.json(); } catch { /* body rỗng */ }
    if (!res.ok) {
      const e = new Error(data.thongBao || `Lỗi ${res.status}`);
      e.status = res.status;
      e.chiTiet = data.chiTiet || null;
      throw e;
    }
    return data;
  }

  /* Dữ liệu mẫu khi chạy ngoại tuyến (mở thẳng index.html bằng trình duyệt) */
  const MAU = {
    hoSo: {
      hoTen: 'Nguyễn Đức Mạnh', email: 'ducmanh@shopai.vn', dienThoai: '+84 912 345 678',
      tinhThanh: 'Hà Nội', emailDaXacMinh: true, anhDaiDien: null,
      cheDoAI: 'Phân tích (ưu tiên dữ liệu)', soNgayLuuTru: 30, ghiNhoNguCanh: true
    },
    diaChi: [
      { id: 'a1', hoTen: 'Nguyễn Đức Mạnh', dienThoai: '0912345678', tinhThanh: 'Hà Nội',
        quanHuyen: 'Cầu Giấy', phuongXa: 'Dịch Vọng Hậu', diaChiCuThe: 'Số 8, ngõ 20 Trần Thái Tông',
        loai: 'Nhà riêng', macDinh: true },
      { id: 'a2', hoTen: 'Nguyễn Đức Mạnh', dienThoai: '0987654321', tinhThanh: 'Hà Nội',
        quanHuyen: 'Ba Đình', phuongXa: 'Ngọc Khánh', diaChiCuThe: 'Tầng 12, tòa Daeha, 360 Kim Mã',
        loai: 'Văn phòng', macDinh: false }
    ]
  };

  let hoSo = null;      // hồ sơ đang hiển thị
  let diaChi = [];      // sổ địa chỉ

  /* ===================== TABS ===================== */
  const tabs = [...document.querySelectorAll('.tab')], glider = $('glider');
  const PANELS = ['p-info', 'p-addr', 'p-sec', 'p-ai'];
  let tabIdx = 0;

  function moveGlider() {
    const t = tabs[tabIdx];
    glider.style.width = t.offsetWidth + 'px';
    glider.style.transform = `translateX(${t.offsetLeft - 5}px)`;
  }
  function select(i) {
    tabIdx = i;
    tabs.forEach((t, j) => {
      const on = j === i;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).classList.toggle('on', on);
    });
    moveGlider();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = (i + d + tabs.length) % tabs.length;
      select(n); tabs[n].focus();
    });
  });
  addEventListener('resize', moveGlider, { passive: true });
  if (document.fonts) document.fonts.ready.then(moveGlider);

  /* ===================== ẢNH ĐẠI DIỆN (HTTMDTTHA-52 → 49) =====================
     Ảnh neo cố định ở tâm khung và chỉ đổi transform, gói trong requestAnimationFrame,
     nên kéo ảnh không làm trình duyệt tính lại layout.                          */
  const viewport = $('viewport'), ring = $('ring'), preview = $('preview'),
        fileInput = $('fileInput'), zoom = $('zoom');
  let img = null, objURL = null, base = 1, scale = 1, dx = 0, dy = 0, avatarVer = 0, raf = 0;

  function paint() {
    raf = 0;
    if (!img) return;
    const k = base * scale;
    const lx = Math.max(0, (img.naturalWidth * k - VIEW) / 2);
    const ly = Math.max(0, (img.naturalHeight * k - VIEW) / 2);
    dx = Math.min(lx, Math.max(-lx, dx));
    dy = Math.min(ly, Math.max(-ly, dy));
    preview.style.transform =
      `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${k})`;
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(paint); };

  function nhanTep(file) {
    if (!file) return;
    if (!file.type.startsWith('image/'))
      return toast('Tệp này không phải ảnh. Dùng PNG, JPG, WEBP hoặc GIF.', true);
    if (file.size > MAX_BYTES)
      return toast('Ảnh vượt quá 5 MB. Hãy chọn tệp nhỏ hơn.', true);

    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      if (objURL) URL.revokeObjectURL(objURL);
      objURL = url; img = im;
      preview.src = url;
      preview.style.width = im.naturalWidth + 'px';
      preview.style.height = im.naturalHeight + 'px';
      base = Math.max(VIEW / im.naturalWidth, VIEW / im.naturalHeight);
      scale = 1; dx = 0; dy = 0; avatarVer++;
      zoom.value = 100; fill(zoom); $('zoomOut').textContent = '1.00×';
      viewport.classList.add('has'); $('calib').classList.add('on');
      $('removeBtn').disabled = false;
      $('note').textContent =
        `${file.name} · ${Math.round(file.size / 1024)} KB · ${im.naturalWidth}×${im.naturalHeight}`;
      paint(); syncChip(); dirty();
      $('live').textContent = 'Đã tải ảnh lên, dùng phím mũi tên để dịch chuyển.';
    };
    im.onerror = () => { URL.revokeObjectURL(url); toast('Không đọc được ảnh này. Thử tệp khác nhé.', true); };
    im.src = url;
  }

  function xoaAnh() {
    if (objURL) { URL.revokeObjectURL(objURL); objURL = null; }
    img = null; preview.removeAttribute('src'); avatarVer++;
    viewport.classList.remove('has'); $('calib').classList.remove('on');
    $('removeBtn').disabled = true; fileInput.value = '';
    $('note').textContent = 'PNG, JPG, WEBP hoặc GIF · tối đa 5 MB';
    syncChip();
  }

  /** Cắt vùng đang thấy thành PNG tròn 512×512 */
  function xuatAnh() {
    if (!img) return null;
    const c = document.createElement('canvas');
    c.width = c.height = OUT;
    const x = c.getContext('2d');
    x.beginPath(); x.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2); x.clip();
    const f = OUT / VIEW, k = base * scale;
    const w = img.naturalWidth * k, h = img.naturalHeight * k;
    x.drawImage(img, ((VIEW - w) / 2 + dx) * f, ((VIEW - h) / 2 + dy) * f, w * f, h * f);
    return c.toDataURL('image/png');
  }

  $('uploadBtn').addEventListener('click', () => fileInput.click());
  viewport.addEventListener('click', () => { if (!img) fileInput.click(); });
  fileInput.addEventListener('change', e => nhanTep(e.target.files[0]));
  $('removeBtn').addEventListener('click', () => { xoaAnh(); dirty(); });
  $('resetCrop').addEventListener('click', () => {
    scale = 1; dx = 0; dy = 0; zoom.value = 100; fill(zoom);
    $('zoomOut').textContent = '1.00×'; avatarVer++; paint(); dirty();
  });

  viewport.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); return fileInput.click(); }
    if (!img) return;
    const s = e.shiftKey ? 12 : 4;
    const map = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] };
    if (map[e.key]) { e.preventDefault(); dx += map[e.key][0]; dy += map[e.key][1]; avatarVer++; schedule(); dirty(); }
  });

  ['dragenter', 'dragover'].forEach(t => ring.addEventListener(t, e => { e.preventDefault(); ring.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => ring.addEventListener(t, e => { e.preventDefault(); ring.classList.remove('over'); }));
  ring.addEventListener('drop', e => nhanTep(e.dataTransfer.files[0]));
  addEventListener('dragover', e => e.preventDefault());
  addEventListener('drop', e => e.preventDefault());

  let keo = false, sx = 0, sy = 0, ox = 0, oy = 0;
  viewport.addEventListener('pointerdown', e => {
    if (!img) return;
    keo = true; sx = e.clientX; sy = e.clientY; ox = dx; oy = dy;
    preview.style.willChange = 'transform';
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', e => {
    if (!keo) return;
    dx = ox + (e.clientX - sx); dy = oy + (e.clientY - sy); schedule();
  });
  ['pointerup', 'pointercancel'].forEach(t => viewport.addEventListener(t, () => {
    if (!keo) return;
    keo = false; preview.style.willChange = ''; avatarVer++; dirty();
  }));
  viewport.addEventListener('wheel', e => {
    if (!img) return;
    e.preventDefault();
    zoom.value = +zoom.value + (e.deltaY < 0 ? 8 : -8);
    apDungZoom();
  }, { passive: false });

  const fill = el => el.style.setProperty('--fill', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
  function apDungZoom() {
    scale = zoom.value / 100;
    $('zoomOut').textContent = scale.toFixed(2) + '×';
    fill(zoom); avatarVer++; schedule(); dirty();
  }
  zoom.addEventListener('input', apDungZoom);

  /* Chip trên header phản chiếu hồ sơ theo thời gian thực */
  const chuCaiDau = n => {
    const p = n.trim().split(/\s+/).filter(Boolean);
    return ((p[0]?.[0] || '') + (p.at(-1)?.[0] || '')).toUpperCase() || '?';
  };
  function syncChip() {
    const ten = $('fullName').value.trim() || 'Chưa đặt tên';
    $('chipName').textContent = ten;
    const av = $('chipAv'), src = objURL || hoSo?.anhDaiDien;
    if (src) { av.innerHTML = ''; av.appendChild(Object.assign(new Image(), { src, alt: '' })); }
    else av.textContent = chuCaiDau(ten);
  }

  /* ===================== NGƯỠNG LƯU TRỮ ===================== */
  const ret = $('retention');
  function setRet() {
    const v = +ret.value;
    $('retentionOut').textContent =
      v === 365 ? '1 năm' : (v >= 30 && v % 30 === 0) ? `${v} ngày (${v / 30} tháng)` : `${v} ngày`;
    fill(ret);
  }
  ret.addEventListener('input', () => { setRet(); dirty(); });

  /* ===================== MẬT KHẨU ===================== */
  document.querySelectorAll('.eye').forEach(b => b.addEventListener('click', () => {
    const t = $(b.dataset.eye), hien = t.type === 'password';
    t.type = hien ? 'text' : 'password';
    b.setAttribute('aria-label', hien ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
  }));

  const CAP = [
    { n: 'Yếu', c: '#E5484D', h: 'Thêm chữ hoa và số' },
    { n: 'Trung bình', c: '#F79009', h: 'Thêm ký tự đặc biệt' },
    { n: 'Mạnh', c: '#2E90FA', h: 'Kéo dài trên 12 ký tự' },
    { n: 'Rất mạnh', c: '#12B76A', h: 'Đủ an toàn' }
  ];
  function doManh(p) {
    if (!p) return -1;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^\w\s]/.test(p)) s++;
    return Math.min(3, Math.max(0, s - 1));
  }
  const bars = [...document.querySelectorAll('#bars i')];
  function veDoManh() {
    const s = doManh($('newPass').value);
    bars.forEach((b, i) => b.style.background = (s >= 0 && i <= s) ? CAP[s].c : 'var(--line)');
    $('sLabel').textContent = s < 0 ? 'Chưa nhập mật khẩu' : 'Độ mạnh: ' + CAP[s].n;
    $('sLabel').style.color = s < 0 ? '' : CAP[s].c;
    $('sHint').textContent = s < 0 ? '' : CAP[s].h;
  }
  $('newPass').addEventListener('input', veDoManh);

  /* ===================== KIỂM TRA DỮ LIỆU ===================== */
  const coMatKhau = () => !!($('newPass').value || $('repPass').value || $('oldPass').value);
  const LUAT = {
    'f-name':  () => $('fullName').value.trim().length >= 2,
    'f-email': () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('email').value.trim()),
    'f-phone': () => $('phone').value.replace(/\D/g, '').length >= 9,
    'f-old':   () => !coMatKhau() || $('oldPass').value.length > 0,
    'f-new':   () => !coMatKhau() || $('newPass').value.length >= 8,
    'f-rep':   () => !coMatKhau() || $('repPass').value === $('newPass').value
  };
  function kiemTra(tatCa) {
    let ok = true, dau = null;
    for (const id in LUAT) {
      const tot = LUAT[id]();
      if (!tot) { ok = false; dau = dau || id; }
      const el = $(id);
      if (tatCa || el.classList.contains('bad')) el.classList.toggle('bad', !tot);
    }
    return { ok, dau };
  }
  ['fullName', 'email', 'phone', 'oldPass', 'newPass', 'repPass']
    .forEach(f => $(f).addEventListener('blur', () => kiemTra(false)));

  /** Gắn lỗi do máy chủ trả về vào đúng ô nhập */
  const MAP_LOI = {
    hoTen: 'f-name', email: 'f-email', dienThoai: 'f-phone',
    matKhauCu: 'f-old', matKhauMoi: 'f-new', nhapLai: 'f-rep'
  };
  function ganLoiServer(chiTiet) {
    if (!chiTiet) return null;
    let dau = null;
    for (const [truong, tb] of Object.entries(chiTiet)) {
      const id = MAP_LOI[truong];
      if (!id) continue;
      $(id).classList.add('bad');
      const p = $(id).querySelector('.err');
      if (p) p.textContent = tb;
      dau = dau || id;
    }
    return dau;
  }

  /* ===================== THEO DÕI THAY ĐỔI ===================== */
  const F = ['fullName', 'email', 'phone', 'city', 'mode', 'retention', 'memory',
             'oldPass', 'newPass', 'repPass'];
  const val = f => { const e = $(f); return e.type === 'checkbox' ? e.checked : e.value; };
  let daLuu = {};
  const chup = () => { const s = { ver: avatarVer }; F.forEach(f => s[f] = val(f)); return s; };
  function dirty() {
    let n = avatarVer !== daLuu.ver ? 1 : 0;
    for (const f of F) if (val(f) !== daLuu[f]) n++;
    $('dirty').classList.toggle('on', n > 0);
    $('dirtyText').textContent = n ? `${n} thay đổi chưa lưu` : 'Chưa có thay đổi';
    window.__dirty = n > 0;
  }
  F.forEach(f => { $(f).addEventListener('input', dirty); $(f).addEventListener('change', dirty); });
  $('fullName').addEventListener('input', syncChip);

  /* ===================== SỔ ĐỊA CHỈ (HTTMDTTHA-53) ===================== */
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const dayDu = a => `${a.diaChiCuThe}, ${a.phuongXa}, ${a.quanHuyen}, ${a.tinhThanh}`;

  function veDiaChi() {
    const list = $('addrList');
    $('addrCount').textContent = diaChi.length
      ? `${diaChi.length}/10 địa chỉ đã lưu`
      : 'Chưa có địa chỉ nào';

    if (!diaChi.length) {
      list.innerHTML = `
        <div class="empty">
          <div class="empty-ico"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg></div>
          <b>Chưa có địa chỉ nhận hàng</b>
          <p>Thêm địa chỉ để việc thanh toán nhanh hơn ở lần mua tiếp theo.</p>
          <button class="btn brand" type="button" data-act="them">Thêm Địa Chỉ Đầu Tiên</button>
        </div>`;
      return;
    }

    const sap = [...diaChi].sort((a, b) => b.macDinh - a.macDinh);
    list.innerHTML = sap.map(a => `
      <article class="addr${a.macDinh ? ' def' : ''}">
        <div class="addr-top">
          <span class="addr-name">${esc(a.hoTen)}</span>
          <span class="addr-phone">${esc(a.dienThoai)}</span>
          ${a.macDinh ? '<span class="tag def">Mặc định</span>' : ''}
          <span class="tag ${a.loai === 'Văn phòng' ? 'office' : 'home'}">${esc(a.loai)}</span>
        </div>
        <p>${esc(dayDu(a))}</p>
        <div class="addr-acts">
          <button class="act brand" data-act="sua" data-id="${a.id}">Sửa</button>
          <button class="act" data-act="macdinh" data-id="${a.id}" ${a.macDinh ? 'disabled' : ''}>Đặt mặc định</button>
          <button class="act danger" data-act="xoa" data-id="${a.id}">Xóa</button>
        </div>
      </article>`).join('');
  }

  $('addrList').addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const { act, id } = b.dataset;
    if (act === 'them') return moModal(null);
    if (act === 'sua') return moModal(diaChi.find(a => a.id === id));
    if (act === 'macdinh') return datMacDinh(id);
    if (act === 'xoa') return xoaDiaChi(id);
  });
  $('addAddrBtn').addEventListener('click', () => {
    if (diaChi.length >= 10) return toast('Mỗi tài khoản chỉ lưu tối đa 10 địa chỉ.', true);
    moModal(null);
  });

  async function datMacDinh(id) {
    try {
      if (NGOAI_TUYEN) diaChi.forEach(a => a.macDinh = a.id === id);
      else diaChi = (await api(`/api/addresses/${id}/default`, { method: 'PUT' })).duLieu;
      veDiaChi(); toast('Đã đặt làm địa chỉ mặc định.');
    } catch (e) { toast(e.message, true); }
  }

  async function xoaDiaChi(id) {
    const a = diaChi.find(x => x.id === id);
    if (!confirm(`Xóa địa chỉ của ${a.hoTen} tại ${dayDu(a)}?`)) return;
    try {
      if (NGOAI_TUYEN) {
        diaChi = diaChi.filter(x => x.id !== id);
        if (a.macDinh && diaChi.length) diaChi[0].macDinh = true;
      } else {
        await api(`/api/addresses/${id}`, { method: 'DELETE' });
        diaChi = (await api('/api/addresses')).duLieu;
      }
      veDiaChi(); toast('Đã xóa địa chỉ.');
    } catch (e) { toast(e.message, true); }
  }

  /* ---------- Modal địa chỉ ---------- */
  const overlay = $('overlay');
  const O = ['f-aName', 'f-aPhone', 'f-aCity', 'f-aDist', 'f-aWard', 'f-aLine'];
  let dangSua = null, phanTuTruoc = null;

  const LUAT_ADDR = {
    'f-aName':  () => $('aName').value.trim().length >= 2,
    'f-aPhone': () => $('aPhone').value.replace(/\D/g, '').length >= 9,
    'f-aCity':  () => !!$('aCity').value,
    'f-aDist':  () => $('aDist').value.trim().length > 0,
    'f-aWard':  () => $('aWard').value.trim().length > 0,
    'f-aLine':  () => $('aLine').value.trim().length > 0
  };

  function moModal(a) {
    dangSua = a || null;
    phanTuTruoc = document.activeElement;
    $('modalTitle').textContent = a ? 'Sửa Địa Chỉ' : 'Thêm Địa Chỉ Mới';
    $('aName').value = a?.hoTen || hoSo?.hoTen || '';
    $('aPhone').value = a?.dienThoai || '';
    $('aCity').value = a?.tinhThanh || 'Hà Nội';
    $('aDist').value = a?.quanHuyen || '';
    $('aWard').value = a?.phuongXa || '';
    $('aLine').value = a?.diaChiCuThe || '';
    $('aDefault').checked = !!a?.macDinh;
    $('aDefault').disabled = !!a?.macDinh;      // không cho bỏ tick địa chỉ mặc định
    document.querySelectorAll('input[name="aType"]').forEach(r => {
      r.checked = r.value === (a?.loai || 'Nhà riêng');
    });
    O.forEach(id => $(id).classList.remove('bad'));
    overlay.classList.add('on');
    setTimeout(() => $('aName').focus(), 40);
  }

  function dongModal() {
    overlay.classList.remove('on');
    dangSua = null;
    phanTuTruoc?.focus();
  }
  $('modalClose').addEventListener('click', dongModal);
  $('modalCancel').addEventListener('click', dongModal);
  overlay.addEventListener('mousedown', e => { if (e.target === overlay) dongModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('on')) dongModal(); });

  $('modalSave').addEventListener('click', async () => {
    let ok = true, dau = null;
    for (const id in LUAT_ADDR) {
      const tot = LUAT_ADDR[id]();
      $(id).classList.toggle('bad', !tot);
      if (!tot) { ok = false; dau = dau || id; }
    }
    if (!ok) { $(dau).querySelector('.ctrl').focus(); return toast('Còn vài ô cần điền.', true); }

    const body = {
      hoTen: $('aName').value.trim(),
      dienThoai: $('aPhone').value.trim(),
      tinhThanh: $('aCity').value,
      quanHuyen: $('aDist').value.trim(),
      phuongXa: $('aWard').value.trim(),
      diaChiCuThe: $('aLine').value.trim(),
      loai: document.querySelector('input[name="aType"]:checked').value,
      macDinh: $('aDefault').checked
    };

    const btn = $('modalSave');
    btn.classList.add('loading'); btn.disabled = true;
    try {
      if (NGOAI_TUYEN) {
        if (dangSua) Object.assign(dangSua, body);
        else diaChi.push({ id: 'a' + Date.now().toString(36), ...body });
        if (body.macDinh || diaChi.length === 1) {
          const id = dangSua ? dangSua.id : diaChi.at(-1).id;
          diaChi.forEach(x => x.macDinh = x.id === id);
        }
      } else {
        if (dangSua) await api(`/api/addresses/${dangSua.id}`, { method: 'PUT', body: JSON.stringify(body) });
        else await api('/api/addresses', { method: 'POST', body: JSON.stringify(body) });
        diaChi = (await api('/api/addresses')).duLieu;
      }
      veDiaChi();
      toast(dangSua ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ mới.');
      dongModal();
    } catch (e) {
      toast(e.message, true);
    } finally {
      btn.classList.remove('loading'); btn.disabled = false;
    }
  });

  /* ===================== NẠP DỮ LIỆU ===================== */
  function dienHoSo(u) {
    hoSo = u;
    $('fullName').value = u.hoTen;
    $('email').value = u.email;
    $('phone').value = u.dienThoai;
    $('city').value = u.tinhThanh;
    $('mode').value = u.cheDoAI;
    ret.value = u.soNgayLuuTru;
    $('memory').checked = u.ghiNhoNguCanh;
    $('emailBadge').textContent = u.emailDaXacMinh ? 'Đã xác minh' : 'Chưa xác minh';
    $('emailBadge').classList.toggle('ok', !!u.emailDaXacMinh);

    if (u.anhDaiDien) {
      const im = new Image();
      im.onload = () => {
        img = im; preview.src = u.anhDaiDien;
        preview.style.width = im.naturalWidth + 'px';
        preview.style.height = im.naturalHeight + 'px';
        base = Math.max(VIEW / im.naturalWidth, VIEW / im.naturalHeight);
        scale = 1; dx = 0; dy = 0;
        viewport.classList.add('has'); $('calib').classList.add('on');
        $('removeBtn').disabled = false;
        paint(); syncChip();
        daLuu = chup(); dirty();
      };
      im.src = u.anhDaiDien;
    }
    setRet(); fill(zoom); veDoManh(); syncChip();
    daLuu = chup(); dirty();
  }

  async function napTrang() {
    try {
      const [a, b] = await Promise.all([api('/api/profile'), api('/api/addresses')]);
      dienHoSo(a.duLieu);
      diaChi = b.duLieu;
    } catch (e) {
      NGOAI_TUYEN = true;
      $('offline').classList.add('on');
      dienHoSo(structuredClone(MAU.hoSo));
      diaChi = structuredClone(MAU.diaChi);
    }
    veDiaChi();
    moveGlider();
  }

  /* ===================== LƯU / HỦY ===================== */
  function toiO(id) {
    const p = $(id).closest('.panel');
    select(PANELS.indexOf(p.id));
    $(id).querySelector('.ctrl')?.focus();
  }

  async function luu() {
    // khôi phục thông báo lỗi mặc định trước mỗi lần lưu
    $('e-old').textContent = 'Nhập mật khẩu hiện tại để xác nhận.';
    $('e-new').textContent = 'Mật khẩu cần tối thiểu 8 ký tự.';
    $('e-rep').textContent = 'Hai mật khẩu chưa khớp nhau.';

    const r = kiemTra(true);
    if (!r.ok) { toiO(r.dau); return toast('Còn vài ô cần sửa trước khi lưu.', true); }

    const btn = $('saveBtn');
    btn.classList.add('loading'); btn.disabled = true;

    const hoSoMoi = {
      hoTen: $('fullName').value.trim(),
      email: $('email').value.trim(),
      dienThoai: $('phone').value.trim(),
      tinhThanh: $('city').value,
      cheDoAI: $('mode').value,
      soNgayLuuTru: +ret.value,
      ghiNhoNguCanh: $('memory').checked
    };

    try {
      if (NGOAI_TUYEN) {
        Object.assign(hoSo, hoSoMoi);
        await new Promise(r => setTimeout(r, 400));
      } else {
        // HTTMDTTHA-48 — cập nhật hồ sơ
        hoSo = (await api('/api/profile', { method: 'PUT', body: JSON.stringify(hoSoMoi) })).duLieu;

        // HTTMDTTHA-49 — ảnh đại diện, chỉ gửi khi có thay đổi
        if (avatarVer !== daLuu.ver) {
          if (img) {
            const kq = await api('/api/profile/avatar', {
              method: 'POST', body: JSON.stringify({ anhDaiDien: xuatAnh() })
            });
            hoSo.anhDaiDien = kq.duLieu.anhDaiDien;
          } else if (hoSo.anhDaiDien) {
            await api('/api/profile/avatar', { method: 'DELETE' });
            hoSo.anhDaiDien = null;
          }
        }

        // HTTMDTTHA-48 — đổi mật khẩu, chỉ gửi khi người dùng có nhập
        if (coMatKhau()) {
          await api('/api/profile/password', {
            method: 'PUT',
            body: JSON.stringify({
              matKhauCu: $('oldPass').value,
              matKhauMoi: $('newPass').value,
              nhapLai: $('repPass').value
            })
          });
        }
      }

      ['oldPass', 'newPass', 'repPass'].forEach(f => $(f).value = '');
      veDoManh();
      $('emailBadge').textContent = hoSo.emailDaXacMinh ? 'Đã xác minh' : 'Chưa xác minh';
      $('emailBadge').classList.toggle('ok', !!hoSo.emailDaXacMinh);
      daLuu = chup(); dirty();
      toast(NGOAI_TUYEN ? 'Đã lưu tạm (chế độ ngoại tuyến).' : 'Đã lưu hồ sơ thành công.');
    } catch (e) {
      const dau = ganLoiServer(e.chiTiet);
      if (dau) toiO(dau);
      toast(e.message, true);
    } finally {
      btn.classList.remove('loading'); btn.disabled = false;
    }
  }

  $('saveBtn').addEventListener('click', luu);
  $('cancelBtn').addEventListener('click', () => {
    F.forEach(f => { const e = $(f); if (e.type === 'checkbox') e.checked = daLuu[f]; else e.value = daLuu[f]; });
    document.querySelectorAll('.field.bad').forEach(e => e.classList.remove('bad'));
    if (avatarVer !== daLuu.ver && !hoSo?.anhDaiDien) xoaAnh();
    avatarVer = daLuu.ver;
    setRet(); fill(zoom); veDoManh(); syncChip(); dirty();
    toast('Đã hoàn tác thay đổi.', true);
  });
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); luu(); }
  });
  addEventListener('beforeunload', e => { if (window.__dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ===================== TOAST ===================== */
  let hen;
  function toast(msg, canhBao) {
    $('toastText').textContent = msg;
    const t = $('toast');
    t.classList.toggle('warn', !!canhBao);
    t.classList.add('show');
    clearTimeout(hen);
    hen = setTimeout(() => t.classList.remove('show'), 2800);
  }

  /* ===================== KHỞI ĐỘNG ===================== */
  napTrang();
})();
