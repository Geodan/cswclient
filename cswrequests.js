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
        const contact = evaluateXPath(cswCapabilities, '//ows:ServiceProvider/ows:ServiceContact').map(node => {
            return {
                name: nodeValue(evaluateXPath(node, 'ows:IndividualName/text()'), 0),
                position: nodeValue(evaluateXPath(node, 'ows:PositionName/text()'), 0),
                organization: nodeValue(evaluateXPath(node, 'ows:ProviderName/text()'), 0),
                phone: nodeValue(evaluateXPath(node, 'ows:Phone/ows:Voice/text()'), 0),
                fax: nodeValue(evaluateXPath(node, 'ows:Phone/ows:Facsimile/text()'), 0),
                email: nodeValue(evaluateXPath(node, 'ows:Address/ows:ElectronicMailAddress/text()'), 0),
                address: evaluateXPath(node, 'ows:Address/ows:DeliveryPoint/text()').map(deliveryPoint => {
                    return { address: deliveryPoint.textContent };
                }),
                city: nodeValue(evaluateXPath(node, 'ows:Address/ows:City/text()'), 0),
                postalCode: nodeValue(evaluateXPath(node, 'ows:Address/ows:PostalCode/text()'), 0),
                country: nodeValue(evaluateXPath(node, 'ows:Address/ows:Country/text()'), 0),
                hours: nodeValue(evaluateXPath(node, 'ows:HoursOfService/text()'), 0),
                instructions: nodeValue(evaluateXPath(node, 'ows:ContactInstructions/text()'), 0),
                role: nodeValue(evaluateXPath(node, 'ows:Role/text()'), 0),
                contactInfo: evaluateXPath(node, 'ows:ContactInfo').map(contactInfo => {
                    return {
                        phone: nodeValue(evaluateXPath(contactInfo, 'ows:Phone/ows:Voice/text()'), 0),
                        fax: nodeValue(evaluateXPath(contactInfo, 'ows:Phone/ows:Facsimile/text()'), 0),
                        email: nodeValue(evaluateXPath(contactInfo, 'ows:Address/ows:ElectronicMailAddress/text()'), 0),
                        address: evaluateXPath(contactInfo, 'ows:Address/ows:DeliveryPoint/text()').map(deliveryPoint => {
                            return { address: deliveryPoint.textContent };
                        }),
                        city: nodeValue(evaluateXPath(contactInfo, 'ows:Address/ows:City/text()'), 0),
                        postalCode: nodeValue(evaluateXPath(contactInfo, 'ows:Address/ows:PostalCode/text()'), 0),
                        country: nodeValue(evaluateXPath(contactInfo, 'ows:Address/ows:Country/text()'), 0),
                        hours: nodeValue(evaluateXPath(contactInfo, 'ows:HoursOfService/text()'), 0),
                        instructions: nodeValue(evaluateXPath(contactInfo, 'ows:ContactInstructions/text()'), 0),
                    }
                })
            }
        });
        if (contact.length === 0) {
            contact = undefined;
        } else {
            for (const item of contact) {
                if (item.address?.length === 0) {
                    item.address = undefined;
                }
                if (item.contactInfo) {
                    if (item.contactInfo.length === 0) {
                        item.contactInfo = undefined;
                    } else {
                        for (const info of item.contactInfo) {
                            if (info.address?.length === 0) {
                                info.address = undefined;
                            }
                        }
                    }
                }
            }
        }
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
            contact,
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

        const cswDescribeRecord = await parseXml(text);

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

function deduplicateArray(array) {
    return [...new Set(array)];
}

