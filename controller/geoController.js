const { getLatLngFromAddress } = require("../geocode.service");
const City = require("../models/availableCities");

function normalizePolygon(raw) {
  if (!Array.isArray(raw) || raw.length < 3) {
    throw new Error("polygon must contain at least 3 coordinate points");
  }
  const first = raw[0];
  if (Array.isArray(first) && typeof first[0] === "number") {
    return raw;
  }
  if (Array.isArray(first) && Array.isArray(first[0])) {
    return first;
  }
  throw new Error("Invalid polygon format");
}

function pointInPolygon(point, polygon) {
  const x = Number(point.lng);
  const y = Number(point.lat);
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i][0]);
    const yi = Number(polygon[i][1]);
    const xj = Number(polygon[j][0]);
    const yj = Number(polygon[j][1]);

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonCentroid(ring) {
  if (!Array.isArray(ring) || ring.length === 0) return null;
  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of ring) {
    sumLng += Number(lng);
    sumLat += Number(lat);
  }
  return { lng: sumLng / ring.length, lat: sumLat / ring.length };
}

async function resolveLocation(address) {
  try {
    return await getLatLngFromAddress(address);
  } catch (_) {
    const parts = String(address || "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    if (!parts.length) throw new Error("Location not found");

    const city = await City.findOne({
      name: { $in: parts },
      isActive: true,
    }).lean() || await City.findOne({ name: { $in: parts } }).lean();

    if (!city) throw new Error("Location not found");

    if (typeof city.latitude === "number" && typeof city.longitude === "number") {
      return {
        lat: city.latitude,
        lng: city.longitude,
        formattedAddress: city.name,
      };
    }

    const ring = city.area?.coordinates?.[0];
    const centroid = polygonCentroid(ring);
    if (!centroid) throw new Error("Location not found");

    return {
      lat: centroid.lat,
      lng: centroid.lng,
      formattedAddress: city.name,
    };
  }
}

exports.checkAddressInPolygon = async (req, res) => {
  try {
    const { address, polygon } = req.body;

    if (!address || typeof address !== "string") {
      throw new Error("address is required");
    }

    const ring = normalizePolygon(polygon);
    const location = await resolveLocation(address);
    const inside = pointInPolygon(location, ring);

    res.json({
      success: true,
      address,
      location,
      insidePolygon: inside,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};



