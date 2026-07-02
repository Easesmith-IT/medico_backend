
const mongoose = require('mongoose');
const Service = require('../models/serviceModel');
const City = require('../models/availableCities');
const Admin = require('../models/adminModel');
const Patient = require('../models/patientModel');
const Doctor = require('../models/doctorModel');
const { autoFilterSlots } = require('../utils/timeFIlter');
const { formatDuration } = require('../utils/timeFormat');
const uploadFile = require("../utils/uploadFile");

// Helper: Format duration labels
// const formatDuration = (minutes) => {
//   if (minutes === 30) return '0.5 hours';
//   if (minutes === 45) return '0.75 hours';
//   if (minutes === 60) return '1 hour';
//   if (minutes === 90) return '1.5 hours';
//   if (minutes === 120) return '2 hours';
//   if (minutes === 150) return '2.5 hours';
//   if (minutes === 180) return '3 hours';
//   if (minutes === 240) return '4 hours';
//   if (minutes === 360) return '6 hours';
//   if (minutes === 480) return '8 hours';
//   if (minutes === 720) return '12 hours';
//   if (minutes === 1440) return '24 hours';
//   if (minutes >= 60) {
//     const hours = minutes / 60;
//     return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
//   }
//   return `${minutes / 60} hours`;
// };

// Helper: Validate city IDs
const validateCities = async (cityIds) => {
  if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
    throw new Error('At least one city must be specified');
  }
  const validCities = await City.find({ _id: { $in: cityIds } });
  if (validCities.length !== cityIds.length) {
    const validCityIds = validCities.map(city => city._id.toString());
    const invalidIds = cityIds.filter(id => !validCityIds.includes(id.toString()));
    throw new Error(`Invalid city IDs: ${invalidIds.join(', ')}`);
  }
  return validCities;
};


// exports.createService = async (req, res) => {
//   try {
//     const userRole = req.user.role;
//     if (!['admin', 'superadmin'].includes(userRole)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Only admins and superadmins can create services.'
//       });
//     }

//     if (!req.user.email) {
//       return res.status(400).json({
//         success: false,
//         message: 'Authenticated user email is required to create service.'
//       });
//     }

//     const {
//       name, category, description,
//       basePrice, equipmentCharges,
//       taxPercentage, modes, supportsDuration,
//       paymentMode, icon, image,
//       cities, slotConfig, timeFormat
//     } = req.body;

//     if (!name || !category || !description || !basePrice) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name, category, description, and base price are required.'
//       });
//     }

//     const selectedTimeFormat = timeFormat || '24-hour';
//     if (!['12-hour', '24-hour'].includes(selectedTimeFormat)) {
//       return res.status(400).json({
//         success: false,
//         message: "Time format must be '12-hour' or '24-hour'."
//       });
//     }

//     let validatedCities;
//     try {
//       validatedCities = await validateCities(cities);
//     } catch (error) {
//       return res.status(400).json({ success: false, message: error.message });
//     }

//     const existingService = await Service.findOne({
//       name, category, isDeleted: false
//     });
//     if (existingService) {
//       return res.status(400).json({
//         success: false,
//         message: `${category} service with name '${name}' already exists`
//       });
//     }

//     // Filter slotConfig to exclude disabled nursingSlots and equipmentBooking
//     let filteredSlotConfig = slotConfig || {};

//     if (filteredSlotConfig.nursingSlots && !filteredSlotConfig.nursingSlots.enabled) {
//       delete filteredSlotConfig.nursingSlots;
//     }
//     if (filteredSlotConfig.equipmentBooking && !filteredSlotConfig.equipmentBooking.enabled) {
//       delete filteredSlotConfig.equipmentBooking;
//     }

//     const service = new Service({
//       name, category, description,
//       basePrice,
//       equipmentCharges: equipmentCharges || 0,
//       taxPercentage: taxPercentage || 18,
//       modes: modes || ['Home Service'],
//       supportsDuration: supportsDuration !== undefined ? supportsDuration : true,
//       paymentMode: paymentMode || 'Both',
//       timeFormat: selectedTimeFormat,
//       icon, image,
//       cities: validatedCities.map(city => city._id),
//       slotConfig: filteredSlotConfig,
//       createdBy: {
//         userId: req.user.id,
//         userModel: userRole === 'superadmin' ? 'SuperAdmin' : 'Admin',
//         name: req.user.name || 'Admin User',
//         email: req.user.email
//       },
//       isActive: true,
//       isDeleted: false
//     });

//     await service.save();
//     await service.populate('cities', 'name latitude longitude');

