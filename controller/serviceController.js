// // // controllers/serviceController.js
// // const Service = require('../models/serviceModel');
// // const Doctor = require('../models/doctorModel');

// // // Get All Available Services
// // exports.getAllServices = async (req, res) => {
// //   try {
// //     const services = await Service.find({ isActive: true })
// //       .select('name description basePrice equipmentCharges modes icon image');

// //     res.status(200).json({
// //       success: true,
// //       count: services.length,
// //       data: services
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching services',
// //       error: error.message
// //     });
// //   }
// // };

// // // Get Service Details
// // exports.getServiceDetails = async (req, res) => {
// //   try {
// //     const { serviceId } = req.params;

// //     const service = await Service.findById(serviceId);

// //     if (!service) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Service not found'
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       data: service
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching service details',
// //       error: error.message
// //     });
// //   }
// // };

// // // Get Verified Providers by Service
// // exports.getProvidersByService = async (req, res) => {
// //   try {
// //     const { serviceType } = req.params;
// //     const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance in meters

// //     const query = {
// //       verificationStatus: 'approved',
// //       isActive: true,
// //       'availability.serviceAvailability.serviceType': serviceType
// //     };

// //     let doctors;

// //     // Location-based filtering if coordinates provided
// //     if (latitude && longitude) {
// //       doctors = await Doctor.aggregate([
// //         {
// //           $geoNear: {
// //             near: {
// //               type: 'Point',
// //               coordinates: [parseFloat(longitude), parseFloat(latitude)]
// //             },
// //             distanceField: 'distance',
// //             maxDistance: parseInt(maxDistance),
// //             spherical: true,
// //             query: {
// //               verificationStatus: 'approved',
// //               isActive: true
// //             }
// //           }
// //         },
// //         {
// //           $match: {
// //             'availability.serviceAvailability.serviceType': serviceType
// //           }
// //         },
// //         {
// //           $project: {
// //             firstName: 1,
// //             profilePhoto: 1,
// //             specialization: 1,
// //             yearsOfExperience: 1,
// //             averageRating: 1,
// //             totalReviews: 1,
// //             consultationFees: 1,
// //             'availability.serviceAvailability': 1,
// //             distance: 1
// //           }
// //         },
// //         {
// //           $sort: { averageRating: -1, distance: 1 }
// //         }
// //       ]);
// //     } else {
// //       doctors = await Doctor.find(query)
// //         .select('firstName profilePhoto specialization yearsOfExperience averageRating totalReviews consultationFees availability.serviceAvailability')
// //         .sort({ averageRating: -1 });
// //     }

// //     // Filter service availability for requested service type
// //     const providers = doctors.map(doctor => {
// //       const serviceAvailability = doctor.availability?.serviceAvailability?.find(
// //         sa => sa.serviceType === serviceType
// //       );

// //       return {
// //         _id: doctor._id,
// //         name: doctor.firstName,
// //         photo: doctor.profilePhoto,
// //         specialization: doctor.specialization,
// //         experience: doctor.yearsOfExperience,
// //         rating: doctor.averageRating,
// //         reviewCount: doctor.totalReviews,
// //         pricing: serviceAvailability?.pricing || { basePrice: doctor.consultationFees },
// //         distance: doctor.distance ? (doctor.distance / 1000).toFixed(2) : null // Convert to km
// //       };
// //     });

// //     res.status(200).json({
// //       success: true,
// //       count: providers.length,
// //       data: providers
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching providers',
// //       error: error.message
// //     });
// //   }
// // };

// // // Get Provider Full Profile
// // exports.getProviderProfile = async (req, res) => {
// //   try {
// //     const { doctorId } = req.params;

// //     const doctor = await Doctor.findById(doctorId)
// //       .select('-password -refreshToken -tokenVersion -verificationDocuments');

// //     if (!doctor) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Provider not found'
// //       });
// //     }

// //     // Get ratings and reviews from bookings
// //     const bookings = await Booking.find({
// //       doctorId,
// //       'feedback.rating': { $exists: true }
// //     })
// //       .populate('patientId', 'name profilePhoto')
// //       .select('feedback createdAt')
// //       .sort({ 'feedback.submittedAt': -1 })
// //       .limit(10);

// //     const reviews = bookings.map(b => ({
// //       patientName: b.patientId.name,
// //       patientPhoto: b.patientId.profilePhoto,
// //       rating: b.feedback.rating,
// //       review: b.feedback.review,
// //       date: b.feedback.submittedAt
// //     }));

// //     res.status(200).json({
// //       success: true,
// //       data: {
// //         ...doctor.toObject(),
// //         reviews
// //       }
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching provider profile',
// //       error: error.message
// //     });
// //   }
// // };

// // module.exports = exports;

// // // controllers/serviceController.js
// // const Service = require('../models/serviceModel');
// // const Doctor = require('../models/doctorModel');
// // const Booking = require('../models/bookingModel'); // IMPORTANT: Add this

// // // ==================== PUBLIC CONTROLLERS ====================

// // // Get All Available Services
// // exports.getAllServices = async (req, res) => {
// //   try {
// //     const services = await Service.find({ isActive: true })
// //       .select('name description basePrice equipmentCharges modes icon image');

// //     res.status(200).json({
// //       success: true,
// //       count: services.length,
// //       data: services
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching services',
// //       error: error.message
// //     });
// //   }
// // };

// // // Get Service Details
// // exports.getServiceDetails = async (req, res) => {
// //   try {
// //     const { serviceId } = req.params;

// //     const service = await Service.findById(serviceId);

// //     if (!service) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Service not found'
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       data: service
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching service details',
// //       error: error.message
// //     });
// //   }
// // };

// // // Get Verified Providers by Service
// // exports.getProvidersByService = async (req, res) => {
// //   try {
// //     const { serviceType } = req.params;
// //     const { latitude, longitude, maxDistance = 10000 } = req.query;

// //     const query = {
// //       verificationStatus: 'approved',
// //       isActive: true,
// //       'availability.serviceAvailability.serviceType': serviceType
// //     };

// //     let doctors;

