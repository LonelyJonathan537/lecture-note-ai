// ========================================
// State
// ========================================

let summaryController = null;
let examController = null;

let summaryProgressTimer = null;
let examProgressTimer = null;

let summaryCancelled = false;
let examCancelled = false;

let isGenerating = false;


// ========================================
// DOM Elements
// ========================================

const fileInput =
    document.getElementById("file-input");

const fileList =
    document.getElementById("file-list");

const uploadArea =
    document.getElementById("upload-area");

const generateSummaryButton =
    document.getElementById(
        "generate-summary-button"
    );

const generateExamButton =
    document.getElementById(
        "generate-exam-button"
    );

const clearFilesButton =
    document.getElementById(
        "clear-files-button"
    );

const examTips =
    document.getElementById("exam-tips");

const summaryResult =
    document.getElementById(
        "summary-result"
    );

const examPreparationResult =
    document.getElementById(
        "exam-preparation-result"
    );

const cancelSummaryButton =
    document.getElementById(
        "cancel-summary-button"
    );

const cancelExamButton =
    document.getElementById(
        "cancel-exam-button"
    );


// ========================================
// File Selection
// ========================================

fileInput.addEventListener(
    "change",
    () => {

        displaySelectedFiles();
        updateExamButtonState();

    }
);


// ========================================
// Drag & Drop
// ========================================

uploadArea.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        uploadArea.classList.add(
            "dragover"
        );
    }
);


uploadArea.addEventListener(
    "dragleave",
    () => {

        uploadArea.classList.remove(
            "dragover"
        );
    }
);


uploadArea.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        uploadArea.classList.remove(
            "dragover"
        );

        const files =
            event.dataTransfer.files;

        if (files.length === 0) {
            return;
        }

        const dataTransfer =
            new DataTransfer();

        Array.from(files).forEach(file => {

            dataTransfer.items.add(file);

        });

fileInput.files =
    dataTransfer.files;

displaySelectedFiles();
updateExamButtonState();
    }
);


// ========================================
// Display Selected Files
// ========================================

function displaySelectedFiles() {

    fileList.innerHTML = "";

    const files =
        Array.from(fileInput.files);

    files.forEach(file => {

        const item =
            document.createElement("div");

        item.className =
            "file-item";

        item.innerHTML = `
            <div>
                <div class="file-name">
                    📄 ${escapeHtml(file.name)}
                </div>

                <div class="file-size">
                    ${formatFileSize(file.size)}
                </div>
            </div>
        `;

        fileList.appendChild(item);
    });
}


// ========================================
// Clear Files
// ========================================

clearFilesButton.addEventListener(
    "click",
    () => {

        if (isGenerating) {
            return;
        }
fileInput.value = "";

fileList.innerHTML = "";

updateExamButtonState();

        summaryResult.innerHTML = `
            <div class="empty-state">
                <div>📄</div>

                <p>
                    Your lecture summary will appear here.
                </p>
            </div>
        `;

        examPreparationResult.innerHTML = `
            <div class="empty-state">
                <div>🎯</div>

                <p>
                    Your AI exam preparation will appear here.
                </p>
            </div>
        `;
    }
);


// ========================================
// Progress UI
// ========================================

function showProgress(
    type,
    percent,
    status
) {

    const prefix =
        type === "summary"
            ? "summary"
            : "exam";

    const progress =
        document.getElementById(
            `${prefix}-progress`
        );

    const bar =
        document.getElementById(
            `${prefix}-progress-bar`
        );

    const percentText =
        document.getElementById(
            `${prefix}-progress-percent`
        );

    const statusText =
        document.getElementById(
            `${prefix}-progress-status`
        );

    progress.style.display =
        "block";

    bar.style.width =
        `${percent}%`;

    percentText.textContent =
        `${Math.round(percent)}%`;

    statusText.textContent =
        status;
}


// ========================================
// Hide Progress
// ========================================

function hideProgress(type) {

    const prefix =
        type === "summary"
            ? "summary"
            : "exam";

    const progress =
        document.getElementById(
            `${prefix}-progress`
        );

    progress.style.display =
        "none";
}


// ========================================
// Start AI Progress
// ========================================

