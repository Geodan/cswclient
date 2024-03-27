import express from 'express';
import { fetchGetCapabilities, fetchGetRecordById } from "../cswrequests.js";

const router = express.Router();

router.get('/csw_record_by_id', async (req, res) => {
  try {
    const url = req.query.url;
    const id = req.query.id;
    const capabilities = await fetchGetCapabilities(url);
    const getRecordByIdUrl = capabilities?.operations?.find(operation=>operation.name==='GetRecordById')?.getUrls[0];
    const elementSetName = 'full';
    let getRecordById = await fetchGetRecordById(getRecordByIdUrl, capabilities.serviceTypeVersion, elementSetName, id);
    if (getRecordById.error && getRecordById.error.indexOf('status') > -1 && getRecordById.error.indexOf('404') > -1) {
        getRecordById = await fetchGetRecordById(url, capabilities.serviceTypeVersion, elementSetName, id);
    }
    if (getRecordById.error) {
        console.error(`url: ${getRecordByIdUrl}, error: ${getRecordById.error}`);
        res.json({error: getRecordById.error});
    } else {
        res.json(getRecordById);
    }
  } catch (error) {
    console.error(`Error in csw_record_by_id: ${error.message?error.message: error}`);
    res.json({error: error.message?error.message: error});
  }
});

export default router;


