require('dotenv').config();
const { uploadQueue , googleSheetQueue, updateUserQueue, uploadImageToApiQueue  } = require('./lib/Queue');
const ImageUploadJob = require('./jobs/ImageUploadJob');
const saveUserToGoogleSheetsJob = require('./jobs/saveUserToGoogleSheetsJob');
const updateUserJob = require('./jobs/updateUserJob');
const uploadImageToApiJob = require('./jobs/uploadImageToApiJob');

uploadQueue.process(ImageUploadJob.handle);
googleSheetQueue.process(saveUserToGoogleSheetsJob.handle);
updateUserQueue.process(updateUserJob.handle);
uploadImageToApiQueue.process(uploadImageToApiJob.handle);

