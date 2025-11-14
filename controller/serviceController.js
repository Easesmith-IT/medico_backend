// // controllers/serviceController.js
// const Service = require('../models/serviceModel');
// const Doctor = require('../models/doctorModel');

// // Get All Available Services
// exports.getAllServices = async (req, res) => {
//   try {
//     const services = await Service.find({ isActive: true })
//       .select('name description basePrice equipmentCharges modes icon image');
    
//     res.status(200).json({
//       success: true,
//       count: services.length,
//       data: services
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching services',
//       error: error.message
//     });
//   }
// };

// // Get Service Details
// exports.getServiceDetails = async (req, res) => {
//   try {
//     const { serviceId } = req.params;
    
//     const service = await Service.findById(serviceId);
    
//     if (!service) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: service
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching service details',
//       error: error.message
//     });
//   }
// };

// // Get Verified Providers by Service
// exports.getProvidersByService = async (req, res) => {
//   try {
//     const { serviceType } = req.params;
//     const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance in meters

//     const query = { 
//       verificationStatus: 'approved',
//       isActive: true,
//       'availability.serviceAvailability.serviceType': serviceType
//     };

//     let doctors;

//     // Location-based filtering if coordinates provided
//     if (latitude && longitude) {
//       doctors = await Doctor.aggregate([
//         {
//           $geoNear: {
//             near: {
//               type: 'Point',
//               coordinates: [parseFloat(longitude), parseFloat(latitude)]
//             },
//             distanceField: 'distance',
//             maxDistance: parseInt(maxDistance),
//             spherical: true,
//             query: {
//               verificationStatus: 'approved',
//               isActive: true
//             }
//           }
//         },
//         {
//           $match: {
//             'availability.serviceAvailability.serviceType': serviceType
//           }
//         },
//         {
//           $project: {
//             firstName: 1,
//             profilePhoto: 1,
//             specialization: 1,
//             yearsOfExperience: 1,
//             averageRating: 1,
//             totalReviews: 1,
//             consultationFees: 1,
//             'availability.serviceAvailability': 1,
//             distance: 1
//           }
//         },
//         {
//           $sort: { averageRating: -1, distance: 1 }
//         }
//       ]);
//     } else {
//       doctors = await Doctor.find(query)
//         .select('firstName profilePhoto specialization yearsOfExperience averageRating totalReviews consultationFees availability.serviceAvailability')
//         .sort({ averageRating: -1 });
//     }

//     // Filter service availability for requested service type
//     const providers = doctors.map(doctor => {
//       const serviceAvailability = doctor.availability?.serviceAvailability?.find(
//         sa => sa.serviceType === serviceType
//       );

//       return {
//         _id: doctor._id,
//         name: doctor.firstName,
//         photo: doctor.profilePhoto,
//         specialization: doctor.specialization,
//         experience: doctor.yearsOfExperience,
//         rating: doctor.averageRating,
//         reviewCount: doctor.totalReviews,
//         pricing: serviceAvailability?.pricing || { basePrice: doctor.consultationFees },
//         distance: doctor.distance ? (doctor.distance / 1000).toFixed(2) : null // Convert to km
//       };
//     });

//     res.status(200).json({
//       success: true,
//       count: providers.length,
//       data: providers
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching providers',
//       error: error.message
//     });
//   }
// };

// // Get Provider Full Profile
// exports.getProviderProfile = async (req, res) => {
//   try {
//     const { doctorId } = req.params;
    
//     const doctor = await Doctor.findById(doctorId)
//       .select('-password -refreshToken -tokenVersion -verificationDocuments');

//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Provider not found'
//       });
//     }

//     // Get ratings and reviews from bookings
//     const bookings = await Booking.find({
//       doctorId,
//       'feedback.rating': { $exists: true }
//     })
//       .populate('patientId', 'name profilePhoto')
//       .select('feedback createdAt')
//       .sort({ 'feedback.submittedAt': -1 })
//       .limit(10);

