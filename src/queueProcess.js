require('dotenv').config();
const { uploadQueue , googleSheetQueue, updateUserQueue } = require('./lib/Queue');
const ImageUploadJob = require('./jobs/ImageUploadJob');
const saveUserToGoogleSheetsJob = require('./jobs/saveUserToGoogleSheetsJob');
const updateUserJob = require('./jobs/updateUserJob');

uploadQueue.process(ImageUploadJob.handle);
googleSheetQueue.process(saveUserToGoogleSheetsJob.handle);
updateUserQueue.process(updateUserJob.handle);

