const express = require("express");
const { protect } = require("../middleware/auth");
const supportController = require("../controller/supportController");

const router = express.Router();

router.post("/createTicket", protect("patient", "doctor", "admin", "superadmin", "subadmin", "serviceprovider"), supportController.createTicket);
router.get("/getMyTickets", protect("patient", "doctor", "admin", "superadmin", "subadmin", "serviceprovider"), supportController.getMyTickets);
router.post("/addMessageTickets/:id", protect("patient", "doctor", "admin", "superadmin", "subadmin", "serviceprovider"), supportController.addMessage);

module.exports = router;
