const r=require('express').Router(),c=require('../controllers/auth.controller'),{auth}=require('../middleware/auth');
r.post('/register',c.register);r.post('/login',c.login);r.get('/profile',auth,c.profile);r.put('/profile',auth,c.updateProfile);r.put('/change-password',auth,c.changePassword);
module.exports=r;
