const fs = require("fs");
const JSZip = require("jszip");
const xml2js = require("xml2js");

async function parsePptx(filePath) {

    const fileBuffer = fs.readFileSync(filePath);

    const zip = await JSZip.loadAsync(fileBuffer);

    const slides = [];

    const slideFiles = Object.keys(zip.files)
        .filter(fileName =>
            /^ppt\/slides\/slide\d+\.xml$/.test(fileName)
        )
        .sort((a, b) => {

            const numA = parseInt(
                a.match(/slide(\d+)\.xml/)[1]
            );

            const numB = parseInt(
                b.match(/slide(\d+)\.xml/)[1]
            );

            return numA - numB;
        });


    for (const slideFile of slideFiles) {

        const slideNumber = parseInt(
            slideFile.match(/slide(\d+)\.xml/)[1]
        );

        const xml =
            await zip.files[slideFile].async("string");

        const parsed =
            await xml2js.parseStringPromise(xml);


        /*
         * Extract visible PowerPoint text
         *
         * Keep each text element separate instead
         * of immediately joining everything together.
         */

        const textElements =
            extractPowerPointText(parsed);


        const cleanText =
            textElements
                .map(cleanPowerPointText)
                .filter(text => text.length > 0);


        /*
         * First text element is usually the title,
         * but we do not assume that every slide has
         * a title.
         */

        const title =
            cleanText.length > 0
                ? cleanText[0]
                : "Untitled Slide";


        /*
         * Preserve the individual text elements.
         *
         * This is important because formulas,
         * bullet points, examples and headings
         * should not all become one long sentence.
         */

        const content =
            cleanText.join("\n");


        slides.push({

            slide: slideNumber,

            title: title,

            content: content,

            textElements: cleanText

        });
    }


    return slides;
}


/**
 * Extract visible PowerPoint text.
 *
 * PowerPoint stores visible text inside:
 *
 * <a:t>Actual text</a:t>
 *
 * We only extract those text nodes.
 */
function extractPowerPointText(obj) {

    const results = [];


    function walk(value, key = "") {

        if (
            key === "a:t" &&
            typeof value === "string"
        ) {

            results.push(value);

            return;
        }


        if (Array.isArray(value)) {

            for (const item of value) {

                walk(item, key);

            }

            return;
        }


        if (
            typeof value === "object" &&
            value !== null
        ) {

            for (
                const currentKey of Object.keys(value)
            ) {

                walk(
                    value[currentKey],
                    currentKey
                );

            }
        }
    }


    walk(obj);


    return results;
}


/**
 * Clean extraction artifacts without changing
 * the actual lecture wording.
 *
 * IMPORTANT:
 * This function does NOT replace technical
 * terminology or numbers.
 */
function cleanPowerPointText(text) {

    if (!text) {
        return "";
    }


    return text

        // Remove leading/trailing whitespace
        .trim()

        // Convert repeated whitespace to a single space
        .replace(/[ \t]+/g, " ")

        // Remove accidental spaces before punctuation
        .replace(/\s+([,.;:!?])/g, "$1");
}


module.exports = {
    parsePptx
};