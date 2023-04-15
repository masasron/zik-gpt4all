# zik-gpt4all

A simple server for streaming GPT4ALL models outputs using server-sent events.

## GPT4All-J

If you want to use the GPT4All-J model, follow these steps:

1. Download the raw model from
   [here](https://gpt4all.io/models/ggml-gpt4all-j.bin) or from the
   [GPT4ALL Repository](https://github.com/nomic-ai/gpt4all).
2. Clone and build the ggml repository using the following commands:

```sh
git clone https://github.com/masasron/ggml
cd ggml
mkdir build && cd build
cmake ..
make -j4 gpt-j
```

3. Start the zik-gpt4all server using the following command:

```sh
git clone https://github.com/masasron/zik-gpt4all.git
cd zik-gpt4all
npm install
MODEL_PATH={YOUR_MODEL_PATH} MODEL_EXE_PATH={../ggml/build/bin/gpt-j} node src/ggml-server.js
```

The server should be running on port 3001. Update the server URL on the Zik
settings page and give it a try.

## GPT4ALL (LLaMa)

If you want to use the LLaMa based GPT4ALL model, make sure it is working on
your local machine before running the server. Follow the instructions provided
in the [GPT4ALL Repository](https://github.com/nomic-ai/gpt4all).

Once you have the LLaMa based GPT4ALL model ready, start the zik-gpt4all server
using the following command:

```sh
git clone https://github.com/masasron/zik-gpt4all.git
cd zik-gpt4all
npm install
MODEL_PATH={YOUR_MODEL_PATH} MODEL_EXE_PATH={../ggml/build/bin/gpt-j} node src/server.js
```

The server should be running on port 3001. Update the server URL on the Zik
settings page and give it a try.
