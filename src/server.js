const express = require('express');
const path = require('path');
const fs = require('fs');
const submissionsRouter = require('./routes/submissions');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api/submissions', submissionsRouter);

app.listen(PORT, () => {
  console.log(`简历投递系统已启动: http://localhost:${PORT}`);
});
