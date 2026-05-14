//after signup adding address using these below function 

const City = require('../models/availableCities');
const PatientAddress = require("../models/patientAddressModel");
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
exports.addPatientAddress = catchAsync(async (req, res, next) => {
  const patientId = req.user.id;
  const {
    label,
    street,
    city,
    cityId,
    state,
    country,
    pincode,
    landmark,
    isPrimary,
  } = req.body;

  if (!cityId) {
    return next(new AppError("cityId is required", 400));
  }

  const cityExists = await City.findById(cityId);
  if (!cityExists) {
    return next(new AppError("Invalid city ID", 400));
  }

  if (isPrimary) {
    await PatientAddress.updateMany(
      { patientId, isPrimary: true },
      { $set: { isPrimary: false } }
    );
  }

  const existingCount = await PatientAddress.countDocuments({ patientId });

  const address = await PatientAddress.create({
    patientId,
    label: label || "home",
    street,
    city,
    cityId,
    state,
    country: country || "India",
    pincode,
    landmark,
    isPrimary: existingCount === 0 ? true : !!isPrimary,
  });

  res.status(201).json({
    success: true,
    message: "Address added successfully",
    data: address,
  });
});

//Get all addresses

exports.getMyAddresses = catchAsync(async (req, res, next) => {
  const addresses = await PatientAddress.find({ patientId: req.user.id }).sort({
    isPrimary: -1,
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    count: addresses.length,
    data: addresses,
  });
});


//Update address
exports.updatePatientAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const patientId = req.user.id;

  const address = await PatientAddress.findOne({ _id: addressId, patientId });
  if (!address) {
    return next(new AppError("Address not found", 404));
  }

  if (req.body.cityId) {
    const cityExists = await City.findById(req.body.cityId);
    if (!cityExists) {
      return next(new AppError("Invalid city ID", 400));
    }
  }

  if (req.body.isPrimary === true) {
    await PatientAddress.updateMany(
      { patientId, isPrimary: true },
      { $set: { isPrimary: false } }
    );
  }

  const allowedFields = [
    "label",
    "street",
    "city",
    "cityId",
    "state",
    "country",
    "pincode",
    "landmark",
    "isPrimary",
  ];

  allowedFields.forEach((field) => {
    if (field in req.body) {
      address[field] = req.body[field];
    }
  });

  await address.save();

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    data: address,
  });
});


//Delete address
exports.deletePatientAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const patientId = req.user.id;

  const address = await PatientAddress.findOneAndDelete({
    _id: addressId,
    patientId,
  });

  if (!address) {
    return next(new AppError("Address not found", 404));
  }

  if (address.isPrimary) {
    const nextPrimary = await PatientAddress.findOne({ patientId }).sort({
      createdAt: 1,
    });

    if (nextPrimary) {
      nextPrimary.isPrimary = true;
      await nextPrimary.save();
    }
  }

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
  });
});


//Set primary address

exports.setPrimaryAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const patientId = req.user.id;

  const address = await PatientAddress.findOne({ _id: addressId, patientId });
  if (!address) {
    return next(new AppError("Address not found", 404));
  }

  await PatientAddress.updateMany(
    { patientId, isPrimary: true },
    { $set: { isPrimary: false } }
  );

  address.isPrimary = true;
  await address.save();

  res.status(200).json({
    success: true,
    message: "Primary address updated successfully",
    data: address,
  });
});