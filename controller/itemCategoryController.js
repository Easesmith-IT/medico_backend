const ItemCategory = require("../models/itemCategoryModel");
const catchAsync = require("../utils/catchAsync"); // Assuming you have this utility
const Booking = require("../models/bookingModel"); // For checking category usage in bookings
// // CREATE Category
// exports.createCategory = catchAsync(async (req, res) => {
//   const { name, description } = req.body;

//   // Check if category already exists
//   const existingCategory = await ItemCategory.findOne({
//     name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
//     isDeleted: false
//   });

//   if (existingCategory) {
//     return res.status(400).json({
//       success: false,
//       message: 'Category with this name already exists'
//     });
//   }

//   const category = await ItemCategory.create({
//     name: name.trim(),
//     description,
//     createdBy: req.user.id
//   });

//   res.status(201).json({
//     success: true,
//     message: 'Category created successfully',
//     data: category
//   });
// });

// // GET All Categories (Active only for dropdowns)
// exports.getActiveCategories = catchAsync(async (req, res) => {
//   const categories = await ItemCategory.find({
//     isActive: true,
//     isDeleted: false
//   })
//   .sort({ name: 1 })
//   .select('name _id description');

//   res.status(200).json({
//     success: true,
//     count: categories.length,
//     data: categories
//   });
// });

// // GET All Categories (Admin view - includes inactive)
// exports.getAllCategories = catchAsync(async (req, res) => {
//   const {
//     page = 1,
//     limit = 10,
//     search = ''
//   } = req.query;

//   const query = { isDeleted: false };
//   if (search) {
//     query.name = { $regex: search, $options: 'i' };
//   }

//   const categories = await ItemCategory.find(query)
//     .sort('-createdAt')
//     .skip((page - 1) * limit)
//     .limit(parseInt(limit));

//   const total = await ItemCategory.countDocuments(query);

//   res.status(200).json({
//     success: true,
//     results: categories.length,
//     totalPages: Math.ceil(total / limit),
//     currentPage: parseInt(page),
//     totalRecords: total,
//     data: { categories }
//   });
// });

// // UPDATE Category
// exports.updateCategory = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const { name, description, isActive } = req.body;

//   const category = await ItemCategory.findOne({
//     _id: id,
//     isDeleted: false
//   });

//   if (!category) {
//     return res.status(404).json({
//       success: false,
//       message: 'Category not found'
//     });
//   }

//   // Check for duplicate name (excluding current category)
//   if (name && name.trim() !== category.name) {
//     const duplicate = await ItemCategory.findOne({
//       name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
//       _id: { $ne: id },
//       isDeleted: false
//     });

//     if (duplicate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Category with this name already exists'
//       });
//     }
//   }

//   category.name = name?.trim() || category.name;
//   category.description = description || category.description;
//   category.isActive = isActive !== undefined ? isActive : category.isActive;

//   await category.save();

//   res.status(200).json({
//     success: true,
//     message: 'Category updated successfully',
//     data: category
//   });
// });

// // TOGGLE Active Status
// exports.toggleCategoryStatus = catchAsync(async (req, res) => {
//   const { id } = req.params;

//   const category = await ItemCategory.findOne({
//     _id: id,
//     isDeleted: false
//   });

//   if (!category) {
//     return res.status(404).json({
//       success: false,
//       message: 'Category not found'
//     });
//   }

//   category.isActive = !category.isActive;
//   await category.save();

//   res.status(200).json({
//     success: true,
//     message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
//     data: category
//   });
// });

// // DELETE Category (Soft delete + check usage)
// exports.deleteCategory = catchAsync(async (req, res) => {
//   const { id } = req.params;

//   // Check if category is used in any invoices
//   const Invoice = require('../models/invoiceModel');
//   const usageCount = await Invoice.countDocuments({
//     $or: [
//       { 'medicines.categoryId': id },
//       { 'additionalEquipment.categoryId': id }
//     ]
//   });

//   if (usageCount > 0) {
//     return res.status(400).json({
//       success: false,
//       message: `Cannot delete category. It is used in ${usageCount} invoice(s)`
//     });
//   }

//   const category = await ItemCategory.findOneAndUpdate(
//     { _id: id, isDeleted: false },
//     { isDeleted: true },
//     { new: true }
//   );

//   if (!category) {
//     return res.status(404).json({
//       success: false,
//       message: 'Category not found'
//     });
//   }

//   res.status(200).json({
//     success: true,
//     message: 'Category deleted successfully'
//   });
// });
exports.createCategory = catchAsync(async (req, res) => {
  const { name, description, type, items = [] } = req.body;

  // YOUR existing logic - unchanged
  const existingCategory = await ItemCategory.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    isDeleted: false,
  });

  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: "Category with this name already exists",
    });
  }

  // ✅ NEW: Validate items if provided
  const validatedItems = items
    .map((item) => ({
      name: item.name?.trim(),
      unitPrice: parseFloat(item.unitPrice) || 0,
      isActive: item.isActive !== undefined ? item.isActive : true,
    }))
    .filter((item) => item.name && item.unitPrice > 0);

  const categoryData = {
    name: name.trim(),
    description,
    createdBy: req.user.id,
  };

  // Add type & items if provided
  if (type) categoryData.type = type;
  if (validatedItems.length > 0) categoryData.items = validatedItems;

  const category = await ItemCategory.create(categoryData);

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

