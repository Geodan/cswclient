import express from 'express';
import { fetchGetCapabilities } from "../cswrequests.js";

const router = express.Router();

router.get('/csw_info', async (req, res) => {
  const url = req.query.url;
  const capabilities = await fetchGetCapabilities(url);
  res.json(capabilities);
});

export default router;