//     const reviews = bookings.map(b => ({
//       patientName: b.patientId.name,
//       patientPhoto: b.patientId.profilePhoto,
//       rating: b.feedback.rating,
//       review: b.feedback.review,
//       date: b.feedback.submittedAt
//     }));

//     res.status(200).json({
//       success: true,
//       data: {
//         ...doctor.toObject(),
//         reviews
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching provider profile',
//       error: error.message
//     });
//   }
// };

// module.exports = exports;



// // controllers/serviceController.js
// const Service = require('../models/serviceModel');
// const Doctor = require('../models/doctorModel');
// const Booking = require('../models/bookingModel'); // IMPORTANT: Add this

// // ==================== PUBLIC CONTROLLERS ====================

// // Get All Available Services
// exports.getAllServices = async (req, res) => {
//   try {
//     const services = await Service.find({ isActive: true })
//       .select('name description basePrice equipmentCharges modes icon image');
    
//     res.status(200).json({
//       success: true,
//       count: services.length,
//       data: services
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching services',
//       error: error.message
//     });
//   }
// };

// // Get Service Details
// exports.getServiceDetails = async (req, res) => {
//   try {
//     const { serviceId } = req.params;
    
//     const service = await Service.findById(serviceId);
    
//     if (!service) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: service
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching service details',
//       error: error.message
//     });
//   }
// };

// // Get Verified Providers by Service
// exports.getProvidersByService = async (req, res) => {
//   try {
//     const { serviceType } = req.params;
//     const { latitude, longitude, maxDistance = 10000 } = req.query;

//     const query = { 
//       verificationStatus: 'approved',
//       isActive: true,
//       'availability.serviceAvailability.serviceType': serviceType
//     };

//     let doctors;

//     if (latitude && longitude) {
//       doctors = await Doctor.aggregate([
//         {
//           $geoNear: {
//             near: {
//               type: 'Point',
//               coordinates: [parseFloat(longitude), parseFloat(latitude)]
//             },
//             distanceField: 'distance',
//             maxDistance: parseInt(maxDistance),
//             spherical: true,
//             query: {
//               verificationStatus: 'approved',
//               isActive: true
//             }
//           }
//         },
//         {
//           $match: {
//             'availability.serviceAvailability.serviceType': serviceType
//           }
//         },
//         {
//           $project: {
//             firstName: 1,
//             profilePhoto: 1,
//             specialization: 1,
//             yearsOfExperience: 1,
//             averageRating: 1,
//             totalReviews: 1,
//             consultationFees: 1,
//             'availability.serviceAvailability': 1,
//             distance: 1
//           }
//         },
//         {
//           $sort: { averageRating: -1, distance: 1 }
//         }
//       ]);
//     } else {
//       doctors = await Doctor.find(query)
//         .select('firstName profilePhoto specialization yearsOfExperience averageRating totalReviews consultationFees availability.serviceAvailability')
//         .sort({ averageRating: -1 });
//     }

//     const providers = doctors.map(doctor => {
//       const serviceAvailability = doctor.availability?.serviceAvailability?.find(
//         sa => sa.serviceType === serviceType
//       );

//       return {
//         _id: doctor._id,
//         name: doctor.firstName,
//         photo: doctor.profilePhoto,
//         specialization: doctor.specialization,
//         experience: doctor.yearsOfExperience,
//         rating: doctor.averageRating,
//         reviewCount: doctor.totalReviews,
//         pricing: serviceAvailability?.pricing || { basePrice: doctor.consultationFees },
//         distance: doctor.distance ? (doctor.distance / 1000).toFixed(2) : null
//       };
//     });

//     res.status(200).json({
//       success: true,
//       count: providers.length,
//       data: providers
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching providers',
//       error: error.message
//     });
//   }
// };

// // Get Provider Full Profile
// exports.getProviderProfile = async (req, res) => {
//   try {
//     const { doctorId } = req.params;
    
//     const doctor = await Doctor.findById(doctorId)
//       .select('-password -refreshToken -tokenVersion -verificationDocuments');

//     if (!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: 'Provider not found'
//       });
//     }

