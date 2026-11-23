// Middleware to extract tenant (hotel_id) from request headers or query params

export function tenantMiddleware(req, res, next) {
  // Check header 'x-hotel-id', query param 'hotelId', or fallback to default
  const hotelId = req.headers['x-hotel-id'] || req.query.hotelId || 'hotel_ujjain_01';
  req.hotelId = String(hotelId).trim();
  next();
}
