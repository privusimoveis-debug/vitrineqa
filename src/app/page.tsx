'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Maximize2, Bed, Bath, Car, 
  ArrowRight, Loader2, Image as ImageIcon, 
  CheckCircle2, Building2, 
  Share2, Heart, ExternalLink, TrendingUp, Tag,
  Info, ShieldCheck, Home as HomeIcon,
  ChevronDown, ChevronUp, Instagram, Sparkles,
  Download, X, Check, Grid
} from 'lucide-react';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

// --- Small Components ---
const StepIndicator = ({ 
  number, 
  title, 
  active, 
  collapsible, 
  isExpanded, 
  onToggle 
}: { 
  number: number; 
  title: string; 
  active?: boolean;
  collapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}) => (
  <div className={cn(
    "flex items-center gap-3 md:gap-4 mb-6 md:mb-10 transition-all duration-700",
    active ? "opacity-100 scale-100" : "opacity-30 scale-95"
  )}>
    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-blue-700 to-blue-400 flex items-center justify-center font-black text-lg md:text-xl shadow-lg shadow-blue-500/20 flex-shrink-0">
      {number}
    </div>
    <div className="flex-1 flex items-center gap-4">
      <h3 className="text-xl md:text-3xl font-black tracking-tighter uppercase italic truncate">{title}</h3>
      <div className="h-[2px] flex-1 bg-gradient-to-r from-white/20 to-transparent hidden sm:block"></div>
    </div>
    {collapsible && (
      <button 
        onClick={onToggle}
        className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
      >
        <ChevronDown className={cn("w-5 h-5 md:w-6 md:h-6 transition-transform duration-500", isExpanded ? "rotate-180" : "rotate-0")} />
      </button>
    )}
  </div>
);