//     // Get ratings and reviews from bookings
//     const bookings = await Booking.find({
//       doctorId,
//       'feedback.rating': { $exists: true }
//     })
//       .populate('patientId', 'name profilePhoto')
//       .select('feedback createdAt')
//       .sort({ 'feedback.submittedAt': -1 })
//       .limit(10);

//     const reviews = bookings.map(b => ({
//       patientName: b.patientId?.name || 'Anonymous',
//       patientPhoto: b.patientId?.profilePhoto || null,
//       rating: b.feedback.rating,
//       review: b.feedback.review,
//       date: b.feedback.submittedAt
//     }));

//     res.status(200).json({
//       success: true,
//       data: {
//         ...doctor.toObject(),
//         reviews
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching provider profile',
//       error: error.message
//     });
//   }
// };

// // ==================== ADMIN CONTROLLERS ====================

// // Create Service (Admin)
// exports.createService = async (req, res) => {
//   try {
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
//       image
//     } = req.body;

//     // Check if service already exists
//     const existingService = await Service.findOne({ name });
//     if (existingService) {
//       return res.status(400).json({
//         success: false,
//         message: 'Service with this name already exists'
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
//       image
//     });

//     await service.save();

//     res.status(201).json({
//       success: true,
//       message: 'Service created successfully',
//       data: service
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error creating service',
//       error: error.message
//     });
//   }
// };

// // Update Service (Admin)
// exports.updateService = async (req, res) => {
//   try {
//     const { serviceId } = req.params;
//     const updateData = req.body;

//     const service = await Service.findByIdAndUpdate(
//       serviceId,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     if (!service) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Service updated successfully',
//       data: service
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error updating service',
//       error: error.message
//     });
//   }
// };

// // Delete/Deactivate Service (Admin)
// exports.deleteService = async (req, res) => {
//   try {
//     const { serviceId } = req.params;

//     const service = await Service.findByIdAndUpdate(
//       serviceId,
//       { isActive: false },
//       { new: true }
//     );

//     if (!service) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Service deactivated successfully',
//       data: service
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error deactivating service',
//       error: error.message
//     });
//   }
// };

// module.exports = exports;





const Service = require('../models/serviceModel');
const City = require('../models/availableCities');
const mongoose = require('mongoose');

const Admin = require('../models/adminModel');
const Doctor = require('../models/doctorModel');

