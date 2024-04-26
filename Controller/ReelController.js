const ffmpegpath = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const moment = require('moment')
const fs = require('fs')

ffmpeg.setFfmpegPath(ffmpegpath)

const Jimp = require('jimp');
const fs = require('fs').promises;
const path = require('path');


async function uploadReel(req, res) {
    let status = 500
    let message = 'Oops something went wrong!'
    let inputs = req.body
    let outputPath = ''

    try {
        if (req.files.length > 0) {
            // await knex('posts').insert({
            //     caption: req.body.caption,
            //     type: 'video',
            //     media: "uploads/" + req.files[0].filename,
            //     created_by: req.user_data.id,
            //     created_at: dateTime()
            // })

            let preview_image = new Date().toISOString() + '.jpg'
            let share_image = new Date().toISOString() + '_processed.jpg'
            ffmpeg(path.join(process.cwd(), 'public', 'uploads', req.files[0].filename))
                .seekInput(2) // Seek to the specified time in seconds
                .frames(1) // Capture only one frame
                .on('end', async () => {
                    console.log('Preview image generated successfully');

                    // Open the image
                    const image = await Jimp.read(path.join(process.cwd(), 'public', 'uploads', preview_image));

                    // Load the logo image
                    const logo = await Jimp.read(path.join(process.cwd(), 'logo.png'));

                    // Define the desired width of the logo relative to the image width
                    const logoWidthPercentage = 0.2; // 20% of the image width

                    // Calculate the scaled width and height of the logo
                    const scaledLogoWidth = image.bitmap.width * logoWidthPercentage;
                    const scaledLogoHeight = (scaledLogoWidth / logo.bitmap.width) * logo.bitmap.height;

                    // Position the logo on the top right corner with some padding
                    const logoX = 10; // Adjust padding as needed
                    const logoY = 10; // Adjust padding as needed

                    // Resize the logo to the calculated dimensions
                    logo.resize(scaledLogoWidth, scaledLogoHeight);

                    // Composite the logo onto the image
                    image.composite(logo, logoX, logoY);

                    // Load the play video icon
                    const playButton = await Jimp.read(path.join(process.cwd(), 'playvideo.png'));

                    // Define the desired width and height of the play button
                    const desiredWidth = 100; // Adjust as needed
                    const desiredHeight = 100; // Adjust as needed

                    // Resize the play button icon
                    playButton.resize(desiredWidth, desiredHeight);

                    // Calculate the position to center the play button vertically and horizontally
                    const centerX = (image.bitmap.width - playButton.bitmap.width) / 2;
                    const centerY = (image.bitmap.height - playButton.bitmap.height) / 2;

                    // Composite the play button onto the image
                    image.composite(playButton, centerX, centerY);



                    const outputPath = path.join(process.cwd(), 'public', 'output',share_image )

                    // Save the modified image
                    await image.writeAsync(outputPath);
                    console.log(`Processed image: ${outputPath}`);




                })
                .on('error', (err) => {
                    console.error('Error generating preview image:', err);

                })
                .saveToFile(path.join(process.cwd(), 'public', 'uploads', preview_image));

            let new_name = new Date().toISOString() + '.m3u8'
            ffmpeg(path.join(process.cwd(), 'public', 'uploads', req.files[0].filename))
                .outputOptions([
                    '-c:v libx264', // Use H.264 codec
                    '-crf 23', // Adjusted Constant Rate Factor for better quality
                    '-preset medium', // Slower encoding preset for better quality
                    '-b:v 1000k', // Increased Bitrate for better quality
                    '-profile:v baseline',
                    '-level 3.0',
                    '-start_number 0',
                    '-hls_time 3', // segment duration in seconds
                    '-hls_list_size 0', // 0 means keep all segments
                    '-f hls', // output format
                ])
                .output(path.join(process.cwd(), 'public', 'videos', new_name))
                .on('end', async () => {
                    console.log(`Video compressed successfully: ${outputPath}`);
                    await knex('reels').insert({
                        type: 'video',
                        media: 'videos/' + new_name,
                        caption: inputs.caption,
                        created_by: inputs.user_id,
                        preview_image: 'uploads/' + preview_image,
                        share_image : 'output/' + share_image,
                        created_at: moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
                    }, 'id').then(create => {
                        if (create.length > 0) {
                            post_id = create[0]
                        }
                    })

                    fs.unlink(path.join(process.cwd(), 'public', 'uploads', req.files[0].filename), (err) => {
                        if (err) {

                        }
                    })

                    status = 200
                    message = "Post uploaded successfully!"

                    return res.json({ status, message, post_id })
                })
                .on('error', err => {
                    console.error('Error:', err);
                    return res.json({ status: 500, message: err.message });
                })
                .run();

            status = 200
            message = "Content uploaded successfully!"
        }
    } catch (error) {
        status = 500
        message = error.message
        return res.json({ status, message })
    }

}

