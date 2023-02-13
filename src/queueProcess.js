require('dotenv').config();
const { uploadQueue , googleSheetQueue } = require('./lib/Queue');
const ImageUploadJob = require('./jobs/ImageUploadJob');
const saveUserToGoogleSheetsJob = require('./jobs/saveUserToGoogleSheetsJob');

uploadQueue.process(ImageUploadJob.handle);
googleSheetQueue.process(saveUserToGoogleSheetsJob.handle);

