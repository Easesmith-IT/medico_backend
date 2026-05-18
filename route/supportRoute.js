const express = require("express");
const { protect } = require("../middleware/auth");
const supportController = require("../controller/supportController");

const router = express.Router();

router.post("/tickets", protect("patient", "doctor", "admin", "superadmin", "subadmin", "serviceprovider"), supportController.createTicket);
router.get("/tickets/me", protect("patient", "doctor", "admin", "superadmin", "subadmin", "serviceprovider"), supportController.getMyTickets);
router.post("/tickets/:id/messages", protect("patient", "doctor", "admin", "superadmin", "subadmin", "serviceprovider"), supportController.addMessage);

module.exports = router;