//     // Filter slotConfig in response similarly
//     const responseSlotConfig = {};
//     if (service.slotConfig.consultationSlots) {
//       responseSlotConfig.consultationSlots = service.slotConfig.consultationSlots;
//     }
//     if (service.slotConfig.nursingSlots && service.slotConfig.nursingSlots.enabled) {
//       responseSlotConfig.nursingSlots = service.slotConfig.nursingSlots;
//     }
//     if (service.slotConfig.equipmentBooking && service.slotConfig.equipmentBooking.enabled) {
//       responseSlotConfig.equipmentBooking = service.slotConfig.equipmentBooking;
//     }

//     const responseObj = service.toObject();
//     responseObj.slotConfig = responseSlotConfig;

//     res.status(201).json({
//       success: true,
//       message: `${category.charAt(0).toUpperCase() + category.slice(1)} service created successfully.`,
//       data: responseObj
//     });
//   } catch (error) {
//     console.error('Create service error:', error);
//     res.status(500).json({ success: false, message: 'Error creating service', error: error.message });
//   }
// };


// exports.createService = async (req, res) => {
//   try {
//     const userRole = req.user.role.toLowerCase();
//     console.log("req.user", req.user);
    

//     if (!['admin', 'superadmin'].includes(userRole)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Only admins and superadmins can create services.'
//       });
//     }

//     const admin = await Admin.findById(req.user.id)
//     console.log("admin-log", admin);
    

//     if (!admin.email) {
//       return res.status(400).json({
//         success: false,
//         message: "Authenticated user email is required to create service.",
//       });
//     }

//     const {
//       name,
//       category,
//       nursingType,           // Required for nursing category
//       description,
//       basePrice,
//       equipmentCharges = 0,
//       taxPercentage = 18,
//       modes = ['Home Service'],
//       supportsDuration = true,
//       paymentMode = 'Both',
//       icon,
//       image,
//       cities,
//       slotConfig = {},
//       timeFormat = '24-hour'
//     } = req.body;

//     if (!name || !category || !description || basePrice == null) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name, category, description, and base price are required.'
//       });
//     }

//     if (!['12-hour', '24-hour'].includes(timeFormat)) {
//       return res.status(400).json({
//         success: false,
//         message: "Time format must be '12-hour' or '24-hour'."
//       });
//     }

//     let validatedCities;
//     try {
//       validatedCities = await validateCities(cities);
//     } catch (error) {
//       return res.status(400).json({ success: false, message: error.message });
//     }

//     const existingService = await Service.findOne({
//       name,
//       category,
//       isDeleted: false
//     });
//     if (existingService) {
//       return res.status(400).json({
//         success: false,
//         message: `${category} service with name '${name}' already exists`
//       });
//     }

//     // Filter out disabled nursingSlots and equipmentBooking from slotConfig
//     if (slotConfig.nursingSlots && !slotConfig.nursingSlots.enabled) {
//       delete slotConfig.nursingSlots;
//     }
//     if (slotConfig.equipmentBooking && !slotConfig.equipmentBooking.enabled) {
//       delete slotConfig.equipmentBooking;
//     }

//     const service = new Service({
//       name,
//       category,
//       nursingType,
//       description,
//       basePrice,
//       equipmentCharges,
//       taxPercentage,
//       modes,
//       supportsDuration,
//       paymentMode,
//       timeFormat,
//       icon,
//       image,
//       cities: validatedCities.map(c => c._id),
//       slotConfig,
//       createdBy: {
//         userId: admin?._id,
//         userModel: userRole === 'superadmin' ? 'SuperAdmin' : 'Admin',
//         name: admin.firstName || 'Admin User',
//         email: admin.email
//       },
//       isActive: true,
//       isDeleted: false
//     });

//     await service.save();
//     await service.populate('cities', 'name latitude longitude');

//     // Filter slotConfig to include only enabled, relevant slots
//     const filteredSlotConfig = autoFilterSlots(service.slotConfig, service.category, service.timeFormat);

//     const responseObj = service.toObject();
//     responseObj.slotConfig = filteredSlotConfig;
//     responseObj.formattedDuration = formatDuration(service.defaultDuration);

//     res.status(201).json({
//       success: true,
//       message: `${category.charAt(0).toUpperCase() + category.slice(1)} service created successfully.`,
//       data: responseObj
//     });

//   } catch (error) {
//     console.error('Create service error:', error);
//     res.status(500).json({ success: false, message: 'Error creating service', error: error.message });
//   }
// };

