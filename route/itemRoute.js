const express = require('express');
const router = express.Router();
const itemCategoryController = require('../controller/itemCategoryController');
const { protect } = require('../middleware/auth');

/**
 *  PUBLIC ROUTES - No auth required (for invoice dropdowns)
 */
router.get('/active', itemCategoryController.getActiveCategories);

/*
 *  ADMIN ROUTES - Admin only access
 */
router.get('/getAllCategories', protect(['superAdmin', 'subAdmin']), itemCategoryController.getAllCategories);
router.post('/create', protect(['superAdmin', 'subAdmin']), itemCategoryController.createCategory);

/**
 *  Category operations by ID - Admin only
 */
router.put('/update/:id', protect(['superAdmin', 'subAdmin']), itemCategoryController.updateCategory);
router.delete('/delete/:id', protect(['superAdmin', 'subAdmin']), itemCategoryController.deleteCategory);
router.patch('/toggle-status/:id', protect(['superAdmin', 'subAdmin']), itemCategoryController.toggleCategoryStatus);

module.exports = router;
