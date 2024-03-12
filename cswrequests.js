import { parseXml, evaluateXPath, getDCMITerms } from "./parsexml.js";

const nodeValue = (nodes, index) => nodes[index] ? nodes[index].nodeValue : undefined;
const nodeArray = (nodes) => nodes?.length ? Array.from(nodes).map(node => node.nodeValue) : [];
const nodeExists = (nodes) => nodes?.length ? true : false;

// Function to fetch and parse the GetCapabilities response
export async function fetchGetCapabilities(url) {
    try {
        const params = [
            {key: 'service', value: 'CSW'},
            {key: 'request', value: 'GetCapabilities'}
        ]
        const preparedUrl = prepareUrl(url, params);
        const response = await fetch(`${preparedUrl.href}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'JS CSW Client/0.1'
            }
        });
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
        const geometryOperands = nodeArray(evaluateXPath(cswCapabilities, '//csw:Capabilities/ogc:Filter_Capabilities/ogc:Spatial_Capabilities/ogc:GeometryOperands/ogc:GeometryOperand/text()'));
        const spatialOperators = nodeArray(evaluateXPath(cswCapabilities, '//csw:Capabilities/ogc:Filter_Capabilities/ogc:Spatial_Capabilities/ogc:SpatialOperators/ogc:SpatialOperator/@name'));
        const comparisonOperators = nodeArray(evaluateXPath(cswCapabilities, '//csw:Capabilities/ogc:Filter_Capabilities/ogc:Scalar_Capabilities/ogc:ComparisonOperators/ogc:ComparisonOperator/text()'));
        const logicalOperators = nodeExists(evaluateXPath(cswCapabilities, '//csw:Capabilities/ogc:Filter_Capabilities/ogc:Scalar_Capabilities/ogc:LogicalOperators'));
        const functionsNames = evaluateXPath(cswCapabilities, 
            '//csw:Capabilities/ogc:Filter_Capabilities/ogc:Scalar_Capabilities/ogc:ArithmeticOperators/ogc:Functions/ogc:FunctionNames/ogc:FunctionName').map(functionName => {
            return { name: functionName.textContent, arguments: functionName.getAttribute('nArgs')}
        });
        const idCapabilities = evaluateXPath(cswCapabilities, '//csw:Capabilities/ogc:Filter_Capabilities/ogc:Id_Capabilities/*').map(node => node.nodeName);
        const operations = evaluateXPath(cswCapabilities, '//ows:OperationsMetadata/ows:Operation').map(operation => {
            const name = operation.getAttribute('name');            
            const getUrls = nodeArray(evaluateXPath(operation, 'ows:DCP/ows:HTTP/ows:Get/@xlink:href'));
            const postUrls = nodeArray(evaluateXPath(operation, 'ows:DCP/ows:HTTP/ows:Post/@xlink:href'));
            const parameters = evaluateXPath(operation, 'ows:Parameter').map(parameter => {
                const name = parameter.getAttribute('name');
                const values = nodeArray(evaluateXPath(parameter, 'ows:Value/text()'));
                return { name, values };
            });
            if (name === 'GetRecords') {
                const constraint = evaluateXPath(operation, 'ows:Constraint').map(constraint => {
                    const name = constraint.getAttribute('name');
                    const values = nodeArray(evaluateXPath(constraint, 'ows:Value/text()'));
                    return { name, values };
                });
                return { name, getUrls, postUrls, parameters, constraint };
            }
            return { name, getUrls, postUrls, parameters };
        });

        return {
            serviceTitle,
            serviceAbstract,
            fees,
            accessConstraints,
            serviceType,
            serviceTypeVersion,
            keywords,
            operations,
            geometryOperands,
            spatialOperators,
            comparisonOperators,
            logicalOperators,
            functionsNames,
            idCapabilities
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

function prepareUrl(url, params) { // params is array of key-value pairs
    const preparedUrl = new URL(url);
    const searchParams = preparedUrl.searchParams;
    const keyNames = params.map(param=>param.key.toLowerCase());
    searchParams.forEach((_value, key) => {
        if (keyNames.includes(key.toLowerCase())) {
            searchParams.delete(key);
        }
    });
    params.forEach((param) => {
        searchParams.set(param.key, param.value);
    });
    return preparedUrl;
}

export async function fetchDescribeRecord(url, cswVersion) {
    try {
        const params = [
            {key: 'service', value: 'CSW'},
            {key: 'request', value: 'DescribeRecord'},
            {key: 'version', value: cswVersion},
        ]
        const preparedUrl = prepareUrl(url, params);

        const response = await fetch(preparedUrl.href, {
            method: 'GET',
            headers: {
                'User-Agent': 'JS CSW Client/0.1'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();

        const cswDescribeRecord = await parseXml(text, {});

        const briefRecordTypeName = bareTypeName(nodeArray(evaluateXPath(cswDescribeRecord, '//xs:element[@name="BriefRecord"]/@type')));
        const briefRecordType = nodeArray(evaluateXPath(cswDescribeRecord, `//xs:complexType[@name="${briefRecordTypeName}"]/xs:complexContent/xs:extension/xs:sequence/xs:element/@ref`));
        const summaryRecordTypeName = bareTypeName(nodeArray(evaluateXPath(cswDescribeRecord, '//xs:element[@name="SummaryRecord"]/@type')));
        const summaryRecordType = nodeArray(evaluateXPath(cswDescribeRecord, `//xs:complexType[@name="${summaryRecordTypeName}"]/xs:complexContent/xs:extension/xs:sequence/xs:element/@ref`));
        const recordTypeName = bareTypeName(nodeArray(evaluateXPath(cswDescribeRecord, '//xs:element[@name="Record"]/@type')));
        const recordType = nodeArray(evaluateXPath(cswDescribeRecord, `//xs:complexType[@name="${recordTypeName}"]/xs:complexContent/xs:extension/xs:sequence/xs:element/@ref`));
        const recordFields = recordType.map(field=>{return {name: field}});
        recordFields.push(...(await getDCMITerms()));

        const summaryRecord = {
            cswVersion,
            //recordTypes: nodeArray(evaluateXPath(cswDescribeRecord, '//csw:DescribeRecordResponse/csw:SchemaComponent/xs:schema/xs:element/@name')),
            recordFields: nodeArray(evaluateXPath(cswDescribeRecord, '//xs:element[@name="Record"]/xs:complexType/xs:sequence/xs:element/@name')),
            summaryRecordFields: nodeArray(evaluateXPath(cswDescribeRecord, '//xs:element[@name="SummaryRecord"]/xs:complexType/xs:sequence/xs:element/@name')),
            briefRecordFields: briefRecordType.map(field=>{return {name: field}}),
            summaryRecordFields: summaryRecordType.map(field=>{return {name: field}}),
            recordFields
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

function fetchRecordsXML(cswVersion, recordType, startPosition, maxRecords, constraint) {
    //return `<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ows="http://www.opengis.net/ows" outputSchema="http://www.opengis.net/cat/csw/2.0.2" outputFormat="application/xml" version="2.0.2" resultType="results" service="CSW" maxRecords="10" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd"><csw:Query typeNames="csw:Record"><csw:ElementSetName>summary</csw:ElementSetName><csw:Constraint version="1.1.0"><ogc:Filter><ogc:PropertyIsLike wildCard="*" singleChar="_" escapeChar="\\"><ogc:PropertyName>csw:AnyText</ogc:PropertyName><ogc:Literal>*None*</ogc:Literal></ogc:PropertyIsLike></ogc:Filter></csw:Constraint></csw:Query></csw:GetRecords>`
    return `<?xml version="1.0" encoding="UTF-8"?>
    <csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" service="CSW" version="${cswVersion}" resultType="results" startPosition="${startPosition}" maxRecords="${maxRecords}" xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dct="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
        <csw:Query typeNames="csw:Record">
            <csw:ElementSetName>full</csw:ElementSetName>
        </csw:Query>
    </csw:GetRecords>`
}

export async function fetchGetRecords(url, cswVersion, serviceSearch) {
    try {
        const params = []
        const preparedUrl = prepareUrl(url, params);
    
        const response = await fetch(preparedUrl.href, {
            method: 'POST',
            headers: {
                'User-Agent': 'JS CSW Client/0.1',
                'Content-Type': 'text/xml',
            },
            body: fetchRecordsXML(cswVersion, 'Record', 1, 10, '')
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        console.log(text);
        const cswRecords = await parseXml(text, {});
        return cswRecords;
    } catch (error) {
        console.error('Failed to fetch GetRecords:', error);
        return {
            error: error.message
        };
    }
}
