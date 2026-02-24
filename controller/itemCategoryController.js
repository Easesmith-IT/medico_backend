const ItemCategory = require('../models/itemCategoryModel');
const catchAsync = require('../utils/catchAsync'); // Assuming you have this utility

// CREATE Category
exports.createCategory = catchAsync(async (req, res) => {
  const { name, description } = req.body;
  
  // Check if category already exists
  const existingCategory = await ItemCategory.findOne({ 
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    isDeleted: false 
  });
  
  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: 'Category with this name already exists'
    });
  }

  const category = await ItemCategory.create({
    name: name.trim(),
    description,
    createdBy: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

// GET All Categories (Active only for dropdowns)
exports.getActiveCategories = catchAsync(async (req, res) => {
  const categories = await ItemCategory.find({ 
    isActive: true, 
    isDeleted: false 
  })
  .sort({ name: 1 })
  .select('name _id description');

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// GET All Categories (Admin view - includes inactive)
exports.getAllCategories = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = ''
  } = req.query;

  const query = { isDeleted: false };
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const categories = await ItemCategory.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await ItemCategory.countDocuments(query);

  res.status(200).json({
    success: true,
    results: categories.length,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    totalRecords: total,
    data: { categories }
  });
});

// UPDATE Category
exports.updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const category = await ItemCategory.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check for duplicate name (excluding current category)
  if (name && name.trim() !== category.name) {
    const duplicate = await ItemCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: id },
      isDeleted: false
    });
    
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
  }

  category.name = name?.trim() || category.name;
  category.description = description || category.description;
  category.isActive = isActive !== undefined ? isActive : category.isActive;

  await category.save();

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category
  });
});

// TOGGLE Active Status
exports.toggleCategoryStatus = catchAsync(async (req, res) => {
  const { id } = req.params;

  const category = await ItemCategory.findOne({ 
    _id: id, 
    isDeleted: false 
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  category.isActive = !category.isActive;
  await category.save();

  res.status(200).json({
    success: true,
    message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
    data: category
  });
});

// DELETE Category (Soft delete + check usage)
exports.deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if category is used in any invoices
  const Invoice = require('../models/invoiceModel');
  const usageCount = await Invoice.countDocuments({
    $or: [
      { 'medicines.categoryId': id },
      { 'additionalEquipment.categoryId': id }
    ]
  });

  if (usageCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete category. It is used in ${usageCount} invoice(s)`
    });
  }

  const category = await ItemCategory.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});
