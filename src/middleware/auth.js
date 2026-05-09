const jwt = require('jsonwebtoken');
const auth = (req,res,next) => {
  const token = (req.headers['authorization']||'').split(' ')[1];
  if(!token) return res.status(401).json({success:false,message:'Token tidak ditemukan'});
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({success:false,message:'Token tidak valid'}); }
};
const role = (...roles) => (req,res,next) => {
  if(!roles.includes(req.user.role)) return res.status(403).json({success:false,message:'Akses ditolak'});
  next();
};
module.exports = {auth, role};
