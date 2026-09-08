const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const LOCAL_DIR = path.join(__dirname, '..', 'uploads');
const S3_BUCKET = process.env.S3_BUCKET;

const s3 = S3_BUCKET
  ? new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
      credentials: process.env.S3_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
    })
  : null;

async function saveFile(buffer, key, contentType) {
  if (s3) {
    await s3.send(
      new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: contentType })
    );
    return;
  }
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  fs.writeFileSync(path.join(LOCAL_DIR, key), buffer);
}

// Streams the stored file as an attachment download on the given response.
async function pipeFileToResponse(res, key, downloadName) {
  if (s3) {
    const object = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    if (object.ContentType) res.setHeader('Content-Type', object.ContentType);
    object.Body.pipe(res);
    return;
  }
  const filePath = path.join(LOCAL_DIR, key);
  if (!fs.existsSync(filePath)) throw new Error('文件不存在');
  res.download(filePath, downloadName);
}

module.exports = { saveFile, pipeFileToResponse, usingS3: !!s3 };