exports.createService = async (req, res) => {
  try {
    const userRole = req.user.role.toLowerCase();

    console.log("req.body", req.body);

    if (!["admin", "superadmin"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only admins and superadmins can create services.",
      });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin?.email) {
      return res.status(400).json({
        success: false,
        message: "Authenticated user email is required to create service.",
      });
    }

    // Parse body (multipart/form-data sends all fields as strings; parse JSON/numbers where needed)
    const raw = req.body;
    const parseJson = (val, fallback) => {
      if (val == null) return fallback;
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
    const normalizeStringArray = (val) => {
      const parsed = parseJson(val, []);
      const values = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "string"
          ? parsed.split(",")
          : [];
      return [
        ...new Set(
          values
            .map((item) => String(item || "").trim())
            .filter(Boolean),
        ),
      ];
    };
    const name = raw.name;
    const category = raw.category;
    const nursingType = raw.nursingType;
    const description = raw.description;
    const basePrice = raw.basePrice != null ? Number(raw.basePrice) : null;
    const equipmentCharges =
      raw.equipmentCharges != null ? Number(raw.equipmentCharges) : 0;
    const taxPercentage =
      raw.taxPercentage != null ? Number(raw.taxPercentage) : 18;
    const modes = parseJson(raw.modes, ["Home Service"]);
    const supportsDuration =
      raw.supportsDuration === false || raw.supportsDuration === "false"
        ? false
        : true;
    const paymentMode = raw.paymentMode || "Both";
    const timeFormat = raw.timeFormat || "24-hour";
    let cities = parseJson(raw.cities, null);
    let slotConfig = parseJson(raw.slotConfig, {});
    const recommendedSpecializations = normalizeStringArray(
      raw.recommendedSpecializations,
    );
    const recommendedSubSpecialties = normalizeStringArray(
      raw.recommendedSubSpecialties,
    );

    if (!name || !category || !description || basePrice == null) {
      return res.status(400).json({
        success: false,
        message: "Name, category, description, and base price are required.",
      });
    }

    if (!["12-hour", "24-hour"].includes(timeFormat)) {
      return res.status(400).json({
        success: false,
        message: "Time format must be '12-hour' or '24-hour'.",
      });
    }

    let validatedCities;
    try {
      validatedCities = await validateCities(cities);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const existingService = await Service.findOne({
      name,
      category,
      isDeleted: false,
    });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: `${category} service with name '${name}' already exists`,
      });
    }

    // Image/icon: upload to GCP if files present, else use body URLs
    let icon = raw.icon || undefined;
    let image = raw.image || undefined;
    if (req.files?.image?.[0]) {
      try {
        image = await uploadFile(req.files.image[0]);
      } catch (err) {
        console.error("Service image upload error:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Failed to upload service image.",
            error: err.message,
          });
      }
    }
    if (req.files?.icon?.[0]) {
      try {
        icon = await uploadFile(req.files.icon[0]);
      } catch (err) {
        console.error("Service icon upload error:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Failed to upload service icon.",
            error: err.message,
          });
      }
    }

    // Filter out disabled nursingSlots and equipmentBooking from slotConfig
    if (slotConfig.nursingSlots && !slotConfig.nursingSlots.enabled) {
      delete slotConfig.nursingSlots;
    }
    if (slotConfig.equipmentBooking && !slotConfig.equipmentBooking.enabled) {
      delete slotConfig.equipmentBooking;
    }

    const service = new Service({
      name,
      category,
      nursingType,
      description,
      basePrice,
      equipmentCharges,
      taxPercentage,
      modes,
      supportsDuration,
      paymentMode,
      timeFormat,
      icon,
      image,
      recommendedSpecializations,
      recommendedSubSpecialties,
      cities: validatedCities.map((c) => c._id),
      slotConfig,
      createdBy: {
        userId: admin._id,
        userModel: userRole === "superadmin" ? "SuperAdmin" : "Admin",
        name: admin.firstName || "Admin User",
        email: admin.email,
      },
      isActive: true,
      isDeleted: false,
    });

    await service.save();
    await service.populate("cities", "name latitude longitude");

    const filteredSlotConfig = autoFilterSlots(
      service.slotConfig,
      service.category,
      service.timeFormat,
    );
    const responseObj = service.toObject();
    responseObj.slotConfig = filteredSlotConfig;
    responseObj.formattedDuration = formatDuration(service.defaultDuration);

    res.status(201).json({
      success: true,
      message: `${category.charAt(0).toUpperCase() + category.slice(1)} service created successfully.`,
      data: responseObj,
    });
  } catch (error) {
    console.error("Create service error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error creating service",
        error: error.message,
      });
  }
};

