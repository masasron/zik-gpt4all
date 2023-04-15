import fs from "fs";
import { spawn } from "child_process";

const DONE = "[DONE]";
const ENDOFETXT = "<|endoftext|>";

class GPT4ALL {

    constructor({ context = null, onStream = null, onReplyDone = null, model_exe_path = null, model_path = null, threads = 8, n_predict = 200, temp = 0.9 }) {
        let noop = () => { };
        this.child = null;
        this.context = context;
        this._current_output = "";

        this.temp = temp.toString();
        this.threads = threads.toString();
        this.n_predict = n_predict.toString();

        this.onStream = onStream || noop;
        this.onReplyDone = onReplyDone || noop;

        this.model_path = model_path || process.env.MODEL_PATH;
        this.model_exe_path = model_exe_path || process.env.MODEL_EXE_PATH;

        if (!this.model_path || !this.model_exe_path) {
            throw new Error("MODEL_EXE_PATH and MODEL_PATH must be set");
        }

        if (!fs.existsSync(this.model_path)) {
            throw new Error("MODEL_PATH does not exist");
        }

        if (!fs.existsSync(this.model_exe_path)) {
            throw new Error("MODEL_EXE_PATH does not exist");
        }
    }

    setContext(context) {
        this.context = context;
        return this;
    }

    prompt(text) {
        if (typeof text !== "string") {
            throw new Error("text must be a string");
        }

        text = text.trim();

        if (text.length === 0) {
            console.log("[!] Empty prompt");
            return;
        }

        console.log("[+] sending prompt:", text);

        if (this.child && this.child.pid) {
            this.child.stdin.write(text);
            this.child.stdin.write("\n");
            return;
        }

        this.child = spawn(this.model_exe_path, [
            '-m', this.model_path,
            '-p', text,
            '-t', this.threads,
            '-n', this.n_predict,
            '--temp', this.temp,
        ]);

        this.child.on("close", code => {
            console.log(`child process exited with code ${code}`);
        });

        this.child.on("error", err => {
            console.log(`child process exited with error ${err}`);
        });

        this.child.stdout.on("data", data => {
            data = data.toString("utf-8");
            this._current_output += data;

            if (data === ENDOFETXT) {
                return;
            }

            if (this._current_output.trim() === ENDOFETXT + DONE) {
                console.log("[!] Empty reply from model");
                this.onReplyDone("", this.context);
                return;
            }

            if (this._current_output.endsWith(DONE)) {
                let message = this._current_output.slice(0, -DONE.length);
                if (message.endsWith(ENDOFETXT)) {
                    message = message.slice(0, -ENDOFETXT.length);
                }
                this._current_output = "";
                this.onReplyDone(message, this.context);
                return;
            }

            this.onStream(data, this.context);
        });
    }

}

export default GPT4ALL;