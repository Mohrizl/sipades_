const db = require('../utils/db');
const genNomor = () => { const d=new Date(); return `REQ-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`; };
exports.create = async (req,res) => {
  try {
    const {jenis_surat_id,keperluan} = req.body;
    if(!jenis_surat_id||!keperluan) return res.status(400).json({success:false,message:'Jenis surat dan keperluan wajib diisi'});
    const foto_ktp = req.files?.foto_ktp?.[0]?.filename||null;
    const dok = req.files?.dokumen_pendukung?.[0]?.filename||null;
    const nomor = genNomor();
    const [r] = await db.query('INSERT INTO surat_requests (nomor_pengajuan,user_id,jenis_surat_id,keperluan,foto_ktp,dokumen_pendukung) VALUES (?,?,?,?,?,?)',[nomor,req.user.id,jenis_surat_id,keperluan,foto_ktp,dok]);
    await db.query('INSERT INTO notifikasi (user_id,judul,pesan,tipe) VALUES (?,?,?,?)',[req.user.id,'Pengajuan Diterima',`Pengajuan ${nomor} telah diterima.`,'info']);
    res.status(201).json({success:true,message:'Pengajuan berhasil dikirim',data:{id:r.insertId,nomor_pengajuan:nomor}});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.myList = async (req,res) => {
  try {
    const {status,page=1,limit=10} = req.query;
    const offset=(page-1)*limit; let where='WHERE sr.user_id=?'; const params=[req.user.id];
    if(status){where+=' AND sr.status=?';params.push(status);}
    const [rows] = await db.query(`SELECT sr.*,js.nama jenis_surat_nama,js.kode jenis_surat_kode,u.name petugas_name FROM surat_requests sr JOIN jenis_surat js ON sr.jenis_surat_id=js.id LEFT JOIN users u ON sr.petugas_id=u.id ${where} ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`,[...params,+limit,+offset]);
    const [[{total}]] = await db.query(`SELECT COUNT(*) total FROM surat_requests sr JOIN jenis_surat js ON sr.jenis_surat_id=js.id LEFT JOIN users u ON sr.petugas_id=u.id ${where}`,params);
    res.json({success:true,data:rows,pagination:{total,page:+page,limit:+limit}});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.detail = async (req,res) => {
  try {
    const [r] = await db.query(`SELECT sr.*,js.nama jenis_surat_nama,js.kode,js.persyaratan,u.name petugas_name,so.nomor_surat,so.tanggal_terbit,so.file_path surat_file FROM surat_requests sr JOIN jenis_surat js ON sr.jenis_surat_id=js.id LEFT JOIN users u ON sr.petugas_id=u.id LEFT JOIN surat_output so ON so.request_id=sr.id WHERE sr.id=? AND sr.user_id=?`,[req.params.id,req.user.id]);
    if(!r.length) return res.status(404).json({success:false,message:'Data tidak ditemukan'});
    res.json({success:true,data:r[0]});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.stats = async (req,res) => {
  try {
    const [rows] = await db.query('SELECT status,COUNT(*) total FROM surat_requests WHERE user_id=? GROUP BY status',[req.user.id]);
    const s={pending:0,diproses:0,disetujui:0,ditolak:0,selesai:0,total:0};
    rows.forEach(r=>{s[r.status]=+r.total;s.total+=+r.total;});
    res.json({success:true,data:s});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
