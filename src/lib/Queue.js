const Queue = require('bull');
const fs = require('fs');

const ImageUploadJob = require('../jobs/ImageUploadJob');
const saveUserToGoogleSheetsJob = require('../jobs/saveUserToGoogleSheetsJob');

const redisConfig = require('../lib/redis');

const uploadQueue = new Queue(ImageUploadJob.key, redisConfig);

const googleSheetQueue = new Queue(saveUserToGoogleSheetsJob.key, redisConfig);

uploadQueue.on('failed', (job) => {
    console.log('job failed', job.data);
})

uploadQueue.on('completed', async (job) => {
    job.data.fileInfo.files.forEach(file => {
        fs.unlink(file.path, (error) => {
            if (error) { 
                console.error(error);
                return;
            }            
          });
    });
    console.log('upload completed');
    googleSheetQueue.add({ userData: job.data.userData, hasImage: job.data.hasImage  });
})

googleSheetQueue.on('completed', (job) => {
    // console.log('sheet completed', job);
})

module.exports = { uploadQueue, googleSheetQueue };