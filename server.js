const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const { parseFile } = require("./services/fileParser");
const { askBedrock } = require("./services/bedrockService");

const app = express();
const PORT = process.env.PORT || 3000;

// Stores the currently uploaded lecture content
// so the AI Chat can use the original lecture material.
let currentLectureContent = "";

// ================================
// Middleware
// ================================

app.use(cors());

app.use(express.json({
    limit: "50mb"
}));

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static("public"));

// ================================
// Upload configuration
// ================================

const upload = multer({
    dest: "uploads/"
});

// ================================
// Supported file types
// ================================

const supportedExtensions = [
    ".pptx",
    ".pdf",
    ".docx",
    ".xlsx",
    ".xls",
    ".txt"
];


// ================================
// Health check
// ================================

app.get("/api/health", (req, res) => {

    res.json({
        status: "ok",
        message: "Lecture Note AI server is running"
    });

});


// ================================
// Build lecture content
// ================================

function buildLectureContent(lectures) {

    let lectureContent = "";

    lectures.forEach(lecture => {

        lectureContent +=
            `\n\n===== ${lecture.file} =====\n`;

        lecture.pages.forEach(page => {

            lectureContent +=
                `\n[${lecture.type.toUpperCase()} - ${page.page}]\n`;

            lectureContent +=
                `Title: ${page.title || "Untitled"}\n`;

            lectureContent +=
                `${page.content}\n`;

        });

    });

    return lectureContent;
}


// ================================
// Lecture Summary
// ================================

app.post(
    "/api/summary",
    upload.array("files"),
    async (req, res) => {

        try {

            if (!req.files || req.files.length === 0) {

                return res.status(400).json({
                    error: "Please upload at least one lecture file."
                });

            }

            console.log(
                `Received ${req.files.length} lecture file(s)`
            );

            const lectures = [];

            // --------------------------------
            // Read every uploaded file
            // --------------------------------

            for (const file of req.files) {

                console.log(
                    `Processing: ${file.originalname}`
                );

                try {

                    const extension =
                        path.extname(
                            file.originalname
                        ).toLowerCase();

                    if (!supportedExtensions.includes(extension)) {

                        throw new Error(
                            `Unsupported file format: ${extension}`
                        );

                    }

                    const lecture =
                        await parseFile(
                            file.path,
                            file.originalname
                        );

                    lectures.push({
                        file: file.originalname,
                        type: lecture.type,
                        pages: lecture.pages
                    });

                    console.log(
                        `✓ ${file.originalname}: ${lecture.pages.length} pages/slides`
                    );

                } catch (error) {

                    console.error(
                        `✗ Failed to process ${file.originalname}`
                    );

                    console.error(error);

                }

            }

            if (lectures.length === 0) {

                return res.status(400).json({
                    error: "Unable to read the uploaded lecture files."
                });

            }

            // --------------------------------
            // Prepare content
            // --------------------------------

            const lectureContent =
                buildLectureContent(lectures);
                currentLectureContent = lectureContent;

            console.log(
                "Lecture content prepared for Bedrock"
            );

            // --------------------------------
            // AI prompt
            // --------------------------------

            const prompt = `
You are a university lecture summarization assistant.

Read the lecture material carefully and create a clear, useful study summary.

The uploaded lecture material is the source of truth.

Accuracy is very important, but do not artificially force terminology or assumptions. Read the actual source content and preserve what the lecturer wrote.

Guidelines:

- Base the summary on the uploaded lecture material.
- Do not add unrelated outside knowledge.
- Preserve important technical terminology.
- Preserve formulas and calculations accurately.
- Preserve numerical values accurately.
- Preserve examples accurately.
- Preserve definitions accurately.
- Preserve important lists, steps, classifications, tables and comparisons.
- Do not silently change technical terms.
- If the source says KLOC, keep KLOC.
- If the source says KDSI, keep KDSI.
- Do not assume that similar-looking terms mean the same thing.
- Pay close attention to formulas, symbols, numbers and units.
- Do not invent information that cannot be found in the source.
- Do not unnecessarily copy every sentence. Summarize naturally like a human lecturer or study note.
- Group related slides together when appropriate.
- Include the correct slide/page numbers.
- Make the summary easy for a university student to study.

Before producing the answer, carefully compare the generated summary against the supplied source material and correct obvious reading or transcription mistakes.

Return ONLY valid JSON.

Format:

{
    "summary": [
        {
            "lecture": "Original filename",
            "title": "Topic",
            "slides": "1-3",
            "summary": "Human-readable and accurate summary."
        }
    ]
}

LECTURE MATERIALS:

${lectureContent}
`;

            console.log(
                "Sending lecture content to Bedrock..."
            );

            const aiResponse =
                await askBedrock(prompt);

            console.log(
                "Bedrock response received"
            );

            // --------------------------------
            // Parse AI response
            // --------------------------------

            let result;

            try {

                result =
                    JSON.parse(aiResponse);

            } catch (error) {

                console.error(
                    "Bedrock returned invalid JSON:"
                );

                console.error(aiResponse);

                return res.status(500).json({
                    error:
                        "AI returned invalid summary format.",
                    raw: aiResponse
                });

            }

            // --------------------------------
            // Delete uploaded files
            // --------------------------------

            cleanupUploadedFiles(req.files);

            // --------------------------------
            // Return result
            // --------------------------------

            res.json({

                success: true,

                summary:
                    result.summary || []

            });

        } catch (error) {

            console.error(
                "Summary generation error:"
            );

            console.error(error);

            cleanupUploadedFiles(req.files);

            res.status(500).json({
                error:
                    "Failed to generate lecture summary."
            });

        }

    }
);


