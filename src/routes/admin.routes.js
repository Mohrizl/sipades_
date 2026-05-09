const r=require('express').Router(),c=require('../controllers/admin.controller'),{auth,role}=require('../middleware/auth');
const {uploadDokumen}=require('../middleware/upload');
r.use(auth,role('admin'));r.get('/dashboard',c.dashboard);r.get('/surat',c.allSurat);r.get('/surat/:id',c.detailSurat);r.patch('/surat/:id/status',c.updateStatus);r.post('/surat/:id/terbitkan',uploadDokumen.single('surat_file'),c.terbitkan);r.get('/warga',c.wargaList);r.get('/kontak',c.kontakList);
module.exports=r;