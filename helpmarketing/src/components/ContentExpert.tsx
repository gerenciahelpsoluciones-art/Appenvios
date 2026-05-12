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
  const [sendSuccess, setSendSuccess] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<PostIdea | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');
    try {
      const result = await generateMarketingContent(prompt, platform);
      if (!result || (!result.copy && !result.content)) throw new Error('Respuesta de IA incompleta');
      setGeneratedPost({
        title: result.title || 'Post Sugerido',
        copy: result.copy || result.content || '',
        hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
        platform,
      });
    } catch (err: any) {
      setError(err.message || 'Error al generar contenido. Verifica tu API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendToN8n = async () => {
    if (!generatedPost) return;
    setIsSending(true);
    setSendSuccess(false);
    setError('');
    try {
      await sendToN8n(generatedPost);
      setSendSuccess(true);
    } catch {
      setError('Error al enviar a n8n. Verifica VITE_N8N_WEBHOOK_URL en tu archivo .env');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPost) return;
    navigator.clipboard.writeText(`${generatedPost.copy}\n\n${generatedPost.hashtags.join(' ')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <h1>Social Media Expert</h1>
      <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2.5rem' }}>
        Genera contenido profesional para tus redes sociales con <strong style={{ color: 'hsl(var(--accent))' }}>Google Gemini AI</strong>.
      </p>

      <div className="glass-card" style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
        <h3 style={{ marginTop: 0 }}>Crear Nuevo Post</h3>

        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {['LinkedIn', 'Facebook', 'Instagram', 'TikTok'].map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              aria-pressed={platform === p}
              style={{
                background: platform === p ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                padding: '0.5rem 1.2rem',
                fontSize: '0.85rem',
                boxShadow: platform === p ? '0 4px 12px hsla(var(--primary), 0.3)' : 'none',
                transform: 'none',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <label htmlFor="content-expert-prompt" style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
          ¿Qué quieres publicar?
        </label>
        <textarea
          id="content-expert-prompt"
          name="prompt"
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
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          placeholder={`Describe lo que quieres publicar en ${platform}…`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate(); }}
          onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
          onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
        />

        <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} style={{ width: '100%' }}>
          {isGenerating ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <svg aria-hidden="true" className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              Generando contenido…
            </span>
          ) : `Generar para ${platform}`}
        </button>

        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'hsla(0,80%,60%,0.1)', borderRadius: '10px', color: 'hsl(0 80% 70%)', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}
      </div>

      {generatedPost && (
        <div className="glass-card animate-fade-in" style={{ borderColor: 'hsla(var(--success), 0.3)', textAlign: 'left', padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <span className="badge badge-success">{generatedPost.platform} · Idea lista</span>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={handleSendToN8n}
                disabled={isSending || sendSuccess}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: 'none',
                  background: sendSuccess ? 'hsla(var(--success), 0.15)' : undefined,
                  color: sendSuccess ? 'hsl(var(--success))' : undefined,
                }}
              >
                {sendSuccess ? '✓ Enviado' : isSending ? 'Enviando…' : '🤖 Lanzar a n8n'}
              </button>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? 'hsla(var(--success), 0.15)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)',
                  padding: '0.5rem 1.2rem',
                  fontSize: '0.8rem',
                  boxShadow: 'none',
                  color: copied ? 'hsl(var(--success))' : undefined,
                }}
              >
                {copied ? '✓ Copiado' : '📋 Copiar texto'}
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
