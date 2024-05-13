const express = require("express");
const router = express.Router();
const ReelController = require('./Controller/ReelController')
const ImageProcessController = require('./Controller/ImageProcessController')
const UserController = require('./Controller/UserController')

// upload reels
router.post('/upload-reel',ReelController.uploadReel)
router.get('/fetch-reels/:current_user_id',ReelController.ReelList)
router.post('/create-post-impression/:id/:post_created',ReelController.createPostImpression)
router.get('/delete-reel/:reel_id/:user_id',ReelController.deleteReel)
router.get('/view-reel/:reel_id',ReelController.viewReel)
router.get('/get-post-comment/:reel_id',ReelController.getCommentByPostID)
router.get('/get-reel-based-user/:current_user_id/:user_id',ReelController.getReelBasedUser)
router.get('/get-onboarding-reels',ReelController.getOnboardingReel)

// account delete routes
router.get('/delete-account/:user_id',UserController.deleteAccount)

// image processor
router.get('/process-images',ImageProcessController.processImagesInFolder)


module.exports = router;