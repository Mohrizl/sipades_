const r=require('express').Router(),c=require('../controllers/surat.controller'),{auth}=require('../middleware/auth'),{uploadKtp}=require('../middleware/upload');
r.use(auth);r.post('/',uploadKtp.fields([{name:'foto_ktp',maxCount:1},{name:'dokumen_pendukung',maxCount:1}]),c.create);r.get('/',c.myList);r.get('/stats',c.stats);r.get('/:id',c.detail);
module.exports=r;