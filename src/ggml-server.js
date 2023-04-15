import cors from "cors";
import crypto from "crypto";
import express from "express";
import GPT4ALL from "./ggml-gpt4all.js";

const PORT = process.env.SERVER_PORT || 3001;
const HOST = process.env.SERVER_HOST || "0.0.0.0";

const server = express();
const gpt4all_instances = new Map();
const max_concurrent_instances = 3;

function clearOldestInstance() {
    if (gpt4all_instances.size > max_concurrent_instances) {
        const keys = Array.from(gpt4all_instances.keys());
        const oldest_key = keys[0];
        const oldest_instance = gpt4all_instances.get(oldest_key);
        if (oldest_instance && oldest_instance.child && oldest_instance.child.pid) {
            console.log("[+] Killing oldest instance");
            oldest_instance.child.kill();
        }
        console.log("[+] Removing oldest instance from cache");
        gpt4all_instances.delete(oldest_key);
    }
}

function sha256(text) {
    const hash = crypto.createHash('sha256');
    hash.update(text);
    return hash.digest('hex');
}

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

    const messages_hash = sha256(JSON.stringify(messages.slice(0, -2)));

    let prompt = null;
    let gpt4all = gpt4all_instances.get(messages_hash);

    if (!gpt4all || !gpt4all.child || !gpt4all.child.pid) {
        prompt = messages
            .filter(msg => msg.role === "user" || msg.role === "assistant")
            .map(({ content }) => content).join("\n");

        gpt4all = new GPT4ALL({
            context: res,
            n_predict: req.body?.max_tokens || 200,
            onStream: (content, _res) => {
                _res.write(`data: ${JSON.stringify({
                    choices: [{ delta: { content } }]
                })}\n\n`);
            },
            onReplyDone: (_, _res) => {
                _res.write(`data: [DONE]\n\n`);
                _res.end();
            },
            model_exe_path: process.env.MODEL_EXE_PATH,
            model_path: process.env.MODEL_PATH
        });
        gpt4all_instances.set(sha256(JSON.stringify(messages)), gpt4all);
        clearOldestInstance();
    } else {
        let { content } = messages[messages.length - 1];
        prompt = content;
        gpt4all.setContext(res);
        gpt4all_instances.delete(messages_hash);
        gpt4all_instances.set(sha256(JSON.stringify(messages)), gpt4all);
    }

    gpt4all.prompt(prompt);
});

server.listen(PORT, HOST, (err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log(`Server running on http://${HOST}:${PORT}`);
});