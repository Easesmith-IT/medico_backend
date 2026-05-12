

const ServiceProvider = require("../models/serviceProviderModel");
const City = require("../models/availableCities");
const mongoose = require("mongoose");
const Booking = require("../models/bookingModel");
const bcrypt = require('bcryptjs');
// const { generateAccessToken }=require('../utils/tokenUtils')
const uploadFile = require("../utils/uploadFile");


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
// exports.createServiceProvider = async (req, res) => {
//   try {
//     const data = req.body;

//     // 1. Validate Cities if provided
//     if (data.serviceCities && Array.isArray(data.serviceCities)) {
//       const validCities = await City.find({
//         _id: { $in: data.serviceCities },
//         isActive: true
//       });

//       if (validCities.length !== data.serviceCities.length) {
//         return res.status(400).json({
//           success: false,
//           message: "One or more selected cities are invalid or inactive"
//         });
//       }
//     }

//     // 2. Admin Auto-Approval Logic
//     if (req.user && (req.user.role === "superadmin" || req.user.role === "subadmin")) {
//       data.approvedBy = {
//         adminId: req.user.id,
//         adminName: req.user.email || "Admin",
//         approvedAt: new Date()
//       };
//       data.approvalStatus = "Approved";
//       data.isActive = true;
//     }

//     // 3. Password Requirement
//     if (!data.password) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Password is required for service provider account creation" 
//       });
//     }

//     // 4. Create Provider
//     const newProvider = await ServiceProvider.create(data);
    
//     const providerResponse = newProvider.toObject();
//     delete providerResponse.password;

//     res.status(201).json({
//       success: true,
//       message: "Service provider created successfully with assigned cities.",
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

