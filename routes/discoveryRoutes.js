const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createDiscovery,
  updateDiscovery,
  getDiscoveries,
  getMyDiscoveries,
  getDiscoveryById,
  deleteDiscovery,
  likeDiscovery,
  unlikeDiscovery,
  addComment,
  updateCommentOnDiscovery,
  deleteCommentOnDiscovery,
} = require("../controllers/discoveryController");

// Route to create a new discovery
router.post("/new", authMiddleware, createDiscovery);

// Route to update an existing discovery
router.put("/update/:id", authMiddleware, updateDiscovery);
router.get("/discoveries", getDiscoveries);
router.get("/my-discoveries", authMiddleware, getMyDiscoveries);
// Get a single discovery by ID
router.get("/discoveries/:id", getDiscoveryById);

// Delete a discovery by ID
router.delete("/discoveries/:id", authMiddleware, deleteDiscovery);

// Like a discovery
router.post("/:id/like", authMiddleware, likeDiscovery);

// Unlike a discovery
router.post("/:id/unlike", authMiddleware, unlikeDiscovery);

// Comment on a discovery
router.post("/discoveries/:id/comment", authMiddleware, addComment);

// Route to update a comment
router.put(
  "/discoveries/:discoveryId/comment/:commentId",
  authMiddleware,
  updateCommentOnDiscovery
);

// Route to delete a comment
router.delete(
  "/discoveries/:discoveryId/comment/:commentId",
  authMiddleware,
  deleteCommentOnDiscovery
);

module.exports = router;
