const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      position TEXT,
      message TEXT,
      resume_filename TEXT NOT NULL,
      resume_original_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

function toSubmission(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    position: row.position,
    message: row.message,
    resumeFilename: row.resume_filename,
    resumeOriginalName: row.resume_original_name,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

async function getAll() {
  const { rows } = await pool.query('SELECT * FROM submissions ORDER BY created_at DESC');
  return rows.map(toSubmission);
}

async function getById(id) {
  const { rows } = await pool.query('SELECT * FROM submissions WHERE id = $1', [id]);
  return rows[0] ? toSubmission(rows[0]) : null;
}

async function insert(submission) {
  await pool.query(
    `INSERT INTO submissions
      (id, name, email, phone, position, message, resume_filename, resume_original_name, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      submission.id,
      submission.name,
      submission.email,
      submission.phone,
      submission.position,
      submission.message,
      submission.resumeFilename,
      submission.resumeOriginalName,
      submission.status,
      submission.createdAt,
    ]
  );
  return submission;
}

async function updateStatus(id, status) {
  const { rows } = await pool.query(
    'UPDATE submissions SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return rows[0] ? toSubmission(rows[0]) : null;
}

module.exports = { init, getAll, getById, insert, updateStatus };
