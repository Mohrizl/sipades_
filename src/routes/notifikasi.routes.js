const r = require('express').Router();
const { auth, role } = require('../middleware/auth');
const { getNotif, readNotif, getNotifAdmin, deleteNotif } = require('../controllers/misc.controller');
r.use(auth);
r.get('/', getNotif);
r.patch('/read-all', readNotif);
r.delete('/', deleteNotif);
r.get('/admin', role('admin'), getNotifAdmin);
module.exports = r;
