'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Maximize2, Bed, Bath, Car, 
  ArrowRight, Loader2, Image as ImageIcon, 
  CheckCircle2, Building2, 
  Share2, Heart, ExternalLink, TrendingUp, Tag,
  Info, ShieldCheck, Home
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
  type: string;
  address: string;
  city: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  description: string;
  images: { url: string; subtitle: string | null }[];
  prices: {
    salePrice: number;
    rent: number;
    iptu: number;
    condo: number;
    total: number;
    isForSale: boolean;
  };
  unitAmenities: string[];
  buildingAmenities: string[];
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
    <div className="min-h-screen selection:bg-blue-500/30 font-sans text-white bg-[#050505]">
      <div className="bg-mesh" />
      
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-500 px-6 py-4",
        scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
              <Building2 className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">
              Vitrine<span className="text-blue-500">QA</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-white/40">
            <a href="#" className="hover:text-white transition-colors">Explorar</a>
            <a href="#" className="hover:text-white transition-colors">Histórico</a>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-full text-white transition-all">
              Entrar
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section Simplified */}
      <section className="relative pt-48 pb-20 overflow-hidden text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          {/* Search Bar Premium */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative group"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[2.5rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
            <form onSubmit={handleScrape} className="relative bg-[#0d0d0d]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex items-center p-2.5 shadow-2xl">
              <div className="pl-6 text-white/20">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Cole o link do imóvel aqui..."
                className="flex-1 bg-transparent border-none py-5 px-5 text-lg focus:outline-none placeholder:text-white/20 text-white font-medium"
              />
              <button
                type="submit"
                disabled={loading || !url}
                className={cn(
                  "bg-white text-black hover:bg-zinc-200 disabled:opacity-30 px-10 py-5 rounded-[1.6rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95",
                  loading && "animate-pulse"
                )}
              >
                {loading ? "Processando..." : (
                  <>
                    Coletar Dados
                    <ArrowRight className="w-5 h-5 font-bold" />
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
                  className="mt-6 text-red-500 text-xs font-black tracking-widest uppercase text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="max-w-7xl mx-auto px-6 pb-60">
        <AnimatePresence mode="wait">
          {data ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-20"
            >
              {/* Header result */}
              <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/5 pb-16">
                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-3 text-blue-500 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full w-fit">
                    <MapPin className="w-4 h-4" />
                    <span className="font-bold tracking-widest uppercase text-[10px]">{data.city} • ID: {data.id}</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] uppercase">{data.title}</h2>
                  <p className="text-white/40 text-xl font-medium tracking-tight whitespace-pre-wrap">{data.address}</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button className="w-16 h-16 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 transition-all text-white/50 hover:text-white">
                    <Share2 className="w-6 h-6" />
                  </button>
                  <button className="w-16 h-16 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95 transition-all text-white/50 hover:text-white">
                    <Heart className="w-6 h-6" />
                  </button>
                  <a 
                    href={url} 
                    target="_blank" 
                    className="flex items-center gap-3 bg-white text-black px-10 h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all flex-shrink-0"
                  >
                    Original <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                 <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col justify-between group hover:border-blue-500/50 transition-all duration-500">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-500">
                      <Home className="w-5 h-5" />
                    </div>
                    <div className="mt-6">
                      <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Imóvel</p>
                      <p className="text-xl font-black mt-1 tracking-tighter uppercase">{data.type}</p>
                    </div>
                  </div>
                  {[
                    { icon: Maximize2, label: 'Área', value: `${data.area} m²` },
                    { icon: Bed, label: 'Quartos', value: data.bedrooms },
                    { icon: Bath, label: 'Banheiros', value: data.bathrooms },
                    { icon: Car, label: 'Vagas', value: data.parking },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col justify-between group hover:border-blue-500/50 transition-all duration-500">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-500">
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className="mt-6">
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                        <p className="text-3xl font-black mt-1 tracking-tighter">{stat.value}</p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Main Content: Investment + Description + Amenities */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Investment Side Card */}
                <div className="lg:col-span-4 h-fit sticky top-24">
                   <div className="bg-gradient-to-br from-blue-700 to-blue-900 border border-blue-500/30 p-10 rounded-[3rem] flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20"></div>
                    <div className="relative space-y-8">
                      <div className="flex justify-between items-center">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                          <Tag className="w-6 h-6 text-white" />
                        </div>
                        <span className="bg-white text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                          {data.prices.isForSale ? "Venda" : "Aluguel"}
                        </span>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                          {data.prices.isForSale ? "Valor de Venda" : "Aluguel Mensal"}
                        </p>
                        <h3 className="text-5xl font-black tracking-tighter text-white leading-none">
                          {data.prices.isForSale ? formatCurrency(data.prices.salePrice) : formatCurrency(data.prices.rent)}
                        </h3>
                      </div>

                      <div className="pt-8 border-t border-white/20 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/60">
                          <span>Total Mensal</span>
                          <span className="text-white">{formatCurrency(data.prices.total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/40">
                          <span>Condomínio + IPTU</span>
                          <span className="text-white/70">{formatCurrency(data.prices.condo + data.prices.iptu)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Blocks Side */}
                <div className="lg:col-span-8 space-y-12">
                  
                  {/* Descrição Section */}
                  <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-500">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Descrição</h3>
                     </div>
                     <p className="text-white/60 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                        {data.description || 'Nenhuma descrição detalhada disponível.'}
                     </p>
                  </div>

                  {/* Imóvel Amenities Section */}
                  <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-500">
                          <Info className="w-5 h-5" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Imóvel</h3>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        {data.unitAmenities.length > 0 ? data.unitAmenities.map((amenity, i) => (
                           <div key={i} className="bg-white/5 border border-white/10 px-5 py-2 rounded-2xl text-sm font-bold text-white/70">
                              {amenity}
                           </div>
                        )) : <p className="text-white/30 italic">Nenhuma característica específica listada.</p>}
                     </div>
                  </div>

                  {/* Condomínio Amenities Section */}
                  <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-blue-500">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Condomínio</h3>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        {data.buildingAmenities.length > 0 ? data.buildingAmenities.map((amenity, i) => (
                           <div key={i} className="bg-white/5 border border-white/10 px-5 py-2 rounded-2xl text-sm font-bold text-white/70">
                              {amenity}
                           </div>
                        )) : <p className="text-white/30 italic">Características do condomínio não informadas.</p>}
                     </div>
                  </div>

                  {/* Gallery */}
                  <div className="space-y-12 pt-10">
                    <div className="flex items-center gap-6">
                        <h3 className="text-4xl font-black tracking-tight uppercase italic mix-blend-difference">Galeria de Fotos</h3>
                        <div className="h-[2px] flex-1 bg-white/10"></div>
                        <span className="text-white/20 font-black text-xs tracking-[0.3em]">{data.images.length} FOTOS</span>
                    </div>
                    
                    <div className="columns-1 md:columns-2 gap-8 space-y-8">
                      {data.images.map((img, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          className="relative group overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl cursor-zoom-in"
                        >
                          <img 
                            src={img.url} 
                            alt={img.subtitle || 'Foto do imóvel'}
                            className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-8 flex flex-col justify-end">
                              <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2">Ambiente • {i + 1}</span>
                              <p className="text-white font-black text-xl tracking-tight leading-none uppercase italic">
                                {img.subtitle || 'Detalhe do Imóvel'}
                              </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            !loading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="py-60 flex flex-col items-center justify-center text-center space-y-10"
              >
                <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/10 shadow-inner">
                  <ImageIcon className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black tracking-tighter text-white/20 uppercase italic">Aguardando Coleta</h3>
                  <p className="text-white/10 max-w-sm font-bold uppercase tracking-widest text-[10px]">Utilize o campo superior para processar um link do QuintoAndar</p>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-24 px-6 bg-black/50 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3 opacity-20">
             <div className="w-8 h-8 bg-white/50 rounded-lg"></div>
             <span className="font-black tracking-tighter text-xl">VITRINE QA</span>
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            <a href="#" className="hover:text-blue-500 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Histórico</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Github</a>
          </div>
          <p className="text-white/10 text-[10px] font-black uppercase tracking-widest">© 2026 VitrineQA • Desenvolvido para Agentes de Elite</p>
        </div>
      </footer>
    </div>
  );
}
