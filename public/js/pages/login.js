Router.register('login', (app) => {
  app.innerHTML = `
  <div class="auth-page">
    <div class="auth-left">
      <div class="auth-brand">
        <img src="/logo.png" alt="SIPADES" style="width:54px;height:54px;border-radius:14px;object-fit:cover;flex-shrink:0"/>
        <div>
          <div class="auth-brand-name">SIPADES</div>
          <div class="auth-brand-sub">Desa Sini, Kab. Tasik</div>
        </div>
      </div>
      <div class="auth-hero">
        <h1>Layanan Surat<br>Desa Digital</h1>
        <p>Urus surat keterangan dengan mudah, cepat, dan tanpa antri di kantor desa. Cukup daftar dan ajukan dari rumah.</p>
      </div>
      <div class="auth-feats">
        <div class="auth-feat"><div class="auth-feat-ic"><i class="fa-solid fa-bolt-lightning"></i></div><div class="auth-feat-txt"><strong>Proses Cepat</strong><span>Selesai 1–3 hari kerja</span></div></div>
        <div class="auth-feat"><div class="auth-feat-ic"><i class="fa-solid fa-magnifying-glass-chart"></i></div><div class="auth-feat-txt"><strong>Pantau Status</strong><span>pengajuan secara real-time</span></div></div>
        <div class="auth-feat"><div class="auth-feat-ic"><i class="fa-solid fa-shield-halved"></i></div><div class="auth-feat-txt"><strong>Aman & Terpercaya</strong><span>Data dienkripsi dengan JWT</span></div></div>
        <div class="auth-feat"><div class="auth-feat-ic"><i class="fa-solid fa-file-circle-check"></i></div><div class="auth-feat-txt"><strong>8 Jenis Surat</strong><span>SKD, SKTM, SKU, dan lainnya</span></div></div>
      </div>
    </div>
    <div class="auth-right">
      <div class="auth-form">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:26px">
          <img src="/logo.png" alt="Logo" style="width:46px;height:46px;border-radius:11px;object-fit:cover"/>
          <div>
            <div style="font-size:19px;font-weight:800;color:var(--text-1)">SIPADES</div>
            <div style="font-size:11.5px;color:var(--text-3)">Sistem Pelayanan Surat Desa</div>
          </div>
        </div>
        <h2 style="margin-bottom:5px">Masuk ke Akun</h2>
        <p class="auth-sub">Masukkan email dan password Anda untuk mengakses layanan</p>

        <div id="err" class="alert alert-danger hidden" style="margin-bottom:16px">
          <i class="fa-solid fa-circle-xmark"></i><span id="err-msg"></span>
        </div>

        <form id="form">
          <div class="form-group">
            <label class="form-label">Email <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="fa-regular fa-envelope i-left"></i>
              <input type="email" id="i-email" class="form-control" placeholder="Masukkan email Anda" required/>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Password <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="fa-solid fa-lock i-left"></i>
              <input type="password" id="i-pass" class="form-control" placeholder="Masukkan password" required/>
              <i class="fa-regular fa-eye i-right" id="tog"></i>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="btn-in" style="margin-top:4px">
            <i class="fa-solid fa-right-to-bracket"></i><span>Masuk</span>
          </button>
        </form>

        <p style="text-align:center;margin-top:18px;font-size:13px;color:var(--text-3)">
          Belum punya akun? <a href="#" id="go-reg" style="color:var(--p);font-weight:700">Daftar sekarang</a>
        </p>

        <div style="margin-top:24px;padding:14px;background:var(--p-50);border-radius:var(--r);border:1px solid var(--p-100)">
          <div style="display:flex;gap:9px;align-items:flex-start">
            <i class="fa-solid fa-landmark" style="color:var(--p);font-size:15px;margin-top:2px;flex-shrink:0"></i>
            <div style="font-size:12.5px;color:var(--text-2);line-height:1.6">
              <strong style="display:block;margin-bottom:2px">Layanan Resmi Desa Sini</strong>
              Sistem ini hanya untuk warga Desa Sini yang telah terdaftar. Hubungi kantor desa jika mengalami kendala di (0262) 123-4567.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  $('#tog', app).onclick = () => {
    const i = $('#i-pass', app), ic = $('#tog', app);
    if (i.type === 'password') { i.type = 'text'; ic.className = 'fa-regular fa-eye-slash i-right'; }
    else { i.type = 'password'; ic.className = 'fa-regular fa-eye i-right'; }
  };

  $('#go-reg', app).onclick = e => { e.preventDefault(); Router.go('register'); };

  $('#form', app).onsubmit = async e => {
    e.preventDefault();
    const btn = $('#btn-in', app), err = $('#err', app);
    err.classList.add('hidden');
    btn.innerHTML = '<span class="spin spin-sm"></span><span>Memproses...</span>';
    btn.disabled = true;
    const res = await API.post('/auth/login', {
      email: $('#i-email', app).value.trim(),
      password: $('#i-pass', app).value
    }, false);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Masuk</span>';
    if (res.success) {
      Auth.save(res.data.token, res.data.user);
      Toast.success('Login berhasil! Selamat datang.');
      Router.go(res.data.user.role === 'warga' ? 'warga' : 'admin');
    } else {
      err.classList.remove('hidden');
      $('#err-msg', app).textContent = res.message || 'Email atau password salah';
    }
  };
});