// //     if (latitude && longitude) {
// //       doctors = await Doctor.aggregate([
// //         {
// //           $geoNear: {
// //             near: {
// //               type: 'Point',
// //               coordinates: [parseFloat(longitude), parseFloat(latitude)]
// //             },
// //             distanceField: 'distance',
// //             maxDistance: parseInt(maxDistance),
// //             spherical: true,
// //             query: {
// //               verificationStatus: 'approved',
// //               isActive: true
// //             }
// //           }
// //         },
// //         {
// //           $match: {
// //             'availability.serviceAvailability.serviceType': serviceType
// //           }
// //         },
// //         {
// //           $project: {
// //             firstName: 1,
// //             profilePhoto: 1,
// //             specialization: 1,
// //             yearsOfExperience: 1,
// //             averageRating: 1,
// //             totalReviews: 1,
// //             consultationFees: 1,
// //             'availability.serviceAvailability': 1,
// //             distance: 1
// //           }
// //         },
// //         {
// //           $sort: { averageRating: -1, distance: 1 }
// //         }
// //       ]);
// //     } else {
// //       doctors = await Doctor.find(query)
// //         .select('firstName profilePhoto specialization yearsOfExperience averageRating totalReviews consultationFees availability.serviceAvailability')
// //         .sort({ averageRating: -1 });
// //     }

// //     const providers = doctors.map(doctor => {
// //       const serviceAvailability = doctor.availability?.serviceAvailability?.find(
// //         sa => sa.serviceType === serviceType
// //       );

// //       return {
// //         _id: doctor._id,
// //         name: doctor.firstName,
// //         photo: doctor.profilePhoto,
// //         specialization: doctor.specialization,
// //         experience: doctor.yearsOfExperience,
// //         rating: doctor.averageRating,
// //         reviewCount: doctor.totalReviews,
// //         pricing: serviceAvailability?.pricing || { basePrice: doctor.consultationFees },
// //         distance: doctor.distance ? (doctor.distance / 1000).toFixed(2) : null
// //       };
// //     });

// //     res.status(200).json({
// //       success: true,
// //       count: providers.length,
// //       data: providers
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching providers',
// //       error: error.message
// //     });
// //   }
// // };

// // // Get Provider Full Profile
// // exports.getProviderProfile = async (req, res) => {
// //   try {
// //     const { doctorId } = req.params;

// //     const doctor = await Doctor.findById(doctorId)
// //       .select('-password -refreshToken -tokenVersion -verificationDocuments');

// //     if (!doctor) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Provider not found'
// //       });
// //     }

// //     // Get ratings and reviews from bookings
// //     const bookings = await Booking.find({
// //       doctorId,
// //       'feedback.rating': { $exists: true }
// //     })
// //       .populate('patientId', 'name profilePhoto')
// //       .select('feedback createdAt')
// //       .sort({ 'feedback.submittedAt': -1 })
// //       .limit(10);

// //     const reviews = bookings.map(b => ({
// //       patientName: b.patientId?.name || 'Anonymous',
// //       patientPhoto: b.patientId?.profilePhoto || null,
// //       rating: b.feedback.rating,
// //       review: b.feedback.review,
// //       date: b.feedback.submittedAt
// //     }));

// //     res.status(200).json({
// //       success: true,
// //       data: {
// //         ...doctor.toObject(),
// //         reviews
// //       }
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching provider profile',
// //       error: error.message
// //     });
// //   }
// // };

// // // ==================== ADMIN CONTROLLERS ====================

// // // Create Service (Admin)
// // exports.createService = async (req, res) => {
// //   try {
// //     const {
// //       name,
// //       description,
// //       basePrice,
// //       equipmentCharges,
// //       taxPercentage,
// //       modes,
// //       supportsDuration,
// //       defaultDuration,
// //       durationOptions,
// //       paymentMode,
// //       icon,
// //       image
// //     } = req.body;

// //     // Check if service already exists
// //     const existingService = await Service.findOne({ name });
// //     if (existingService) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Service with this name already exists'
// //       });
// //     }

// //     const service = new Service({
// //       name,
// //       description,
// //       basePrice,
// //       equipmentCharges,
// //       taxPercentage: taxPercentage || 18,
// //       modes,
// //       supportsDuration,
// //       defaultDuration: defaultDuration || 30,
// //       durationOptions,
// //       paymentMode,
// //       icon,
// //       image
// //     });

// //     await service.save();

// //     res.status(201).json({
// //       success: true,
// //       message: 'Service created successfully',
// //       data: service
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error creating service',
// //       error: error.message
// //     });
// //   }
// // };

// // // Update Service (Admin)
// // exports.updateService = async (req, res) => {
// //   try {
// //     const { serviceId } = req.params;
// //     const updateData = req.body;

// //     const service = await Service.findByIdAndUpdate(
// //       serviceId,
// //       updateData,
// //       { new: true, runValidators: true }
// //     );

// //     if (!service) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Service not found'
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       message: 'Service updated successfully',
// //       data: service
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error updating service',
// //       error: error.message
// //     });
// //   }
// // };

// // // Delete/Deactivate Service (Admin)
// // exports.deleteService = async (req, res) => {
// //   try {
// //     const { serviceId } = req.params;

// //     const service = await Service.findByIdAndUpdate(
// //       serviceId,
// //       { isActive: false },
// //       { new: true }
// //     );

// //     if (!service) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Service not found'
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       message: 'Service deactivated successfully',
// //       data: service
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error deactivating service',
// //       error: error.message
// //     });
// //   }
// // };

// // module.exports = exports;
// //original before
// const Service = require("../models/serviceModel");
// const City = require("../models/availableCities");
// const mongoose = require("mongoose");

// const Admin = require("../models/adminModel");
// const Doctor = require("../models/doctorModel");

// // Get All Services with City Names
// // Get all services with filters, sorting, and pagination
// exports.getAllServices = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       cityId,
//       isActive,
//       sortBy = "createdAt",
//       order = "desc",
//       search,
//     } = req.query;

//     // Build query object
//     const query = {};

//     // Filter by active status
//     if (isActive !== undefined) {
//       query.isActive = isActive === "true";
//     }

//     // Filter by city
//     if (cityId) {
//       query.cities = cityId;
//     }

