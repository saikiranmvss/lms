import slugify from 'slugify';

export const generateSlug = (text) => {
  return slugify(text, { lower: true, strict: true, trim: true });
};

export const paginate = (query, page = 1, limit = 12) => {
  const offset = (page - 1) * limit;
  return { ...query, limit: parseInt(limit), offset };
};

export const buildPaginationMeta = (total, page, limit) => ({
  total: parseInt(total),
  page: parseInt(page),
  limit: parseInt(limit),
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

export const sendError = (res, status, message, details = null) => {
  const response = { success: false, message };
  if (details) response.details = details;
  return res.status(status).json(response);
};

export const sendSuccess = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({ success: true, message, data });
};
