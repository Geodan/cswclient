import express from 'express';
import { translateStrings, translateSearchString } from '../translate.js';
const router = express.Router();

router.post('/translate', express.json(), async (req, res) => {
    const strings = req.body.strings;
    const language = req.body.language;
    const translatedStrings = await translateStrings(strings, language);
    res.json(translatedStrings);
  }  
);

router.get('/translateSearch', async (req, res) => {
  const searchString = req.query.searchString;
  const userLanguage = req.query.userLanguage;
  const targetLanguage = req.query.targetLanguage;
  const translatedString = await translateSearchString(searchString, userLanguage, targetLanguage);
  res.json(translatedString);
});

export default router;