const User = require("../models/User");
const Role = require("../models/Role");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { username, email, password, mobile } = req.body;

  const userType = await Role.findOne({ userType: "User" });
  if (!userType) {
    return res.status(500).json({ message: "Default user role not found" });
  }
  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      userType: userType._id,
      mobile,
    });

    await user.save();
    const populatedUser = await User.findById(user._id).populate(
      "userType",
      "userType description permissionObject"
    );
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      token,
      user: {
        id: populatedUser._id,
        username: populatedUser.username,
        email: populatedUser.email,
        userType: populatedUser.userType,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userType } = req.body;
    const { _id } = req.params;

    const user = await User.findByIdAndUpdate(_id, { userType }, { new: true })
      .populate("userType", "name description permissionObject")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userObj = user.toObject();
    userObj.permissionObject = user.userType?.permissionObject || {};

    res.status(200).json(userObj);
  } catch (error) {
    console.error("Error updating user role:", error);
    res
      .status(500)
      .json({ message: "Server Error: Unable to update user role" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.protect = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

exports.currentUser = async (req, res) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: "Token is not valid" });
    }
    const user = await User.findById(userId).select("-password");
    const userType = await User.findById(userId)
      .populate("userType", "userType description permissionObject")
      .select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      ...user.toObject(),
      permissionObject: userType.userType?.permissionObject || {},
    });
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("userType", "_id userType")
      .select("-password");

    const usersWithPermissions = users.map((user) => {
      const userObj = user.toObject();
      return userObj;
    });

    res.status(200).json(usersWithPermissions);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Server Error: Unable to fetch users",
    });
  }
};
