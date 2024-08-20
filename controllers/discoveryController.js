const Discovery = require("../models/Discovery");
const cloudinary = require("../cloudinaryConfig");
const upload = require("../multerCloudinary"); // Import multer configuration

const createDiscovery = async (req, res) => {
  try {
    const { userId, location, description, images } = req.body;

    const discovery = new Discovery({
      userId,
      location,
      description,
      images: images.map((imageUrl) => ({ url: imageUrl })), // Convert image URLs to the expected format
    });

    await discovery.save();
    res.status(201).json(discovery);
  } catch (error) {
    console.error("Error saving discovery:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a discovery
const updateDiscovery = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, description, images } = req.body;

    const updatedDiscovery = await Discovery.findByIdAndUpdate(
      id,
      {
        location,
        description,
        images: images.map((imageUrl) => ({ url: imageUrl })), // Convert image URLs to the expected format
      },
      { new: true, runValidators: true } // Ensure the updated document is returned and validation is run
    );

    if (!updatedDiscovery) {
      return res.status(404).json({ message: "Discovery not found" });
    }

    res.status(200).json(updatedDiscovery);
  } catch (error) {
    console.error("Error updating discovery:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all discoveries
const getDiscoveries = async (req, res) => {
  try {
    const discoveries = await Discovery.find()
      .populate("userId", "username")
      .populate("comments.userId", "username"); // Populate the user for comments as well
    res.status(200).json(discoveries);
  } catch (error) {
    console.error("Error fetching discoveries:", error);
    res.status(500).json({ message: "Error fetching discoveries", error });
  }
};

// Get all discoveries by the current user
const getMyDiscoveries = async (req, res) => {
  try {
    const userId = req.user._id;
    const discoveries = await Discovery.find({ userId })
      .populate("userId", "username")
      .populate("comments.userId", "username"); // Populate the user for comments as well

    res.status(200).json(discoveries);
  } catch (error) {
    console.error("Error fetching discoveries:", error);
    res.status(500).json({ message: "Error fetching discoveries", error });
  }
};

// Get a discovery by ID
const getDiscoveryById = async (req, res) => {
  try {
    const discovery = await Discovery.findById(req.params.id)
      .populate("userId", "username")
      .populate("comments.userId", "username"); // Populate the user for comments as well

    if (!discovery) {
      return res.status(404).json({ message: "Discovery not found" });
    }

    res.status(200).json(discovery);
  } catch (error) {
    console.error("Error fetching discovery:", error);
    res.status(500).json({ message: "Error fetching discovery", error });
  }
};

// Delete a discovery
const deleteDiscovery = async (req, res) => {
  try {
    const discovery = await Discovery.findById(req.params.id);

    if (!discovery) {
      return res.status(404).json({ message: "Discovery not found" });
    }

    // Check if the user owns the discovery
    if (discovery.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this discovery" });
    }

    await discovery.deleteOne();
    res.status(200).json({ message: "Discovery deleted successfully" });
  } catch (error) {
    console.error("Error deleting discovery:", error);
    res.status(500).json({ message: "Error deleting discovery", error });
  }
};

// Like a discovery
const likeDiscovery = async (req, res) => {
  try {
    const discovery = await Discovery.findById(req.params.id);
    if (!discovery) {
      return res.status(404).json({ message: "Discovery not found" });
    }

    if (discovery.likes.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You already liked this discovery" });
    }

    discovery.likes.push(req.user._id);
    await discovery.save();

    res.json({ isLiked: true });
  } catch (error) {
    res.status(500).json({ message: "Error liking discovery", error });
  }
};

// Unlike a discovery
const unlikeDiscovery = async (req, res) => {
  try {
    const discovery = await Discovery.findById(req.params.id);
    if (!discovery) {
      return res.status(404).json({ message: "Discovery not found" });
    }

    if (!discovery.likes.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You have not liked this discovery" });
    }

    discovery.likes = discovery.likes.filter(
      (like) => like.toString() !== req.user._id.toString()
    );
    await discovery.save();

    res.json({ isLiked: false });
  } catch (error) {
    res.status(500).json({ message: "Error unliking discovery", error });
  }
};

// Add a comment to a discovery
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const discovery = await Discovery.findById(id);
    if (!discovery) {
      return res.status(404).json({ message: "Discovery not found" });
    }

    const comment = {
      text,
      userId: req.user._id, // Ensure the user is authenticated
      createdAt: new Date(),
    };

    discovery.comments.push(comment);
    await discovery.save();

    res.status(201).json({ comment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a comment on a discovery
const updateCommentOnDiscovery = async (req, res) => {
  const { text } = req.body;
  const { discoveryId, commentId } = req.params;

  try {
    const discovery = await Discovery.findById(discoveryId);

    if (!discovery) {
      return res.status(404).json({ message: "Discovery not found" });
    }

    const comment = discovery.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user owns the comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this comment" });
    }

    comment.text = text; // Update the comment text
    await discovery.save();

    res.status(200).json({ message: "Comment updated successfully", comment });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a comment on a discovery
const deleteCommentOnDiscovery = async (req, res) => {
  try {
    const discoveryId = req.params.discoveryId;
    const commentId = req.params.commentId;

    // Find the discovery by ID
    const discovery = await Discovery.findById(discoveryId);

    if (!discovery) {
      return res.status(404).json({ message: "Discovery not found" });
    }

    // Pull the comment from the comments array
    discovery.comments.pull({ _id: commentId });

    // Save the updated discovery
    await discovery.save();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createDiscovery,
  getDiscoveries,
  getMyDiscoveries,
  getDiscoveryById,
  updateDiscovery,
  deleteDiscovery,
  likeDiscovery,
  unlikeDiscovery,
  addComment,
  updateCommentOnDiscovery,
  deleteCommentOnDiscovery,
};
