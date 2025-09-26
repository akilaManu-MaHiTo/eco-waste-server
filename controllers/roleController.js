const Role = require("../models/Role");

exports.createRole = async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      message: "Server Error: Unable to fetch roles",
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const role = await Role.findByIdAndUpdate(id, updates, { new: true });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