//     // Search by name or description
//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // Calculate pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Build sort object
//     const sortOrder = order === "asc" ? 1 : -1;
//     const sortObj = { [sortBy]: sortOrder };

//     // Fetch services with pagination
//     const services = await Service.find(query)
//       .populate("cities", "name latitude longitude")
//       .populate("createdBy.userId", "name email")
//       .sort(sortObj)
//       .skip(skip)
//       .limit(parseInt(limit));

//     // Get total count for pagination
//     const totalServices = await Service.countDocuments(query);
//     const totalPages = Math.ceil(totalServices / parseInt(limit));

//     res.status(200).json({
//       success: true,
//       count: services.length,
//       totalServices,
//       totalPages,
//       currentPage: parseInt(page),
//       data: services,
//     });
//   } catch (error) {
//     console.error("Error in getAllServices:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching services",
//       error: error.message,
//     });
//   }
// };

// // Create Service (Admin or Doctor)
// // exports.createService = async (req, res) => {
// //   try {
// //     const {
// //       name,
// //       description,
// //       basePrice,
// //       equipmentCharges,
// //       taxPercentage,
// //       modes,
// //       supportsDuration,
// //       defaultDuration,
// //       durationOptions,
// //       paymentMode,
// //       icon,
// //       image,
// //       cities // Array of city IDs
// //     } = req.body;

// //     // Validate cities
// //     if (!cities || !Array.isArray(cities) || cities.length === 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'At least one city must be specified'
// //       });
// //     }

// //     // Verify all city IDs exist
// //     const validCities = await City.find({ _id: { $in: cities } });
// //     if (validCities.length !== cities.length) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'One or more invalid city IDs provided'
// //       });
// //     }

// //     // Check if service already exists
// //     const existingService = await Service.findOne({ name });
// //     if (existingService) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Service with this name already exists'
// //       });
// //     }

// //     // Get creator details from authenticated user
// //     const creatorModel = req.user.role === 'admin' ? 'Admin' : 'Doctor';
// //     const Creator = mongoose.model(creatorModel);
// //     const creatorDetails = await Creator.findById(req.user.id).select('name email');

// //     if (!creatorDetails) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Creator not found'
// //       });
// //     }

// //     // Create service
// //     const service = new Service({
// //       name,
// //       description,
// //       basePrice,
// //       equipmentCharges,
// //       taxPercentage: taxPercentage || 18,
// //       modes,
// //       supportsDuration,
// //       defaultDuration: defaultDuration || 30,
// //       durationOptions,
// //       paymentMode,
// //       icon,
// //       image,
// //       cities,
// //       createdBy: {
// //         userId: req.user.id,
// //         userModel: creatorModel,
// //         name: creatorDetails.name,
// //         email: creatorDetails.email
// //       }
// //     });

// //     await service.save();

// //     // Add service to creator's services array
// //     await Creator.findByIdAndUpdate(
// //       req.user.id,
// //       { $addToSet: { services: service._id } },
// //       { new: true }
// //     );

// //     // Populate before sending response
// //     await service.populate('cities', 'name latitude longitude');

// //     res.status(201).json({
// //       success: true,
// //       message: 'Service created successfully',
// //       data: service
// //     });
// //   } catch (error) {
// //     console.error('Error in createService:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error creating service',
// //       error: error.message
// //     });
// //   }
// // };

// //with check service
// // exports.createService = async (req, res) => {
// //   try {
// //     const {
// //       name,
// //       description,
// //       basePrice,
// //       equipmentCharges,
// //       taxPercentage,
// //       modes,
// //       supportsDuration,
// //       defaultDuration,
// //       durationOptions,
// //       paymentMode,
// //       icon,
// //       image,
// //       cities
// //     } = req.body;

// //     // Validate cities
// //     if (!cities || !Array.isArray(cities) || cities.length === 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'At least one city must be specified'
// //       });
// //     }

// //     // Verify all city IDs exist
// //     const validCities = await City.find({ _id: { $in: cities } });
// //     if (validCities.length !== cities.length) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'One or more invalid city IDs provided'
// //       });
// //     }

// //     // Check if service already exists
// //     const existingService = await Service.findOne({ name });
// //     if (existingService) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Service with this name already exists'
// //       });
// //     }

// //     // Determine creator model - handle admin, superAdmin, and doctor
// //     const userRole = req.user.role.toLowerCase();
// //     const isAdmin = userRole === 'admin' || userRole === 'superAdmin';
// //     const creatorModel = isAdmin ? 'Admin' : 'Doctor';

// //     const Creator = mongoose.model(creatorModel);
// //     const creatorDetails = await Creator.findById(req.user.id).select('firstName lastName name email');

// //     if (!creatorDetails) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Creator not found'
// //       });
// //     }

// //     // Build creator name (handle different name formats)
// //     let creatorName;
// //     if (creatorDetails.firstName && creatorDetails.lastName) {
// //       creatorName = `${creatorDetails.firstName} ${creatorDetails.lastName}`;
// //     } else if (creatorDetails.firstName) {
// //       creatorName = creatorDetails.firstName;
// //     } else if (creatorDetails.name) {
// //       creatorName = creatorDetails.name;
// //     } else {
// //       creatorName = 'Unknown';
// //     }

// //     // Create service
// //     const service = new Service({
// //       name,
// //       description,
// //       basePrice,
// //       equipmentCharges,
// //       taxPercentage: taxPercentage || 18,
// //       modes,
// //       supportsDuration,
// //       defaultDuration: defaultDuration || 30,
// //       durationOptions,
// //       paymentMode,
// //       icon,
// //       image,
// //       cities,
// //       createdBy: {
// //         userId: req.user.id,
// //         userModel: creatorModel,
// //         name: creatorName,
// //         email: creatorDetails.email
// //       }
// //     });

// //     await service.save();

// //     // Add service to creator's services array
// //     await Creator.findByIdAndUpdate(
// //       req.user.id,
// //       { $addToSet: { services: service._id } },
// //       { new: true }
// //     );

// //     // Populate before sending response
// //     await service.populate('cities', 'name latitude longitude');

