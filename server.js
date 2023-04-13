import cors from "cors";
import express from "express";
import GPT4All from "./gpt4all.js";

const PORT = process.env.SERVER_PORT || 3001;
const HOST = process.env.SERVER_HOST || "0.0.0.0";

const server = express();

server.use(cors());

server.post("/", express.json(), async (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    });

    const messages = req.body.messages;

    if (messages.length === 0) {
        res.write(`data: [DONE]\n\n`);
        return res.end();
    }

    console.log("opening session");
    const session = new GPT4All();
    session.open();

    // sometimes the first message is an \f, so we ignore it
    let isFirstMessage = true;

    session.onData((data) => {
        if (!isFirstMessage && data.includes("\f")) {
            session.close();
            res.write(`data: [DONE]\n\n`);
            return res.end();
        }

        isFirstMessage = false;
        // replace \r with \n to make it look nicer
        data = data.replace(/\r/g, "\n");
        // write data to client
        res.write(`data: ${JSON.stringify({
            choices: [{ delta: { content: data } }]
        })}\n\n`);
    });

    let prompt = "";
    for (const message of messages) {
        prompt += message.content + "\r";
    }

    session.prompt(prompt);
});

server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});