async function ReelList(req, res) {
    let status = 500
    let message = 'Oops something went wrong!'
    let list = []
    const { current_user_id } = req.params;

    try {
        let offset = (req.query.page - 1) * 4
        list = await knex('reels').where('created_by', '!=', '2014').orderBy('id', 'desc').limit(4).offset(offset)
        console.log(current_user_id)
        for (let i = 0; i < list.length; i++) {
            const result = await knex('post_impressions').where('post_id', list[i].id).where('created_by', current_user_id).where('action', 'like')

            if (result.length > 0) {
                list[i]['has_liked'] = true
            } else {
                list[i]['has_liked'] = false
            }
        }

        status = 200
        message = 'Reels fetched successfully!'
    } catch (error) {
        status = 500
        message = error.message
    }

    return res.json({ status, message, list })

}

async function createPostImpression(req, res) {
    let status = 500;
    let message = "Oops Something went wrong";
    let inputs = req.body;
    let { id } = req.params
    let user_id = inputs.created_by
    let like = 0
    let comment = 0
    let comment_id = ''

    try {
        await knex('reels').where('id', id).then(async post_response => {
            if (post_response.length > 0) {
                like = post_response[0].like_count
                comment = post_response[0].comment_count


                if (inputs.action === "like") {

                    await knex("post_impressions").where("post_id", id).where("created_by", user_id).where("action", "like").then(async (response) => {

                        if (response.length > 0) {
                            await knex("post_impressions").where("post_id", id).where("created_by", user_id).where("action", "like").del().then(async (response1) => {

                                if (response1) {
                                    like = parseInt(like) - 1
                                    let update_data = {
                                        like_count: like,
                                        comment_count: comment
                                    }

                                    await knex('reels').where("id", id).update(update_data).then(response2 => {

                                        if (response2) {
                                            status = 200;
                                            message = "Impression Deleted Successfully"
                                        } else {
                                            status = 300;
                                            message = "Count Cannot Be Updated"
                                        }

                                    })
                                } else {
                                    status = 300;
                                    message = "Can't Delete The Impression"
                                }
                            })
                        } else {
                            let data = {
                                post_id: id,
                                action: inputs.action,
                                comment: inputs.comment ? inputs.comment : '',
                                created_by: user_id,
                                created_datetime: moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
                            }
                            await knex("post_impressions").insert(data).then(async (response2) => {
                                if (response2) {
                                    like = parseInt(like) + 1
                                    let update_data = {
                                        like_count: like,
                                        comment_count: comment
                                    }
                                    await knex('reels').where("id", id).update(update_data).then(async response2 => {
                                        if (response2) {
                                            status = 200;
                                            message = "Liked"
                                        } else {
                                            status = 300;
                                            message = "Count Cannot Be Updated"
                                        }
                                    })
                                } else {
                                    status = 300;
                                    message = "New Imperession Cannot Be Inseterted"
                                }
                            })
                        }
                    })
                } else {
                    let data = {
                        post_id: id,
                        action: inputs.action,
                        comment: inputs.comment ? inputs.comment : '',
                        created_by: user_id,
                        created_datetime: moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
                    }

                    await knex("post_impressions").insert(data, 'id').then(async (response2) => {

                        if (response2) {
                            comment_id = response2[0]
                            comment = parseInt(comment) + 1
                            let update_data = {
                                like_count: like,
                                comment_count: comment
                            }
                            await knex('reels').where("id", id).update(update_data).then(async response2 => {
                                if (response2) {
                                    status = 200;
                                    message = "Impression Inserted Successfully"
                                } else {
                                    status = 300;
                                    message = "Count Cannot Be Updated"
                                }
                            })
                        } else {
                            status = 300;
                            message = "New Imperession Cannot Be Inseterted"
                        }
                    })
                }
            }
        })
    } catch (error) {
        status = 500;
        message = error.message;
        console.log(error)
    }
    return res.json({ status, message, comment_id })
}

