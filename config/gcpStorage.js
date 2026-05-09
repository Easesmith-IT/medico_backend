// const { Storage } = require("@google-cloud/storage");
// const path = require("path");

// const storage = new Storage({
//   keyFilename: path.join(__dirname,"gcpbucket.json"),
// });

// const bucketName = "medico_health_tech";

// const bucket = storage.bucket(bucketName);

// module.exports = bucket;

// const { Storage } = require("@google-cloud/storage");
// const path = require("path");

// const storage = new Storage({
//   projectId: "extreme-ability-475608-c9", // from gcpbucket.json
//   keyFilename: path.join(__dirname, "gcpbucket.json"),
// });
const { Storage } = require("@google-cloud/storage");

function parseServiceAccount(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const credentials = parseServiceAccount(process.env.GCP_SERVICE_ACCOUNT);
const projectId = process.env.GCP_PROJECT_ID || credentials?.project_id;
const storageConfig = {};

if (credentials) {
  storageConfig.credentials = credentials;
}
if (projectId) {
  storageConfig.projectId = projectId;
}

let bucket = null;
try {
  const storage = new Storage(storageConfig);
  const bucketName = process.env.GCP_BUCKET_NAME || "medico_health_tech";
  bucket = storage.bucket(bucketName);
} catch {
  bucket = null;
}

module.exports = bucket;
