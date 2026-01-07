
import React, { useState, useRef, useEffect } from 'react';
import { Step, DirectorState, DynamicOption, CommercialClip } from './types';
import { getDynamicOptions, generateDirectorScript } from './geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.PRODUCT_INPUT);
  const [state, setState] = useState<DirectorState>({
    productName: '',
    niche: '',
    selectedStyle: '',
    selectedAudience: '',
    selectedTone: '',
    clips: []
  });
  const [options, setOptions] = useState<DynamicOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Speed optimization: Immediate scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("فائل کا سائز 4MB سے کم ہونا چاہیے۔");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setBase64Image(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.productName.trim() && !base64Image) {
        setError("براہ کرم کوئی نام لکھیں یا تصویر اپلوڈ کریں۔");
        return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const fetchedOptions = await getDynamicOptions(state.productName || "Visual Context", 'styles', base64Image);
      setOptions(fetchedOptions);
      setStep(Step.STYLE_SELECTION);
    } catch (err) {
      setError("رابطہ سست ہے یا غلطی پیش آئی۔ دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
    }
  };

  const handleSelection = async (selection: string, currentStep: Step) => {
    setLoading(true);
    setError(null);
    try {
      if (currentStep === Step.STYLE_SELECTION) {
        setState(prev => ({ ...prev, selectedStyle: selection }));
        const fetched = await getDynamicOptions(state.productName || "Visual Context", 'audience', base64Image);
        setOptions(fetched);
        setStep(Step.AUDIENCE_SELECTION);
      } else if (currentStep === Step.AUDIENCE_SELECTION) {
        setState(prev => ({ ...prev, selectedAudience: selection }));
        const fetched = await getDynamicOptions(state.productName || "Visual Context", 'tone', base64Image);
        setOptions(fetched);
        setStep(Step.VO_TONE_SELECTION);
      } else if (currentStep === Step.VO_TONE_SELECTION) {
        setState(prev => ({ ...prev, selectedTone: selection }));
        setStep(Step.GENERATING);
        const script = await generateDirectorScript(
          state.productName || "Visual Context",
          state.selectedStyle,
          state.selectedAudience,
          selection,
          base64Image
        );
        setState(prev => ({ ...prev, clips: script }));
        setStep(Step.RESULT);
      }
    } catch (err) {
      setError("براہ کرم دوبارہ کوشش کریں، سرور جواب نہیں دے رہا۔");
      setTimeout(() => setStep(Step.PRODUCT_INPUT), 1500);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(Step.PRODUCT_INPUT);
    setState({
      productName: '',
      niche: '',
      selectedStyle: '',
      selectedAudience: '',
      selectedTone: '',
      clips: []
    });
    setOptions([]);
    setBase64Image(undefined);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    const btn = document.getElementById('copy-indicator');
    if (btn) {
      btn.innerText = `${label} Copied!`;
      btn.classList.remove('opacity-0');
      setTimeout(() => btn.classList.add('opacity-0'), 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 sm:px-6 lg:px-12 relative">
      <div id="copy-indicator" className="fixed top-10 right-10 z-[100] bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest opacity-0 transition-opacity pointer-events-none shadow-2xl">
        Copied!
      </div>

      <header className="fixed top-0 left-0 w-full p-4 sm:p-8 flex flex-col sm:flex-row justify-between items-center z-50 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">C</div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase">
            CGI DIRECTOR <span className="text-blue-500 font-light">PRO</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-900/50 p-2 rounded-full border border-white/5 backdrop-blur-md">
            {[1,2,3,4,6].map((s) => (
                <div 
                    key={s} 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${step >= s ? 'bg-blue-500 scale-125 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-zinc-800'}`}
                />
            ))}
        </div>
      </header>

      <main className="w-full max-w-4xl mt-24 sm:mt-32">
        {error && (
          <div className="mb-8 p-4 bg-red-950/40 border border-red-500/30 text-red-200 rounded-2xl text-sm text-center backdrop-blur-xl animate-bounce">
            {error}
          </div>
        )}

        {step === Step.PRODUCT_INPUT && (
          <div className="page-transition max-w-2xl mx-auto space-y-12">
            <div className="space-y-4 text-center sm:text-left">
              <span className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">Step 01: Protocol Start</span>
              <h2 className="text-5xl sm:text-7xl font-bold text-white tracking-tighter leading-none">
                Define the <br/><span className="text-zinc-600">Blueprint.</span>
              </h2>
              <p className="text-zinc-500 text-sm sm:text-lg">Provide a description or upload an image for visual inspiration.</p>
            </div>
            
            <form onSubmit={handleProductSubmit} className="space-y-8">
              <div className="relative">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Enter idea or product description..."
                    className="w-full bg-transparent border-b border-zinc-800 focus:border-blue-500 outline-none py-6 text-2xl sm:text-4xl text-white transition-all placeholder:text-zinc-900 font-light"
                    value={state.productName}
                    onChange={(e) => setState({ ...state, productName: e.target.value })}
                  />
                  
                  <div className="mt-8 flex flex-col sm:flex-row items-center gap-6">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${base64Image ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span className="text-xs font-bold uppercase tracking-widest">{base64Image ? 'Image Uploaded' : 'Upload Visual Ref'}</span>
                      </button>

                      {base64Image && (
                        <div className="flex items-center gap-4">
                          <img 
                            src={`data:image/jpeg;base64,${base64Image}`} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded-lg border border-white/10"
                          />
                          <button 
                            type="button" 
                            onClick={() => setBase64Image(undefined)}
                            className="text-red-500 text-[10px] font-bold uppercase tracking-widest hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                  </div>
              </div>
              <button 
                type="submit" 
                disabled={loading || (!state.productName && !base64Image)}
                className="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-blue-500 hover:scale-105 active:scale-95 disabled:opacity-30 transition-all shadow-2xl shadow-blue-900/20"
              >
                {loading ? 'Processing...' : 'Proceed to Styles'}
              </button>
            </form>
          </div>
        )}

        {(step === Step.STYLE_SELECTION || step === Step.AUDIENCE_SELECTION || step === Step.VO_TONE_SELECTION) && (
          <div className="page-transition space-y-12">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">
                {step === Step.STYLE_SELECTION ? 'Step 02' : step === Step.AUDIENCE_SELECTION ? 'Step 03' : 'Step 04'}
              </span>
              <h2 className="text-4xl sm:text-6xl font-bold text-white tracking-tight">
                {step === Step.STYLE_SELECTION && "Visual Mood"}
                {step === Step.AUDIENCE_SELECTION && "Target Persona"}
                {step === Step.VO_TONE_SELECTION && "Vocal Profile"}
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {options.map((opt, idx) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelection(opt.label, step)}
                  className="glass group text-left p-8 rounded-3xl hover:bg-white/5 border-white/5 hover:border-blue-500/50 transition-all flex flex-col justify-between h-44 relative overflow-hidden"
                >
                  <span className="text-zinc-800 font-black text-6xl absolute -right-2 -top-4 select-none group-hover:text-blue-500/10 transition-all duration-300">{idx + 1}</span>
                  <div className="relative z-10">
                    <h3 className="text-white font-bold text-xl uppercase tracking-wider group-hover:text-blue-400 transition-colors">{opt.label}</h3>
                    <p className="text-zinc-500 text-[10px] mt-3 uppercase tracking-widest leading-relaxed">{opt.description}</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 text-[10px] font-bold tracking-[0.3em]">
                    SELECT MODULE <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </div>
                </button>
              ))}
            </div>
            {loading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="mt-4 text-[10px] text-blue-400 font-black tracking-[0.5em] uppercase">Loading Directorial AI...</p>
                </div>
            )}
          </div>
        )}

        {step === Step.GENERATING && (
          <div className="page-transition min-h-[50vh] flex flex-col items-center justify-center space-y-8">
            <div className="relative">
                <div className="w-24 h-24 border-2 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-blue-500 font-black text-xs">CGI</div>
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Finalizing Sequence</h2>
              <p className="text-zinc-600 font-mono text-[10px] tracking-widest animate-pulse">OPTIMIZING MALE VOCALS | STRUCTURING JSON BLOCKS</p>
            </div>
          </div>
        )}

        {step === Step.RESULT && (
          <div className="page-transition space-y-24 pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-zinc-900 pb-12">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px]">Master Blueprint Generated</span>
                </div>
                <h2 className="text-5xl font-bold text-white tracking-tighter">{state.productName || "Generated Campaign"}</h2>
                <div className="flex flex-wrap gap-4 mt-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase font-bold text-zinc-500 tracking-widest">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656L17 13"></path></svg>
                        {state.selectedStyle}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase font-bold text-zinc-500 tracking-widest">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                        {state.selectedTone}
                    </div>
                </div>
              </div>
              <button onClick={reset} className="group flex items-center gap-2 px-8 py-4 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300">
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                New Campaign
              </button>
            </div>

            <div className="grid gap-32">
              {state.clips.map((clip) => (
                <div key={clip.clipNumber} className="relative space-y-12">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black uppercase tracking-[0.5em] text-blue-500">Sequence: Clip {clip.clipNumber} / {state.clips.length}</span>
                    <span className="h-[1px] flex-grow bg-zinc-900"></span>
                    <span className="text-[10px] font-mono text-zinc-700 bg-zinc-900/50 px-3 py-1 rounded">SEED: {clip.globalSeed}</span>
                  </div>

                  <div className="grid lg:grid-cols-1 gap-12">
                    {/* Technical Prompt Block */}
                    <div className="glass p-8 rounded-[40px] border-white/5 bg-zinc-950/40 relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-8">
                            <label className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-black">Technical_Prompt (CGI DIRECTION)</label>
                            <button 
                                onClick={() => copyToClipboard(clip.visualDescription, "Visual Prompt")}
                                className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-blue-600 hover:border-blue-500 transition-all text-white text-[10px] font-bold uppercase tracking-widest group/btn"
                            >
                                <svg className="w-4 h-4 group-hover/btn:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                Copy Prompt
                            </button>
                        </div>
                        <pre className="text-zinc-200 leading-relaxed text-xl font-light whitespace-pre-wrap font-mono bg-black/50 p-8 rounded-3xl border border-white/5 selection:bg-blue-500/30">
                          {clip.visualDescription}
                        </pre>
                        <div className="mt-8 flex justify-between items-center px-4">
                             <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest bg-zinc-900 px-4 py-2 rounded-full">Transition: {clip.transition}</span>
                             <span className="text-[9px] font-black text-blue-900 uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">{clip.durationSeconds} SEC</span>
                        </div>
                    </div>

                    {/* Graphics and VO Blocks */}
                    <div className="grid sm:grid-cols-2 gap-8">
                        <div className="glass p-10 rounded-[32px] border-blue-500/10 hover:border-blue-500/40 transition-all cursor-pointer group" onClick={() => copyToClipboard(clip.visualTextEnglish, "Graphics Text")}>
                            <div className="flex justify-between items-center mb-8">
                                <label className="text-[10px] uppercase tracking-[0.4em] text-blue-500 font-black">On-Screen Graphics</label>
                                <svg className="w-5 h-5 text-zinc-700 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                            </div>
                            <div className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">{clip.visualTextEnglish}</div>
                        </div>

                        <div className="glass p-10 rounded-[32px] border-amber-500/10 text-right hover:border-amber-500/40 transition-all cursor-pointer group" onClick={() => copyToClipboard(clip.voScriptUrdu, "Urdu Script")}>
                            <div className="flex justify-between items-center mb-8 text-left">
                                <label className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-black">Urdu VO Script</label>
                                <svg className="w-5 h-5 text-zinc-700 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                            </div>
                            <div className="urdu-text text-5xl text-white drop-shadow-md">{clip.voScriptUrdu}</div>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-12 text-center text-[9px] uppercase tracking-[1em] text-zinc-900 font-black border-t border-zinc-900/50 w-full max-w-6xl">
        CGI DIRECTOR PRO &bull; AUTONOMOUS CORE &bull; V4.1.0
      </footer>
    </div>
  );
};

export default App;