// Get All Services with City Names
// Get all services with filters, sorting, and pagination
exports.getAllServices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      cityId,
      isActive,
      sortBy = 'createdAt',
      order = 'desc',
      search
    } = req.query;

    // Build query object
    const query = {};

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Filter by city
    if (cityId) {
      query.cities = cityId;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    // Fetch services with pagination
    const services = await Service.find(query)
      .populate('cities', 'name latitude longitude')
      .populate('createdBy.userId', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalServices = await Service.countDocuments(query);
    const totalPages = Math.ceil(totalServices / parseInt(limit));

    res.status(200).json({
      success: true,
      count: services.length,
      totalServices,
      totalPages,
      currentPage: parseInt(page),
      data: services
    });
  } catch (error) {
    console.error('Error in getAllServices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};


// Create Service (Admin or Doctor)
// exports.createService = async (req, res) => {
//   try {
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
//       cities // Array of city IDs
//     } = req.body;

//     // Validate cities
//     if (!cities || !Array.isArray(cities) || cities.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'At least one city must be specified'
//       });
//     }

//     // Verify all city IDs exist
//     const validCities = await City.find({ _id: { $in: cities } });
//     if (validCities.length !== cities.length) {
//       return res.status(400).json({
//         success: false,
//         message: 'One or more invalid city IDs provided'
//       });
//     }

//     // Check if service already exists
//     const existingService = await Service.findOne({ name });
//     if (existingService) {
//       return res.status(400).json({
//         success: false,
//         message: 'Service with this name already exists'
//       });
//     }

//     // Get creator details from authenticated user
//     const creatorModel = req.user.role === 'admin' ? 'Admin' : 'Doctor';
//     const Creator = mongoose.model(creatorModel);
//     const creatorDetails = await Creator.findById(req.user.id).select('name email');

//     if (!creatorDetails) {
//       return res.status(404).json({
//         success: false,
//         message: 'Creator not found'
//       });
//     }

//     // Create service
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
//         name: creatorDetails.name,
//         email: creatorDetails.email
//       }
//     });

//     await service.save();

//     // Add service to creator's services array
//     await Creator.findByIdAndUpdate(
//       req.user.id,
//       { $addToSet: { services: service._id } },
//       { new: true }
//     );

//     // Populate before sending response
//     await service.populate('cities', 'name latitude longitude');

//     res.status(201).json({
//       success: true,
//       message: 'Service created successfully',
//       data: service
//     });
//   } catch (error) {
//     console.error('Error in createService:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating service',
//       error: error.message
//     });
//   }
// };


//with check service 
// exports.createService = async (req, res) => {
//   try {
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
//       cities
//     } = req.body;

//     // Validate cities
//     if (!cities || !Array.isArray(cities) || cities.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'At least one city must be specified'
//       });
//     }

//     // Verify all city IDs exist
//     const validCities = await City.find({ _id: { $in: cities } });
//     if (validCities.length !== cities.length) {
//       return res.status(400).json({
//         success: false,
//         message: 'One or more invalid city IDs provided'
//       });
//     }

//     // Check if service already exists
//     const existingService = await Service.findOne({ name });
//     if (existingService) {
//       return res.status(400).json({
//         success: false,
//         message: 'Service with this name already exists'
//       });
//     }

//     // Determine creator model - handle admin, superAdmin, and doctor
//     const userRole = req.user.role.toLowerCase();
//     const isAdmin = userRole === 'admin' || userRole === 'superadmin';
//     const creatorModel = isAdmin ? 'Admin' : 'Doctor';
    
//     const Creator = mongoose.model(creatorModel);
//     const creatorDetails = await Creator.findById(req.user.id).select('firstName lastName name email');

//     if (!creatorDetails) {
//       return res.status(404).json({
//         success: false,
//         message: 'Creator not found'
//       });
//     }

//     // Build creator name (handle different name formats)
//     let creatorName;
//     if (creatorDetails.firstName && creatorDetails.lastName) {
//       creatorName = `${creatorDetails.firstName} ${creatorDetails.lastName}`;
//     } else if (creatorDetails.firstName) {
//       creatorName = creatorDetails.firstName;
//     } else if (creatorDetails.name) {
//       creatorName = creatorDetails.name;
//     } else {
//       creatorName = 'Unknown';
//     }

//     // Create service
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
//         name: creatorName,
//         email: creatorDetails.email
//       }
//     });

//     await service.save();

//     // Add service to creator's services array
//     await Creator.findByIdAndUpdate(
//       req.user.id,
//       { $addToSet: { services: service._id } },
//       { new: true }
//     );

//     // Populate before sending response
//     await service.populate('cities', 'name latitude longitude');

//     res.status(201).json({
//       success: true,
//       message: 'Service created successfully',
//       data: service
//     });
//   } catch (error) {
//     console.error('Error in createService:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating service',
//       error: error.message
//     });
//   }
// };


exports.createService = async (req, res) => {
  try {
    const {
      name,
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
      cities
    } = req.body;

    // Validate cities
    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one city must be specified'
      });
    }

    // Verify all city IDs exist
    const validCities = await City.find({ _id: { $in: cities } });
    if (validCities.length !== cities.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid city IDs provided'
      });
    }

    // REMOVED: Duplicate service name check
    // This allows multiple doctors to create services with the same name

    // Determine creator model - handle admin, superAdmin, and doctor
    const userRole = req.user.role.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const creatorModel = isAdmin ? 'Admin' : 'Doctor';
    
    const Creator = mongoose.model(creatorModel);
    const creatorDetails = await Creator.findById(req.user.id).select('firstName lastName name email');

    if (!creatorDetails) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    // Build creator name (handle different name formats)
    let creatorName;
    if (creatorDetails.firstName && creatorDetails.lastName) {
      creatorName = `${creatorDetails.firstName} ${creatorDetails.lastName}`;
    } else if (creatorDetails.firstName) {
      creatorName = creatorDetails.firstName;
    } else if (creatorDetails.name) {
      creatorName = creatorDetails.name;
    } else {
      creatorName = 'Unknown';
    }

    // Create service
    const service = new Service({
      name,
      description,
      basePrice,
      equipmentCharges,
      taxPercentage: taxPercentage || 18,
      modes,
      supportsDuration,
      defaultDuration: defaultDuration || 30,
      durationOptions,
      paymentMode,
      icon,
      image,
      cities,
      createdBy: {
        userId: req.user.id,
        userModel: creatorModel,
        name: creatorName,
        email: creatorDetails.email
      }
    });

    await service.save();

    // Add service to creator's services array
    await Creator.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { services: service._id } },
      { new: true }
    );

    // Populate before sending response
    await service.populate('cities', 'name latitude longitude');

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Error in createService:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating service',
      error: error.message
    });
  }
};







