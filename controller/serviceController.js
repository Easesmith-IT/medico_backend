// const mongoose = require('mongoose');
// const Service = require('../models/serviceModel');
// const City = require('../models/availableCities');
// const Admin = require('../models/adminModel');
// const Doctor = require('../models/doctorModel');

// // ============= HELPER FUNCTIONS =============

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

// const getFlexibleDurationOptions = () => [
//   { minutes: 60, label: '1 hour' },
//   { minutes: 90, label: '1.5 hours' },
//   { minutes: 120, label: '2 hours' },
//   { minutes: 150, label: '2.5 hours' },
//   { minutes: 180, label: '3 hours' },
//   { minutes: 240, label: '4 hours' },
//   { minutes: 360, label: '6 hours' },
//   { minutes: 480, label: '8 hours' },
//   { minutes: 720, label: '12 hours' },
//   { minutes: 1440, label: '24 hours' }
// ];

// const formatTime = (time24, format = '24-hour') => {
//   if (!time24) return null;
//   const [hours, minutes] = time24.split(':').map(Number);
//   if (format === '12-hour') {
//     const period = hours >= 12 ? 'PM' : 'AM';
//     const hours12 = hours % 12 || 12;
//     return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
//   }
//   return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
// };

// const validateCities = async (cityIds) => {
//   if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
//     throw new Error('At least one city must be specified');
//   }
//   const validCities = await City.find({ _id: { $in: cityIds } });
//   if (validCities.length !== cityIds.length) {
//     const validCityIds = validCities.map(city => city._id.toString());
//     const invalidIds = cityIds.filter(id => !validCityIds.includes(id.toString()));
//     throw new Error(`Invalid city IDs: ${invalidIds.join(', ')}. Please ensure all cities exist in the system.`);
//   }
//   return validCities;
// };

