// const { geocodeAddress } = require("../geocode.service");
const { getLatLngFromAddress } = require("../geocode.service");

const {  isPointInsidePolygon } = require("../geofence.service");
const geocodeService = require("../geocode.service");

exports.checkAddressInPolygon = async (req, res) => {
  try {
    const { address, polygon } = req.body;

    // const location = await geocodeAddress(address);
const location = await getLatLngFromAddress(address);

    const inside =  isPointInsidePolygon(location, polygon);

    res.json({
      success: true,
      address,
      location,
      insidePolygon: inside
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};



