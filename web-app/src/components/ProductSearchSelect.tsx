import React, { useState, useRef, useEffect } from 'react';
import type { Producto } from '../App';

interface ProductSearchSelectProps {
    productos: Producto[];
    value: string;
    onChange: (productId: string) => void;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
}

const ProductSearchSelect: React.FC<ProductSearchSelectProps> = ({ 
    productos, 
    value, 
    onChange,
    placeholder = '-- Seleccionar --',
    className = 'table-input',
    style: customStyle
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedProduct = productos.find(p => p.id === value);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredProducts = productos.filter(p => {
        const term = search.toLowerCase();
        return p.nombre.toLowerCase().includes(term) || (p.numPart && p.numPart.toLowerCase().includes(term));
    });

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%', ...customStyle }}>
            <div
                className={className}
                style={{
                    cursor: 'text',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'white',
                    minHeight: '34px'
                }}
                onClick={() => setIsOpen(true)}
            >
                {isOpen ? (
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar producto..."
                        autoFocus
                        style={{ border: 'none', outline: 'none', width: '100%', padding: '0' }}
                    />
                ) : (
                    <span style={{
                        color: selectedProduct ? 'inherit' : '#9ca3af',
                        padding: '4px 0',
                        lineHeight: '1.2',
                        wordBreak: 'break-word'
                    }}>
                        {selectedProduct ? `${selectedProduct.moneda === 'USD' ? '🇺🇸' : '🇨🇴'} ${selectedProduct.nombre} ${selectedProduct.numPart ? `(${selectedProduct.numPart})` : ''}` : placeholder}
                    </span>
                )}
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>▼</span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '250px',
                    overflowY: 'auto',
                    background: 'white',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 50,
                    marginTop: '2px'
                }}>
                    {filteredProducts.length === 0 ? (
                        <div style={{ padding: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>No hay resultados</div>
                    ) : (
                        filteredProducts.map(p => (
                            <div
                                key={p.id}
                                onClick={() => {
                                    onChange(p.id);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                style={{
                                    padding: '0.5rem',
                                    borderBottom: '1px solid #f3f4f6',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    backgroundColor: value === p.id ? '#e0f2fe' : 'transparent',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = value === p.id ? '#e0f2fe' : 'transparent'}
                            >
                                <div style={{ fontWeight: '500' }}>{p.moneda === 'USD' ? '🇺🇸' : '🇨🇴'} {p.nombre}</div>
                                {p.numPart && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>N/P: {p.numPart}</div>}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductSearchSelect;
