// // controllers/serviceProvider.controller.js
// const ServiceProvider = require('../models/serviceProviderModel');

// // Create service provider (by Admin)
// // exports.createServiceProvider = async (req, res) => {
// //   try {
// //     // optionally you can attach approvedBy from req.admin later
// //     const data = req.body;

// //     const newProvider = await ServiceProvider.create(data);

// //     res.status(201).json({
// //       success: true,
// //       message: 'Service provider created successfully',
// //       data: newProvider,
// //     });
// //   } catch (error) {
// //     console.error('Create ServiceProvider error:', error);

// //     // Duplicate key handling for mobile / email / registrationNumber
// //     if (error.code === 11000) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Duplicate field value',
// //         details: error.keyValue,
// //       });
// //     }

// //     res.status(500).json({
// //       success: false,
// //       message: 'Failed to create service provider',
// //       error: error.message,
// //     });
// //   }
// // };
// exports.createServiceProvider = async (req, res) => {
//   try {
//     const data = req.body;

//     // Optionally attach approvedBy admin info from req.user if wanted
//     if (req.user && (req.user.role === 'superadmin' || req.user.role === 'subadmin')) {
//       data.approvedBy = {
//         adminId: req.user.id,
//         adminName: req.user.email || 'Admin'
//       };
//       data.approvalStatus = 'Approved';
//       data.isActive = true;
//     }

//     const newProvider = await ServiceProvider.create(data);

//     res.status(201).json({
//       success: true,
//       message: 'Service provider created successfully',
//       data: newProvider,
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: 'Duplicate field value',
//         details: error.keyValue,
//       });
//     }
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create service provider',
//       error: error.message,
//     });
//   }
// };

// // Get all service providers (with optional filters)
// exports.getAllServiceProviders = async (req, res) => {
//   try {
//     const {
//       approvalStatus,
//       isActive,
//       cityId,
//       serviceId,
//       page = 1,
//       limit = 10,
//       search,
//     } = req.query;

//     const filter = {};

//     if (approvalStatus) filter.approvalStatus = approvalStatus;
//     if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

//     if (cityId) filter.serviceCities = cityId;
//     if (serviceId) filter['services.serviceId'] = serviceId;

//     if (search) {
//       filter.$or = [
//         { firstName: { $regex: search, $options: 'i' } },
//         { lastName: { $regex: search, $options: 'i' } },
//         { ownerName: { $regex: search, $options: 'i' } },
//         { mobile: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } },
//         { registrationNumber: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const skip = (Number(page) - 1) * Number(limit);

//     const [providers, total] = await Promise.all([
//       ServiceProvider.find(filter)
//         .populate('services.serviceId')
//         .populate('serviceCities')
//         .skip(skip)
//         .limit(Number(limit))
//         .sort({ createdAt: -1 }),
//       ServiceProvider.countDocuments(filter),
//     ]);

//     res.status(200).json({
//       success: true,
//       message: 'Service providers fetched successfully',
//       data: providers,
//       pagination: {
//         total,
//         page: Number(page),
//         limit: Number(limit),
//         totalPages: Math.ceil(total / Number(limit)),
//       },
//     });
//   } catch (error) {
//     console.error('GetAll ServiceProvider error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch service providers',
//       error: error.message,
//     });
//   }
// };

// // Get single provider by ID
// exports.getServiceProviderById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const provider = await ServiceProvider.findById(id)
//       .populate('services.serviceId')
//       .populate('serviceCities')
//       .populate('approvedBy.adminId');

//     if (!provider) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service provider not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Service provider fetched successfully',
//       data: provider,
//     });
//   } catch (error) {
//     console.error('GetById ServiceProvider error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch service provider',
//       error: error.message,
//     });
//   }
// };

// // Update provider (full or partial) by Admin
// exports.updateServiceProvider = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     // Example: if you want to auto-copy current to permanent when flag true
//     if (updateData.permanentAddress?.sameAsCurrent && updateData.currentAddress) {
//       updateData.permanentAddress = {
//         ...updateData.currentAddress,
//         sameAsCurrent: true,
//       };
//     }

//     const updated = await ServiceProvider.findByIdAndUpdate(
//       id,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     )
//       .populate('services.serviceId')
//       .populate('serviceCities')
//       .populate('approvedBy.adminId');

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service provider not found',
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Service provider updated successfully',
//       data: updated,
//     });
//   } catch (error) {
//     console.error('Update ServiceProvider error:', error);

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: 'Duplicate field value',
//         details: error.keyValue,
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Failed to update service provider',
//       error: error.message,
//     });
//   }
// };

