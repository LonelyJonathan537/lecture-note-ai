const {
    processLectureFiles
} = require("./services/lectureProcessor");

async function test() {

    try {

        const result =
            await processLectureFiles("./uploads");

        console.log("\n================================");
        console.log("LECTURE PROCESSING COMPLETE");
        console.log("================================\n");

        console.log(
            `Lectures: ${result.lectureCount}`
        );

        result.lectures.forEach(lecture => {

            console.log("\n--------------------------------");
            console.log(`File: ${lecture.file}`);
            console.log(
                `Slides: ${lecture.slideCount}`
            );
            console.log("--------------------------------");

            lecture.slides.slice(0, 3).forEach(slide => {

                console.log(
                    `Slide ${slide.slide}: ${slide.title}`
                );

                console.log(
                    slide.content.substring(0, 300)
                );

                console.log("");
            });

            if (lecture.slideCount > 3) {
                console.log(
                    `... ${lecture.slideCount - 3} more slides`
                );
            }
        });

    } catch (error) {

        console.error(
            "Lecture processing failed:"
        );

        console.error(error);
    }
}

test();