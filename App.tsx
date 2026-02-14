import React, { useState, useRef, useEffect } from 'react';
import { Bear } from './components/Bear';
import { CloudBackground } from './components/CloudBackground';
import { Flower } from './components/Flower';
import { identifyObject, setAgentifyAuthKey } from './services/agentifyService';
import { speakText, warmUp } from './services/speechService';
import { AppState } from './types';

// 拼图：只存前缀，完整 AuthKey 由用户输入的密码解码得到（不写入源码）
// 密码可为 Base64 短码（如 yCfXeF0tRoudkT+Foj5/TQ）或 32 位 hex，解码/归一化后与前缀比对
const AUTH_KEY_PREFIX = 'c827d7';
const GATE_STORAGE_KEY = 'wakuwaku_gate';

/** 输入为 32 位 hex 则返回，为 Base64 则解码为 hex。格式不对返回 null */
function normalizePasswordToAuthKey(input: string): string | null {
  const s = input.trim();
  if (s.length === 32 && /^[0-9a-fA-F]+$/.test(s)) return s.toLowerCase();
  if (s.length >= 22 && s.length <= 24) {
    try {
      let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const binary = atob(b64);
      let hex = '';
      for (let i = 0; i < binary.length; i++) {
        hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
      }
      return hex.length === 32 ? hex : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** 仅用前缀校验，不暴露完整 key；通过则传入的 key 即为拼图后的 AuthKey */
function isKeyPrefixMatch(hex: string): boolean {
  return hex.length === 32 && hex.startsWith(AUTH_KEY_PREFIX);
}

// Icons（ボタン内でレスポンシブに縮小）
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-12 sm:w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [gateError, setGateError] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [isTalking, setIsTalking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(GATE_STORAGE_KEY);
      if (stored && isKeyPrefixMatch(stored)) {
        setAgentifyAuthKey(stored);
        setUnlocked(true);
      }
    } catch {}
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');
    const key = normalizePasswordToAuthKey(passwordInput);
    if (!key || !isKeyPrefixMatch(key)) {
      setGateError('パスワードがちがいます');
      return;
    }
    setAgentifyAuthKey(key);
    // iOS Safari: 最初のユーザー操作内で speechSynthesis をウォームアップ
    warmUp();
    try {
      sessionStorage.setItem(GATE_STORAGE_KEY, key);
    } catch {}
    setUnlocked(true);
  };

  // Handle File Upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAppState(AppState.IMAGE_SELECTED);
        setResultText('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Logic: Image -> Green Button -> Analysis
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setAppState(AppState.ANALYZING);
    try {
      // Determine MIME type (approximate)
      const mimeType = selectedImage.substring(5, selectedImage.indexOf(';'));
      const text = await identifyObject(selectedImage, mimeType);
      
      setResultText(text);
      setAppState(AppState.RESULT_SHOWN);
      
      // Auto-speak result when ready? Or wait for blue button? 
      // The prompt says "Click blue button to play sound". 
      // But let's say "Yay!" or something.
    } catch (error) {
      setAppState(AppState.ERROR);
      const msg =
        error instanceof Error && error.message === 'AGENT_NO_IMAGE'
          ? 'ごめんね、がぞうが みえなかった'
          : 'ごめんね、わからない';
      setResultText(msg);
    }
  };

  const handleSpeak = () => {
    if (!resultText) return;
    // iOS Safari: タップイベント内で warmUp + speak を同期的に呼ぶ
    warmUp();
    speakText(resultText);
    setIsTalking(true);
    setTimeout(() => setIsTalking(false), 2000);
  };

  const resetApp = () => {
    setSelectedImage(null);
    setResultText('');
    setAppState(AppState.IDLE);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Determine Bear Expression
  const getBearExpression = () => {
    if (isTalking) return 'talking';
    if (appState === AppState.ANALYZING) return 'thinking';
    if (appState === AppState.RESULT_SHOWN) return 'happy';
    return 'waiting';
  };

  if (!unlocked) {
    return (
      <div className="relative min-h-screen min-h-[100dvh] w-full max-w-[100vw] bg-gradient-to-b from-sky-200 to-green-100 flex flex-col items-center justify-center p-4 overflow-x-hidden">
        <CloudBackground />
        <div className="relative z-10 w-full max-w-[min(24rem,90vw)] bg-white rounded-3xl shadow-xl border-4 border-orange-200 p-4 sm:p-6 box-border">
          <h2 className="text-xl font-bold text-orange-500 text-center mb-4">パスワードをいれてね</h2>
          <form onSubmit={handleUnlock} className="flex flex-col gap-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="パスワード"
              className="w-full px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none text-lg"
              autoFocus
            />
            {gateError && <p className="text-red-500 text-sm text-center">{gateError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-green-500 text-white font-bold text-lg hover:bg-green-600 active:scale-[0.98] active:bg-green-700 transition-transform duration-100"
            >
              はいる
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full max-w-[100vw] bg-gradient-to-b from-sky-200 to-green-100 flex flex-col items-center p-3 sm:p-4 pb-32 overflow-x-hidden overflow-y-auto">
      <CloudBackground />

      {/* Header / Prompt Bubble */}
      <header className="mt-2 sm:mt-4 mb-4 sm:mb-6 w-full max-w-[min(48rem,100%)] relative z-10 flex flex-col items-center flex-shrink-0">
        <div className="bg-white rounded-full px-3 sm:px-6 py-3 shadow-lg flex items-center gap-2 sm:gap-4 w-full max-w-full border-4 border-white animate-bounce-slow min-w-0">
           <div className="flex-shrink-0">
             <Bear expression={getBearExpression()} />
           </div>
           <div className="flex-1 flex justify-center items-center min-w-0 overflow-hidden">
             <h1 className="text-base sm:text-2xl md:text-3xl font-bold text-orange-500 tracking-wider text-center break-words">
               {appState === AppState.IDLE && "がぞうを アップロード！"}
               {appState === AppState.IMAGE_SELECTED && "みどりのボタンをおしてね"}
               {appState === AppState.ANALYZING && "かんがえちゅう..."}
               {appState === AppState.RESULT_SHOWN && "これ なーんだ？"}
               {appState === AppState.ERROR && "もういちど やってみて"}
             </h1>
           </div>
        </div>
      </header>

      {/* Main Interactive Area */}
      <main className="flex-1 w-full max-w-[min(48rem,100%)] flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 z-10 flex-shrink-0 min-h-0">
        
        {/* 1. Image Uploader Card */}
        <div 
          className="relative group cursor-pointer flex-shrink-0 max-w-[85vw]"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={`
            w-52 h-64 sm:w-64 sm:h-80 max-w-full bg-white rounded-2xl sm:rounded-3xl border-4 border-dashed border-orange-300 shadow-xl 
            flex flex-col items-center justify-center p-3 transition-all duration-300 box-border
            ${!selectedImage ? 'hover:scale-[1.02] hover:border-orange-400' : ''}
          `}>
            {selectedImage ? (
              <img 
                src={selectedImage} 
                alt="Uploaded" 
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl min-w-0 min-h-0"
              />
            ) : (
              <>
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-orange-400 rounded-full flex items-center justify-center mb-2 sm:mb-4 flex-shrink-0">
                  <CameraIcon />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-orange-500">おしてね</span>
              </>
            )}
            
            {/* Reset Button (Tiny) */}
            {selectedImage && appState !== AppState.ANALYZING && (
              <button 
                onClick={(e) => { e.stopPropagation(); resetApp(); }}
                className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-md border border-orange-200 hover:bg-orange-50 active:scale-90 transition-transform duration-100"
              >
                <RefreshIcon />
              </button>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* 2. Result Display */}
        <div className="w-52 h-64 sm:w-64 sm:h-80 max-w-[85vw] bg-white rounded-2xl sm:rounded-3xl shadow-xl flex flex-col items-center justify-center p-4 sm:p-6 text-center transform transition-all duration-500 flex-shrink-0 box-border">
          {appState === AppState.RESULT_SHOWN ? (
             <div className="animate-pop-in w-full min-w-0 overflow-hidden">
               <span className="text-3xl sm:text-5xl font-extrabold text-slate-800 break-words leading-tight block overflow-hidden text-ellipsis">
                 {resultText}
               </span>
             </div>
          ) : (
            <div className="flex flex-col items-center opacity-50">
              <span className="text-6xl sm:text-9xl font-bold text-slate-800 mb-1 sm:mb-2">?</span>
              <span className="text-base sm:text-xl font-bold text-green-600">
                {appState === AppState.ANALYZING ? "かんがえちゅう..." : "なにかな？"}
              </span>
            </div>
          )}
        </div>

        {/* 3. Action Buttons */}
        <div className="flex md:flex-col gap-3 sm:gap-4 flex-shrink-0">
          
          {/* Blue Button: Sound（押下感 + 再生中は少し凹んだまま） */}
          <button 
            onClick={handleSpeak}
            disabled={appState !== AppState.RESULT_SHOWN}
            className={`
              w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl shadow-lg flex items-center justify-center flex-shrink-0
              transition-transform duration-100 ease-out
              active:scale-95 active:shadow-md
              ${isTalking ? 'scale-95 shadow-md' : ''}
              ${appState === AppState.RESULT_SHOWN 
                ? 'bg-sky-400 hover:bg-sky-500 hover:scale-105 cursor-pointer shadow-sky-200 active:bg-sky-600' 
                : 'bg-gray-300 cursor-not-allowed opacity-50'}
            `}
          >
            <SpeakerIcon />
          </button>

          {/* Green Button: Analyze */}
          <button 
            onClick={handleAnalyze}
            disabled={!selectedImage || appState === AppState.ANALYZING || appState === AppState.RESULT_SHOWN}
            className={`
              w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl shadow-lg flex items-center justify-center flex-shrink-0
              transition-transform duration-100 ease-out
              active:scale-95 active:shadow-md
              ${(!selectedImage || appState === AppState.ANALYZING || appState === AppState.RESULT_SHOWN)
                ? 'bg-gray-300 cursor-not-allowed opacity-50'
                : 'bg-green-500 hover:bg-green-600 hover:scale-105 cursor-pointer shadow-green-200 animate-pulse active:bg-green-700'}
            `}
          >
             {appState === AppState.ANALYZING ? (
               <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
             ) : (
               <CheckIcon />
             )}
          </button>
        </div>

      </main>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-32 z-0 pointer-events-none translate-y-6">
         {/* Green Hills SVG */}
         <svg viewBox="0 0 1440 320" className="w-full h-full preserve-3d" preserveAspectRatio="none">
            <path fill="#86efac" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,160C1248,139,1344,150,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            <path fill="#4ade80" fillOpacity="0.6" d="M0,288L60,272C120,256,240,224,360,213.3C480,203,600,213,720,229.3C840,245,960,267,1080,261.3C1200,256,1320,224,1380,208L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
         </svg>
         
         {/* SVG Animated Flowers */}
         <div className="absolute bottom-4 left-10">
           <Flower type="daisy" className="w-16 h-16" delay="0s" />
         </div>
         <div className="absolute bottom-10 left-1/4">
           <Flower type="sakura" className="w-14 h-14" delay="1.5s" />
         </div>
         <div className="absolute bottom-6 right-20">
           <Flower type="tulip" className="w-16 h-16" delay="0.5s" />
         </div>
         <div className="absolute bottom-8 right-1/3">
            <Flower type="daisy" className="w-12 h-12" delay="2.5s" />
         </div>
         <div className="absolute bottom-2 left-1/2">
            <Flower type="tulip" className="w-10 h-10" delay="1s" />
         </div>
      </div>
    </div>
  );
}