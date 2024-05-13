const Jimp = require('jimp');
const fs = require('fs').promises;
const path = require('path');

// Function to process each image
async function processImage(imagePath, outputPath,inputFile,OutputFile) {
    try {
        // Open the image
        const image = await Jimp.read(imagePath);

        // Load the logo image
        const logo = await Jimp.read(path.join(process.cwd(),'logo.png'));

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
        const playButton = await Jimp.read(path.join(process.cwd(),'playvideo.png'));

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

        // Save the modified image
        await image.writeAsync(outputPath);

        await knex('reels').where('preview_image',`uploads/${inputFile}`).update({
            share_image : `output/${OutputFile}`
        })
        console.log(`Processed image: ${outputPath}`);
    } catch (error) {
        console.error(`Error processing image ${imagePath}:`, error);
    }
}

// Function to process all images in the uploads folder
async function processImagesInFolder(req,res) {
    try {
        // Path to the uploads folder
        const folderPath = path.join(process.cwd(), 'public', 'uploads');

        // Read all files in the uploads folder
        const files = await fs.readdir(folderPath);

        // Filter out non-image files
        const imageFiles = files.filter(file => {
            const extension = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif'].includes(extension);
        });

        // Process each image
        for (const file of imageFiles) {
            const imagePath = path.join(folderPath, file);
            const outputPath = path.join(process.cwd(), 'public', 'output', `${file}_processed.jpg`);
            await processImage(imagePath, outputPath,file,`${file}_processed.jpg`);
        }
    } catch (error) {
        console.error('Error reading files from uploads folder:', error);
    }

    return res.send('data uploaded')
}

module.exports = {
    processImagesInFolder
}