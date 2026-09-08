const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const storage = require('../storage');
const { requireAdmin } = require('../adminAuth');

const router = express.Router();

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
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
  upload.single('resume')(req, res, async (err) => {
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

    const ext = path.extname(req.file.originalname).toLowerCase();
    const resumeFilename = `${crypto.randomUUID()}${ext}`;

    try {
      await storage.saveFile(req.file.buffer, resumeFilename, req.file.mimetype);
    } catch (storageErr) {
      return res.status(500).json({ error: '简历文件保存失败' });
    }

    const submission = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      position: position ? position.trim() : '',
      message: message ? message.trim() : '',
      resumeFilename,
      resumeOriginalName: req.file.originalname,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    await db.insert(submission);
    res.status(201).json({ ok: true, id: submission.id });
  });
});

// 以下接口仅供招聘方(管理员)使用
router.get('/', requireAdmin, async (req, res) => {
  const submissions = (await db.getAll()).map((s) => ({
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

router.get('/:id/resume', requireAdmin, async (req, res) => {
  const submission = await db.getById(req.params.id);
  if (!submission) return res.status(404).json({ error: '记录不存在' });

  try {
    await storage.pipeFileToResponse(res, submission.resumeFilename, submission.resumeOriginalName);
  } catch (storageErr) {
    res.status(404).json({ error: '简历文件不存在' });
  }
});

const VALID_STATUSES = new Set(['new', 'reviewed', 'accepted', 'rejected']);

router.patch('/:id', requireAdmin, express.json(), async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  const updated = await db.updateStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: '记录不存在' });
  res.json({ ok: true });
});

module.exports = router;