// // ============= CREATE SERVICE =============
// exports.createService = async (req, res) => {
//   try {
//     const userRole = req.user.role;
//     if (userRole !== "admin" && userRole !== "superadmin" && userRole !== "doctor") {
//       return res.status(403).json({ success: false, message: "Access denied. Only admin or doctor users can create services." });
//     }
//     const { name, category, description, basePrice, equipmentCharges, taxPercentage, modes, supportsDuration, paymentMode, icon, image, cities, slotConfig, timeFormat } = req.body;
//     if (!name || !category || !description || !basePrice) {
//       return res.status(400).json({ success: false, message: "Name, category, description, and base price are required" });
//     }
//     if (!['consultation', 'nursing', 'equipment'].includes(category)) {
//       return res.status(400).json({ success: false, message: "Category must be 'consultation', 'nursing', or 'equipment'" });
//     }
//     const selectedTimeFormat = timeFormat || '24-hour';
//     if (!['12-hour', '24-hour'].includes(selectedTimeFormat)) {
//       return res.status(400).json({ success: false, message: "Time format must be either '12-hour' or '24-hour'" });
//     }
//     let validatedCities;
//     try {
//       validatedCities = await validateCities(cities);
//     } catch (error) {
//       return res.status(400).json({ success: false, message: error.message });
//     }
//     const existingService = await Service.findOne({ name, category, isDeleted: false });
//     if (existingService) {
//       return res.status(400).json({ success: false, message: `${category} service with name '${name}' already exists` });
//     }
//     const creatorModel = (userRole === "admin" || userRole === "superadmin") ? "Admin" : "Doctor";
//     const Creator = mongoose.model(creatorModel);
//     const creatorDetails = await Creator.findById(req.user.id).select("firstName lastName email name");
//     if (!creatorDetails) {
//       return res.status(404).json({ success: false, message: `${creatorModel} not found` });
//     }
//     const creatorName = creatorDetails.firstName
//       ? `${creatorDetails.firstName} ${creatorDetails.lastName || ''}`.trim()
//       : creatorDetails.name || 'Unknown';
//     let finalSlotConfig = {}, defaultDuration = 60, durationOptions = [];
//     if (category === 'consultation') {
//       finalSlotConfig = {
//         consultationSlots: {
//           enabled: true,
//           startTime: slotConfig?.consultationSlots?.startTime || '09:00',
//           endTime: slotConfig?.consultationSlots?.endTime || '19:00',
//           slotDuration: 30
//         }
//       };
//       defaultDuration = 30;
//       durationOptions = [30];
//     } else if (category === 'nursing') {
//       const flexibleOptions = getFlexibleDurationOptions();
//       durationOptions = flexibleOptions.map(opt => opt.minutes);
//       finalSlotConfig = {
//         nursingSlots: {
//           enabled: true,
//           shiftTypes: ['flexible'],
//           minDuration: 60,
//           maxDuration: 1440,
//           available24x7: true,
//           allowCustomDuration: true,
//           flexibleDurationOptions: flexibleOptions
//         }
//       };
//     } else if (category === 'equipment') {
//       const flexibleOptions = getFlexibleDurationOptions();
//       durationOptions = flexibleOptions.map(opt => opt.minutes);
//       finalSlotConfig = {
//         equipmentBooking: {
//           enabled: true,
//           minDuration: 60,
//           maxDuration: 1440,
//           available24x7: true,
//           flexibleDurationOptions: flexibleOptions
//         }
//       };
//     }
//     const service = new Service({
//       name,
//       category,
//       nursingType: null,
//       description,
//       basePrice,
//       equipmentCharges: equipmentCharges || 0,
//       taxPercentage: taxPercentage || 18,
//       modes: modes || ['Home Service'],
//       supportsDuration: supportsDuration !== undefined ? supportsDuration : true,
//       defaultDuration,
//       durationOptions,
//       paymentMode: paymentMode || 'Both',
//       timeFormat: selectedTimeFormat,
//       icon,
//       image,
//       cities: validatedCities.map(city => city._id),
//       slotConfig: finalSlotConfig,
//       createdBy: {
//         userId: req.user.id,
//         userModel: creatorModel,
//         name: creatorName,
//         email: creatorDetails.email
//       },
//       isActive: true
//     });
//     await service.save();
//     if (Creator.schema.path('services')) {
//       await Creator.findByIdAndUpdate(req.user.id, { $addToSet: { services: service._id } }, { new: true });
//     }
//     await service.populate("cities", "name latitude longitude");
//     const responseSlotInfo = {
//       type: category,
//       defaultDuration: formatDuration(defaultDuration),
//       durationOptions: category === 'consultation'
//         ? ['30 minutes']
//         : getFlexibleDurationOptions().map(opt => opt.label),
//       availability: category === 'consultation'
//         ? `${formatTime('09:00', selectedTimeFormat)} - ${formatTime('19:00', selectedTimeFormat)}`
//         : '24x7 (Patient can select any time)',
//       timeFormat: selectedTimeFormat,
//       pricing: `₹${basePrice} per hour`,
//       selectionMode: category === 'consultation'
//         ? 'Fixed 30-minute slots'
//         : 'Patient selects start time and duration',
//       instructions: category !== 'consultation'
//         ? 'Patient can book service for any duration from 1 hour to 24 hours at any time of the day'
//         : 'Fixed consultation slots available from 9 AM to 7 PM'
//     };
//     res.status(201).json({
//       success: true,
//       message: `${category.charAt(0).toUpperCase() + category.slice(1)} service created successfully`,
//       data: {
//         service,
//         availableCities: validatedCities.map(city => ({
//           id: city._id,
//           name: city.name,
//           coordinates: { latitude: city.latitude, longitude: city.longitude }
//         })),
//         slotInfo: responseSlotInfo
//       }
//     });
//   } catch (error) {
//     console.error("Error in createService:", error);
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors: Object.values(error.errors).map(err => err.message)
//       });
//     }
//     res.status(500).json({
//       success: false,
//       message: "Error creating service",
//       error: error.message,
//     });
//   }
// };

// // ============= GET ALL SERVICES =============

// exports.getAllServices = async (req, res) => {
//   try {
//     const { category, cityId, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', timeFormat = '24-hour' } = req.query;
//     const query = { isDeleted: false };
//     if (category) query.category = category;
//     if (cityId) query.cities = cityId;
//     if (isActive !== undefined) query.isActive = isActive === 'true';
//     const skip = (page - 1) * limit;
//     const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
//     const services = await Service.find(query)
//       .populate('cities', 'name latitude longitude')
//       .populate('createdBy.userId', 'firstName lastName name email')
//       .sort(sort)
//       .skip(skip)
//       .limit(parseInt(limit));
//     const total = await Service.countDocuments(query);
//     const formattedServices = services.map(service => {
//       const serviceObj = service.toObject();
//       return {
//         ...serviceObj,
//         formattedDuration: formatDuration(serviceObj.defaultDuration),
//         formattedDurationOptions: serviceObj.durationOptions.map(d => formatDuration(d)),
//         displayTimeFormat: timeFormat
//       };
//     });
//     res.status(200).json({
//       success: true,
//       data: {
//         services: formattedServices,
//         pagination: {
//           total,
//           page: parseInt(page),
//           pages: Math.ceil(total / limit),
//           limit: parseInt(limit)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get all services error:', error);
//     res.status(500).json({ success: false, message: 'Error fetching services', error: error.message });
//   }
// };

