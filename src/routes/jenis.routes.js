const r=require('express').Router();r.get('/',require('../controllers/misc.controller').getJenis);module.exports=r;
