import { Handler } from "../utils/Handler.js";

const registeruser = Handler(async (req, res) => {
  res.status(200).send("Hello World")
});

export { registeruser };
