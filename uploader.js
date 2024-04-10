const fs = require('fs');
const moment = require('moment');
const ffmpegpath = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')

ffmpeg.setFfmpegPath(ffmpegpath)

// Read the text file
const textFile = fs.readFileSync('inputs.txt', 'utf8');

// Split the text file into an array of strings by new line
const array = textFile.split('\n');

const cleanedArray = array.map(str => str.trim().replace(/^[0-9.]+\s*/, ''));


// console.log(cleanedArray);

const hashtagfile = fs.readFileSync('hashtag.txt', 'utf8');
const hashtags = hashtagfile.split('\n');

const arr3 = cleanedArray.map((val, index) => val + ' ' + hashtags[index]);

console.log(arr3)

let updated_db = []

function appendArr(item) {
    updated_db.push(item)

    if (updated_db.length > 99) {
        const jsonData = JSON.stringify(updated_db);
        fs.writeFile('output.json', jsonData, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Array has been written to output.json');
            }
        });
    }
}


function generateRandomNumber() {
    return Math.floor(Math.random() * (3459 - 2016 + 1)) + 2016;
}

for (let i = 0; i < arr3.length; i++) {
    let filename = `${100 + i + 1}.mp4`
    let caption = arr3[i]

    let preview_image = new Date().toISOString() + '.jpg'
    ffmpeg(path.join(process.cwd(), 'Videos', filename))
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
    ffmpeg(path.join(process.cwd(), 'Videos', filename))
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
            // console.log(`Video compressed successfully: ${outputPath}`);

            appendArr({
                id: 100 +i + 1,
                type: 'video',
                media: 'videos/' + new_name,
                caption: caption,
                created_by: generateRandomNumber().toString(),
                preview_image: 'uploads/' + preview_image,
                created_at: moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
            })
        })
        .on('error', err => {
            console.error('Error:', err);
        })
        .run();
}