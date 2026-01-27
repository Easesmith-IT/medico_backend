const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

exports.getLatLngFromAddress = async (address) => {
  const url = "https://maps.googleapis.com/maps/api/geocode/json";

  const response = await axios.get(url, {
    params: {
      address,
      key: GOOGLE_API_KEY,
    },
  });

  if (!response.data.results.length) {
    throw new Error("Location not found");
  }

  const location = response.data.results[0].geometry.location;

  return {
    lat: location.lat,
    lng: location.lng,
    formattedAddress: response.data.results[0].formatted_address,
  };
};
