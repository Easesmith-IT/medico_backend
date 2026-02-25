

// const itemCategorySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Category name is required'],
//     trim: true,
//     unique: true,
//     maxlength: [50, 'Category name cannot exceed 50 characters']
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   isDeleted: {
//     type: Boolean,
//     default: false
//   },
//   description: {
//     type: String,
//     maxlength: [200, 'Description cannot exceed 200 characters']
//   },
//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Admin',
//     required: true
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('ItemCategory', itemCategorySchema);
// models/Item.js



// models/itemCategoryModel.js - type at Category level
const mongoose = require('mongoose');

//  Item sub-schema (NO type - inherits from category)
const itemSchema = new mongoose.Schema({
  name: {
  type: String,
  required: [true, 'Category name required'],
  trim: true
},
  // name: {
  //   type: String,
  //   required: true,
  //   trim: true
  // },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
});

// ✅ Category schema with type + embedded items
const itemCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name required'],
    trim: true,
    unique: true
  },
  type: {  // ✅ Type at CATEGORY level
    type: String,
    enum: ['medicine', 'equipment', 'consumables'],
    required: true
  },
  description: {
    type: String
  },
  items: [itemSchema],  // ✅ Embedded items (no type)
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ItemCategory', itemCategorySchema);
