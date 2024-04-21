import express from 'express';
import { fetchGetCapabilities, fetchGetRecords } from "../cswrequests.js";
import { getValidatedBbox } from '../public/bboxvalidator.js';

const router = express.Router();

router.get('/csw_records', async (req, res) => {
  try {
    const url = req.query.url;
    const type = req.query.type;
    const search = req.query.search;
    const bbox = getValidatedBbox(req.query.bbox);
    const startRecord = req.query.startRecord ? parseInt(req.query.startRecord) : 1;
    const capabilities = await fetchGetCapabilities(url);
    const getRecordsUrl = capabilities?.operations?.find(operation=>operation.name==='GetRecords')?.getUrls[0];
    const elementSetName = 'brief';
    let getRecords = await fetchGetRecords(getRecordsUrl, capabilities.serviceTypeVersion, elementSetName, startRecord, type, search, bbox);
    if (getRecords.error && getRecords.error.indexOf('status') > -1 && getRecords.error.indexOf('404') > -1) {
        getRecords = await fetchGetRecords(url, capabilities.serviceTypeVersion, elementSetName, startRecord, type, search, bbox)
    }
    if (getRecords.error) {
        console.error(`url: ${getRecordsUrl}, error: ${getRecords.error}`);
        res.json({error: getRecords.error});
    } else {
        res.json(getRecords);
    }
  } catch (error) {
    console.error(`Error in csw_records: ${error.message?error.message: error}`);
    res.json({error: error.message?error.message: error});
  }
});

export default router;