function startAIProgress(type) {

    let progress = 10;

    showProgress(
        type,
        progress,
        "Uploading lecture materials..."
    );

    const timer =
        setInterval(() => {

            if (progress < 35) {

                progress += 3;

                showProgress(
                    type,
                    progress,
                    "Reading lecture materials..."
                );

            } else if (progress < 60) {

                progress += 1;

                showProgress(
                    type,
                    progress,
                    type === "summary"
                        ? "Analyzing lecture content..."
                        : "Analyzing exam tips and lecture content..."
                );

            } else if (progress < 85) {

                progress += 0.5;

                showProgress(
                    type,
                    progress,
                    type === "summary"
                        ? "Generating AI summary..."
                        : "Generating exam preparation..."
                );

            } else if (progress < 95) {

                progress += 0.2;

                showProgress(
                    type,
                    progress,
                    "Finalizing results..."
                );
            }

        }, 500);


    if (type === "summary") {

        summaryProgressTimer =
            timer;

    } else {

        examProgressTimer =
            timer;
    }
}


// ========================================
// Finish AI Progress
// ========================================

function finishAIProgress(type) {

    stopAIProgressTimer(type);

    showProgress(
        type,
        100,
        "Complete"
    );

    setTimeout(() => {

        hideProgress(type);

    }, 1000);
}


// ========================================
// Stop AI Progress Timer
// ========================================

function stopAIProgressTimer(type) {

    if (type === "summary") {

        if (summaryProgressTimer) {

            clearInterval(
                summaryProgressTimer
            );

            summaryProgressTimer =
                null;
        }

    } else {

        if (examProgressTimer) {

            clearInterval(
                examProgressTimer
            );

            examProgressTimer =
                null;
        }
    }
}


// ========================================
// Cancel AI Progress
// ========================================

function cancelAIProgress(type) {

    stopAIProgressTimer(type);

    const prefix =
        type === "summary"
            ? "summary"
            : "exam";

    const progress =
        document.getElementById(
            `${prefix}-progress`
        );

    const bar =
        document.getElementById(
            `${prefix}-progress-bar`
        );

    const percentText =
        document.getElementById(
            `${prefix}-progress-percent`
        );

    const statusText =
        document.getElementById(
            `${prefix}-progress-status`
        );

    bar.style.width =
        "0%";

    percentText.textContent =
        "0%";

    statusText.textContent =
        "Generation cancelled";

    setTimeout(() => {

        progress.style.display =
            "none";

    }, 800);
}


// ========================================
// Generate Lecture Summary
// ========================================

generateSummaryButton.addEventListener(
    "click",
    async () => {

        const files =
            Array.from(
                fileInput.files
            );

        if (files.length === 0) {

            alert(
                "Please select at least one lecture file."
            );

            return;
        }


        // Reset cancellation state
        summaryCancelled =
            false;

        // Set generating state
        isGenerating =
            true;

        generateSummaryButton.disabled =
            true;

        generateSummaryButton.textContent =
            "Generating...";

        cancelSummaryButton.hidden =
            false;


        // Create controller
        summaryController =
            new AbortController();


        // Start progress
        startAIProgress(
            "summary"
        );


        try {

            const formData =
                new FormData();


            files.forEach(file => {

                formData.append(
                    "files",
                    file
                );

            });


            const response =
                await fetch(
                    "/api/summary",
                    {
                        method: "POST",

                        body: formData,

                        signal:
                            summaryController.signal
                    }
                );


            const data =
                await response.json();


            // User cancelled
            if (summaryCancelled) {
                return;
            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Summary generation failed."
                );
            }


            finishAIProgress(
                "summary"
            );


            displaySummary(
                data.summary
            );


        } catch (error) {

            // Cancellation is not an error
            if (
                error.name === "AbortError" ||
                summaryCancelled
            ) {
                return;
            }


            console.error(error);

            alert(
                error.message
            );

            hideProgress(
                "summary"
            );


        } finally {

            generateSummaryButton.disabled =
                false;

            generateSummaryButton.textContent =
                "Generate Lecture Summary";

            cancelSummaryButton.hidden =
                true;

            summaryController =
                null;

            isGenerating =
                false;
        }
    }
);


// ========================================
// Cancel Lecture Summary
// ========================================

cancelSummaryButton.addEventListener(
    "click",
    () => {

        summaryCancelled =
            true;

        cancelAIProgress(
            "summary"
        );

        if (summaryController) {

            summaryController.abort();
        }
    }
);

