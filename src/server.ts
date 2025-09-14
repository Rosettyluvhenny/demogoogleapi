declare const process: any;
import express from "express";
import createRoute from "./routes/create";
import submitRoute from "./routes/submit";
import healthRoute from "./routes/health";

const app = express();
app.use(express.json());
app.use(createRoute);
app.use(submitRoute);
app.use(healthRoute);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
