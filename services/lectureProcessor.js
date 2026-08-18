const fs = require("fs");
const path = require("path");

const { parsePptx } =
    require("./pptxParser");

const { parsePdf } =
    require("./pdfParser");

const { parseDocx } =
    require("./docxParser");

const { parseXlsx } =
    require("./xlsxParser");

const { parseTxt } =
    require("./txtParser");


async function processLectureFile(
    filePath,
    originalName
) {

    const extension =
        path.extname(originalName)
            .toLowerCase();

    let slides;


    switch (extension) {

        case ".pptx":

            slides =
                await parsePptx(filePath);

            break;


        case ".pdf":

            slides =
                await parsePdf(filePath);

            break;


        case ".docx":

            slides =
                await parseDocx(filePath);

            break;


        case ".xlsx":
        case ".xls":

            slides =
                await parseXlsx(filePath);

            break;


        case ".txt":

            slides =
                await parseTxt(filePath);

            break;


        default:

            throw new Error(
                `Unsupported lecture file type: ${extension}`
            );
    }


    if (!slides || slides.length === 0) {

        throw new Error(
            `No readable content found in ${originalName}`
        );

    }


    return {

        file: originalName,

        slideCount: slides.length,

        slides: slides

    };
}



async function processLectureFiles(directory) {

    const files =
        fs.readdirSync(directory);


    const supportedExtensions = [
        ".pptx",
        ".pdf",
        ".docx",
        ".xlsx",
        ".xls",
        ".txt"
    ];


    const lectureFiles =
        files.filter(file =>
            supportedExtensions.includes(
                path.extname(file).toLowerCase()
            )
        );


    if (lectureFiles.length === 0) {

        throw new Error(
            "No supported lecture files found."
        );

    }


    const lectures = [];


    for (const file of lectureFiles) {

        const filePath =
            path.join(directory, file);

        console.log(
            `Processing: ${file}`
        );


        try {

            const lecture =
                await processLectureFile(
                    filePath,
                    file
                );


            lectures.push(lecture);


            console.log(
                `✓ ${file}: ${lecture.slides.length} pages/slides`
            );


        } catch (error) {

            console.error(
                `✗ Failed to process ${file}`
            );

            console.error(error);

        }

    }


    return {

        lectureCount:
            lectures.length,

        lectures

    };
}


module.exports = {

    processLectureFile,

    processLectureFiles

};