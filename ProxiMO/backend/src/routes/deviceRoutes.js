const express = require('express');
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/devices'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'device-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

const router = express.Router();

// Todas as rotas de dispositivos exigem autenticação
router.use(authMiddleware.authenticate);

// Rotas de gerenciamento de dispositivos
router.get('/', deviceController.getAllDevices);
router.get('/check-all', deviceController.checkAllDevicesStatus);
router.get('/:id', deviceController.getDeviceById);
router.post('/', deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

// Rotas específicas
router.get('/:id/status', deviceController.checkDeviceStatus);
router.get('/:id/access-history', deviceController.getDeviceAccessHistory);
router.post('/:id/image', upload.single('image'), deviceController.uploadDeviceImage);

// Rotas de conexão
router.get('/:id/connect', deviceController.connectToDevice);
router.get('/:id/winbox', deviceController.connectWinbox);

module.exports = router;
