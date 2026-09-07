const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');
const { requireAdmin } = require('../adminAuth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('仅支持 PDF / DOC / DOCX 格式的简历文件'));
    }
    cb(null, true);
  },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 求职者提交简历(公开接口)
router.post('/', (req, res) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || '上传失败' });
    }

    const { name, email, phone, position, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '姓名不能为空' });
    }
    if (!email || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: '请填写有效的邮箱地址' });
    }
    if (!req.file) {
      return res.status(400).json({ error: '请上传简历文件(PDF/DOC/DOCX)' });
    }

    const submission = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      position: position ? position.trim() : '',
      message: message ? message.trim() : '',
      resumeFilename: req.file.filename,
      resumeOriginalName: req.file.originalname,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    db.insert(submission);
    res.status(201).json({ ok: true, id: submission.id });
  });
});

// 以下接口仅供招聘方(管理员)使用
router.get('/', requireAdmin, (req, res) => {
  const submissions = db.getAll().map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    position: s.position,
    message: s.message,
    resumeOriginalName: s.resumeOriginalName,
    status: s.status,
    createdAt: s.createdAt,
  }));
  res.json(submissions);
});

router.get('/:id/resume', requireAdmin, (req, res) => {
  const submission = db.getById(req.params.id);
  if (!submission) return res.status(404).json({ error: '记录不存在' });

  const filePath = path.join(UPLOAD_DIR, submission.resumeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '简历文件不存在' });
  }
  res.download(filePath, submission.resumeOriginalName);
});

const VALID_STATUSES = new Set(['new', 'reviewed', 'accepted', 'rejected']);

router.patch('/:id', requireAdmin, express.json(), (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  const updated = db.updateStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: '记录不存在' });
  res.json({ ok: true });
});

module.exports = router;