// GET All Categories (Active only for dropdowns) - YOUR function name
exports.getActiveCategories = catchAsync(async (req, res) => {
  // YOUR existing logic + items
  const categories = await ItemCategory.find({
    isActive: true,
    isDeleted: false,
  })
    .select("name type description items _id") // ✅ Added items
    .sort({ name: 1 });

  // Filter active items for seller dropdown
  const result = categories.map((cat) => ({
    _id: cat._id,
    name: cat.name,
    type: cat.type,
    description: cat.description,
    items: cat.items ? cat.items.filter((item) => item.isActive) : [],
  }));

  res.status(200).json({
    success: true,
    count: result.length,
    data: result, // ✅ Now includes items for seller!
  });
});

// GET All Categories (Admin view) - YOUR function name
exports.getAllCategories = catchAsync(async (req, res) => {
  // YOUR exact logic + items
  const { page = 1, limit = 10, search = "" } = req.query;

  const query = { isDeleted: false };
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const categories = await ItemCategory.find(query)
    .select("name type description items isActive createdAt")
    .sort("-createdAt")
    .skip((page - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await ItemCategory.countDocuments(query);

  res.status(200).json({
    success: true,
    results: categories.length,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    totalRecords: total,
    data: { categories },
  });
});

// UPDATE Category - YOUR function name
exports.updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description, type, isActive, items } = req.body;

  // YOUR existing logic
  const category = await ItemCategory.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  // YOUR duplicate check
  if (name && name.trim() !== category.name) {
    const duplicate = await ItemCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: id },
      isDeleted: false,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }
  }

  // YOUR updates + new fields
  category.name = name?.trim() || category.name;
  category.description =
    description !== undefined ? description : category.description;
  if (type !== undefined) category.type = type;
  category.isActive = isActive !== undefined ? isActive : category.isActive;

  // ✅ NEW: Update items if provided
  if (items !== undefined) {
    const validatedItems = items
      .map((item) => ({
        name: item.name?.trim(),
        unitPrice: parseFloat(item.unitPrice) || 0,
        isActive: item.isActive !== undefined ? item.isActive : true,
      }))
      .filter((item) => item.name && item.unitPrice > 0);
    category.items = validatedItems;
  }

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

// TOGGLE Active Status - YOUR function name (unchanged)
exports.toggleCategoryStatus = catchAsync(async (req, res) => {
  const { id } = req.params;

  const category = await ItemCategory.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  category.isActive = !category.isActive;
  await category.save();

  res.status(200).json({
    success: true,
    message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
    data: category,
  });
});

// DELETE Category - YOUR function name (unchanged)
exports.deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  const Invoice = require("../models/invoiceModel");
  const usageCount = await Invoice.countDocuments({
    $or: [
      { "medicines.categoryId": id },
      { "additionalEquipment.categoryId": id },
    ],
  });

  if (usageCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete category. It is used in ${usageCount} invoice(s)`,
    });
  }

  const category = await ItemCategory.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

// exports.getItemsByCategory = catchAsync(async (req, res) => {
//   const { id } = req.params;  // ✅ Changed from categoryId to id

//   console.log('🔍 categoryId:', id); // DEBUG

//   const category = await ItemCategory.findById(id)
//     .select('name items _id description isActive isDeleted')
//     .lean();

//   if (!category || category.isDeleted) {
//     return res.status(404).json({
//       success: false,
//       message: `Category ${id} not found or deleted`
//     });
//   }

//   const activeItems = (category.items || [])
//     .filter(item => item.isActive)
//     .map(item => ({
//       _id: item._id,
//       name: item.name,
//       unitPrice: parseFloat(item.unitPrice)
//     }));

//   res.status(200).json({
//     success: true,
//     data: {
//       categoryId: category._id.toString(),
//       categoryName: category.name,
//       items: activeItems
//     }
//   });
// });
exports.getItemsByCategory = catchAsync(async (req, res) => {
  const { id } = req.params; // ✅ Matches your route :id

  const category = await ItemCategory.findById(id)
    .select("name items _id description isActive isDeleted")
    .lean();

  if (!category || category.isDeleted) {
    return res.status(404).json({
      success: false,
      message: `Category ${id} not found or deleted`,
    });
  }

  // ✅ Track selection status - default all unselected
  const trackableItems = (category.items || [])
    .filter((item) => item.isActive)
    .map((item) => ({
      _id: item._id,
      name: item.name,
      unitPrice: parseFloat(item.unitPrice),
      isActive: true,
      isSelected: false, // ✅ NEW: Track selection
      quantity: 0, // ✅ NEW: Track quantity
      totalPrice: 0, // ✅ NEW: Track total
    }));

  res.status(200).json({
    success: true,
    data: {
      categoryId: category._id.toString(),
      categoryName: category.name,
      items: trackableItems, // ✅ Ready for frontend tracking!
    },
  });
});

exports.getCategoryDetails = catchAsync(async (req, res) => {
  const { id } = req.params; // ✅ Matches your route :id

  const category = await ItemCategory.findById(id)
    .select("name items type _id description isActive isDeleted")
    .lean();

  if (!category || category.isDeleted) {
    return res.status(404).json({
      success: false,
      message: `Category ${id} not found or deleted`,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      category: category,
    },
  });
});
