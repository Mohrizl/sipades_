const db = require('../utils/db');
exports.dashboard = async (req,res) => {
  try {
    const [[s]] = await db.query(`SELECT COUNT(*) total,SUM(status='pending') pending,SUM(status='diproses') diproses,SUM(status='disetujui') disetujui,SUM(status='ditolak') ditolak,SUM(status='selesai') selesai FROM surat_requests`);
    const [[w]] = await db.query(`SELECT COUNT(*) total_warga FROM users WHERE role='warga'`);
    const [recent] = await db.query(`SELECT sr.id,sr.nomor_pengajuan,sr.status,sr.created_at,u.name warga_name,js.nama jenis_surat_nama FROM surat_requests sr JOIN users u ON sr.user_id=u.id JOIN jenis_surat js ON sr.jenis_surat_id=js.id ORDER BY sr.created_at DESC LIMIT 8`);
    const [monthly] = await db.query(`SELECT MONTH(created_at) bulan,COUNT(*) total FROM surat_requests WHERE YEAR(created_at)=YEAR(CURDATE()) GROUP BY MONTH(created_at) ORDER BY bulan`);
    res.json({success:true,data:{stats:s,warga:w,recent,monthly}});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.allSurat = async (req,res) => {
  try {
    const {status,search,page=1,limit=10} = req.query;
    const offset=(page-1)*limit; let where='WHERE 1=1'; const params=[];
    if(status){where+=' AND sr.status=?';params.push(status);}
    if(search){where+=' AND (u.name LIKE ? OR sr.nomor_pengajuan LIKE ?)';params.push(`%${search}%`,`%${search}%`);}
    const [rows] = await db.query(`SELECT sr.*,u.name warga_name,u.nik warga_nik,u.phone warga_phone,js.nama jenis_surat_nama,js.kode jenis_surat_kode,p.name petugas_name FROM surat_requests sr JOIN users u ON sr.user_id=u.id JOIN jenis_surat js ON sr.jenis_surat_id=js.id LEFT JOIN users p ON sr.petugas_id=p.id ${where} ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`,[...params,+limit,+offset]);
    const [[{total}]] = await db.query(`SELECT COUNT(*) total FROM surat_requests sr JOIN users u ON sr.user_id=u.id ${where}`,params);
    res.json({success:true,data:rows,pagination:{total,page:+page,limit:+limit}});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.detailSurat = async (req,res) => {
  try {
    const [r] = await db.query(`SELECT sr.*,u.name warga_name,u.nik warga_nik,u.email warga_email,u.phone warga_phone,u.address warga_address,js.nama jenis_surat_nama,js.kode,js.persyaratan,p.name petugas_name,so.nomor_surat,so.tanggal_terbit,so.file_path surat_file,so.keterangan surat_ket FROM surat_requests sr JOIN users u ON sr.user_id=u.id JOIN jenis_surat js ON sr.jenis_surat_id=js.id LEFT JOIN users p ON sr.petugas_id=p.id LEFT JOIN surat_output so ON so.request_id=sr.id WHERE sr.id=?`,[req.params.id]);
    if(!r.length) return res.status(404).json({success:false,message:'Tidak ditemukan'});
    res.json({success:true,data:r[0]});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.updateStatus = async (req,res) => {
  try {
    const {status,catatan_petugas} = req.body;
    if(!['diproses','disetujui','ditolak','selesai'].includes(status)) return res.status(400).json({success:false,message:'Status tidak valid'});
    const [ex] = await db.query('SELECT * FROM surat_requests WHERE id=?',[req.params.id]);
    if(!ex.length) return res.status(404).json({success:false,message:'Tidak ditemukan'});
    await db.query(`UPDATE surat_requests SET status=?,catatan_petugas=?,petugas_id=?,tanggal_diproses=IF(?='diproses',NOW(),tanggal_diproses),tanggal_selesai=IF(? IN ('selesai','disetujui'),NOW(),tanggal_selesai) WHERE id=?`,[status,catatan_petugas||null,req.user.id,status,status,req.params.id]);
    const msg={diproses:'Pengajuan surat Anda sedang diproses.',disetujui:'Pengajuan surat Anda disetujui!',ditolak:`Pengajuan ditolak. ${catatan_petugas||''}`,selesai:'Surat selesai, silakan ambil di kantor desa.'};
    const tipe={diproses:'info',disetujui:'sukses',ditolak:'error',selesai:'sukses'};
    await db.query('INSERT INTO notifikasi (user_id,judul,pesan,tipe) VALUES (?,?,?,?)',[ex[0].user_id,`Status: ${status.toUpperCase()}`,msg[status],tipe[status]]);
    res.json({success:true,message:'Status berhasil diperbarui'});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.terbitkan = async (req,res) => {
  try {
    const [ex] = await db.query("SELECT * FROM surat_requests WHERE id=? AND status='disetujui'",[req.params.id]);
    if(!ex.length) return res.status(400).json({success:false,message:'Pengajuan belum disetujui'});
    if(!req.file) return res.status(400).json({success:false,message:'File surat wajib diupload'});
    const d=new Date();
    const nomor=`${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${Math.floor(1000+Math.random()*9000)}/DS`;
    await db.query('INSERT INTO surat_output (request_id,petugas_id,nomor_surat,tanggal_terbit,file_path,keterangan) VALUES (?,?,?,CURDATE(),?,?)',[req.params.id,req.user.id,nomor,req.file.filename,req.body.keterangan||null]);
    await db.query("UPDATE surat_requests SET status='selesai' WHERE id=?",[req.params.id]);
    await db.query('INSERT INTO notifikasi (user_id,judul,pesan,tipe) VALUES (?,?,?,?)',[ex[0].user_id,'Surat Diterbitkan',`Surat nomor ${nomor} telah diterbitkan. Silakan unduh di Status Surat.`,'sukses']);
    res.json({success:true,message:'Surat berhasil diterbitkan',data:{nomor_surat:nomor}});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.wargaList = async (req,res) => {
  try {
    const {search,page=1,limit=10} = req.query;
    const offset=(page-1)*limit; let where="WHERE role='warga'"; const params=[];
    if(search){where+=' AND (name LIKE ? OR nik LIKE ? OR email LIKE ?)';params.push(`%${search}%`,`%${search}%`,`%${search}%`);}
    const [rows] = await db.query(`SELECT id,nik,name,email,phone,address,created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,[...params,+limit,+offset]);
    const [[{total}]] = await db.query(`SELECT COUNT(*) total FROM users ${where}`,params);
    res.json({success:true,data:rows,pagination:{total,page:+page,limit:+limit}});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.kontakList = async (req,res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kontak_pesan ORDER BY created_at DESC');
    res.json({success:true,data:rows});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
