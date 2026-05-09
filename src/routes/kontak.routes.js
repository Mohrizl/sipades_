const r = require('express').Router();
const { sendKontak, balasKontak, getBalasanKontak, deletePesan, getRiwayatPesan } = require('../controllers/misc.controller');
const { auth, role } = require('../middleware/auth');
r.post('/', sendKontak);
r.get('/riwayat', auth, getRiwayatPesan);
r.get('/:id/balasan', getBalasanKontak);
r.post('/:id/balas', auth, role('admin'), balasKontak);
r.delete('/', auth, role('admin'), deletePesan);
module.exports = r;
