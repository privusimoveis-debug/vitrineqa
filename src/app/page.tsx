'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Maximize2, Bed, Bath, Car, 
  ArrowRight, Loader2, Image as ImageIcon, 
  CheckCircle2, Sparkles, Building2, 
  Share2, Heart, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
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

// --- Animations ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 100 }
  }
};

// --- Main Page Component ---
export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PropertyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.post('/api/scrape', { url });
      setData(response.data);
      // Wait a bit to ensure animations transitions smoothly
      setTimeout(() => {
        const resultsEl = document.getElementById('results');
        resultsEl?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Não conseguimos acessar as informações deste imóvel.');
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
    <div className="min-h-screen selection:bg-blue-500/30">
      <div className="bg-mesh" />
      
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-500 px-6 py-4",
        scrolled ? "bg-black/40 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <Building2 className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              VitrineQA <span className="text-blue-500">.</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/50">
            <a href="#" className="hover:text-white transition-colors">Início</a>
            <a href="#" className="hover:text-white transition-colors">Histórico</a>
            <button className="glass-pill px-5 py-2 text-white hover:bg-white/10 transition-all">
              Minha Conta
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Web Scraping IA 2026
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-[0.9]">
              EXTRAÇÃO <span className="gradient-text">INTELIGENTE</span>
            </h1>
            <p className="text-zinc-400 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
              Transforme links do QuintoAndar em vitrines de alta conversão instantaneamente.
            </p>
          </motion.div>

          {/* Search Bar Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative max-w-3xl mx-auto group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
            <form onSubmit={handleScrape} className="relative bg-[#0d0d0d] border border-white/10 rounded-[1.8rem] flex items-center p-2 shadow-2xl">
              <div className="pl-6 text-zinc-500 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Cole a URL do imóvel aqui..."
                className="flex-1 bg-transparent border-none py-4 px-4 text-lg focus:outline-none placeholder:text-zinc-600 text-white font-medium"
              />
              <button
                type="submit"
                disabled={loading || !url}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-4 rounded-[1.4rem] font-bold text-lg flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Coletar Dados
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                  className="mt-6 text-red-500 text-sm font-semibold tracking-wide uppercase"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="max-w-7xl mx-auto px-6 pb-40">
        <AnimatePresence mode="wait">
          {data ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-12"
            >
              {/* Header result */}
              <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-500">
                    <MapPin className="w-5 h-5" />
                    <span className="font-bold tracking-widest uppercase text-sm">{data.city}</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black">{data.title}</h2>
                  <p className="text-zinc-500 text-xl">{data.address}</p>
                </div>
                <div className="flex gap-4">
                  <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all text-white/70 hover:text-white">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="w-12 h-12 glass rounded-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all text-white/70 hover:text-white">
                    <Heart className="w-5 h-5" />
                  </button>
                  <a 
                    href={url} 
                    target="_blank" 
                    className="flex items-center gap-2 bg-white text-black px-6 rounded-2xl font-bold hover:bg-zinc-200 transition-colors"
                  >
                    Original <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>

              {/* Bento Grid Features */}
              <motion.div variants={itemVariants} className="bento-grid">
                {/* Large Bento Item: Main Stats */}
                <div className="grid grid-cols-2 gap-4 col-span-2 row-span-1">
                  {[
                    { icon: Maximize2, label: 'Área Total', value: `${data.area}m²` },
                    { icon: Bed, label: 'Dormitórios', value: data.bedrooms },
                    { icon: Bath, label: 'Banheiros', value: data.bathrooms },
                    { icon: Car, label: 'Vagas', value: data.parking },
                  ].map((stat, i) => (
                    <div key={i} className="glass p-6 rounded-[2rem] flex flex-col justify-between hover-glow group">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                        <stat.icon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                        <p className="text-3xl font-black mt-1">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Item */}
                <div className="col-span-2 row-span-1 glass p-8 rounded-[2.5rem] flex flex-col justify-between hover-glow bg-gradient-to-br from-blue-600/10 to-transparent">
                  <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-bold">Investimento</h3>
                    <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">Disponível</div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-zinc-400 border-b border-white/5 pb-2">
                      <span>Aluguel</span>
                      <span className="text-white">{formatCurrency(data.prices.rent || 0)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 border-b border-white/5 pb-2">
                      <span>Condomínio + IPTU</span>
                      <span className="text-white">{formatCurrency((data.prices.condo || 0) + (data.prices.iptu || 0))}</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                      <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Total Mensal</span>
                      <span className="text-5xl font-black text-blue-500 leading-none tracking-tight">
                        {formatCurrency(data.prices.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Description & Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Description column */}
                <motion.div variants={itemVariants} className="md:col-span-1 space-y-8">
                  <div className="glass p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="text-2xl font-bold border-b border-white/5 pb-4">Destaques</h3>
                    <div className="space-y-4">
                      {data.amenities.slice(0, 10).map((amenity, i) => (
                        <div key={i} className="flex items-center gap-3 text-zinc-300">
                          <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                          <span className="text-sm font-medium">{amenity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4">
                      <p className="text-zinc-400 text-sm leading-relaxed line-clamp-6 italic">
                        "{data.description}"
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Gallery column */}
                <motion.div variants={itemVariants} className="md:col-span-2 space-y-8">
                  <div className="flex items-center gap-4">
                    <h3 className="text-3xl font-black tracking-tight">GALERIA DE IMAGENS</h3>
                    <div className="h-px flex-1 bg-white/10"></div>
                    <span className="text-zinc-500 font-bold">{data.images.length} FOTOS</span>
                  </div>
                  
                  <div className="masonry">
                    {data.images.map((img, i) => (
                      <motion.div 
                        key={i} 
                        className="masonry-item group relative overflow-hidden rounded-3xl"
                        whileHover={{ y: -5 }}
                      >
                        <img 
                          src={img.url} 
                          alt={img.subtitle || 'Property photo'}
                          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex items-end">
                          <p className="text-white font-bold text-sm tracking-wide">
                            {img.subtitle || 'Espaço do imóvel'}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            !loading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="py-40 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                  <ImageIcon className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white/40">Sua vitrine aparecerá aqui</h3>
                  <p className="text-zinc-600 max-w-sm">Cole o endereço do imóvel acima para iniciar a extração de dados e fotos.</p>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-500 text-sm font-medium">
          <p>© 2026 VitrineQA Scraper. Todos os direitos reservados.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white">Privacidade</a>
            <a href="#" className="hover:text-white">Termos</a>
            <a href="#" className="hover:text-white">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