// Get Services by City
exports.getServicesByCity = async (req, res) => {
  try {
    const { cityId } = req.params;

    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: 'City ID is required'
      });
    }

    // Verify city exists
    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    const services = await Service.find({ 
      isActive: true,
      cities: cityId 
    })
      .select('name description basePrice equipmentCharges modes icon image')
      .populate('cities', 'name latitude longitude')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      city: city.name,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Error in getServicesByCity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};

// Update Service
exports.updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const updateData = req.body;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }

    // If cities are being updated, validate them
    if (updateData.cities) {
      if (!Array.isArray(updateData.cities) || updateData.cities.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cities must be a non-empty array'
        });
      }

      const validCities = await City.find({ _id: { $in: updateData.cities } });
      if (validCities.length !== updateData.cities.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more invalid city IDs provided'
        });
      }
    }

    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('cities', 'name latitude longitude')
      .populate('createdBy.userId', 'name email');

    if (!updatedService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: updatedService
    });
  } catch (error) {
    console.error('Error in updateService:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating service',
      error: error.message
    });
  }
};




// Get single service by ID
exports.getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }

    const service = await Service.findById(serviceId)
      .populate('cities', 'name latitude longitude')
      .populate('createdBy.userId', 'name email');

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
    console.error('Error in getServiceById:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message
    });
  }
};
// Get services by creator ID
// exports.getServicesByCreator = async (req, res) => {
//   try {
//     const { creatorId } = req.params;
//     const { role } = req.query; // 'admin' or 'doctor'

//     if (!creatorId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Creator ID is required'
//       });
//     }

//     if (!role || !['admin', 'doctor'].includes(role.toLowerCase())) {
//       return res.status(400).json({
//         success: false,
//         message: 'Valid role (admin or doctor) is required'
//       });
//     }

//     const creatorModel = role.toLowerCase() === 'admin' ? 'Admin' : 'Doctor';

//     const services = await Service.find({
//       'createdBy.userId': creatorId,
//       'createdBy.userModel': creatorModel
//     })
//       .populate('cities', 'name latitude longitude')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: services.length,
//       data: services
//     });
//   } catch (error) {
//     console.error('Error in getServicesByCreator:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching services',
//       error: error.message
//     });
//   }
// };


exports.getServicesByCreator = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { role } = req.query; // 'admin', 'superAdmin', or 'doctor'

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: 'Creator ID is required'
      });
    }

    // Validate role - accept admin, superAdmin, and doctor
    const validRoles = ['admin', 'superadmin', 'doctor'];
    if (!role || !validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid role (admin, superAdmin, or doctor) is required'
      });
    }

    // Map superAdmin to Admin model (both use Admin model)
    const roleLower = role.toLowerCase();
    const creatorModel = (roleLower === 'admin' || roleLower === 'superadmin') ? 'Admin' : 'Doctor';

    const services = await Service.find({
      'createdBy.userId': creatorId,
      'createdBy.userModel': creatorModel
    })
      .populate('cities', 'name latitude longitude')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Error in getServicesByCreator:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};