async function deleteReel(req, res) {
    let status = 500
    let message = 'Oops something went wrong!'
    const { reel_id, user_id } = req.params

    try {
        await knex('reels').where('id', reel_id).where('created_by', user_id).del().then(async response => {
            if (response) {
                await knex("post_impressions").where("post_id", reel_id).where("created_by", user_id).del()
            }
        })

        status = 200
        message = 'Reel deleted successfully!'
    } catch (error) {
        status = 500
        message = error.message
    }

    return res.json({ status, message })

}

async function viewReel(req, res) {
    let status = 500
    let message = 'Oops something went wrong!'

    const { reel_id } = req.params;

    try {
        await knex('reels').where('id', reel_id).then(async response => {
            if (response.length > 0) {
                await knex('reels').where('id', reel_id).update({
                    view_count: response[0].view_count + 1
                })
            }
        })

        status = 200
        message = 'Data fetched successfully!'
    } catch (error) {
        status = 500
        message = error.message
    }

    return res.json({ status, message })

}

async function getCommentByPostID(req, res) {
    let status = 500
    let message = 'Oops something went wrong!'
    let details = []
    const offset = (req.query.page - 1) * 10

    try {
        details = await knex('post_impressions').where('post_id', req.params.reel_id).where('action', 'comment').orderBy('id', 'desc').limit(10).offset(offset)

        status = 200
        message = "Comment fetched successfully!"
    } catch (error) {
        status = 500
        message = error.message
    }

    return res.json({ status, message, details })
}

async function getReelBasedUser(req, res) {
    let status = 500
    let message = 'Oops something went wrong!'
    let list = []

    try {
        list = await knex('reels').where('created_by', req.params.user_id).orderBy('id', 'desc').limit(5)
        for (let i = 0; i < list.length; i++) {
            const result = await knex('post_impressions').where('post_id', list[i].id).where('created_by', req.params.current_user_id).where('action', 'like')

            if (result.length > 0) {
                list[i]['has_liked'] = true
            } else {
                list[i]['has_liked'] = false
            }
        }

        status = 200
        message = 'Reels fetched successfully!'
    } catch (error) {
        status = 500
        message = error.message
    }

    return res.json({ status, message, list })

}

async function getOnboardingReel(req, res) {
    let status = 500
    let message = 'Oops something went wrong!'
    let list = []

    try {
        list = await knex('reels').where('created_by', '2014').orderBy('id', 'desc')
        status = 200
        message = 'Reels fetched successfully!'
    } catch (error) {
        status = 500
        message = error.message
    }

    return res.json({ status, message, list })
}

module.exports = {
    uploadReel,
    ReelList,
    createPostImpression,
    deleteReel,
    viewReel,
    getCommentByPostID,
    getReelBasedUser,
    getOnboardingReel
}