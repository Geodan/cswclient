import { fetchGetCapabilities, fetchDescribeRecord } from "./cswrequests.js";
import { cswEndPoints } from "./endpoints.js";

let cswTestUrl = 'https://nationaalgeoregister.nl/geonetwork/srv/dut/csw-inspire';

// if arguments are provided, use them
if (process.argv.length > 2) {
    console.log(`using endpoint ${cswEndPoints[parseInt(process.argv[2])].name}`)
    cswTestUrl = cswEndPoints[parseInt(process.argv[2])].url;
}

const capabilities = await fetchGetCapabilities(cswTestUrl);
console.log(capabilities);

const describeRecord = await fetchDescribeRecord(cswTestUrl, capabilities.serviceTypeVersion);
console.log(describeRecord);