// // ============= GET SERVICE BY ID =============
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
//     const formattedService = {
//       ...serviceObj,
//       formattedDuration: formatDuration(serviceObj.defaultDuration),
//       formattedDurationOptions: serviceObj.durationOptions.map(d => formatDuration(d)),
//       displayTimeFormat: timeFormat
//     };
//     res.status(200).json({ success: true, data: formattedService });
//   } catch (error) {
//     console.error('Get service by ID error:', error);
//     res.status(500).json({ success: false, message: 'Error fetching service', error: error.message });
//   }
// };

// // ============= UPDATE SERVICE =============
// exports.updateService = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userRole = req.user.role;
//     if (userRole !== "admin" && userRole !== "superadmin") {
//       return res.status(403).json({ success: false, message: "Only admins can update services" });
//     }
//     const service = await Service.findById(id);
//     if (!service) {
//       return res.status(404).json({ success: false, message: 'Service not found' });
//     }
//     const { name, description, basePrice, equipmentCharges, taxPercentage, modes, defaultDuration, durationOptions, paymentMode, timeFormat, icon, image, cities, isActive, slotConfig } = req.body;
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
//     const serviceObj = service.toObject();
//     const formattedService = {
//       ...serviceObj,
//       formattedDuration: formatDuration(serviceObj.defaultDuration),
//       formattedDurationOptions: serviceObj.durationOptions.map(d => formatDuration(d))
//     };
//     res.status(200).json({ success: true, message: 'Service updated successfully', data: formattedService });
//   } catch (error) {
//     console.error('Update service error:', error);
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors: Object.values(error.errors).map(err => err.message)
//       });
//     }
//     res.status(500).json({ success: false, message: 'Error updating service', error: error.message });
//   }
// };

// // ============= DELETE SERVICE (SOFT DELETE) =============
// exports.deleteService = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userRole = req.user.role;
//     if (userRole !== "admin" && userRole !== "superadmin") {
//       return res.status(403).json({ success: false, message: "Only admins can delete services" });
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

// // ============= RESTORE SERVICE =============
// exports.restoreService = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userRole = req.user.role;
//     if (userRole !== "admin" && userRole !== "superadmin") {
//       return res.status(403).json({ success: false, message: "Only admins can restore services" });
//     }
//     const service = await Service.findOne({ _id: id, isDeleted: true });
//     if (!service) {
//       return res.status(404).json({ success: false, message: 'Deleted service not found' });
//     }
//     service.isDeleted = false;
//     service.deletedAt = null;
//     service.deletedBy = null;
//     service.isActive = true;
//     await service.save();
//     res.status(200).json({ success: true, message: 'Service restored successfully', data: service });
//   } catch (error) {
//     console.error('Restore service error:', error);
//     res.status(500).json({ success: false, message: 'Error restoring service', error: error.message });
//   }
// };

// // ============= TOGGLE SERVICE STATUS =============
// exports.toggleServiceStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userRole = req.user.role;
//     if (userRole !== "admin" && userRole !== "superadmin") {
//       return res.status(403).json({ success: false, message: "Only admins can toggle service status" });
//     }
//     const service = await Service.findById(id);
//     if (!service) {
//       return res.status(404).json({ success: false, message: 'Service not found' });
//     }
//     service.isActive = !service.isActive;
//     await service.save();
//     res.status(200).json({
//       success: true,
//       message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
//       data: { id: service._id, name: service.name, isActive: service.isActive }
//     });
//   } catch (error) {
//     console.error('Toggle service status error:', error);
//     res.status(500).json({ success: false, message: 'Error toggling service status', error: error.message });
//   }
// };

// // ============= GET AVAILABLE SLOTS FOR SERVICE =============
// exports.getAvailableSlots = async (req, res) => {
//   try {
//     const { serviceId } = req.params;
//     const { date, partnerId, timeFormat = '24-hour' } = req.query;
//     if (!date) {
//       return res.status(400).json({ success: false, message: 'Date is required' });
//     }
//     const service = await Service.findById(serviceId);
//     if (!service || !service.isActive) {
//       return res.status(404).json({ success: false, message: 'Service not found or inactive' });
//     }
//     const availableSlots = await Service.getAvailableSlots(serviceId, new Date(date), partnerId);
//     res.status(200).json({
//       success: true,
//       serviceId,
//       serviceName: service.name,
//       serviceCategory: service.category,
//       date: new Date(date).toDateString(),
//       timeFormat,
//       data: availableSlots
//     });
//   } catch (error) {
//     console.error('Get available slots error:', error);
//     res.status(500).json({ success: false, message: 'Error fetching available slots', error: error.message });
//   }
// };