function parseRecordXML(record) {
    let hasBoundingBox = false;
    let hasURI = false;
    let hasReferences = false;
    const result = {};
    // get the list of all the fields in the record
    const recordFields = Array.from(record.childNodes).filter(child=>child.nodeType === 1).map(child=>child.nodeName);
    for (const recordField of recordFields) {
        const localFieldName = recordField.split(':').pop();
        if (localFieldName === 'BoundingBox') {
            hasBoundingBox = true;
            continue;
        }
        if (localFieldName === 'URI') {
            hasURI = true;
            continue;
        }
        if (localFieldName === 'references') {
            hasReferences = true;
            continue;
        }
        if (!(localFieldName in result)) {
            const values = evaluateXPath(record, `./${recordField}/text()`);
            if (values.length > 1) {
                result[localFieldName] = deduplicateArray(values.map(value => value.nodeValue));
            } else {
                result[localFieldName] = nodeValue(values, 0);
            }
        }
    }
    if (hasBoundingBox) {
        result.bbox  = evaluateXPath(record, 'ows:BoundingBox').map(bbox => {
            const result = {
                crs: bbox.getAttribute('crs'),
                lowerCorner: nodeValue(evaluateXPath(bbox, 'ows:LowerCorner/text()'), 0),
                upperCorner: nodeValue(evaluateXPath(bbox, 'ows:UpperCorner/text()'), 0),
            }
            if (result.lowerCorner && result.upperCorner){
                result.extent = result.lowerCorner.split(' ').concat(result.upperCorner.split(' ')).map(parseFloat);
            }
            if (result.crs && result.crs.indexOf('EPSG') > -1 && result.crs.indexOf(':') > -1) {
                result.epsgcode = parseInt(result.crs.split(':').pop());
            }
            return result;
        })[0];
    }
    if (hasURI) {
        result.URI = evaluateXPath(record, 'dc:URI').map(uri => {
            const obj = {};
            const attributes = Array.from(uri.attributes);
            for (let attr of attributes) {
                obj[attr.name] = attr.value;
            }
            const url = uri.textContent;
            if (url) {
                obj.url = url;
            }
            return obj;
        });
    }
    if (hasReferences) {
        result.URI = evaluateXPath(record, 'dct:references').map(uri => {
            const obj = {};
            const attributes = Array.from(uri.attributes);
            for (let attr of attributes) {
                obj[attr.name] = attr.value;
            }
            const url = uri.textContent;
            if (url) {
                obj.url = url;
            }
            return obj;
        });
    }
    return result;
}

function fetchRecordsXML(cswVersion, elementSetName, startPosition, maxRecords, constraint) {
    //return `<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ows="http://www.opengis.net/ows" outputSchema="http://www.opengis.net/cat/csw/2.0.2" outputFormat="application/xml" version="2.0.2" resultType="results" service="CSW" maxRecords="10" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd"><csw:Query typeNames="csw:Record"><csw:ElementSetName>summary</csw:ElementSetName><csw:Constraint version="1.1.0"><ogc:Filter><ogc:PropertyIsLike wildCard="*" singleChar="_" escapeChar="\\"><ogc:PropertyName>csw:AnyText</ogc:PropertyName><ogc:Literal>*None*</ogc:Literal></ogc:PropertyIsLike></ogc:Filter></csw:Constraint></csw:Query></csw:GetRecords>`
    return `<?xml version="1.0" encoding="UTF-8"?>
    <csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" service="CSW" version="${cswVersion}" resultType="results" startPosition="${startPosition}" maxRecords="${maxRecords}" outputSchema="http://www.opengis.net/cat/csw/2.0.2" outputFormat="application/xml"
        xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dct="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
        <csw:Query typeNames="csw:Record">
            <csw:ElementSetName>${elementSetName}</csw:ElementSetName>
            ${constraint}
        </csw:Query>
    </csw:GetRecords>`
}

