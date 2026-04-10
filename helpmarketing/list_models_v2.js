async function listModels() {
    const API_KEY = "AIzaSyDhqJrnEu7nHV75D-VnE55GIkFq_IoZ0ok";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("AUTHORIZED MODELS:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("Error response:", data);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

listModels();
