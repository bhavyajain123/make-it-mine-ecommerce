
const mongoose = require("mongoose");
const Address = require("../models/Address");
const validId = (id) => mongoose.isValidObjectId(id);
const allowedFields = [
  "fullName",
  "phone",
  "addressLine",
  "landmark",
  "city",
  "state",
  "postalCode",
  "country",
  "addressType",
  "isDefault",
];
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      user: req.user._id,
    }).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error.message);
    return res.status(500).json({
      message: "Unable to fetch addresses",
    });
  }
};
exports.createAddress = async (req, res) => {
  try {
    const data = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        data[field] = req.body[field];
      }
    }
    const requiredFields = [
      "fullName",
      "phone",
      "addressLine",
      "city",
      "state",
      "postalCode",
    ];

    for (const field of requiredFields) {
      if (
        typeof data[field] !== "string" ||
        !data[field].trim()
      ) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }
    }

    if (data.isDefault !== undefined && typeof data.isDefault !== "boolean") {
      return res.status(400).json({
        message: "isDefault must be true or false",
      });
    }
    if (data.isDefault === true) {
      await Address.updateMany(
        { user: req.user._id },
        { $set: { isDefault: false } }
      );
    } else {
      const existing = await Address.exists({
        user: req.user._id,
      });

      if (!existing) data.isDefault = true;
    }

    const address = await Address.create({
      ...data,
      user: req.user._id,
    });

    return res.status(201).json({
      message: "Address saved successfully",
      address,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
         message: error.message ,
        });
    }

    console.error("Create address error:", error.message);
    return res.status(500).json({
      message: "Unable to save address",
    });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id)) {
      return res.status(400).json({
        message: "Invalid address ID",
      });
    }
    const address = await Address.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (
      updates.isDefault !== undefined &&
      typeof updates.isDefault !== "boolean"
    ) {
      return res.status(400).json({
        message: "isDefault must be true or false",
      });
    }

    if (updates.isDefault === true) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }
    for (const [field, value] of Object.entries(updates)) {
      address.set(field, value);
    }

    await address.save();

    return res.status(200).json({
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
         message: error.message,
         });
    }
    console.error("Update address error:", error.message);
    return res.status(500).json({
      message: "Unable to update address",
    });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        message: "Invalid address ID",
      });
    }

    const address = await Address.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }
    if (address.isDefault) {
      const nextAddress = await Address.findOne({
        user: req.user._id,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete address error:", error.message);
    return res.status(500).json({
      message: "Unable to delete address",
    });
  }
};
