const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dir = path.join(__dirname,'../../uploads');
if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
const storage = multer.diskStorage({
  destination:(_,__,cb)=>cb(null,dir),
  filename:(_,file,cb)=>cb(null,Date.now()+'-'+Math.random().toString(36).slice(2)+path.extname(file.originalname))
});
const filterGambarPdf = (_,file,cb) => {
  const ok = ['.jpg','.jpeg','.png','.pdf'].includes(path.extname(file.originalname).toLowerCase());
  cb(ok?null:new Error('Format tidak didukung'),ok);
};
const filterDokumen = (_,file,cb) => {
  const ok = ['.pdf','.doc','.docx'].includes(path.extname(file.originalname).toLowerCase());
  cb(ok?null:new Error('Format harus PDF/DOC/DOCX'),ok);
};
const uploadKtp = multer({storage,fileFilter:filterGambarPdf,limits:{fileSize:5*1024*1024}});
const uploadDokumen = multer({storage,fileFilter:filterDokumen,limits:{fileSize:5*1024*1024}});
module.exports = { uploadKtp, uploadDokumen };