// Get All Services with filters
exports.getAllServices = async (req, res) => {
  try {
    const {
      category,
      cityId,
      isActive,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      timeFormat = "24-hour",
    } = req.query;
    const query = { isDeleted: false };

    if (category) query.category = category;
    if (cityId) query.cities = cityId;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const services = await Service.find(query)
      .populate("cities", "name latitude longitude")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(query);
    const formattedServices = services.map((service) => ({
      ...service.toObject(),
      formattedDuration: formatDuration(service.defaultDuration),
      displayTimeFormat: timeFormat,
    }));

    res.status(200).json({
      success: true,
      data: {
        services: formattedServices,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all services error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching services",
        error: error.message,
      });
  }
};

exports.selectService = async (req, res) => {
  try {
    const { serviceIds, patientId } = req.body;
    const { timeFormat = "24-hour" } = req.query;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "serviceIds must be a non-empty array",
      });
    }

    const normalizedServiceIds = [
      ...new Set(
        serviceIds
          .map((id) => String(id || "").trim())
          .filter(Boolean),
      ),
    ];

    if (normalizedServiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "serviceIds must contain at least one valid service id",
      });
    }

    const invalidServiceIds = normalizedServiceIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );

    if (invalidServiceIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid service id(s)",
        invalidServiceIds,
      });
    }

    const services = await Service.find({
      _id: { $in: normalizedServiceIds },
      isActive: true,
      isDeleted: false,
    })
      .populate("cities", "name latitude longitude")
      .lean();

    const serviceById = new Map(
      services.map((service) => [service._id.toString(), service]),
    );

    const selectedServices = normalizedServiceIds
      .map((id) => serviceById.get(id))
      .filter(Boolean)
      .map((service) => ({
        ...service,
        slotConfig: autoFilterSlots(
          service.slotConfig,
          service.category,
          timeFormat,
        ),
        formattedDuration: formatDuration(service.defaultDuration),
        displayTimeFormat: timeFormat,
      }));

    const missingServiceIds = normalizedServiceIds.filter(
      (id) => !serviceById.has(id),
    );

    const userRole = String(req.user?.role || "").toLowerCase().replace(/[_\s]/g, "");
    const targetPatientId = userRole === "patient" ? req.user.id : patientId;
    let patient = null;
    let savedServiceIds = [];
    let savedToPatient = false;

    if (targetPatientId) {
      if (!mongoose.Types.ObjectId.isValid(targetPatientId)) {
        return res.status(400).json({
          success: false,
          message: "Valid patientId is required to save selected services",
        });
      }

      patient = await Patient.findById(targetPatientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      patient.selectedServices = selectedServices.map((service) => service._id);
      await patient.save({ validateBeforeSave: false });
      savedServiceIds = patient.selectedServices;
      savedToPatient = true;
    }

    return res.status(200).json({
      success: true,
      message: savedToPatient
        ? "Selected services saved successfully"
        : "Selected services retrieved successfully",
      count: selectedServices.length,
      requestedCount: normalizedServiceIds.length,
      missingServiceIds,
      data: {
        services: selectedServices,
        selectedServices,
        missingServiceIds,
        patientId: patient?._id || null,
        savedToPatient,
        savedServiceIds,
      },
    });
  } catch (error) {
    console.error("Select services error:", error);
    return res.status(500).json({
      success: false,
      message: "Error selecting services",
      error: error.message,
    });
  }
};

// Get Service By ID
// exports.getServiceById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { timeFormat = '24-hour' } = req.query;
//     const service = await Service.findById(id)
//       .populate('cities', 'name latitude longitude')
//       .populate('createdBy.userId', 'firstName lastName name email phone');
//     if (!service) {
//       return res.status(404).json({ success: false, message: 'Service not found' });
//     }
//     const serviceObj = service.toObject();
//     serviceObj.formattedDuration = formatDuration(service.defaultDuration);
//     serviceObj.displayTimeFormat = timeFormat;

//     res.status(200).json({ success: true, data: serviceObj });
//   } catch (error) {
//     console.error('Get service by ID error:', error);
//     res.status(500).json({ success: false, message: 'Error fetching service', error: error.message });
//   }
// };
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeFormat = "24-hour" } = req.query;

    const service = await Service.findById(id).populate(
      "cities",
      "name latitude longitude",
    );

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    // Normalize userModel for population
    const userModel =
      service.createdBy.userModel === "SuperAdmin"
        ? "Admin"
        : service.createdBy.userModel;

    // Populate createdBy.userId with normalized model
    await service.populate({
      path: "createdBy.userId",
      select: "firstName lastName name email phone",
      model: userModel,
    });

    const serviceObj = service.toObject();

    // Filter slotConfig by enabled flags
    const filteredSlotConfig = {};
    if (service.slotConfig.consultationSlots) {
      filteredSlotConfig.consultationSlots =
        service.slotConfig.consultationSlots;
    }
    if (
      service.slotConfig.nursingSlots &&
      service.slotConfig.nursingSlots.enabled
    ) {
      filteredSlotConfig.nursingSlots = service.slotConfig.nursingSlots;
    }
    if (
      service.slotConfig.equipmentBooking &&
      service.slotConfig.equipmentBooking.enabled
    ) {
      filteredSlotConfig.equipmentBooking = service.slotConfig.equipmentBooking;
    }
    serviceObj.slotConfig = filteredSlotConfig;

    serviceObj.formattedDuration = formatDuration(service.defaultDuration);
    serviceObj.displayTimeFormat = timeFormat;

    res.status(200).json({ success: true, data: serviceObj });
  } catch (error) {
    console.error("Get service by ID error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching service",
        error: error.message,
      });
  }
};

