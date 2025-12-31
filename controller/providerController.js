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
const City = require("../models/availableCities");
const bcrypt = require('bcryptjs');
// const { generateAccessToken }=require('../utils/tokenUtils')



const { 
  generateAccessToken, 
  generateRefreshToken, 
  setAuthCookies 
} = require("../utils/tokenUtils");
// Create service provider
// exports.createServiceProvider = async (req, res) => {
//   try {
//     const data = req.body;
//     if (
//       req.user &&
//       (req.user.role === "superadmin" || req.user.role === "subadmin")
//     ) {
//       data.approvedBy = {
//         adminId: req.user.id,
//         adminName: req.user.email || "Admin",
//       };
//       data.approvalStatus = "Approved";
//       data.isActive = true;
//     }
//     const newProvider = await ServiceProvider.create(data);
//     res.status(201).json({
//       success: true,
//       message: "Service provider created successfully",
//       data: newProvider,
//     });
//   } catch (error) {
//     // if (error.code === 11000) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "Duplicate field value",
//     //     details: error.keyValue,
//     //   });
//     // }
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
exports.createServiceProvider = async (req, res) => {
  try {
    const data = req.body;

    // 1. Validate Cities if provided
    if (data.serviceCities && Array.isArray(data.serviceCities)) {
      const validCities = await City.find({
        _id: { $in: data.serviceCities },
        isActive: true
      });

      if (validCities.length !== data.serviceCities.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected cities are invalid or inactive"
        });
      }
    }

    // 2. Admin Auto-Approval Logic
    if (req.user && (req.user.role === "superadmin" || req.user.role === "subadmin")) {
      data.approvedBy = {
        adminId: req.user.id,
        adminName: req.user.email || "Admin",
        approvedAt: new Date()
      };
      data.approvalStatus = "Approved";
      data.isActive = true;
    }

    // 3. Password Requirement
    if (!data.password) {
      return res.status(400).json({ 
        success: false, 
        message: "Password is required for service provider account creation" 
      });
    }

    // 4. Create Provider
    const newProvider = await ServiceProvider.create(data);
    
    const providerResponse = newProvider.toObject();
    delete providerResponse.password;

    res.status(201).json({
      success: true,
      message: "Service provider created successfully with assigned cities.",
      data: providerResponse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Mobile or Email already exists",
        details: error.keyValue,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.loginServiceProvider = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    // Fetch provider with password for comparison
    const provider = await ServiceProvider.findOne({
      $or: [{ email: email }, { mobile: mobile }],
      isDeleted: { $ne: true }
    }).select("+password isActive approvalStatus tokenVersion");

    if (!provider || !(await provider.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email/mobile or password" });
    }

    if (!provider.isActive) {
      return res.status(403).json({ success: false, message: "Your account is currently inactive" });
    }

    // 1. Generate both tokens using your utility functions
    const accessToken = generateAccessToken(provider._id, "serviceprovider", provider.tokenVersion);
    const refreshToken = generateRefreshToken(provider._id, "serviceprovider", provider.tokenVersion);

    // 2. Log tokens to console as requested
    console.log("--- Login Success ---");
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    // 3. Use your utility to set cookies (handles domain, maxAge, and security)
    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { 
        id: provider._id, 
        firstName: provider.firstName, 
        role: "serviceprovider",
        accessToken, // Optional: sending in body for frontend accessibility
        refreshToken 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// exports.createServiceProvider = async (req, res) => {
//   try {
//     const data = req.body;
    
//     // Check if the creator is an Admin
//     if (req.user && (req.user.role === "superadmin" || req.user.role === "subadmin")) {
//       data.approvedBy = {
//         adminId: req.user.id,
//         adminName: req.user.email || "Admin",
//         approvedAt: new Date()
//       };
//       data.approvalStatus = "Approved";
//       data.isActive = true;
//     }

//     // Ensure password is provided for first-time login
//     if (!data.password) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Password is required for service provider account creation" 
//       });
//     }

//     const newProvider = await ServiceProvider.create(data);
    
//     // Remove password from response for security
//     const providerResponse = newProvider.toObject();
//     delete providerResponse.password;

//     res.status(201).json({
//       success: true,
//       message: "Service provider created by admin. They can now login with the provided credentials.",
//       data: providerResponse,
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile or Email already exists",
//         details: error.keyValue,
//       });
//     }
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
// exports.loginServiceProvider = async (req, res) => {
//   try {
//     const { email, mobile, password } = req.body;

//     // Fetch provider with password for comparison
//     const provider = await ServiceProvider.findOne({
//       $or: [{ email: email }, { mobile: mobile }],
//       isDeleted: { $ne: true }
//     }).select("+password isActive approvalStatus");

//     if (!provider || !(await provider.comparePassword(password))) {
//       return res.status(401).json({ success: false, message: "Invalid email/mobile or password" });
//     }

//     if (!provider.isActive) {
//       return res.status(403).json({ success: false, message: "Your account is currently inactive" });
//     }

//     // Generate tokens
//     const accessToken = generateAccessToken(provider._id, "serviceprovider", provider.tokenVersion);
    
//     res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "none" });

//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       data: { id: provider._id, firstName: provider.firstName, role: "serviceprovider" }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

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

// exports.toggleStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userRole = req.user.role;
//     if (!["superadmin", "subadmin"].includes(userRole)) {
//       return res.status(403).json({
//         success: false,
//         message: "Only admins can toggle status",
//       });
//     }

//     const serviceProvider = await ServiceProvider.findById(id);
//     if (!serviceProvider) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Service provider not found" });
//     }

//     serviceProvider.isActive = !serviceProvider.isActive;
//     await serviceProvider.save();

//     res.status(200).json({
//       success: true,
//       message: `Service Provider ${
//         serviceProvider.isActive ? "activated" : "deactivated"
//       } successfully`,
//     });
//   } catch (error) {
//     console.error("Toggle service provider status error:", error);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Error toggling service provider status",
//         error: error.message,
//       });
//   }
// };



exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    console.log('Toggle request:', { id, status, userRole }); // DEBUG

    if (!["superadmin", "subadmin"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can toggle status",
      });
    }

    const serviceProvider = await ServiceProvider.findById(id);
    if (!serviceProvider) {
      return res.status(404).json({ 
        success: false, 
        message: "Service provider not found" 
      });
    }

    console.log('Before toggle:', serviceProvider.isActive); // DEBUG

    // Force specific status OR toggle
    if (status === 'active') {
      serviceProvider.isActive = true;
    } else if (status === 'inactive') {
      serviceProvider.isActive = false;
    } else {
      serviceProvider.isActive = !serviceProvider.isActive;
    }

    await serviceProvider.save({ validateBeforeSave: false });

    console.log('After toggle:', serviceProvider.isActive); // DEBUG

    res.status(200).json({
      success: true,
      message: `Service Provider ${serviceProvider.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        id: serviceProvider._id,
        isActive: serviceProvider.isActive,
        name: serviceProvider.firstName || serviceProvider.ownerName
      }
    });
  } catch (error) {
    console.error("Toggle service provider status error:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling service provider status",
      error: error.message,
    });
  }
};


//get all apointment 
exports.getServiceProviderAppointments = async (req, res) => {
  try {
    const serviceProviderId = req.user.id;

    // Verify service provider exists and is active
    const serviceProvider = await ServiceProvider.findOne({
      _id: serviceProviderId,
      isActive: true
    });
    
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found or inactive'
      });
    }

    // ✅ FIXED: Use array syntax for .select() - NOT multiline string
    const appointments = await Booking.find({ 
      servicePartnerId: serviceProviderId
    })
    .populate({
      path: 'patientId',
      select: 'firstName lastName phone email profilePhoto "address.city" "address.cityId"',
      model: 'Patient'
    })
    .populate({
      path: 'serviceId',
      select: 'name category basePrice',
      model: 'Service'
    })
    .populate({
      path: 'city',
      select: 'name',
      model: 'City'
    })
    .select([
      'appointmentDate',
      'slotTime',
      'duration',
      'status',
      'statusReason',
      'notes',
      'pricing',
      'cancelledBy',
      'cancelledAt',
      'cancellationReason',
      'patientId',
      'serviceId',
      'city',
      'createdAt',
      'updatedAt'
    ])
    .sort({ appointmentDate: -1, createdAt: -1 })
    .lean();

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error('Error fetching service provider appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments',
      error: error.message
    });
  }
};

// GET single appointment
exports.getSingleAppointment = async (req, res) => {
  try {
    const { id: appointmentId } = req.params;
    const serviceProviderId = req.user.id;

    const appointment = await Booking.findOne({ 
      _id: appointmentId,
      servicePartnerId: serviceProviderId 
    })
    .populate({
      path: 'patientId',
      select: 'firstName lastName phone email profilePhoto address bloodGroup allergies currentMedications emergencyContact',
      model: 'Patient'
    })
    .populate({
      path: 'serviceId',
      select: 'name category basePrice equipmentCharges',
      model: 'Service'
    })
    .populate('city', 'name')
    .lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not assigned to you'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Error fetching single appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};