// --- Main Page Component ---
export default function ScraperPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PropertyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
  
  // Selection/Download state
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isZipping, setIsZipping] = useState(false);

  // Collapse States (Sections)
  const [isStep2Expanded, setIsStep2Expanded] = useState(true);
  const [isStep3Expanded, setIsStep3Expanded] = useState(true);
  
  // Content "Show More" States
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isUnitExpanded, setIsUnitExpanded] = useState(false);
  const [isBuildingExpanded, setIsBuildingExpanded] = useState(false);

  // Stage 3 Specific
  const [caption, setCaption] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
    setIsGalleryExpanded(false);
    setIsStep2Expanded(true);
    setIsStep3Expanded(true);
    setSelectedIndices([]);
    
    // Reset content expansion
    setIsDescExpanded(false);
    setIsUnitExpanded(false);
    setIsBuildingExpanded(false);

    // Reset Stage 3
    setCaption('');
    setIsCopied(false);

    try {
      const response = await axios.post('/api/scrape', { url });
      setData(response.data);
      setTimeout(() => {
        const resultsEl = document.getElementById('step-2');
        resultsEl?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Não conseguimos acessar as informações deste imóvel.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPhotos = async () => {
    if (!data || selectedIndices.length === 0) return;

    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder(data.id);

    try {
      const downloadPromises = selectedIndices.map(async (index, i) => {
        const img = data.images[index];
        // Use proxy to avoid CORS issues
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(img.url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Proxy fetch failed');
        const blob = await response.blob();
        folder?.file(`foto-${i + 1}.jpg`, blob);
      });

      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${data.id}.zip`);
      setIsDownloadModalOpen(false);
    } catch (err) {
      console.error('Download failed', err);
      alert('Erro ao baixar fotos. Tente novamente.');
    } finally {
      setIsZipping(false);
    }
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedIndices.length === data.images.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(data.images.map((_, i) => i));
    }
  };

  const toggleImageSelection = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateCaption = async () => {
    if (!data) return;

    setIsGeneratingCaption(true);
    
    // Simulate complex AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    const bairro = data.address.split(',').pop()?.trim() || data.city;
    const price = data.prices.isForSale ? formatCurrency(data.prices.salePrice) : formatCurrency(data.prices.rent);
    
    const lines = [
      `${bairro} - ${data.title}`,
      "",
      `Oportunidade exclusiva de ${data.prices.isForSale ? 'Venda' : 'Aluguel'} em ${data.city}! 🏠✨`,
      "",
      `📐 ${data.area}m² privativos`,
      `🛏️ ${data.bedrooms} Dormitórios`,
      `🛁 ${data.bathrooms} Banheiros`,
      `🚗 ${data.parking} Vagas de garagem`,
      "",
      `💰 Investimento: ${price}`,
      "",
      data.description.length > 100 ? data.description.substring(0, 150) + "..." : data.description,
      "",
      "Agende sua visita e venha conhecer este imóvel incrível. 🚀",
      "",
      `#imobiliaria #corretor #imoveis #quintoandar #vitrineqa #${data.city.replace(/\s+/g, '')} #${data.type.replace(/\s+/g, '')}`
    ];

    setCaption(lines.join('\n'));
    setIsGeneratingCaption(false);
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

      {/* STAGE 1: SEARCH */}
      <section className="relative pt-48 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <StepIndicator number={1} title="Coleta de Dados" active={true} />

          {/* Search Bar Premium - FIXED LIGHTNESS */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative group w-full"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-[2rem] md:rounded-[2.5rem] blur-2xl opacity-100 group-focus-within:opacity-100 transition duration-1000"></div>
            <form onSubmit={handleScrape} className="relative bg-[#1a1a1a]/40 backdrop-blur-3xl border border-white/20 rounded-2xl md:rounded-[2rem] flex flex-col md:flex-row items-stretch md:items-center p-2 md:p-3 shadow-2xl gap-2 md:gap-0">
              <div className="hidden md:flex pl-6 text-white/40">
                <Search className="w-7 h-7" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Cole o link do imóvel aqui..."
                className="flex-1 bg-transparent border-none py-4 md:py-6 px-4 md:px-6 text-base md:text-xl focus:outline-none placeholder:text-white/30 text-white font-semibold"
              />
              <button
                type="submit"
                disabled={loading || !url}
                className={cn(
                  "bg-white text-black hover:bg-zinc-200 disabled:opacity-30 px-6 md:px-12 py-4 md:py-6 rounded-xl md:rounded-[1.6rem] font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg",
                  loading && "animate-pulse"
                )}
              >
                {loading ? "Capturando..." : (
                  <>
                    Iniciar
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 font-bold" />
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
                  className="mt-4 md:mt-6 text-red-500 text-[10px] md:text-xs font-black tracking-widest uppercase text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* STAGE 2: RESULTS */}
      <section id="step-2" className="max-w-7xl mx-auto px-6 pb-40 min-h-[50vh]">
        <AnimatePresence mode="wait">
          {data ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-20"
            >
              <StepIndicator 
                number={2} 
                title="Análise & Mídia" 
                active={true} 
                collapsible 
                isExpanded={isStep2Expanded} 
                onToggle={() => setIsStep2Expanded(!isStep2Expanded)} 
              />

              <AnimatePresence>
                {isStep2Expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="overflow-hidden space-y-20"
                  >
                    {/* Header result */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/5 pb-16">
                      <div className="space-y-6 flex-1">
                        <div className="flex items-center gap-3 text-blue-500 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full w-fit">
                          <MapPin className="w-4 h-4" />
                          <span className="font-bold tracking-widest uppercase text-[10px]">{data.city} • ID: {data.id}</span>
                        </div>
                        <h2 className="text-3xl md:text-6xl font-black tracking-tight leading-[1.1] uppercase italic">{data.title}</h2>
                        <p className="text-white/40 text-lg md:text-xl font-medium tracking-tight whitespace-pre-wrap">{data.address}</p>
                      </div>
                      <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <button 
                          onClick={() => setIsDownloadModalOpen(true)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                        >
                          Baixar Fotos <Download className="w-4 h-4" />
                        </button>
                        <a 
                          href={url} 
                          target="_blank" 
                          className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white text-black px-8 h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                        >
                          Link Original <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Stats & Financial Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                      <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
                         <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-[2rem] flex flex-col justify-between group hover:border-blue-500/50 transition-all duration-500">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-500">
                              <HomeIcon className="w-5 h-5" />
                            </div>
                            <div className="mt-4 md:mt-6">
                              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Imóvel</p>
                              <p className="text-xs md:text-sm font-black mt-1 tracking-tighter uppercase line-clamp-1">{data.type}</p>
                            </div>
                          </div>
                          {[
                            { icon: Maximize2, label: 'Área', value: `${data.area}m²` },
                            { icon: Bed, label: 'Quartos', value: data.bedrooms },
                            { icon: Bath, label: 'Banheiros', value: data.bathrooms },
                            { icon: Car, label: 'Vagas', value: data.parking },
                          ].map((stat, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-[2rem] flex flex-col justify-between group hover:border-blue-500/50 transition-all duration-500">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-500">
                                <stat.icon className="w-5 h-5" />
                              </div>
                              <div className="mt-4 md:mt-6">
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                                <p className="text-xl md:text-2xl font-black mt-1 tracking-tighter">{stat.value}</p>
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="md:col-span-4 bg-gradient-to-br from-blue-700 to-blue-900 border border-blue-500/30 p-8 md:p-10 rounded-2xl md:rounded-[3rem] shadow-2xl relative overflow-hidden group h-full flex flex-col justify-between">
                          <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-white/10 blur-3xl rounded-full -mr-16 md:-mr-20 -mt-16 md:-mt-20"></div>
                          <div className="relative space-y-4">
                            <div className="flex justify-between items-center mb-4 md:mb-6">
                              <Tag className="w-6 h-6 md:w-8 md:h-8 text-white/50" />
                              <span className="bg-white text-blue-700 px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl">
                                {data.prices.isForSale ? "Venda" : "Aluguel"}
                              </span>
                            </div>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                              Valor Proposto
                            </p>
                            <h3 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">
                              {data.prices.isForSale ? formatCurrency(data.prices.salePrice) : formatCurrency(data.prices.rent)}
                            </h3>
                            <div className="pt-4 md:pt-6 border-t border-white/10 flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40">
                               <span>Taxas Inclusas</span>
                               <span>{formatCurrency(data.prices.condo + data.prices.iptu)}</span>
                            </div>
                          </div>
                      </div>
                    </div>

                    {/* Description & Gallery Toggle */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      <div className="lg:col-span-1 bg-white/5 border border-white/10 p-10 rounded-[3rem] h-fit relative">
                         <h3 className="text-xl font-black uppercase tracking-tighter mb-8 italic flex items-center gap-3">
                           <TrendingUp className="w-5 h-5 text-blue-500" /> Descrição
                         </h3>
                         <div className={cn(
                           "relative transition-all duration-700 overflow-hidden",
                           isDescExpanded ? "max-h-[2000px]" : "max-h-[200px]"
                         )}>
                           <p className="text-white/60 text-lg leading-relaxed font-medium pb-10">
                              {data.description || 'Nenhuma descrição detalhada disponível.'}
                           </p>
                           {!isDescExpanded && (
                             <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none" />
                           )}
                         </div>
                         <button 
                          onClick={() => setIsDescExpanded(!isDescExpanded)}
                          className="mt-4 text-blue-500 text-[10px] font-black underline uppercase tracking-widest hover:text-white transition-colors"
                         >
                           {isDescExpanded ? "Ver Menos" : "Ver Tudo"}
                         </button>
                      </div>

                      <div className="lg:col-span-2 space-y-8 md:space-y-10">
                         {/* COLLAPSIBLE GALLERY BOX */}
                         <div className="bg-white/5 border border-white/10 p-2 md:p-4 rounded-3xl md:rounded-[3.5rem] relative overflow-hidden group">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                              {(isGalleryExpanded ? data.images : data.images.slice(0, 4)).map((img, i) => (
                                <motion.div 
                                  key={i} 
                                  layout
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="relative aspect-video rounded-2xl md:rounded-3xl overflow-hidden border border-white/5"
                                >
                                  <img src={img.url} className="w-full h-full object-cover" alt="" />
                                </motion.div>
                              ))}
                            </div>

                            {/* Expand Overlay */}
                            {!isGalleryExpanded && data.images.length > 4 && (
                              <div className="absolute inset-x-0 bottom-0 h-32 md:h-40 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-center pb-6 md:pb-10">
                                 <button 
                                  onClick={() => setIsGalleryExpanded(true)}
                                  className="bg-white text-black px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-[1.6rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-2 md:gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                                 >
                                   Expandir Galeria ({data.images.length}) <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                                 </button>
                              </div>
                            )}

                            {isGalleryExpanded && (
                               <div className="flex justify-center pt-6 md:pt-10 pb-4 md:pb-6">
                                  <button 
                                    onClick={() => {
                                      setIsGalleryExpanded(false);
                                      document.getElementById('step-2')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="bg-white/10 hover:bg-white/20 text-white px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-[1.6rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-2 md:gap-3 transition-all"
                                  >
                                    Recolher <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
                                  </button>
                               </div>
                            )}
                         </div>
                      </div>
                    </div>

                    {/* AMENITIES ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {/* UNIT AMENITIES */}
                      <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] h-fit relative">
                         <h3 className="text-xl font-black uppercase tracking-tighter mb-8 italic flex items-center gap-3">
                           <Info className="w-5 h-5 text-blue-500" /> Do Imóvel
                         </h3>
                         <div className={cn(
                           "relative transition-all duration-700 overflow-hidden",
                           isUnitExpanded ? "max-h-[2000px]" : "max-h-[200px]"
                         )}>
                            <div className="flex flex-wrap gap-3 pb-10">
                              {data.unitAmenities?.length > 0 ? data.unitAmenities.map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-white/40 group-hover:text-white transition-all">
                                  {item}
                                </div>
                              )) : (
                                <p className="text-white/20 text-xs italic">Não informado</p>
                              )}
                            </div>
                           {!isUnitExpanded && data.unitAmenities?.length > 10 && (
                             <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none" />
                           )}
                         </div>
                         {data.unitAmenities?.length > 10 && (
                           <button 
                            onClick={() => setIsUnitExpanded(!isUnitExpanded)}
                            className="mt-4 text-blue-500 text-[10px] font-black underline uppercase tracking-widest hover:text-white transition-colors"
                           >
                             {isUnitExpanded ? "Ver Menos" : "Ver Tudo"}
                           </button>
                         )}
                      </div>

                      {/* BUILDING AMENITIES */}
                      <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] h-fit relative">
                         <h3 className="text-xl font-black uppercase tracking-tighter mb-8 italic flex items-center gap-3">
                           <ShieldCheck className="w-5 h-5 text-blue-500" /> Do Condomínio
                         </h3>
                         <div className={cn(
                           "relative transition-all duration-700 overflow-hidden",
                           isBuildingExpanded ? "max-h-[2000px]" : "max-h-[200px]"
                         )}>
                            <div className="flex flex-wrap gap-3 pb-10">
                              {data.buildingAmenities?.length > 0 ? data.buildingAmenities.map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-white/40 transition-all">
                                  {item}
                                </div>
                              )) : (
                                <p className="text-white/20 text-xs italic">Não informado</p>
                              )}
                            </div>
                           {!isBuildingExpanded && data.buildingAmenities?.length > 10 && (
                             <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none" />
                           )}
                         </div>
                         {data.buildingAmenities?.length > 10 && (
                           <button 
                            onClick={() => setIsBuildingExpanded(!isBuildingExpanded)}
                            className="mt-4 text-blue-500 text-[10px] font-black underline uppercase tracking-widest hover:text-white transition-colors"
                           >
                             {isBuildingExpanded ? "Ver Menos" : "Ver Tudo"}
                           </button>
                         )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STAGE 3: MARKETING */}
              <div id="step-3" className="pt-20">
                <StepIndicator 
                  number={3} 
                  title="Criação de Conteúdo" 
                  active={true} 
                  collapsible 
                  isExpanded={isStep3Expanded} 
                  onToggle={() => setIsStep3Expanded(!isStep3Expanded)} 
                />
                
                <AnimatePresence>
                  {isStep3Expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <motion.div 
                        variants={itemVariants}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-10"
                      >
                        {/* Caption Editor */}
                        <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col gap-8">
                          <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                              <Sparkles className="w-6 h-6 text-blue-500" /> Legenda do Post
                            </h4>
                            <button 
                              onClick={handleGenerateCaption}
                              disabled={isGeneratingCaption}
                              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2"
                            >
                              {isGeneratingCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar com IA"}
                            </button>
                          </div>

                          <div className="relative group flex-1 min-h-[300px]">
                            <textarea
                              value={caption}
                              onChange={(e) => setCaption(e.target.value)}
                              placeholder="Clique em 'Gerar com IA' para criar sua legenda perfeita..."
                              className="w-full h-full bg-black/40 border border-white/5 rounded-[2rem] p-8 text-white/70 text-base font-medium resize-none focus:outline-none focus:border-blue-500/50 transition-all custom-scrollbar"
                            />
                            {caption && (
                              <button 
                                onClick={handleCopyCaption}
                                className={cn(
                                  "absolute bottom-6 right-6 px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 shadow-2xl",
                                  isCopied ? "bg-green-500 text-white" : "bg-white text-black hover:bg-zinc-200"
                                )}
                              >
                                {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                {isCopied ? "Copiado!" : "Copiar Legenda"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Carousel Placeholder (Future Step) */}
                        <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-700">
                           <div className="space-y-6">
                              <div className="w-16 h-16 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                                 <Instagram className="w-8 h-8 text-pink-500" />
                              </div>
                              <h4 className="text-2xl font-black tracking-tighter uppercase italic">Imagens do Carrossel</h4>
                              <p className="text-white/40 text-sm font-medium">
                                Próxima Fase: Gerar automaticamente os slides profissionais para o seu feed.
                              </p>
                           </div>
                           <button className="w-full bg-white/5 border border-white/10 text-white/20 px-8 py-6 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed">
                             Em breve <Sparkles className="w-4 h-4" />
                           </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            !loading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="py-40 flex flex-col items-center justify-center text-center space-y-10"
              >
                <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/5 shadow-inner">
                  <ImageIcon className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black tracking-tighter text-white/20 uppercase italic">Aguardando Captura</h3>
                  <p className="text-white/10 max-w-sm font-bold uppercase tracking-widest text-[10px]">Cole um link do QuintoAndar na Etapa 1</p>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </section>

      {/* DOWNLOAD MODAL */}
      <AnimatePresence>
        {isDownloadModalOpen && data && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDownloadModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 md:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div>
                   <h3 className="text-3xl font-black tracking-tighter uppercase italic">Selecionar Fotos</h3>
                   <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                     {selectedIndices.length} de {data.images.length} fotos selecionadas
                   </p>
                 </div>
                 <div className="flex items-center gap-4 w-full md:w-auto">
                   <button 
                    onClick={toggleSelectAll}
                    className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-white/5 border border-white/10 font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                   >
                     {selectedIndices.length === data.images.length ? "Desmarcar Todas" : "Selecionar Todas"}
                   </button>
                   <button 
                    onClick={() => setIsDownloadModalOpen(false)}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-500 transition-all font-bold"
                   >
                     <X className="w-5 h-5" />
                   </button>
                 </div>
              </div>

              {/* Modal Body: Photo Grid */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                   {data.images.map((img, i) => {
                     const isSelected = selectedIndices.includes(i);
                     return (
                       <div 
                        key={i}
                        onClick={() => toggleImageSelection(i)}
                        className={cn(
                          "relative aspect-square rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300",
                          isSelected ? "ring-4 ring-blue-500 ring-offset-4 ring-offset-[#0a0a0a] scale-[0.98]" : "hover:scale-[1.02]"
                        )}
                       >
                         <img src={img.url} className={cn("w-full h-full object-cover grayscale transition-all", isSelected ? "grayscale-0" : "group-hover:grayscale-0")} alt="" />
                         <div className={cn(
                           "absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                           isSelected ? "bg-blue-500 border-blue-500 text-white" : "bg-black/40 border-white/20 text-transparent"
                         )}>
                            <Check className="w-4 h-4" />
                         </div>
                       </div>
                     );
                   })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 md:p-10 border-t border-white/5 flex justify-end items-center gap-6">
                 <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest hidden md:block">
                   O arquivo será salvo como: {data.id}.zip
                 </p>
                 <button 
                  disabled={selectedIndices.length === 0 || isZipping}
                  onClick={handleDownloadPhotos}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white px-10 h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                 >
                   {isZipping ? (
                     <>
                       <Loader2 className="w-5 h-5 animate-spin" /> Processando...
                     </>
                   ) : (
                     <>
                       Baixar {selectedIndices.length} {selectedIndices.length === 1 ? 'Foto' : 'Fotos'} <Download className="w-4 h-4" />
                     </>
                   )}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/5 py-24 px-6 bg-black/50 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3 opacity-20">
             <div className="w-8 h-8 bg-white/50 rounded-lg"></div>
             <span className="font-black tracking-tighter text-xl uppercase">Vitrine QA</span>
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            <a href="#" className="hover:text-blue-500 transition-colors">Explorer</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Histórico</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Open Source</a>
          </div>
          <p className="text-white/10 text-[10px] font-black uppercase tracking-widest italic">© 2026 VitrineQA • Para Corretores de Elite</p>
        </div>
      </footer>
    </div>
  );
}