// Update Service
// exports.updateService = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userRole = req.user.role;
//     if (!['admin', 'superadmin'].includes(userRole)) {
//       return res.status(403).json({ success: false, message: 'Only admins can update services' });
//     }

//     const service = await Service.findById(id);
//     if (!service) {
//       return res.status(404).json({ success: false, message: 'Service not found' });
//     }

//     const {
//       name, description, basePrice, equipmentCharges,
//       taxPercentage, modes, defaultDuration, durationOptions,
//       paymentMode, timeFormat, icon, image, cities,
//       isActive, slotConfig
//     } = req.body;

//     if (cities) {
//       try {
//         await validateCities(cities);
//         service.cities = cities;
//       } catch (error) {
//         return res.status(400).json({ success: false, message: error.message });
//       }
//     }
//     if (name) service.name = name;
//     if (description) service.description = description;
//     if (basePrice !== undefined) service.basePrice = basePrice;
//     if (equipmentCharges !== undefined) service.equipmentCharges = equipmentCharges;
//     if (taxPercentage !== undefined) service.taxPercentage = taxPercentage;
//     if (modes) service.modes = modes;
//     if (defaultDuration !== undefined) service.defaultDuration = defaultDuration;
//     if (durationOptions) service.durationOptions = durationOptions;
//     if (paymentMode) service.paymentMode = paymentMode;
//     if (timeFormat) service.timeFormat = timeFormat;
//     if (icon !== undefined) service.icon = icon;
//     if (image !== undefined) service.image = image;
//     if (isActive !== undefined) service.isActive = isActive;
//     if (slotConfig) service.slotConfig = { ...service.slotConfig, ...slotConfig };

//     await service.save();
//     await service.populate('cities', 'name latitude longitude');

//     res.status(200).json({ success: true, message: 'Service updated successfully', data: service });
//   } catch (error) {
//     console.error('Update service error:', error);
//     res.status(500).json({ success: false, message: 'Error updating service', error: error.message });
//   }
// };



// exports.updateService = async (req, res) => {
//   try {
//     // The protect middleware will already have set req.user if the user is authenticated and authorized
//     const { id } = req.params;
//     if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
//       return res.status(403).json({ success: false, message: 'Access denied.' });
//     }

//     const service = await Service.findById(id);
//     if (!service) {
//       return res.status(404).json({ success: false, message: 'Service not found' });
//     }

//     // extract and update fields as before...
//     const {
//       name, description, basePrice, equipmentCharges,
//       taxPercentage, modes, defaultDuration, durationOptions,
//       paymentMode, timeFormat, icon, image, cities,
//       isActive, slotConfig
//     } = req.body;

//     // ... rest of your update code remains unchanged ...

//     if (cities) {
//       try {
//         await validateCities(cities);
//         service.cities = cities;
//       } catch (error) {
//         return res.status(400).json({ success: false, message: error.message });
//       }
//     }
//     if (name) service.name = name;
//     if (description) service.description = description;
//     if (basePrice !== undefined) service.basePrice = basePrice;
//     if (equipmentCharges !== undefined) service.equipmentCharges = equipmentCharges;
//     if (taxPercentage !== undefined) service.taxPercentage = taxPercentage;
//     if (modes) service.modes = modes;
//     if (defaultDuration !== undefined) service.defaultDuration = defaultDuration;
//     if (durationOptions) service.durationOptions = durationOptions;
//     if (paymentMode) service.paymentMode = paymentMode;
//     if (timeFormat) service.timeFormat = timeFormat;
//     if (icon !== undefined) service.icon = icon;
//     if (image !== undefined) service.image = image;
//     if (isActive !== undefined) service.isActive = isActive;
//     if (slotConfig) service.slotConfig = { ...service.slotConfig, ...slotConfig };

//     await service.save();
//     await service.populate('cities', 'name latitude longitude');