// ================================
// Exam Preparation
// ================================

app.post(
    "/api/exam-preparation",
    upload.array("files"),
    async (req, res) => {

        try {

            if (!req.files || req.files.length === 0) {

                return res.status(400).json({
                    error: "Please upload at least one lecture file."
                });

            }

            const examTips =
                req.body.examTips?.trim() || "";

            console.log(
                `Received ${req.files.length} lecture file(s) for exam preparation`
            );

            const lectures = [];

            // --------------------------------
            // Process lecture files
            // --------------------------------

            for (const file of req.files) {

                console.log(
                    `Processing: ${file.originalname}`
                );

                try {

                    const lecture =
                        await parseFile(
                            file.path,
                            file.originalname
                        );

                    lectures.push({
                        file: file.originalname,
                        type: lecture.type,
                        pages: lecture.pages
                    });

                    console.log(
                        `✓ Processed ${file.originalname}: ${lecture.pages.length} pages/slides`
                    );

                } catch (error) {

                    console.error(
                        `✗ Failed to process ${file.originalname}`
                    );

                    console.error(error);

                }

            }

            if (lectures.length === 0) {

                cleanupUploadedFiles(req.files);

                return res.status(400).json({
                    error:
                        "Unable to read lecture materials."
                });

            }

            // --------------------------------
            // Prepare lecture content
            // --------------------------------

            const lectureContent =
                buildLectureContent(lectures);

            // --------------------------------
            // Exam tips
            // --------------------------------

            const examTipsSection =
                examTips.length > 0
                    ? `
EXAM TIPS PROVIDED BY THE LECTURER:

${examTips}
`
                    : `
NO EXAM TIPS WERE PROVIDED.
Use the lecture materials themselves to determine what should be studied.
`;

            // --------------------------------
            // AI prompt
            // --------------------------------

            const prompt = `
You are a university exam preparation assistant.

Create a useful, natural and accurate exam preparation guide from the uploaded lecture materials.

${examTipsSection}

The uploaded lecture materials are the primary source.

Accuracy is very important. Carefully read the actual lecture content before deciding what is important.

Guidelines:

- Base the preparation on the uploaded lecture materials.
- Do not invent lecture content.
- Do not introduce unrelated outside knowledge.
- Preserve the lecturer's terminology.
- Preserve formulas accurately.
- Preserve numerical values accurately.
- Preserve units accurately.
- Preserve examples accurately.
- Preserve definitions accurately.
- Pay particular attention to formulas, calculations, constants, terminology and technical details.
- Do not automatically replace one technical term with another.
- If the lecture uses KLOC, use KLOC.
- If the lecture uses KDSI, use KDSI.
- Determine important topics from the actual lecture rather than using a generic exam template.
- Use the lecturer's exam tips to help prioritize topics when they are provided.
- Include slide/page references.
- Possible questions must be answerable from the uploaded lecture material.
- Make the preparation feel like a human-created university study guide.
- Do not make every topic high priority.
- Focus on material that is actually important for understanding or examination.
- Include calculations and formulas where relevant.
- Include conceptual questions where relevant.
- Include comparison questions where relevant.
- Include definition questions where relevant.

Before producing the final answer, compare the important details against the supplied lecture material and correct obvious mistakes.

Return ONLY valid JSON.

Use exactly this structure:

{
    "highPriority": [
        {
            "topic": "Topic",
            "slides": "5-8",
            "reason": "Why this topic deserves high priority."
        }
    ],

    "mediumPriority": [
        {
            "topic": "Topic",
            "slides": "9-11",
            "reason": "Why this topic should be revised."
        }
    ],

    "keyDefinitions": [
        {
            "term": "Term",
            "definition": "Accurate definition based on the lecture.",
            "slides": "3"
        }
    ],

    "possibleQuestions": [
        {
            "question": "Possible exam question based on the lecture.",
            "slides": "10-12"
        }
    ]
}

LECTURE MATERIALS:

${lectureContent}
`;

            console.log(
                "Sending exam preparation to Bedrock..."
            );

            const aiResponse =
                await askBedrock(prompt);

            console.log(
                "Bedrock exam preparation received"
            );

            // --------------------------------
            // Parse JSON
            // --------------------------------

            let result;

            try {

                result =
                    JSON.parse(aiResponse);

            } catch (error) {

                console.error(
                    "❌ AI returned invalid exam preparation format."
                );

                console.error(
                    aiResponse
                );

                cleanupUploadedFiles(req.files);

                return res.status(500).json({
                    error:
                        "AI returned invalid exam preparation format.",
                    raw: aiResponse
                });

            }

            // --------------------------------
            // Delete files
            // --------------------------------

            cleanupUploadedFiles(req.files);

            // --------------------------------
            // Return result
            // --------------------------------

            res.json({

                success: true,

                preparation: result

            });

        } catch (error) {

            console.error(
                "Exam preparation error:"
            );

            console.error(error);

            cleanupUploadedFiles(req.files);

            res.status(500).json({

                error:
                    "Failed to generate exam preparation."

            });

        }

    }
);

