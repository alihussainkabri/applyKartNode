const ffmpegpath = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const moment = require('moment')
const fs = require('fs')

ffmpeg.setFfmpegPath(ffmpegpath)


async function uploadReel(req,res){
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
            ffmpeg(path.join(process.cwd(), 'public', 'uploads', req.files[0].filename))
                .seekInput(2) // Seek to the specified time in seconds
                .frames(1) // Capture only one frame
                .on('end', () => {
                    console.log('Preview image generated successfully');
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
                    '-b:v 1500k', // Increased Bitrate for better quality
                    '-profile:v baseline',
                    '-level 3.0',
                    '-start_number 0',
                    '-hls_time 6', // segment duration in seconds
                    '-hls_list_size 0', // 0 means keep all segments
                    '-f hls', // output format
                ])
                .output(path.join(process.cwd(), 'public', 'videos', new_name))
                .on('end', async () => {
                    console.log(`Video compressed successfully: ${outputPath}`);
                    await knex('reels').insert({
                        type: 'video',
                        media: 'videos/' + new_name,
                        created_by: inputs.user_id,
                        preview_image: 'uploads/' + preview_image,
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
    }

    return res.json({status,message})
}

async function ReelList(req,res){
    let status = 500
    let message = 'Oops something went wrong!'
    let list = []
    const {current_user_id} = req.params;

    try {
        let offset = (req.query.page - 1) * 8 
        list = await knex('reels').orderBy('id','desc').limit(8).offset(offset)
        console.log(current_user_id)
        for (let i=0;i<list.length;i++){
            const result =  await knex('post_impressions').where('post_id',list[i].id).where('created_by',current_user_id)
            
            if (result.length > 0){
                list[i]['has_liked'] = true
            }else{
                list[i]['has_liked'] = false
            }
        }

        status = 200
        message = 'Reels fetched successfully!'
    } catch (error) {
        status = 500
        message = error.message
    }

    return res.json({status,message,list})

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
                        created_by: req.user_data.id,
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
    }
    return res.json({ status, message, comment_id })
}

module.exports = {
    uploadReel,
    ReelList,
    createPostImpression
}