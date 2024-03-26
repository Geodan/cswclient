import express from 'express';
import { fetchGetCapabilities, fetchGetRecords } from "../cswrequests.js";

const router = express.Router();

router.get('/csw_records', async (req, res) => {
  const url = req.query.url;
  const type = req.query.type;
  const search = req.query.search;
  const startRecord = req.query.startRecord ? parseInt(req.query.startRecord) : 1;
  const capabilities = await fetchGetCapabilities(url);
  const getRecordsUrl = capabilities.operations.find(operation=>operation.name==='GetRecords')?.getUrls[0];
  const elementSetName = 'brief';
  let getRecords = await fetchGetRecords(getRecordsUrl, capabilities.serviceTypeVersion, elementSetName, startRecord, type, search);
  if (getRecords.error && getRecords.error.indexOf('status') > -1 && getRecords.error.indexOf('404') > -1) {
      getRecords = await fetchGetRecords(url, capabilities.serviceTypeVersion, elementSetName, startRecord, type, search);
  }
  if (getRecords.error) {
      console.error(`url: ${getRecordsUrl}, error: ${getRecords.error}`);
      res.json({error: getRecords.error});
  } else {
      res.json(getRecords);
  }
});

export default router;