// // ============= CALCULATE SERVICE PRICE =============
// exports.calculateServicePrice = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { duration, includeEquipment } = req.query;
//     const service = await Service.findById(id);
//     if (!service || !service.isActive) {
//       return res.status(404).json({ success: false, message: 'Service not found or inactive' });
//     }
//     const pricing = service.calculateTotalPrice(
//       duration ? parseInt(duration) : null,
//       includeEquipment === 'true',
//       null
//     );
//     res.status(200).json({
//       success: true,
//       serviceId: service._id,
//       serviceName: service.name,
//       category: service.category,
//       duration: duration ? formatDuration(parseInt(duration)) : formatDuration(service.defaultDuration),
//       pricing
//     });
//   } catch (error) {
//     console.error('Calculate service price error:', error);
//     res.status(500).json({ success: false, message: 'Error calculating service price', error: error.message });
//   }
// };

// // ============= GET SERVICES BY CITY =============
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
//     const formattedServices = services.map(service => {
//       const serviceObj = service.toObject();
//       return {
//         ...serviceObj,
//         formattedDuration: formatDuration(serviceObj.defaultDuration),
//         formattedDurationOptions: serviceObj.durationOptions.map(d => formatDuration(d)),
//         displayTimeFormat: timeFormat
//       };
//     });
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

// // ============== SEARCH SERVICES ==============
// exports.searchServices = async (req, res) => {
//   try {
//     const { query: search, category, cityId, minPrice, maxPrice, timeFormat = '24-hour' } = req.query;
//     const searchQuery = { isActive: true, isDeleted: false };
//     if (search) {
//       searchQuery.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { description: { $regex: search, $options: 'i' } }
//       ];
//     }
//     if (category) searchQuery.category = category;
//     if (cityId) searchQuery.cities = cityId;
//     if (minPrice || maxPrice) {
//       searchQuery.basePrice = {};
//       if (minPrice) searchQuery.basePrice.$gte = parseFloat(minPrice);
//       if (maxPrice) searchQuery.basePrice.$lte = parseFloat(maxPrice);
//     }
//     const services = await Service.find(searchQuery)
//       .populate('cities', 'name latitude longitude')
//       .sort({ basePrice: 1 });
//     const formattedServices = services.map(service => {
//       const serviceObj = service.toObject();
//       return {
//         ...serviceObj,
//         formattedDuration: formatDuration(serviceObj.defaultDuration),
//         formattedDurationOptions: serviceObj.durationOptions.map(d => formatDuration(d)),
//         displayTimeFormat: timeFormat
//       };
//     });
//     res.status(200).json({ success: true, count: services.length, data: formattedServices });
//   } catch (error) {
//     console.error('Search services error:', error);
//     res.status(500).json({ success: false, message: 'Error searching services', error: error.message });
//   }
// };

// // ============= GET SERVICE STATISTICS (ADMIN) =============
// exports.getServiceStatistics = async (req, res) => {
//   try {
//     const userRole = req.user.role;
//     if (userRole !== "admin" && userRole !== "superadmin") {
//       return res.status(403).json({ success: false, message: "Only admins can view service statistics" });
//     }
//     const stats = await Promise.all([
//       Service.aggregate([
//         { $match: { isDeleted: false } },
//         {
//           $group: {
//             _id: '$category',
//             count: { $sum: 1 },
//             active: { $sum: { $cond: ['$isActive', 1, 0] } },
//             avgPrice: { $avg: '$basePrice' }
//           }
//         }
//       ]),
//       Service.countDocuments({ isDeleted: false }),
//       Service.countDocuments({ isActive: true, isDeleted: false }),
//       Service.countDocuments({ isActive: false, isDeleted: false })
//     ]);
//     res.status(200).json({
//       success: true,
//       data: {
//         byCategory: stats[0],
//         totalServices: stats[1],
//         activeServices: stats[2],
//         inactiveServices: stats[3]
//       }
//     });
//   } catch (error) {
//     console.error('Get service statistics error:', error);
//     res.status(500).json({ success: false, message: 'Error fetching service statistics', error: error.message });
//   }
// };

