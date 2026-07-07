const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const LegalContent = require("../models/legalContentModel");

const DEFAULT_PRIVACY_HTML =
  "<p>Privacy policy content will be updated soon.</p>";

const DEFAULT_TERMS_HTML =
  "<p>Terms and conditions content will be updated soon.</p>";

const normalizeRole = (role = "") =>
  String(role || "")
    .toLowerCase()
    .replace(/[_\s]/g, "");

const normalizeAudience = (audience = "") => {
  const value = normalizeRole(audience);
  if (value === "serviceprovider") return "serviceProvider";
  if (["patient", "doctor"].includes(value)) return value;
  return "";
};

const isAdminRole = (role) =>
  ["admin", "superadmin", "subadmin"].includes(normalizeRole(role));

const getUserId = (req) => req.user?.id || req.user?._id || null;

const buildResponse = (doc) => ({
  id: doc._id,
  type: doc.type,
  audience: doc.audience,
  title: doc.title,
  contentHtml: doc.contentHtml,
  isActive: doc.isActive,
  lastUpdate: doc.updatedAt,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const findOrCreateLegalContent = async ({ type, audience, title, contentHtml }) =>
  LegalContent.findOneAndUpdate(
    { type, audience },
    {
      $setOnInsert: {
        type,
        audience,
        title,
        contentHtml,
        isActive: true,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

const getDefaultContent = (type) => {
  if (type === "privacyPolicy") {
    return {
      title: "Privacy Policy",
      contentHtml: DEFAULT_PRIVACY_HTML,
    };
  }

  return {
    title: "Terms & Conditions",
    contentHtml: DEFAULT_TERMS_HTML,
  };
};

const updateLegalContent = async ({ type, audience, body, req }) => {
  const { title, contentHtml, isActive } = body || {};

  const update = {};
  if (title !== undefined) {
    if (!String(title).trim()) {
      throw new AppError("title cannot be empty", 400);
    }
    update.title = String(title).trim();
  }

  if (contentHtml !== undefined) {
    if (!String(contentHtml).trim()) {
      throw new AppError("contentHtml cannot be empty", 400);
    }
    update.contentHtml = String(contentHtml);
  }

  if (isActive !== undefined) {
    update.isActive = Boolean(isActive);
  }

  if (!Object.keys(update).length) {
    throw new AppError("Please provide title, contentHtml or isActive to update", 400);
  }

  update.updatedBy = {
    userId: getUserId(req),
    role: req.user?.role || "",
  };

  const defaults = getDefaultContent(type);
  const setOnInsert = {
    type,
    audience,
  };
  if (update.title === undefined) {
    setOnInsert.title = defaults.title;
  }
  if (update.contentHtml === undefined) {
    setOnInsert.contentHtml = defaults.contentHtml;
  }

  return LegalContent.findOneAndUpdate(
    { type, audience },
    {
      $set: update,
      $setOnInsert: setOnInsert,
    },
    { upsert: true, new: true, runValidators: true }
  );
};

exports.getPrivacyPolicy = catchAsync(async (req, res) => {
  const policy = await findOrCreateLegalContent({
    type: "privacyPolicy",
    audience: "global",
    title: "Privacy Policy",
    contentHtml: DEFAULT_PRIVACY_HTML,
  });

  res.status(200).json({
    success: true,
    data: buildResponse(policy),
  });
});

exports.updatePrivacyPolicy = catchAsync(async (req, res, next) => {
  if (!isAdminRole(req.user?.role)) {
    return next(new AppError("Only admin users can update privacy policy", 403));
  }

  const policy = await updateLegalContent({
    type: "privacyPolicy",
    audience: "global",
    body: {
      title: req.body?.title || "Privacy Policy",
      contentHtml: req.body?.contentHtml,
      isActive: req.body?.isActive,
    },
    req,
  });

  res.status(200).json({
    success: true,
    message: "Privacy policy updated successfully",
    data: buildResponse(policy),
  });
});

exports.getTermsAndConditions = catchAsync(async (req, res, next) => {
  const audience = normalizeAudience(req.params.audience || req.query.audience);
  if (!audience) {
    return next(
      new AppError("Valid audience is required: patient, doctor or serviceProvider", 400)
    );
  }

  const terms = await findOrCreateLegalContent({
    type: "termsAndConditions",
    audience,
    title: "Terms & Conditions",
    contentHtml: DEFAULT_TERMS_HTML,
  });

  res.status(200).json({
    success: true,
    data: buildResponse(terms),
  });
});

exports.listTermsAndConditions = catchAsync(async (req, res) => {
  const docs = await Promise.all(
    ["patient", "doctor", "serviceProvider"].map((audience) =>
      findOrCreateLegalContent({
        type: "termsAndConditions",
        audience,
        title: "Terms & Conditions",
        contentHtml: DEFAULT_TERMS_HTML,
      })
    )
  );

  res.status(200).json({
    success: true,
    results: docs.length,
    data: docs.map(buildResponse),
  });
});

exports.updateTermsAndConditions = catchAsync(async (req, res, next) => {
  const audience = normalizeAudience(req.params.audience || req.body?.audience);
  if (!audience) {
    return next(
      new AppError("Valid audience is required: patient, doctor or serviceProvider", 400)
    );
  }

  const userRole = normalizeRole(req.user?.role);
  const userAudience = normalizeAudience(userRole);
  if (!isAdminRole(userRole) && userAudience !== audience) {
    return next(new AppError("You can update terms only for your own user type", 403));
  }

  const terms = await updateLegalContent({
    type: "termsAndConditions",
    audience,
    body: {
      title: req.body?.title || "Terms & Conditions",
      contentHtml: req.body?.contentHtml,
      isActive: req.body?.isActive,
    },
    req,
  });

  res.status(200).json({
    success: true,
    message: "Terms and conditions updated successfully",
    data: buildResponse(terms),
  });
});
