'use client';

import React , { useState, useEffect } from 'react';
import { DraggableSessionBox } from "@/components/ui/DraggableSessionBox";
import FAQWidget from "@/components/ui/FAQWidget";
import Overlay from "@/components/ui/Overlay"; 
import { FAQTab } from "@/components/ui/FAQTab";
import ListenWidget from "@/components/ui/ListenWidget";
import tellStyles from "@/components/ui/TellUsCTA.module.css";
import { 
  ShoppingCart, Smartphone, 
  ArrowRight
} from 'lucide-react';

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

  // --- LOCAL LOYALTY/RECEIPTS STATE (UI-only; persisted later to DB) ---
  const [uploading, setUploading] = useState(false);
  const [uploadCode, setUploadCode] = useState('');

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

    //Small delay to let the user read the message before the modal vanishes
    setTimeout(() => {
      // Update State with real DB Data
      setUser({
        phone: phoneInput,
        receiptsCount: 0,
        isAuthenticated: true,
      });
      // reset local receipts for this demo session
      setIsIdentifying(false);
      setUploadCode('');
    }, 500);
  };

  // --- LOGIC GATES ---
  const isCouponLocked = user.receiptsCount < 5;

  // --- FAQTab ---
  const [showFAQ, setShowFAQ] = useState(false);

  // --- We Listen Ear ---
  const [showListen, setShowListen] = useState(false);
  
  // --- Loyalty: handle a coupon upload (UI only) ---
  const handleUploadCoupon = async () => {
    if (!uploadCode) return;
    setUploading(true);
    // simulate upload / verification delay
    await new Promise((r) => setTimeout(r, 700));
    // create a simple receipt id
    setUser((prev) => ({ ...prev, receiptsCount: prev.receiptsCount + 1 }));
    setUploadCode('');
    setUploading(false);
  };

  const progressPercent = Math.min(100, Math.round((user.receiptsCount / 5) * 100));

  return (
    
    // 1. THE PERSPECTIVE BACKGROUND (The "Desk" or "Distance" view)
    <div 
    className="min-h-screen w-full 
    bg-slate-100 flex items-center 
    justify-center p-1.4">
      
      {/* ======================================================================================
      ========================================================================================== */}

      {/* IDENTIFICATION OVERLAY (The "Gatekeeper") */}

      {!user.isAuthenticated && (
        <div 
        className="absolute
        inset-0 z-backdrop
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

        {/* --- ZONE A: CATEGORY SPLIT (Top 1/3) — three equal segments --- */}
        <div className="h-[35%] w-full grid grid-cols-3">
          {/* WOMEN */}
          <button
            onClick={() => setActiveCategory('women')}
            className={`flex flex-col items-center justify-center gap-2 border-r border-slate-100
              ${activeCategory === 'women' ? 'bg-rose-50' : 'bg-white'}`}
            aria-pressed={activeCategory === 'women'}
            aria-label="Show women category"
          >
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 transition-transform">
              {/* icon */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12" />
                <path d="M12 15v7" />
                <path d="M9 19h6" />
              </svg>
            </div>
            <span className="font-bold text-slate-700 tracking-widest text-sm">WOMEN</span>
          </button>

          {/* ESSENTIALS */}
          <button
            onClick={() => setActiveCategory('essential')}
            className={`flex flex-col items-center justify-center gap-2 border-r border-slate-100
              ${activeCategory === 'essential' ? 'bg-slate-50' : 'bg-white'}`}
            aria-pressed={activeCategory === 'essential'}
            aria-label="Show essentials category"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 transition-transform">
              {/* sparkles icon */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2l1 4 4 1-4 1-1 4-1-4-4-1 4-1z" />
              </svg>
            </div>
            <span className="font-bold text-slate-700 tracking-widest text-sm">ESSENTIALS</span>
          </button>

          {/* MEN */}
          <button
            onClick={() => setActiveCategory('men')}
            className={`flex flex-col items-center justify-center gap-2
              ${activeCategory === 'men' ? 'bg-sky-50' : 'bg-white'}`}
            aria-pressed={activeCategory === 'men'}
            aria-label="Show men category"
          >
            <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-500 transition-transform">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d="M16 3h5v5" />
                <path d="M21 3L13.5 10.5" />
                <path d="M15.5 13.5a6.5 6.5 0 1 1-9.1-9.1 6.5 6.5 0 0 1 9.1 9.1z" />
              </svg>
            </div>
            <span className="font-bold text-slate-700 tracking-widest text-sm">MEN</span>
          </button>
        </div>

        {/* --- ZONE B: COUPON / LOYALTY (SLIM / FIT-WIDTH) --- */}
        <div className="flex-1 overflow-y-auto py-4 px-4 pb-24 bg-slate-50">
          <div className="mx-auto w-full max-w-[320px]">
            
            {/* Section: Header */}
            <section aria-labelledby="loyalty-heading" className="mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-emerald-500 rounded" aria-hidden="true" />
                <h3 id="loyalty-heading" className="text-sm font-semibold text-slate-700">Loyalty & Coupons</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">Upload receipts to earn loyalty points and unlock messaging.</p>
            </section>

            {/* Section: Progress card (demarcated) */}
            <section
              role="region"
              aria-labelledby="progress-heading"
              className="bg-white rounded-lg shadow-sm p-3 mb-3 border border-transparent"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <div id="progress-heading" className="text-[11px] text-slate-500">Progress</div>
                  <div className="font-bold text-base text-slate-800">{user.receiptsCount} / 5</div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Status</div>
                  <div className={`font-semibold ${user.receiptsCount >= 5 ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {user.receiptsCount >= 5 ? 'Unlocked' : 'Locked'}
                  </div>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                Earn 5 receipts to unlock special offers and notifications.
              </div>
            </section>

            {/* Divider */}
            <div className="my-2 border-t border-slate-100" />

            {/* Section: Coupon upload (demarcated row with accent) */}
            <section role="region" aria-labelledby="upload-heading" className="mb-3">
              <div className="flex items-start gap-3">
                <div className="w-0.5 bg-slate-200 rounded h-full mt-1" aria-hidden="true" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div id="upload-heading" className={`text-xs font-bold uppercase tracking-wide ${isCouponLocked ? 'text-gray-400' : 'text-slate-600'}`}>
                        {isCouponLocked ? `Locked (${user.receiptsCount}/5)` : 'Upload Coupon'}
                      </div>
                      <div className="text-[11px] text-slate-500">Upload receipt code to claim credit</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        value={uploadCode}
                        onChange={(e) => setUploadCode(e.target.value)}
                        placeholder="Receipt code"
                        className="text-sm px-2 py-1 border rounded bg-slate-50 border-slate-200 w-36 max-w-[140px]"
                        disabled={isCouponLocked}
                        aria-label="Receipt code"
                      />
                      <button
                        onClick={handleUploadCoupon}
                        disabled={isCouponLocked || uploading || !uploadCode}
                        className={`text-sm px-3 py-1 rounded ${isCouponLocked ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white'}`}
                      >
                        {uploading ? 'Uploading...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Small helper line vs previous receipts history */}
            <div className="text-[11px] text-slate-400 mb-2 text-center">
              Submitting a valid receipt increases your loyalty count.
            </div>
          </div>
        </div>

        {/* --- ZONE C: BOTTOM FLOATING ELEMENTS --- */}
        
        {/* 1. TOOLS (Bottom Right) */}
        <div className="absolute bottom-6 right-6 z-fab flex flex-col items-end gap-3">
          {/* Shopping List */}
          <button
            className="flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-full"
            aria-label="Open shopping list"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>

        {/* --- BOTTOM: FAQ bar + large 'tell us' button below it --- */}
          <div className="w-full px-0 mx-0 mt-2">
            <div className="flex flex-col items-center gap-0">
              {/* FAQ bar — make it end-to-end wide (container has no horizontal padding) */}
              <div className="w-full">
                <FAQTab onClick={() => setShowFAQ((s) => !s)} placeAt="bottom" />
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
          </div>
        </main>

      {/* FAQ modal */}
      {showFAQ && <FAQWidget open={showFAQ} onClose={() => setShowFAQ(false)} />}
        
      {/* Listen modal*/}
      {showListen && (
        <Overlay
          open={showListen}
          onClose={() => setShowListen(false)}
          backdropClickCloses={true}
          panelClassName="w-full max-w-[420px] p-4 mx-4"
        >
          <ListenWidget onClose={() => setShowListen(false)} />
        </Overlay>
      )}  
    </div>
  );
}