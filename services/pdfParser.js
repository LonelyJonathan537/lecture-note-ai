const fs = require("fs");
const pdfParse = require("pdf-parse");

async function parsePdf(filePath) {

    const buffer = fs.readFileSync(filePath);

    const data = await pdfParse(buffer);

    const text = data.text || "";

    if (!text.trim()) {
        throw new Error("PDF contains no readable text.");
    }

    const pages = text.split(/\f/);

    const slides = [];

    pages.forEach((pageText, index) => {

        const content = pageText
            .replace(/\r/g, "")
            .trim();

        if (!content) {
            return;
        }

        const lines = content
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);

        slides.push({
            slide: index + 1,

            title:
                lines.length > 0
                    ? lines[0]
                    : `Page ${index + 1}`,

            content: content
        });
    });

    return slides;
}

module.exports = {
    parsePdf
};