// // ============= BULK UPDATE SERVICES =============
// exports.bulkUpdateServices = async (req, res) => {
//   try {
//     const userRole = req.user.role;
//     if (userRole !== "admin" && userRole !== "superadmin") {
//       return res.status(403).json({ success: false, message: "Only admins can perform bulk updates" });
//     }
//     const { serviceIds, updates } = req.body;
//     if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
//       return res.status(400).json({ success: false, message: 'Service IDs array is required' });
//     }
//     if (!updates || Object.keys(updates).length === 0) {
//       return res.status(400).json({ success: false, message: 'Updates object is required' });
//     }
//     const result = await Service.updateMany(
//       { _id: { $in: serviceIds }, isDeleted: false },
//       { $set: updates }
//     );
//     res.status(200).json({
//       success: true,
//       message: `${result.modifiedCount} services updated successfully`,
//       data: { matched: result.matchedCount, modified: result.modifiedCount }
//     });
//   } catch (error) {
//     console.error('Bulk update services error:', error);
//     res.status(500).json({ success: false, message: 'Error performing bulk update', error: error.message });
//   }
// };
// // ============= GET NURSING SERVICES BY TYPE =============
// exports.getNursingServicesByType = async (req, res) => {
//   try {
//     const { nursingType } = req.params;
//     const { cityId, isActive = true, timeFormat = '24-hour' } = req.query;

//     const validNursingTypes = ['hourly', 'full-day', 'full-night', '12-hour', '24-hour'];
//     if (!validNursingTypes.includes(nursingType)) {
//       return res.status(400).json({ success: false, message: 'Invalid nursingType parameter' });
//     }

//     let query = {
//       category: 'nursing',
//       nursingType,
//       isActive,
//       isDeleted: false,
//     };
//     if (cityId) query.cities = cityId;

//     const services = await Service.find(query)
//       .populate('cities', 'name latitude longitude')
//       .sort({ createdAt: -1 });

//     const formattedServices = services.map(service => {
//       const serviceObj = service.toObject();
//       return {
//         ...serviceObj,
//         formattedDuration: formatDuration(serviceObj.defaultDuration),
//         formattedDurationOptions: serviceObj.durationOptions.map(d => formatDuration(d)),
//         displayTimeFormat: timeFormat,
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       nursingType,
//       count: services.length,
//       data: formattedServices,
//     });
//   } catch (error) {
//     console.error('Error fetching nursing services:', error);
//     res.status(500).json({ success: false, message: 'Failed to fetch nursing services', error: error.message });
//   }
// };
const mongoose = require('mongoose');
const Service = require('../models/serviceModel');
const City = require('../models/availableCities');
const Admin = require('../models/adminModel');
const Doctor = require('../models/doctorModel');
const { autoFilterSlots } = require('../utils/timeFIlter');
const { formatDuration } = require('../utils/timeFormat');

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


exports.createService = async (req, res) => {
  try {
    const userRole = req.user.role.toLowerCase();
    console.log("req.user", req.user);
    

    if (!['admin', 'superadmin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and superadmins can create services.'
      });
    }

    const admin = await Admin.findById(req.user.id)
    console.log("admin-log", admin);
    

    if (!admin.email) {
      return res.status(400).json({
        success: false,
        message: "Authenticated user email is required to create service.",
      });
    }

    const {
      name,
      category,
      nursingType,           // Required for nursing category
      description,
      basePrice,
      equipmentCharges = 0,
      taxPercentage = 18,
      modes = ['Home Service'],
      supportsDuration = true,
      paymentMode = 'Both',
      icon,
      image,
      cities,
      slotConfig = {},
      timeFormat = '24-hour'
    } = req.body;

    if (!name || !category || !description || basePrice == null) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, description, and base price are required.'
      });
    }

    if (!['12-hour', '24-hour'].includes(timeFormat)) {
      return res.status(400).json({
        success: false,
        message: "Time format must be '12-hour' or '24-hour'."
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
      isDeleted: false
    });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: `${category} service with name '${name}' already exists`
      });
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
      cities: validatedCities.map(c => c._id),
      slotConfig,
      createdBy: {
        userId: admin?._id,
        userModel: userRole === 'superadmin' ? 'SuperAdmin' : 'Admin',
        name: admin.firstName || 'Admin User',
        email: admin.email
      },
      isActive: true,
      isDeleted: false
    });

    await service.save();
    await service.populate('cities', 'name latitude longitude');

    // Filter slotConfig to include only enabled, relevant slots
    const filteredSlotConfig = autoFilterSlots(service.slotConfig, service.category, service.timeFormat);

    const responseObj = service.toObject();
    responseObj.slotConfig = filteredSlotConfig;
    responseObj.formattedDuration = formatDuration(service.defaultDuration);

    res.status(201).json({
      success: true,
      message: `${category.charAt(0).toUpperCase() + category.slice(1)} service created successfully.`,
      data: responseObj
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, message: 'Error creating service', error: error.message });
  }
};


