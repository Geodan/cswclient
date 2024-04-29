# CSW Client
A client to browse Geographic ***C***atalog ***S***ervices for the ***W***eb (CSW) which enables users to discover, browse, and query geospatial records in catalogues across the web.

## Prerequisites
* git
* Node.js (version 20 is recommended; other versions have not been tested)


## Install
```bash
git clone this_repository
cd this_repository
npm install
```

## Start
Set up your OPENAI_API_KEY if you plan to use the translation feature requiring external API calls:
```bash
# Windows:
set OPENAI_API_KEY=your_openai_api_key
# Linux:
export OPENAI_API_KEY=your_openai_api_key

# start the service
node app.js

# point you browser to http://localhost:3000 to interact with the CSW Client
```

## Project structure

This CSW Client is built on the [Express.js](https://expressjs.com) Web Application framework. Main entry point is module ```app.js```. This module sets up the http service routes (or 'handlers') to proxy CSW requests to CSW servers. The route results are returned as JSON. The ```app.js``` module also exposes directory ```public``` that hosts a csw client web application (```index.html``` + ```csw-app.js```) to be used in a browser (http://localhost:3000). The browser app displays a selection of predefined CSW servers to search. This list is defined in file ```endpoints.js```.

The actual requests and responses to the CSW servers are handled in module ```cswrequests.js```. Note that if you want to execute this request/response Javascript code directly in a browser (bypassing the Express.js proxy), the CSW server must allow CORS requests for this to work. The administrator of the CSW service may or may not have enabled CORS. Enabled CORS on the CSW server is not required for use in this project.
