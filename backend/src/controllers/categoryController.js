import pool from '../db/index.js';
import { generateSlug, sendError, sendSuccess } from '../utils/helpers.js';

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cat.*, COUNT(c.id) as course_count
      FROM categories cat LEFT JOIN courses c ON c.category_id = cat.id AND c.status = 'published'
      GROUP BY cat.id ORDER BY cat.name
    `);
    sendSuccess(res, result.rows);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch categories', err.message);
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return sendError(res, 400, 'Name is required');
    const slug = generateSlug(name);
    const result = await pool.query(
      'INSERT INTO categories (name, slug, description, icon) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, slug, description, icon]
    );
    sendSuccess(res, result.rows[0], 'Category created', 201);
  } catch (err) {
    sendError(res, 500, 'Failed to create category', err.message);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), icon = COALESCE($3, icon) WHERE id = $4 RETURNING *',
      [name, description, icon, id]
    );
    sendSuccess(res, result.rows[0], 'Category updated');
  } catch (err) {
    sendError(res, 500, 'Failed to update category', err.message);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    sendSuccess(res, null, 'Category deleted');
  } catch (err) {
    sendError(res, 500, 'Failed to delete category', err.message);
  }
};
