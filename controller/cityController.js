const City = require("../models/availableCities");

// 1. Add City by Name and Coordinates
const addCity = async (req, res) => {
  try {
    const { name, latitude, longitude } = req.body;

    // Validate required fields
    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "name, latitude, and longitude are required",
      });
    }

    // Validate latitude range
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    // Validate longitude range
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    // Check if city already exists
    const existingCity = await City.findOne({
      name: name.toLowerCase().trim(),
    });
    if (existingCity) {
      return res.status(400).json({
        success: false,
        message: "City already exists",
      });
    }

    // Create new city
    const newCity = await City.create({
      name: name.toLowerCase().trim(),
      latitude,
      longitude,
    });

    res.status(201).json({
      success: true,
      message: "City added successfully",
      data: newCity,
    });
  } catch (error) {
    console.error("Error in addCity:", error);
    res.status(500).json({
      success: false,
      message: "Error adding city",
      error: error.message,
    });
  }
};

// 2. Get All Cities
const getAllCities = async (req, res) => {
  try {
    const cities = await City.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Cities retrieved successfully",
      data: cities,
      total: cities.length,
    });
  } catch (error) {
    console.error("Error in getAllCities:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cities",
      error: error.message,
    });
  }
};

// 3. Get City by ID
const getCityById = async (req, res) => {
  try {
    const { cityId } = req.params;

    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "City ID is required",
      });
    }

    const city = await City.findById(cityId);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "City retrieved successfully",
      data: city,
    });
  } catch (error) {
    console.error("Error in getCityById:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching city",
      error: error.message,
    });
  }
};

// 4. Delete City
const deleteCity = async (req, res) => {
  try {
    const { cityId } = req.params;

    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "City ID is required",
      });
    }

    const city = await City.findByIdAndDelete(cityId);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "City deleted successfully",
      data: city,
    });
  } catch (error) {
    console.error("Error in deleteCity:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting city",
      error: error.message,
    });
  }
};

// 5. Update City
const updateCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { name, latitude, longitude } = req.body;

    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "City ID is required",
      });
    }

    const updateData = {};

    if (name) {
      updateData.name = name.toLowerCase().trim();
    }

    if (latitude !== undefined) {
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          success: false,
          message: "Latitude must be between -90 and 90",
        });
      }
      updateData.latitude = latitude;
    }

    if (longitude !== undefined) {
      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          message: "Longitude must be between -180 and 180",
        });
      }
      updateData.longitude = longitude;
    }

    const updatedCity = await City.findByIdAndUpdate(cityId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCity) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "City updated successfully",
      data: updatedCity,
    });
  } catch (error) {
    console.error("Error in updateCity:", error);
    res.status(500).json({
      success: false,
      message: "Error updating city",
      error: error.message,
    });
  }
};


// Toggle City Active Status
const toggleCityStatus = async (req, res) => {
  try {
    const { cityId } = req.params;

    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "City ID is required",
      });
    }

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    // Toggle isActive (if does not exist, default to true)
    city.isActive = city.isActive === undefined ? true : !city.isActive;

    await city.save();

    res.status(200).json({
      success: true,
      message: `City is now ${city.isActive ? "active" : "inactive"}`,
      data: city,
    });
  } catch (error) {
    console.error("Error in toggleCityStatus:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling city status",
      error: error.message,
    });
  }
};




module.exports = {
  addCity,
  getAllCities,
  getCityById,
  deleteCity,
  updateCity,
    toggleCityStatus,
};