// //     res.status(201).json({
// //       success: true,
// //       message: 'Service created successfully',
// //       data: service
// //     });
// //   } catch (error) {
// //     console.error('Error in createService:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error creating service',
// //       error: error.message
// //     });
// //   }
// // };

// // Create Service (superAdmin or Admin only)
// exports.createService = async (req, res) => {
//   try {
//     const userRole = req.user.role; // already normalized as 'admin' or other roles

//     if (userRole !== "admin") {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Only admin users can create services.",
//       });
//     }

//     const {
//       name,
//       description,
//       basePrice,
//       equipmentCharges,
//       taxPercentage,
//       modes,
//       supportsDuration,
//       defaultDuration,
//       durationOptions,
//       paymentMode,
//       icon,
//       image,
//       cities,
//     } = req.body;

//     if (!cities || !Array.isArray(cities) || cities.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one city must be specified",
//       });
//     }

//     const validCities = await City.find({ _id: { $in: cities } });
//     if (validCities.length !== cities.length) {
//       return res.status(400).json({
//         success: false,
//         message: "One or more invalid city IDs provided",
//       });
//     }

//     const existingService = await Service.findOne({ name });
//     if (existingService) {
//       return res.status(400).json({
//         success: false,
//         message: "Service with this name already exists",
//       });
//     }

//     // Creator is always Admin model
//     const creatorModel = "Admin";
//     const Creator = mongoose.model(creatorModel);
//     const creatorDetails = await Creator.findById(req.user.id).select(
//       "firstName email"
//     );
//     console.log("creatorDetails", creatorDetails);

//     if (!creatorDetails) {
//       return res.status(404).json({
//         success: false,
//         message: "Creator not found",
//       });
//     }

//     const service = new Service({
//       name,
//       description,
//       basePrice,
//       equipmentCharges,
//       taxPercentage: taxPercentage || 18,
//       modes,
//       supportsDuration,
//       defaultDuration: defaultDuration || 30,
//       durationOptions,
//       paymentMode,
//       icon,
//       image,
//       cities,
//       createdBy: {
//         userId: req.user.id,
//         userModel: creatorModel,
//         name: creatorDetails?.firstName,
//         email: creatorDetails?.email,
//         role: req.user.role,
//       },
//     });

//     await service.save();

//     await Creator.findByIdAndUpdate(
//       req.user.id,
//       { $addToSet: { services: service._id } },
//       { new: true }
//     );

//     await service.populate("cities", "name latitude longitude");

//     res.status(201).json({
//       success: true,
//       message: "Service created successfully",
//       data: service,
//     });
//   } catch (error) {
//     console.error("Error in createService:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error creating service",
//       error: error.message,
//     });
//   }
// };

// //both admin and doctor can create same service name
// // exports.createService = async (req, res) => {
// //   try {
// //     const {
// //       name,
// //       description,
// //       basePrice,
// //       equipmentCharges,
// //       taxPercentage,
// //       modes,
// //       supportsDuration,
// //       defaultDuration,
// //       durationOptions,
// //       paymentMode,
// //       icon,
// //       image,
// //       cities
// //     } = req.body;

// //     // Validate cities
// //     if (!cities || !Array.isArray(cities) || cities.length === 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'At least one city must be specified'
// //       });
// //     }

// //     // Verify all city IDs exist
// //     const validCities = await City.find({ _id: { $in: cities } });
// //     if (validCities.length !== cities.length) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'One or more invalid city IDs provided'
// //       });
// //     }

// //     // REMOVED: Duplicate service name check
// //     // This allows multiple doctors to create services with the same name

// //     // Determine creator model - handle admin, superAdmin, and doctor
// //     const userRole = req.user.role.toLowerCase();
// //     const isAdmin = userRole === 'admin' || userRole === 'superAdmin';
// //     const creatorModel = isAdmin ? 'Admin' : 'Doctor';

// //     const Creator = mongoose.model(creatorModel);
// //     const creatorDetails = await Creator.findById(req.user.id).select('firstName lastName name email');

// //     if (!creatorDetails) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Creator not found'
// //       });
// //     }

// //     // Build creator name (handle different name formats)
// //     let creatorName;
// //     if (creatorDetails.firstName && creatorDetails.lastName) {
// //       creatorName = `${creatorDetails.firstName} ${creatorDetails.lastName}`;
// //     } else if (creatorDetails.firstName) {
// //       creatorName = creatorDetails.firstName;
// //     } else if (creatorDetails.name) {
// //       creatorName = creatorDetails.name;
// //     } else {
// //       creatorName = 'Unknown';
// //     }

// //     // Create service
// //     const service = new Service({
// //       name,
// //       description,
// //       basePrice,
// //       equipmentCharges,
// //       taxPercentage: taxPercentage || 18,
// //       modes,
// //       supportsDuration,
// //       defaultDuration: defaultDuration || 30,
// //       durationOptions,
// //       paymentMode,
// //       icon,
// //       image,
// //       cities,
// //       createdBy: {
// //         userId: req.user.id,
// //         userModel: creatorModel,
// //         name: creatorName,
// //         email: creatorDetails.email
// //       }
// //     });

// //     await service.save();

// //     // Add service to creator's services array
// //     await Creator.findByIdAndUpdate(
// //       req.user.id,
// //       { $addToSet: { services: service._id } },
// //       { new: true }
// //     );

// //     // Populate before sending response
// //     await service.populate('cities', 'name latitude longitude');

// //     res.status(201).json({
// //       success: true,
// //       message: 'Service created successfully',
// //       data: service
// //     });
// //   } catch (error) {
// //     console.error('Error in createService:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error creating service',
// //       error: error.message
// //     });
// //   }
// // };

// // Get Services by City
// exports.getServicesByCity = async (req, res) => {
//   try {
//     const { cityId } = req.params;

//     if (!cityId) {
//       return res.status(400).json({
//         success: false,
//         message: "City ID is required",
//       });
//     }

//     // Verify city exists
//     const city = await City.findById(cityId);
//     if (!city) {
//       return res.status(404).json({
//         success: false,
//         message: "City not found",
//       });
//     }

