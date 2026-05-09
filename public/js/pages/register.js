Router.register('register', (app) => {
  app.innerHTML = `
  <div class="auth-page">
    <div class="auth-left">
      <div class="auth-brand">
        <img src="/logo.png" alt="SIPADES" style="width:54px;height:54px;border-radius:14px;object-fit:cover;flex-shrink:0"/>
        <div><div class="auth-brand-name">SIPADES</div><div class="auth-brand-sub">Desa Sini, Kab. Tasik</div></div>
      </div>
      <div class="auth-hero">
        <h1>Bergabung &amp;<br>Nikmati Layanan Digital</h1>
        <p>Daftarkan diri Anda dan urus surat keterangan desa dari mana saja, kapan saja.</p>
      </div>
      <div class="auth-feats">
        <div class="auth-feat"><div class="auth-feat-ic"><i class="fa-solid fa-id-card"></i></div><div class="auth-feat-txt"><strong>Cukup NIK &amp; Email</strong><span>Proses registrasi mudah dan cepat</span></div></div>
        <div class="auth-feat"><div class="auth-feat-ic"><i class="fa-solid fa-bell"></i></div><div class="auth-feat-txt"><strong>Notifikasi Otomatis</strong><span>Update status pengajuan langsung</span></div></div>
        <div class="auth-feat"><div class="auth-feat-ic"><i class="fa-solid fa-lock"></i></div><div class="auth-feat-txt"><strong>Data Aman</strong><span>Password terenkripsi dengan bcrypt</span></div></div>
      </div>
    </div>
    <div class="auth-right" style="overflow-y:auto;align-items:flex-start;padding-top:30px">
      <div class="auth-form" style="max-width:400px">
        <h2>Buat Akun Baru</h2>
        <p class="auth-sub">Isi data diri sesuai KTP untuk mendaftar</p>
        <div id="reg-err" class="alert alert-danger hidden" style="margin-bottom:16px">
          <i class="fa-solid fa-circle-xmark"></i><span id="reg-err-msg"></span>
        </div>
        <form id="reg-form">
          <div class="form-group">
            <label class="form-label">NIK <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="fa-solid fa-id-card i-left"></i>
              <input type="text" id="r-nik" class="form-control" placeholder="16 digit NIK sesuai KTP" maxlength="16" required/>
            </div>
            <div class="form-hint">Nomor Induk Kependudukan pada KTP Anda</div>
          </div>
          <div class="form-group">
            <label class="form-label">Nama Lengkap <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="fa-regular fa-user i-left"></i>
              <input type="text" id="r-name" class="form-control" placeholder="Nama lengkap sesuai KTP" required/>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="fa-regular fa-envelope i-left"></i>
              <input type="email" id="r-email" class="form-control" placeholder="nama@email.com" required/>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Password <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="fa-solid fa-lock i-left"></i>
              <input type="password" id="r-pass" class="form-control" placeholder="Minimal 6 karakter" required/>
              <i class="fa-regular fa-eye i-right" id="r-tog"></i>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">No. Telepon</label>
            <div class="input-wrap">
              <i class="fa-solid fa-phone i-left"></i>
              <input type="tel" id="r-phone" class="form-control" placeholder="08xxxxxxxxxx"/>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Alamat Lengkap</label>
            <textarea id="r-addr" class="form-control" rows="3" placeholder="Alamat sesuai KTP"></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full btn-lg" id="reg-btn">
            <i class="fa-solid fa-user-plus"></i><span>Daftar Sekarang</span>
          </button>
        </form>
        <p style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-3)">
          Sudah punya akun? <a href="#" id="go-login" style="color:var(--p);font-weight:700">Masuk di sini</a>
        </p>
      </div>
    </div>
  </div>`;

  $('#go-login', app).onclick = e => { e.preventDefault(); Router.go('login'); };
  $('#r-tog', app).onclick = () => {
    const i = $('#r-pass', app), ic = $('#r-tog', app);
    if (i.type === 'password') { i.type = 'text'; ic.className = 'fa-regular fa-eye-slash i-right'; }
    else { i.type = 'password'; ic.className = 'fa-regular fa-eye i-right'; }
  };

  $('#reg-form', app).onsubmit = async e => {
    e.preventDefault();
    const btn = $('#reg-btn', app), err = $('#reg-err', app);
    err.classList.add('hidden');
    const nik = $('#r-nik', app).value.trim();
    if (nik.length !== 16) {
      err.classList.remove('hidden'); $('#reg-err-msg', app).textContent = 'NIK harus 16 digit'; return;
    }
    btn.innerHTML = '<span class="spin spin-sm"></span><span>Mendaftar...</span>'; btn.disabled = true;
    const res = await API.post('/auth/register', {
      nik, name: $('#r-name', app).value.trim(), email: $('#r-email', app).value.trim(),
      password: $('#r-pass', app).value, phone: $('#r-phone', app).value.trim(), address: $('#r-addr', app).value.trim()
    }, false);
    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i><span>Daftar Sekarang</span>'; btn.disabled = false;
    if (res.success) { Toast.success('Registrasi berhasil! Silakan login.'); Router.go('login'); }
    else { err.classList.remove('hidden'); $('#reg-err-msg', app).textContent = res.message || 'Registrasi gagal'; }
  };
});
