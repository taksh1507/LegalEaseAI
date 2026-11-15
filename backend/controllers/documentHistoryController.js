const pool = require('../config/database');
const httpError = require('../utils/httpError');
function integer(value, label, fallback, maximum) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (
    !/^\d+$/.test(String(value)) ||
    !Number.isSafeInteger(number) ||
    number < 0 ||
    number > maximum
  )
    throw httpError(400, `Invalid ${label}`);
  return number;
}
function record(row) {
  return {
    id: row.id,
    fileName: row.file_name,
    documentType: row.document_type,
    summary: row.summary,
    riskLevel: row.risk_level,
    redFlagsCount: row.red_flags_count,
    clausesCount: row.clauses_count,
    analysisDate: row.analysis_date,
    createdAt: row.created_at,
    fullAnalysis: row.analysis_data,
  };
}
function idValue(value) {
  const id = integer(value, 'history ID', 0, 2147483647);
  if (!id) throw httpError(400, 'Invalid history ID');
  return id;
}
function endpoint(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}
const createHistory = endpoint(async (req, res) => {
  const data = req.body;
  if (
    !data ||
    typeof data.fileName !== 'string' ||
    !data.fileName.trim() ||
    data.fileName.length > 500
  )
    throw httpError(400, 'A file name of at most 500 characters is required');
  if (
    !data.analysisData ||
    typeof data.analysisData !== 'object' ||
    Array.isArray(data.analysisData)
  )
    throw httpError(400, 'Analysis data is required');
  if (
    data.summary !== undefined &&
    (typeof data.summary !== 'string' || data.summary.length > 100000)
  )
    throw httpError(400, 'Invalid summary');
  if (
    data.documentType !== undefined &&
    (typeof data.documentType !== 'string' || data.documentType.length > 100)
  )
    throw httpError(400, 'Invalid document type');
  if (data.riskLevel !== undefined && typeof data.riskLevel !== 'string')
    throw httpError(400, 'Invalid risk level');
  const risk = (data.riskLevel || 'unknown').toLowerCase();
  if (!['low', 'medium', 'high', 'critical', 'unknown'].includes(risk))
    throw httpError(400, 'Invalid risk level');
  const result = await pool.query(
    'INSERT INTO document_history (user_id, user_email, file_name, document_type, summary, risk_level, red_flags_count, clauses_count, analysis_data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, analysis_date',
    [
      req.user.id,
      req.user.email,
      data.fileName.trim(),
      data.documentType || 'Unknown Document',
      data.summary || '',
      risk,
      integer(data.redFlagsCount, 'red flag count', 0, 100000),
      integer(data.clausesCount, 'clause count', 0, 100000),
      data.analysisData,
    ],
  );
  res.json({
    success: true,
    data: { id: result.rows[0].id, analysisDate: result.rows[0].analysis_date },
    message: 'Document history saved successfully',
  });
});
const getUserHistory = endpoint(async (req, res) => {
  const limit = integer(req.query.limit, 'limit', 10, 100),
    offset = integer(req.query.offset, 'offset', 0, 1000000);
  if (!limit) throw httpError(400, 'Limit must be positive');
  if (
    req.query.search !== undefined &&
    (typeof req.query.search !== 'string' || req.query.search.length > 100)
  )
    throw httpError(400, 'Invalid search');
  const search = req.query.search?.trim() || '';
  const result = await pool.query(
    'SELECT * FROM document_history WHERE user_id = $1 AND POSITION(LOWER($2) IN LOWER(file_name)) > 0 ORDER BY analysis_date DESC, id DESC LIMIT $3 OFFSET $4',
    [req.user.id, search, limit, offset],
  );
  const count = await pool.query(
    'SELECT COUNT(*)::integer AS total FROM document_history WHERE user_id = $1 AND POSITION(LOWER($2) IN LOWER(file_name)) > 0',
    [req.user.id, search],
  );
  res.json({ success: true, data: result.rows.map(record), total: count.rows[0].total });
});
const getHistoryById = endpoint(async (req, res) => {
  const result = await pool.query('SELECT * FROM document_history WHERE id = $1 AND user_id = $2', [
    idValue(req.params.id),
    req.user.id,
  ]);
  if (!result.rows[0]) throw httpError(404, 'Document history not found');
  res.json({ success: true, data: record(result.rows[0]) });
});
const deleteHistory = endpoint(async (req, res) => {
  const result = await pool.query(
    'DELETE FROM document_history WHERE id = $1 AND user_id = $2 RETURNING id',
    [idValue(req.params.id), req.user.id],
  );
  if (!result.rows.length) throw httpError(404, 'Document history not found');
  res.json({ success: true, message: 'Document history deleted successfully' });
});
const clearUserHistory = endpoint(async (req, res) => {
  const result = await pool.query('DELETE FROM document_history WHERE user_id = $1 RETURNING id', [
    req.user.id,
  ]);
  res.json({
    success: true,
    message: 'All document history cleared successfully',
    deletedCount: result.rowCount,
  });
});
const getHistoryStats = endpoint(async (req, res) => {
  const result = await pool.query(
    `SELECT COUNT(*)::integer AS total_documents, COUNT(*) FILTER (WHERE LOWER(risk_level) IN ('high','critical'))::integer AS high_risk_count, COUNT(*) FILTER (WHERE LOWER(risk_level) = 'medium')::integer AS medium_risk_count, COUNT(*) FILTER (WHERE LOWER(risk_level) = 'low')::integer AS low_risk_count, MAX(analysis_date) AS last_analysis FROM document_history WHERE user_id = $1`,
    [req.user.id],
  );
  res.json({ success: true, data: result.rows[0] });
});
module.exports = {
  createHistory,
  getUserHistory,
  getHistoryById,
  deleteHistory,
  clearUserHistory,
  getHistoryStats,
};
