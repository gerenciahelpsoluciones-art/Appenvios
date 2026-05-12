import { useState, useEffect } from 'react';
import { generateMarketingContent, sendToN8n, generateImagePrompt } from '../services/geminiService';
import { schedulePost } from '../services/socialApiService';
import type { SocialPlatform } from '../types/social.types';

declare global {
  interface Window { Canva: any; }
}

interface GeneratedPost {
  title: string;
  copy: string;
  hashtags: string[];
  platform: string;
  imageUrl?: string;
  imagePrompt?: string;
  canvaPrompt?: string;
}

const MobilePreview = ({ post }: { post: GeneratedPost }) => {
  const isInstagram = post.platform === 'Instagram';
  const isLinkedIn = post.platform === 'LinkedIn';

  return (
    <div style={{ width: '300px', height: '560px', background: '#000', borderRadius: '40px', border: '8px solid #1a1a1a', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', margin: '0 auto' }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100px', height: '22px', background: '#1a1a1a', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', zIndex: 10 }} />
      <div style={{ height: '100%', background: isInstagram ? '#fafafa' : isLinkedIn ? '#f3f6f8' : '#fff', color: '#000', padding: '12px', paddingTop: '36px', fontSize: '0.78rem', overflowY: 'auto' }}>
        {isInstagram && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', padding: '2px' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>HS</div>
              </div>
              <span style={{ fontWeight: '700', fontSize: '0.82rem' }}>help_soluciones</span>
            </div>
            <div style={{ width: '100%', aspectRatio: '1/1', background: '#eee', borderRadius: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', textAlign: 'center', overflow: 'hidden', fontSize: '0.72rem' }}>
              {post.imageUrl ? <img src={post.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ padding: '16px' }}>[Imagen: {post.title}]</div>}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '16px' }}>❤️ 💬 ✈️</div>
            <p style={{ margin: '0 0 4px', lineHeight: '1.5' }}><strong>help_soluciones</strong> {post.copy}</p>
            <p style={{ color: '#00376b', margin: 0 }}>{post.hashtags.join(' ')}</p>
          </div>
        )}
        {isLinkedIn && (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '10px', border: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', background: '#0077b5', borderRadius: '4px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.82rem' }}>Help Soluciones</div>
                <div style={{ color: '#666', fontSize: '0.68rem' }}>1,240 seguidores</div>
              </div>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', margin: '0 0 6px' }}>{post.copy}</p>
            <p style={{ color: '#0077b5', margin: 0 }}>{post.hashtags.join(' ')}</p>
            <div style={{ borderTop: '1px solid #eee', marginTop: '8px', paddingTop: '6px', display: 'flex', justifyContent: 'space-around', color: '#666', fontSize: '0.72rem', fontWeight: 'bold' }}>
              <span>👍 Recomendar</span><span>💬 Comentar</span>
            </div>
          </div>
        )}
        {post.platform === 'WhatsApp' && (
          <div style={{ height: '100%', background: '#0b141a', display: 'flex', flexDirection: 'column', margin: '-12px', marginTop: '-36px', padding: 0 }}>
            <div style={{ background: '#1f2c34', padding: '8px 12px 8px', paddingTop: '38px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#fff' }}>HS</div>
              <div>
                <div style={{ color: '#e9edef', fontWeight: 600, fontSize: '0.82rem' }}>Help Soluciones</div>
                <div style={{ color: '#8696a0', fontSize: '0.68rem' }}>en línea</div>
              </div>
            </div>
            <div style={{ flex: 1, padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '85%', background: '#005c4b', borderRadius: '8px 0 8px 8px', padding: '7px 9px' }}>
                  <p style={{ color: '#e9edef', fontSize: '0.78rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{post.copy}</p>
                  {post.hashtags.length > 0 && <p style={{ color: '#53bdeb', fontSize: '0.7rem', margin: '4px 0 0' }}>{post.hashtags.join(' ')}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
        {!isInstagram && !isLinkedIn && post.platform !== 'WhatsApp' && (
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.9rem' }}>{post.platform}</h3>
            <p style={{ whiteSpace: 'pre-wrap', textAlign: 'left', fontSize: '0.82rem', lineHeight: '1.5' }}>{post.copy}</p>
            <p style={{ color: '#0077b5' }}>{post.hashtags.join(' ')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const CreativeStudio = () => {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [canvaLoaded, setCanvaLoaded] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    if (window.Canva?.DesignButton) {
      window.Canva.DesignButton.initialize({ apiKey: import.meta.env.VITE_CANVA_API_KEY || '' });
      setCanvaLoaded(true);
      return;
    }
    // Timeout after 15 seconds to avoid infinite polling
    const deadline = setTimeout(() => clearInterval(interval), 15000);
    const interval = setInterval(() => {
      if (window.Canva?.DesignButton) {
        window.Canva.DesignButton.initialize({ apiKey: import.meta.env.VITE_CANVA_API_KEY || '' });
        setCanvaLoaded(true);
        clearInterval(interval);
        clearTimeout(deadline);
      }
    }, 500);
    return () => { clearInterval(interval); clearTimeout(deadline); };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');
    setGeneratedPost(null);
    try {
      const result = await generateMarketingContent(prompt, platform);
      setGeneratedPost({
        title: result.title || 'Post Sugerido',
        copy: result.copy || result.content || '',
        hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
        platform,
      });
    } catch (err: any) {
      setError(err.message || 'Error al generar contenido');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');
    try {
      const result = await generateMarketingContent(prompt + ' (versión alternativa)', platform);
      setGeneratedPost(prev => ({
        ...prev!,
        title: result.title || prev!.title,
        copy: result.copy || result.content || prev!.copy,
        hashtags: Array.isArray(result.hashtags) ? result.hashtags : prev!.hashtags,
      }));
    } catch (err: any) {
      setError(err.message || 'Error al regenerar');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedPost) return;
    setIsGeneratingImage(true);
    setError('');
    try {
      const content = `${generatedPost.copy} (plataforma: ${generatedPost.platform})`;
      const promptData = await generateImagePrompt(content);
      const canva = promptData.canvaPrompt?.trim()
        || promptData.imagePrompt?.split(',').slice(0, 3).join(',').trim()
        || 'Imagen corporativa tecnológica, colores azul y cyan, estilo profesional moderno';
      setGeneratedPost(prev => prev ? { ...prev, imagePrompt: promptData.imagePrompt, canvaPrompt: canva } : null);
    } catch (err: any) {
      setError(err.message || 'Error al generar prompt de imagen');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSend = async () => {
    if (!generatedPost) return;
    setIsSending(true);
    setError('');
    setSendSuccess(false);
    try {
      const saved = await schedulePost({
        title: generatedPost.title,
        copy: generatedPost.copy,
        hashtags: generatedPost.hashtags,
        platform: generatedPost.platform.toLowerCase() as SocialPlatform,
        image_url: generatedPost.imageUrl,
        image_prompt: generatedPost.imagePrompt,
        status: 'approved',
      });
      if (saved) await sendToN8n({ postId: saved.id, ...generatedPost });
      setSendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al enviar');
    } finally {
      setIsSending(false);
    }
  };

  const handleCanvaDesign = () => {
    if (!window.Canva?.DesignButton) return;
    window.Canva.DesignButton.create({
      designType: platform === 'Instagram' ? 'InstagramPost' : 'SocialMedia',
      onDesignFinished: (_id: string, designUrl: string) => {
        setGeneratedPost(prev => prev ? { ...prev, imageUrl: designUrl } : null);
      },
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: '2.5rem', alignItems: 'start' }}>
      <div>
        <h1 style={{ marginBottom: '0.5rem' }}>Creative Studio</h1>
        <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2.5rem' }}>Escribe tu idea y Helpi la transforma en un post de alto impacto.</p>

        <div className="glass-card" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['LinkedIn', 'Instagram', 'Facebook', 'WhatsApp', 'TikTok'].map(p => (
              <button key={p} onClick={() => setPlatform(p)} style={{ flex: 1, minWidth: '80px', background: platform === p ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.05)', boxShadow: platform === p ? '0 8px 20px -5px hsla(var(--primary), 0.5)' : 'none', border: '1px solid var(--glass-border)', padding: '0.6rem 0.4rem', fontSize: '0.85rem' }}>
                {p}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Quiero anunciar que ahora tenemos un chatbot con IA llamado Helpi para soporte técnico..."
            style={{ width: '100%', minHeight: '140px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.25rem', color: '#fff', fontSize: '1rem', fontFamily: 'inherit', marginBottom: '1.25rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleGenerate(); }}
          />

          <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} style={{ width: '100%', fontSize: '1.1rem', height: '56px' }}>
            {isGenerating ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Generando con Gemini AI...
              </span>
            ) : 'Generar Contenido con IA'}
          </button>
          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', textAlign: 'center', marginTop: '0.5rem' }}>Ctrl+Enter para generar</div>
        </div>

        {error && (
          <div className="glass-card animate-fade-in" style={{ marginTop: '1rem', borderLeft: '4px solid hsl(0 80% 60%)', color: 'hsl(0 80% 70%)', padding: '0.9rem 1.2rem' }}>{error}</div>
        )}

        {generatedPost && (
          <div className="glass-card animate-fade-in" style={{ marginTop: '2rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>Copia generada</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleRegenerate} disabled={isGenerating} style={{ width: 'auto', padding: '0.4rem 0.9rem', fontSize: '0.8rem', boxShadow: 'none', background: 'hsla(var(--primary), 0.15)', border: '1px solid hsla(var(--primary), 0.3)' }}>
                  Regenerar
                </button>
                <button onClick={handleSend} disabled={isSending || sendSuccess} style={{ width: 'auto', padding: '0.4rem 0.9rem', fontSize: '0.8rem', boxShadow: 'none', background: sendSuccess ? 'hsla(var(--success), 0.15)' : 'hsla(var(--success), 0.2)', color: 'hsl(var(--success))', border: '1px solid hsla(var(--success), 0.3)' }}>
                  {sendSuccess ? '✓ Enviado' : isSending ? 'Enviando...' : 'Lanzar a n8n'}
                </button>
              </div>
            </div>

            <textarea
              value={generatedPost.copy}
              onChange={(e) => setGeneratedPost(prev => prev ? { ...prev, copy: e.target.value } : null)}
              style={{ width: '100%', minHeight: '120px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1rem', color: '#fff', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: '1.6', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '1rem' }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {generatedPost.hashtags.map(h => (
                <span key={h} style={{ fontSize: '0.85rem', padding: '0.25rem 0.7rem', borderRadius: '12px', background: 'hsla(var(--accent), 0.12)', color: 'hsl(var(--accent))', fontWeight: '600' }}>{h}</span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={handleGenerateImage} disabled={isGeneratingImage} style={{ flex: 1, background: 'linear-gradient(45deg, #FF0080, #7928CA)', border: 'none', height: '48px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                {isGeneratingImage ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    Generando prompt...
                  </span>
                ) : 'Generar Prompt de Imagen AI'}
              </button>
              <button onClick={handleCanvaDesign} disabled={!canvaLoaded} style={{ flex: 1, background: 'linear-gradient(45deg, #00C4CC, #7d2ae8)', border: 'none', height: '48px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                {canvaLoaded ? 'Diseñar en Canva' : 'Cargando Canva...'}
              </button>
            </div>

            {generatedPost.imagePrompt && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(0,196,204,0.07)', border: '1px solid rgba(0,196,204,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00C4CC' }}>PROMPT PARA CANVA AI</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => copyToClipboard(generatedPost.canvaPrompt ?? '', 'canva')} style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', background: copiedKey === 'canva' ? '#00C4CC' : 'rgba(0,196,204,0.15)', border: '1px solid rgba(0,196,204,0.3)', color: copiedKey === 'canva' ? '#fff' : '#00C4CC', width: 'auto', boxShadow: 'none' }}>
                        {copiedKey === 'canva' ? '✓ Copiado' : 'Copiar'}
                      </button>
                      <a href="https://www.canva.com/create/ai-image-generator/" target="_blank" rel="noopener noreferrer" style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', background: '#00C4CC', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
                        Abrir Canva →
                      </a>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>{generatedPost.canvaPrompt}</p>
                </div>

                <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(255,0,128,0.06)', border: '1px solid rgba(255,0,128,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FF0080' }}>PROMPT PARA MIDJOURNEY / DALL-E</span>
                    <button onClick={() => copyToClipboard(generatedPost.imagePrompt ?? '', 'mj')} style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', background: copiedKey === 'mj' ? '#FF0080' : 'rgba(255,0,128,0.15)', border: '1px solid rgba(255,0,128,0.3)', color: copiedKey === 'mj' ? '#fff' : '#FF0080', width: 'auto', boxShadow: 'none' }}>
                      {copiedKey === 'mj' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', lineHeight: '1.6', margin: 0, wordBreak: 'break-word' }}>{generatedPost.imagePrompt}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'sticky', top: '2rem' }}>
        <h4 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'hsl(var(--text-muted))', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Preview</h4>
        {generatedPost ? (
          <MobilePreview post={generatedPost} />
        ) : (
          <div style={{ width: '300px', height: '560px', background: 'rgba(255,255,255,0.02)', borderRadius: '40px', border: '2px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '2rem', margin: '0 auto', fontSize: '0.88rem' }}>
            Genera un post para ver la visualización aquí
          </div>
        )}
      </div>
    </div>
  );
};
