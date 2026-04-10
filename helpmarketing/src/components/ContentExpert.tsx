import { useState } from 'react';
import { generateMarketingContent, sendToN8n } from '../services/geminiService';

interface PostIdea {
    title: string;
    copy: string;
    hashtags: string[];
    platform: string;
}

export const ContentExpert = () => {
    const [prompt, setPrompt] = useState('');
    const [platform, setPlatform] = useState('LinkedIn');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [generatedPost, setGeneratedPost] = useState<PostIdea | null>(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        console.log("Generating content for:", platform, "with prompt:", prompt);
        try {
            const result = await generateMarketingContent(prompt, platform);
            console.log("Gemini result:", result);
            if (!result || (!result.copy && !result.content)) {
                throw new Error("Respuesta de IA incompleta");
            }
            setGeneratedPost({
                title: result.title || "Post Sugerido",
                copy: result.copy || result.content || "",
                hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
                platform
            });
        } catch (error: any) {
            console.error("Generation error:", error);
            alert(`Error al generar contenido: ${error.message || "Verifica tu conexión y API Key"}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendToN8n = async () => {
        if (!generatedPost) return;
        setIsSending(true);
        try {
            await sendToN8n(generatedPost);
            alert("¡Post enviado a n8n con éxito! Revisa tu flujo de automatización.");
        } catch (error) {
            alert("Error al enviar a n8n. Asegúrate de configurar VITE_N8N_WEBHOOK_URL en tu archivo .env");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1>Social Media Expert</h1>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2.5rem' }}>Generate professional content for your social networks using Google Gemini.</p>

            <div className="glass-card" style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
                <h3 style={{ marginTop: 0 }}>Create a New Post</h3>

                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {['LinkedIn', 'Facebook', 'Instagram', 'TikTok'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPlatform(p)}
                            style={{
                                background: platform === p ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)',
                                padding: '0.5rem 1.2rem',
                                fontSize: '0.85rem',
                                boxShadow: platform === p ? '0 4px 12px hsla(var(--primary), 0.3)' : 'none',
                                transform: 'none'
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <textarea
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '16px',
                        padding: '1.2rem',
                        color: 'white',
                        fontFamily: 'inherit',
                        fontSize: '1rem',
                        minHeight: '120px',
                        marginBottom: '1.5rem',
                        resize: 'vertical'
                    }}
                    placeholder={`Describe lo que quieres publicar en ${platform}...`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt}
                    style={{ width: '100%' }}
                >
                    {isGenerating ? 'Gemini is Crafting Content...' : `Generate for ${platform}`}
                </button>
            </div>

            {generatedPost && (
                <div className="glass-card animate-fade-in" style={{ borderColor: 'hsla(var(--success), 0.3)', textAlign: 'left', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <span className="badge badge-success">{generatedPost.platform} High-Performance Idea</span>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button
                                onClick={handleSendToN8n}
                                disabled={isSending}
                                style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: 'none'
                                }}
                            >
                                🤖 {isSending ? 'Sending...' : 'Launch to n8n'}
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${generatedPost.copy}\n\n${generatedPost.hashtags.join(' ')}`);
                                    alert('¡Copiado al portapapeles!');
                                }}
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '0.5rem 1.2rem', fontSize: '0.8rem', boxShadow: 'none' }}
                            >
                                📋 Copy Text
                            </button>
                        </div>
                    </div>
                    <h3 style={{ margin: '0 0 1.2rem 0', color: 'hsl(var(--primary))', fontSize: '1.3rem' }}>{generatedPost.title}</h3>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '1rem', color: 'hsl(var(--text-main))' }}>
                        {generatedPost.copy}
                    </p>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {generatedPost.hashtags.map((h, i) => (
                            <span key={i} style={{ color: 'hsl(var(--accent))', fontWeight: '700', fontSize: '0.9rem' }}>{h}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
