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
import * as htmlToImage from 'html-to-image';

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

// --- Carousel Themes (Elite 2026 Dynamic) ---
const ELITE_GRADIENTS = [
  { name: 'Midnight', from: 'from-blue-900', via: 'via-indigo-950', to: 'to-black', accent: 'text-blue-400', glass: 'bg-white/5 border-white/10' },
  { name: 'Emerald', from: 'from-emerald-900', via: 'via-teal-950', to: 'to-black', accent: 'text-emerald-400', glass: 'bg-white/5 border-white/10' },
  { name: 'Rose', from: 'from-rose-900', via: 'via-pink-950', to: 'to-black', accent: 'text-rose-400', glass: 'bg-white/5 border-white/10' },
  { name: 'Amber', from: 'from-amber-900', via: 'via-orange-950', to: 'to-black', accent: 'text-amber-400', glass: 'bg-white/5 border-white/10' },
  { name: 'Violet', from: 'from-violet-900', via: 'via-purple-950', to: 'to-black', accent: 'text-violet-400', glass: 'bg-white/5 border-white/10' },
  { name: 'Slate', from: 'from-slate-800', via: 'via-slate-950', to: 'to-black', accent: 'text-slate-300', glass: 'bg-white/5 border-white/10' },
];

const cleanImageUrl = (url: string) => {
  if (!url) return "";
  // Removes resize parameters like /1024x1024 or query params to get original quality
  return url.replace(/\/\d+x\d+$/, '').split('?')[0];
};

