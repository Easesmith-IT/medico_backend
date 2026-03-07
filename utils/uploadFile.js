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


const bucket = require("../config/gcpStorage");

const uploadFile = async (file) => {
  return new Promise((resolve, reject) => {

    const fileName = Date.now() + "-" + file.originalname;
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false
    });

    blobStream.on("error", (err) => reject(err));

    blobStream.on("finish", () => {

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);

    });

    blobStream.end(file.buffer);
  });
};

module.exports = uploadFile;