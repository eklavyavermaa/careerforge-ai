// Wraps async route handlers so rejected promises are forwarded to Express's
// centralized error handler instead of requiring try/catch in every controller.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
