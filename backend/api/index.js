const app = require("../src/app");
const { connectDb } = require("../src/utils/connectDb");

let connPromise;

module.exports = async (req, res) => {
  if (!connPromise) connPromise = connectDb();
  await connPromise;
  return app(req, res);
};
