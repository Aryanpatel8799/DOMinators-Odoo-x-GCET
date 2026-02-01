const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate, adminOnly } = require('../middlewares/auth');
const { validateBody, validateParams } = require('../middlewares/validate');
const { createContactSchema, updateContactSchema, uuidParamSchema } = require('../validations/schemas');

// All routes require admin authentication
router.use(authenticate, adminOnly);

router.get('/', contactController.getContacts);
router.get('/:id', validateParams(uuidParamSchema), contactController.getContact);
router.post('/', validateBody(createContactSchema), contactController.createContact);
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateContactSchema), contactController.updateContact);
router.delete('/:id', validateParams(uuidParamSchema), contactController.deleteContact);

module.exports = router;
