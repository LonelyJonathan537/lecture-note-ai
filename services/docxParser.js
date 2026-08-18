const fs = require("fs");
const mammoth = require("mammoth");

async function parseDocx(filePath) {

    const buffer = fs.readFileSync(filePath);

    const result =
        await mammoth.extractRawText({
            buffer
        });

    const text =
        result.value || "";

    if (!text.trim()) {
        throw new Error("DOCX contains no readable text.");
    }

    const paragraphs =
        text
            .split(/\n+/)
            .map(line => line.trim())
            .filter(Boolean);

    const slides = [];

    paragraphs.forEach((paragraph, index) => {

        slides.push({
            slide: index + 1,

            title:
                paragraph.length > 100
                    ? `Section ${index + 1}`
                    : paragraph,

            content: paragraph
        });
    });

    return slides;
}

module.exports = {
    parseDocx
};