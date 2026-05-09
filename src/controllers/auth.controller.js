const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
exports.register = async (req,res) => {
  try {
    const {nik,name,email,password,phone,address} = req.body;
    if(!nik||!name||!email||!password) return res.status(400).json({success:false,message:'Semua field wajib diisi'});
    if(nik.length!==16) return res.status(400).json({success:false,message:'NIK harus 16 digit'});
    if(password.length<6) return res.status(400).json({success:false,message:'Password minimal 6 karakter'});
    const [ex] = await db.query('SELECT id FROM users WHERE email=? OR nik=?',[email,nik]);
    if(ex.length) return res.status(409).json({success:false,message:'Email atau NIK sudah terdaftar'});
    const hashed = await bcrypt.hash(password,10);
    await db.query('INSERT INTO users (nik,name,email,password,phone,address,role) VALUES (?,?,?,?,?,?,?)',[nik,name,email,hashed,phone||null,address||null,'warga']);
    res.status(201).json({success:true,message:'Registrasi berhasil, silakan login'});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.login = async (req,res) => {
  try {
    const {email,password} = req.body;
    if(!email||!password) return res.status(400).json({success:false,message:'Email dan password wajib diisi'});
    const [rows] = await db.query('SELECT * FROM users WHERE email=? AND is_active=1',[email]);
    if(!rows.length||!await bcrypt.compare(password,rows[0].password))
      return res.status(401).json({success:false,message:'Email atau password salah'});
    const u = rows[0];
    const token = jwt.sign({id:u.id,email:u.email,role:u.role,name:u.name},process.env.JWT_SECRET,{expiresIn:'7d'});
    res.json({success:true,data:{token,user:{id:u.id,nik:u.nik,name:u.name,email:u.email,phone:u.phone,address:u.address,role:u.role}}});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.profile = async (req,res) => {
  try {
    const [r] = await db.query('SELECT id,nik,name,email,phone,address,role,created_at FROM users WHERE id=?',[req.user.id]);
    res.json({success:true,data:r[0]});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.updateProfile = async (req,res) => {
  try {
    const {name,phone,address} = req.body;
    await db.query('UPDATE users SET name=?,phone=?,address=? WHERE id=?',[name,phone,address,req.user.id]);
    res.json({success:true,message:'Profil berhasil diperbarui'});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
exports.changePassword = async (req,res) => {
  try {
    const {old_password,new_password} = req.body;
    const [r] = await db.query('SELECT password FROM users WHERE id=?',[req.user.id]);
    if(!await bcrypt.compare(old_password,r[0].password)) return res.status(400).json({success:false,message:'Password lama salah'});
    const hashed = await bcrypt.hash(new_password,10);
    await db.query('UPDATE users SET password=? WHERE id=?',[hashed,req.user.id]);
    res.json({success:true,message:'Password berhasil diubah'});
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
};
