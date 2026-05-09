document.addEventListener('DOMContentLoaded', async () => {
  // Cek apakah ada token
  if (!Auth.isLoggedIn()) {
    Router.go('login');
    return;
  }
  // Verifikasi token ke server - kalau gagal paksa ke login
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('/api/auth/profile', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.success) {
      // Update data user terbaru dari server
      localStorage.setItem('user', JSON.stringify(data.data));
      Router.go(data.data.role === 'warga' ? 'warga' : 'admin');
    } else {
      Auth.clear();
      Router.go('login');
    }
  } catch (e) {
    // Kalau server tidak bisa dicapai atau timeout, paksa login ulang
    Auth.clear();
    Router.go('login');
  }
});
