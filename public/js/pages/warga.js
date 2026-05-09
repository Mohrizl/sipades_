Router.register('warga', (app) => {
  const user = Auth.get();
  if (!user) return Router.go('login');

  app.innerHTML = `
  <div class="app">
    <aside class="sidebar" id="sb">
      <div class="sb-head">
        <div class="sb-logo">
          <img src="/logo.png" alt="Logo" style="width:38px;height:38px;border-radius:9px;object-fit:cover;flex-shrink:0"/>
          <div><div class="sb-logo-name">SIPADES</div><div class="sb-logo-sub">Sistem Surat Desa</div></div>
        </div>
        <div class="sb-user">
          <div class="sb-av">${initials(user.name)}</div>
          <div style="flex:1;min-width:0">
            <div class="sb-uname">${user.name}</div>
            <div class="sb-urole">Warga Desa</div>
          </div>
        </div>
      </div>
      <nav class="sb-nav">
        <div class="sb-sec">Menu Utama</div>
        <a class="sb-item active" data-p="beranda"><i class="fa-solid fa-house sb-ic"></i> Beranda</a>
        <a class="sb-item" data-p="pengajuan"><i class="fa-solid fa-file-circle-plus sb-ic"></i> Ajukan Surat</a>
        <a class="sb-item" data-p="status"><i class="fa-solid fa-clock-rotate-left sb-ic"></i> Status Surat</a>
        <a class="sb-item" data-p="profil"><i class="fa-regular fa-circle-user sb-ic"></i> Profil Saya</a>
        <a class="sb-item" data-p="kontak"><i class="fa-solid fa-headset sb-ic"></i> Hubungi Admin</a>
      </nav>
      <div class="sb-foot">
        <div class="sb-logout" id="logout"><i class="fa-solid fa-right-from-bracket"></i> Keluar</div>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn btn-ghost btn-icon" id="sb-tog" style="display:none"><i class="fa-solid fa-bars"></i></button>
          <span class="tb-title" id="tb-title">Beranda</span>
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

  const titles = { beranda:'Beranda', pengajuan:'Ajukan Surat Baru', status:'Status Surat', profil:'Profil Saya', kontak:'Hubungi Admin' };

  $$('.sb-item', app).forEach(el => {
    el.onclick = e => {
      e.preventDefault();
      $$('.sb-item', app).forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      $('#tb-title', app).textContent = titles[el.dataset.p];
      loadPage(el.dataset.p);
    };
  });

  $('#logout', app).onclick = () => Modal.confirm('Keluar', 'Yakin ingin keluar dari akun ini?', () => { Auth.clear(); Router.go('login'); });

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
      loadNotif();
    }
  };
  // Poll notif warga setiap 30 detik
  setInterval(function() {
    if (document.visibilityState === 'visible') loadNotif();
  }, 5000);
  document.onclick = () => $('#notif-dd', app)?.classList.add('hidden');

  async function loadNotif() {
    const res = await API.get('/notifikasi');
    if (!res.success) return;
    if (res.unread > 0) $('#n-dot', app)?.classList.remove('hidden');
    else $('#n-dot', app)?.classList.add('hidden');
    const dd = $('#notif-dd', app);
    const top4 = res.data.slice(0, 4);
    dd.innerHTML = '<div class="nd-head"><h4>Notifikasi</h4>'
      + (res.unread > 0 ? '<span class="badge badge-primary">' + res.unread + ' baru</span>' : '')
      + '</div>'
      + (!top4.length ? '<div style="padding:20px;text-align:center;color:var(--text-3);font-size:13px">Tidak ada notifikasi</div>'
        : top4.map(function(n) {
          return '<div class="nd-item ' + (n.is_read ? '' : 'unread') + '">'
            + (!n.is_read ? '<div class="nd-dot"></div>' : '<div style="width:7px"></div>')
            + '<div style="flex:1;min-width:0">'
            + '<div class="nd-title">' + n.judul + '</div>'
            + '<div class="nd-msg" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px">' + n.pesan + '</div>'
            + '<div class="nd-time">' + fmtDT(n.created_at) + '</div>'
            + '</div></div>';
        }).join(''))
      + '<div id="nd-lihat-semua" style="padding:10px 16px;text-align:center;border-top:1px solid var(--border);cursor:pointer;font-size:13px;font-weight:600;color:var(--p)">Lihat Semua Notifikasi</div>';
    document.getElementById('nd-lihat-semua')?.addEventListener('click', function() {
      $('#notif-dd', app).classList.add('hidden');
      showAllNotif(res.data);
    });
  }

  function loadPage(p) {
    const c = $('#pgc', app);
    c.innerHTML = ''; c.classList.remove('fade-in');
    void c.offsetWidth; c.classList.add('fade-in');
    ({ beranda: pgBeranda, pengajuan: pgPengajuan, status: pgStatus, profil: pgProfil, kontak: pgKontak })[p]?.(c);
  }

  loadPage('beranda');

  // ── BERANDA ───────────────────────────────────────────────
  async function pgBeranda(el) {
    el.innerHTML = '<div class="loading"><div class="spin"></div></div>';
    const [sr, sl] = await Promise.all([API.get('/surat/stats'), API.get('/surat?limit=5')]);
    const st = sr.data || {}, list = sl.data || [];
    el.innerHTML = `
    <div class="pg-head">
      <div class="pg-head-inner">
        <div><h2>Halo Selamat Datang, ${user.name.split(' ')[0]}!</h2>
          <p>${new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div>
        <div class="pg-head-icon"><i class="fa-solid fa-house-chimney"></i></div>
      </div>
    </div>
    <div class="grid g4 mb-4">
      <div class="stat-card"><div class="stat-icon" style="background:var(--p-50);color:var(--p)"><i class="fa-solid fa-folder-open"></i></div><div><div class="stat-val">${st.total||0}</div><div class="stat-lbl">Total Pengajuan</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--warning-50);color:var(--warning)"><i class="fa-solid fa-hourglass-half"></i></div><div><div class="stat-val">${st.pending||0}</div><div class="stat-lbl">Menunggu</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--success-50);color:var(--success)"><i class="fa-solid fa-circle-check"></i></div><div><div class="stat-val">${st.disetujui||0}</div><div class="stat-lbl">Disetujui</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:var(--purple-50);color:var(--purple)"><i class="fa-solid fa-check-double"></i></div><div><div class="stat-val">${st.selesai||0}</div><div class="stat-lbl">Selesai</div></div></div>
    </div>
    <div class="grid g2">
      <div>
        <div class="sec-hd"><span class="sec-title">Pengajuan Terbaru</span><button class="btn btn-ghost btn-sm" id="see-all">Lihat semua →</button></div>
        ${!list.length
          ? `<div class="card"><div class="empty"><div class="empty-ic"><i class="fa-solid fa-inbox"></i></div><h4>Belum ada pengajuan</h4><p>Mulai ajukan surat keterangan Anda</p></div></div>`
          : list.map(s=>`<div class="req-card mb-2"><div class="req-ic"><i class="fa-solid fa-file-lines"></i></div><div style="flex:1;min-width:0"><div class="req-title">${s.jenis_surat_nama}</div><div class="req-sub">${s.nomor_pengajuan} · ${fmtDate(s.created_at)}</div></div><div>${badge(s.status)}</div></div>`).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="card" style="background:linear-gradient(135deg,var(--a-50),#fff);border-color:rgba(212,130,10,.2)">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:40px;height:40px;background:rgba(212,130,10,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--a);font-size:18px;flex-shrink:0"><i class="fa-solid fa-clock"></i></div>
            <div><div style="font-weight:700;font-size:14px;margin-bottom:4px">Jam Pelayanan</div>
            <div style="font-size:13px;color:var(--text-2);line-height:1.7">Senin – Jumat: <strong>08.00 – 16.00 WIB</strong><br>Sabtu: <strong>08.00 – 12.00 WIB</strong></div></div>
          </div>
        </div>
        <div class="card">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:40px;height:40px;background:var(--p-50);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--p);font-size:18px;flex-shrink:0"><i class="fa-solid fa-location-dot"></i></div>
            <div><div style="font-weight:700;font-size:14px;margin-bottom:4px">Kantor Desa Sini</div>
            <div style="font-size:13px;color:var(--text-2);line-height:1.7">Jl. Raya Sini No. 1<br>Kec. Sini, Kab. Tasik 44194</div></div>
          </div>
        </div>
        <div class="card">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:40px;height:40px;background:var(--success-50);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--success);font-size:18px;flex-shrink:0"><i class="fa-solid fa-phone"></i></div>
            <div><div style="font-weight:700;font-size:14px;margin-bottom:4px">Kontak</div>
            <div style="font-size:13px;color:var(--text-2);line-height:1.7">(0262) 123-4567<br>admin@desasini.id</div></div>
          </div>
        </div>
      </div>
    </div>`;
    $('#see-all', el)?.addEventListener('click', () => {
      $$('.sb-item', app).forEach(x=>x.classList.remove('active'));
      $$('.sb-item[data-p="status"]', app)[0]?.classList.add('active');
      $('#tb-title', app).textContent = 'Status Surat';
      loadPage('status');
    });
  }

  // ── PENGAJUAN ─────────────────────────────────────────────
  async function pgPengajuan(el) {
    el.innerHTML = '<div class="loading"><div class="spin"></div></div>';
    const res = await API.get('/jenis-surat');
    const jenis = res.data || [];
    let selJenis = null;
    el.innerHTML = `
    <div class="pg-head">
      <div class="pg-head-inner">
        <div><h2>Ajukan Surat Baru</h2><p>Pilih jenis surat dan isi formulir pengajuan dengan lengkap</p></div>
        <div class="pg-head-icon"><i class="fa-solid fa-file-circle-plus"></i></div>
      </div>
    </div>
    <div class="grid g2" style="align-items:start">
      <div>
        <div class="card mb-3">
          <div class="card-title mb-3"><i class="fa-solid fa-list-ul" style="color:var(--p);margin-right:7px"></i>Pilih Jenis Surat</div>
          <div class="jenis-grid" id="jg">
            ${jenis.map(j=>`<div class="jenis-card" data-id="${j.id}" data-nama="${j.nama}" data-syarat="${j.persyaratan||''}"><div class="j-kode">${j.kode}</div><div class="j-nama">${j.nama}</div></div>`).join('')}
          </div>
          <div id="syarat-box" class="alert alert-info hidden mb-3">
            <i class="fa-solid fa-circle-info"></i>
            <div><strong>Persyaratan:</strong><br/><span id="syarat-txt" style="font-size:12.5px;line-height:1.7"></span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-title mb-3"><i class="fa-solid fa-pen-to-square" style="color:var(--p);margin-right:7px"></i>Formulir Pengajuan</div>
          <form id="peng-form">
            <div class="form-group"><label class="form-label">Keperluan / Keterangan <span class="req">*</span></label>
              <textarea id="p-keperluan" class="form-control" rows="4" placeholder="Jelaskan keperluan pengajuan surat ini secara lengkap dan jelas..." required></textarea>
              <div class="form-error" id="kep-err">Keperluan minimal 10 karakter</div></div>
            <div class="form-group"><label class="form-label">Foto KTP <span class="req">*</span></label>
              <input type="file" id="p-ktp" class="form-control" accept=".jpg,.jpeg,.png,.pdf" required/>
              <div class="form-hint">Wajib diisi. Format JPG, PNG, atau PDF. Maksimal 5MB</div>
              <div class="form-error" id="ktp-err">Foto KTP wajib dilampirkan</div></div>
            <div class="form-group"><label class="form-label">Dokumen Pendukung <span style="color:var(--text-3);font-weight:400">(opsional)</span></label>
              <input type="file" id="p-dok" class="form-control" accept=".jpg,.jpeg,.png,.pdf"/></div>
            <button type="submit" class="btn btn-primary btn-full" id="p-btn" disabled>
              <i class="fa-solid fa-paper-plane"></i><span>Kirim Pengajuan</span>
            </button>
          </form>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card" id="sel-info" style="display:none;border-color:var(--p-100);background:var(--p-50)">
          <div style="display:flex;gap:10px;align-items:center">
            <div style="width:38px;height:38px;background:var(--p);border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0"><i class="fa-solid fa-file-circle-check"></i></div>
            <div><div style="font-weight:700;color:var(--p)" id="sel-nama">-</div><div style="font-size:12px;color:var(--p-light)">Jenis surat terpilih</div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-title mb-3"><i class="fa-solid fa-circle-question" style="color:var(--a);margin-right:7px"></i>Panduan Pengajuan</div>
          <div style="display:flex;flex-direction:column;gap:11px">
            ${['Pilih jenis surat yang Anda butuhkan','Siapkan dokumen persyaratan yang tercantum','Isi keperluan/keterangan minimal 10 karakter','Upload foto KTP yang masih berlaku','Klik Kirim dan pantau status di menu Status Surat'].map((t,i)=>`
            <div style="display:flex;gap:10px;align-items:flex-start">
              <div style="width:22px;height:22px;background:var(--p);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0">${i+1}</div>
              <div style="font-size:13px;color:var(--text-2);line-height:1.55;padding-top:2px">${t}</div>
            </div>`).join('')}
          </div>
        </div>
        <div class="card" style="background:var(--warning-50);border-color:rgba(217,119,6,.2)">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <i class="fa-solid fa-triangle-exclamation" style="color:var(--warning);font-size:16px;margin-top:2px;flex-shrink:0"></i>
            <div style="font-size:13px;color:var(--text-2);line-height:1.6"><strong style="display:block;margin-bottom:3px">Perhatian</strong>Pastikan data sudah benar. Pengajuan tidak lengkap dapat ditolak admin desa.</div>
          </div>
        </div>
      </div>
    </div>`;
    $$('.jenis-card', el).forEach(c => {
      c.onclick = () => {
        $$('.jenis-card', el).forEach(x=>x.classList.remove('sel'));
        c.classList.add('sel'); selJenis = {id:c.dataset.id, nama:c.dataset.nama};
        const sy = c.dataset.syarat;
        if (sy) { $('#syarat-box',el).classList.remove('hidden'); $('#syarat-txt',el).textContent = sy; }
        else $('#syarat-box',el).classList.add('hidden');
        $('#sel-info',el).style.display='block'; $('#sel-nama',el).textContent=c.dataset.nama;
        $('#p-btn',el).disabled=false;
      };
    });
    $('#peng-form', el).onsubmit = async e => {
      e.preventDefault();
      if (!selJenis) { Toast.warning('Pilih jenis surat terlebih dahulu'); return; }
      const kep = $('#p-keperluan',el).value.trim();
      if (kep.length<10) { $('#kep-err',el).classList.add('show'); return; }
      $('#kep-err',el).classList.remove('show');
      const ktpFile = $('#p-ktp',el).files[0];
      if (!ktpFile) { $('#ktp-err',el).classList.add('show'); return; }
      $('#ktp-err',el).classList.remove('show');
      const btn = $('#p-btn',el);
      btn.innerHTML='<span class="spin spin-sm"></span><span>Mengirim...</span>'; btn.disabled=true;
      const fd = new FormData();
      fd.append('jenis_surat_id', selJenis.id); fd.append('keperluan', kep);
      const ktp=$('#p-ktp',el).files[0], dok=$('#p-dok',el).files[0];
      if(ktp) fd.append('foto_ktp',ktp); if(dok) fd.append('dokumen_pendukung',dok);
      const res = await API.form('/surat', fd);
      btn.innerHTML='<i class="fa-solid fa-paper-plane"></i><span>Kirim Pengajuan</span>'; btn.disabled=false;
      if (res.success) {
        Modal.show(`<div class="modal-header"><h3 class="modal-title">Pengajuan Berhasil!</h3><button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>
          <div style="text-align:center;padding:16px 0">
            <div style="width:68px;height:68px;background:var(--success-50);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;color:var(--success);margin:0 auto 14px"><i class="fa-solid fa-circle-check"></i></div>
            <h3 style="margin-bottom:6px">Pengajuan Diterima</h3>
            <p style="color:var(--text-3);font-size:13px">Nomor pengajuan Anda:</p>
            <div style="background:var(--p-50);border:1.5px solid var(--p-100);border-radius:10px;padding:14px;margin-top:10px">
              <div style="font-size:20px;font-weight:800;color:var(--p)">${res.data.nomor_pengajuan}</div>
            </div>
            <p style="font-size:12px;color:var(--text-3);margin-top:10px">Pantau status di menu "Status Surat"</p>
          </div>
          <div class="modal-foot"><button class="btn btn-primary btn-full modal-close">Tutup</button></div>`);
        $('#peng-form',el).reset(); $$('.jenis-card',el).forEach(x=>x.classList.remove('sel'));
        selJenis=null; $('#p-btn',el).disabled=true; $('#sel-info',el).style.display='none'; $('#syarat-box',el).classList.add('hidden');
      } else Toast.error(res.message||'Gagal mengirim pengajuan');
    };
  }

  // ── STATUS ────────────────────────────────────────────────
  async function pgStatus(el) {
    let curStatus=null, curPage=1;
    el.innerHTML=`
    <div class="pg-head"><div class="pg-head-inner"><div><h2>Status Surat</h2><p>Pantau perkembangan semua pengajuan surat Anda</p></div><div class="pg-head-icon"><i class="fa-solid fa-clock-rotate-left"></i></div></div></div>
    <div class="card mb-3"><div class="tabs">
      ${[['','Semua'],['pending','Menunggu'],['diproses','Diproses'],['disetujui','Disetujui'],['selesai','Selesai'],['ditolak','Ditolak']].map(([v,l])=>`<button class="tab ${v===''?'on':''}" data-v="${v}">${l}</button>`).join('')}
    </div></div>
    <div id="st-list"></div>`;
    $$('.tab',el).forEach(t=>{t.onclick=()=>{$$('.tab',el).forEach(x=>x.classList.remove('on'));t.classList.add('on');curStatus=t.dataset.v||null;curPage=1;load();};});

    async function load() {
      const listEl=$('#st-list',el);
      listEl.innerHTML='<div class="loading"><div class="spin"></div></div>';
      let url=`/surat?page=${curPage}&limit=8`; if(curStatus) url+=`&status=${curStatus}`;
      const res=await API.get(url); const list=res.data||[], total=res.pagination?.total||0, tp=Math.ceil(total/8);
      if(!list.length){listEl.innerHTML='<div class="empty"><div class="empty-ic"><i class="fa-solid fa-inbox"></i></div><h4>Tidak ada pengajuan</h4><p>Belum ada pengajuan pada kategori ini</p></div>';return;}
      listEl.innerHTML=list.map(s=>`
        <div class="req-card mb-2" data-id="${s.id}">
          <div class="req-ic"><i class="fa-solid fa-file-lines"></i></div>
          <div style="flex:1;min-width:0">
            <div class="req-title">${s.jenis_surat_nama}</div>
            <div class="req-sub">${s.nomor_pengajuan} · ${fmtDate(s.created_at)}</div>
            ${s.catatan_petugas?`<div style="font-size:11.5px;color:var(--text-3);margin-top:2px"><i class="fa-solid fa-comment-dots" style="font-size:10px"></i> ${s.catatan_petugas}</div>`:''}
          </div>
          <div style="flex-shrink:0">${badge(s.status)}</div>
        </div>`).join('')+
        `<div class="pgn"><div class="pgn-info">Menampilkan ${list.length} dari ${total} pengajuan</div><div class="pgn-btns">
          <button class="pgn-btn" id="pp" ${curPage<=1?'disabled':''}><i class="fa-solid fa-chevron-left"></i></button>
          <button class="pgn-btn on">${curPage} / ${tp||1}</button>
          <button class="pgn-btn" id="np" ${curPage>=tp?'disabled':''}><i class="fa-solid fa-chevron-right"></i></button>
        </div></div>`;
      listEl.querySelectorAll('.req-card[data-id]').forEach(c=>c.onclick=()=>showDetail(c.dataset.id));
      listEl.querySelector('#pp')?.addEventListener('click',()=>{curPage--;load();});
      listEl.querySelector('#np')?.addEventListener('click',()=>{curPage++;load();});
    }

    async function showDetail(id) {
      const res=await API.get(`/surat/${id}`); if(!res.success) return; const s=res.data;
      Modal.show(`<div class="modal-header"><div><h3 class="modal-title">${s.jenis_surat_nama}</h3><div style="margin-top:4px">${badge(s.status)}</div></div><button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>
        <div>
          <div class="irow"><span class="ilabel">No. Pengajuan</span><span class="ival bold text-p">${s.nomor_pengajuan}</span></div>
          <div class="irow"><span class="ilabel">Jenis Surat</span><span class="ival">${s.jenis_surat_nama}</span></div>
          <div class="irow"><span class="ilabel">Keperluan</span><span class="ival">${s.keperluan}</span></div>
          <div class="irow"><span class="ilabel">Tgl Pengajuan</span><span class="ival">${fmtDate(s.created_at)}</span></div>
          ${s.catatan_petugas?`<div class="irow"><span class="ilabel">Catatan Admin</span><span class="ival">${s.catatan_petugas}</span></div>`:''}
          ${s.nomor_surat?`<div class="irow"><span class="ilabel">Nomor Surat</span><span class="ival bold">${s.nomor_surat}</span></div>`:''}
          ${s.tanggal_terbit?`<div class="irow"><span class="ilabel">Tgl Terbit</span><span class="ival">${fmtDate(s.tanggal_terbit)}</span></div>`:''}
          ${s.petugas_name?`<div class="irow"><span class="ilabel">Diproses Oleh</span><span class="ival">${s.petugas_name}</span></div>`:''}

          ${s.foto_ktp?`<div class="irow"><span class="ilabel">Foto KTP</span><span class="ival"><a href="/uploads/${s.foto_ktp}" target="_blank" style="color:var(--p);font-weight:600;display:inline-flex;align-items:center;gap:5px"><i class="fa-solid fa-file-image"></i>Lihat Foto KTP</a></span></div>`:''}
          ${s.dokumen_pendukung?`<div class="irow"><span class="ilabel">Dok. Pendukung</span><span class="ival"><a href="/uploads/${s.dokumen_pendukung}" target="_blank" style="color:var(--info);font-weight:600;display:inline-flex;align-items:center;gap:5px"><i class="fa-solid fa-file"></i>Lihat Dokumen</a></span></div>`:''}
          ${s.surat_file?`<div class="irow"><span class="ilabel">Surat Resmi</span><span class="ival"><a href="/uploads/${s.surat_file}" target="_blank" style="color:var(--success);font-weight:700;display:inline-flex;align-items:center;gap:6px;text-decoration:none"><i class="fa-solid fa-file-contract"></i> Unduh Surat Resmi</a></span></div>`:''}
        </div>
        <div class="modal-foot"><button class="btn btn-secondary modal-close">Tutup</button></div>`);
    }
    load();
  }

  // ── PROFIL ────────────────────────────────────────────────
  function pgProfil(el) {
    const u=Auth.get();
    el.innerHTML=`
    <div class="pg-head"><div class="pg-head-inner"><div><h2>Profil Saya</h2><p>Kelola informasi akun dan keamanan data Anda</p></div><div class="pg-head-icon"><i class="fa-regular fa-circle-user"></i></div></div></div>
    <div class="grid g2" style="align-items:start">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card" style="text-align:center;padding:28px 20px">
          <div style="width:72px;height:72px;background:linear-gradient(135deg,var(--p),var(--p-light));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;margin:0 auto 12px">${initials(u.name)}</div>
          <div style="font-size:18px;font-weight:800;margin-bottom:5px">${u.name}</div>
          <span class="badge badge-primary">Warga Desa</span>
        </div>
        <div class="card">
          <div class="card-title mb-3"><i class="fa-solid fa-circle-info" style="color:var(--p);margin-right:7px"></i>Informasi Akun</div>
          <div class="irow"><span class="ilabel">NIK</span><span class="ival" style="font-family:monospace">${u.nik||'-'}</span></div>
          <div class="irow"><span class="ilabel">Email</span><span class="ival">${u.email||'-'}</span></div>
          <div class="irow"><span class="ilabel">No. Telepon</span><span class="ival">${u.phone||'-'}</span></div>
          <div class="irow"><span class="ilabel">Alamat</span><span class="ival">${u.address||'-'}</span></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card">
          <div class="card-title mb-3"><i class="fa-solid fa-pen" style="color:var(--p);margin-right:7px"></i>Edit Profil</div>
          <form id="pf-form">
            <div class="form-group"><label class="form-label">Nama Lengkap</label>
              <div class="input-wrap"><i class="fa-regular fa-user i-left"></i><input type="text" id="pf-name" class="form-control" value="${u.name||''}"/></div></div>
            <div class="form-group"><label class="form-label">No. Telepon</label>
              <div class="input-wrap"><i class="fa-solid fa-phone i-left"></i><input type="tel" id="pf-phone" class="form-control" value="${u.phone||''}"/></div></div>
            <div class="form-group"><label class="form-label">Alamat</label>
              <textarea id="pf-addr" class="form-control" rows="3">${u.address||''}</textarea></div>
            <button type="submit" class="btn btn-primary btn-full" id="pf-btn"><i class="fa-solid fa-floppy-disk"></i><span>Simpan Perubahan</span></button>
          </form>
        </div>
        <div class="card">
          <div class="card-title mb-3"><i class="fa-solid fa-key" style="color:var(--warning);margin-right:7px"></i>Ganti Password</div>
          <form id="pw-form">
            <div class="form-group"><label class="form-label">Password Lama</label><input type="password" id="pw-old" class="form-control" placeholder="Masukkan password lama"/></div>
            <div class="form-group"><label class="form-label">Password Baru</label><input type="password" id="pw-new" class="form-control" placeholder="Minimal 6 karakter"/></div>
            <button type="submit" class="btn btn-outline btn-full" id="pw-btn"><i class="fa-solid fa-key"></i><span>Ganti Password</span></button>
          </form>
        </div>
        <div class="card card-hover" id="logout2" style="border-color:var(--danger-50)">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:38px;height:38px;background:var(--danger-50);border-radius:9px;display:flex;align-items:center;justify-content:center;color:var(--danger)"><i class="fa-solid fa-right-from-bracket"></i></div>
            <div style="flex:1"><div style="font-weight:700;font-size:14px;color:var(--danger)">Keluar dari Akun</div><div style="font-size:12px;color:var(--text-3)">Anda akan kembali ke halaman login</div></div>
            <i class="fa-solid fa-chevron-right" style="color:var(--text-3)"></i>
          </div>
        </div>
      </div>
    </div>`;
    $('#logout2',el).onclick=()=>Modal.confirm('Keluar','Yakin ingin keluar?',()=>{Auth.clear();Router.go('login');});
    $('#pf-form',el).onsubmit=async e=>{
      e.preventDefault(); const btn=$('#pf-btn',el);
      btn.innerHTML='<span class="spin spin-sm"></span><span>Menyimpan...</span>'; btn.disabled=true;
      const res=await API.put('/auth/profile',{name:$('#pf-name',el).value.trim(),phone:$('#pf-phone',el).value.trim(),address:$('#pf-addr',el).value.trim()});
      btn.innerHTML='<i class="fa-solid fa-floppy-disk"></i><span>Simpan Perubahan</span>'; btn.disabled=false;
      if(res.success) Toast.success('Profil berhasil diperbarui'); else Toast.error(res.message);
    };
    $('#pw-form',el).onsubmit=async e=>{
      e.preventDefault(); const btn=$('#pw-btn',el);
      btn.innerHTML='<span class="spin spin-sm"></span>'; btn.disabled=true;
      const res=await API.put('/auth/change-password',{old_password:$('#pw-old',el).value,new_password:$('#pw-new',el).value});
      btn.innerHTML='<i class="fa-solid fa-key"></i><span>Ganti Password</span>'; btn.disabled=false;
      if(res.success){Toast.success('Password berhasil diubah');$('#pw-form',el).reset();}else Toast.error(res.message);
    };
  }


  // ── HUBUNGI ADMIN ────────────────────────────────────────
  async function pgKontak(el) {
    el.innerHTML = '<div class="loading"><div class="spin"></div></div>';
    const infos = [
      ['fa-location-dot','var(--p)','var(--p-50)','Alamat Kantor Desa','Jl. Raya Sini No. 1<br>Kec. Sini, Kab. Tasik 44194'],
      ['fa-clock','var(--a)','var(--a-50)','Jam Pelayanan','Senin - Jumat: 08.00 - 16.00 WIB<br>Sabtu: 08.00 - 12.00 WIB'],
      ['fa-phone','var(--success)','var(--success-50)','Nomor Telepon','(0262) 123-4567'],
      ['fa-envelope','var(--info)','var(--info-50)','Email Resmi','admin@desasini.id'],
    ];
    const infoCards = infos.map(function(x) {
      return '<div class="card mb-2" style="display:flex;gap:13px;align-items:flex-start">'
        + '<div style="width:42px;height:42px;background:' + x[2] + ';border-radius:10px;display:flex;align-items:center;justify-content:center;color:' + x[1] + ';font-size:18px;flex-shrink:0"><i class="fa-solid ' + x[0] + '"></i></div>'
        + '<div><div style="font-weight:700;font-size:14px;margin-bottom:3px">' + x[3] + '</div>'
        + '<div style="font-size:13px;color:var(--text-2);line-height:1.6">' + x[4] + '</div></div></div>';
    }).join('');

    el.innerHTML = '<div class="pg-head"><div class="pg-head-inner">'
      + '<div><h2>Hubungi Admin</h2><p>Kirimkan pertanyaan, keluhan, atau permintaan informasi kepada admin desa</p></div>'
      + '<div class="pg-head-icon"><i class="fa-solid fa-headset"></i></div>'
      + '</div></div>'
      + '<div class="grid g2" style="align-items:start">'
      + '<div class="card">'
      + '<div class="card-title mb-3"><i class="fa-solid fa-envelope" style="color:var(--p);margin-right:7px"></i>Kirim Pesan Baru</div>'
      + '<form id="k-form">'
      + '<div class="form-group"><label class="form-label">Nama Lengkap <span class="req">*</span></label>'
      + '<div class="input-wrap"><i class="fa-regular fa-user i-left"></i>'
      + '<input type="text" id="k-nama" class="form-control" value="' + user.name + '" required/></div></div>'
      + '<div class="form-group"><label class="form-label">Email <span class="req">*</span></label>'
      + '<div class="input-wrap"><i class="fa-regular fa-envelope i-left"></i>'
      + '<input type="email" id="k-email" class="form-control" value="' + user.email + '" required/></div></div>'
      + '<div class="form-group"><label class="form-label">Subjek <span class="req">*</span></label>'
      + '<div class="input-wrap"><i class="fa-solid fa-tag i-left"></i>'
      + '<input type="text" id="k-subjek" class="form-control" placeholder="Contoh: Cara mengajukan surat domisili" required/></div></div>'
      + '<div class="form-group"><label class="form-label">Pesan <span class="req">*</span></label>'
      + '<textarea id="k-pesan" class="form-control" rows="4" placeholder="Tulis pertanyaan atau pesan Anda..." required></textarea></div>'
      + '<button type="submit" class="btn btn-primary btn-full" id="k-btn">'
      + '<i class="fa-solid fa-paper-plane"></i><span>Kirim Pesan</span></button>'
      + '</form></div>'
      + '<div>' + infoCards
      + '<div class="card" style="background:var(--p-50);border-color:var(--p-100)">'
      + '<div style="display:flex;gap:9px;align-items:flex-start">'
      + '<i class="fa-solid fa-circle-info" style="color:var(--p);font-size:14px;margin-top:2px;flex-shrink:0"></i>'
      + '<div style="font-size:12.5px;color:var(--text-2);line-height:1.6">Pesan akan dibalas dalam 1x24 jam hari kerja. Balasan tampil di bagian notifikasi.</div>'
      + '</div></div>'
      + '</div></div>';

    $('#k-form', el).onsubmit = async e => {
      e.preventDefault();
      const btn = $('#k-btn', el);
      btn.innerHTML = '<span class="spin spin-sm"></span><span>Mengirim...</span>'; btn.disabled = true;
      const res = await API.post('/kontak', {
        nama: $('#k-nama',el).value.trim(),
        email: $('#k-email',el).value.trim(),
        subjek: $('#k-subjek',el).value.trim(),
        pesan: $('#k-pesan',el).value.trim()
      }, false);
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i><span>Kirim Pesan</span>'; btn.disabled = false;
      if (res.success) {
        Toast.success('Pesan berhasil dikirim! Admin akan membalas segera.');
        $('#k-subjek',el).value = ''; $('#k-pesan',el).value = '';
        pgKontak(el); // refresh untuk tampilkan pesan baru
      } else Toast.error(res.message || 'Gagal kirim pesan');
    };
  }


  // ── HALAMAN SEMUA NOTIFIKASI WARGA ──────────────────────
  function showAllNotif(data) {
    const c = $('#pgc', app);
    c.innerHTML = ''; c.classList.remove('fade-in');
    void c.offsetWidth; c.classList.add('fade-in');
    $$('.sb-item', app).forEach(x => x.classList.remove('active'));
    $('#tb-title', app).textContent = 'Notifikasi';

    const tipeIcon = { info:'fa-circle-info', sukses:'fa-circle-check', warning:'fa-triangle-exclamation', error:'fa-circle-xmark', balasan:'fa-reply' };
    const tipeColor = { info:'var(--info)', sukses:'var(--success)', warning:'var(--warning)', error:'var(--danger)', balasan:'var(--p)' };

    c.innerHTML = '<div class="pg-head"><div class="pg-head-inner">'
      + '<div><h2>Notifikasi</h2><p>Semua pemberitahuan untuk akun Anda</p></div>'
      + '<div class="pg-head-icon"><i class="fa-regular fa-bell"></i></div>'
      + '</div></div>'
      + '<div class="card mb-3"><div class="tabs" id="notif-tabs">'
      + '<button class="tab on" data-f="all">Semua</button>'
      + '<button class="tab" data-f="unread">Belum Dibaca</button>'
      + '</div></div>'
      + '<div id="notif-list"></div>';

    let selected = new Set();

    function renderList(filter) {
      const filtered = filter === 'unread' ? data.filter(n => !n.is_read) : data;
      const listEl = $('#notif-list', c);
      if (!filtered.length) {
        listEl.innerHTML = '<div class="empty"><div class="empty-ic"><i class="fa-regular fa-bell-slash"></i></div>'
          + '<h4>Tidak ada notifikasi</h4><p>Semua pemberitahuan akan muncul di sini</p></div>';
        return;
      }
      listEl.innerHTML = '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px">'
        + '<button id="sel-all-btn" class="btn btn-secondary btn-sm"><i class="fa-regular fa-square-check"></i> Pilih Semua</button>'
        + '<button id="del-sel-btn" class="btn btn-danger btn-sm" style="display:none"><i class="fa-solid fa-trash"></i> Hapus Dipilih</button>'
        + '</div>'
        + filtered.map(function(n) {
          const ic = tipeIcon[n.tipe] || 'fa-circle-info';
          const col = tipeColor[n.tipe] || 'var(--info)';
          const isBalasan = n.tipe === 'balasan';
          const subjekLine = isBalasan
            ? '<div style="font-size:12px;color:var(--text-3);margin-bottom:4px"><i class="fa-solid fa-tag" style="margin-right:4px"></i>' + n.judul.replace(/^Balasan: ?/,'') + '</div>'
            : '';
          const pesanBlock = isBalasan
            ? '<div style="background:var(--p-50);border-left:3px solid var(--p);border-radius:4px;padding:8px 11px;margin-top:5px;font-size:13px;color:var(--text-2);line-height:1.5"><i class="fa-solid fa-reply" style="color:var(--p);margin-right:5px;font-size:11px"></i>' + n.pesan + '</div>'
            : '<div style="font-size:13px;color:var(--text-2);margin-top:3px;line-height:1.5">' + n.pesan + '</div>';
          return '<div class="card mb-2 notif-item" data-id="' + n.id + '" style="' + (!n.is_read ? 'border-color:var(--p-100);background:var(--p-50)' : '') + ';cursor:pointer">'
            + '<div style="display:flex;align-items:flex-start;gap:12px">'
            + '<input type="checkbox" class="notif-cb" data-id="' + n.id + '" style="margin-top:4px;flex-shrink:0;width:16px;height:16px;cursor:pointer"/>'
            + '<div style="width:38px;height:38px;background:' + col + '20;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">'
            + '<i class="fa-solid ' + ic + '" style="color:' + col + ';font-size:16px"></i></div>'
            + '<div style="flex:1">'
            + '<div style="font-weight:' + (!n.is_read ? '700' : '600') + ';font-size:14px">' + (isBalasan ? 'Balasan Admin' : n.judul) + '</div>'
            + subjekLine
            + pesanBlock
            + '<div style="font-size:11.5px;color:var(--text-3);margin-top:5px"><i class="fa-regular fa-clock" style="margin-right:4px"></i>' + fmtDT(n.created_at) + '</div>'
            + '</div></div></div>';
        }).join('');

      // Checkbox handlers
      listEl.querySelectorAll('.notif-cb').forEach(function(cb) {
        cb.onclick = function(e) { e.stopPropagation();
          if (cb.checked) selected.add(+cb.dataset.id); else selected.delete(+cb.dataset.id);
          listEl.querySelector('#del-sel-btn').style.display = selected.size ? 'inline-flex' : 'none';
        };
      });

      // Pilih semua
      listEl.querySelector('#sel-all-btn').onclick = function() {
        const allCbs = listEl.querySelectorAll('.notif-cb');
        const allChecked = [...allCbs].every(cb => cb.checked);
        allCbs.forEach(function(cb) { cb.checked = !allChecked; if (!allChecked) selected.add(+cb.dataset.id); else selected.delete(+cb.dataset.id); });
        listEl.querySelector('#del-sel-btn').style.display = selected.size ? 'inline-flex' : 'none';
      };

      // Hapus dipilih
      listEl.querySelector('#del-sel-btn').onclick = async function() {
        if (!selected.size) return;
        Modal.confirm('Hapus Notifikasi', 'Hapus ' + selected.size + ' notifikasi yang dipilih?', async function() {
          await API.del('/notifikasi', { ids: [...selected] });
          Toast.success('Notifikasi dihapus');
          loadNotif();
          loadPage('beranda');
          showAllNotif((await API.get('/notifikasi')).data || []);
        });
      };

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