//     res.status(200).json({
//       success: true,
//       message: 'Service updated successfully',
//       data: service,
//     });
//   } catch (error) {
//     console.error('Update service error:', error);
//     res.status(500).json({ success: false, message: 'Error updating service', error: error.message });
//   }
// };

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user || !["admin", "superadmin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied." });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    // Parse body (multipart sends fields as strings; parse JSON/numbers where needed)
    const parseJson = (val, fallback) => {
      if (val == null) return fallback;
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
    const normalizeStringArray = (val) => {
      const parsed = parseJson(val, []);
      const values = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "string"
          ? parsed.split(",")
          : [];
      return [
        ...new Set(
          values
            .map((item) => String(item || "").trim())
            .filter(Boolean),
        ),
      ];
    };
    const raw = req.body;

    let name = raw.name;
    let description = raw.description;
    let basePrice = raw.basePrice != null ? Number(raw.basePrice) : undefined;
    let equipmentCharges =
      raw.equipmentCharges != null ? Number(raw.equipmentCharges) : undefined;
    let taxPercentage =
      raw.taxPercentage != null ? Number(raw.taxPercentage) : undefined;
    let modes = parseJson(raw.modes, undefined);
    let defaultDuration =
      raw.defaultDuration != null ? Number(raw.defaultDuration) : undefined;
    let durationOptions = parseJson(raw.durationOptions, undefined);
    let paymentMode = raw.paymentMode;
    let timeFormat = raw.timeFormat;
    let icon = raw.icon;
    let image = raw.image;
    let cities = parseJson(raw.cities, undefined);
    let isActive =
      raw.isActive === "true"
        ? true
        : raw.isActive === "false"
          ? false
          : raw.isActive;
    let slotConfig = parseJson(raw.slotConfig, undefined);
    let recommendedSpecializations =
      raw.recommendedSpecializations !== undefined
        ? normalizeStringArray(raw.recommendedSpecializations)
        : undefined;
    let recommendedSubSpecialties =
      raw.recommendedSubSpecialties !== undefined
        ? normalizeStringArray(raw.recommendedSubSpecialties)
        : undefined;

    // Image/icon: upload to GCP if files present
    if (req.files?.image?.[0]) {
      try {
        image = await uploadFile(req.files.image[0]);
      } catch (err) {
        console.error("Service image upload error:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Failed to upload service image.",
            error: err.message,
          });
      }
    }
    if (req.files?.icon?.[0]) {
      try {
        icon = await uploadFile(req.files.icon[0]);
      } catch (err) {
        console.error("Service icon upload error:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Failed to upload service icon.",
            error: err.message,
          });
      }
    }

    const updatePayload = {};
    if (cities) {
      try {
        await validateCities(cities);
        updatePayload.cities = cities;
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
      }
    }
    if (name) updatePayload.name = name;
    if (description) updatePayload.description = description;
    if (basePrice !== undefined) updatePayload.basePrice = basePrice;
    if (equipmentCharges !== undefined)
      updatePayload.equipmentCharges = equipmentCharges;
    if (taxPercentage !== undefined) updatePayload.taxPercentage = taxPercentage;
    if (modes) updatePayload.modes = modes;
    if (defaultDuration !== undefined)
      updatePayload.defaultDuration = defaultDuration;
    if (durationOptions) updatePayload.durationOptions = durationOptions;
    if (paymentMode) updatePayload.paymentMode = paymentMode;
    if (timeFormat) updatePayload.timeFormat = timeFormat;
    if (icon !== undefined) updatePayload.icon = icon;
    if (image !== undefined) updatePayload.image = image;
    if (recommendedSpecializations !== undefined)
      updatePayload.recommendedSpecializations = recommendedSpecializations;
    if (recommendedSubSpecialties !== undefined)
      updatePayload.recommendedSubSpecialties = recommendedSubSpecialties;
    if (isActive !== undefined) updatePayload.isActive = isActive;
    if (slotConfig)
      updatePayload.slotConfig = { ...(service.slotConfig || {}), ...slotConfig };

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided to update",
      });
    }

    const updatedService = await Service.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).populate("cities", "name latitude longitude");

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    console.error("Update service error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error updating service",
        error: error.message,
      });
  }
};

// Delete Service (Soft Delete)
// exports.deleteService = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userRole = req.user.role;
//     if (!['admin', 'superadmin'].includes(userRole)) {
//       return res.status(403).json({ success: false, message: 'Only admins can delete services' });
//     }

//     const service = await Service.findById(id);
//     if (!service) {
//       return res.status(404).json({ success: false, message: 'Service not found' });
//     }

//     service.isDeleted = true;
//     service.deletedAt = new Date();
//     service.deletedBy = { userId: req.user.id, userModel: 'Admin' };
//     service.isActive = false;
//     await service.save();

//     res.status(200).json({ success: true, message: 'Service deleted successfully' });
//   } catch (error) {
//     console.error('Delete service error:', error);
//     res.status(500).json({ success: false, message: 'Error deleting service', error: error.message });
//   }
// };



exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // req.user set by protect middleware
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRole = req.user.role;
    if (!['admin', 'superadmin'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Only admins can delete services' });
    }

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid service id' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Soft delete using partial update to avoid legacy-document full validation failures
    await Service.updateOne(
      { _id: id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: { userId: req.user.id, userModel: 'Admin' },
          isActive: false,
        },
      }
    );

    return res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({ success: false, message: 'Error deleting service', error: error.message });
  }
};


// Restore Service
exports.restoreService = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    if (!['admin', 'superadmin'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Only admins can restore services' });
    }

    const service = await Service.findOne({ _id: id, isDeleted: true });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Deleted service not found' });
    }

    service.isDeleted = false;
    service.deletedAt = null;
    service.deletedBy = null;
    service.isActive = true;
    await service.save();

    res.status(200).json({ success: true, message: 'Service restored successfully', data: service });
  } catch (error) {
    console.error('Restore service error:', error);
    res.status(500).json({ success: false, message: 'Error restoring service', error: error.message });
  }
};
// exports.deleteService = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!req.user) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }
//     const userRole = req.user.role;
//     if (!['admin', 'superadmin'].includes(userRole)) {
//       return res.status(403).json({ success: false, message: 'Only admins can delete services' });
//     }

//     // Optional: Validate id format (if using MongoDB ObjectId)
//     if (!id.match(/^[0-9a-fA-F]{24}$/)) {
//       return res.status(400).json({ success: false, message: 'Invalid service id' });
//     }

//     const service = await Service.findById(id);
//     if (!service) {
//       return res.status(404).json({ success: false, message: 'Service not found' });
//     }

//     // Soft delete the service
//     service.isDeleted = true;
//     service.deletedAt = new Date();
//     service.deletedBy = { userId: req.user.id, userModel: 'Admin' };
//     service.isActive = false;
//     await service.save();

//     res.status(200).json({ success: true, message: 'Service deleted successfully' });
//   } catch (error) {
//     console.error('Delete service error:', error);
//     res.status(500).json({ success: false, message: 'Error deleting service', error: error.message });
//   }
// };
// Toggle Service Status
exports.toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    if (!['admin', 'superadmin'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Only admins can toggle service status' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { id: service._id, name: service.name, isActive: service.isActive }
    });
  } catch (error) {
    console.error('Toggle service status error:', error);
    res.status(500).json({ success: false, message: 'Error toggling service status', error: error.message });
  }
};

// Search Services
exports.searchServices = async (req, res) => {
  try {
    const { query: search, category, cityId, minPrice, maxPrice, timeFormat = '24-hour' } = req.query;
    const searchQuery = { isActive: true, isDeleted: false };

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) searchQuery.category = category;
    if (cityId) searchQuery.cities = cityId;
    if (minPrice || maxPrice) {
      searchQuery.basePrice = {};
      if (minPrice) searchQuery.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.basePrice.$lte = parseFloat(maxPrice);
    }

    const services = await Service.find(searchQuery)
      .populate('cities', 'name latitude longitude')
      .sort({ basePrice: 1 });

    const formattedServices = services.map(service => ({
      ...service.toObject(),
      formattedDuration: formatDuration(service.defaultDuration),
      displayTimeFormat: timeFormat
    }));

    res.status(200).json({ success: true, count: services.length, data: formattedServices });
  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({ success: false, message: 'Error searching services', error: error.message });
  }
};

// Get Services by Category
exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const services = await Service.find({ category, isDeleted: false, isActive: true })
      .populate('cities', 'name latitude longitude')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({ success: false, message: 'Error fetching services by category', error: error.message });
  }
};

// Get Nursing Services by Type
exports.getNursingServicesByType = async (req, res) => {
  try {
    const { nursingType } = req.params;
    const { cityId, isActive = true, timeFormat = '24-hour' } = req.query;

    const validNursingTypes = ['hourly', 'full-day', 'full-night', '12-hour', '24-hour'];
    if (!validNursingTypes.includes(nursingType)) {
      return res.status(400).json({ success: false, message: 'Invalid nursingType parameter' });
    }

    let query = {

      category: 'nursing',
      nursingType,
      isActive,
      isDeleted: false,
    };
    if (cityId) query.cities = cityId;

    const services = await Service.find(query)
      .populate('cities', 'name latitude longitude')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      nursingType,
      count: services.length,
      data: services,
      displayTimeFormat: timeFormat
    });
  } catch (error) {
    console.error('Error fetching nursing services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch nursing services', error: error.message });
  }
};

