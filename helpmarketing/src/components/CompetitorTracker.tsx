import { useState } from 'react';
import { analyzeCompetitor } from '../services/geminiService';

interface Analysis {
    strengths: string[];
    weaknesses: string[];
    differentiator: string;
    threatLevel: string;
    marketStrategy: string;
}

interface Competitor {
    id: number;
    name: string;
    website: string;
    analysis?: Analysis;
    isAnalyzing?: boolean;
}

export const CompetitorTracker = () => {
    const [competitors, setCompetitors] = useState<Competitor[]>([
        { id: 1, name: "Sistemas.com.co", website: "https://sistemas.com.co" },
        { id: 2, name: "Torus Systems", website: "https://torusystems.co" },
        { id: 3, name: "CMLABTEC", website: "https://cmlabtec.com" }
    ]);

    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');

    const handleAddCompetitor = () => {
        if (newName && newUrl) {
            setCompetitors([...competitors, {
                id: Date.now(),
                name: newName,
                website: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`
            }]);
            setNewName('');
            setNewUrl('');
        }
    };

    const handleRunAnalysis = async (id: number) => {
        const comp = competitors.find(c => c.id === id);
        if (!comp) return;

        setCompetitors(prev => prev.map(c => c.id === id ? { ...c, isAnalyzing: true } : c));

        try {
            const result = await analyzeCompetitor(comp.name, comp.website);
            setCompetitors(prev => prev.map(c => c.id === id ? { ...c, analysis: result, isAnalyzing: false } : c));
        } catch (error) {
            console.error(error);
            setCompetitors(prev => prev.map(c => c.id === id ? { ...c, isAnalyzing: false } : c));
        }
    };

    return (
        <div className="animate-fade-in">
            <h1>Competitor Tracker</h1>
            <p style={{ color: 'hsl(var(--text-muted))' }}>Monitor and analyze your competition to find strategic advantages.</p>

            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginTop: 0 }}>Add Competitor</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        className="glass-card"
                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '0.8rem', color: 'white', border: '1px solid var(--glass-border)', margin: 0 }}
                        placeholder="Competitor Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                    <input
                        className="glass-card"
                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '0.8rem', color: 'white', border: '1px solid var(--glass-border)', margin: 0 }}
                        placeholder="Website URL"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                    />
                    <button onClick={handleAddCompetitor}>Add to List</button>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {competitors.map(comp => (
                    <div key={comp.id} className="glass-card" style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{comp.name}</h3>
                                <a href={comp.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'hsl(var(--accent))', textDecoration: 'none' }}>{comp.website}</a>
                            </div>
                            <button
                                onClick={() => handleRunAnalysis(comp.id)}
                                disabled={comp.isAnalyzing}
                                style={{ fontSize: '0.85rem' }}
                            >
                                {comp.isAnalyzing ? 'Analyzing...' : comp.analysis ? 'Refresh Analysis' : 'Run IQ Analysis'}
                            </button>
                        </div>

                        {comp.analysis && (
                            <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                                <div>
                                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.8rem', letterSpacing: '0.05em' }}>STRENGTHS</div>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'hsl(var(--success))', fontSize: '0.95rem', lineHeight: '1.7' }}>
                                        {comp.analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', fontWeight: '800', marginBottom: '0.8rem', letterSpacing: '0.05em' }}>WEAKNESSES</div>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'hsl(var(--error))', fontSize: '0.95rem', lineHeight: '1.7' }}>
                                        {comp.analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ background: 'hsla(var(--primary), 0.05)', padding: '1.2rem', borderRadius: '16px', borderLeft: '4px solid hsl(var(--primary))' }}>
                                        <div style={{ fontWeight: '800', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'hsl(var(--primary))', textTransform: 'uppercase' }}>The "Help Soluciones" Differentiator:</div>
                                        <div style={{ color: 'hsl(var(--text-main))', fontStyle: 'italic', fontSize: '1rem' }}>"{comp.analysis.differentiator}"</div>
                                    </div>
                                    <div style={{ marginTop: '1.2rem', display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                                        <div><span style={{ color: 'hsl(var(--text-muted))' }}>Threat Level:</span> <span style={{ color: comp.analysis.threatLevel === 'Alto' ? 'hsl(var(--error))' : 'hsl(var(--warning))', fontWeight: '800' }}>{comp.analysis.threatLevel}</span></div>
                                        <div><span style={{ color: 'hsl(var(--text-muted))' }}>Strategy:</span> <span style={{ color: 'hsl(var(--text-main))', fontWeight: '600' }}>{comp.analysis.marketStrategy}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
