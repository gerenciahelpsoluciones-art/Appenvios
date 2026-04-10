import { useState } from 'react';
import { huntLeads } from '../services/geminiService';

interface Lead {
    company: string;
    reason: string;
    confidence: string;
}

export const LeadHunter = () => {
    const [sector, setSector] = useState('Logística');
    const [location, setLocation] = useState('Bogotá');
    const [isHunting, setIsHunting] = useState(false);
    const [leads, setLeads] = useState<Lead[]>([]);

    const handleHunt = async () => {
        setIsHunting(true);
        try {
            const data = await huntLeads(sector, location);
            setLeads(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsHunting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 style={{ marginBottom: '0.5rem' }}>Strategic Lead Hunter</h1>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '1.1rem', marginBottom: '3rem' }}>
                Scanning digital signals for high-intent TI opportunities using <strong style={{ color: 'hsl(var(--accent))' }}>Predictive Intelligence</strong>.
            </p>

            <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
                <h3 style={{ marginTop: 0, fontSize: '1.25rem', color: '#fff' }}>Hunting Parameters</h3>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Industry</label>
                        <input
                            style={{ 
                                width: '100%', 
                                background: 'hsla(var(--background-alt), 0.5)', 
                                padding: '1rem', 
                                color: 'white', 
                                border: '1px solid var(--glass-border)', 
                                borderRadius: '14px',
                                marginTop: '0.5rem',
                                outline: 'none',
                                transition: 'var(--transition-smooth)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                            placeholder="e.g. Fintech, Healthcare"
                            value={sector}
                            onChange={(e) => setSector(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Geo-Location</label>
                        <input
                            style={{ 
                                width: '100%', 
                                background: 'hsla(var(--background-alt), 0.5)', 
                                padding: '1rem', 
                                color: 'white', 
                                border: '1px solid var(--glass-border)', 
                                borderRadius: '14px',
                                marginTop: '0.5rem',
                                outline: 'none',
                                transition: 'var(--transition-smooth)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                            placeholder="City or Region"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={handleHunt}
                    disabled={isHunting}
                    style={{ marginTop: '2rem', width: '100%' }}
                >
                    {isHunting ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                            Agent is Scanning Signals...
                        </span>
                    ) : 'Initiate Deep Prospections'}
                </button>
            </div>

            {leads.length > 0 && (
                <div style={{ animation: 'slide-up 0.5s ease-out' }}>
                    <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.5rem', marginTop: '3rem' }}>Qualified Targets</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {leads.map((lead, i) => (
                            <div key={i} className="glass-card" style={{ 
                                padding: '2rem', 
                                margin: 0,
                                background: 'hsla(var(--text-main), 0.02)',
                                borderTop: '2px solid hsla(var(--primary), 0.2)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: '800', fontSize: '1.3rem', color: '#fff' }}>{lead.company}</span>
                                    <span className="badge badge-success" style={{ background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))' }}>{lead.confidence} MATCH</span>
                                </div>
                                <p style={{ fontSize: '0.95rem', color: 'hsl(var(--text-muted))', margin: '0 0 2rem 0', lineHeight: '1.6' }}>{lead.reason}</p>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 1rem' }}>Generate Outreach</button>
                                    <button style={{ background: 'transparent', border: '1px solid var(--glass-border)', boxShadow: 'none', padding: '0.6rem' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
