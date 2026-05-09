Router.register('admin', (app) => {
  const user = Auth.get();
  if (!user) return Router.go('login');

  app.innerHTML = `
  <div class="app">
    <aside class="sidebar" id="sb">
      <div class="sb-head">
        <div class="sb-logo">
          <img src="/logo.png" alt="Logo" style="width:38px;height:38px;border-radius:9px;object-fit:cover;flex-shrink:0"/>
          <div><div class="sb-logo-name">SIPADES</div><div class="sb-logo-sub">Panel ${user.role==='admin'?'Administrator':'Admin Desa'}</div></div>
        </div>
        <div class="sb-user">
          <div class="sb-av" style="background:linear-gradient(135deg,#0F3D22,var(--a))">${initials(user.name)}</div>
          <div style="flex:1;min-width:0">
            <div class="sb-uname">${user.name}</div>
            <div class="sb-urole">${user.role==='admin'?'Administrator':'Admin Desa'}</div>
          </div>
        </div>
      </div>
      <nav class="sb-nav">
        <div class="sb-sec">Menu Utama</div>
        <a class="sb-item active" data-p="dashboard"><i class="fa-solid fa-chart-pie sb-ic"></i> Dashboard</a>
        <a class="sb-item" data-p="kelola"><i class="fa-solid fa-folder-open sb-ic"></i> Kelola Surat</a>
        <div class="sb-sec">Data</div>
        <a class="sb-item" data-p="warga"><i class="fa-solid fa-users sb-ic"></i> Data Warga</a>
        <a class="sb-item" data-p="pesan"><i class="fa-solid fa-envelope sb-ic"></i> Pesan Masuk</a>
      </nav>
      <div class="sb-foot">
        <div class="sb-logout" id="logout"><i class="fa-solid fa-right-from-bracket"></i> Keluar</div>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn btn-ghost btn-icon" id="sb-tog" style="display:none"><i class="fa-solid fa-bars"></i></button>
          <span class="tb-title" id="tb-title">Dashboard</span>
        </div>
        <div class="tb-right">
          <div style="position:relative">
            <button class="tb-btn" id="notif-btn"><i class="fa-regular fa-bell"></i><span class="notif-dot hidden" id="n-dot"></span></button>
            <div class="notif-dd hidden" id="notif-dd"></div>
          </div>
        </div>
      </header>
      <main class="pg-content" id="pgc"></main>
    </div>
  </div>`;

  const titles = { dashboard:'Dashboard', kelola:'Kelola Surat', warga:'Data Warga', pesan:'Pesan Masuk' };

  $$('.sb-item', app).forEach(el => {
    el.onclick = e => {
      e.preventDefault();
      $$('.sb-item', app).forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      $('#tb-title', app).textContent = titles[el.dataset.p];
      loadPage(el.dataset.p);
    };
  });

  $('#logout', app).onclick = () => Modal.confirm('Keluar', 'Yakin ingin keluar?', () => { Auth.clear(); Router.go('login'); });

  if (window.innerWidth <= 768) {
    $('#sb-tog', app).style.display = 'flex';
    $('#sb-tog', app).onclick = () => $('#sb', app).classList.toggle('open');
  }

  loadNotif();
  $('#notif-btn', app).onclick = e => {
    e.stopPropagation();
    const dd = $('#notif-dd', app);
    dd.classList.toggle('hidden');
    if (!dd.classList.contains('hidden')) {
      API.patch('/notifikasi/read-all', {}).then(() => {
        $('#n-dot', app)?.classList.add('hidden');
      });
      // Reload notif saat dibuka
      loadNotif();
    }
  };
  document.onclick = () => $('#notif-dd', app)?.classList.add('hidden');

  let _notifData = [];

  async function loadNotif() {
    // Load notif warga biasa + admin activity
    const [res, adminRes] = await Promise.all([
      API.get('/notifikasi'),
      API.get('/notifikasi/admin')
    ]);
    if (!res.success) return;

    // Gabung notif personal + activity admin
    const adminItems = adminRes.success ? adminRes.data : [];
    const personalItems = res.data || [];
    _notifData = { personal: personalItems, activity: adminItems };

    const totalUnread = (res.unread || 0) + (adminRes.unread || 0);
    if (totalUnread > 0) {
      $('#n-dot', app)?.classList.remove('hidden');
    } else {
      $('#n-dot', app)?.classList.add('hidden');
    }

    // Update dropdown if it's open
    const dd = $('#notif-dd', app);
    if (!dd.classList.contains('hidden')) {
      renderNotifDropdown(adminItems, totalUnread);
    } else {
      renderNotifDropdown(adminItems, totalUnread);
    }
  }

  function renderNotifDropdown(items, unread) {
    const dd = $('#notif-dd', app);
    const top4 = items.slice(0, 4);
    const tipeIcon = { surat:'fa-file-lines', pesan:'fa-envelope' };
    const tipeColor = { surat:'var(--p)', pesan:'var(--info)' };

    dd.innerHTML = '<div class="nd-head"><h4>Notifikasi</h4>'
      + (unread > 0 ? '<span class="badge badge-primary">' + unread + ' baru</span>' : '')
      + '</div>'
      + (!top4.length
        ? '<div style="padding:20px;text-align:center;color:var(--text-3);font-size:13px">Tidak ada notifikasi</div>'
        : top4.map(function(n) {
            const ic = tipeIcon[n.tipe] || 'fa-bell';
            const col = tipeColor[n.tipe] || 'var(--p)';
            const label = n.tipe === 'surat'
              ? '<strong>' + n.nama + '</strong> mengajukan <em>' + n.keterangan + '</em>'
              : 'Pesan dari <strong>' + n.nama + '</strong>: ' + (n.ref || '');
            return '<div class="nd-item">'
              + '<div style="width:32px;height:32px;background:' + col + '20;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">'
              + '<i class="fa-solid ' + ic + '" style="color:' + col + ';font-size:13px"></i></div>'
              + '<div style="flex:1;min-width:0">'
              + '<div class="nd-title" style="font-size:12.5px;line-height:1.4">' + label + '</div>'
              + '<div class="nd-time">' + fmtDT(n.created_at) + '</div>'
              + '</div></div>';
          }).join(''))
      + '<div id="nd-all-btn" style="padding:10px 16px;text-align:center;border-top:1px solid var(--border);cursor:pointer;font-size:13px;font-weight:600;color:var(--p)">Lihat Semua Notifikasi →</div>';

    document.getElementById('nd-all-btn')?.addEventListener('click', function() {
      $('#notif-dd', app).classList.add('hidden');
      showAllNotifAdmin(_notifData);
    });
  }

  // Poll setiap 30 detik untuk notif real-time
  setInterval(function(){ if(document.visibilityState==="visible") loadNotif(); }, 5000);

  function loadPage(p) {
    const c = $('#pgc', app);
    c.innerHTML = ''; c.classList.remove('fade-in');
    void c.offsetWidth; c.classList.add('fade-in');
    const map = { dashboard: pgDashboard, kelola: pgKelola, warga: pgWarga, pesan: pgPesan };
    if (map[p]) map[p](c);
  }

  loadPage('dashboard');

  // ── DASHBOARD ──────────────────────────────────────────────
  async function pgDashboard(el) {
    el.innerHTML = '<div class="loading"><div class="spin"></div></div>';
    const res = await API.get('/admin/dashboard');
    if (!res.success) { el.innerHTML = '<div class="alert alert-danger"><i class="fa-solid fa-circle-xmark"></i>Gagal memuat data</div>'; return; }
    const { stats: s, warga: w, recent, monthly } = res.data;
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    const maxV = Math.max(...monthly.map(m => m.total), 1);

    el.innerHTML = `
    <div class="pg-head">
      <div class="pg-head-inner">
        <div><h2>Dashboard Overview</h2><p>${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div>
        <div class="pg-head-icon"><i class="fa-solid fa-chart-pie"></i></div>
      </div>
    </div>

    <div class="grid g4 mb-4">
      <div class="stat-card"><div class="stat-icon" style="background:var(--p-50);color:var(--p)"><i class="fa-solid fa-folder-open"></i></div><div><div class="stat-val">${s.total||0}</div><div class="stat-lbl">Total Pengajuan</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--warning-50);color:var(--warning)"><i class="fa-solid fa-hourglass-half"></i></div><div><div class="stat-val">${s.pending||0}</div><div class="stat-lbl">Menunggu Proses</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--info-50);color:var(--info)"><i class="fa-solid fa-rotate"></i></div><div><div class="stat-val">${s.diproses||0}</div><div class="stat-lbl">Sedang Diproses</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--success-50);color:var(--success)"><i class="fa-solid fa-users"></i></div><div><div class="stat-val">${w.total_warga||0}</div><div class="stat-lbl">Total Warga</div></div></div>
    </div>

    <div class="grid g2">
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div class="card-title">Pengajuan Terbaru</div>
          <button class="btn btn-ghost btn-sm" id="see-kelola">Kelola →</button>
        </div>
        ${!recent.length ? '<div class="empty"><div class="empty-ic"><i class="fa-solid fa-inbox"></i></div><h4>Belum ada pengajuan</h4></div>'
          : recent.map(r=>`
          <div class="req-card mb-2" data-id="${r.id}" style="cursor:pointer">
            <div class="req-ic"><i class="fa-solid fa-file-lines"></i></div>
            <div style="flex:1;min-width:0">
              <div class="req-title">${r.warga_name}</div>
              <div class="req-sub">${r.jenis_surat_nama} · ${fmtDate(r.created_at)}</div>
            </div>
            <div>${badge(r.status)}</div>
          </div>`).join('')}
      </div>

      <div class="card">
        <div class="card-title mb-3">Statistik Bulanan ${new Date().getFullYear()}</div>
        <div style="display:flex;align-items:flex-end;gap:5px;height:150px;padding-bottom:4px">
          ${months.map((m,i) => {
            const found = monthly.find(x=>x.bulan===i+1);
            const v = found ? +found.total : 0;
            const h = Math.max(Math.round((v/maxV)*130), v>0?4:2);
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
              <div style="font-size:9px;color:var(--text-3);font-weight:600">${v||''}</div>
              <div style="width:100%;height:${h}px;background:${v>0?'var(--p)':'var(--border)'};border-radius:4px 4px 0 0;transition:height .4s"></div>
              <div style="font-size:9px;color:var(--text-3)">${m}</div>
            </div>`;
          }).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
          ${[['Disetujui',s.disetujui||0,'var(--success)'],['Ditolak',s.ditolak||0,'var(--danger)'],['Selesai',s.selesai||0,'var(--purple)']].map(([l,v,c])=>
            `<div style="text-align:center"><div style="font-size:20px;font-weight:800;color:${c}">${v}</div><div style="font-size:11px;color:var(--text-3)">${l}</div></div>`).join('')}
        </div>
      </div>
    </div>`;

    el.querySelector('#see-kelola')?.addEventListener('click', () => {
      $$('.sb-item', app).forEach(x=>x.classList.remove('active'));
      $$('.sb-item[data-p="kelola"]', app)[0]?.classList.add('active');
      $('#tb-title', app).textContent = 'Kelola Surat'; loadPage('kelola');
    });
    el.querySelectorAll('.req-card[data-id]').forEach(c => c.onclick=()=>showDetailSurat(c.dataset.id));
  }

  // ── KELOLA SURAT ───────────────────────────────────────────
  async function pgKelola(el) {
    let curStatus = null, curPage = 1, searchVal = '';

    el.innerHTML = `
    <div class="pg-head">
      <div class="pg-head-inner">
        <div><h2>Kelola Surat</h2><p>Proses dan kelola semua pengajuan surat dari warga desa</p></div>
        <div class="pg-head-icon"><i class="fa-solid fa-folder-open"></i></div>
      </div>
    </div>
    <div class="card mb-3">
      <div class="filter-bar">
        <div class="s-input" style="flex:1;min-width:200px">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="kel-search" class="form-control" placeholder="Cari nama warga atau nomor pengajuan..."/>
        </div>
      </div>
      <div class="tabs">
        ${[['','Semua'],['pending','Menunggu'],['diproses','Diproses'],['disetujui','Disetujui'],['selesai','Selesai'],['ditolak','Ditolak']].map(([v,l])=>
          `<button class="tab ${v===''?'on':''}" data-v="${v}">${l}</button>`).join('')}
      </div>
    </div>
    <div id="kel-list"></div>`;

    const doSearch = debounce(v => { searchVal = v; curPage = 1; load(); }, 400);
    $('#kel-search', el).oninput = e => doSearch(e.target.value);

    $$('.tab', el).forEach(t => {
      t.onclick = () => {
        $$('.tab', el).forEach(x=>x.classList.remove('on'));
        t.classList.add('on');
        curStatus = t.dataset.v || null; curPage = 1; load();
      };
    });

    async function load() {
      const listEl = $('#kel-list', el);
      listEl.innerHTML = '<div class="loading"><div class="spin"></div></div>';
      let url = `/admin/surat?page=${curPage}&limit=10`;
      if (curStatus) url += `&status=${curStatus}`;
      if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;
      const res = await API.get(url);
      const list = res.data || [], total = res.pagination?.total || 0, tp = Math.ceil(total/10);

      if (!list.length) {
        listEl.innerHTML = '<div class="card"><div class="empty"><div class="empty-ic"><i class="fa-solid fa-inbox"></i></div><h4>Tidak ada pengajuan</h4><p>Tidak ditemukan pengajuan pada filter ini</p></div></div>';
        return;
      }

      listEl.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>No. Pengajuan</th><th>Warga</th><th>Jenis Surat</th><th>Tgl Pengajuan</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${list.map(s => `
            <tr>
              <td><span style="font-weight:700;font-size:12px;color:var(--p)">${s.nomor_pengajuan}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:32px;height:32px;background:var(--p-50);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--p);flex-shrink:0">${initials(s.warga_name)}</div>
                  <div><div style="font-weight:600;font-size:13px">${s.warga_name}</div><div style="font-size:11px;color:var(--text-3)">${s.warga_nik||''}</div></div>
                </div>
              </td>
              <td>
                <span style="background:var(--p-50);color:var(--p);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700">${s.jenis_surat_kode}</span>
                <div style="font-size:12px;color:var(--text-2);margin-top:2px">${s.jenis_surat_nama}</div>
              </td>
              <td style="font-size:12.5px;color:var(--text-2)">${fmtDate(s.created_at)}</td>
              <td>${badge(s.status)}</td>
              <td>
                <div class="tbl-actions">
                  <button class="btn btn-ghost btn-sm btn-det" data-id="${s.id}" title="Detail"><i class="fa-solid fa-eye"></i></button>
                  ${s.status==='pending' ? `<button class="btn btn-warning btn-sm btn-pros" data-id="${s.id}" title="Proses"><i class="fa-solid fa-rotate"></i></button>` : ''}
                  ${s.status==='diproses' ? `
                    <button class="btn btn-success btn-sm btn-set" data-id="${s.id}" title="Setujui"><i class="fa-solid fa-check"></i></button>
                    <button class="btn btn-danger btn-sm btn-tol" data-id="${s.id}" title="Tolak"><i class="fa-solid fa-xmark"></i></button>` : ''}
                  ${s.status==='disetujui' ? `<button class="btn btn-primary btn-sm btn-terb" data-id="${s.id}" title="Terbitkan"><i class="fa-solid fa-print"></i></button>` : ''}
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="pgn mt-4">
        <div class="pgn-info">Menampilkan ${list.length} dari ${total} pengajuan</div>
        <div class="pgn-btns">
          <button class="pgn-btn" id="pp" ${curPage<=1?'disabled':''}><i class="fa-solid fa-chevron-left"></i></button>
          <button class="pgn-btn on">${curPage} / ${tp||1}</button>
          <button class="pgn-btn" id="np" ${curPage>=tp?'disabled':''}><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>`;

      listEl.querySelectorAll('.btn-det').forEach(b  => b.onclick = () => showDetailSurat(b.dataset.id));
      listEl.querySelectorAll('.btn-pros').forEach(b => b.onclick = () => updateStatus(b.dataset.id,'diproses',null,load));
      listEl.querySelectorAll('.btn-set').forEach(b  => b.onclick = () => dlgSetujui(b.dataset.id,load));
      listEl.querySelectorAll('.btn-tol').forEach(b  => b.onclick = () => dlgTolak(b.dataset.id,load));
      listEl.querySelectorAll('.btn-terb').forEach(b => b.onclick = () => dlgTerbitkan(b.dataset.id,load));
      listEl.querySelector('#pp')?.addEventListener('click', () => { curPage--; load(); });
      listEl.querySelector('#np')?.addEventListener('click', () => { curPage++; load(); });
    }

    load();
  }

  // ── DATA WARGA ─────────────────────────────────────────────
  async function pgWarga(el) {
    let curPage = 1, searchVal = '';

    el.innerHTML = `
    <div class="pg-head">
      <div class="pg-head-inner">
        <div><h2>Data Warga</h2><p>Daftar seluruh warga yang terdaftar di sistem SIPADES</p></div>
        <div class="pg-head-icon"><i class="fa-solid fa-users"></i></div>
      </div>
    </div>
    <div class="card mb-3">
      <div class="s-input">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="wg-search" class="form-control" placeholder="Cari nama, NIK, atau email warga..."/>
      </div>
    </div>
    <div id="wg-list"></div>`;

    const doSearch = debounce(v => { searchVal = v; curPage = 1; load(); }, 400);
    $('#wg-search', el).oninput = e => doSearch(e.target.value);

    async function load() {
      const listEl = $('#wg-list', el);
      listEl.innerHTML = '<div class="loading"><div class="spin"></div></div>';
      let url = `/admin/warga?page=${curPage}&limit=10`;
      if (searchVal) url += `&search=${encodeURIComponent(searchVal)}`;
      const res = await API.get(url);
      const list = res.data || [], total = res.pagination?.total || 0, tp = Math.ceil(total/10);

      if (!list.length) {
        listEl.innerHTML = '<div class="card"><div class="empty"><div class="empty-ic"><i class="fa-solid fa-users"></i></div><h4>Belum ada warga</h4><p>Data warga terdaftar akan tampil di sini</p></div></div>';
        return;
      }

      listEl.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Warga</th><th>NIK</th><th>Email</th><th>No. Telepon</th><th>Tgl Daftar</th></tr></thead>
          <tbody>
            ${list.map(w => `
            <tr class="warga-row" style="cursor:pointer" data-id="${w.id}" data-name="${w.name}" data-nik="${w.nik||''}" data-email="${w.email||''}" data-phone="${w.phone||''}" data-address="${w.address||''}" data-tgl="${fmtDate(w.created_at)}">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:36px;height:36px;background:var(--p-50);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--p);flex-shrink:0">${initials(w.name)}</div>
                  <div><div style="font-weight:600">${w.name}</div><div style="font-size:11px;color:var(--text-3)">Klik untuk detail</div></div>
                </div>
              </td>
              <td style="font-size:12.5px;font-family:monospace">${w.nik||'-'}</td>
              <td style="font-size:12.5px;color:var(--text-2)">${w.email||'-'}</td>
              <td style="font-size:12.5px;color:var(--text-2)">${w.phone||'-'}</td>
              <td style="font-size:12px;color:var(--text-3)">${fmtDate(w.created_at)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="pgn mt-4">
        <div class="pgn-info">${total} warga terdaftar</div>
        <div class="pgn-btns">
          <button class="pgn-btn" id="pp" ${curPage<=1?'disabled':''}><i class="fa-solid fa-chevron-left"></i></button>
          <button class="pgn-btn on">${curPage} / ${tp||1}</button>
          <button class="pgn-btn" id="np" ${curPage>=tp?'disabled':''}><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>`;

      listEl.querySelector('#pp')?.addEventListener('click', () => { curPage--; load(); });
      listEl.querySelector('#np')?.addEventListener('click', () => { curPage++; load(); });

      // Onclick detail warga
      listEl.querySelectorAll('.warga-row').forEach(function(row) {
        row.onclick = function() {
          Modal.show(
            '<div class="modal-header">'
            + '<div><h3 class="modal-title">' + row.dataset.name + '</h3>'
            + '<span class="badge badge-primary" style="margin-top:4px">Warga Desa</span></div>'
            + '<button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>'
            + '<div style="text-align:center;padding:14px 0 18px">'
            + '<div style="width:64px;height:64px;background:linear-gradient(135deg,var(--p),var(--p-light));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;margin:0 auto 10px">' + initials(row.dataset.name) + '</div>'
            + '<div style="font-size:17px;font-weight:800">' + row.dataset.name + '</div>'
            + '</div>'
            + '<div>'
            + '<div class="irow"><span class="ilabel">NIK</span><span class="ival" style="font-family:monospace">' + (row.dataset.nik||'-') + '</span></div>'
            + '<div class="irow"><span class="ilabel">Email</span><span class="ival">' + (row.dataset.email||'-') + '</span></div>'
            + '<div class="irow"><span class="ilabel">No. Telepon</span><span class="ival">' + (row.dataset.phone||'-') + '</span></div>'
            + '<div class="irow"><span class="ilabel">Alamat</span><span class="ival">' + (row.dataset.address||'-') + '</span></div>'
            + '<div class="irow"><span class="ilabel">Tgl Daftar</span><span class="ival">' + row.dataset.tgl + '</span></div>'
            + '</div>'
            + '<div class="modal-foot"><button class="btn btn-secondary modal-close">Tutup</button></div>'
          );
        };
      });
    }

    load();
  }

  // ── PESAN MASUK ──────────────────────────────────────────
  async function pgPesan(el) {
    el.innerHTML = '<div class="loading"><div class="spin"></div></div>';
    const res = await API.get('/admin/kontak');
    const list = res.data || [];
    let selected = new Set();

    function render() {
      el.innerHTML = '<div class="pg-head"><div class="pg-head-inner">'
        + '<div><h2>Pesan Masuk</h2><p>Pesan dan pertanyaan dari warga desa</p></div>'
        + '<div class="pg-head-icon"><i class="fa-solid fa-envelope"></i></div>'
        + '</div></div>';

      if (!list.length) {
        el.innerHTML += '<div class="card"><div class="empty"><div class="empty-ic"><i class="fa-solid fa-envelope-open"></i></div><h4>Tidak ada pesan</h4><p>Pesan dari warga akan muncul di sini</p></div></div>';
        return;
      }

      const toolbar = document.createElement('div');
      toolbar.style = 'display:flex;justify-content:flex-end;gap:8px;margin-bottom:14px';
      toolbar.innerHTML = '<button id="pm-sel-all" class="btn btn-secondary btn-sm"><i class="fa-regular fa-square-check"></i> Pilih Semua</button>'
        + '<button id="pm-del-sel" class="btn btn-danger btn-sm" style="display:none"><i class="fa-solid fa-trash"></i> Hapus Dipilih</button>'
      el.appendChild(toolbar);

      const grid = document.createElement('div');
      grid.className = 'grid g2';
      grid.innerHTML = list.map(function(m) {
        return '<div class="card card-hover pesan-item" data-id="' + m.id + '" style="cursor:pointer">'
          + '<div style="display:flex;align-items:flex-start;gap:10px">'
          + '<input type="checkbox" class="pm-cb" data-id="' + m.id + '" style="margin-top:4px;flex-shrink:0;width:16px;height:16px" onclick="event.stopPropagation()"/>'
          + '<div style="width:40px;height:40px;background:' + (m.is_read?'var(--s2)':'var(--p-50)') + ';border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;color:' + (m.is_read?'var(--text-3)':'var(--p)') + ';flex-shrink:0">'
          + '<i class="fa-' + (m.is_read?'regular':'solid') + ' fa-envelope"></i></div>'
          + '<div style="flex:1;min-width:0">'
          + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px">'
          + '<div style="font-weight:' + (m.is_read?600:800) + ';font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + m.nama + '</div>'
          + (!m.is_read?'<div style="width:8px;height:8px;background:var(--p);border-radius:50%;flex-shrink:0"></div>':'')
          + '</div>'
          + '<div style="font-size:13px;color:var(--text-2);font-weight:600;margin-bottom:3px">' + m.subjek + '</div>'
          + '<div style="font-size:12.5px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + m.pesan + '</div>'
          + '<div style="font-size:11px;color:var(--text-3);margin-top:3px">' + fmtDT(m.created_at) + '</div>'
          + '</div></div></div>';
      }).join('');
      el.appendChild(grid);

      // Checkbox handlers
      el.querySelectorAll('.pm-cb').forEach(function(cb) {
        cb.onchange = function() {
          if (cb.checked) selected.add(+cb.dataset.id); else selected.delete(+cb.dataset.id);
          el.querySelector('#pm-del-sel').style.display = selected.size ? 'inline-flex' : 'none';
        };
      });

      el.querySelector('#pm-sel-all').onclick = function() {
        const cbs = el.querySelectorAll('.pm-cb');
        const allChecked = [...cbs].every(cb => cb.checked);
        cbs.forEach(function(cb) { cb.checked = !allChecked; if(!allChecked) selected.add(+cb.dataset.id); else selected.delete(+cb.dataset.id); });
        el.querySelector('#pm-del-sel').style.display = selected.size ? 'inline-flex' : 'none';
      };

      el.querySelector('#pm-del-sel').onclick = function() {
        Modal.confirm('Hapus Pesan', 'Hapus ' + selected.size + ' pesan yang dipilih?', async function() {
          await API.del('/kontak', { ids: [...selected] });
          Toast.success('Pesan dihapus');
          pgPesan(el);
        });
      };


      // Click item untuk detail + balas
      el.querySelectorAll('.pesan-item').forEach(function(item) {
        item.onclick = async function() {
          const m = list.find(x => x.id == item.dataset.id);
          if (!m) return;
          const bRes = await API.get('/kontak/' + m.id + '/balasan');
          const bList = bRes.data || [];
          const bHtml = bList.map(function(b) {
            return '<div style="background:var(--p-50);border:1px solid var(--p-100);border-radius:var(--r);padding:11px 13px;margin-top:8px">'
              + '<div style="display:flex;justify-content:space-between;margin-bottom:4px">'
              + '<span style="font-size:12px;font-weight:700;color:var(--p)"><i class="fa-solid fa-reply" style="margin-right:5px"></i>' + b.admin_name + '</span>'
              + '<span style="font-size:11px;color:var(--text-3)">' + fmtDT(b.created_at) + '</span>'
              + '</div>'
              + '<div style="font-size:13px;color:var(--text-2)">' + b.balasan + '</div>'
              + '</div>';
          }).join('');

          Modal.show(
            '<div class="modal-header">'
            + '<div><h3 class="modal-title">' + m.subjek + '</h3>'
            + '<div style="font-size:12px;color:var(--text-3);margin-top:2px">' + fmtDT(m.created_at) + '</div></div>'
            + '<button class="modal-close"><i class="fa-solid fa-xmark"></i></button>'
            + '</div>'
            + '<div>'
            + '<div class="irow"><span class="ilabel">Dari</span><span class="ival">' + m.nama + '</span></div>'
            + '<div class="irow"><span class="ilabel">Email</span><span class="ival">' + m.email + '</span></div>'
            + '</div>'
            + '<div style="margin-top:12px;padding:13px;background:var(--s2);border-radius:var(--r);font-size:13.5px;color:var(--text-2);line-height:1.7">' + m.pesan + '</div>'
            + bHtml
            + '<div style="margin-top:14px">'
            + '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Tulis Balasan</label>'
            + '<textarea id="balas-txt" class="form-control" rows="3" placeholder="Tulis balasan kepada ' + m.nama + '..."></textarea>'
            + '</div>'
            + '<div class="modal-foot">'
            + '<button class="btn btn-secondary modal-close">Tutup</button>'
            + '<button class="btn btn-primary" id="kirim-balas"><i class="fa-solid fa-paper-plane"></i> Kirim Balasan</button>'
            + '</div>'
          );

          document.getElementById('kirim-balas').onclick = async function() {
            const txt = document.getElementById('balas-txt').value.trim();
            if (!txt) { Toast.warning('Tulis balasan terlebih dahulu'); return; }
            const btn = document.getElementById('kirim-balas');
            btn.innerHTML = '<span class="spin spin-sm"></span> Mengirim...'; btn.disabled = true;
            const r = await API.post('/kontak/' + m.id + '/balas', { balasan: txt });
            if (r.success) { Toast.success('Balasan terkirim!'); Modal.hide(); m.is_read = 1; }
            else { Toast.error(r.message || 'Gagal'); btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Kirim Balasan'; btn.disabled = false; }
          };
        };
      });
    }

    render();
  }

  // ── HELPERS
  function showDetailWarga(d) {
    Modal.show(
      '<div class="modal-header">'
      + '<div><h3 class="modal-title">' + d.name + '</h3>'
      + '<span class="badge badge-primary" style="margin-top:4px">Warga Desa</span></div>'
      + '<button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>'
      + '<div style="text-align:center;padding:14px 0 18px">'
      + '<div style="width:64px;height:64px;background:linear-gradient(135deg,var(--p),var(--p-light));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;margin:0 auto 10px">' + initials(d.name) + '</div>'
      + '<div style="font-size:17px;font-weight:800">' + d.name + '</div>'
      + '</div>'
      + '<div>'
      + '<div class="irow"><span class="ilabel">NIK</span><span class="ival" style="font-family:monospace">' + (d.nik||'-') + '</span></div>'
      + '<div class="irow"><span class="ilabel">Email</span><span class="ival">' + (d.email||'-') + '</span></div>'
      + '<div class="irow"><span class="ilabel">No. Telepon</span><span class="ival">' + (d.phone||'-') + '</span></div>'
      + '<div class="irow"><span class="ilabel">Alamat</span><span class="ival">' + (d.address||'-') + '</span></div>'
      + '<div class="irow"><span class="ilabel">Tgl Daftar</span><span class="ival">' + d.tgl + '</span></div>'
      + '</div>'
      + '<div class="modal-foot"><button class="btn btn-secondary modal-close">Tutup</button></div>'
    );
  }
  async function showDetailSurat(id) {
    const res = await API.get(`/admin/surat/${id}`);
    if (!res.success) return;
    const s = res.data;
    Modal.show(`
      <div class="modal-header">
        <div><h3 class="modal-title">${s.jenis_surat_nama}</h3><div style="margin-top:4px">${badge(s.status)}</div></div>
        <button class="modal-close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div>
        <div class="irow"><span class="ilabel">No. Pengajuan</span><span class="ival bold text-p">${s.nomor_pengajuan}</span></div>
        <div class="irow"><span class="ilabel">Nama Warga</span><span class="ival">${s.warga_name}</span></div>
        <div class="irow"><span class="ilabel">NIK</span><span class="ival" style="font-family:monospace">${s.warga_nik||'-'}</span></div>
        <div class="irow"><span class="ilabel">Telepon</span><span class="ival">${s.warga_phone||'-'}</span></div>
        <div class="irow"><span class="ilabel">Alamat</span><span class="ival">${s.warga_address||'-'}</span></div>
        <div class="irow"><span class="ilabel">Jenis Surat</span><span class="ival">${s.jenis_surat_nama}</span></div>
        <div class="irow"><span class="ilabel">Keperluan</span><span class="ival">${s.keperluan}</span></div>
        <div class="irow"><span class="ilabel">Tgl Pengajuan</span><span class="ival">${fmtDate(s.created_at)}</span></div>
        ${s.catatan_petugas?`<div class="irow"><span class="ilabel">Catatan</span><span class="ival">${s.catatan_petugas}</span></div>`:''}
        ${s.nomor_surat?`<div class="irow"><span class="ilabel">No. Surat</span><span class="ival bold">${s.nomor_surat}</span></div>`:''}
        ${s.tanggal_terbit?`<div class="irow"><span class="ilabel">Tgl Terbit</span><span class="ival">${fmtDate(s.tanggal_terbit)}</span></div>`:''}
        ${s.foto_ktp?`<div class="irow"><span class="ilabel">Foto KTP</span><span class="ival"><a href="/uploads/${s.foto_ktp}" target="_blank" style="color:var(--p);font-weight:600;display:inline-flex;align-items:center;gap:5px"><i class="fa-solid fa-file-image"></i>Lihat Foto KTP</a></span></div>`:''}
        ${s.dokumen_pendukung?`<div class="irow"><span class="ilabel">Dok. Pendukung</span><span class="ival"><a href="/uploads/${s.dokumen_pendukung}" target="_blank" style="color:var(--info);font-weight:600;display:inline-flex;align-items:center;gap:5px"><i class="fa-solid fa-file"></i>Lihat Dokumen</a></span></div>`:''}
        ${s.surat_file?`<div class="irow"><span class="ilabel">Surat Resmi</span><span class="ival"><a href="/uploads/${s.surat_file}" target="_blank" style="color:var(--success);font-weight:700;display:inline-flex;align-items:center;gap:6px;text-decoration:none"><i class="fa-solid fa-file-contract"></i>Lihat Surat Resmi</a></span></div>`:''}
      </div>
      <div class="modal-foot">
        ${s.status==='pending'?`<button class="btn btn-warning" id="m-pros">Proses</button>`:''}
        ${s.status==='diproses'?`<button class="btn btn-danger" id="m-tol">Tolak</button><button class="btn btn-success" id="m-set">Setujui</button>`:''}
        ${s.status==='disetujui'?`<button class="btn btn-primary" id="m-terb">Terbitkan</button>`:''}
        <button class="btn btn-secondary modal-close">Tutup</button>
      </div>`);
    document.getElementById('m-pros')?.addEventListener('click', () => { Modal.hide(); updateStatus(id,'diproses',null,()=>loadPage('kelola')); });
    document.getElementById('m-set')?.addEventListener('click',  () => { Modal.hide(); dlgSetujui(id,()=>loadPage('kelola')); });
    document.getElementById('m-tol')?.addEventListener('click',  () => { Modal.hide(); dlgTolak(id,()=>loadPage('kelola')); });
    document.getElementById('m-terb')?.addEventListener('click', () => { Modal.hide(); dlgTerbitkan(id,()=>loadPage('kelola')); });
  }

  function dlgSetujui(id, onDone) {
    Modal.show(`
      <div class="modal-header"><h3 class="modal-title">Setujui Pengajuan</h3><button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>
      <p style="color:var(--text-2);font-size:13.5px;margin-bottom:14px">Pengajuan akan disetujui dan warga akan mendapat notifikasi.</p>
      <div class="form-group"><label class="form-label">Catatan Admin <span style="color:var(--text-3);font-weight:400">(opsional)</span></label>
        <textarea id="d-cat" class="form-control" rows="3" placeholder="Tambahkan catatan untuk warga..."></textarea></div>
      <div class="modal-foot">
        <button class="btn btn-secondary modal-close">Batal</button>
        <button class="btn btn-success" id="d-ok"><i class="fa-solid fa-check"></i> Setujui</button>
      </div>`);
    document.getElementById('d-ok').onclick = () => { const c = document.getElementById('d-cat').value; Modal.hide(); updateStatus(id,'disetujui',c,onDone); };
  }

  function dlgTolak(id, onDone) {
    Modal.show(`
      <div class="modal-header"><h3 class="modal-title">Tolak Pengajuan</h3><button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>
      <p style="color:var(--text-2);font-size:13.5px;margin-bottom:14px">Berikan alasan penolakan yang jelas agar warga dapat memperbaiki pengajuannya.</p>
      <div class="form-group"><label class="form-label">Alasan Penolakan <span class="req">*</span></label>
        <textarea id="d-tol" class="form-control" rows="3" placeholder="Tuliskan alasan penolakan..."></textarea></div>
      <div class="modal-foot">
        <button class="btn btn-secondary modal-close">Batal</button>
        <button class="btn btn-danger" id="d-ok"><i class="fa-solid fa-xmark"></i> Tolak</button>
      </div>`);
    document.getElementById('d-ok').onclick = () => {
      const c = document.getElementById('d-tol').value.trim();
      if (!c) { Toast.warning('Alasan penolakan wajib diisi'); return; }
      Modal.hide(); updateStatus(id,'ditolak',c,onDone);
    };
  }

function dlgTerbitkan(id, onDone) {
  Modal.show(`
    <div class="modal-header"><h3 class="modal-title">Terbitkan Surat</h3><button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>
    <p style="color:var(--text-2);font-size:13.5px;margin-bottom:14px">Upload file surat resmi (PDF) yang sudah ditandatangani. Nomor surat dibuat otomatis.</p>
    <div class="form-group"><label class="form-label">Upload File Surat <span style="color:var(--danger)">*</span></label>
    <input type="file" id="terbit-file" class="form-control" accept=".pdf,.doc,.docx"/>
    <div style="font-size:11.5px;color:var(--text-3);margin-top:4px">Format: PDF, DOC, DOCX. Maks 5MB</div></div>
    <div class="form-group"><label class="form-label">Keterangan Tambahan <span style="color:var(--text-3);font-weight:400">(opsional)</span></label>
    <textarea id="terbit-ket" class="form-control" rows="2" placeholder="Keterangan tambahan..."></textarea></div>
    <div class="modal-foot">
      <button class="btn btn-secondary modal-close">Batal</button>
      <button class="btn btn-primary" id="d-ok"><i class="fa-solid fa-print"></i> Terbitkan</button>
    </div>`);

  document.getElementById('d-ok').onclick = async () => {
    const fileInput = document.getElementById('terbit-file');
    const ket = document.getElementById('terbit-ket').value.trim();
    if (!fileInput.files.length) { Toast.warning('Pilih file surat terlebih dahulu'); return; }
    const file = fileInput.files[0];
    if (file.size > 5 * 1024 * 1024) { Toast.warning('Ukuran file maksimal 5MB'); return; }

    const btn = document.getElementById('d-ok');
    btn.innerHTML = '<span class="spin spin-sm"></span> Mengunggah...'; btn.disabled = true;

    const formData = new FormData();
    formData.append('surat_file', file);
    if (ket) formData.append('keterangan', ket);

    try {
      const token = localStorage.getItem('token') || Auth.get()?.token;
      const response = await fetch(`/api/admin/surat/${id}/terbitkan`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      const res = await response.json();
      Modal.hide();
      if (res.success) { Toast.success('Surat diterbitkan! No: ' + res.data.nomor_surat); onDone(); }
      else Toast.error(res.message || 'Gagal menerbitkan');
    } catch(e) {
      Toast.error('Gagal mengunggah file');
      btn.innerHTML = '<i class="fa-solid fa-print"></i> Terbitkan'; btn.disabled = false;
    }
  };
}

  async function updateStatus(id, status, catatan, onDone) {
    const res = await API.patch(`/admin/surat/${id}/status`, { status, catatan_petugas: catatan });
    if (res.success) { Toast.success(res.message); onDone(); }
    else Toast.error(res.message||'Gagal update status');
  }

  // ── HALAMAN SEMUA NOTIFIKASI ADMIN ──────────────────────
  async function showAllNotifAdmin(data) {
    const c = $('#pgc', app);
    c.innerHTML = ''; c.classList.remove('fade-in');
    void c.offsetWidth; c.classList.add('fade-in');
    $$('.sb-item', app).forEach(x => x.classList.remove('active'));
    $('#tb-title', app).textContent = 'Notifikasi';

    const [, adminRes] = await Promise.all([API.get('/notifikasi'), API.get('/notifikasi/admin')]);
    const activity = adminRes.success ? adminRes.data : (data ? (data.activity || []) : []);
    const all = [...activity].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    c.innerHTML = '<div class="pg-head"><div class="pg-head-inner">'      + '<div><h2>Notifikasi</h2><p>Semua aktivitas pengajuan dan pesan masuk</p></div>'      + '<div class="pg-head-icon"><i class="fa-regular fa-bell"></i></div>'      + '</div></div>'      + '<div class="card mb-3"><div class="tabs" id="notif-tabs">'      + '<button class="tab on" data-f="all">Semua Aktivitas</button>'  + '</div></div>'      + '<div id="notif-list"></div>';

    let selected = new Set();
    let currentFilter = 'all';

    function renderList(filter) {
      currentFilter = filter;
      selected.clear();
      const listEl = $('#notif-list', c);
      const filtered = filter === 'all' ? all : all.filter(n => n.tipe === filter);
      if (!filtered.length) {
        listEl.innerHTML = '<div class="empty"><div class="empty-ic"><i class="fa-regular fa-bell-slash"></i></div>'          + '<h4>Tidak ada notifikasi</h4><p>Aktivitas akan muncul di sini</p></div>';
        return;
      }
      listEl.innerHTML = '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px">'        + '<button id="an-sel-all" class="btn btn-secondary btn-sm"><i class="fa-regular fa-square-check"></i> Pilih Semua</button>'        + '<button id="an-del-sel" class="btn btn-danger btn-sm" style="display:none"><i class="fa-solid fa-trash"></i> Hapus Dipilih</button>'        + '</div>'        + filtered.map(function(n) {
          const isSurat = n.tipe === 'surat';
          const icon = isSurat ? 'fa-file-lines' : 'fa-envelope';
          const color = isSurat ? 'var(--p)' : 'var(--info)';
          const bg = isSurat ? 'var(--p-50)' : 'var(--info-50)';
          const title = isSurat
            ? n.nama + ' mengajukan ' + n.keterangan
            : 'Pesan dari ' + n.nama + ': ' + (n.ref || '');
          const sub = isSurat
            ? 'No. Pengajuan: ' + (n.ref || '-')
            : n.keterangan || '';
          return '<div class="card mb-2 an-item" data-id="' + n.id + '" style="cursor:pointer">'            + '<div style="display:flex;align-items:flex-start;gap:12px">'            + '<input type="checkbox" class="an-cb" data-id="' + n.id + '" style="margin-top:4px;flex-shrink:0;width:16px;height:16px;cursor:pointer" onclick="event.stopPropagation()"/>'            + '<div style="width:40px;height:40px;background:' + bg + ';border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">'            + '<i class="fa-solid ' + icon + '" style="color:' + color + ';font-size:17px"></i></div>'            + '<div style="flex:1">'            + '<div style="font-weight:700;font-size:14px;margin-bottom:2px">' + title + '</div>'            + '<div style="font-size:12.5px;color:var(--text-2)">' + sub + '</div>'            + '<div style="font-size:11.5px;color:var(--text-3);margin-top:4px"><i class="fa-regular fa-clock" style="margin-right:4px"></i>' + fmtDT(n.created_at) + '</div>'            + '</div></div></div>';
        }).join('');

      listEl.querySelectorAll('.an-cb').forEach(function(cb) {
        cb.onchange = function() {
          if (cb.checked) selected.add(+cb.dataset.id); else selected.delete(+cb.dataset.id);
          listEl.querySelector('#an-del-sel').style.display = selected.size ? 'inline-flex' : 'none';
        };
      });

      listEl.querySelector('#an-sel-all').onclick = function() {
        const allCbs = listEl.querySelectorAll('.an-cb');
        const allChecked = [...allCbs].every(cb => cb.checked);
        allCbs.forEach(function(cb) {
          cb.checked = !allChecked;
          if (!allChecked) selected.add(+cb.dataset.id); else selected.delete(+cb.dataset.id);
        });
        listEl.querySelector('#an-del-sel').style.display = selected.size ? 'inline-flex' : 'none';
      };

      listEl.querySelector('#an-del-sel').onclick = function() {
        if (!selected.size) return;
        Modal.confirm('Hapus Notifikasi', 'Hapus ' + selected.size + ' item dari daftar notifikasi?', async function() {
          const selectedItems = filtered.filter(n => selected.has(n.id));
          const pesanIds = selectedItems.filter(n => n.tipe === 'pesan').map(n => n.id);
          if (pesanIds.length) await API.del('/kontak', { ids: pesanIds });
          for (const id of selected) {
            const idx = all.findIndex(n => n.id === id);
            if (idx > -1) all.splice(idx, 1);
          }
          selected.clear();
          Toast.success('Dihapus dari notifikasi');
          loadNotif();
          renderList(currentFilter);
        });
      };

      listEl.querySelectorAll('.an-item').forEach(function(item) {
        item.onclick = function(e) {
          if (e.target.classList.contains('an-cb')) return;
          const n = filtered.find(x => x.id == item.dataset.id);
          if (!n) return;
          if (n.tipe === 'surat') document.querySelector('.sb-item[data-p="kelola"]')?.click();
          else document.querySelector('.sb-item[data-p="pesan"]')?.click();
        };
      });
    }

    renderList('all');
    $$('#notif-tabs .tab', c).forEach(t => {
      t.onclick = () => {
        $$('#notif-tabs .tab', c).forEach(x => x.classList.remove('on'));
        t.classList.add('on');
        renderList(t.dataset.f);
      };
    });
  }

});