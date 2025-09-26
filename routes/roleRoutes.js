// routes/role.routes.js
const express = require("express");
const router = express.Router();
const { createRole, getRoles, updateRole } = require("../controllers/roleController");
const { get } = require("mongoose");

router.post("/", createRole);
router.get("/", getRoles);
router.put("/:id", updateRole);
module.exports = router;
