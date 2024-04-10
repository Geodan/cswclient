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
      endRecord: { type: Number },
      fullRecord: { type: Object },
      translatedAbstract: { type: String },
      translatedDescription: { type: String },
      translatedSubject: { type: String }
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
      .recordtitle {
        cursor: pointer;
        text-decoration: underline;
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
      <label for="search">Search: </label><input @keyup="${(event)=>this.updateSearch(event)}" type="text" id="search" placeholder="Search..."><br>
      <label for="bbox">Bounding box: </label><input type="text" id="bbox" placeholder="Bounding box..."><br>
      <button @click="${()=>this.getRecordsHandler(1)}" id="get-records-button">Search</button>
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
          <button ?disabled=${this.startRecord <= 1} @click="${()=>this.getRecordsHandler(this.startRecord - 10)}">Previous</button>
          <button ?disabled=${this.nextRecord === 0}  @click="${()=>this.getRecordsHandler(this.startRecord + 10)}">Next</button>
        `: ''}
        ${this.fullRecord ? this.renderFullRecord(this.fullRecord) : ''}
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
    // remove focus of all previously selected input fields
    const inputs = this.shadowRoot.querySelectorAll('input');
    inputs.forEach(input => input.blur());
    this.updateFullRecord(identifier);
  }
  async updateFullRecord(identifier) {
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
    this.message = 'Searching Catalogue...'
    const records = await this.fetchJson(`./csw_records?url=${encodeURIComponent(catalogUrl)}&startRecord=${startRecord}&type=${this.searchType}&search=${search}`);
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