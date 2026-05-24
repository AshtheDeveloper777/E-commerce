const serverless = require('serverless-http');
const { app, initialize } = require('../server/app');

const handler = serverless(app);
let ready;

module.exports = async (req, res) => {
  if (!ready) ready = initialize();
  await ready;
  return handler(req, res);
};
