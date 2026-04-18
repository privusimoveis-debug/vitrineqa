'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Maximize2, Bed, Bath, Car, ArrowRight, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PropertyData {
  id: string;
  title: string;
  address: string;
  city: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  description: string;
  images: { url: string; subtitle: string | null }[];
  prices: {
    rent: number;
    iptu: number;
    condo: number;
    total: number;
  };
  amenities: string[];
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PropertyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.post('/api/scrape', { url });
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao coletar dados do imóvel.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <main className="min-h-screen pb-20 px-4 md:px-0 bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <section className="pt-20 pb-12 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Vitrine <span className="gradient-text">QuintoAndar</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Colete fotos e informações de qualquer imóvel do QuintoAndar instantaneamente.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative max-w-2xl mx-auto"
          >
            <form onSubmit={handleScrape} className="relative group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Cole o link do imóvel aqui..."
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-5 px-6 pl-14 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 w-6 h-6" />
              <button
                type="submit"
                disabled={loading || !url}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Scraping
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 text-red-400 text-sm font-medium"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-6xl mx-auto mt-12">
        <AnimatePresence mode="wait">
          {data ? (
            <motion.div
              layout
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12"
            >
              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Maximize2, label: 'Área', value: `${data.area} m²` },
                  { icon: Bed, label: 'Quartos', value: data.bedrooms },
                  { icon: Bath, label: 'Banheiros', value: data.bathrooms },
                  { icon: Car, label: 'Vagas', value: data.parking },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl group premium-card">
                    <stat.icon className="w-6 h-6 text-blue-500 mb-4" />
                    <p className="text-zinc-500 text-sm uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Main Content Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl">
                    <h2 className="text-3xl font-bold mb-4">{data.title}</h2>
                    <div className="flex items-center gap-2 text-zinc-400 mb-6">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <span className="text-lg">{data.address}</span>
                    </div>
                    <div className="h-px bg-zinc-800 my-8" />
                    <h3 className="text-xl font-semibold mb-4">Sobre este imóvel</h3>
                    <p className="text-zinc-400 leading-relaxed whitespace-pre-line text-lg">
                      {data.description}
                    </p>
                  </div>

                  {/* Amenities */}
                  {data.amenities.length > 0 && (
                    <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl">
                      <h3 className="text-xl font-semibold mb-6">Amenidades</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.amenities.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 text-zinc-300">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar: Pricing */}
                <div className="space-y-6">
                  <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl sticky top-8">
                    <h3 className="text-xl font-semibold mb-6">Resumo de Valores</h3>
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Aluguel</span>
                        <span className="text-white font-medium">{formatCurrency(data.prices.rent || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Condomínio</span>
                        <span className="text-white font-medium">{formatCurrency(data.prices.condo || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>IPTU</span>
                        <span className="text-white font-medium">{formatCurrency(data.prices.iptu || 0)}</span>
                      </div>
                    </div>
                    <div className="h-px bg-zinc-800 mb-6" />
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <p className="text-zinc-500 text-sm uppercase font-bold tracking-widest mb-1">Total</p>
                        <p className="text-3xl font-black text-blue-500">{formatCurrency(data.prices.total || 0)}</p>
                      </div>
                    </div>
                    <button className="w-full bg-white text-black hover:bg-zinc-200 py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                      Ver no QuintoAndar
                    </button>
                  </div>
                </div>
              </div>

              {/* Image Gallery */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <ImageIcon className="w-7 h-7 text-blue-500" />
                    Fotos do Imóvel
                    <span className="text-zinc-500 font-normal text-lg ml-2">({data.images.length})</span>
                  </h3>
                </div>
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {data.images.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="break-inside-avoid relative group rounded-3xl overflow-hidden cursor-zoom-in"
                    >
                      <img
                        src={img.url}
                        alt={img.subtitle || 'Property image'}
                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                        <p className="text-white font-medium text-lg leading-snug">
                          {img.subtitle || 'Foto do imóvel'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-32 text-center"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 mb-6">
                  <Search className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-xl font-medium text-zinc-400">
                  Pronto para começar? Cole um link acima.
                </h3>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
