import React, { useState } from 'react';
import { generateContent } from '../services/gemini';
import type { Producto } from '../App';

interface RecoveryAssistantProps {
  onClose: () => void;
  onRestore: (products: Partial<Producto>[]) => Promise<void>;
  existingProducts: Producto[];
}

const RecoveryAssistant: React.FC<RecoveryAssistantProps> = ({ onClose, onRestore, existingProducts }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState<Partial<Producto>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const prompt = `
        Eres un asistente experto en recuperación de datos de CRM. 
        A continuación se te proporciona el texto extraído de una cotización en PDF.
        Tu tarea es extraer la lista de productos encontrados en el formato JSON especificado.
        
        REGLAS:
        1. Extrae: Nombre, Descripción, Precio de Venta, Costo (si aparece), Unidad, IVA (si aparece).
        2. Intenta identificar si el producto ya existe en nuestro catálogo comparando con esta lista:
           ${existingProducts.map(ep => `${ep.nombre} (P/N: ${ep.numPart})`).join(', ')}
        3. El formato de salida DEBE SER ÚNICAMENTE un arreglo JSON con objetos que tengan:
           {
             "nombre": "string",
             "numPart": "string",
             "descripcion": "string",
             "unidad": "string",
             "precioCompra": number,
             "moneda": "COP" | "USD",
             "tipo": "Producto" | "Servicio",
             "exentoIva": boolean
           }
        
        TEXTO DEL PDF:
        ---
        ${inputText}
        ---
      `;

      const responseText = await generateContent(prompt);
      const jsonStr = responseText.replace(/```json|```/g, '').trim();
      const products = JSON.parse(jsonStr);
      
      if (Array.isArray(products)) {
        setDetectedProducts(products);
      } else {
        throw new Error('La respuesta de la IA no es un formato válido.');
      }
    } catch (err: any) {
      console.error('Error in recovery:', err);
      setError('No pudimos analizar el texto. Asegúrate de que sea el contenido de una cotización legible.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onRestore(detectedProducts);
      setDetectedProducts([]);
      setInputText('');
      onClose();
    } catch (err: any) {
      setError('Error al guardar los productos en la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-3xl">🪄</span> Asistente de Rescate de Catálogo
            </h2>
            <p className="text-blue-100 text-sm mt-1">Pega el texto de tu cotización PDF y recuperaremos los productos.</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors font-bold text-xl">×</button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {detectedProducts.length === 0 ? (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Pega aquí el texto copiado de tu PDF de cotización:
              </label>
              <textarea
                className="w-full h-48 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-all dark:bg-gray-900 resize-none font-mono text-sm"
                placeholder="Ejemplo: Bitdefender GravityZone... $125.000... 15-24 usuarios..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className="flex justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                >
                  {isLoading ? 'Analizando con IA...' : '✨ Analizar y Recuperar Nombres'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-2">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                ✅ Productos Encontrados ({detectedProducts.length})
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                    <tr>
                      <th className="p-4 text-sm font-bold text-gray-600 dark:text-gray-400">Nombre</th>
                      <th className="p-4 text-sm font-bold text-gray-600 dark:text-gray-400">P/N</th>
                      <th className="p-4 text-sm font-bold text-gray-600 dark:text-gray-400">Costo Estimado</th>
                      <th className="p-4 text-sm font-bold text-gray-600 dark:text-gray-400">IVA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {detectedProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                        <td className="p-4 font-medium text-gray-900 dark:text-white">{p.nombre}</td>
                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{p.numPart || 'N/A'}</td>
                        <td className="p-4 text-sm font-mono text-blue-600 dark:text-blue-400">${p.precioCompra?.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.exentoIva ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {p.exentoIva ? 'Exento' : 'Gravado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ⚠️ <strong>Nota:</strong> Al confirmar, estos productos se añadirán a tu catálogo local. Si el producto ya existe, se actualizarán sus datos.
                </p>
              </div>

              <div className="flex gap-4 justify-end mt-6">
                <button
                  onClick={() => setDetectedProducts([])}
                  className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Regresar
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/30"
                >
                  🚀 Confirmar y Restaurar Todo
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100">
              <p className="flex items-center gap-2"><span>⚠️</span> {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryAssistant;