exports.createServiceProvider = async (req, res) => {
  try {
    const raw = req.body;

    console.log("req.files", req.files);

    console.log("req.body", req.body);

    const parseJson = (val, fallback) => {
      if (!val) return fallback;
      if (
        typeof val === "string" &&
        (val.startsWith("[") || val.startsWith("{"))
      ) {
        try {
          return JSON.parse(val);
        } catch {
          return fallback;
        }
      }
      return val;
    };

    const data = {
      ...raw,

      currentAddress: parseJson(raw.currentAddress, {}),
      permanentAddress: parseJson(raw.permanentAddress, {}),
      workAddress: parseJson(raw.workAddress, {}),

      services: parseJson(raw.services, []),

      bankDetails: parseJson(raw.bankDetails, {}),
      availability: parseJson(raw.availability, {}),

      emergencyContact: parseJson(raw.emergencyContact, {}),

      serviceCities: parseJson(raw.serviceCities, []),
      languages: parseJson(raw.languages, []),

      dateOfBirth: raw.dateOfBirth
        ? new Date(JSON.parse(raw.dateOfBirth))
        : null,
    };

    /* ---------------------------
       1️⃣ Validate Cities
    ----------------------------*/
    // if (data.serviceCities?.length) {
    //   const validCities = await City.find({
    //     _id: { $in: data.serviceCities },
    //     isActive: true,
    //   });

    //   if (validCities.length !== data.serviceCities.length) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "One or more selected cities are invalid or inactive",
    //     });
    //   }
    // }


    /* 1️⃣ Validate Cities - FIXED VERSION */
if (data.serviceCities?.length) {
  // Convert to ObjectIds and filter invalid
  const cityIds = data.serviceCities
    .map(id => String(id).trim())
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));

  if (cityIds.length !== data.serviceCities.length) {
    return res.status(400).json({
      success: false,
      message: "Some city IDs are invalid",
      received: data.serviceCities,
      validCount: cityIds.length
    });
  }

  const validCities = await City.find({
    _id: { $in: cityIds },
    isActive: true
  }).select('_id name isActive');

  if (validCities.length !== cityIds.length) {
    return res.status(400).json({
      success: false,
      message: "One or more selected cities are invalid or inactive",
      expected: cityIds.length,
      found: validCities.length,
      foundCities: validCities.map(c => ({id: c._id, name: c.name}))
    });
  }

  //  All good - use converted ObjectIds
  data.serviceCities = cityIds;
}

    /* ---------------------------
       2️⃣ Admin Auto Approval
    ----------------------------*/
    if (req.user && ["superadmin", "subadmin"].includes(req.user.role)) {
      data.approvedBy = {
        adminId: req.user.id,
        adminName: req.user.email || "Admin",
        approvedAt: new Date(),
      };
      data.approvalStatus = "Approved";
      data.isActive = true;
    }

    /* ---------------------------
       3️⃣ Password Validation
    ----------------------------*/
    // if (!data.password) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Password is required for service provider account creation"
    //   });
    // }

    /* ---------------------------
       4️⃣ Documents Object
    ----------------------------*/
    const documents = {};

    /* Profile Photo */
    if (req.files?.profilePhoto?.[0]) {
      documents.profilePhoto = await uploadFile(req.files.profilePhoto[0]);
    }

    /* Identity Proof */
    if (req.files?.identityProofFile?.[0]) {
      documents.identityProof = {
        ...parseJson(raw.identityProof, {}),
        documentUrl: await uploadFile(req.files.identityProofFile[0]),
      };
    }

    /* Address Proof */
    if (req.files?.addressProofFile?.[0]) {
      documents.addressProof = {
        ...parseJson(raw.addressProof, {}),
        documentUrl: await uploadFile(req.files.addressProofFile[0]),
      };
    }

    /* Registration Certificate */
    if (req.files?.registrationCertificateFile?.[0]) {
      documents.registrationCertificate = {
        ...parseJson(raw.registrationCertificate, {}),
        certificateUrl: await uploadFile(
          req.files.registrationCertificateFile[0],
        ),
      };
    }

    /* Police Verification */
    if (req.files?.policeVerificationFile?.[0]) {
      documents.policeVerification = {
        ...parseJson(raw.policeVerification, {}),
        certificateUrl: await uploadFile(req.files.policeVerificationFile[0]),
      };
    }

    /* Educational Certificates */
    if (req.files?.educationalCertificatesFiles?.length) {
      const educationMeta = parseJson(raw.educationalCertificates, []);

      documents.educationalCertificates = await Promise.all(
        req.files.educationalCertificatesFiles.map(async (file, index) => ({
          ...educationMeta[index],
          certificateUrl: await uploadFile(file),
        })),
      );
    }

    /* Professional Certificates */
    if (req.files?.professionalCertificatesFiles?.length) {
      const professionalMeta = parseJson(raw.professionalCertificates, []);

      documents.professionalCertificates = await Promise.all(
        req.files.professionalCertificatesFiles.map(async (file, index) => ({
          ...professionalMeta[index],
          certificateUrl: await uploadFile(file),
        })),
      );
    }

    /* Experience Certificates */
    if (req.files?.experienceCertificatesFiles?.length) {
      const experienceMeta = parseJson(raw.experienceCertificates, []);

      documents.experienceCertificates = await Promise.all(
        req.files.experienceCertificatesFiles.map(async (file, index) => ({
          ...experienceMeta[index],
          certificateUrl: await uploadFile(file),
        })),
      );
    }

    data.documents = documents;

    /* ---------------------------
       5️⃣ Create Provider
    ----------------------------*/
    const newProvider = await ServiceProvider.create(data);

    const providerResponse = newProvider.toObject();
    delete providerResponse.password;

    res.status(201).json({
      success: true,
      message: "Service provider created successfully",
      data: providerResponse,
    });
  } catch (error) {
    console.error("Create provider error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Mobile or Email already exists",
        details: error.keyValue,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.loginServiceProvider = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    // Build $or conditions dynamically to avoid undefined in query
    const orConditions = [];
    if (email) orConditions.push({ email });
    if (mobile) orConditions.push({ mobile });

    if (orConditions.length === 0) {
      return res.status(400).json({ success: false, message: "Email or mobile is required" });
    }

    // Fetch provider with password for comparison
    const provider = await ServiceProvider.findOne({
      $or: orConditions,
      isDeleted: { $ne: true }
    }).select("+password isActive approvalStatus tokenVersion");

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

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

    const providerObject = provider.toObject();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
    const startOfNextMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 1);

    const bookingStats = await Booking.aggregate([
      {
        $match: {
          servicePartnerId: provider._id,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$pricing.totalAmount", 0] } },
          collectedRevenue: { $sum: { $ifNull: ["$paidAmount", 0] } },
          pendingPayments: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ["$dueAmount", 0] }, 0] }, { $ifNull: ["$dueAmount", 0] }, 0],
            },
          },
        },
      },
    ]);

    const statusBreakdownMap = bookingStats.reduce((acc, item) => {
      const statusKey = item?._id || "Unknown";
      acc[statusKey] = item?.count || 0;
      return acc;
    }, {});

    const totalBookings = bookingStats.reduce((sum, item) => sum + (item?.count || 0), 0);
    const totalRevenue = bookingStats.reduce((sum, item) => sum + (item?.totalRevenue || 0), 0);
    const collectedRevenue = bookingStats.reduce((sum, item) => sum + (item?.collectedRevenue || 0), 0);
    const pendingPayments = bookingStats.reduce((sum, item) => sum + (item?.pendingPayments || 0), 0);

    const cancelledBookingsCount =
      (statusBreakdownMap.Cancelled || 0) +
      (statusBreakdownMap.Rejected || 0) +
      (statusBreakdownMap["Cancellation Requested"] || 0);

    const cancellationRate =
      totalBookings > 0 ? Number(((cancelledBookingsCount / totalBookings) * 100).toFixed(2)) : 0;

    const [todayBookings, thisMonthBookings, upcomingBookings] = await Promise.all([
      Booking.countDocuments({
        servicePartnerId: provider._id,
        appointmentDate: { $gte: startOfToday, $lt: endOfToday },
      }),
      Booking.countDocuments({
        servicePartnerId: provider._id,
        appointmentDate: { $gte: startOfMonth, $lt: startOfNextMonth },
      }),
      Booking.find({
        servicePartnerId: provider._id,
        appointmentDate: { $gte: startOfToday },
        status: {
          $nin: ["Cancelled", "Rejected", "Cancellation Requested"],
        },
      })
        .populate({
          path: "patientId",
          select: "firstName lastName mobile profilePhoto",
          model: "Patient",
        })
        .populate({
          path: "serviceId",
          select: "name category basePrice",
          model: "Service",
        })
        .select(
          "appointmentDate slotTime status paymentStatus pricing.totalAmount paidAmount dueAmount patientId serviceId createdAt",
        )
        .sort({ appointmentDate: 1, "slotTime.startTime": 1, createdAt: 1 })
        .limit(5)
        .lean(),
    ]);

    providerObject.bookingStats = {
      totalBookings,
      statusBreakdown: statusBreakdownMap,
      totalRevenue,
      collectedRevenue,
      todayBookings,
      thisMonthBookings,
      pendingPayments,
      cancellationRate,
      upcomingBookings: upcomingBookings.length,
    };
    providerObject.upcomingBookings = upcomingBookings;

    res.status(200).json({
      success: true,
      message: "Service provider fetched successfully",
      data: providerObject,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateServiceProviderWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason = "" } = req.body || {};

    const allowedActions = ["approve", "under_review", "reject", "suspend"];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow action",
      });
    }

    const provider = await ServiceProvider.findById(id);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Service provider not found",
      });
    }

    if (action === "approve") {
      provider.approvalStatus = "Approved";
      provider.isActive = true;
      provider.isVerified = true;
      provider.rejectionReason = undefined;
      provider.suspensionReason = undefined;
      provider.approvedBy = {
        adminId: req.user?.id,
        adminName: req.user?.email || "Admin",
        approvedAt: new Date(),
      };
    }

    if (action === "under_review") {
      provider.approvalStatus = "Under Review";
    }

    if (action === "reject") {
      provider.approvalStatus = "Rejected";
      provider.isActive = false;
      provider.rejectionReason = reason?.trim() || "Rejected by admin";
    }

    if (action === "suspend") {
      provider.approvalStatus = "Suspended";
      provider.isActive = false;
      provider.suspensionReason = reason?.trim() || "Suspended by admin";
    }

    await provider.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Service provider workflow updated successfully",
      data: provider,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update service provider
