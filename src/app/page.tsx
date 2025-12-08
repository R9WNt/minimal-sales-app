'use client';

import React , { useState, useEffect } from 'react';
import { 
  ShoppingCart, MessageSquare, 
  Lock, Upload, Sparkles, Clock, 
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

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
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
        inset-0 z-100
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
              Enter your mobile number to view personalized offers.
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
                rounded-xl py-4 px-4 text-center
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
              py-4 rounded-xl flex items-center
              justify-center gap-2 transition-all
              ${welcomeMessage ? 'bg-green-500 text-white scale-105' : 'bg-slate-900 text-white hover:scale-[1.02]'}`}>
                {isIdentifying ? 'Checking...' : 'Thrift'}
                {!isIdentifying && <ArrowRight className="w-4 h-4"/>}
              </button>
            </form>
            {/*
            <p 
            className="text-xs
            text-center text-slate-400
            mt-6">Session Access
            </p>
            */}
          </div>
        </div>
      )}

      {/* ======================================================================================
      ========================================================================================== */}

      {/* 2. THE APP CONTAINER (Mobile Optimized Frame) This represents the box drawn in my sketch */}
      <main 
      className={`relative 
      w-full max-w-[400px] h-[85vh] 
      bg-white shadow-2xl rounded-3xl 
      overflow-hidden border-4 
      border-slate-200 ring-1 
      ring-slate-900/5 flex flex-col
      transition-all duration-500
      ${!user.isAuthenticated ? 'blur-sm scale-95' : ''}`}>

        {/* --- ZONE A: GENDER SPLIT (Top 1/3) ---*/}
        <div 
        className="h-[35%]
        w-full flex border-b
        border-slate-200">
          {/* WOMEN */}
          <button
          onClick={() => setActiveCategory('women')}
          className={`flex-1 flex flex-col
          items-center justify-center gap-2
          border-r border-slate-100
          ${activeCategory === 'women' ? 'bg-rose-50' : 'bg-white'}`}>
            <div 
            className="w-14
            h-14 roounded-full bg-rose-100
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
            className="w-14 h-14 rounded-full
            bg-sky-100 flex items-center
            justify-center text-sky-500
            group-hover:scale-110
            transition-transform">
              <svg 
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round">
              <path d="M16 3h5v5"/>
              <path d="M21 3L13.5 10.5"/>
              <path d="M15.5 13.5a6.5 6.5 
              0 1 1-9.1-9.1 6.5 6.5 0 0 1 9.1 9.1z" /></svg>

            </div>
            <span 
            className="font-bold text-slate-700
            tracking-widest text-sm">MEN</span>
          </button>
        </div>
        
        {/* --- ZONE B: ESSENTIALS BAR --- */}
        <div
        onClick={() => setActiveCategory('essential')}
        className="w-full h-14
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
        p-6 pb-24
        bg-slate-50">
          {/* LOYALTY SECTION (Coupon Upload) */}
          <div 
          className="mb-6">
            <div 
            className={`relative 
            w-full h-14 rounded-xl 
            border-2 border-dashed
            flex items-center justify-between 
            px-4 transition-all 
            ${isCouponLocked ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-whit border-indigo-300 cursor-pointer hover:border-indigo-500'}`}>
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
          {/* PRODUCT FEED*/}
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id} 
                className="h-24
                bg-white rounded-xl shadow-sm border
                border-slate-100 flex items-center
                p-3 gap-4">
                  <div 
                  className="w-16 h-16 
                  bg-slate-100 rounded-lg 
                  shrink-0 overflow-hidden 
                  relative border border-slate-100">
                    <div 
                    className="absolute inset-0 flex
                    items-center justify-center text-[10px]
                    text-slate-300 
                    font-bold">
                    </div>
                  </div>
                  <div 
                  className="flex-1">
                    <h3 
                    className="font-bold text-slate-700
                    text-sm">{product.name}</h3>
                    <span 
                    className="text-[10px] font-mono 
                    bg-slate-100 text-slate-500 px-1.5 
                    py-0.5 rounded">{product.item_code}
                    </span>
                    <p 
                    className="text-slate-500 text-[10px]
                    mt-1">Sizes: {product.sizes.join(',')}
                    </p>
                    <p 
                    className="font-bold text-slate-900
                    mt-1">${product.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* --- ZONE D: BOTTOM FLOATING ELEMENTS --- */}

        {/* 1. SESSION TIMER (Bottom Left) */}
        <div 
        className="absolute 
        top-6 left-6 z-50">
          <div 
          className="bg-white/95 backdrop-blur border 
          border-slate-200 rounded-lg shadow-lg
          flex flex-col items-start justify-center
          px-5 py-4 min-w-160px max-w-210px">
            <div 
            className="flex items-center gap-2 mb-2">
              <Clock 
              className="w-4 h-4
              text-slate-700/70" />
              <span className="text-lg font-mono font-semibold text-slate-700/70 tracking-wide">
                {formatTime(sessionTime)}
              </span>
            </div>
            <div 
            className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-700/70" />
              <span className="text-base font-mono text-slate-700/60 font-normal opacity-90">
                {user.phone ? user.phone : '—'}
              </span>
            </div>
          </div>
        </div>
        {/* 2. TOOLS (Bottom Right) */}
        <div 
        className="absolute bottom-6 
        right-6 z-50 flex flex-col
        items-end gap-3">
          {/* Locked WhatsApp */}
          <button 
          disabled ={isWhatsAppLocked}
          className={`flex
          items-center justify-center 
          w-12 h-12 rounded-full shadow-xl transition-all
          ${isWhatsAppLocked ? 'bg-gray-200 grayscale cursor-not-allowed' : 'bg-green-500 text-white'}`}
          >
            <MessageSquare 
            className="w-5 h-5
            text-current" />
          </button>

          {/* Shopping List */}
          <button 
          className="flex
          items-center justify-center w-14 h-14
          rounded-full bg-slate-900 text-white
          shadow-2xl">
            <ShoppingCart 
            className="w-6 h-6" />
          </button>
        </div>

      </main>
    </div>
  );
}