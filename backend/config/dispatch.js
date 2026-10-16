module.exports = {
  name: process.env.DISPATCH_NAME || "MakeItMine Dispatch Centre",
  lat: Number(process.env.DISPATCH_LAT) || 28.6139,
  lng: Number(process.env.DISPATCH_LNG) || 77.209,
};