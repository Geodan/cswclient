import {LitElement, html, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import './wc-map/dist/src/components/maps/web-maplibre-gl.js';
import './wc-map/dist/src/components/tools/map-tool-boundingbox.js';
import {getValidatedBbox} from './bboxvalidator.js';

class CSWApp extends LitElement {
  static get properties() {
    return {
      catalogList: { type: Array },
      briefRecords: { type: Array },
      englishTitles: { type: Array },
      catalogInfo: { type: Object },
      totalRecords: { type: Number },
      startRecord: { type: Number },
      endRecord: { type: Number },
      fullRecord: { type: Object },
      translatedAbstract: { type: String },
      translatedDescription: { type: String },
      translatedSubject: { type: String }
    };
  }
  static get styles() {
    return css`
      #header {
        margin-bottom: 20px; /* Space below the header */
      }
      #header .title {
        font-size: 24px; /* Large title */
        font-weight: bold; /* Bold font */
      }
      #header .subtitle {
        font-size: 14px; /* Smaller subtitle */
        color: #888; /* Gray color */
      }
      #catalog {
        margin-bottom: 20px; /* Space below the catalog */
      }
      /* Forms */
      #catalog, #search, #records, #fullrecord {
        background-color: #fff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Subtle shadow for depth */
        margin-bottom: 20px; /* Space below the search area */
      }
      #search {
        display: flex;
        justify-content: space-between;
      }
      #leftpane {
        flex: 0 1 auto; /* Don't grow, shrink, take automatic width based on content */
      }
      #rightpane {
        display: flex;
        flex: 1; /* Grow to take up remaining space */
      }
      #bboxmap {
        margin-left: 20px;
        max-width: 400px;
        min-width: 100px;
      }
      #bboxmaptools {
        display: flex;
        flex-direction: column;
        margin-left: 20px;
        justify-content: space-between;
        height: 100%;
      }
      #search input[type="text"],
      #search select,
      #search button {
        padding: 10px;
        margin-bottom: 10px; /* Space between form elements */
        border: 1px solid #ddd; /* Subtle border */
        border-radius: 4px; /* Rounded corners */
      }
      
      #search button {
        background-color: #5cb85c; /* A green color for actions */
        color: white;
        cursor: pointer;
      }
      
      #search button:hover {
        background-color: #4cae4c; /* Slightly darker green on hover */
      }
      /* Records Table Styles */
      #records table {
        width: 100%; /* Full width */
        border-collapse: collapse; /* Collapse borders */
        margin-bottom: 10px; /* Space below the table */
      }
      
      #records th,
      #records td {
        text-align: left; /* Align text to the left */
        padding: 12px; /* Padding inside table cells */
        border-bottom: 1px solid #eee; /* Line between rows */
      }
      
      #records th {
        background-color: #f8f8f8; /* Light background for header */
        font-weight: bold; /* Bold font for header */
      }
      
      /* No border for the last cell to avoid double border with pagination */
      #records tr:last-child td {
        border-bottom: none;
      }
      
      /* Pagination Styles */
      #records .pagination {
        text-align: center; /* Center the pagination buttons */
        padding: 10px 0; /* Padding above and below the buttons */
      }
      
      #records .pagination button {
        padding: 5px 10px; /* Smaller padding for pagination buttons */
        margin: 0 5px; /* Space between buttons */
        background-color: #e7e7e7; /* Neutral background */
        color: #333; /* Text color */
        border: 1px solid #ddd; /* Border */
        border-radius: 4px; /* Rounded corners */
        cursor: pointer;
      }
      
      #records .pagination button:hover {
        background-color: #ddd; /* Slightly darker on hover */
      }
      
      #records .pagination button:disabled {
        background-color: #f5f5f5; /* Disabled button background */
        color: #bbb; /* Disabled button text color */
        cursor: default;
        border-color: #f5f5f5; /* Disabled button border color */
      }
      .recordtitle {
        cursor: pointer;
        text-decoration: underline;
      }
      #footer {
        position: relative;
        height: 500px;
      }

      `
  }
  constructor() {
    super();
    this.catalogList = [];
    this.briefRecords = [];
    this.englishTitles = [];
    this.catalogInfo = {};
    this.totalRecords = 0;
    this.startRecord = 1;
    this.searchType = '';
    this.searchString = '';
    this.fullRecord = null;
    this.translatedAbstract = '';
    this.translatedDescription = '';
    this.translatedSubject = '';
  }
  render() {
    return html`
      <div id="header">
        <div class="title">CSW Client</div>
        <div class="subtitle">Browse Geographic <b>C</b>atalogue <b>S</b>ervices for the <b>W</b>eb (CSW)</div>
      </div>
      <div id="catalog">
        <h2>Catalog</h2>
        <label for="catalog-select">Catalog: </label><select @change="${(e)=>this.catalogChanged()}" id="catalog-select">
          ${this.catalogList.map((catalog,index) => html`<option value="${index}">${catalog.name}</option>`)}
        </select><br>
        ${this.catalogInfo?.serviceTitle ? html`<p>${this.catalogInfo?.serviceTitle}<br>` : ''}
        ${this.catalogInfo?.serviceType && this.catalogInfo?.serviceTypeVersion? html`${this.catalogInfo.serviceType} ${this.catalogInfo.serviceTypeVersion}<br>` : ''}
        </div>
      <div id="search">
        <div id="leftpane">
        <h2>Search</h2>
        <label for="type">Type: </label><input @keyup="${(event)=>this.updateType(event)}" type="text" id="type" placeholder="Dataset type..."><br>
        <label for="searchinput">Search: </label><input @keyup="${(event)=>this.updateSearch(event)}" type="text" id="searchinput" placeholder="Search..."><br>
        <label for="bbox">Bounding box: </label><input type="text" id="bbox" placeholder="Bounding box..."><br>
        <button @click="${()=>this.getRecordsHandler(1)}" id="get-records-button">Search</button>
        </div>
        <div id="rightpane">
          <web-maplibre-gl id="bboxmap" map-layers="./osm.json"></web-maplibre-gl>
          <div id="bboxmaptools">            
            <map-tool-boundingbox for="bboxmap" id="bboxtool"></map-tool-boundingbox>
            <button @click="${()=>this.setbbox()}">Copy bbox to search</button>
          </div>
        </div>
      </div>
      <div id="records">
        <h2>Records</h2>
        Search string: ${this.translatedSearch}<br>
        Type: ${this.searchType}<br>
        Total records: ${this.totalRecords}<br>
        ${this.message !== '' ? html`<p>${this.message}</p>` : ''}
        ${this.totalRecords > 0 && this.briefRecords.length > 0 ? html`
          Showing records ${this.startRecord} to ${this.endRecord}      
          <table>
            <thead><tr><th>Type</th><th>title</th><th>title (AI-translated)</th></tr></thead>
            <tbody>
              ${this.briefRecords.map(record => html`<tr><td>${record.type}</td><td @click="${(event)=>this.briefRecordTitleClicked(event, record.identifier)}" class="recordtitle">${record.title}</td><td>${record.englishTitle}</td></tr>`)}
            </tbody>
          </table>
          <div class="pagination">
            <button ?disabled=${this.startRecord <= 1} @click="${()=>this.getRecordsHandler(this.startRecord - 10)}" title="Previous page of matching records">Previous</button>
            <button ?disabled=${this.nextRecord === 0}  @click="${()=>this.getRecordsHandler(this.startRecord + 10)}" title="Next page of matching records">Next</button>
          </div>
        `: ''}
      </div>
      <div id="fullrecord">
        ${this.fullRecord ? this.renderFullRecord(this.fullRecord) : ''}
      </div>
      <div id="footer">
        &nbsp;
      </div>
    `;
  }
  renderOtherKeys(record) {
    for (const key in record) {
      if (!['identifier', 'title', 'type', 'subject', 'format', 'date', 'abstract', 'description', 'rights', 'source', 'relation', 'URI'].includes(key)) {
        return html`<tr><td>${key}:</td><td> ${record[key]}</td></tr>`;
      }
    }
  }
  renderFullRecord(record) {
    if (!record) return html`<p>No record selected</p>`;
    const subject = record.subject ? Array.isArray(record.subject) ? record.subject.join(', ') : record.subject : '';
    let abstractLabel = record.abstract === record.description ? 'Abstract / description' : 'Abstract';
    
    return html`
      <h2>Full Record</h2>
      <table>
      <tr><td class="label">Identifier:</td><td> ${record.identifier}</td></tr>
      <tr><td class="label">Title:</td><td> ${record.title}</td></tr>
      <tr><td class="label">Type:</td><td> ${record.type}</td></tr>
      <tr><td class="label">Subject:</td><td> ${subject}</td></tr>
      <tr><td class="label">Subject (english):</td><td> ${this.translatedSubject}</td></tr>
      <tr><td class="label">Format:</td><td> ${record.format}</td></tr>
      <tr><td class="label">Date:</td><td> ${record.date}</td></tr>
      <tr><td class="label">${abstractLabel}:</td><td> ${record.abstract}</td></tr>
      <tr><td class="label">${abstractLabel} (english)</td><td> ${this.translatedAbstract}</td></tr>
      ${record.abstract !== record.description ? html`<tr><td class="label">Description:</td><td> ${record.description}</td></tr>` : ''}
      ${record.abstract !== record.description ? html`<tr><td class="label">Description (english):</td><td> ${this.translatedDescription}</td></tr>` : ''}
      <tr><td>Rights:</td><td> ${record.rights?record.rights:'none'}</td></tr>
      <tr><td>Source:</td><td> ${record.source?record.source:'none'}</td></tr>
      <tr><td>Relation:</td><td> ${record.relation? html`<span @click="${(_e)=>this.updateFullRecord(record.relation)}">Link</span>`:'none'}</td></tr>
      <tr><td>Links: </td><td></td></tr>
      ${record.URI ?
         record.URI.map(uri => html`<tr><td></td><td>${uri.protocol} <a href="${uri.url}" target="cswlink">${uri.name?uri.name:'No name'} ${uri.description}</a></td></tr>`)
         :
          html`<tr><td></td><td>no URI/URLs defined</td></tr>`
      }
      ${this.renderOtherKeys(record)}
      </table>
    `;
  }
  connectedCallback() {
    super.connectedCallback();
    this.init(); 
  }
  async updateCatalogInfo(catalogIndex) {
    const catalog = this.catalogList[catalogIndex];
    this.catalogInfo = {};
    this.totalRecords = 0;
    this.briefRecords = [];
    this.fullRecord = null;
    this.catalogInfo = await this.fetchJson(`./csw_info?url=${encodeURIComponent(catalog.url)}`);
  }
  catalogChanged(event) {
    const catalogIndex = parseInt(this.catalogSelect.value);
    this.updateCatalogInfo(catalogIndex);
  }
  updateType(event) {
    this.searchType = event.target.value;
  }
  updateSearch(event) {
    this.searchString = event.target.value;
  }
  setbbox() {
    const bbox = this.shadowRoot.querySelector('#bbox').value;
    const bboxtool = this.shadowRoot.querySelector('#bboxtool');
    const west = bboxtool.west;
    const south = bboxtool.south;
    const east = bboxtool.east;
    const north = bboxtool.north;
    this.shadowRoot.querySelector('#bbox').value = `${west},${south},${east},${north}`;
  }
  async fetchJson(url, options) {
    if (options === undefined) options = {};
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Fetchjson error: ${error.message?error.message: error}`);
      return null;
    }
  }
  async getTranslatedStrings(strings, language) {
    return await this.fetchJson('./translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        strings: strings,
        language: language
      })
    })
  }
  briefRecordTitleClicked(event, identifier) {
    const rows = event.target.parentElement.parentElement.querySelectorAll('tr');
    rows.forEach(row => row.style.backgroundColor = 'white');
    event.target.parentElement.style.backgroundColor = 'whitesmoke';
    this.updateFullRecord(identifier);
  }
  async updateFullRecord(identifier) {
    // keep the table height the same while loading to avoid jumping
    const fullRecordTable = this.shadowRoot.querySelector('#fullrecord');
    if (fullRecordTable) {
      const oldHeight = fullRecordTable.offsetHeight;
      fullRecordTable.style.minHeight = oldHeight + 'px';
    }

    this.fullRecord = null;
    this.translatedAbstract = this.translatedDescription = this.translatedSubject = 'Translating...'
    const fullRecord = await this.fetchJson(`./csw_record_by_id?url=${encodeURIComponent(this.catalogList[this.catalogSelect.value].url)}&id=${encodeURIComponent(identifier)}`);
    if (fullRecord && !fullRecord.error) {
      this.fullRecord = fullRecord?.records?.[0];
      const subject = this.fullRecord.subject ? Array.isArray(this.fullRecord.subject) ? this.fullRecord.subject.join(', ') : this.fullRecord.subject : '';
      [this.translatedAbstract, this.translatedDescription, this.translatedSubject] = await this.getTranslatedStrings(
        [ this.fullRecord.abstract, 
          this.fullRecord.description, 
          subject], this.catalogList[this.catalogSelect.value].language)
    }
    if (fullRecordTable) {
      fullRecordTable.style.minHeight = 'auto';
    }
  }
  async getRecordsHandler(startRecord) {
    const catalogUrl = this.catalogList[this.catalogSelect.value].url;
    this.briefRecords = [];
    this.fullRecord = null;
    this.startRecord = startRecord;
    if (startRecord == 1) {
      this.translatedSearch = this.searchString;
      this.totalRecords = 0;
    }
    this.requestUpdate(); 
    let search = this.searchString;
    if (this.searchString.trim() !== '') {
      if (this.startRecord === 1) {
        const targetLanguage = this.catalogList[this.catalogSelect.value].language;
        const userLanguage = navigator.language;
        this.message = `Translating ${this.searchString} to ${targetLanguage}`;
        search = await this.fetchJson(`./translateSearch?searchString=${encodeURIComponent(this.searchString)}&userLanguage=${userLanguage}&targetLanguage=${targetLanguage}`);
        this.message = '';
        this.translatedSearch = search;
      } else {
        search = this.translatedSearch; // keep the translated search string for search pages > 1
      }
    } else {
      this.translatedSearch = '';
    }
    let bbox = getValidatedBbox(this.shadowRoot.querySelector('#bbox')?.value);
    this.message = 'Searching Catalogue...'
    const records = await this.fetchJson(`./csw_records?url=${encodeURIComponent(catalogUrl)}&startRecord=${startRecord}&type=${this.searchType}&search=${search}&bbox=${bbox}`);
    this.message = '';
    if (records && !records.error) {
      const searchResults = records.searchResults;
      if (searchResults) {
        this.totalRecords = parseInt(searchResults.numberOfRecordsMatched);
        this.endRecord = this.startRecord + parseInt(searchResults.numberOfRecordsReturned) - 1;
        this.nextRecord = parseInt(searchResults.nextRecord);
      } else {
        this.totalRecords = 0;
        this.startRecord = 1;
        this.endRecord = 0;
      }
      const briefRecords = records.records;
      briefRecords.forEach(record => record.englishTitle = 'Translating...');
      this.briefRecords = briefRecords;
      let translatedStrings = null;
      if (briefRecords.length > 0) {
        translatedStrings = await this.getTranslatedStrings(briefRecords.map(record => record.title), this.catalogList[this.catalogSelect.value].language);
      }
      if (translatedStrings) {
        briefRecords.forEach((record, index) => record.englishTitle = translatedStrings[index]);
      } else {
        briefRecords.forEach(record => record.englishTitle = 'Error translating');
      }
      this.requestUpdate();
    }
  }
  async init() {
    const catalogs = await this.fetchJson('./csw_endpoints');
    if (!catalogs) {
      console.error('No catalogs found, server error?');
      return;
    }
    this.catalogList = catalogs;
    this.catalogSelect = this.shadowRoot.querySelector('#catalog-select');
    this.updateCatalogInfo(0);
  }
}

customElements.define('csw-app', CSWApp);