const Queue = require('bull');
const fs = require('fs');

const ImageUploadJob = require('../jobs/ImageUploadJob');
const saveUserToGoogleSheetsJob = require('../jobs/saveUserToGoogleSheetsJob');
const updateUserJob = require('../jobs/updateUserJob');
const uploadImageToApiJob = require('../jobs/uploadImageToApiJob');

const redisConfig = require('../lib/redis');

const uploadQueue = new Queue(ImageUploadJob.key, redisConfig);

const googleSheetQueue = new Queue(saveUserToGoogleSheetsJob.key, redisConfig);

const updateUserQueue = new Queue(updateUserJob.key, redisConfig);

const uploadImageToApiQueue = new Queue(uploadImageToApiJob.key, redisConfig);

const delay = 1000 * 20;

uploadQueue.on('completed', (job) => {
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

uploadQueue.on('failed', (job, error) => {
    console.log(error);
    console.log('job failed', job.data);
})

googleSheetQueue.on('completed', (job) => {
    console.log('sheet completed');
})

googleSheetQueue.on('failed', (job, error) => {
    console.log('sheet failed', error.message);
})

updateUserQueue.on('completed', (job) => {
    console.log('user update complete');
    const images = job.data.images;
    if(images) {
        images.forEach((img) => {
            const userData = { id: job.data.id, image: img };
            uploadImageToApiQueue.add(userData, { attempts: 3, backoff: (1000 * 20) });
        });
    }
})

updateUserQueue.on('failed', (job, error) => {
    console.log('job failed', job.data);
})

uploadImageToApiQueue.on('completed', (job) => {
    console.log('upload to api completed!');
})

uploadImageToApiQueue.on('failed', (job, error) => {
    console.log(error);
    console.log('upload to api failed!');
})


module.exports = { uploadQueue, googleSheetQueue, updateUserQueue, uploadImageToApiQueue };