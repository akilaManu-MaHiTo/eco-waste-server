const express = require("express");
const router = express.Router();
const {
  register,
  login,
  protect,
  currentUser,
  getUsers,
  updateUserRole,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/user", protect, currentUser);
router.get("/users", protect, getUsers);
router.put("/user-role/:_id", protect, updateUserRole);
router.get("/protected", protect, (req, res) => {
  res.json({
    message: `Welcome user ${req.user.id}, this is a protected route.`,
  });
});

module.exports = router;
