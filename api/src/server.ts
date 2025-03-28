import { app } from "./lib/express.js";

app.listen(process.env.PORT || 8000, () => {
  console.log(`Application start on port ${process.env.PORT || 8000}`);
});