// Get Services by City
// exports.getServicesByCity = async (req, res) => {
//   try {
//     const { cityId } = req.params;
//     const { category, timeFormat = '24-hour' } = req.query;
//     const query = {
//       cities: cityId,
//       isActive: true,
//       isDeleted: false
//     };
//     if (category) query.category = category;
//     const services = await Service.find(query)
//       .populate('cities', 'name latitude longitude')
//       .sort({ category: 1, basePrice: 1 });
//     const city = await City.findById(cityId);

//     const formattedServices = services.map(service => ({
//       ...service.toObject(),
//       formattedDuration: formatDuration(service.defaultDuration),
//       displayTimeFormat: timeFormat
//     }));

//     res.status(200).json({
//       success: true,
//       city: city ? city.name : 'Unknown',
//       count: services.length,
//       data: formattedServices
//     });
//   } catch (error) {
//     console.error('Get services by city error:', error);
//     res.status(500).json({ success: false, message: 'Error fetching services by city', error: error.message });
//   }
// };
exports.getServicesByCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { category, timeFormat = '24-hour' } = req.query;

    const query = {
      cities: cityId,
      isActive: true,
      isDeleted: false
    };

    if (category) {
      query.category = category;
    }

    const services = await Service.find(query)
      .populate('cities', 'name latitude longitude')
      .sort({ category: 1, basePrice: 1 });

    const city = await City.findById(cityId);

    const formattedServices = services.map(service => {
      return {
        ...service.toObject(),
        slotConfig: autoFilterSlots(service.slotConfig, service.category, timeFormat),
        formattedDuration: formatDuration(service.defaultDuration),
        displayTimeFormat: timeFormat
      };
    });

    res.status(200).json({
      success: true,
      city: city ? city.name : 'Unknown',
      count: services.length,
      data: formattedServices
    });
  } catch (error) {
    console.error('Get services by city error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services by city',
      error: error.message
    });
  }
};
// Calculate Service Price
exports.calculateServicePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, includeEquipment } = req.query;
    const service = await Service.findById(id);

    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found or inactive' });
    }

    // Assuming calculateTotalPrice is a method in serviceModel which you have defined
    const price = service.calculateTotalPrice(
      duration ? parseInt(duration) : null,
      includeEquipment === 'true',
      null
    );

    res.status(200).json({
      success: true,
      serviceId: service._id,
      serviceName: service.name,
      category: service.category,
      duration: duration ? formatDuration(parseInt(duration)) : formatDuration(service.defaultDuration),
      pricing: price
    });
  } catch (error) {
    console.error('Calculate service price error:', error);
    res.status(500).json({ success: false, message: 'Error calculating service price', error: error.message });
  }
};

// Get Available Slots for Service
exports.getAvailableSlots = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { date, partnerId, timeFormat = '24-hour' } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const service = await Service.findById(serviceId);

    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found or inactive' });
    }

    // Assuming Service.getAvailableSlots is a static method you have defined to return slots
    const slots = await Service.getAvailableSlots(serviceId, new Date(date), partnerId);

    res.status(200).json({
      success: true,
      serviceId,
      serviceName: service.name,
      serviceCategory: service.category,
      date: new Date(date).toDateString(),
      timeFormat,
      data: slots
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ success: false, message: 'Error fetching available slots', error: error.message });
  }
};

// Get Service Statistics (Admin)
exports.getServiceStatistics = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!['admin', 'superadmin'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Only admins can view service statistics' });
    }

    const stats = await Service.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          avgPrice: { $avg: '$basePrice' }
        }
      }
    ]);

    const totalServices = await Service.countDocuments({ isDeleted: false });
    const activeServices = await Service.countDocuments({ isActive: true, isDeleted: false });
    const inactiveServices = await Service.countDocuments({ isActive: false, isDeleted: false });

    res.status(200).json({
      success: true,
      data: {
        byCategory: stats,
        totalServices,
        activeServices,
        inactiveServices
      }
    });
  } catch (error) {
    console.error('Get service statistics error:', error);
    res.status(500).json({ success: false, message: 'Error fetching service statistics', error: error.message });
  }
};

// Bulk Update Services
exports.bulkUpdateServices = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (!['admin', 'superadmin'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Only admins can perform bulk updates' });
    }

    const { serviceIds, updates } = req.body;
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Service IDs array is required' });
    }
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Updates object is required' });
    }

    const result = await Service.updateMany(
      { _id: { $in: serviceIds }, isDeleted: false },
      { $set: updates }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} services updated successfully`,
      data: { matched: result.matchedCount, modified: result.modifiedCount }
    });
  } catch (error) {
    console.error('Bulk update services error:', error);
    res.status(500).json({ success: false, message: 'Error performing bulk update', error: error.message });
  }
};

