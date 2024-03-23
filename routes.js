const express = require("express");
const router = express.Router();
const ReelController = require('./Controller/ReelController')

// upload reels
router.post('/upload-reel',ReelController.uploadReel)
router.get('/fetch-reels/:current_user_id',ReelController.ReelList)
router.post('/create-post-impression/:id/:post_created',ReelController.createPostImpression)


module.exports = router;