export async function fetchGetRecords(url, cswVersion, elementSetName, startRecord, typeSearch, allSearch, bbox) {
    try {
        const params = []
        const preparedUrl = prepareUrl(url, params);
        let xmlExpression = ''
        let expressionCount = 0;
        let xmlConstraint = '';
        let typeExpression = '';
        if (typeSearch && typeSearch.trim().length) {
            typeExpression = `
                <ogc:PropertyIsEqualTo>
                    <ogc:PropertyName>dc:Type</ogc:PropertyName>
                    <ogc:Literal>${typeSearch.trim()}</ogc:Literal>
                </ogc:PropertyIsEqualTo>
            `;
            expressionCount++;
        }
        let bboxExpression = '';
        if (bbox && bbox.trim().length) {
            const bboxParts = bbox.split(',');
            if (bboxParts.length === 4) {
                bboxExpression = `
                    <ogc:BBOX>
                        <ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>
                        <gml:Envelope srsName="urn:ogc:def:crs:EPSG::4326">
                            <gml:lowerCorner>${bboxParts[1]} ${bboxParts[0]}</gml:lowerCorner>
                            <gml:upperCorner>${bboxParts[3]} ${bboxParts[2]}</gml:upperCorner>
                        </gml:Envelope>
                    </ogc:BBOX>
                `
                expressionCount++;
            }
        }
        let searchExpression = '';
        if (allSearch && allSearch.trim().length) {
            searchExpression = `
                <ogc:PropertyIsLike wildCard="*" singleChar="_" escapeChar="\\">
                    <ogc:PropertyName>dc:AnyText</ogc:PropertyName>
                    <ogc:Literal>*${allSearch.trim()}*</ogc:Literal>
                </ogc:PropertyIsLike>
            `;
            expressionCount++;
        }
        if (expressionCount < 2) {
            xmlExpression = typeExpression + bboxExpression + searchExpression;
        } else {
            xmlExpression = `
                <ogc:And>
                    ${typeExpression}
                    ${bboxExpression}
                    ${searchExpression}
                </ogc:And>
                `
        }
        if (xmlExpression.length) {
            xmlConstraint = `
                <csw:Constraint version="1.1.0">
                    <ogc:Filter>
                        ${xmlExpression}
                    </ogc:Filter>
                </csw:Constraint>
            `
        }
        const requestXML = fetchRecordsXML(cswVersion, elementSetName, startRecord, 10, xmlConstraint);
    
        const response = await fetch(preparedUrl.href, {
            method: 'POST',
            headers: {
                'User-Agent': 'JS CSW Client/0.1',
                'Content-Type': 'text/xml',
            },
            body: requestXML
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        //console.log(text);
        const cswRecords = await parseXml(text);
        let xmlRecordName;
        switch(elementSetName) {
            case 'full':
                xmlRecordName = 'Record';
                break;
            case 'summary':
                xmlRecordName = 'SummaryRecord';
                break;
            case 'brief':
                xmlRecordName = 'BriefRecord';
                break;
            default:
                console.error('fetchGetRecords: Unknown elementSetName:', elementSetName);
                break;
        }
        const exception = evaluateXPath(cswRecords, '//ows:ExceptionReport/ows:Exception/ows:ExceptionText/text()');
        if (exception.length) {
            throw new Error(exception[0].nodeValue);
        }
        const result = {
            cswVersion,
            searchStatus: nodeValue(evaluateXPath(cswRecords, '//csw:SearchStatus/@timestamp'), 0),
            searchResults: evaluateXPath(cswRecords, '//csw:SearchResults').map(searchResult=> {
                return {
                    numberOfRecordsMatched: searchResult.getAttribute('numberOfRecordsMatched'),
                    numberOfRecordsReturned: searchResult.getAttribute('numberOfRecordsReturned'),
                    nextRecord: searchResult.getAttribute('nextRecord'),
                    elementSet: searchResult.getAttribute('elementSet'),
                }
            })[0],
            records: evaluateXPath(cswRecords, `//csw:${xmlRecordName}`).map(record => parseRecordXML(record))
        };
        return result;
    } catch (error) {
        console.error('Failed to fetch GetRecords:', error);
        return {
            error: error.message
        };
    }
}

export async function fetchGetRecordById(url, cswVersion, elementSetName, id) {
    try {
        const params = [
            {key: 'service', value: 'CSW'},
            {key: 'request', value: 'GetRecordById'},
            {key: 'version', value: cswVersion},
            {key: 'elementSetName', value: elementSetName},
            {key: 'id', value: id},
            {key: 'outputSchema', value: 'http://www.opengis.net/cat/csw/2.0.2'},
            {key: 'outputFormat', value: 'application/xml'}
        ];
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
        
        const cswRecordById = await parseXml(text);
        const result = {
            cswVersion,
            records: evaluateXPath(cswRecordById, `//csw:GetRecordByIdResponse/csw:Record`).map(record => parseRecordXML(record))
        };
        return result;
    } catch (error) {
        console.error('Failed to fetch GetRecordById:', error);
        return {
            error: error.message
        };
    }
}