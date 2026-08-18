const { parsePptx } = require("./services/pptxParser");

async function test() {

    try {

        const filePath =
            "./uploads/1787066458256-610814125.pptx";

        const slides = await parsePptx(filePath);

        console.log("\n========== PPTX CONTENT ==========\n");

        slides.forEach(slide => {

            console.log(`Slide ${slide.slide}`);
            console.log(`Title: ${slide.title}`);
            console.log(`Content: ${slide.content}`);
            console.log("-----------------------------------");

        });

        console.log(`\nTotal slides: ${slides.length}`);

    } catch (error) {

        console.error("PPTX parsing failed:");
        console.error(error);

    }
}

test();