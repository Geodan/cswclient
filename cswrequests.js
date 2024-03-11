import { parseXml, evaluateXPath } from "./parsexml.js";

const nodeValue = (nodes, index) => nodes[index] ? nodes[index].nodeValue : undefined;
const nodeArray = (nodes) => nodes?.length ? Array.from(nodes).map(node => node.nodeValue) : [];
const nodeExists = (nodes) => nodes?.length ? true : false;

// Function to fetch and parse the GetCapabilities response
export async function fetchGetCapabilities(url) {
    try {
        const response = await fetch(`${url}?service=CSW&request=GetCapabilities`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        
        const cswCapabilities = await parseXml(text);
        const serviceTitle = nodeValue(evaluateXPath(cswCapabilities, '//ows:ServiceIdentification/ows:Title/text()'), 0);
        const serviceAbstract = nodeValue(evaluateXPath(cswCapabilities, '//ows:ServiceIdentification/ows:Abstract/text()'), 0);
        const fees = nodeValue(evaluateXPath(cswCapabilities, '//ows:ServiceIdentification/ows:Fees/text()'), 0);
        const accessConstraints = nodeValue(evaluateXPath(cswCapabilities, '//ows:ServiceIdentification/ows:AccessConstraints/text()'), 0);
        const serviceType = nodeValue(evaluateXPath(cswCapabilities, '//ows:ServiceIdentification/ows:ServiceType/text()'), 0);
        const serviceTypeVersion = nodeValue(evaluateXPath(cswCapabilities, '//ows:ServiceIdentification/ows:ServiceTypeVersion/text()'), 0);
        const keywords = nodeArray(evaluateXPath(cswCapabilities, '//ows:ServiceIdentification/ows:Keywords/ows:Keyword/text()')); 
        const supportedISOQueryables = nodeArray(evaluateXPath(cswCapabilities, '//csw:Capabilities/ows:OperationsMetadata/ows:Operation[@name="GetRecords"]/ows:Constraint[@name="SupportedISOQueryables"]/ows:Value/text()'));
        const additionalQueryables = nodeArray(evaluateXPath(cswCapabilities, '//csw:Capabilities/ows:OperationsMetadata/ows:Operation[@name="GetRecords"]/ows:Constraint[@name="AdditionalQueryables"]/ows:Value/text()'));
        const geometryOperands = nodeArray(evaluateXPath(cswCapabilities, '//csw:Capabilities/ogc:Filter_Capabilities/ogc:Spatial_Capabilities/ogc:GeometryOperands/ogc:GeometryOperand/text()'));
        const spatialOperators = nodeArray(evaluateXPath(cswCapabilities, '//csw:Capabilities/ogc:Filter_Capabilities/ogc:Spatial_Capabilities/ogc:SpatialOperators/ogc:SpatialOperator/@name'));
        const comparisonOperators = nodeArray(evaluateXPath(cswCapabilities, '//csw:Capabilities/ogc:Filter_Capabilities/ogc:Scalar_Capabilities/ogc:ComparisonOperators/ogc:ComparisonOperator/text()'));
        const logicalOperators = nodeExists(evaluateXPath(cswCapabilities, '//csw:Capabilities/ogc:Filter_Capabilities/ogc:Scalar_Capabilities/ogc:LogicalOperators'));
        return {
            serviceTitle,
            serviceAbstract,
            fees,
            accessConstraints,
            serviceType,
            serviceTypeVersion,
            keywords,
            supportedISOQueryables,
            additionalQueryables,
            geometryOperands,
            spatialOperators,
            comparisonOperators,
            logicalOperators,
        };
    } catch (error) {
        console.error('Failed to fetch GetCapabilities:', error);
        return {
            error: error.message,
            serviceTitle: error.message,
        };
    }
}

function bareTypeName(recordTypeName) {
    if (recordTypeName && recordTypeName.length) {
        let result = recordTypeName[0];
        if (result.indexOf(':') > -1) {
            return result.split(':')[1];
        }
        return result;
    }
    return '';
}

export async function fetchDescribeRecord(url, cswVersion) {
    try {
        const paramKeys = ['service', 'request', 'version'];
        const preparedUrl = new URL(url);
        const params = preparedUrl.searchParams;
        params.forEach((value, key) => {
            if (paramKeys.includes(key.toLowerCase())) {
              params.delete(key);
            }
        });
        params.set('service', 'CSW');
        params.set('request', 'DescribeRecord');
        params.set('version', cswVersion);

        const response = await fetch(preparedUrl.href);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();

        
        
        const cswDescribeRecord = await parseXml(text, {});

        const briefRecordTypeName = bareTypeName(nodeArray(evaluateXPath(cswDescribeRecord, '//xs:element[@name="BriefRecord"]/@type')));
        const briefRecordType = nodeArray(evaluateXPath(cswDescribeRecord, `//xs:complexType[@name="${briefRecordTypeName}"]/xs:complexContent/xs:extension/xs:sequence/xs:element/@ref`));
        const summaryRecordTypeName = bareTypeName(nodeArray(evaluateXPath(cswDescribeRecord, '//xs:element[@name="SummaryRecord"]/@type')))
        const recordTypeName = bareTypeName(nodeArray(evaluateXPath(cswDescribeRecord, '//xs:element[@name="Record"]/@type')));

        const summaryRecord = {
            cswVersion,
            recordTypes: nodeArray(evaluateXPath(cswDescribeRecord, '//csw:DescribeRecordResponse/csw:SchemaComponent/xs:schema/xs:element/@name')),
            recordFields: nodeArray(evaluateXPath(cswDescribeRecord, '//xs:element[@name="Record"]/xs:complexType/xs:sequence/xs:element/@name')),
            summaryRecordFields: nodeArray(evaluateXPath(cswDescribeRecord, '//xs:element[@name="SummaryRecord"]/xs:complexType/xs:sequence/xs:element/@name')),
            briefRecordFields: briefRecordType
        };
        
        return {
            summaryRecord,
        };
    } catch (error) {
        console.error('Failed to fetch DescribeRecord:', error);
        return {
            error: error.message
        };
    }
}

