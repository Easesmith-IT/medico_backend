const mongoose = require("mongoose");
const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const Post = require("../models/socialPostModel");

const getPatientId = (req) => req.user?.id || req.user?._id || req.user?.userId;

const isVisiblePost = (post) => post && !post.isHidden && !post.hiddenAt;

const getPatientOrResponse = async (req, res, select = "") => {
  const patientId = getPatientId(req);

  if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
    res.status(401).json({
      success: false,
      message: "Valid patient authentication is required",
    });
    return null;
  }

  const query = Patient.findById(patientId);
  if (select) query.select(select);

  const patient = await query;
  if (!patient) {
    res.status(404).json({
      success: false,
      message: "Patient not found",
    });
    return null;
  }

  return patient;
};

exports.getMyFavorites = async (req, res) => {
  try {
    const patientId = getPatientId(req);

    const patient = await Patient.findById(patientId)
      .select("favoriteDoctors savedPosts")
      .populate({
        path: "favoriteDoctors.doctorId",
        select:
          "firstName lastName email phone profilePhoto specialization yearsOfExperience consultationFees currency averageRating totalReviews address cities clinics",
        populate: { path: "cities", select: "name latitude longitude" },
      })
      .populate({
        path: "savedPosts.postId",
        match: { isHidden: false, hiddenAt: null },
        populate: {
          path: "doctor",
          select: "firstName lastName profilePhoto specialization address cities clinics",
          populate: { path: "cities", select: "name latitude longitude" },
        },
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const favoriteDoctors = (patient.favoriteDoctors || [])
      .filter((item) => item.doctorId)
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .map((item) => ({
        _id: item._id,
        addedAt: item.addedAt,
        doctor: item.doctorId,
      }));

    const savedPosts = (patient.savedPosts || [])
      .filter((item) => item.postId)
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
      .map((item) => ({
        _id: item._id,
        savedAt: item.savedAt,
        post: {
          ...item.postId.toObject(),
          isSaved: true,
        },
      }));

    res.status(200).json({
      success: true,
      data: {
        counts: {
          favoriteDoctors: favoriteDoctors.length,
          savedPosts: savedPosts.length,
        },
        favoriteDoctors,
        savedPosts,
      },
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching favorites",
      error: error.message,
    });
  }
};

exports.toggleFavoriteDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctorId",
      });
    }

    const doctor = await Doctor.findOne({
      _id: doctorId,
      isActive: true,
    }).select(
      "firstName lastName profilePhoto specialization averageRating totalReviews consultationFees currency",
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const patient = await getPatientOrResponse(req, res, "favoriteDoctors");
    if (!patient) return;

    patient.favoriteDoctors = Array.isArray(patient.favoriteDoctors)
      ? patient.favoriteDoctors
      : [];

    const existingIndex = patient.favoriteDoctors.findIndex(
      (item) => item.doctorId?.toString() === doctorId,
    );

    const isFavorite = existingIndex === -1;
    if (isFavorite) {
      patient.favoriteDoctors.push({ doctorId, addedAt: new Date() });
    } else {
      patient.favoriteDoctors.splice(existingIndex, 1);
    }

    await patient.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      isFavorite,
      message: isFavorite
        ? "Doctor added to favorites"
        : "Doctor removed from favorites",
      data: {
        doctor,
        favoriteDoctorIds: patient.favoriteDoctors.map((item) => item.doctorId),
      },
    });
  } catch (error) {
    console.error("Toggle favorite doctor error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating favorite doctor",
      error: error.message,
    });
  }
};

exports.toggleSavedPost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid postId",
      });
    }

    const post = await Post.findById(postId);
    if (!isVisiblePost(post)) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const patient = await getPatientOrResponse(req, res, "savedPosts");
    if (!patient) return;

    patient.savedPosts = Array.isArray(patient.savedPosts)
      ? patient.savedPosts
      : [];

    const existingIndex = patient.savedPosts.findIndex(
      (item) => item.postId?.toString() === postId,
    );

    const isSaved = existingIndex === -1;
    post.stats = post.stats || {};

    if (isSaved) {
      patient.savedPosts.push({ postId: post._id, savedAt: new Date() });
      post.stats.saves = Number(post.stats.saves || 0) + 1;
    } else {
      patient.savedPosts.splice(existingIndex, 1);
      post.stats.saves = Math.max(Number(post.stats.saves || 0) - 1, 0);
    }

    await Promise.all([
      patient.save({ validateBeforeSave: false }),
      post.save(),
    ]);

    res.status(200).json({
      success: true,
      isSaved,
      message: isSaved ? "Post saved successfully" : "Post removed from saved",
      data: {
        postId: post._id,
        saves: post.stats.saves,
        savedPostIds: patient.savedPosts.map((item) => item.postId),
      },
    });
  } catch (error) {
    console.error("Toggle saved post error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating saved post",
      error: error.message,
    });
  }
};
