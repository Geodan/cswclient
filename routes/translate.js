import express from 'express';
import { translateStrings } from '../translate.js';
const router = express.Router();

router.post('/translate', express.json(), async (req, res) => {
    const strings = req.body.strings;
    const language = req.body.language;
    const translatedStrings = await translateStrings(strings, language);
    res.json(translatedStrings);
  }  
);

export default router;