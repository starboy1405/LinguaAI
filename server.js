
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "100kb" }));

const frontendPath = path.join(__dirname, "/frontend");

function getLanguageCode(language) {
    const languages = {
        english: "en",
        tamil: "ta",
        hindi: "hi",
        telugu: "te",
        malayalam: "ml",
        kannada: "kn",
        french: "fr",
        german: "de",
        spanish: "es",
        japanese: "ja",
        chinese: "zh-CN",
        arabic: "ar",
        auto: "auto"
    };

    const value = String(language || "").trim().toLowerCase();
    return languages[value] || value;
}

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "LinguaAI backend is running!"
    });
});

app.post("/api/translate", async (req, res) => {
    try {
        const { text, source, target } = req.body;

        if (
            typeof text !== "string" ||
            !text.trim() ||
            !source ||
            !target
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter text and select both languages."
            });
        }

        if (Buffer.byteLength(text, "utf8") > 500) {
            return res.status(400).json({
                success: false,
                message: "Please enter shorter text (maximum 500 bytes)."
            });
        }

        const sourceCode = getLanguageCode(source);
        const targetCode = getLanguageCode(target);

        if (sourceCode === targetCode) {
            return res.status(400).json({
                success: false,
                message: "Please select different languages."
            });
        }

        const params = new URLSearchParams({
            client: "gtx",
            sl: sourceCode,
            tl: targetCode,
            dt: "t",
            q: text.trim()
        });

        const apiUrl =
            `https://translate.googleapis.com/translate_a/single?${params}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            return res.status(502).json({
                success: false,
                message: "Translation service is temporarily unavailable."
            });
        }

        const data = await response.json();

        const translatedText = Array.isArray(data[0])
            ? data[0].map(item => item[0] || "").join("")
            : "";

        if (!translatedText) {
            return res.status(502).json({
                success: false,
                message: "Translation could not be completed."
            });
        }

        return res.json({
            success: true,
            translatedText,
            source: sourceCode,
            target: targetCode
        });

    } catch (error) {
        console.error("Translation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to translate right now. Please try again."
        });
    }
});

app.use(express.static(frontendPath));

app.listen(PORT, () => {
    console.log("LinguaAI backend started!");
    console.log(`Application: http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
});
