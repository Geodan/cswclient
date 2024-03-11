import xpath from 'xpath';
import xmldom from 'xmldom';

//const cswUrl = 'https://nationaalgeoregister.nl/geonetwork/srv/dut/csw-inspire';
const cswUrl = 'https://data.linz.govt.nz/services/csw?service=CSW&version=2.0.2&request=GetRecords';
const briefTitleSearch = `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" 
                service="CSW" 
                version="2.0.2" 
                resultType="results" 
                startPosition="1" 
                maxRecords="10" 
                xmlns:ogc="http://www.opengis.net/ogc" 
                xmlns:gml="http://www.opengis.net/gml" 
                xmlns:dc="http://purl.org/dc/elements/1.1/" 
                xmlns:dct="http://purl.org/dc/terms/" 
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 
                                    http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:Query typeNames="csw:Record">
        <csw:ElementSetName>brief</csw:ElementSetName>
        <csw:Constraint version="1.1.0">
            <ogc:Filter>
                <ogc:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\">
                    <ogc:PropertyName>dc:title</ogc:PropertyName>
                    <ogc:Literal>%water%</ogc:Literal>
                </ogc:PropertyIsLike>
            </ogc:Filter>
        </csw:Constraint>
    </csw:Query>
</csw:GetRecords>`;

const fullAnySearch = `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" 
                service="CSW" 
                version="2.0.2" 
                resultType="results" 
                startPosition="1" 
                maxRecords="10" 
                xmlns:ogc="http://www.opengis.net/ogc" 
                xmlns:gml="http://www.opengis.net/gml" 
                xmlns:dc="http://purl.org/dc/elements/1.1/" 
                xmlns:dct="http://purl.org/dc/terms/" 
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 
                                    http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:Query typeNames="csw:Record">
        <csw:ElementSetName>full</csw:ElementSetName>
        <csw:Constraint version="1.1.0">
            <ogc:Filter>
                <ogc:And>
                    <ogc:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\\">
                        <ogc:PropertyName>AnyText</ogc:PropertyName>
                        <ogc:Literal>%water%</ogc:Literal>
                    </ogc:PropertyIsLike>
                    <ogc:PropertyIsEqualTo>
                        <ogc:PropertyName>type</ogc:PropertyName>
                        <ogc:Literal>service</ogc:Literal>
                    </ogc:PropertyIsEqualTo>
                </ogc:And>
            </ogc:Filter>
        </csw:Constraint>
    </csw:Query>
</csw:GetRecords>`

const serviceSearch = `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" 
                service="CSW" 
                version="2.0.2" 
                resultType="results" 
                startPosition="1" 
                maxRecords="10" 
                xmlns:ogc="http://www.opengis.net/ogc" 
                xmlns:gml="http://www.opengis.net/gml" 
                xmlns:dc="http://purl.org/dc/elements/1.1/" 
                xmlns:dct="http://purl.org/dc/terms/" 
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 
                                    http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:Query typeNames="csw:Record">
        <csw:ElementSetName>full</csw:ElementSetName>
        <csw:Constraint version="1.1.0">
            <ogc:Filter>    
                    <ogc:PropertyIsEqualTo>
                        <ogc:PropertyName>apiso:Type</ogc:PropertyName>
                        <ogc:Literal>service</ogc:Literal>
                    </ogc:PropertyIsEqualTo>
            </ogc:Filter>
        </csw:Constraint>
    </csw:Query>
</csw:GetRecords>`

const extentSearch = `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" 
                service="CSW" 
                version="2.0.2" 
                resultType="results" 
                startPosition="1" 
                maxRecords="10" 
                xmlns:ogc="http://www.opengis.net/ogc" 
                xmlns:gml="http://www.opengis.net/gml" 
                xmlns:dc="http://purl.org/dc/elements/1.1/" 
                xmlns:dct="http://purl.org/dc/terms/" 
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 
                                    http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:Query typeNames="csw:Record">
        <csw:ElementSetName>full</csw:ElementSetName>
        <csw:Constraint version="1.1.0">
            <ogc:Filter>
                <ogc:And>
                    <ogc:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\\">
                        <ogc:PropertyName>AnyText</ogc:PropertyName>
                        <ogc:Literal>%water%</ogc:Literal>
                    </ogc:PropertyIsLike>
                    <ogc:PropertyIsEqualTo>
                        <ogc:PropertyName>type</ogc:PropertyName>
                        <ogc:Literal>service</ogc:Literal>
                    </ogc:PropertyIsEqualTo>
                    <ogc:BBOX>
                        <ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>
                        <gml:Envelope>
                            <gml:lowerCorner>4.811 52.273</gml:lowerCorner>
                            <gml:upperCorner>5.003 52.425</gml:upperCorner>
                        </gml:Envelope>
                    </ogc:BBOX>
                </ogc:And>
            </ogc:Filter>
        </csw:Constraint>
    </csw:Query>
</csw:GetRecords>`;

const withinExtentSearch = `<?xml version="1.0" encoding="UTF-8"?>
<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" 
                service="CSW" 
                version="2.0.2" 
                resultType="results" 
                startPosition="1" 
                maxRecords="10" 
                xmlns:ogc="http://www.opengis.net/ogc" 
                xmlns:gml="http://www.opengis.net/gml" 
                xmlns:dc="http://purl.org/dc/elements/1.1/" 
                xmlns:dct="http://purl.org/dc/terms/" 
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 
                                    http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd">
    <csw:Query typeNames="csw:Record">
        <csw:ElementSetName>full</csw:ElementSetName>
        <csw:Constraint version="1.1.0">
            <ogc:Filter>
                <ogc:And>
                    <ogc:PropertyIsLike wildCard="%" singleChar="_" escapeChar="\\">
                        <ogc:PropertyName>AnyText</ogc:PropertyName>
                        <ogc:Literal>%water%</ogc:Literal>
                    </ogc:PropertyIsLike>
                    <ogc:PropertyIsEqualTo>
                        <ogc:PropertyName>type</ogc:PropertyName>
                        <ogc:Literal>service</ogc:Literal>
                    </ogc:PropertyIsEqualTo>
                    <ogc:Within>
                        <ogc:PropertyName>ows:BoundingBox</ogc:PropertyName>
                        <gml:Envelope>
                            <gml:lowerCorner>0.91 50.17</gml:lowerCorner>
                            <gml:upperCorner>9.64 54.15</gml:upperCorner>
                        </gml:Envelope>
                    </ogc:Within>
                </ogc:And>
            </ogc:Filter>
        </csw:Constraint>
    </csw:Query>
</csw:GetRecords>`

fetch(cswUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/xml',
    },
    body: serviceSearch
})
.then(response => response.text()) // Assuming the response is XML, get it as text
.then(str => { 
    //console.log(str); 
    return (new xmldom.DOMParser()).parseFromString(str, "text/xml")})
.then(data => {
    // Process the XML data here
    // For example, extracting titles from the response
    //const titles = data.querySelectorAll('dc\\:title, title');
    const select = xpath.useNamespaces({
        "dc": "http://purl.org/dc/elements/1.1/",
        "csw": "http://www.opengis.net/cat/csw/2.0.2"
    });
    const records = select('//csw:Record', data);
    console.log(`Number of records found: ${records.length}`)
    records.forEach(record => {
        const title = select('.//dc:title', record)[0].textContent;
        const uri = select('.//dc:URI', record)[0].textContent;
        console.log(`Title: ${title}, URI: ${uri}`);
    });
})
.catch(error => console.error('Error:', error));
