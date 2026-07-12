// Shared pagination helpers so list endpoints across the app compute
// page/limit/skip and response metadata in exactly the same way.

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

exports.getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

exports.buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.max(Math.ceil(total / limit), 1),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});
