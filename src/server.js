const express = require('express');
const path = require('path');
const db = require('./db');
const submissionsRouter = require('./routes/submissions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api/submissions', submissionsRouter);

db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`简历投递系统已启动: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('数据库初始化失败:', err.message);
    process.exit(1);
  });