//     const services = await Service.find({
//       isActive: true,
//       cities: cityId,
//     })
//       .select(
//         "name description basePrice equipmentCharges modes icon image isActive"
//       )
//       .populate("cities", "name latitude longitude")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       city: city.name,
//       count: services.length,
//       data: services,
//     });
//   } catch (error) {
//     console.error("Error in getServicesByCity:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching services",
//       error: error.message,
//     });
//   }
// };

// // Update Service
// exports.updateService = async (req, res) => {
//   try {
//     const { serviceId } = req.params;
//     const updateData = req.body;

//     if (!serviceId) {
//       return res.status(400).json({
//         success: false,
//         message: "Service ID is required",
//       });
//     }

//     // If cities are being updated, validate them
//     if (updateData.cities) {
//       if (!Array.isArray(updateData.cities) || updateData.cities.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Cities must be a non-empty array",
//         });
//       }

//       const validCities = await City.find({ _id: { $in: updateData.cities } });
//       if (validCities.length !== updateData.cities.length) {
//         return res.status(400).json({
//           success: false,
//           message: "One or more invalid city IDs provided",
//         });
//       }
//     }

//     const updatedService = await Service.findByIdAndUpdate(
//       serviceId,
//       updateData,
//       { new: true, runValidators: true }
//     )
//       .populate("cities", "name latitude longitude")
//       .populate("createdBy.userId", "name email");

//     if (!updatedService) {
//       return res.status(404).json({
//         success: false,
//         message: "Service not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Service updated successfully",
//       data: updatedService,
//     });
//   } catch (error) {
//     console.error("Error in updateService:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error updating service",
//       error: error.message,
//     });
//   }
// };

// // Get single service by ID
// exports.getServiceById = async (req, res) => {
//   try {
//     const { serviceId } = req.params;

//     if (!serviceId) {
//       return res.status(400).json({
//         success: false,
//         message: "Service ID is required",
//       });
//     }

//     const service = await Service.findById(serviceId)
//       .populate("cities", "name latitude longitude")
//       .populate("createdBy.userId", "name email");

//     if (!service) {
//       return res.status(404).json({
//         success: false,
//         message: "Service not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: service,
//     });
//   } catch (error) {
//     console.error("Error in getServiceById:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching service",
//       error: error.message,
//     });
//   }
// };
// // Get services by creator ID
// // exports.getServicesByCreator = async (req, res) => {
// //   try {
// //     const { creatorId } = req.params;
// //     const { role } = req.query; // 'admin' or 'doctor'

// //     if (!creatorId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Creator ID is required'
// //       });
// //     }

// //     if (!role || !['admin', 'doctor'].includes(role.toLowerCase())) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Valid role (admin or doctor) is required'
// //       });
// //     }

// //     const creatorModel = role.toLowerCase() === 'admin' ? 'Admin' : 'Doctor';

// //     const services = await Service.find({
// //       'createdBy.userId': creatorId,
// //       'createdBy.userModel': creatorModel
// //     })
// //       .populate('cities', 'name latitude longitude')
// //       .sort({ createdAt: -1 });

// //     res.status(200).json({
// //       success: true,
// //       count: services.length,
// //       data: services
// //     });
// //   } catch (error) {
// //     console.error('Error in getServicesByCreator:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching services',
// //       error: error.message
// //     });
// //   }
// // };

// exports.getServicesByCreator = async (req, res) => {
//   try {
//     const { creatorId } = req.params;
//     const { role } = req.query; // 'admin', 'superAdmin', or 'doctor'

//     if (!creatorId) {
//       return res.status(400).json({
//         success: false,
//         message: "Creator ID is required",
//       });
//     }

//     // Validate role - accept admin, superAdmin, and doctor
//     const validRoles = ["admin", "superAdmin", "doctor"];
//     if (!role || !validRoles.includes(role.toLowerCase())) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid role (admin, superAdmin, or doctor) is required",
//       });
//     }

//     // Map superAdmin to Admin model (both use Admin model)
//     const roleLower = role.toLowerCase();
//     const creatorModel =
//       roleLower === "admin" || roleLower === "superAdmin" ? "Admin" : "Doctor";

//     const services = await Service.find({
//       "createdBy.userId": creatorId,
//       "createdBy.userModel": creatorModel,
//     })
//       .populate("cities", "name latitude longitude")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: services.length,
//       data: services,
//     });
//   } catch (error) {
//     console.error("Error in getServicesByCreator:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching services",
//       error: error.message,
//     });
//   }
// };

// // Select/Assign Service to Doctor (Doctor only)
// exports.selectService = async (req, res) => {
//   try {
//     // Only doctors can use this endpoint
//     if (req.user.role !== "doctor") {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. This endpoint is for doctors only.",
//       });
//     }

//     const { serviceIds } = req.body; // Array of service IDs to select

//     // Validate input
//     if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one service ID must be provided",
//       });
//     }

//     // Verify all service IDs exist
//     const validServices = await Service.find({
//       _id: { $in: serviceIds },
//       isActive: true,
//     });

//     if (validServices.length !== serviceIds.length) {
//       return res.status(400).json({
//         success: false,
//         message: "One or more invalid or inactive service IDs provided",
//       });
//     }

//     // Update doctor's services
//     const doctor = await Doctor.findByIdAndUpdate(
//       req.user.id,
//       { $addToSet: { services: { $each: serviceIds } } },
//       { new: true }
//     ).populate("services", "name description basePrice modes");

//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: "Doctor not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Services selected successfully",
//       data: {
//         doctorId: doctor._id,
//         services: doctor.services,
//       },
//     });
//   } catch (error) {
//     console.error("Error in selectService:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error selecting services",
//       error: error.message,
//     });
//   }
// };

// exports.toggleServiceActive = async (req, res) => {
//   try {
//     const { serviceId } = req.params;

//     // Find service
//     const service = await Service.findById(serviceId);

//     if (!service) {
//       return res.status(404).json({
//         success: false,
//         message: "Service not found",
//       });
//     }

//     // Toggle active/inactive
//     service.isActive = !service.isActive;
//     await service.save();

//     return res.status(200).json({
//       success: true,
//       message: `Service is now ${service.isActive ? "Active" : "Inactive"}`,
//       service,
//     });
//   } catch (error) {
//     console.error("Error toggling service active:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // Get Available Services for Selection (All authenticated users)
// exports.getAvailableServices = async (req, res) => {
//   try {
//     const { cityId } = req.query;

