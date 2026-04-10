import { forwardRef } from 'react'

interface InvoiceProps {
  order: any
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceProps>(({ order }, ref) => {
  if (!order) return null

  const logoUrl = '/logo.jpg'

  return (
    <div 
      ref={ref}
      style={{ width: '800px', padding: '40px', background: 'white', color: 'black', fontFamily: 'sans-serif' }}
      className="relative"
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-orange-500 pb-8 mb-8">
        <div className="flex gap-4 items-center">
          <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain" />
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-gray-900">2RPITS</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600">High-End Moto Workshop</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-400">ORDEN DE SERVICIO</h2>
          <p className="text-4xl font-bold text-gray-800">#{String(order.consecutivo).padStart(4, '0')}</p>
          <p className="text-sm text-gray-500 mt-2">{new Date(order.fecha_entrada).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">CLIENTE</h3>
          <p className="text-xl font-bold text-gray-800">{order.trp_motos?.cliente_nombre || '---'}</p>
          <p className="text-sm text-gray-500 mt-1">{order.trp_motos?.cliente_telefono || '---'}</p>
        </div>
        <div>
          <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">VEHÍCULO</h3>
          <p className="text-xl font-bold text-gray-800 uppercase">{order.trp_motos?.marca} {order.trp_motos?.modelo}</p>
          <div className="flex gap-4 mt-2">
            <span className="bg-gray-100 px-2 py-1 rounded text-sm font-bold border border-gray-200">{order.trp_motos?.placa}</span>
            <span className="text-sm text-gray-500 flex items-center gap-1">{order.trp_motos?.kilometraje} KM</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-12">
        <thead>
          <tr className="bg-gray-900 text-white text-left text-xs uppercase tracking-widest">
            <th className="p-4">Descripción</th>
            <th className="p-4 text-center">Cant.</th>
            <th className="p-4 text-right">Precio</th>
            <th className="p-4 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {order.trp_orden_items?.map((item: any, i: number) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="p-4 font-bold text-gray-800 uppercase">{item.nombre}</td>
              <td className="p-4 text-center text-gray-500">{item.cantidad}</td>
              <td className="p-4 text-right text-gray-500">${item.precio_unitario.toLocaleString()}</td>
              <td className="p-4 text-right font-bold text-gray-800">${(item.cantidad * item.precio_unitario).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-16">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>${order.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>IVA (0%)</span>
            <span>$0</span>
          </div>
          <div className="flex justify-between text-2xl font-bold text-gray-900 border-t-2 border-orange-500 pt-3">
            <span>TOTAL</span>
            <span>${order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 pt-8 text-center">
        <p className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2">Gracias por confiar en 2RPITS</p>
        <p className="text-[10px] text-gray-400 max-w-md mx-auto leading-relaxed">
          Garantía de 30 días en mano de obra. Los repuestos eléctricos no tienen cambio. 
          Sigue recorriendo kilómetros con seguridad. 🏁🏍️
        </p>
      </div>

      {/* Decorative slant */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-5 -mr-16 -mt-16 transform rotate-45"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gray-900 opacity-5 -ml-16 -mb-16 transform rotate-45"></div>
    </div>
  )
})
