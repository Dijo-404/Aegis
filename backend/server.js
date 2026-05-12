import { fileURLToPath } from "url";
import path from "path";
import { getLlama, LlamaChatSession } from "node-llama-cpp";
import express from 'express';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

let context;

async function init() {
    console.log("Loading Llama model...");
    const llama = await getLlama();
    const model = await llama.loadModel({
        modelPath: path.join(__dirname, "../public/models/llm/mistral-7b-q4.gguf")
    });
    context = await model.createContext();
    console.log("Model loaded successfully!");
}

init().catch(console.error);

app.post('/api/generate', async (req, res) => {
    try {
        if (!context) {
            return res.status(503).json({ error: "Model is still loading" });
        }
        const { prompt } = req.body;
        console.log("Received prompt:", prompt);
        
        const session = new LlamaChatSession({
            contextSequence: context.getSequence()
        });
        
        try {
            const answer = await session.prompt(prompt);
            console.log("Generated answer:", answer);
            res.json({ text: answer });
        } finally {
            session.dispose();
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.toString() });
    }
});

app.listen(3001, () => {
    console.log("Backend listening on port 3001");
});
