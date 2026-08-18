const path = require("path");
const fs = require("fs");

const { parsePptx } = require("./pptxParser");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");
const XLSX = require("xlsx");


async function parseFile(filePath, originalName) {

    const extension =
        path.extname(originalName).toLowerCase();


    // ================================
    // PowerPoint
    // ================================

    if (extension === ".pptx") {

        const slides =
            await parsePptx(filePath);

        return {
            type: "pptx",
            pages: slides
        };
    }


// ================================
// PDF
// ================================

if (extension === ".pdf") {

    const buffer = fs.readFileSync(filePath);

    const parser = new PDFParse({
        data: buffer
    });

    try {

        const result = await parser.getText();

        const pages = [];

        // pdf-parse v2 provides individual pages
        for (const page of result.pages) {

            const cleanText =
                (page.text || "")
                    .replace(/\r/g, "")
                    .trim();

            if (cleanText.length > 0) {

                const lines =
                    cleanText
                        .split("\n")
                        .map(line => line.trim())
                        .filter(Boolean);

                pages.push({

                    page: page.num,

                    title:
                        lines[0] ||
                        `Page ${page.num}`,

                    content:
                        cleanText

                });

            }

        }

        console.log(
            `PDF total pages detected: ${result.total}`
        );

        console.log(
            `PDF pages with readable text: ${pages.length}`
        );

        return {

            type: "pdf",

            pages

        };

    } finally {

        await parser.destroy();

    }
}


    // ================================
    // Word DOCX
    // ================================

    if (extension === ".docx") {

        const result =
            await mammoth.extractRawText({
                path: filePath
            });

        const text =
            result.value || "";

        if (!text.trim()) {

            throw new Error(
                "DOCX contains no readable text."
            );

        }

        return {

            type: "docx",

            pages: [
                {
                    page: 1,

                    title:
                        "Document",

                    content:
                        text.trim()
                }
            ]
        };
    }


    // ================================
    // Excel XLSX / XLS
    // ================================

    if (
        extension === ".xlsx" ||
        extension === ".xls"
    ) {

        const workbook =
            XLSX.readFile(
                filePath,
                {
                    cellFormula: true,
                    cellText: true
                }
            );

        const pages = [];

        for (
            const sheetName
            of workbook.SheetNames
        ) {

            const worksheet =
                workbook.Sheets[sheetName];

            const rows =
                XLSX.utils.sheet_to_json(
                    worksheet,
                    {
                        header: 1,
                        raw: false,
                        defval: ""
                    }
                );

            const lines = [];

            rows.forEach(
                (row, rowIndex) => {

                    const values =
                        row.map(cell =>
                            String(cell)
                                .trim()
                        );

                    if (
                        values.some(
                            value =>
                                value.length > 0
                        )
                    ) {

                        lines.push(
                            `Row ${rowIndex + 1}: ` +
                            values.join(" | ")
                        );
                    }
                }
            );

            if (lines.length === 0) {
                continue;
            }

            pages.push({

                page: sheetName,

                title:
                    sheetName,

                content:
                    lines.join("\n")

            });
        }

        if (pages.length === 0) {

            throw new Error(
                "Excel file contains no readable content."
            );

        }

        return {
            type: "xlsx",
            pages
        };
    }


    // ================================
    // Plain Text
    // ================================

    if (extension === ".txt") {

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

        return {

            type: "txt",

            pages: [
                {
                    page: 1,

                    title:
                        "Text Document",

                    content:
                        text
                            .trim()
                }
            ]
        };
    }


    throw new Error(
        `Unsupported file format: ${extension}`
    );
}


module.exports = {
    parseFile
};