//     const filter = { isActive: true };
//     if (cityId) {
//       filter.cities = cityId;
//     }

//     const services = await Service.find(filter)
//       .populate("cities", "name")
//       .select("name description basePrice modes supportsDuration icon image")
//       .sort({ name: 1 });

//     res.status(200).json({
//       success: true,
//       count: services.length,
//       data: services,
//     });
//   } catch (error) {
//     console.error("Error in getAvailableServices:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching services",
//       error: error.message,
//     });
//   }
// };

// // controllers/serviceController.js

// // Get list of Doctors/Medico providers by Service ID and optional City ID
// exports.getProvidersByService = async (req, res) => {
//   try {
//     const { serviceId } = req.params;
//     const { cityId } = req.query;

//     // Build query
//     const query = {
//       services: serviceId,
//     };
//     if (cityId) {
//       query.cities = cityId;
//     }

//     // Assume Medico and Doctor model both have 'services' and 'cities' fields
//     const doctors = await Doctor.find(query)
//       .select("name email phone services cities location")
//       .populate("services", "name")
//       .populate("cities", "name latitude longitude")
//       .lean();

//     const medicos = await Admin.find(query)
//       .select("name email phone services cities location")
//       .populate("services", "name")
//       .populate("cities", "name latitude longitude")
//       .lean();

//     // Combine doctors and medicos
//     const providers = [...doctors, ...medicos];

//     res.status(200).json({
//       success: true,
//       count: providers.length,
//       data: providers,
//     });
//   } catch (error) {
//     console.error("Error in getProvidersByService:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error getting providers by service",
//       error: error.message,
//     });
//   }
// };

// // controllers/serviceController.js

// // Get full service info by Service ID, including provider info
// exports.getFullServiceInfo = async (req, res) => {
//   try {
//     const { serviceId } = req.params;

//     // Find the service and populate creator info and cities
//     const service = await Service.findById(serviceId)
//       .populate({
//         path: "createdBy.userId",
//         select: "name email role cities",
//       })
//       .populate("cities", "name latitude longitude")
//       .lean();

//     if (!service) {
//       return res.status(404).json({
//         success: false,
//         message: "Service not found",
//       });
//     }

//     // Find all doctors and medicos offering this service
//     const doctors = await Doctor.find({ services: serviceId })
//       .select("name email phone cities location")
//       .populate("cities", "name latitude longitude")
//       .lean();

//     const medicos = await Medico.find({ services: serviceId })
//       .select("name email phone cities location")
//       .populate("cities", "name latitude longitude")
//       .lean();

//     // Add providers to the service response
//     service.providers = {
//       doctors,
//       medicos,
//     };

//     res.status(200).json({
//       success: true,
//       data: service,
//     });
//   } catch (error) {
//     console.error("Error in getFullServiceInfo:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error getting service info",
//       error: error.message,
//     });
//   }
// };






// controllers/serviceController.js
const mongoose = require('mongoose');
const Service = require('../models/serviceModel');
const City = require('../models/availableCities');
const Admin = require('../models/adminModel');
const Doctor = require('../models/doctorModel');