// ================================
// AI Study Assistant
// ================================

app.post(
    "/api/chat",
    async (req, res) => {

        try {

            const message =
                req.body.message?.trim() || "";

            if (!message) {

                return res.status(400).json({
                    error: "Message is required."
                });

            }

            if (!currentLectureContent) {

                return res.status(400).json({
                    error:
                        "Please upload lecture materials first."
                });

            }

            console.log(
                `AI Chat question: ${message}`
            );

 const prompt = `
You are an AI university study assistant.

The student is asking a question about the lecture materials
they uploaded.

Your job is to help the student understand and study the
uploaded lecture materials while staying as accurate as
possible to the original source.

SOURCE ACCURACY IS THE HIGHEST PRIORITY.

Use the uploaded lecture materials as the primary source for
your answer.

IMPORTANT GUIDELINES:

1. Carefully read the relevant lecture content before answering.

2. Base the answer on information actually present in the
   uploaded lecture materials.

3. Do not intentionally add outside textbook information when
   the lecture already provides the answer.

4. Do not invent information that is not supported by the
   uploaded lecture materials.

5. Preserve the terminology used in the lecture whenever
   possible.

6. Do not automatically replace, correct, normalize, or
   reinterpret terminology from the lecture.

7. Preserve formulas as accurately as possible, including
   symbols, variables, operators, exponents, constants, and
   units.

8. Preserve numerical values and calculation examples
   accurately.

9. Preserve definitions and technical terms accurately.

10. Preserve examples from the lecture when they are relevant
    to the student's question.

11. If the lecture contains a specific explanation, prefer that
    explanation instead of giving a generic textbook explanation.

12. You may explain difficult lecture content in simpler,
    natural language, but do not change the underlying meaning.

13. If multiple slides contain information relevant to the
    question, you may connect them when the connection is
    supported by the lecture.

14. Do not assume that similar terms mean the same thing if the
    lecture distinguishes between them.

15. Do not change units or numerical notation.

16. Do not silently fix apparent spelling, terminology, formula,
    or numerical differences in the lecture. Follow the source
    content as extracted.

17. If the extracted lecture content appears unclear or
    incomplete, do not guess what the lecturer intended. Explain
    only what can reasonably be determined from the available
    content.

18. If the answer cannot be found in the uploaded lecture
    materials, clearly tell the student that the information
    could not be found in the uploaded materials rather than
    inventing an answer.

19. When useful, mention the relevant slide or page number.

20. Answer naturally like a helpful university tutor. Do not
    sound robotic or unnecessarily repeat the rules.

21. Keep the answer focused on the student's question while
    retaining important technical details.

22. Before answering, internally compare your answer against the
    relevant uploaded lecture content and check terminology,
    formulas, numbers, units, definitions, examples, and
    slide/page references.

UPLOADED LECTURE MATERIALS:

${currentLectureContent}

STUDENT QUESTION:

${message}

Answer the student's question now.
`;

            console.log(
                "Sending chat question to Bedrock..."
            );

            const answer =
                await askBedrock(prompt);

            console.log(
                "Chat response received"
            );

            res.json({

                success: true,

                answer: answer

            });

        } catch (error) {

            console.error(
                "AI Chat error:"
            );

            console.error(error);

            res.status(500).json({

                error:
                    "Failed to generate AI response."

            });

        }

    }
);


// ================================
// File cleanup
// ================================

function cleanupUploadedFiles(files) {

    if (!files) {
        return;
    }

    for (const file of files) {

        try {

            if (file.path &&
                fs.existsSync(file.path)) {

                fs.unlinkSync(file.path);

                console.log(
                    `Deleted temporary file: ${file.originalname}`
                );

            }

        } catch (error) {

            console.error(
                `Could not delete ${file.originalname}:`,
                error.message
            );

        }

    }

}


// ================================
// Start server
// ================================

app.listen(PORT, () => {

    console.log(
        `Lecture Note AI running at http://localhost:${PORT}`
    );

});