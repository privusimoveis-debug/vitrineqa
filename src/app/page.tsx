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
  Download, X, Check, Grid, LogOut
} from 'lucide-react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
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
// Brand palette — 5 sophisticated tones
const ELITE_GRADIENTS = [
  { name: 'Charcoal',  hex: '#222426', from: 'from-[#222426]', via: 'via-[#111213]', to: 'to-black', accent: 'text-[#C1B49D]', glass: 'bg-white/5 border-white/10' },
  { name: 'Steel',     hex: '#3A4B54', from: 'from-[#3A4B54]', via: 'via-[#1d262b]', to: 'to-black', accent: 'text-[#C1B49D]', glass: 'bg-white/5 border-white/10' },
  { name: 'Sage',      hex: '#6B705C', from: 'from-[#6B705C]', via: 'via-[#35382e]', to: 'to-black', accent: 'text-[#C1B49D]', glass: 'bg-white/5 border-white/10' },
  { name: 'Copper',    hex: '#B87333', from: 'from-[#B87333]', via: 'via-[#5c3919]', to: 'to-black', accent: 'text-[#C1B49D]', glass: 'bg-white/5 border-white/10' },
  { name: 'Linen',     hex: '#C1B49D', from: 'from-[#C1B49D]', via: 'via-[#60594e]', to: 'to-black', accent: 'text-[#B87333]', glass: 'bg-white/5 border-white/10' },
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
    }
  }, [data]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

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

  const handleOneClickGenerate = async () => {
    if (!data || !caption) return;
    // 1. Copy caption to clipboard
    navigator.clipboard.writeText(caption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
    // 2. Small delay to let state update, then trigger download
    await new Promise(r => setTimeout(r, 200));
    handleDownloadCarousel();
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

    // Create a smart summary
    const cleanDesc = data.description.replace(/\r?\n|\r/g, ' ').trim();
    // Get first 2 sentences or first 200 chars ending in space
    let summary = cleanDesc.split(/[.!?]\s/).slice(0, 2).join('. ');
    if (summary.length < 50 && cleanDesc.length > 50) {
      summary = cleanDesc.substring(0, 180).split(' ').slice(0, -1).join(' ') + '...';
    } else if (!summary.endsWith('.')) {
      summary += '.';
    }

    // Add highlights if available
    const highlights = [...data.unitAmenities, ...data.buildingAmenities].slice(0, 4);
    const highlightLine = highlights.length > 0 
      ? `\nDestaques: ${highlights.join(', ')}.`
      : '';

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
      summary + highlightLine,
      "",
      "Agende sua visita e venha conhecer este imóvel incrível. 🚀",
      "",
      `🔑 Ref: ${data.id}`,
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
      setStatusMessage('Preparando fotos (0/10)...');
      const loaded: Record<number, string> = {};
      
      for (let i = 0; i < 10; i++) {
        setStatusMessage(`Baixando foto ${i + 1} de 10...`);
        let rawUrl = "";
        if (i === 0) rawUrl = data.images[0].url; // Capa
        else if (i === 9) rawUrl = data.images[0].url; 
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
      for (let i = 0; i < 10; i++) {
        setRenderProgress(50 + Math.round((i / 10) * 50)); // Second half is capture
        setStatusMessage(`Capturando slide ${i + 1}...`);
        
        // 1. Set the active slide to render
        setActiveCaptureIndex(i);
        
        // 2. Wait for React to render and browser to paint
        // Use double frame wait + extra settle time
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const element = document.getElementById('capture-target');
        if (!element) continue;

        // 3. Capture with High Fidelity
        const dataUrl = await htmlToImage.toPng(element, { 
          pixelRatio: 4,
          cacheBust: true,
          skipAutoScale: true,
          style: {
            transform: 'scale(1)',
          }
        });
        
        if (dataUrl) {
          // Convert data URL to blob for ZIP
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          zip.file(`post-${i + 1}.png`, blob);
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
            <div className="flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="25" y="25" width="462" height="462" rx="100" stroke="#3b82f6" stroke-width="30"/>
                <circle cx="256" cy="256" r="100" stroke="#3b82f6" stroke-width="30"/>
                <circle cx="380" cy="132" r="25" fill="#3b82f6"/>
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">
              Post<span className="text-blue-500">Imobiliário</span>
            </span>
          </div>
          <div className="flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-white/40">
            <button 
              onClick={handleLogout}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 md:px-6 py-2.5 rounded-full text-white transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Sair</span>
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
                          Ver no QuintoAndar <ExternalLink className="w-4 h-4" />
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
                        className="flex flex-col gap-8"
                      >
                        {/* ====== CAROUSEL CARD (Full Width, First) ====== */}
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-10 group hover:border-green-500/30 transition-all duration-700">
                           <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl flex items-center justify-center">
                                     <Instagram className="w-7 h-7 text-pink-500" />
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-black tracking-tighter uppercase italic">Imagens do Carrossel</h4>
                                    <p className="text-xs text-white/40 font-medium">10 slides • Alta resolução PNG</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                  {ELITE_GRADIENTS.map((g, idx) => (
                                    <button 
                                      key={g.name}
                                      onClick={() => setGradientIndex(idx)}
                                      title={g.name}
                                      style={{ backgroundColor: g.hex }}
                                      className={cn(
                                        "w-6 h-6 rounded-full border border-white/20 transition-all shadow-lg",
                                        gradientIndex === idx ? "scale-125 border-white ring-2 ring-white/50" : "opacity-50 hover:opacity-100",
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              {/* ONE-CLICK BUTTON */}
                              <button 
                                onClick={handleOneClickGenerate}
                                disabled={isRenderingCarousel || !caption}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white px-6 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-green-600/20 flex items-center justify-center gap-3"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                {isRenderingCarousel ? "Processando..." : "⚡ Gerar Tudo (Copiar Legenda + Baixar Fotos)"}
                              </button>

                              {/* PROGRESS BAR (visible during and after processing) */}
                              <div className="w-full">
                                {isRenderingCarousel ? (
                                  <div className="space-y-4 py-4">
                                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                                      <span className="text-blue-400 animate-pulse">{statusMessage}</span>
                                      <span className="text-white/60">{renderProgress}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                                      <motion.div 
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                        animate={{ width: `${renderProgress}%` }}
                                        transition={{ duration: 0.3 }}
                                      />
                                    </div>
                                    <p className="text-[10px] text-white/30 font-medium text-center">
                                      Não feche a página durante o processamento.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3 py-3 px-4 bg-white/[0.02] rounded-xl border border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-green-500/60" />
                                    <p className="text-[11px] text-white/30 font-medium">
                                      Pronto para gerar. Clique no botão acima para iniciar o processamento automático.
                                    </p>
                                  </div>
                                )}
                              </div>
                           </div>

                           {/* HIDDEN CAPTURE PORTAL (stays offscreen) */}
                           <div className="fixed -left-[9999px] top-0 pointer-events-none origin-top-left">
                                  {data && activeCaptureIndex !== null && (

                                    <div id="capture-target">

                                      {/* ========== SLIDE 0: CAPA (standalone, no wrapper) ========== */}
                                      {activeCaptureIndex === 0 ? (() => {
                                        const palettes = [
                                          // Charcoal
                                          { ov1:'rgba(34,36,38,0.55)', ov2:'rgba(34,36,38,0.30)', pill:['#C1B49D','#a89e8a'], pillBdr:'#604f3a', pillTxt:'#1a1a1a', infoBg:'#C1B49D', infoTxt:'#1a1518', accent:'#B87333', priceBg:'linear-gradient(135deg,#1a1818,#0d0c0c)', priceBdr:'#B87333', priceTxt:'#C1B49D' },
                                          // Steel
                                          { ov1:'rgba(58,75,84,0.55)', ov2:'rgba(58,75,84,0.30)', pill:['#C1B49D','#a89e8a'], pillBdr:'#2a3840', pillTxt:'#0f1518', infoBg:'#C1B49D', infoTxt:'#1a1518', accent:'#B87333', priceBg:'linear-gradient(135deg,#1d262b,#0d1215)', priceBdr:'#B87333', priceTxt:'#C1B49D' },
                                          // Sage
                                          { ov1:'rgba(107,112,92,0.55)', ov2:'rgba(107,112,92,0.30)', pill:['#C1B49D','#a89e8a'], pillBdr:'#3a3d30', pillTxt:'#111410', infoBg:'#C1B49D', infoTxt:'#111410', accent:'#B87333', priceBg:'linear-gradient(135deg,#292c22,#141610)', priceBdr:'#B87333', priceTxt:'#C1B49D' },
                                          // Copper
                                          { ov1:'rgba(184,115,51,0.55)', ov2:'rgba(184,115,51,0.30)', pill:['#C1B49D','#a89e8a'], pillBdr:'#7a4a1a', pillTxt:'#1a1008', infoBg:'#C1B49D', infoTxt:'#1a1008', accent:'#ffffff', priceBg:'linear-gradient(135deg,#3d2010,#1e1008)', priceBdr:'#C1B49D', priceTxt:'#fff' },
                                          // Linen
                                          { ov1:'rgba(193,180,157,0.50)', ov2:'rgba(193,180,157,0.28)', pill:['#B87333','#9e6020'], pillBdr:'#6e4818', pillTxt:'#fff', infoBg:'#B87333', infoTxt:'#fff', accent:'#222426', priceBg:'linear-gradient(135deg,#3d2e1a,#1a1208)', priceBdr:'#C1B49D', priceTxt:'#fff' },
                                        ];
                                        const c = palettes[gradientIndex % palettes.length];
                                        const hood = data.address.includes(',') ? data.address.split(',').pop()?.trim() || data.city : data.city;
                                        const price = data.prices.isForSale ? formatCurrency(data.prices.salePrice) : formatCurrency(data.prices.rent);
                                        return (
                                          <div style={{ width: '1080px', height: '1350px', position: 'relative', overflow: 'hidden' }}>
                                            <img src={preloadedImages[0]} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(180deg, ${c.ov1} 0%, ${c.ov2} 35%, ${c.ov2} 60%, ${c.ov1} 100%)`, zIndex: 1 }} />
                                            <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '48px', padding: '70px 55px', boxSizing: 'border-box' }}>

                                              {/* PILL BADGE */}
                                              <div style={{ background: `linear-gradient(180deg, ${c.pill[0]}, ${c.pill[1]})`, borderRadius: '100px', padding: '16px 50px', border: `5px solid ${c.pillBdr}`, boxShadow: '0 10px 35px rgba(0,0,0,0.45), inset 0 2px 6px rgba(255,255,255,0.35)' }}>
                                                <span style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: '42px', fontWeight: 900, color: c.pillTxt, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                                  {data.type.toUpperCase()}
                                                </span>
                                              </div>

                                              {/* TITLE */}
                                              <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: '100px', fontWeight: 900, color: '#ffffff', textShadow: '0 6px 35px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)', lineHeight: '0.92', textTransform: 'capitalize' }}>
                                                  {hood}
                                                </div>
                                                <div style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: '100px', fontWeight: 900, color: '#ffffff', textShadow: '0 6px 35px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)', lineHeight: '0.92', textTransform: 'capitalize' }}>
                                                  {data.prices.isForSale ? 'à Venda' : 'para Alugar'}
                                                </div>
                                              </div>

                                              {/* INFO BOX */}
                                              <div style={{ background: c.infoBg, borderRadius: '22px', padding: '22px 30px', border: `4px solid ${c.accent}`, width: '90%', display: 'flex', alignItems: 'center', justifyContent: 'space-around', boxShadow: '0 18px 50px rgba(0,0,0,0.35)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                  <span style={{ fontSize: '32px' }}>📏</span>
                                                  <span style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: '36px', fontWeight: 900, color: c.infoTxt }}>{data.area}m²</span>
                                                </div>
                                                <div style={{ width: '3px', height: '40px', background: 'rgba(0,0,0,0.12)', borderRadius: '3px' }} />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                  <span style={{ fontSize: '32px' }}>🛏</span>
                                                  <span style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: '36px', fontWeight: 900, color: c.infoTxt }}>{data.bedrooms} Quartos</span>
                                                </div>
                                                <div style={{ width: '3px', height: '40px', background: 'rgba(0,0,0,0.12)', borderRadius: '3px' }} />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                  <span style={{ fontSize: '32px' }}>🚗</span>
                                                  <span style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: '36px', fontWeight: 900, color: c.infoTxt }}>{data.parking} {Number(data.parking) === 1 ? 'Vaga' : 'Vagas'}</span>
                                                </div>
                                              </div>

                                              {/* PRICE BOX */}
                                              <div style={{ background: c.priceBg, borderRadius: '22px', padding: '24px 40px', border: `4px solid ${c.priceBdr}`, width: '90%', textAlign: 'center', boxShadow: '0 18px 50px rgba(0,0,0,0.45)' }}>
                                                <span style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: '72px', fontWeight: 900, color: c.priceTxt, letterSpacing: '-0.02em', textShadow: '0 4px 18px rgba(0,0,0,0.4)' }}>
                                                  {price}
                                                </span>
                                              </div>

                                            </div>
                                            {/* Watermark */}
                                            <div style={{ position: 'absolute', bottom: '25px', right: '30px', zIndex: 3, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.45)', padding: '10px 22px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', flexShrink: 0 }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                                brunofernandes.corporativo
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })()

                                      /* ========= SLIDE 7: CTA (standalone) ========= */
                                      : activeCaptureIndex === 9 ? (() => {
                                        const c = [
                                          { bg:'linear-gradient(135deg,#111213,#0a0a0b)', accent:'#C1B49D', txt:'#fff', btnBg:'#B87333', btnTxt:'#fff' },
                                          { bg:'linear-gradient(135deg,#1d262b,#0d1215)', accent:'#C1B49D', txt:'#fff', btnBg:'#B87333', btnTxt:'#fff' },
                                          { bg:'linear-gradient(135deg,#292c22,#141610)', accent:'#C1B49D', txt:'#fff', btnBg:'#B87333', btnTxt:'#fff' },
                                          { bg:'linear-gradient(135deg,#3d2010,#1e1008)', accent:'#C1B49D', txt:'#fff', btnBg:'#B87333', btnTxt:'#fff' },
                                          { bg:'linear-gradient(135deg,#3d2e1a,#1a1208)', accent:'#B87333', txt:'#fff', btnBg:'#C1B49D', btnTxt:'#1a1518' },
                                        ][gradientIndex % 5];
                                        return (
                                          <div style={{ width: '1080px', height: '1350px', position: 'relative', overflow: 'hidden', background: c.bg }}>
                                            <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '70px', padding: '80px 60px', boxSizing: 'border-box', textAlign: 'center' }}>
                                              {/* Title */}
                                              <div>
                                                <div style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: '120px', fontWeight: 900, color: c.txt, textShadow: '0 6px 30px rgba(0,0,0,0.6)', lineHeight: '0.95' }}>
                                                  Gostou deste
                                                </div>
                                                <div style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: '120px', fontWeight: 900, color: c.accent, textShadow: '0 6px 30px rgba(0,0,0,0.6)', lineHeight: '0.95' }}>
                                                  Imóvel?
                                                </div>
                                              </div>
                                              {/* Subtitle */}
                                              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '48px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, maxWidth: '800px', letterSpacing: '0.05em' }}>
                                                Fale direto comigo no WhatsApp e saiba mais!
                                              </p>
                                              {/* WhatsApp Pill — icon + number */}
                                              <div style={{ background: '#25D366', borderRadius: '100px', padding: '36px 70px', display: 'flex', alignItems: 'center', gap: '28px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', maxWidth: '95%' }}>
                                                <svg viewBox="0 0 24 24" fill="#fff" style={{ width: '72px', height: '72px', flexShrink: 0 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                <span style={{ fontFamily: "'Montserrat', 'Arial Black', sans-serif", fontSize: '68px', fontWeight: 900, color: '#fff', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                                                  31 97336 2545
                                                </span>
                                              </div>
                                            </div>
                                            {/* Watermark */}
                                            <div style={{ position: 'absolute', bottom: '25px', right: '30px', zIndex: 3, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.45)', padding: '10px 22px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', flexShrink: 0 }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                                brunofernandes.corporativo
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })()

                                      /* ========= SLIDES 1-8: FRAMED GALLERY ========= */
                                      : (() => {
                                        const framePalettes = [
                                          // Charcoal
                                          { bg: 'linear-gradient(160deg,#111213,#0a0a0b)', border: '#B87333', accent: '#C1B49D', infoTxt: '#e8ddd0', infoBg: 'rgba(34,36,38,0.6)', infoBdr: 'rgba(184,115,51,0.4)' },
                                          // Steel
                                          { bg: 'linear-gradient(160deg,#1d262b,#0d1215)', border: '#B87333', accent: '#C1B49D', infoTxt: '#e8ddd0', infoBg: 'rgba(58,75,84,0.6)', infoBdr: 'rgba(184,115,51,0.4)' },
                                          // Sage
                                          { bg: 'linear-gradient(160deg,#292c22,#141610)', border: '#B87333', accent: '#C1B49D', infoTxt: '#e8ddd0', infoBg: 'rgba(107,112,92,0.5)', infoBdr: 'rgba(184,115,51,0.4)' },
                                          // Copper
                                          { bg: 'linear-gradient(160deg,#3d2010,#1e1008)', border: '#C1B49D', accent: '#fff', infoTxt: '#fff', infoBg: 'rgba(184,115,51,0.35)', infoBdr: 'rgba(193,180,157,0.4)' },
                                          // Linen
                                          { bg: 'linear-gradient(160deg,#3d2e1a,#1a1208)', border: '#B87333', accent: '#C1B49D', infoTxt: '#e8ddd0', infoBg: 'rgba(193,180,157,0.15)', infoBdr: 'rgba(184,115,51,0.4)' },
                                        ];
                                        const fc = framePalettes[gradientIndex % framePalettes.length];
                                        const hood = data.address.includes(',') ? data.address.split(',').pop()?.trim() || data.city : data.city;
                                        return (
                                          <div style={{ width: '1080px', height: '1350px', position: 'relative', overflow: 'hidden', background: fc.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '55px 55px 35px', boxSizing: 'border-box' }}>
                                            {/* TOP: Price tag */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', alignSelf: 'flex-start' }}>
                                              <div style={{ width: '5px', height: '44px', background: fc.border, borderRadius: '4px' }} />
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                                                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '20px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{data.prices.isForSale ? 'Valor de Venda' : 'Valor do Aluguel'}</span>
                                                <span style={{ fontFamily: "'Montserrat','Arial Black',sans-serif", fontSize: '48px', fontWeight: 900, color: fc.accent, letterSpacing: '-0.01em', lineHeight: 1 }}>{data.prices.isForSale ? formatCurrency(data.prices.salePrice) : formatCurrency(data.prices.rent)}</span>
                                              </div>
                                            </div>
                                            {/* MIDDLE: Photo Frame */}
                                            <div style={{ width: '100%', flex: 1, margin: '32px 0', borderRadius: '28px', overflow: 'hidden', border: `6px solid ${fc.border}`, boxShadow: `0 0 55px ${fc.border}55, 0 25px 70px rgba(0,0,0,0.7)`, position: 'relative' }}>
                                              <img src={preloadedImages[activeCaptureIndex]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                              <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 70px rgba(0,0,0,0.3)', borderRadius: '22px' }} />
                                            </div>
                                            {/* BOTTOM: Info Footer */}
                                            <div style={{ width: '100%', background: fc.infoBg, borderRadius: '20px', border: `2px solid ${fc.infoBdr}`, padding: '26px 38px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '20px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Bairro</span>
                                                <span style={{ fontFamily: "'Montserrat','Arial Black',sans-serif", fontSize: '40px', fontWeight: 900, color: fc.accent, letterSpacing: '-0.01em' }}>{hood}</span>
                                              </div>
                                              <div style={{ width: '2px', height: '55px', background: `${fc.border}55`, borderRadius: '2px', flexShrink: 0 }} />
                                              <div style={{ display: 'flex', gap: '36px', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                  <span style={{ fontSize: '32px' }}>📐</span>
                                                  <span style={{ fontFamily: "'Montserrat','Arial Black',sans-serif", fontSize: '30px', fontWeight: 900, color: fc.infoTxt }}>{data.area}m²</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                  <span style={{ fontSize: '32px' }}>🛏</span>
                                                  <span style={{ fontFamily: "'Montserrat','Arial Black',sans-serif", fontSize: '30px', fontWeight: 900, color: fc.infoTxt }}>{data.bedrooms}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                  <span style={{ fontSize: '32px' }}>🚗</span>
                                                  <span style={{ fontFamily: "'Montserrat','Arial Black',sans-serif", fontSize: '30px', fontWeight: 900, color: fc.infoTxt }}>{data.parking}</span>
                                                </div>
                                              </div>
                                            </div>
                                            {/* Watermark */}
                                            <div style={{ position: 'absolute', bottom: '16px', right: '28px', zIndex: 3, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.40)', padding: '8px 18px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px', flexShrink: 0 }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                                              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>brunofernandes.corporativo</span>
                                            </div>
                                          </div>
                                        );
                                      })()}

                                    </div>
                                  )}
                                </div>
                           </div>

                        {/* ====== CAPTION CARD (Full Width, Second) ====== */}
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-10">
                          <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                              <h4 className="text-lg font-black tracking-tighter uppercase italic flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-blue-500" /> Legenda do Post
                              </h4>
                              {caption && (
                                <button 
                                  onClick={handleCopyCaption}
                                  className={cn(
                                    "px-4 py-2 rounded-xl font-bold text-[10px] tracking-widest transition-all flex items-center gap-2 border",
                                    isCopied 
                                      ? "bg-green-500/10 text-green-400 border-green-500/30" 
                                      : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80"
                                  )}
                                >
                                  {isCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                                  {isCopied ? "Copiado!" : "Copiar"}
                                </button>
                              )}
                            </div>

                            <textarea
                              value={caption}
                              onChange={(e) => setCaption(e.target.value)}
                              placeholder="A legenda será gerada automaticamente ao carregar o imóvel..."
                              className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-white/70 text-sm font-medium resize-none focus:outline-none focus:border-blue-500/50 transition-all custom-scrollbar min-h-[200px] md:min-h-[250px]"
                            />
                          </div>
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
             <div className="flex items-center justify-center">
               <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <rect x="25" y="25" width="462" height="462" rx="100" stroke="#3b82f6" stroke-width="30"/>
                 <circle cx="256" cy="256" r="100" stroke="#3b82f6" stroke-width="30"/>
                 <circle cx="380" cy="132" r="25" fill="#3b82f6"/>
               </svg>
             </div>
             <span className="font-black tracking-tighter text-xl uppercase">Post Imobiliário</span>
          </div>
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            <a href="#" className="hover:text-blue-500 transition-colors">Open Source</a>
          </div>
          <p className="text-white/10 text-[10px] font-black uppercase tracking-widest italic">© 2026 Post Imobiliário • Para Corretores de Elite</p>
        </div>
      </footer>
    </div>
  );
}
