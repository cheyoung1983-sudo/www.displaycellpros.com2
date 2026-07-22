import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { STORE_PRODUCTS } from '@/lib/constants';

export function StoreView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-12 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Logistics & Supply</h1>
          <p className="text-slate-400 mt-2">Premium Gear & Certified Pre-Owned Devices</p>
        </div>
        <div className="hidden sm:flex items-center text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
          <ShoppingCart size={18} className="mr-2 text-blue-400" />
          <span className="text-sm font-semibold">Cart (0)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STORE_PRODUCTS.map(product => (
          <div key={product.id} className="bg-slate-800 rounded-xl border border-slate-705 overflow-hidden group flex flex-col">
            <div className="h-48 overflow-hidden relative">
              <img src={product.img} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur text-xs font-bold px-2 py-1 rounded text-slate-300">
                {product.category}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="text-lg font-semibold text-white mb-2 leading-tight">{product.name}</h3>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-blue-400">${product.price.toFixed(2)}</span>
                <button className="bg-slate-700 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