// // Soft delete provider by Admin
// exports.deleteServiceProvider = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const adminId = req.admin?._id; // if you store admin on req in auth middleware

//     const provider = await ServiceProvider.findById(id);
//     if (!provider) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service provider not found',
//       });
//     }

//     provider.isDeleted = true;
//     provider.deletedAt = new Date();
//     provider.deletedBy = {
//       userId: adminId,
//       userModel: 'Admin',
//     };
//     provider.isActive = false;
//     provider.isAvailable = false;

//     await provider.save();

//     res.status(200).json({
//       success: true,
//       message: 'Service provider deleted (soft) successfully',
//     });
//   } catch (error) {
//     console.error('Delete ServiceProvider error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete service provider',
//       error: error.message,
//     });
//   }
// };

const ServiceProvider = require("../models/serviceProviderModel");

// Create service provider
exports.createServiceProvider = async (req, res) => {
  try {
    const data = req.body;
    if (
      req.user &&
      (req.user.role === "superadmin" || req.user.role === "subadmin")
    ) {
      data.approvedBy = {
        adminId: req.user.id,
        adminName: req.user.email || "Admin",
      };
      data.approvalStatus = "Approved";
      data.isActive = true;
    }
    const newProvider = await ServiceProvider.create(data);
    res.status(201).json({
      success: true,
      message: "Service provider created successfully",
      data: newProvider,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value",
        details: error.keyValue,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all service providers
exports.getAllServiceProviders = async (req, res) => {
  try {
    const {
      approvalStatus,
      isActive,
      cityId,
      serviceId,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const filter = {};
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (typeof isActive !== "undefined") filter.isActive = isActive === "true";
    if (cityId) filter.serviceCities = cityId;
    if (serviceId) filter["services.serviceId"] = serviceId;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [providers, total] = await Promise.all([
      ServiceProvider.find(filter)
        .populate("services.serviceId")
        .populate("serviceCities")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      ServiceProvider.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Service providers fetched successfully",
      data: providers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single provider by ID
exports.getServiceProviderById = async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await ServiceProvider.findById(id)
      .populate("services.serviceId")
      .populate("serviceCities")
      .populate("approvedBy.adminId");

    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });

    res
      .status(200)
      .json({
        success: true,
        message: "Service provider fetched successfully",
        data: provider,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update service provider
exports.updateServiceProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (
      updateData.permanentAddress?.sameAsCurrent &&
      updateData.currentAddress
    ) {
      updateData.permanentAddress = {
        ...updateData.currentAddress,
        sameAsCurrent: true,
      };
    }

    const updated = await ServiceProvider.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("services.serviceId")
      .populate("serviceCities")
      .populate("approvedBy.adminId");

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });

    res
      .status(200)
      .json({
        success: true,
        message: "Service provider updated successfully",
        data: updated,
      });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value",
        details: error.keyValue,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete provider
exports.deleteServiceProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const provider = await ServiceProvider.findById(id);
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });

    provider.isDeleted = true;
    provider.deletedAt = new Date();
    provider.deletedBy = {
      userId: adminId,
      userModel: "Admin",
    };
    provider.isActive = false;
    provider.isAvailable = false;
    await provider.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Service provider deleted (soft) successfully",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get list of service providers by Service ID
exports.getProvidersByServiceId = async (req, res) => {
  try {
    const { serviceId } = req.params; // or req.query if you want it as a query param

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Service ID is required",
      });
    }

    const providers = await ServiceProvider.find({
      "services.serviceId": serviceId,
      isDeleted: { $ne: true },
    })
      .populate("services.serviceId")
      .populate("serviceCities")
      .populate("approvedBy.adminId");

    res.status(200).json({
      success: true,
      message: "Service providers fetched successfully",
      data: providers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch service providers by Service ID",
      error: error.message,
    });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    if (!["superadmin", "subadmin"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can toggle status",
      });
    }

    const serviceProvider = await ServiceProvider.findById(id);
    if (!serviceProvider) {
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });
    }

    serviceProvider.isActive = !serviceProvider.isActive;
    await serviceProvider.save();

    res.status(200).json({
      success: true,
      message: `Service Provider ${
        serviceProvider.isActive ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    console.error("Toggle service provider status error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error toggling service provider status",
        error: error.message,
      });
  }
};
