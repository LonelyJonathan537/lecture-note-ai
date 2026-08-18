const fs = require("fs");

async function parseTxt(filePath) {

    const text =
        fs.readFileSync(
            filePath,
            "utf8"
        );

    if (!text.trim()) {
        throw new Error(
            "TXT file contains no readable content."
        );
    }

    return [
        {
            slide: 1,

            title: "Lecture Notes",

            content: text.trim()
        }
    ];
}

module.exports = {
    parseTxt
};