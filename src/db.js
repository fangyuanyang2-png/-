const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'submissions.json');

function load() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf-8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function save(submissions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), 'utf-8');
}

// Synchronous read-modify-write; Node's single-threaded event loop means
// no other request can interleave between load() and save() here since
// neither performs an async operation in between.
function getAll() {
  return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getById(id) {
  return load().find((s) => s.id === id) || null;
}

function insert(submission) {
  const submissions = load();
  submissions.push(submission);
  save(submissions);
  return submission;
}

function updateStatus(id, status) {
  const submissions = load();
  const target = submissions.find((s) => s.id === id);
  if (!target) return null;
  target.status = status;
  save(submissions);
  return target;
}

module.exports = { getAll, getById, insert, updateStatus };
