const fs = require('fs');
const moment = require('moment');
const ffmpegpath = require('ffmpeg-static')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')

ffmpeg.setFfmpegPath(ffmpegpath)
const Jimp = require('jimp');

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
    let share_image = new Date().toISOString() + '_processed.jpg'
    ffmpeg(path.join(process.cwd(), 'Videos', filename))
        .seekInput(2) // Seek to the specified time in seconds
        .frames(1) // Capture only one frame
        .on('end', async () => {
            console.log('Preview image generated successfully');

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
            const centerX = (image.bitmap.width - desiredWidth) / 2;
            const centerY = (image.bitmap.height - desiredHeight) / 2;

            // Composite the play button onto the image
            image.composite(playButton, centerX, centerY);



            const outputPath = path.join(process.cwd(), 'public', 'output', share_image)

            // Save the modified image
            await image.writeAsync(outputPath);
            console.log(`Processed image: ${outputPath}`);

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
                id: 100 + i + 1,
                type: 'video',
                media: 'videos/' + new_name,
                caption: caption,
                created_by: generateRandomNumber().toString(),
                preview_image: 'uploads/' + preview_image,
                share_image : 'output/' + share_image,
                created_at: moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
            })
        })
        .on('error', err => {
            console.error('Error:', err);
        })
        .run();
}