// --- Elite Slide Component ---
const InstagramSlide = ({ theme, children, watermark, className }: { theme: any, children: React.ReactNode, watermark: string, className?: string }) => (
  <div 
    className={cn(
      "w-[1080px] h-[1350px] relative overflow-hidden flex flex-col text-white bg-black shrink-0 select-none",
      theme.from && `bg-gradient-to-tr ${theme.from} ${theme.via} ${theme.to}`,
      className
    )}
  >
    {/* Noise Texture Overlay for that premium feel */}
    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    
    <div className="relative z-10 flex-1 flex flex-col p-20">
      {children}
    </div>
    
    {/* Watermark - Minimalist 2026 Style */}
    <div className="absolute bottom-10 right-10 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-xl px-8 py-3 rounded-full border border-white/5">
      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      <span className="text-xl font-medium tracking-[0.2em] uppercase text-white/70" style={{ fontFamily: "'Inter', sans-serif" }}>
        {watermark}
      </span>
    </div>
  </div>
);

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
  
  // Carousel Specific
  const [gradientIndex, setGradientIndex] = useState(0);
  const [isRenderingCarousel, setIsRenderingCarousel] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [activeCaptureIndex, setActiveCaptureIndex] = useState<number | null>(null);
  const [preloadedImages, setPreloadedImages] = useState<Record<number, string>>({});
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (data) {
      handleGenerateCaption();
      // Pick a random gradient for variety
      setGradientIndex(Math.floor(Math.random() * ELITE_GRADIENTS.length));
    }
  }, [data]);

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
    
    const bairroTag = bairro.replace(/\s+/g, '');
    const cityTag = data.city.replace(/\s+/g, '');
    const typeTag = data.type.replace(/\s+/g, '');
    
    // Profile-based tags
    const profileTags = ["#luxo", "#moderno", "#oportunidade", "#investimento", "#design", "#conforto"];

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
      `#imobiliaria #corretor #imoveis #${bairroTag} #${cityTag} #${typeTag} ${profileTags.join(' ')}`
    ];

    setCaption(lines.join('\n'));
    setIsGeneratingCaption(false);
  };

  const handleDownloadCarousel = async () => {
    if (!data) return;

    setIsRenderingCarousel(true);
    setRenderProgress(0);
    setStatusMessage('Iniciando motor...');
    const zip = new JSZip();

    try {
      // 1. Pre-load all assets to memory (Base64) to avoid race conditions
      setStatusMessage('Preparando fotos (0/8)...');
      const loaded: Record<number, string> = {};
      
      for (let i = 0; i < 8; i++) {
        setStatusMessage(`Baixando foto ${i + 1} de 8...`);
        let rawUrl = "";
        if (i === 0) rawUrl = data.images[0].url; // Capa
        else if (i === 7) rawUrl = data.images[0].url; 
        else rawUrl = data.images[i]?.url || data.images[0].url;

        const imgUrl = cleanImageUrl(rawUrl);

        // Use proxy to get a clean blob
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Falha ao baixar imagem ${i + 1}`);
        const blob = await response.blob();
        
        // Convert to Base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        loaded[i] = base64;
        setRenderProgress(Math.round(((i + 1) / 16) * 100)); // First half is pre-load
      }
      
      setPreloadedImages(loaded);
      setStatusMessage('Ativos em memória. Iniciando captura...');
      await document.fonts.ready;

      // Sequential capture: 1 to 8
      for (let i = 0; i < 8; i++) {
        setRenderProgress(50 + Math.round((i / 8) * 50)); // Second half is capture
        setStatusMessage(`Capturando slide ${i + 1}...`);
        
        // 1. Set the active slide to render
        setActiveCaptureIndex(i);
        
        // 2. Wait for React to render and browser to paint
        // Use double frame wait + extra settle time
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const element = document.getElementById('capture-target');
        if (!element) continue;

        // 3. Capture with High Fidelity
        const blob = await htmlToImage.toBlob(element, { 
          quality: 1,
          pixelRatio: 4, // Ultra-High Quality (4320x5400)
          cacheBust: true,
          style: {
            transform: 'scale(1)',
            imageRendering: 'high-quality',
          }
        });
        
        if (blob) {
          zip.file(`post-${i + 1}.jpg`, blob);
        }
      }

      setStatusMessage('Finalizando ZIP...');
      setRenderProgress(100);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${data.id}-instagram-elite.zip`);
    } catch (err) {
      console.error('Carousel generation failed', err);
      alert('Houve um erro técnico. Tente fechar outras abas para liberar memória.');
    } finally {
      setIsRenderingCarousel(false);
      setRenderProgress(0);
      setActiveCaptureIndex(null);
      setPreloadedImages({});
      setStatusMessage('');
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                <span>{loading ? "Processando..." : "Explorar Agora"}</span>
              </button>
            </form>
            {error && (
              <AnimatePresence>
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 md:mt-6 text-red-500 text-[10px] md:text-xs font-black tracking-widest uppercase text-center"
                >
                  {error}
                </motion.p>
              </AnimatePresence>
            )}
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
                          rel="noopener noreferrer"
                          className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 h-16 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all"
                        >
                          Ver no QA <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { label: 'Metragem', value: `${data.area}m²`, icon: Maximize2 },
                        { label: 'Dormitórios', value: data.bedrooms, icon: Bed },
                        { label: 'Banheiros', value: data.bathrooms, icon: Bath },
                        { label: 'Vagas', value: data.parking, icon: Car },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] space-y-4 hover:border-blue-500/30 transition-all group">
                          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <stat.icon className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Description & Gallery */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                       <div className="lg:col-span-12 space-y-12">
                          {/* Description with Expand */}
                          <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                            <h3 className="text-xl font-black uppercase tracking-tighter mb-8 italic flex items-center gap-3">
                              <Info className="w-5 h-5 text-blue-500" /> Descrição do Imóvel
                            </h3>
                            <div className="relative">
                              <p className={cn(
                                "text-white/50 text-base leading-relaxed whitespace-pre-wrap transition-all duration-700",
                                !isDescExpanded && "max-h-[150px] overflow-hidden"
                              )}>
                                {data.description}
                              </p>
                              {!isDescExpanded && (
                                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none" />
                              )}
                            </div>
                            <button 
                             onClick={() => setIsDescExpanded(!isDescExpanded)}
                             className="mt-8 text-blue-500 text-[10px] font-black underline uppercase tracking-widest hover:text-white transition-colors"
                            >
                              {isDescExpanded ? "Ler Menos" : "Ler Descrição Completa"}
                            </button>
                          </div>

                          {/* Unit Amenities with Expand */}
                          <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                             <h3 className="text-xl font-black uppercase tracking-tighter mb-8 italic flex items-center gap-3">
                               <CheckCircle2 className="w-5 h-5 text-blue-500" /> Itens do Imóvel
                             </h3>
                             <div className={cn(
                               "relative transition-all duration-700 overflow-hidden",
                               isUnitExpanded ? "max-h-[2000px]" : "max-h-[200px]"
                             )}>
                                <div className="flex flex-wrap gap-3 pb-10">
                                  {data.unitAmenities?.length > 0 ? data.unitAmenities.map((item, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-white/40 transition-all hover:bg-blue-500/10 hover:border-blue-500/30">
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

                          {/* Building Amenities with Expand */}
                          <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                             <h3 className="text-xl font-black uppercase tracking-tighter mb-8 italic flex items-center gap-3">
                               <ShieldCheck className="w-5 h-5 text-blue-500" /> Do Condomínio
                             </h3>
                             <div className={cn(
                               "relative transition-all duration-700 overflow-hidden",
                               isBuildingExpanded ? "max-h-[2000px]" : "max-h-[200px]"
                             )}>
                                <div className="flex flex-wrap gap-3 pb-10">
                                  {data.buildingAmenities?.length > 0 ? data.buildingAmenities.map((item, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-white/40 transition-all hover:bg-blue-500/10 hover:border-blue-500/30">
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

                        {/* Carousel Generator & Preview */}
                        <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-700">
                           <div className="space-y-6">
                              <div className="flex justify-between items-start">
                                <div className="w-16 h-16 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                                   <Instagram className="w-8 h-8 text-pink-500" />
                                </div>
                                <div className="flex gap-2">
                                  {ELITE_GRADIENTS.map((g, idx) => (
                                    <button 
                                      key={g.name}
                                      onClick={() => setGradientIndex(idx)}
                                      className={cn(
                                        "w-6 h-6 rounded-full border border-white/20 transition-all shadow-lg",
                                        gradientIndex === idx ? "scale-125 border-white ring-2 ring-blue-500/50" : "opacity-40 hover:opacity-100",
                                        g.from.replace('from-', 'bg-')
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              <h4 className="text-2xl font-black tracking-tighter uppercase italic">Imagens do Carrossel</h4>
                              
                              <div className="relative aspect-[4/5] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                {/* REAL-TIME CAPTURE PORTAL (Hidden from view but visible to engine) */}
                                <div className="fixed -left-[2000px] top-0 pointer-events-none origin-top-left">
                                  {data && activeCaptureIndex !== null && (
                                    <div id="capture-target" className="bg-black">
                                       <InstagramSlide theme={ELITE_GRADIENTS[gradientIndex]} watermark="brunofernandes.corporativo">
                                          {activeCaptureIndex === 0 ? (
                                            <div className="h-full flex flex-col justify-between">
                                              {/* Background Photo with High-End Blend */}
                                              <div className="absolute inset-0 z-0">
                                                <img 
                                                  src={preloadedImages[0]} 
                                                  className="w-full h-full object-cover brightness-[0.75] contrast-[1.1]" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                              </div>

                                              {/* Content Overlays */}
                                              <div className="relative z-10 flex flex-col h-full justify-between py-10 px-4">
                                                <div className="flex flex-col gap-4">
                                                  <div className="inline-flex self-start px-8 py-3 bg-blue-600/90 text-white font-black uppercase tracking-[0.4em] text-3xl italic shadow-2xl">
                                                    {data.prices.isForSale ? "Oportunidade" : "Aluguel VIP"}
                                                  </div>
                                                  <p className="text-4xl font-black uppercase tracking-[0.3em] text-white/60 italic drop-shadow-lg" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                    {data.address.split(',').pop()?.trim() || data.city}
                                                  </p>
                                                </div>

                                                <div className="flex flex-col gap-12">
                                                  <div className="space-y-4">
                                                    <h1 className="text-[120px] font-[900] uppercase italic leading-[0.85] tracking-tighter drop-shadow-[0_20px_60px_rgba(0,0,0,1)] text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                      {data.title.split(' ').slice(0, 1).join(' ')}<br />
                                                      <span className={ELITE_GRADIENTS[gradientIndex].accent}>{data.title.split(' ').slice(1, 4).join(' ')}</span><br />
                                                      <span className="text-white/90">{data.title.split(' ').slice(4, 10).join(' ')}</span>
                                                    </h1>
                                                  </div>

                                                  <div className="w-full bg-white/5 backdrop-blur-[40px] border border-white/10 p-16 space-y-12 shadow-2xl">
                                                    <div className="flex justify-between items-center text-5xl font-black uppercase italic text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                      <div className="flex flex-col items-center gap-3">
                                                        <Maximize2 className="w-12 h-12 text-white/40" />
                                                        <span>{data.area}m²</span>
                                                      </div>
                                                      <div className="w-[2px] h-20 bg-white/10" />
                                                      <div className="flex flex-col items-center gap-3">
                                                        <Bed className="w-12 h-12 text-white/40" />
                                                        <span>{data.bedrooms} Qts</span>
                                                      </div>
                                                      <div className="w-[2px] h-20 bg-white/10" />
                                                      <div className="flex flex-col items-center gap-3">
                                                        <Car className="w-12 h-12 text-white/40" />
                                                        <span>{data.parking} Vagas</span>
                                                      </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-8 pt-4">
                                                      <div className="h-1 flex-1 bg-white/10 rounded-full" />
                                                      <p className="text-[105px] font-black italic tracking-tighter leading-none text-white drop-shadow-2xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                        {data.prices.isForSale ? formatCurrency(data.prices.salePrice) : formatCurrency(data.prices.rent)}
                                                      </p>
                                                      <div className="h-1 flex-1 bg-white/10 rounded-full" />
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ) : activeCaptureIndex === 7 ? (
                                            <div className="h-full flex flex-col justify-center items-center text-center space-y-32 relative z-10 px-10">
                                              <div className="w-64 h-64 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden group">
                                                <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-tr", ELITE_GRADIENTS[gradientIndex].from, ELITE_GRADIENTS[gradientIndex].to)} />
                                                <Building2 className={cn("w-32 h-32 relative z-10", ELITE_GRADIENTS[gradientIndex].accent)} />
                                              </div>
                                              
                                              <div className="space-y-12">
                                                <h2 className="text-[110px] font-black uppercase italic leading-[0.85] tracking-tighter drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                  Gostou deste<br /> <span className={ELITE_GRADIENTS[gradientIndex].accent}>Imóvel?</span>
                                                </h2>
                                                <p className="text-6xl text-white/60 font-medium uppercase tracking-[0.2em] leading-relaxed max-w-4xl mx-auto">
                                                  Toque no botão abaixo e fale direto comigo no WhatsApp!
                                                </p>
                                              </div>

                                              <div className="space-y-16 w-full">
                                                 <div className="bg-white text-black px-24 py-14 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center justify-center gap-10 hover:scale-105 transition-transform">
                                                   <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                                                     <Instagram className="w-10 h-10 text-white" />
                                                   </div>
                                                   <span className="text-8xl font-black uppercase tracking-tighter" style={{ fontFamily: "'Montserrat', sans-serif" }}>WhatsApp</span>
                                                 </div>
                                                 
                                                 <p className="text-[110px] font-black italic tracking-tighter text-white/90 bg-white/5 border border-white/10 px-12 py-4 rounded-3xl inline-block" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                                   31 97336 2545
                                                 </p>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="h-full relative px-10 py-10 flex flex-col justify-end">
                                               {/* Full Bleed Image */}
                                               <div className="absolute inset-0 z-0">
                                                  <img 
                                                    src={preloadedImages[activeCaptureIndex]} 
                                                    className="w-full h-full object-cover brightness-[0.85] contrast-[1.05]" 
                                                  />
                                                  <div className="absolute inset-0 shadow-[inset_0_0_500px_rgba(0,0,0,0.6)]" />
                                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                               </div>
                                               
                                               {/* Elegant Minimal Info Overlay */}
                                               <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-10">
                                                  <div className="flex flex-col gap-2">
                                                    <span className="text-2xl font-black uppercase tracking-[0.5em] text-white/40 italic">Exclusividade</span>
                                                    <span className="text-5xl font-black uppercase italic tracking-tighter text-white">
                                                      {data.city} • <span className={ELITE_GRADIENTS[gradientIndex].accent}>{data.address.split(',').pop()?.trim()}</span>
                                                    </span>
                                                  </div>
                                                  <div className="px-10 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-4xl font-black italic">
                                                    {activeCaptureIndex + 1} / 8
                                                  </div>
                                               </div>
                                            </div>
                                          )}
                                       </InstagramSlide>
                                    </div>
                                  )}
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center scale-[0.22] origin-center -translate-y-[280px]">
                                   {/* STATIC PREVIEW FOR USER ONLY */}
                                   <div className="flex flex-col gap-40 opacity-50 grayscale pointer-events-none">
                                      <InstagramSlide theme={ELITE_GRADIENTS[gradientIndex]} watermark="brunofernandes.corporativo">
                                         <div className="h-full flex flex-col justify-center items-center text-center">
                                           <h1 className="text-[140px] font-black italic uppercase">Preview</h1>
                                         </div>
                                      </InstagramSlide>
                                   </div>
                                </div>
                                
                                <AnimatePresence>
                                  {isRenderingCarousel && (
                                    <motion.div 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-10 z-50 text-center"
                                    >
                                      <div className="relative mb-10">
                                        <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">
                                          {renderProgress}%
                                        </div>
                                      </div>
                                      <h5 className="text-xl font-black uppercase italic tracking-tighter mb-4">Exportando Motor Elite</h5>
                                      <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden max-w-[240px] mb-8">
                                        <motion.div 
                                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                                          animate={{ width: `${renderProgress}%` }}
                                        />
                                      </div>
                                      <div className="flex flex-col items-center gap-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 animate-pulse">
                                          {statusMessage}
                                        </p>
                                        <p className="text-[10px] font-medium text-white/30 max-w-[200px] leading-relaxed">
                                          Não feche a página durante o processamento.
                                        </p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest text-center mt-4">
                                Design dinâmico inspirado em campanhas de alta conversão.
                              </p>
                           </div>
                           
                           <button 
                            onClick={handleDownloadCarousel}
                            disabled={isRenderingCarousel}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white px-8 py-6 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-blue-600/20 mt-6"
                           >
                              {isRenderingCarousel ? "Preparando..." : "Baixar Carrossel (ZIP)"}
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
