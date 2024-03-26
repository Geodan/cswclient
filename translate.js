import OpenAI from "openai";
import { fileURLToPath } from 'url';

const openai = new OpenAI();

export async function translateStrings(textArray, language) {
  try {
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