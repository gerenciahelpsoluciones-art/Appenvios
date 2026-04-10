import { useState, useEffect } from 'react';
import { generateMarketingContent, sendToN8n, generateImagePrompt } from '../services/geminiService';
import { schedulePost } from '../services/socialApiService';
import type { SocialPlatform } from '../types/social.types';

declare global {
  interface Window {
    Canva: any;
  }
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
    <div className="preview-container" style={{
      width: '320px',
      height: '580px',
      background: '#000',
      borderRadius: '40px',
      border: '8px solid #1a1a1a',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      margin: '0 auto'
    }}>
      {/* Notch */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '25px', background: '#1a1a1a', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', zIndex: 10 }}></div>
      
      <div style={{ height: '100%', background: isInstagram ? '#fafafa' : (isLinkedIn ? '#f3f6f8' : '#fff'), color: '#000', padding: '15px', paddingTop: '40px', fontSize: '0.8rem', overflowY: 'auto' }}>
        {isInstagram && (
          <div style={{ animation: 'fade-in 0.5s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', padding: '2px' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>HS</div>
              </div>
              <span style={{ fontWeight: '700' }}>help_soluciones</span>
            </div>
            <div style={{ width: '100%', aspectRatio: '1/1', background: '#eee', borderRadius: '4px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', textAlign: 'center', overflow: 'hidden' }}>
              {post.imageUrl ? (
                <img src={post.imageUrl} alt="Generated Content" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ padding: '20px' }}>[Imagen Sugerida: {post.title}]</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '18px' }}>
              <span>❤️</span> <span>💬</span> <span>✈️</span>
            </div>
            <p><strong>help_soluciones</strong> {post.copy}</p>
            <p style={{ color: '#00376b' }}>{post.hashtags.join(' ')}</p>
          </div>
        )}

        {isLinkedIn && (
          <div style={{ animation: 'fade-in 0.5s ease', background: '#fff', borderRadius: '8px', padding: '12px', border: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '40px', height: '40px', background: '#0077b5', borderRadius: '4px' }}></div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Help Soluciones Informáticas</div>
                <div style={{ color: '#666', fontSize: '0.7rem' }}>1,240 seguidores</div>
              </div>
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{post.copy}</p>
            <p style={{ color: '#0077b5' }}>{post.hashtags.join(' ')}</p>
            {post.imageUrl && (
              <div style={{ width: '100%', marginTop: '10px', borderRadius: '4px', overflow: 'hidden' }}>
                <img src={post.imageUrl} alt="LinkedIn Content" style={{ width: '100%', display: 'block' }} />
              </div>
            )}
            <div style={{ borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '8px', display: 'flex', justifyContent: 'space-around', color: '#666', fontWeight: 'bold' }}>
              <span>👍 Recomendar</span> <span>💬 Comentar</span>
            </div>
          </div>
        )}

        {post.platform === 'WhatsApp' && (
          <div style={{ height: '100%', background: '#0b141a', display: 'flex', flexDirection: 'column' }}>
            {/* Header WhatsApp */}
            <div style={{ background: '#1f2c34', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '35px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', color: '#fff', flexShrink: 0 }}>HS</div>
              <div>
                <div style={{ color: '#e9edef', fontWeight: 600, fontSize: '0.85rem' }}>Help Soluciones</div>
                <div style={{ color: '#8696a0', fontSize: '0.7rem' }}>en línea</div>
              </div>
            </div>
            {/* Fondo chat */}
            <div style={{ flex: 1, padding: '12px', overflowY: 'auto', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
              {/* Burbuja de mensaje */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                <div style={{ maxWidth: '85%', background: '#005c4b', borderRadius: '8px 0px 8px 8px', padding: '8px 10px', position: 'relative' }}>
                  {post.imageUrl && (
                    <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden', marginBottom: '6px' }}>
                      <img src={post.imageUrl} alt="" style={{ width: '100%', display: 'block' }} />
                    </div>
                  )}
                  <p style={{ color: '#e9edef', fontSize: '0.8rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{post.copy}</p>
                  {post.hashtags.length > 0 && (
                    <p style={{ color: '#53bdeb', fontSize: '0.72rem', margin: '4px 0 0', lineHeight: '1.4' }}>{post.hashtags.join(' ')}</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <span style={{ color: '#8696a0', fontSize: '0.65rem' }}>ahora</span>
                    <span style={{ color: '#53bdeb', fontSize: '0.75rem' }}>✓✓</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Input bar */}
            <div style={{ background: '#1f2c34', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, background: '#2a3942', borderRadius: '20px', padding: '8px 14px', color: '#8696a0', fontSize: '0.78rem' }}>Mensaje</div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎤</div>
            </div>
          </div>
        )}

        {!isInstagram && !isLinkedIn && post.platform !== 'WhatsApp' && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
             <h3>Preview para {post.platform}</h3>
             <p style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{post.copy}</p>
             {post.imageUrl && (
               <div style={{ width: '100%', marginTop: '1.5rem', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                 <img src={post.imageUrl} alt="Social Media" style={{ width: '100%', display: 'block' }} />
               </div>
             )}
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

    useEffect(() => {
        const initCanva = () => {
            if (window.Canva && window.Canva.DesignButton) {
                window.Canva.DesignButton.initialize({
                    apiKey: import.meta.env.VITE_CANVA_API_KEY || 'YOUR_CANVA_API_KEY'
                });
                setCanvaLoaded(true);
            }
        };

        // Check if already loaded or wait for script load
        if (window.Canva) {
            initCanva();
        } else {
            const checkCanva = setInterval(() => {
                if (window.Canva) {
                    initCanva();
                    clearInterval(checkCanva);
                }
            }, 500);
            return () => clearInterval(checkCanva);
        }
    }, []);

    const handleCanvaDesign = () => {
        if (!window.Canva || !window.Canva.DesignButton) {
            alert("Canva SDK no está cargado. Por favor verifica tu conexión.");
            return;
        }

        window.Canva.DesignButton.create({
            designType: platform === 'Instagram' ? 'InstagramPost' : 'SocialMedia',
            onDesignFinished: (_designId: string, designUrl: string) => {
                setGeneratedPost(prev => prev ? { 
                    ...prev, 
                    imageUrl: designUrl 
                } : null);
            }
        });
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            const result = await generateMarketingContent(prompt, platform);
            setGeneratedPost({
                title: result.title || "Post Sugerido",
                copy: result.copy || result.content || "",
                hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
                platform
            });
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        }).catch(() => {
            // Fallback para navegadores sin soporte clipboard API
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        });
    };

    const handleGenerateImage = async () => {
        if (!generatedPost) return;
        setIsGeneratingImage(true);
        try {
            const promptData = await generateImagePrompt(generatedPost.copy, generatedPost.platform);
            // Fallback: si Claude no devuelve canvaPrompt, generamos uno resumido del imagePrompt
            const canva = promptData.canvaPrompt?.trim()
                || promptData.imagePrompt?.split(',').slice(0, 3).join(',').trim()
                || 'Imagen corporativa tecnológica, colores azul y cyan, estilo profesional moderno';
            setGeneratedPost(prev => prev ? {
                ...prev,
                imagePrompt: promptData.imagePrompt,
                canvaPrompt: canva,
            } : null);
        } catch (error) {
            alert("Error al generar prompt de imagen.");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleSend = async () => {
        if (!generatedPost) return;
        setIsSending(true);
        try {
            // 1. Guardar en mkt_posts_queue
            const saved = await schedulePost({
                title:        generatedPost.title,
                copy:         generatedPost.copy,
                hashtags:     generatedPost.hashtags,
                platform:     generatedPost.platform.toLowerCase() as SocialPlatform,
                image_url:    generatedPost.imageUrl,
                image_prompt: generatedPost.imagePrompt,
                status:       'approved',
            });
            // 2. Notificar a n8n si el post se guardó
            if (saved) await sendToN8n({ postId: saved.id, ...generatedPost });
            alert("¡Post guardado y lanzado a n8n con éxito!");
        } catch (error) {
            alert("Error al enviar.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="creative-studio animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2.5rem', alignItems: 'start' }}>
            <div className="creator-main">
                <h1 style={{ marginBottom: '0.5rem' }}>Creative Studio</h1>
                <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '2.5rem' }}>Escribe tu idea y Helpi la transformará en un post de alto impacto.</p>

                <div className="glass-card" style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {['LinkedIn', 'Instagram', 'Facebook', 'WhatsApp', 'TikTok'].map(p => (
                            <button 
                                key={p} 
                                onClick={() => setPlatform(p)}
                                style={{
                                    flex: 1,
                                    background: platform === p ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.05)',
                                    boxShadow: platform === p ? '0 8px 20px -5px hsla(var(--primary), 0.5)' : 'none',
                                    border: '1px solid var(--glass-border)'
                                }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ej: Quiero anunciar que ahora tenemos un chatbot con IA llamado Helpi para soporte técnico..."
                        style={{
                            width: '100%',
                            minHeight: '150px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            color: '#fff',
                            fontSize: '1.1rem',
                            fontFamily: 'inherit',
                            marginBottom: '1.5rem',
                            outline: 'none'
                        }}
                    />

                    <button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !prompt}
                        style={{ width: '100%', height: '60px', fontSize: '1.2rem' }}
                    >
                        {isGenerating ? 'IA Generando Magia...' : 'Generar Contenido Maestro'}
                    </button>
                </div>

                {generatedPost && (
                    <div className="glass-card animate-fade-in" style={{ marginTop: '2rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Copia Final</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={handleSend} disabled={isSending} className="badge" style={{ background: 'hsla(var(--success), 0.2)', color: 'hsl(var(--success))', border: '1px solid hsla(var(--success), 0.3)' }}>
                                    {isSending ? 'Lanzando...' : 'Lanzar a n8n'}
                                </button>
                                <button className="badge" style={{ background: 'hsla(var(--primary), 0.2)', color: 'hsl(var(--primary))' }}>Regenerar</button>
                            </div>
                        </div>
                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1rem' }}>{generatedPost.copy}</p>
                        
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage}
                                    style={{
                                        flex: 1,
                                        background: 'linear-gradient(45deg, #FF0080, #7928CA)',
                                        border: 'none',
                                        height: '50px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isGeneratingImage ? 'Claude pensando en el diseño...' : '🎨 Generar Prompt de Imagen AI'}
                                </button>

                                <button
                                    onClick={handleCanvaDesign}
                                    disabled={!canvaLoaded}
                                    style={{
                                        flex: 1,
                                        background: 'linear-gradient(45deg, #00C4CC, #7d2ae8)',
                                        border: 'none',
                                        height: '50px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {canvaLoaded ? '🎨 Diseñar en Canva' : 'Cargando Canva...'}
                                </button>
                            </div>

                            {/* Prompts de imagen generados por Claude */}
                            {generatedPost.imagePrompt && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                                    {/* Tarjeta Canva */}
                                    <div style={{
                                        padding: '1rem 1.25rem', borderRadius: '12px',
                                        background: 'rgba(0,196,204,0.07)',
                                        border: '1px solid rgba(0,196,204,0.3)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00C4CC' }}>
                                                🟦 PROMPT PARA CANVA AI
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button
                                                    onClick={() => copyToClipboard(generatedPost.canvaPrompt ?? '', 'canva')}
                                                    style={{
                                                        padding: '0.2rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem',
                                                        background: copiedKey === 'canva' ? '#00C4CC' : 'rgba(0,196,204,0.15)',
                                                        border: '1px solid rgba(0,196,204,0.3)',
                                                        color: copiedKey === 'canva' ? '#fff' : '#00C4CC', cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {copiedKey === 'canva' ? '✓ Copiado!' : '📋 Copiar'}
                                                </button>
                                                <a
                                                    href="https://www.canva.com/create/ai-image-generator/"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: '0.2rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem',
                                                        background: '#00C4CC', color: '#fff',
                                                        textDecoration: 'none', fontWeight: 700,
                                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                    }}
                                                >
                                                    Abrir Canva →
                                                </a>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-primary))', lineHeight: '1.5', margin: 0, fontWeight: 500 }}>
                                            {generatedPost.canvaPrompt}
                                        </p>
                                        <p style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '0.5rem', marginBottom: 0 }}>
                                            1. Copia el prompt → 2. Abre Canva → 3. Crea un diseño → Elementos → "Genera una imagen con IA" → pega el prompt
                                        </p>
                                    </div>

                                    {/* Tarjeta Midjourney / DALL-E */}
                                    <div style={{
                                        padding: '1rem 1.25rem', borderRadius: '12px',
                                        background: 'rgba(255,0,128,0.06)',
                                        border: '1px solid rgba(255,0,128,0.2)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FF0080' }}>
                                                🎨 PROMPT PARA MIDJOURNEY / DALL-E / IDEOGRAM
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(generatedPost.imagePrompt ?? '', 'mj')}
                                                style={{
                                                    padding: '0.2rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem',
                                                    background: copiedKey === 'mj' ? '#FF0080' : 'rgba(255,0,128,0.15)',
                                                    border: '1px solid rgba(255,0,128,0.3)',
                                                    color: copiedKey === 'mj' ? '#fff' : '#FF0080', cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {copiedKey === 'mj' ? '✓ Copiado!' : '📋 Copiar'}
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', lineHeight: '1.6', margin: 0, wordBreak: 'break-word' }}>
                                            {generatedPost.imagePrompt}
                                        </p>
                                    </div>

                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                            {generatedPost.hashtags.map(h => <span key={h} style={{ color: 'hsl(var(--accent))', fontWeight: 'bold' }}>{h}</span>)}
                        </div>
                    </div>
                )}
            </div>

            <div className="preview-sidebar" style={{ position: 'sticky', top: '2rem' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'hsl(var(--text-muted))' }}>LIVE PREVIEW</h4>
                {generatedPost ? (
                    <MobilePreview post={generatedPost} />
                ) : (
                    <div style={{
                        width: '320px',
                        height: '580px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '40px',
                        border: '2px dashed var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'hsl(var(--text-muted))',
                        textAlign: 'center',
                        padding: '40px'
                    }}>
                        Esperando generación para mostrar visualización...
                    </div>
                )}
            </div>
        </div>
    );
};
