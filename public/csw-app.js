import {LitElement, html, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class CSWApp extends LitElement {
  static get properties() {
    return {
      catalogList: { type: Array },
      briefRecords: { type: Array },
      englishTitles: { type: Array },
      catalogInfo: { type: Object },
      totalRecords: { type: Number },
      startRecord: { type: Number },
      endRecord: { type: Number }
    };
  }
  static get styles() {
    return css`
      table {
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid black;
        padding: 0.5em;
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
  }
  render() {
    return html`
      <h1>CSW Client</h1>
      <h2>Catalog</h2>
      <label for="catalog-select">Catalog: </label><select @change="${(e)=>this.catalogChanged()}" id="catalog-select">
        ${this.catalogList.map((catalog,index) => html`<option value="${index}">${catalog.name}</option>`)}
      </select><br>
      ${this.catalogInfo?.serviceTitle ? html`<p>${this.catalogInfo?.serviceTitle}<br>` : ''}
      ${this.catalogInfo?.serviceType && this.catalogInfo?.serviceTypeVersion? html`${this.catalogInfo.serviceType} ${this.catalogInfo.serviceTypeVersion}<br>` : ''}
        
      <hr>
      <h2>Search</h2>
      <label for="type">Type: </label><input @keyup="${(event)=>this.updateType(event)}" type="text" id="type" placeholder="Type..."><br>
      <label for="search">Search: <label><input @keyup="${(event)=>this.updateSearch(event)}" type="text" id="search" placeholder="Search..."><br>
      <label for="bbox">Bounding box: </label><input type="text" id="bbox" placeholder="Bounding box..."><br>
      <button @click="${()=>this.getRecordsHandler(1)}" id="get-records-button">Get Records</button>
      <div id="records">
        <h2>Records</h2>
        Total records: ${this.totalRecords}<br>
        ${this.totalRecords > 0 && this.briefRecords.length > 0 ? html`
          Showing records ${this.startRecord} to ${this.endRecord}      
          <table>
            <thead><tr><th>Type</th><th>title</th><th>title (AI-translated)</th></tr></thead>
            <tbody>
              ${this.briefRecords.map(record => html`<tr><td>${record.type}</td><td>${record.title}</td><td>${record.englishTitle}</td></tr>`)}
            </tbody>
          </table>
          ${this.startRecord > 1 ? html`<button @click="${()=>this.getRecordsHandler(this.startRecord - 10)}">Previous</button>`: ''}
          ${this.totalRecords > this.endRecord ? html`<button @click="${()=>this.getRecordsHandler(this.startRecord + 10)}">Next</button>`: ''}
        `: ''}
      </div>
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
  async getRecordsHandler(startRecord) {
    const catalogUrl = this.catalogList[this.catalogSelect.value].url;
    const records = await this.fetchJson(`./csw_records?url=${encodeURIComponent(catalogUrl)}&startRecord=${startRecord}&type=${this.searchType}&search=${this.searchString}`);
    this.totalRecords = 0;
    this.briefRecords = [];
    this.requestUpdate();
    if (!records.error) {
      const searchResults = records.searchResults;
      this.totalRecords = searchResults.numberOfRecordsMatched;
      this.startRecord = searchResults.nextRecord - searchResults.numberOfRecordsReturned;
      this.endRecord = searchResults.nextRecord - 1;
      const briefRecords = records.records;
      briefRecords.forEach(record => record.englishTitle = 'Translating...');
      this.briefRecords = briefRecords;
      let translatedStrings = null;
      if (briefRecords.length > 0) {
        translatedStrings = await this.fetchJson('./translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            strings: briefRecords.map(record => record.title),
            language: this.catalogList[this.catalogSelect.value].language
          })
        })
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