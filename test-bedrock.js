require("dotenv").config();

const {
    BedrockRuntimeClient,
    InvokeModelCommand
} = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({
    region: "us-east-1"
});

async function test() {

    const command = new InvokeModelCommand({

        modelId: "us.anthropic.claude-haiku-4-5-20251001-v1:0",

        body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",

            max_tokens: 100,

            messages: [
                {
                    role: "user",

                    content: [
                        {
                            type: "text",

                            text: "Say hello in one sentence."
                        }
                    ]
                }
            ]
        })
    });

    const response =
        await client.send(command);

    const result =
        JSON.parse(
            new TextDecoder().decode(response.body)
        );

    console.log(result.content[0].text);
}

test().catch(error => {

    console.error("Bedrock test failed:");

    console.error(error);

});