const { connectDb } = require("./utils/connectDb");
const app = require("./app");

const port = Number(process.env.PORT || 5000);

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  })
  .catch((e) => {
    console.error("Failed to start server:", e);
    process.exit(1);
  });
