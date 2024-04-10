import { executionAsyncResource } from "async_hooks";
import OpenAI from "openai";
import { fileURLToPath } from 'url';

let openai = null;

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not set in environment variables");
} else {
  openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
}

export async function translateStrings(textArray, language) {
  try {
    if (!openai) {
      return textArray.map(text => `Server config: translation API key not set`);
    }
    // replace all double quotes with single quotes and remove single quotes to prevent issues with AI JSON parsing
    textArray = textArray.map(text => text.replace(/"/g, "'").replace(/'/g, ""));
    const json = JSON.stringify(textArray);
    if (language.toLowerCase() === "english")
    {
      return JSON.parse(json);
    }
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: `You will be provided with json array that contains strings describing geographic datasets and types in language ${language}, and your task is to translate these strings to English`},
        { role: "user", content: json}
      ],
      model: "gpt-3.5-turbo",
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error(`Error in translateStrings: ${error.message?error.message: error}`);
    return null;
  }
}

export async function translateSearchString(searchString, userlanguage, language) {
  console.log(userlanguage);
  // convert navigator.language to language name
  switch (userlanguage.slice(0, 2).toLowerCase()) {
    case "en":
      userlanguage = "English";
      break;
    case "nl":
      userlanguage = "Dutch";
      break;
    case "fr":
      userlanguage = "French";
      break;
    case "de":
      userlanguage = "German";
      break;
    case "es":
      userlanguage = "Spanish";
      break;
      // Italian
    case "it":
      userlanguage = "Italian";
      // Norwegian
    case "no":
      userlanguage = "Norwegian";
      break;
      // Swedish
    case "sv":
      userlanguage = "Swedish";
      break;
      // Finnish
    case "fi":
      userlanguage = "Finnish";
      break;
      // Danish
    default:
      break;
  }
  if (language.toLowerCase() === userlanguage.toLowerCase()) {
    return searchString;
  }
  try {
    if (!openai) {
      console.log(`Server config: translation API key not set`);
      return searchString;
    }
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: `You will be provided with a search string likely in language ${userlanguage}, and your task is to translate this string to ${language}`},
        { role: "system", content: `If the searchstring contains acronyms or abbreviations, you can leave them untranslated, except if you know the meaning of the acronym in both the source and target languages (GIS => SIG or AIDS=>SIDA)`},
        { role: "system", content: `The search strings are given to search for geographic datasets and types in a catalog, and the translation should be as accurate as possible to ensure the search results are relevant to the user's query`},
        { role: "system", content: `Your output should be the string to use as a search query in the target language`},
        { role: "user", content: searchString}
      ],
      model: "gpt-3.5-turbo",
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error(`Error in translateSearchString: ${error.message?error.message: error}`);
    return null;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    const result = await translateStrings(
      [
        "Dit is een tekst",
        "Een vreemd verhaal over prinsen en prinsessen",
        "Een zakelijke tekst over de economie",
        "Afbeeldingen van de natuur",
        "Een geografische weergave van welvaartsspreiding",
        "Beheerobjecten gemeente Udenrode",
        "Certifaten van aandelen",
        "Spreiding van zeewier in de Waddenzee",
        "De aanleg van de Deltawerken in de 60- en 70-er jaren"
      ],
      "Dutch"  
    );

    console.log(result);
  })();
}