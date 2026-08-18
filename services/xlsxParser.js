const XLSX = require("xlsx");

async function parseXlsx(filePath) {

    const workbook =
        XLSX.readFile(filePath, {
            cellText: true,
            cellDates: true
        });

    const slides = [];

    workbook.SheetNames.forEach(
        (sheetName, sheetIndex) => {

            const worksheet =
                workbook.Sheets[sheetName];

            const rows =
                XLSX.utils.sheet_to_json(
                    worksheet,
                    {
                        header: 1,
                        defval: ""
                    }
                );

            const lines = rows
                .map(row =>
                    row
                        .map(cell =>
                            String(cell).trim()
                        )
                        .filter(Boolean)
                        .join(" | ")
                )
                .filter(Boolean);

            if (lines.length === 0) {
                return;
            }

            slides.push({

                slide: sheetIndex + 1,

                title: sheetName,

                content:
                    lines.join("\n")

            });
        }
    );

    if (slides.length === 0) {
        throw new Error(
            "Excel file contains no readable content."
        );
    }

    return slides;
}

module.exports = {
    parseXlsx
};