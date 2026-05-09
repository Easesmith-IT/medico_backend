// const bucket = require("../config/gcpStorage");

// const uploadFile = async (file) => {
//   return new Promise((resolve, reject) => {

//     const fileName = Date.now() + "-" + file.originalname;

//     const blob = bucket.file(fileName);

//     const blobStream = blob.createWriteStream({
//       resumable: false
//     });

//     blobStream.on("error", (err) => reject(err));

//     blobStream.on("finish", () => {
//       const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
//       resolve(publicUrl);
//     });

//     blobStream.end(file.buffer);
//   });
// };

// module.exports = uploadFile;


const fs = require("fs");
const path = require("path");
const bucket = require("../config/gcpStorage");

function safeFileName(name = "upload.bin") {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function writeLocalFallback(file) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const original = safeFileName(file?.originalname || "file.bin");
  const fileName = `${Date.now()}-${original}`;
  const absPath = path.join(uploadsDir, fileName);
  fs.writeFileSync(absPath, file.buffer || Buffer.from(""));
  return `/uploads/${fileName}`;
}

const uploadFile = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("No file buffer provided");
  }
  return new Promise((resolve, reject) => {

    const fileName = Date.now() + "-" + file.originalname;
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false
    });

    blobStream.on("error", async (err) => {
      try {
        const localUrl = await writeLocalFallback(file);
        resolve(localUrl);
      } catch {
        reject(err);
      }
    });

    blobStream.on("finish", () => {

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);

    });

    blobStream.end(file.buffer);
  });
};

module.exports = uploadFile;
