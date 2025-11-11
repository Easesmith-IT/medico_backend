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



// controllers/serviceController.js
const Service = require('../models/serviceModel');
const Doctor = require('../models/doctorModel');
const Booking = require('../models/bookingModel'); // IMPORTANT: Add this

// ==================== PUBLIC CONTROLLERS ====================

// Get All Available Services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .select('name description basePrice equipmentCharges modes icon image');
    
    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};

// Get Service Details
exports.getServiceDetails = async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    const service = await Service.findById(serviceId);
    
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
    res.status(500).json({
      success: false,
      message: 'Error fetching service details',
      error: error.message
    });
  }
};

// Get Verified Providers by Service
exports.getProvidersByService = async (req, res) => {
  try {
    const { serviceType } = req.params;
    const { latitude, longitude, maxDistance = 10000 } = req.query;

    const query = { 
      verificationStatus: 'approved',
      isActive: true,
      'availability.serviceAvailability.serviceType': serviceType
    };

    let doctors;

    if (latitude && longitude) {
      doctors = await Doctor.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            distanceField: 'distance',
            maxDistance: parseInt(maxDistance),
            spherical: true,
            query: {
              verificationStatus: 'approved',
              isActive: true
            }
          }
        },
        {
          $match: {
            'availability.serviceAvailability.serviceType': serviceType
          }
        },
        {
          $project: {
            firstName: 1,
            profilePhoto: 1,
            specialization: 1,
            yearsOfExperience: 1,
            averageRating: 1,
            totalReviews: 1,
            consultationFees: 1,
            'availability.serviceAvailability': 1,
            distance: 1
          }
        },
        {
          $sort: { averageRating: -1, distance: 1 }
        }
      ]);
    } else {
      doctors = await Doctor.find(query)
        .select('firstName profilePhoto specialization yearsOfExperience averageRating totalReviews consultationFees availability.serviceAvailability')
        .sort({ averageRating: -1 });
    }

    const providers = doctors.map(doctor => {
      const serviceAvailability = doctor.availability?.serviceAvailability?.find(
        sa => sa.serviceType === serviceType
      );

      return {
        _id: doctor._id,
        name: doctor.firstName,
        photo: doctor.profilePhoto,
        specialization: doctor.specialization,
        experience: doctor.yearsOfExperience,
        rating: doctor.averageRating,
        reviewCount: doctor.totalReviews,
        pricing: serviceAvailability?.pricing || { basePrice: doctor.consultationFees },
        distance: doctor.distance ? (doctor.distance / 1000).toFixed(2) : null
      };
    });

    res.status(200).json({
      success: true,
      count: providers.length,
      data: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching providers',
      error: error.message
    });
  }
};

// Get Provider Full Profile
exports.getProviderProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctor = await Doctor.findById(doctorId)
      .select('-password -refreshToken -tokenVersion -verificationDocuments');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found'
      });
    }

    // Get ratings and reviews from bookings
    const bookings = await Booking.find({
      doctorId,
      'feedback.rating': { $exists: true }
    })
      .populate('patientId', 'name profilePhoto')
      .select('feedback createdAt')
      .sort({ 'feedback.submittedAt': -1 })
      .limit(10);

    const reviews = bookings.map(b => ({
      patientName: b.patientId?.name || 'Anonymous',
      patientPhoto: b.patientId?.profilePhoto || null,
      rating: b.feedback.rating,
      review: b.feedback.review,
      date: b.feedback.submittedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        ...doctor.toObject(),
        reviews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching provider profile',
      error: error.message
    });
  }
};

// ==================== ADMIN CONTROLLERS ====================

// Create Service (Admin)
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
      image
    } = req.body;

    // Check if service already exists
    const existingService = await Service.findOne({ name });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name already exists'
      });
    }

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
      image
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating service',
      error: error.message
    });
  }
};

// Update Service (Admin)
exports.updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const updateData = req.body;

    const service = await Service.findByIdAndUpdate(
      serviceId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating service',
      error: error.message
    });
  }
};

// Delete/Deactivate Service (Admin)
exports.deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findByIdAndUpdate(
      serviceId,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service deactivated successfully',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deactivating service',
      error: error.message
    });
  }
};

module.exports = exports;
