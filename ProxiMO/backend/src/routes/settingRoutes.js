const express = require('express');
const settingController = require('../controllers/settingController');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(authMiddleware.authenticate);

// Rotas para configurações
router.get('/', 
  permissionMiddleware.check('settings.view'), 
  settingController.getAllSettings
);

router.get('/category/:category', 
  permissionMiddleware.check('settings.view'),
  settingController.getSettingsByCategory
);

router.put('/category/:category', 
  permissionMiddleware.check('settings.edit'),
  settingController.updateSettings
);

router.delete('/category/:category/key/:key', 
  permissionMiddleware.check('settings.delete'),
  settingController.deleteSetting
);

// Rotas para testar integrações
router.post('/test/ldap', 
  permissionMiddleware.check('settings.edit'),
  settingController.testLdapSettings
);

router.post('/test/tacacs', 
  permissionMiddleware.check('settings.edit'),
  settingController.testTacacsSettings
);

router.post('/test/radius', 
  permissionMiddleware.check('settings.edit'),
  settingController.testRadiusSettings
);

module.exports = router;
