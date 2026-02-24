const mongoose = require('mongoose');

const itemCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ItemCategory', itemCategorySchema);