// exports.updateServiceProvider = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     if (
//       updateData.permanentAddress?.sameAsCurrent &&
//       updateData.currentAddress
//     ) {
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
//       .populate("services.serviceId")
//       .populate("serviceCities")
//       .populate("approvedBy.adminId");

//     if (!updated)
//       return res
//         .status(404)
//         .json({ success: false, message: "Service provider not found" });

//     res
//       .status(200)
//       .json({
//         success: true,
//         message: "Service provider updated successfully",
//         data: updated,
//       });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "Duplicate field value",
//         details: error.keyValue,
//       });
//     }
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

exports.updateServiceProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = req.body;

    /* ---------------------------
       Helpers
    ----------------------------*/

    const parseJson = (val, fallback) => {
      if (!val) return fallback;
      if (
        typeof val === "string" &&
        (val.startsWith("[") || val.startsWith("{"))
      ) {
        try {
          return JSON.parse(val);
        } catch {
          return fallback;
        }
      }
      return val;
    };

    const parseDate = (val) => {
      if (!val) return null;
      try {
        return new Date(JSON.parse(val));
      } catch {
        return new Date(val);
      }
    };

    /* ---------------------------
       Find Existing Provider
    ----------------------------*/

    const existingProvider = await ServiceProvider.findById(id);

    if (!existingProvider) {
      return res.status(404).json({
        success: false,
        message: "Service provider not found",
      });
    }

    /* ---------------------------
       Parse Incoming Data
    ----------------------------*/

    const updateData = {
      ...raw,

      currentAddress: parseJson(raw.currentAddress, {}),
      permanentAddress: parseJson(raw.permanentAddress, {}),
      workAddress: parseJson(raw.workAddress, {}),

      services: parseJson(raw.services, []),
      bankDetails: parseJson(raw.bankDetails, {}),
      availability: parseJson(raw.availability, {}),
      emergencyContact: parseJson(raw.emergencyContact, {}),

      serviceCities: parseJson(raw.serviceCities, []),
      languages: parseJson(raw.languages, []),

      dateOfBirth: raw.dateOfBirth ? parseDate(raw.dateOfBirth) : undefined,
    };

    /* ---------------------------
       sameAsCurrent Address Logic
    ----------------------------*/

    if (
      updateData.permanentAddress?.sameAsCurrent &&
      updateData.currentAddress
    ) {
      updateData.permanentAddress = {
        ...updateData.currentAddress,
        sameAsCurrent: true,
      };
    }

    /* ---------------------------
       Documents Merge Logic
    ----------------------------*/

    const documents = { ...existingProvider.documents };

    /* Profile Photo */
    if (req.files?.profilePhoto?.[0]) {
      documents.profilePhoto = await uploadFile(req.files.profilePhoto[0]);
    }

    /* Identity Proof */
    if (req.files?.identityProofFile?.[0]) {
      documents.identityProof = {
        ...parseJson(raw.identityProof, {}),
        documentUrl: await uploadFile(req.files.identityProofFile[0]),
      };
    }

    /* Address Proof */
    if (req.files?.addressProofFile?.[0]) {
      documents.addressProof = {
        ...parseJson(raw.addressProof, {}),
        documentUrl: await uploadFile(req.files.addressProofFile[0]),
      };
    }

    /* Registration Certificate */
    if (req.files?.registrationCertificateFile?.[0]) {
      documents.registrationCertificate = {
        ...parseJson(raw.registrationCertificate, {}),
        certificateUrl: await uploadFile(
          req.files.registrationCertificateFile[0],
        ),
      };
    }

    /* Police Verification */
    if (req.files?.policeVerificationFile?.[0]) {
      documents.policeVerification = {
        ...parseJson(raw.policeVerification, {}),
        certificateUrl: await uploadFile(req.files.policeVerificationFile[0]),
      };
    }

    /* Educational Certificates */
    if (req.files?.educationalCertificatesFiles?.length) {
      const meta = parseJson(raw.educationalCertificates, []);

      documents.educationalCertificates = await Promise.all(
        req.files.educationalCertificatesFiles.map(async (file, index) => ({
          ...meta[index],
          certificateUrl: await uploadFile(file),
        })),
      );
    }

    /* Professional Certificates */
    if (req.files?.professionalCertificatesFiles?.length) {
      const meta = parseJson(raw.professionalCertificates, []);

      documents.professionalCertificates = await Promise.all(
        req.files.professionalCertificatesFiles.map(async (file, index) => ({
          ...meta[index],
          certificateUrl: await uploadFile(file),
        })),
      );
    }

    /* Experience Certificates */
    if (req.files?.experienceCertificatesFiles?.length) {
      const meta = parseJson(raw.experienceCertificates, []);

      documents.experienceCertificates = await Promise.all(
        req.files.experienceCertificatesFiles.map(async (file, index) => ({
          ...meta[index],
          certificateUrl: await uploadFile(file),
        })),
      );
    }

    /* Attach documents */
    updateData.documents = documents;

    /* ---------------------------
       Update Provider
    ----------------------------*/

    const updated = await ServiceProvider.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("services.serviceId")
      .populate("serviceCities")
      .populate("approvedBy.adminId");

    res.status(200).json({
      success: true,
      message: "Service provider updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update provider error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value",
        details: error.keyValue,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
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



// exports.createProviderBooking = async (req, res) => {
//   const session = await mongoose.startSession();
  
//   try {
//     // ServiceProvider creates booking after treatment completion
//     const servicePartnerId = req.user.id; // Logged-in provider
//     const { patientId, previousBookingId, serviceId, appointmentDate, startTime, endTime, duration, shiftType, notes, category, modes, cityId } = req.body;

//     if (!patientId || !serviceId || !appointmentDate || !startTime || !endTime) {
//       await session.abortTransaction();
//       return res.status(400).json({
//         success: false,
//         message: "patientId, serviceId, appointmentDate, startTime, endTime required",
//       });
//     }

//     await session.startTransaction();

//     // 1) Validate service
//     const service = await Service.findById(serviceId).session(session);
//     if (!service || !service.isActive || service.isDeleted) {
//       await session.abortTransaction();
//       return res.status(404).json({ success: false, message: "Service not found or inactive" });
//     }

//     // 2) Fetch & validate patient (reuse from previous if provided)
//     let patient = await Patient.findById(patientId).select("address.cityId name phone").session(session);
//     if (!patient || !patient.address?.cityId) {
//       await session.abortTransaction();
//       return res.status(400).json({ success: false, message: "Patient not found or city not set" });
//     }

//     //  3) FETCH PREVIOUS BOOKING DETAILS (if provided for reschedule)
//     let previousBooking = null;
//     let previousTreatmentId = null;
//     if (previousBookingId) {
//       previousBooking = await Booking.findById(previousBookingId)
//         .populate('treatmentId', 'status')
//         .session(session);
      
//       if (!previousBooking) {
//         await session.abortTransaction();
//         return res.status(404).json({ success: false, message: "Previous booking not found" });
//       }
      
//       //  Verify treatment COMPLETED before reschedule
//       if (previousBooking.treatmentId?.status !== 'Completed') {
//         await session.abortTransaction();
//         return res.status(400).json({ success: false, message: "Can only create after treatment completion" });
//       }
      
//       previousTreatmentId = previousBooking.treatmentId._id;
//       console.log(`📋 Previous booking: ${previousBookingId}, treatment: ${previousTreatmentId}`);
//     }

//     // 4) Determine booking city
//     let bookingCity = cityId ? await City.findById(cityId).session(session) : 
//                       await City.findById(patient.address.cityId).session(session);
//     if (!bookingCity) {
//       await session.abortTransaction();
//       return res.status(400).json({ success: false, message: "Invalid city" });
//     }

//     // 5) Check slot conflicts (PROVIDER-SPECIFIC)
//     const dayStart = new Date(appointmentDate); dayStart.setHours(0, 0, 0, 0);
//     const dayEnd = new Date(appointmentDate); dayEnd.setHours(23, 59, 59, 999);
//     const conflictQuery = {
//       serviceId,
//       appointmentDate: { $gte: dayStart, $lte: dayEnd },
//       status: { $nin: ["Cancelled", "Rejected"] },
//       "slotTime.startTime": startTime,
//       "slotTime.endTime": endTime,
//       servicePartnerId: servicePartnerId  // Only provider's own slots
//     };

//     const existingBooking = await Booking.findOne(conflictQuery).session(session);
//     if (existingBooking) {
//       await session.abortTransaction();
//       return res.status(409).json({ success: false, message: "Your slot already booked" });
//     }

//     // 6) Calculate duration & pricing
//     let bookingDuration = duration;
//     if (!bookingDuration) {
//       const [sh, sm] = startTime.split(":").map(Number);
//       const [eh, em] = endTime.split(":").map(Number);
//       bookingDuration = (eh * 60 + em) - (sh * 60 + sm);
//       if (bookingDuration <= 0) bookingDuration = service.defaultDuration || 30;
//     }
//     const pricing = service.calculateTotalPrice(bookingDuration, false, shiftType || null);

//     //  7) CREATE NEW TREATMENT (post-completion → always new)
//     const newTreatment = new Treatment({
//       patientId,
//       serviceId,
//       servicePartnerId,
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       status: 'Active',
//       previousTreatmentId: previousTreatmentId || null  // Track chain
//     });
//     await newTreatment.save({ session });
//     const treatmentId = newTreatment._id;

//     //  8) CREATE BOOKING (provider-created)
//     const newBooking = new Booking({
//       patientId,
//       serviceId,
//       category: category || service.category,
//       modes: Array.isArray(modes) && modes.length ? modes : service.modes,
//       servicePartnerId,  // Fixed to logged-in provider
//       appointmentDate: new Date(appointmentDate),
//       slotTime: { startTime, endTime },
//       duration: bookingDuration,
//       shiftType: shiftType || null,
//       status: "Pending",
//       pricing,
//       notes: notes || "",
//       city: bookingCity._id,
//       createdBy: { userId: servicePartnerId, userModel: "ServiceProvider" },  // Provider!
//       treatmentId,
//       treatmentStatus: 'Active',
//       invoiceGenerated: false,
//       previousBookingId: previousBooking?._id || null  // Reference for reschedule
//     });
//     await newBooking.save({ session });

//     await session.commitTransaction();

//     // Populate response with previous details
//     const populatedBooking = await Booking.findById(newBooking._id)
//       .populate('city', 'name latitude longitude')
//       .populate('treatmentId', 'status validTill previousTreatmentId')
//       .populate('patientId', 'name phone')
//       .populate('previousBookingId', 'appointmentDate status treatmentId');

//     res.status(201).json({
//       success: true,
//       message: "Provider booking created successfully",
//       data: {
//         booking: populatedBooking,
//         treatmentId,
//         previousDetails: previousBooking ? {
//           bookingId: previousBooking._id,
//           previousTreatmentId: previousTreatmentId,
//           oldDate: previousBooking.appointmentDate
//         } : null
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Provider booking error:", error);
//     res.status(500).json({ success: false, message: "Error creating booking", error: error.message });
//   } finally {
//     session.endSession();
//   }
// };





