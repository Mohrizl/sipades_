const db = require('../utils/db');
exports.getJenis = async (req,res) => {
  try { const [r]=await db.query('SELECT * FROM jenis_surat WHERE is_active=1 ORDER BY nama'); res.json({success:true,data:r}); }
  catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.getNotif = async (req,res) => {
  try {
    const [r]=await db.query('SELECT * FROM notifikasi WHERE user_id=? ORDER BY created_at DESC LIMIT 20',[req.user.id]);
    const [[{unread}]]=await db.query('SELECT COUNT(*) unread FROM notifikasi WHERE user_id=? AND is_read=0',[req.user.id]);
    res.json({success:true,data:r,unread});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.readNotif = async (req,res) => {
  try { await db.query('UPDATE notifikasi SET is_read=1 WHERE user_id=?',[req.user.id]); res.json({success:true}); }
  catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.sendKontak = async (req,res) => {
  try {
    const {nama,email,subjek,pesan} = req.body;
    if(!nama||!email||!subjek||!pesan) return res.status(400).json({success:false,message:'Semua field wajib diisi'});
    await db.query('INSERT INTO kontak_pesan (nama,email,subjek,pesan) VALUES (?,?,?,?)',[nama,email,subjek,pesan]);
    res.status(201).json({success:true,message:'Pesan berhasil dikirim'});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};

// Balas pesan kontak
exports.balasKontak = async (req, res) => {
  try {
    const { balasan } = req.body;
    if (!balasan) return res.status(400).json({ success: false, message: 'Balasan tidak boleh kosong' });
    const [pesan] = await db.query('SELECT * FROM kontak_pesan WHERE id=?', [req.params.id]);
    if (!pesan.length) return res.status(404).json({ success: false, message: 'Pesan tidak ditemukan' });
    await db.query('INSERT INTO kontak_balasan (pesan_id, admin_id, balasan) VALUES (?,?,?)',
      [req.params.id, req.user.id, balasan]);
    await db.query('UPDATE kontak_pesan SET is_read=1 WHERE id=?', [req.params.id]);
    // Cari user_id warga berdasarkan email pengirim pesan
    const [wargaRows] = await db.query('SELECT id FROM users WHERE email=?', [pesan[0].email]);
    if (wargaRows.length) {
      await db.query('INSERT INTO notifikasi (user_id, judul, pesan, tipe) VALUES (?,?,?,?)',
        [wargaRows[0].id, `Balasan: ${pesan[0].subjek}`,
         balasan, 'balasan']);
    }
    res.json({ success: true, message: 'Balasan berhasil dikirim' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Get balasan pesan
exports.getBalasanKontak = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT kb.*, u.name as admin_name FROM kontak_balasan kb
       JOIN users u ON kb.admin_id=u.id
       WHERE kb.pesan_id=? ORDER BY kb.created_at ASC`, [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Notifikasi admin - pengajuan surat baru dan pesan baru
exports.getNotifAdmin = async (req, res) => {
  try {
    const [surat] = await db.query(
      `SELECT 'surat' as tipe, sr.id, sr.nomor_pengajuan as ref, u.name as nama,
              js.nama as keterangan, sr.created_at
       FROM surat_requests sr
       JOIN users u ON sr.user_id=u.id
       JOIN jenis_surat js ON sr.jenis_surat_id=js.id
       ORDER BY sr.created_at DESC LIMIT 10`);
    const [pesan] = await db.query(
      `SELECT 'pesan' as tipe, id, subjek as ref, nama, pesan as keterangan, created_at
       FROM kontak_pesan ORDER BY created_at DESC LIMIT 10`);
    const all = [...surat, ...pesan].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 15);
    const [[{ unread }]] = await db.query(
      `SELECT (SELECT COUNT(*) FROM surat_requests WHERE created_at > NOW() - INTERVAL 1 DAY) +
              (SELECT COUNT(*) FROM kontak_pesan WHERE is_read=0) as unread`);
    res.json({ success: true, data: all, unread });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Hapus notifikasi
exports.deleteNotif = async (req, res) => {
  try {
    const { ids } = req.body; // array of ids, or 'all'
    if (ids === 'all') {
      await db.query('DELETE FROM notifikasi WHERE user_id=?', [req.user.id]);
    } else if (Array.isArray(ids) && ids.length) {
      await db.query('DELETE FROM notifikasi WHERE id IN (?) AND user_id=?', [ids, req.user.id]);
    }
    res.json({ success: true, message: 'Notifikasi dihapus' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
};

// Hapus pesan kontak (admin)
exports.deletePesan = async (req, res) => {
  try {
    const { ids } = req.body;
    if (ids === 'all') {
      await db.query('DELETE FROM kontak_pesan');
    } else if (Array.isArray(ids) && ids.length) {
      await db.query('DELETE FROM kontak_pesan WHERE id IN (?)', [ids]);
    }
    res.json({ success: true, message: 'Pesan dihapus' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
};

// Riwayat pesan warga + balasannya (untuk halaman Hubungi Admin warga)
exports.getRiwayatPesan = async (req, res) => {
  try {
    const [pesan] = await db.query(
      'SELECT * FROM kontak_pesan WHERE email=? ORDER BY created_at DESC',
      [req.user.email]);
    // Get balasan untuk setiap pesan
    for (let p of pesan) {
      const [bal] = await db.query(
        `SELECT kb.*, u.name admin_name FROM kontak_balasan kb
         JOIN users u ON kb.admin_id=u.id WHERE kb.pesan_id=? ORDER BY kb.created_at ASC`,
        [p.id]);
      p.balasan = bal;
    }
    res.json({ success: true, data: pesan });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
};