// Get All Services with filters
exports.getAllServices = async (req, res) => {
  try {
    const { category, cityId, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', timeFormat = '24-hour' } = req.query;
    const query = { isDeleted: false };

    if (category) query.category = category;
    if (cityId) query.cities = cityId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const services = await Service.find(query)
      .populate('cities', 'name latitude longitude')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Service.countDocuments(query);
    const formattedServices = services.map(service => ({
      ...service.toObject(),
      formattedDuration: formatDuration(service.defaultDuration),
      displayTimeFormat: timeFormat
    }));

    res.status(200).json({
      success: true,
      data: {
        services: formattedServices,
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
    res.status(500).json({ success: false, message: 'Error fetching services', error: error.message });
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
    const { timeFormat = '24-hour' } = req.query;

    const service = await Service.findById(id)
      .populate('cities', 'name latitude longitude');

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Normalize userModel for population
    const userModel = service.createdBy.userModel === 'SuperAdmin' ? 'Admin' : service.createdBy.userModel;

    // Populate createdBy.userId with normalized model
    await service.populate({
      path: 'createdBy.userId',
      select: 'firstName lastName name email phone',
      model: userModel
    });

    const serviceObj = service.toObject();

    // Filter slotConfig by enabled flags
    const filteredSlotConfig = {};
    if (service.slotConfig.consultationSlots) {
      filteredSlotConfig.consultationSlots = service.slotConfig.consultationSlots;
    }
    if (service.slotConfig.nursingSlots && service.slotConfig.nursingSlots.enabled) {
      filteredSlotConfig.nursingSlots = service.slotConfig.nursingSlots;
    }
    if (service.slotConfig.equipmentBooking && service.slotConfig.equipmentBooking.enabled) {
      filteredSlotConfig.equipmentBooking = service.slotConfig.equipmentBooking;
    }
    serviceObj.slotConfig = filteredSlotConfig;

    serviceObj.formattedDuration = formatDuration(service.defaultDuration);
    serviceObj.displayTimeFormat = timeFormat;

    res.status(200).json({ success: true, data: serviceObj });
  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({ success: false, message: 'Error fetching service', error: error.message });
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



exports.updateService = async (req, res) => {
  try {
    // The protect middleware will already have set req.user if the user is authenticated and authorized
    const { id } = req.params;
    if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // extract and update fields as before...
    const {
      name, description, basePrice, equipmentCharges,
      taxPercentage, modes, defaultDuration, durationOptions,
      paymentMode, timeFormat, icon, image, cities,
      isActive, slotConfig
    } = req.body;

    // ... rest of your update code remains unchanged ...

    if (cities) {
      try {
        await validateCities(cities);
        service.cities = cities;
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
      }
    }
    if (name) service.name = name;
    if (description) service.description = description;
    if (basePrice !== undefined) service.basePrice = basePrice;
    if (equipmentCharges !== undefined) service.equipmentCharges = equipmentCharges;
    if (taxPercentage !== undefined) service.taxPercentage = taxPercentage;
    if (modes) service.modes = modes;
    if (defaultDuration !== undefined) service.defaultDuration = defaultDuration;
    if (durationOptions) service.durationOptions = durationOptions;
    if (paymentMode) service.paymentMode = paymentMode;
    if (timeFormat) service.timeFormat = timeFormat;
    if (icon !== undefined) service.icon = icon;
    if (image !== undefined) service.image = image;
    if (isActive !== undefined) service.isActive = isActive;
    if (slotConfig) service.slotConfig = { ...service.slotConfig, ...slotConfig };

    await service.save();
    await service.populate('cities', 'name latitude longitude');

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, message: 'Error updating service', error: error.message });
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

    // Soft delete
    service.isDeleted = true;
    service.deletedAt = new Date();
    service.deletedBy = { userId: req.user.id, userModel: 'Admin' };
    service.isActive = false;
    await service.save();

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

