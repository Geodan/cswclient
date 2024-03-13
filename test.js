import { fetchGetCapabilities, fetchDescribeRecord, fetchGetRecords } from "./cswrequests.js";
import { cswEndPoints } from "./endpoints.js";

let cswTestUrl = 'https://nationaalgeoregister.nl/geonetwork/srv/dut/csw-inspire';

// if arguments are provided, use them
if (process.argv.length > 2) {
    console.log(`using endpoint ${cswEndPoints[parseInt(process.argv[2])].name}`)
    cswTestUrl = cswEndPoints[parseInt(process.argv[2])].url;
}

const capabilities = await fetchGetCapabilities(cswTestUrl);
console.log(capabilities);

let describeRecordUrl = capabilities.operations.find(operation=>operation.name==='DescribeRecord')?.getUrls[0];
let describeRecord = await fetchDescribeRecord(describeRecordUrl, capabilities.serviceTypeVersion);
if (describeRecord.error && describeRecord.error.indexOf('status') > -1 && describeRecord.error.indexOf('404') > -1) {
    describeRecord = await fetchDescribeRecord(cswTestUrl, capabilities.serviceTypeVersion);
}
console.log(describeRecord);

const getRecordsUrl = capabilities.operations.find(operation=>operation.name==='GetRecords')?.getUrls[0];
const elementSetName = 'brief';
let getRecords = await fetchGetRecords(getRecordsUrl, capabilities.serviceTypeVersion, elementSetName);
if (getRecords.error && getRecords.error.indexOf('status') > -1 && getRecords.error.indexOf('404') > -1) {
    getRecords = await fetchGetRecords(cswTestUrl, capabilities.serviceTypeVersion, elementSetName);
}
console.log(getRecords);
