import express from 'express';
import { cswEndPoints } from '../endpoints.js'; 
const router = express.Router();

router.get('/csw_endpoints', (req, res) => {
  res.json(cswEndPoints);
});

export default router;