// ========================================
// Update Generate Exam button
// ========================================

function updateExamButtonState() {

    const hasFiles =
        fileInput.files.length > 0;

    // Do not change the button while AI is generating
    if (!examController) {
        generateExamButton.disabled = !hasFiles;
    }

}


// ========================================
// Generate Exam Preparation
// ========================================

generateExamButton.addEventListener(
    "click",
    async () => {

        const files =
            Array.from(
                fileInput.files
            );

        if (files.length === 0) {

            alert(
                "Please select at least one lecture file."
            );

            return;
        }


        // Reset cancellation state
        examCancelled =
            false;

        // Set generating state
        isGenerating =
            true;

        generateExamButton.disabled =
            true;

        generateExamButton.textContent =
            "Generating...";

        cancelExamButton.hidden =
            false;


        examPreparationResult.innerHTML = `
            <p>
                AI is analyzing your lecture materials...
            </p>
        `;


        // Create controller
        examController =
            new AbortController();


        // Start progress
        startAIProgress(
            "exam"
        );


        try {

            const formData =
                new FormData();


            files.forEach(file => {

                formData.append(
                    "files",
                    file
                );

            });


            formData.append(
                "examTips",
                examTips.value.trim()
            );


            const response =
                await fetch(
                    "/api/exam-preparation",
                    {
                        method: "POST",

                        body: formData,

                        signal:
                            examController.signal
                    }
                );


            const data =
                await response.json();


            // User cancelled
            if (examCancelled) {
                return;
            }


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Exam preparation generation failed."
                );
            }


            finishAIProgress(
                "exam"
            );


            displayExamPreparation(
                data.preparation
            );


        } catch (error) {

            // Cancellation is not an error
            if (
                error.name === "AbortError" ||
                examCancelled
            ) {
                return;
            }


            console.error(error);


            examPreparationResult.innerHTML =
                `
                    <p>
                        ❌ ${escapeHtml(
                            error.message
                        )}
                    </p>
                `;


            hideProgress(
                "exam"
            );


        } finally {

            generateExamButton.disabled =
                false;

            generateExamButton.textContent =
                "Generate Exam Preparation";

            cancelExamButton.hidden =
                true;

            examController =
                null;

            isGenerating =
                false;
        }
    }
);


// ========================================
// Cancel Exam Preparation
// ========================================

cancelExamButton.addEventListener(
    "click",
    () => {

        examCancelled =
            true;

        cancelAIProgress(
            "exam"
        );

        if (examController) {

            examController.abort();
        }
    }
);


// ========================================
// Display Summary
// ========================================

