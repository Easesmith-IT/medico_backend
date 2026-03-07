// const { Storage } = require("@google-cloud/storage");
// const path = require("path");

// const storage = new Storage({
//   keyFilename: path.join(__dirname,"gcpbucket.json"),
// });

// const bucketName = "medico_health_tech";

// const bucket = storage.bucket(bucketName);

// module.exports = bucket;

const { Storage } = require("@google-cloud/storage");
const path = require("path");

const storage = new Storage({
  projectId: "extreme-ability-475608-c9", // from gcpbucket.json
  keyFilename: path.join(__dirname, "gcpbucket.json"),
});

const bucketName = "medico_health_tech";

const bucket = storage.bucket(bucketName);

module.exports = bucket;