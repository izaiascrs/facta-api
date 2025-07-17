require("dotenv").config();
const {
  uploadQueue,
  googleSheetQueue,
  updateUserQueue,
  uploadImageToApiQueue,
  proposalStatusMessageQueue,
  scheduleMessageQueue,
} = require("./lib/Queue");

const ImageUploadJob = require("./jobs/ImageUploadJob");
const saveUserToGoogleSheetsJob = require("./jobs/saveUserToGoogleSheetsJob");
const updateUserJob = require("./jobs/updateUserJob");
const uploadImageToApiJob = require("./jobs/uploadImageToApiJob");
const proposalStatusMessageJob = require("./jobs/proposalStatusMessageJob");
const scheduleMessageJob = require("./jobs/scheduleMessageJob");

uploadQueue.process(ImageUploadJob.handle);
googleSheetQueue.process(saveUserToGoogleSheetsJob.handle);
updateUserQueue.process(updateUserJob.handle);
uploadImageToApiQueue.process(uploadImageToApiJob.handle);
proposalStatusMessageQueue.process(proposalStatusMessageJob.handle);
scheduleMessageQueue.process(scheduleMessageJob.handle);
