'use client';

import React , { useState, useEffect } from 'react';
import { DraggableSessionBox } from "@/components/ui/DraggableSessionBox";
import { FAQTab } from "@/components/ui/FAQTab";
import ListenWidget from "@/components/ui/ListenWidget";
import tellStyles from "@/components/ui/TellUsCTA.module.css";
import { 
  ShoppingCart, MessageSquare, 
  Lock, Upload, Sparkles, 
  Smartphone, ArrowRight
} from 'lucide-react';


interface Product {
  id: number;
  item_code: string;
  name: string;
  price: string;
  sizes: string[];
  image_url: string | null;
}

interface UserSession {
  phone: string | null;
  receiptsCount: number;
  isAuthenticated: boolean;
}

export default function 
CustomerWorkspace() {

  // --- STATE: SESSION & USER ---
  const [sessionTime, setSessionTime] = useState(0);
  const [user, setUser] = useState<UserSession>({
    phone: null,
    receiptsCount: 0,
    isAuthenticated: false,
  });

  // --- STATE: DATA & INPUTS ---
  const [phoneInput, setPhoneInput] = useState('');
  const [isIdentifying, setIsIdentifying] = useState(false);

  const [activeCategory, setActiveCategory] = useState('essential');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- SESSION TIMER (Starts only after auth) ---
  useEffect(() => {
    if (!user.isAuthenticated) return;
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [user.isAuthenticated]);

  // --- TRACK WELCOME MESSAGE ---
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // --- IDENTIFICATION HANDLER ---
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    //if (!phoneInput) return;

    setIsIdentifying(true);
    /*
    try {
      // Call our new API
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();

      if (data.isNewUser) {
        setWelcomeMessage('Welcome, yumyum!');
      } else {
        setWelcomeMessage(`Welcome back! yumyum, (${data.receipts} Loyalty Points)`);
      }*/

      //Small delay to let the user read the message before the modal vanishes
      setTimeout(() => {
        // Update State with real DB Data
        setUser({
          phone: phoneInput,
          receiptsCount: 0, //data.receipts,
          isAuthenticated: true,
        });
      }, 500);
    /*
    } catch (error) {
      alert("System Error: Could not verify phone number.");
    } finally {
      setIsIdentifying(false);
    }
    */
  };

  // --- PRODUCT FETCHING ---
  useEffect(() => {
    if (!user.isAuthenticated) return;
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?category=${activeCategory}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : Array.isArray(data.products) ? data.products : []);
      } catch (error) {
        console.error('Failed to load items', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [activeCategory, user.isAuthenticated]);

  // --- LOGIC GATES ---
  const isCouponLocked = user.receiptsCount < 5;
  const isWhatsAppLocked = true;

  // --- FAQTab ---
  const [showFAQ, setShowFAQ] = useState(false);

  // --- We Listen Ear ---
  const [showListen, setShowListen] = useState(false);
  
  return (
    
    // 1. THE PERSPECTIVE BACKGROUND (The "Desk" or "Distance" view)
    <div 
    className="min-h-screen w-full 
    bg-slate-100 flex items-center 
    justify-center p-4">
      
      {/* ======================================================================================
      ========================================================================================== */}

      {/* IDENTIFICATION OVERLAY (The "Gatekeeper") */}

      {!user.isAuthenticated && (
        <div 
        className="absolute
        inset-0 z-50
        bg-slate-200/60
        backdrop-blur-sm
        flex items-center
        justify-center p-4">
          <div 
          className="w-full
          max-w-sm bg-white rounded-2xl
          shadow-2xl p-8">
            <div 
            className="flex
            justify-center mb-6">
              <div 
              className="w-16 
              h-16 bg-slate-100 rounded-full
              flex items-center justify-center">
                <Smartphone 
                className="w-8 h-8 text-slate-700" />
              </div>
            </div>

            <h2 
            className="text-2xl font-bold text-center text-slate-700
            mb-2">Welcome, ...</h2>
            <p 
            className="text-slate-500 text-center text-sm mb-6">
              Please, enter your mobile number to interact with Easy Thrift Queen
            </p>
            <form 
            onSubmit={handleIdentify} 
            className="space-y-4">
              <div 
              className="relative">
                <input 
                type="tel"
                placeholder="000-000-0000"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full
                bg-slate-50 border border-slate-200
                py-4 px-4 text-center text-slate-900
                text-lg font-bold tracking-widest
                focus:outline-none focus:ring-2
                focus:ring-slate-900
                focus:border-transparent
                transition-all" 
                autoFocus/>
              </div>
              <button 
              type="submit"
              disabled={isIdentifying}
              className={`w-full font-bold
              py-4 flex items-center
              justify-center gap-2 transition-all
              ${welcomeMessage ? 'bg-green-500 text-white scale-105' : 'bg-slate-900 text-white hover:scale-[1.02]'}`}>
                {isIdentifying ? 'Checking...' : 'Thrift'}
                {!isIdentifying && <ArrowRight className="w-4 h-4"/>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================================
      ========================================================================================== */}

      {/* 2. THE APP CONTAINER (Mobile Optimized Frame) This represents the box drawn in my sketch */}
      <main 
      className={`relative 
      w-full max-w-[350px] h-screen 
      bg-white overflow-visible 
      border-slate-200 flex flex-col
      transition-all duration-500
      ${!user.isAuthenticated ? 'blur-sm scale-95' : ''}`}>

        <DraggableSessionBox
        sessionTime={sessionTime}
        userPhone={user.phone ?? ''}
        />

        {/* --- ZONE A: GENDER SPLIT (Top 1/3) ---*/}
        <div 
        className="h-[35%] 
        w-full flex divide-x 
        divide-slate-100">
          {/* WOMEN */}
          <button
          onClick={() => setActiveCategory('women')}
          className={`flex-1 flex flex-col 
          items-center justify-center gap-2 
          ${activeCategory === 'women' ? 'bg-rose-50' : 'bg-white'}`}>
            <div 
            className="w-14
            h-14 rounded-full bg-rose-100
            flex items-center justify-center 
            text-rose-500 group-hover:scale-110
            transition-transform">
              <svg 
              width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke='currentColor'
              strokeWidth="2" strokeLinecap="round" 
              strokeLinejoin="round">
                <path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12"/> 
                <path d="M12 15v7" />
                <path d="M9 19h6"/>
              </svg>
            </div>
            <span 
            className="font-bold text-slate-700
            tracking-widest text-sm">
              WOMEN
            </span>
          </button>

          {/* MEN */}
          <button 
          onClick={() => setActiveCategory('men')}
          className={`flex-1 flex flex-col
          items-center justify-center gap-2
          ${activeCategory === 'men' ? 'bg-sky-50' : 'bg-white'}`}>
            <div 
            className="w-14
            h-14 rounded-full bg-sky-100 
            flex items-center justify-center 
            text-sky-500 group-hover:scale-110
            transition-transform">
              <svg 
              width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinejoin="round">
              <path d="M16 3h5v5"/>
              <path d="M21 3L13.5 10.5"/>
              <path d="M15.5 13.5a6.5 6.5 
              0 1 1-9.1-9.1 6.5 6.5 0 0 1 9.1 9.1z" /></svg>

            </div>
            <span 
            className="font-bold text-slate-700
            tracking-widest text-sm">
              MEN
            </span>
          </button>
        </div>
        
        {/* --- ZONE B: ESSENTIALS BAR --- */}
        <div
        onClick={() => setActiveCategory('essential')}
        className="w-full h-20
        bg-slate-900 flex items-center
        justify-between px-6 shadow-md 
        z-10 cursor-pointer hover:bg-slate-800
        transition-colors">
          <div 
          className="flex
          items-center gap-2">
            <Sparkles 
            className="w-4
            h-4 text-yellow-400 fill-current" />
            <span 
            className="text-white font-bold
            tracking-widest uppercase
            text-sm">Essentials
            </span>
          </div>
          <span 
          className="text-slate-400
          text-xs">View All &rarr;</span>
        </div>

        {/* --- ZONE C: SCROLLABLE CONTENT --- */}
        <div 
        className="flex-1 
        overflow-y-auto 
        p-6 pb-32
        bg-slate-50">
          {/* LOYALTY SECTION (Coupon Upload) */}
          <div 
          className="mb-6">
            <div
            className={`relative 
            w-full rounded-xl 
            border border-dashed 
            flex items-center justify-between 
            px-4 py-2 transition-all 
            ${isCouponLocked ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-white border-indigo-300 cursor-pointer hover:border-indigo-500'}`}>
              <div 
              className="flex
              items-center gap-3">
                <div 
                className={`
                  p-1.5 rounded-full 
                  ${isCouponLocked ? 'bg-gray-200' : 'bg-indigo-100'}`}>
                  {isCouponLocked ? <Lock 
                  className="w-4 h-4 text-gray-400" /> : <Upload 
                  className="w-4 h-4 text-indigo-500" />}
                </div>
                <span 
                className={`text-xs font-bold 
                uppercase tracking-wide
                ${isCouponLocked ? 'text-gray-400' : 'text-slate-600'}`}>
                  {isCouponLocked ? `Locked (${user.receiptsCount}/5)` : 'Upload Coupon'}
                </span>
              </div>
            </div>
          </div>
          {/* PRODUCT FEED — use divide-y for consistent thin separators */}
          <div className="divide-y divide-slate-100">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white flex items-center gap-4 py-3 px-3"
              >
                <div
                  className="w-16 h-16 bg-slate-100 rounded-lg shrink-0 overflow-hidden relative border border-slate-100"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-300 font-bold"></div>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-slate-700 text-sm">{product.name}</h3>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    {product.item_code}
                  </span>
                  <p className="text-slate-500 text-[10px] mt-1">Sizes: {product.sizes.join(',')}</p>
                  <p className="font-bold text-slate-900 mt-1">${product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- ZONE D: BOTTOM FLOATING ELEMENTS --- */}
        
        {/* 1. TOOLS (Bottom Right) */}
        <div 
        className="absolute bottom-6 
        right-6 z-fab 
        flex flex-col 
        items-end gap-3">
          {/* Locked WhatsApp */}
          <button 
          disabled ={isWhatsAppLocked}
          className={`flex
          items-center justify-center 
          w-12 h-12 rounded-full transition-all
          ${isWhatsAppLocked ? 'bg-gray-200 grayscale cursor-not-allowed' : 'bg-green-500 text-white'}`}
          >
            <MessageSquare 
            className="w-5 h-5
            text-current" />
          </button>

          {/* Shopping List */}
          <button 
          className="flex
          items-center justify-center w-12 h-12
          bg-slate-900 text-white">
            <ShoppingCart 
            className="w-5 h-5" />
          </button>
        </div>

        {/* --- BOTTOM: FAQ bar + large 'tell us' button below it --- */}
          <div className="w-full px-0 mx-0 mt-2">
            <div className="flex flex-col items-center gap-0">
              {/* FAQ bar — make it end-to-end wide (container has no horizontal padding) */}
              <div className="w-full">
                <FAQTab onClick={() => setShowFAQ(true)} placeAt="bottom" />
              </div>

              {/* TellUs flat clickable area directly below FAQTab — end-to-end full width */}
              <div className={tellStyles.container}>
                <button
                  type="button"
                  onClick={() => setShowListen(true)}
                  aria-label="Tell us what you want"
                  className={tellStyles.flatTellButton}
                >
                  <span className={tellStyles.ctaLine1}>Didn&#39;t find what you want?</span>
                  <span className={tellStyles.ctaLine2}>Why don&#39;t you tell us here ...</span>
                </button>
              </div>
            </div>


            {/* FAQ modal */}
            {showFAQ && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white p-6 w-full max-w-lg relative">
                  <button onClick={() => setShowFAQ(false)} className="absolute top-4 right-4 text-xl" aria-label="close">×</button>
                  <h2 className="text-lg font-semibold mb-3">Frequently Asked Questions</h2>
                  <p className="text-sm text-slate-700">Your FAQ content here...</p>
                </div>
              </div>
            )}
          </div>
        </main>
      {/* Listen modal (opens on ear button) */}
      {showListen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[420px]">
            <ListenWidget onClose={() => setShowListen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}