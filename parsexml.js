// Define a variable to hold the appropriate DOMParser instance
let domParserPromise;
let xpath;

// Immediately invoked function to set up the DOMParser based on the environment
(async function setUpDomParser() {
    // Detect if running in a Node.js environment
    const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

    if (isNode) {
        // In Node.js, dynamically import xmldom and set the promise for later use
        xpath = await import('xpath');
        const xmldom = await import('xmldom');
        domParserPromise = new xmldom.DOMParser()
    } else {
        // In browser, immediately resolve the promise with the native DOMParser
        domParserPromise = new window.DOMParser();
    }
})();

// Function to parse XML with the pre-initialized DOMParser
export const parseXml = async (xmlString) => {
    const DOMParserInstance = await domParserPromise;
    return DOMParserInstance.parseFromString(xmlString, 'text/xml');
};

let prevXmlDoc = null;
let cachedNamespaces = {};

function getNamespaces(xmlDoc) {
    // Check if the xmlDoc is the same as the previous invocation to return the cached result
    if (prevXmlDoc === xmlDoc) {
        return cachedNamespaces;
    }

    const namespaces = {};
    
    // Helper function to extract namespaces from an element's attributes
    function extractNamespacesFromAttributes(element) {
        if (element.attributes) {
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                if (attr.name.startsWith('xmlns:')) {
                    const prefix = attr.name.split(':')[1];
                    namespaces[prefix] = attr.value;
                }
            }
        }
    }

    // Helper function to recursively traverse the document and extract namespaces
    function traverseElement(element) {
        // Extract namespaces from the current element
        extractNamespacesFromAttributes(element);

        // Recursively process child elements
        Array.from(element.childNodes).forEach(child => {
            if (child.nodeType === 1) { // Check if the node is an element node
                traverseElement(child);
            }
        });
    }

    // Start the traversal from the document's root element
    traverseElement(xmlDoc.documentElement);

    // Cache the result for future calls with the same xmlDoc
    prevXmlDoc = xmlDoc;
    cachedNamespaces = namespaces;

    return namespaces;
}

// Function to evaluate XPath expressions
export const evaluateXPath = (xmlDoc, expression, returnType) => {
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        // Node.js environment
        const namespaces = getNamespaces(xmlDoc);
        if (!namespaces.xs) {
            namespaces.xs = 'http://www.w3.org/2001/XMLSchema';
        }
        const select = xpath.useNamespaces(namespaces);
        return select(expression, xmlDoc, returnType); // Note: returnType handling might differ
    } else {
        // Browser environment
        const evaluator = new XPathEvaluator();
        const nsResolver = xmlDoc.createNSResolver(xmlDoc.ownerDocument == null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
        const customResolver = function(prefix) {
            if (prefix === 'xs') {
                return 'http://www.w3.org/2001/XMLSchema';
            }
            return nsResolver.lookupNamespaceURI(prefix);
        }
        return evaluator.evaluate(expression, xmlDoc, customResolver, returnType, null);
    }
}

