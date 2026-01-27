// const mongoose = require("mongoose");

// const citySchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true,
//     },
//     latitude: {
//       type: Number,
//       required: true,
//     },
//     longitude: {
//       type: Number,
//       required: true,
//     },
//     // Active/Inactive
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("City", citySchema);



const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Optional center point (for display)
    latitude: {
      type: Number,
    },

    longitude: {
      type: Number,
    },

    // ✅ City Boundary (Polygon)
    area: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
        default: "Polygon",
      },

      coordinates: {
        type: [[[Number]]], // [[[lng, lat]]]
        required: true,
      },
    },

    // Active/Inactive
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ✅ REQUIRED for geo queries
citySchema.index({ area: "2dsphere" });

module.exports = mongoose.model("City", citySchema);
