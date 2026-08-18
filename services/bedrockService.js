require("dotenv").config();

const {
    BedrockRuntimeClient,
    InvokeModelCommand
} = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1"
});

async function askBedrock(prompt) {

    console.log("Calling Bedrock...");

    const command = new InvokeModelCommand({

        modelId:
            process.env.BEDROCK_MODEL_ID ||
            "us.anthropic.claude-haiku-4-5-20251001-v1:0",

        body: JSON.stringify({

            anthropic_version:
                "bedrock-2023-05-31",

            max_tokens: 8000,

            messages: [
                {
                    role: "user",

                    content: [
                        {
                            type: "text",
                            text: prompt
                        }
                    ]
                }
            ]

        })

    });

    const response =
        await client.send(command);

    const raw =
        new TextDecoder().decode(response.body);

    const result =
        JSON.parse(raw);

    let text =
        result.content
            .map(item => item.text || "")
            .join("\n")
            .trim();

    console.log("Raw AI text received:");
    console.log(text.substring(0, 100));

// =========================================
// Clean AI response
// =========================================

text = text.trim();

// Remove markdown code fences if present
text = text.replace(/^```json\s*/i, "");
text = text.replace(/^```\s*/i, "");
text = text.replace(/\s*```$/i, "");

text = text.trim();

// Find JSON object
const firstBrace = text.indexOf("{");
const lastBrace = text.lastIndexOf("}");

if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
) {
    text = text.substring(
        firstBrace,
        lastBrace + 1
    );
}

console.log("Cleaned AI response:");
console.log(text);
    return text;
}

module.exports = {
    askBedrock
};