const Queue = require('bull');
const fs = require('fs');

const ImageUploadJob = require('../jobs/ImageUploadJob');
const saveUserToGoogleSheetsJob = require('../jobs/saveUserToGoogleSheetsJob');
const updateUserJob = require('../jobs/updateUserJob');

const redisConfig = require('../lib/redis');

const uploadQueue = new Queue(ImageUploadJob.key, redisConfig);

const googleSheetQueue = new Queue(saveUserToGoogleSheetsJob.key, redisConfig);

const updateUserQueue = new Queue(updateUserJob.key, redisConfig);

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

uploadQueue.on('failed', (job) => {
    console.log('job failed', job.data);
})

googleSheetQueue.on('completed', (job) => {
    console.log('sheet completed', job.data);
})

googleSheetQueue.on('failed', (job) => {
    console.log('sheet failed', job.data);
})

updateUserQueue.on('completed', (job) => {
    console.log('user update complete', job.data);
})

updateUserQueue.on('failed', (job) => {
    console.log('job failed', job.data);
})


module.exports = { uploadQueue, googleSheetQueue, updateUserQueue };