// ============= CREATE SERVICE =============
exports.createService = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Authorization check
    if (userRole !== "admin" && userRole !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin or doctor users can create services.",
      });
    }

    const {
      name,
      category,
      nursingType,
      description,
      basePrice,
      equipmentCharges,
      taxPercentage,
      modes,
      supportsDuration,
      defaultDuration,
      durationOptions,
      paymentMode,
      icon,
      image,
      cities,
      slotConfig
    } = req.body;

    // Validate required fields
    if (!name || !category || !description || !basePrice) {
      return res.status(400).json({
        success: false,
        message: "Name, category, description, and base price are required"
      });
    }

    // Validate category
    if (!['consultation', 'nursing', 'equipment'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Category must be 'consultation', 'nursing', or 'equipment'"
      });
    }

    // Validate nursing type if category is nursing
    if (category === 'nursing' && !nursingType) {
      return res.status(400).json({
        success: false,
        message: "Nursing type is required for nursing services (hourly, full-day, full-night, 12-hour, 24-hour)"
      });
    }

    // Validate cities
    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one city must be specified",
      });
    }

    const validCities = await City.find({ _id: { $in: cities } });
    if (validCities.length !== cities.length) {
      return res.status(400).json({
        success: false,
        message: "One or more invalid city IDs provided",
      });
    }

    // Check duplicate service
    const existingService = await Service.findOne({ 
      name, 
      category,
      isDeleted: false 
    });
    
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: `${category} service with name '${name}' already exists`,
      });
    }

    // Get creator details
    const creatorModel = userRole === "admin" ? "Admin" : "Doctor";
    const Creator = mongoose.model(creatorModel);
    const creatorDetails = await Creator.findById(req.user.id).select(
      "firstName lastName email name"
    );

    if (!creatorDetails) {
      return res.status(404).json({
        success: false,
        message: `${creatorModel} not found`,
      });
    }

    const creatorName = creatorDetails.firstName 
      ? `${creatorDetails.firstName} ${creatorDetails.lastName || ''}`.trim()
      : creatorDetails.name || 'Unknown';

    // Configure slot settings based on category
    let finalSlotConfig = {};

    if (category === 'consultation') {
      finalSlotConfig = {
        consultationSlots: {
          enabled: true,
          startTime: slotConfig?.consultationSlots?.startTime || '09:00',
          endTime: slotConfig?.consultationSlots?.endTime || '19:00',
          slotDuration: 30
        },
        nursingSlots: { enabled: false },
        equipmentBooking: { enabled: false }
      };
    } else if (category === 'nursing') {
      const shiftTypes = [];
      
      switch (nursingType) {
        case 'hourly':
          shiftTypes.push('hourly');
          break;
        case 'full-day':
        case '24-hour':
          shiftTypes.push('24-hour');
          break;
        case 'full-night':
          shiftTypes.push('night-shift');
          break;
        case '12-hour':
          shiftTypes.push('12-hour', 'day-shift', 'night-shift');
          break;
        default:
          shiftTypes.push('hourly', '8-hour', '12-hour', '24-hour', 'day-shift', 'night-shift');
      }

      finalSlotConfig = {
        consultationSlots: { enabled: false },
        nursingSlots: {
          enabled: true,
          shiftTypes,
          minDuration: nursingType === 'hourly' ? 60 : (nursingType === '24-hour' || nursingType === 'full-day' ? 1440 : 720),
          maxDuration: 1440,
          available24x7: true,
          allowCustomDuration: nursingType === 'hourly'
        },
        equipmentBooking: { enabled: false }
      };
    } else if (category === 'equipment') {
      finalSlotConfig = {
        consultationSlots: { enabled: false },
        nursingSlots: { enabled: false },
        equipmentBooking: {
          enabled: true,
          minDuration: slotConfig?.equipmentBooking?.minDuration || 60,
          maxDuration: slotConfig?.equipmentBooking?.maxDuration || 720,
          available24x7: true
        }
      };
    }

    // Create service
    const service = new Service({
      name,
      category,
      nursingType: category === 'nursing' ? nursingType : null,
      description,
      basePrice,
      equipmentCharges: equipmentCharges || 0,
      taxPercentage: taxPercentage || 18,
      modes: modes || ['Home Service'],
      supportsDuration: supportsDuration !== undefined ? supportsDuration : (category !== 'consultation'),
      defaultDuration: category === 'consultation' ? 30 : (category === 'nursing' && nursingType === '24-hour' ? 1440 : 60),
      durationOptions: durationOptions || (
        category === 'consultation' ? [30] : 
        category === 'nursing' ? [60, 480, 720, 1440] : 
        [60, 120, 180, 240, 360, 480, 720]
      ),
      paymentMode: paymentMode || 'Both',
      icon,
      image,
      cities,
      slotConfig: finalSlotConfig,
      createdBy: {
        userId: req.user.id,
        userModel: creatorModel,
        name: creatorName,
        email: creatorDetails.email
      },
      isActive: true
    });

    await service.save();

    // Update creator's service list if they have a services field
    if (Creator.schema.path('services')) {
      await Creator.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { services: service._id } },
        { new: true }
      );
    }

    // Populate response
    await service.populate("cities", "name latitude longitude");

    res.status(201).json({
      success: true,
      message: `${category.charAt(0).toUpperCase() + category.slice(1)} service created successfully`,
      data: {
        service,
        slotInfo: category === 'consultation' 
          ? {
              type: 'consultation',
              slotDuration: '30 minutes',
              availableHours: '09:00 - 19:00',
              slotsPerDay: 20
            }
          : category === 'nursing'
          ? {
              type: 'nursing',
              nursingType,
              shiftTypes: finalSlotConfig.nursingSlots.shiftTypes,
              minDuration: `${finalSlotConfig.nursingSlots.minDuration} minutes`,
              maxDuration: `${finalSlotConfig.nursingSlots.maxDuration} minutes`,
              availability: '24x7',
              pricing: nursingType === 'hourly' ? 'Per hour' : `Per ${nursingType}`
            }
          : {
              type: 'equipment',
              minDuration: `${finalSlotConfig.equipmentBooking.minDuration} minutes`,
              maxDuration: `${finalSlotConfig.equipmentBooking.maxDuration} minutes`,
              availability: '24x7'
            }
      }
    });

  } catch (error) {
    console.error("Error in createService:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating service",
      error: error.message,
    });
  }
};

// ============= GET ALL SERVICES =============
exports.getAllServices = async (req, res) => {
  try {
    const {
      category,
      cityId,
      isActive,
      nursingType,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isDeleted: false };

    // Apply filters
    if (category) query.category = category;
    if (cityId) query.cities = cityId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (nursingType) query.nursingType = nursingType;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const services = await Service.find(query)
      .populate('cities', 'name state country')
      .populate('createdBy.userId', 'firstName lastName name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        services,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};

// ============= GET SERVICE BY ID =============
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id)
      .populate('cities', 'name state country latitude longitude')
      .populate('createdBy.userId', 'firstName lastName name email phone');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });

  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message
    });
  }
};

// ============= GET SERVICES BY CATEGORY =============
exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { cityId, isActive = true } = req.query;

    if (!['consultation', 'nursing', 'equipment'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Must be 'consultation', 'nursing', or 'equipment'"
      });
    }

    const query = { 
      category, 
      isActive,
      isDeleted: false 
    };

    if (cityId) {
      query.cities = cityId;
    }

    const services = await Service.find(query)
      .populate('cities', 'name state')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      category,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services by category',
      error: error.message
    });
  }
};

