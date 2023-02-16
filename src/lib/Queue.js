const Queue = require('bull');
const fs = require('fs');

const ImageUploadJob = require('../jobs/ImageUploadJob');
const saveUserToGoogleSheetsJob = require('../jobs/saveUserToGoogleSheetsJob');
const updateUserJob = require('../jobs/updateUserJob');

const redisConfig = require('../lib/redis');

const uploadQueue = new Queue(ImageUploadJob.key, redisConfig);

const googleSheetQueue = new Queue(saveUserToGoogleSheetsJob.key, redisConfig);

const updateUserQueue = new Queue(updateUserJob.key, redisConfig);

const delay = 1000 * 20;

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
    googleSheetQueue.add({ userData: job.data.userData, hasImage: job.data.hasImage  }, { attempts: 3, backoff: delay });
})

uploadQueue.on('failed', (job) => {
    console.log('job failed', job.data);
})

googleSheetQueue.on('completed', (job) => {
    console.log('sheet completed');
})

googleSheetQueue.on('failed', (job) => {
    console.log('sheet failed');
})

updateUserQueue.on('completed', (job) => {
    console.log('user update complete', job.data);
})

updateUserQueue.on('failed', (job) => {
    console.log('job failed', job.data);
})


module.exports = { uploadQueue, googleSheetQueue, updateUserQueue };