function displaySummary(summary) {

    let html = `

        <table>

            <thead>

                <tr>

                    <th>
                        Title
                    </th>

                    <th>
                        Slide / Page
                    </th>

                    <th>
                        Summary
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    summary.forEach(item => {

        html += `

            <tr>

                <td>
                    ${escapeHtml(
                        item.title
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item.slides
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item.summary
                    )}
                </td>

            </tr>

        `;
    });


    html += `

            </tbody>

        </table>

    `;


    summaryResult.innerHTML =
        html;
}


// ========================================
// Display Exam Preparation
// ========================================

function displayExamPreparation(
    preparation
) {

    // Backend could not process the lecture
    if (preparation.note) {

        examPreparationResult.innerHTML = `

            <div class="empty-state">

                <div>
                    ⚠️
                </div>

                <h3>
                    Unable to Generate Exam Preparation
                </h3>

                <p>
                    ${escapeHtml(
                        preparation.note
                    )}
                </p>

            </div>

        `;

        return;
    }


    examPreparationResult.innerHTML = `

        <h3>
            🔴 High Priority Topics
        </h3>

        <ul>

            ${(
                preparation.highPriority || []
            ).map(item => `

                <li>

                    <strong>
                        ${escapeHtml(
                            item.topic
                        )}
                    </strong>

                    <br>

                    <small>
                        Slides:
                        ${escapeHtml(
                            item.slides
                        )}
                    </small>

                    <br>

                    ${escapeHtml(
                        item.reason
                    )}

                </li>

            `).join("")}

        </ul>


        <h3>
            🟡 Medium Priority Topics
        </h3>

        <ul>

            ${(
                preparation.mediumPriority || []
            ).map(item => `

                <li>

                    <strong>
                        ${escapeHtml(
                            item.topic
                        )}
                    </strong>

                    <br>

                    <small>
                        Slides:
                        ${escapeHtml(
                            item.slides
                        )}
                    </small>

                    <br>

                    ${escapeHtml(
                        item.reason
                    )}

                </li>

            `).join("")}

        </ul>


        <h3>
            📚 Key Definitions
        </h3>

        <ul>

            ${(
                preparation.keyDefinitions || []
            ).map(item => `

                <li>

                    <strong>
                        ${escapeHtml(
                            item.term
                        )}
                    </strong>

                    <br>

                    ${escapeHtml(
                        item.definition
                    )}

                    <br>

                    <small>
                        Slides:
                        ${escapeHtml(
                            item.slides
                        )}
                    </small>

                </li>

            `).join("")}

        </ul>


        <h3>
            📝 Possible Exam Questions
        </h3>

        <ol>

            ${(
                preparation.possibleQuestions || []
            ).map(item => `

                <li>

                    ${escapeHtml(
                        item.question
                    )}

                    <br>

                    <small>
                        Slides:
                        ${escapeHtml(
                            item.slides
                        )}
                    </small>

                </li>

            `).join("")}

        </ol>

    `;
}


// ========================================
// Chat
// ========================================

const sendButton =
    document.getElementById(
        "send-button"
    );

const chatMessage =
    document.getElementById(
        "chat-message"
    );

const chatBox =
    document.getElementById(
        "chat-box"
    );


sendButton.addEventListener(
    "click",
    sendChatMessage
);


chatMessage.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendChatMessage();
        }
    }
);


// ========================================
// Send Chat Message
// ========================================

async function sendChatMessage() {

    const message =
        chatMessage.value.trim();

    if (!message) {
        return;
    }


    sendButton.disabled =
        true;

    sendButton.textContent =
        "Thinking...";


    const userMessage =
        document.createElement(
            "div"
        );

    userMessage.className =
        "chat-user";

    userMessage.innerHTML =
        `
            <strong>You</strong><br>
            ${escapeHtml(message)}
        `;


    chatBox.appendChild(
        userMessage
    );


    chatMessage.value =
        "";


    const aiMessage =
        document.createElement(
            "div"
        );

    aiMessage.className =
        "chat-ai";

    aiMessage.innerHTML = `
        <strong>AI</strong><br>
        Thinking...
    `;


    chatBox.appendChild(
        aiMessage
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;


    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to get AI response."
            );
        }


        aiMessage.innerHTML = `

            <strong>
                AI
            </strong>

            <br>

            ${formatAIResponse(
                data.answer
            )}

        `;


    } catch (error) {

        aiMessage.innerHTML = `

            <strong>
                AI
            </strong>

            <br>

            ❌ ${escapeHtml(
                error.message
            )}

        `;


    } finally {

        sendButton.disabled =
            false;

        sendButton.textContent =
            "Send ➤";

        chatBox.scrollTop =
            chatBox.scrollHeight;
    }
}


// ========================================
// AI Response Formatting
// ========================================

function formatAIResponse(text) {

    if (!text) {

        return "No response received.";
    }


    let formatted =
        escapeHtml(text);


    formatted =
        formatted.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    formatted =
        formatted.replace(
            /^### (.*?)$/gm,
            "<h4>$1</h4>"
        );


    formatted =
        formatted.replace(
            /^## (.*?)$/gm,
            "<h3>$1</h3>"
        );


    formatted =
        formatted.replace(
            /^# (.*?)$/gm,
            "<h2>$1</h2>"
        );


    formatted =
        formatted.replace(
            /^[-*] (.*?)$/gm,
            "• $1"
        );


    formatted =
        formatted.replace(
            /\n/g,
            "<br>"
        );


    return formatted;
}


// ========================================
// Escape HTML
// ========================================

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text ?? "";

    return div.innerHTML;
}


// ========================================
// File Size
// ========================================

function formatFileSize(bytes) {

    if (bytes < 1024) {

        return `${bytes} B`;
    }


    if (
        bytes <
        1024 * 1024
    ) {

        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }


    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;
}

updateExamButtonState();