// ============= GET NURSING SERVICES BY TYPE =============
exports.getNursingServicesByType = async (req, res) => {
  try {
    const { nursingType } = req.params;
    const { cityId } = req.query;

    const validNursingTypes = ['hourly', 'full-day', 'full-night', '12-hour', '24-hour'];
    
    if (!validNursingTypes.includes(nursingType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid nursing type. Must be one of: ${validNursingTypes.join(', ')}`
      });
    }

    const query = { 
      category: 'nursing',
      nursingType,
      isActive: true,
      isDeleted: false 
    };

    if (cityId) {
      query.cities = cityId;
    }

    const services = await Service.find(query)
      .populate('cities', 'name state')
      .sort({ basePrice: 1 });

    res.status(200).json({
      success: true,
      nursingType,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error('Get nursing services by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nursing services',
      error: error.message
    });
  }
};

// ============= UPDATE SERVICE =============
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    // Authorization check
    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update services",
      });
    }

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const {
      name,
      description,
      basePrice,
      equipmentCharges,
      taxPercentage,
      modes,
      defaultDuration,
      durationOptions,
      paymentMode,
      icon,
      image,
      cities,
      isActive,
      slotConfig
    } = req.body;

    // Validate cities if provided
    if (cities) {
      const validCities = await City.find({ _id: { $in: cities } });
      if (validCities.length !== cities.length) {
        return res.status(400).json({
          success: false,
          message: "One or more invalid city IDs provided",
        });
      }
    }

    // Update fields
    if (name) service.name = name;
    if (description) service.description = description;
    if (basePrice !== undefined) service.basePrice = basePrice;
    if (equipmentCharges !== undefined) service.equipmentCharges = equipmentCharges;
    if (taxPercentage !== undefined) service.taxPercentage = taxPercentage;
    if (modes) service.modes = modes;
    if (defaultDuration !== undefined) service.defaultDuration = defaultDuration;
    if (durationOptions) service.durationOptions = durationOptions;
    if (paymentMode) service.paymentMode = paymentMode;
    if (icon !== undefined) service.icon = icon;
    if (image !== undefined) service.image = image;
    if (cities) service.cities = cities;
    if (isActive !== undefined) service.isActive = isActive;
    if (slotConfig) service.slotConfig = { ...service.slotConfig, ...slotConfig };

    await service.save();
    await service.populate('cities', 'name state country');

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });

  } catch (error) {
    console.error('Update service error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating service',
      error: error.message
    });
  }
};

// ============= DELETE SERVICE (SOFT DELETE) =============
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete services",
      });
    }

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Soft delete
    service.isDeleted = true;
    service.deletedAt = new Date();
    service.deletedBy = {
      userId: req.user.id,
      userModel: 'Admin'
    };
    service.isActive = false;

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service',
      error: error.message
    });
  }
};

// ============= RESTORE SERVICE =============
exports.restoreService = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can restore services",
      });
    }

    const service = await Service.findOne({ _id: id, isDeleted: true });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Deleted service not found'
      });
    }

    service.isDeleted = false;
    service.deletedAt = null;
    service.deletedBy = null;
    service.isActive = true;

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service restored successfully',
      data: service
    });

  } catch (error) {
    console.error('Restore service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring service',
      error: error.message
    });
  }
};

// ============= TOGGLE SERVICE STATUS =============
exports.toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can toggle service status",
      });
    }

    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: service._id,
        name: service.name,
        isActive: service.isActive
      }
    });

  } catch (error) {
    console.error('Toggle service status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling service status',
      error: error.message
    });
  }
};

// ============= GET AVAILABLE SLOTS FOR SERVICE =============
exports.getAvailableSlots = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { date, partnerId } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const service = await Service.findById(serviceId);
    
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    const availableSlots = await Service.getAvailableSlots(
      serviceId, 
      new Date(date), 
      partnerId
    );

    res.status(200).json({
      success: true,
      serviceId,
      serviceName: service.name,
      serviceCategory: service.category,
      date: new Date(date).toDateString(),
      data: availableSlots
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available slots',
      error: error.message
    });
  }
};

// ============= CALCULATE SERVICE PRICE =============
exports.calculateServicePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, includeEquipment, shiftType } = req.query;

    const service = await Service.findById(id);

    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Validate shift type for nursing services
    if (service.category === 'nursing' && shiftType) {
      if (!service.slotConfig.nursingSlots.shiftTypes.includes(shiftType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid shift type for this service. Available: ${service.slotConfig.nursingSlots.shiftTypes.join(', ')}`
        });
      }
    }

    const pricing = service.calculateTotalPrice(
      duration ? parseInt(duration) : null,
      includeEquipment === 'true',
      shiftType
    );

    res.status(200).json({
      success: true,
      serviceId: service._id,
      serviceName: service.name,
      category: service.category,
      ...(shiftType && { shiftType }),
      ...(duration && { duration: `${duration} minutes` }),
      pricing
    });

  } catch (error) {
    console.error('Calculate service price error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating service price',
      error: error.message
    });
  }
};

// ============= GET SERVICES BY CITY =============
exports.getServicesByCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { category } = req.query;

    const query = {
      cities: cityId,
      isActive: true,
      isDeleted: false
    };

    if (category) {
      query.category = category;
    }

    const services = await Service.find(query)
      .populate('cities', 'name state')
      .sort({ category: 1, basePrice: 1 });

    const city = await City.findById(cityId);

    res.status(200).json({
      success: true,
      city: city ? city.name : 'Unknown',
      count: services.length,
      data: services
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

// ============= SEARCH SERVICES =============
exports.searchServices = async (req, res) => {
  try {
    const { query, category, cityId, minPrice, maxPrice } = req.query;

    const searchQuery = {
      isActive: true,
      isDeleted: false
    };

    // Text search
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      searchQuery.category = category;
    }

    // City filter
    if (cityId) {
      searchQuery.cities = cityId;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchQuery.basePrice = {};
      if (minPrice) searchQuery.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.basePrice.$lte = parseFloat(maxPrice);
    }

    const services = await Service.find(searchQuery)
      .populate('cities', 'name state')
      .sort({ basePrice: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching services',
      error: error.message
    });
  }
};

// ============= GET SERVICE STATISTICS (ADMIN) =============
exports.getServiceStatistics = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view service statistics",
      });
    }

    const stats = await Promise.all([
      // Total services by category
      Service.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            avgPrice: { $avg: '$basePrice' }
          }
        }
      ]),

      // Nursing services by type
      Service.aggregate([
        { 
          $match: { 
            category: 'nursing',
            isDeleted: false 
          } 
        },
        {
          $group: {
            _id: '$nursingType',
            count: { $sum: 1 }
          }
        }
      ]),

      // Total counts
      Service.countDocuments({ isDeleted: false }),
      Service.countDocuments({ isActive: true, isDeleted: false }),
      Service.countDocuments({ isActive: false, isDeleted: false })
    ]);

    res.status(200).json({
      success: true,
      data: {
        byCategory: stats[0],
        nursingByType: stats[1],
        totalServices: stats[2],
        activeServices: stats[3],
        inactiveServices: stats[4]
      }
    });

  } catch (error) {
    console.error('Get service statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service statistics',
      error: error.message
    });
  }
};

// ============= BULK UPDATE SERVICES =============
exports.bulkUpdateServices = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can perform bulk updates",
      });
    }

    const { serviceIds, updates } = req.body;

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Service IDs array is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }

    const result = await Service.updateMany(
      { _id: { $in: serviceIds }, isDeleted: false },
      { $set: updates }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} services updated successfully`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Bulk update services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk update',
      error: error.message
    });
  }
};

module.exports = exports;
