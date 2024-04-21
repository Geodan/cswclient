async function fetchJson(url) {
  if (!url) {
    return;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`status: ${response.status}`);
    }
    const json = await response.json();
    json._baseUrl = response.url;
    return json;
  } catch (error) {
    console.error(`Error loading JSON data from ${url}: ${error.message}`);
  }
}

async function fetchText(url) {
  if (!url) {
    return;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading text data from ${url}: ${error.message}`);
  }
}

async function fetchSource(layer) {
  if (layer?.source?.type === 'geojson' && typeof layer.source.data === 'string') {
    try {
      const sourceUrl = layer._baseUrl ? new URL(layer.source.data, layer._baseUrl).href : layer.source.data;
      const source = await fetchJson(sourceUrl);
      if (!source) {
        console.error(`Error loading GeoJSON data from ${sourceUrl}: no data`);
        return;
      }
      layer.source.data = source;
    } catch (error) {
      console.error(`Error loading GeoJSON data: ${error.message}`);
    }
  }
}

export { fetchJson, fetchSource, fetchText };
//# sourceMappingURL=fetchdata.js.map
