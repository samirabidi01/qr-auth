import userModel from "../models/userModel.js";

// Get logged-in user profile
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
