
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
    selectedLanguage: '',
    clips: []
  });
  const [options, setOptions] = useState<DynamicOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Starting...');
  const [error, setError] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | undefined>(undefined);
  const [customLanguage, setCustomLanguage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    if (loading) {
      const messages = [
        "Thinking about your idea...",
        "Finding the best style...",
        "Creating your script...",
        "Setting up cameras...",
        "Almost ready..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingMsg(messages[i % messages.length]);
        i++;
      }, 1800);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBase64Image((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.productName.trim() && !base64Image) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedOptions = await getDynamicOptions(state.productName || "Product", 'styles', base64Image);
      setOptions(fetchedOptions);
      setStep(Step.STYLE_SELECTION);
    } catch (err) {
      setError("Something went wrong. Please try again.");
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
        const fetched = await getDynamicOptions(state.productName || "Product", 'audience', base64Image);
        setOptions(fetched);
        setStep(Step.AUDIENCE_SELECTION);
      } else if (currentStep === Step.AUDIENCE_SELECTION) {
        setState(prev => ({ ...prev, selectedAudience: selection }));
        const fetched = await getDynamicOptions(state.productName || "Product", 'tone', base64Image);
        setOptions(fetched);
        setStep(Step.VO_TONE_SELECTION);
      } else if (currentStep === Step.VO_TONE_SELECTION) {
        setState(prev => ({ ...prev, selectedTone: selection }));
        setStep(Step.VO_LANGUAGE_SELECTION);
      }
    } catch (err) {
      setError("Network error. Let's try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSubmit = async (lang: string) => {
    setLoading(true);
    setError(null);
    try {
      setState(prev => ({ ...prev, selectedLanguage: lang }));
      setStep(Step.GENERATING);
      const script = await generateDirectorScript(
        state.productName || "Product", 
        state.selectedStyle, 
        state.selectedAudience, 
        state.selectedTone,
        lang,
        base64Image
      );
      setState(prev => ({ ...prev, clips: script }));
      setStep(Step.RESULT);
    } catch (err) {
      setError("Script generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyMasterPrompt = (clip: CommercialClip) => {
    const master = `SCENE: ${clip.clipNumber}\nSEED: ${clip.globalSeed}\nVISUAL: ${clip.visualDescription}\nTEXT ON SCREEN: ${clip.visualTextEnglish}\nVO SCRIPT: ${clip.voScriptUrdu}`;
    navigator.clipboard.writeText(master);
    const btn = document.getElementById('copy-indicator');
    if (btn) {
      btn.classList.remove('opacity-0');
      setTimeout(() => btn.classList.add('opacity-0'), 1500);
    }
  };

  const reset = () => {
    setStep(Step.PRODUCT_INPUT);
    setState({ productName: '', niche: '', selectedStyle: '', selectedAudience: '', selectedTone: '', selectedLanguage: '', clips: [] });
    setOptions([]);
    setBase64Image(undefined);
    setCustomLanguage('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10 relative">
      <div id="copy-indicator" className="fixed top-8 right-8 z-[100] bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-xl opacity-0 transition-all pointer-events-none">
        COPIED!
      </div>

      {loading && (
        <div className="fixed inset-0 bg-[#0a0a0c]/90 z-[200] flex flex-col items-center justify-center p-6 backdrop-blur-xl">
            <div className="relative w-40 h-40 mb-10">
                <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-[40px] overflow-hidden bg-white/5">
                    <div className="scanner-line"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
            <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Director is working...</h3>
                <p className="text-indigo-400 font-medium">{loadingMsg}</p>
            </div>
        </div>
      )}

      <header className="fixed top-0 left-0 w-full px-8 py-5 flex justify-between items-center z-50 glass">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center font-bold shadow-lg shadow-indigo-500/30 text-white">D</div>
          <h1 className="text-lg font-extrabold tracking-tight text-white">Director <span className="text-indigo-500">Pro</span></h1>
        </div>
        <div className="flex gap-2">
          {[1,2,3,4,5,6].map(s => <div key={s} className={`w-2 h-2 rounded-full transition-all duration-500 ${step >= s ? 'bg-indigo-500 scale-125' : 'bg-white/10'}`} />)}
        </div>
      </header>

      <main className="w-full max-w-4xl mt-24">
        {error && <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 text-red-200 rounded-3xl text-sm text-center">Oops! {error}</div>}

        {step === Step.PRODUCT_INPUT && (
          <div className="page-transition space-y-12 py-10">
            <div className="space-y-4">
              <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Step 1 of 5</span>
              <h2 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight">What's your <span className="text-indigo-500">Idea?</span></h2>
              <p className="text-gray-400 text-lg">Tell me what you're selling or your video script.</p>
            </div>
            <form onSubmit={handleProductSubmit} className="space-y-10">
              <textarea
                autoFocus
                rows={3}
                className="w-full bg-transparent border-b border-white/10 focus:border-indigo-500 outline-none py-4 text-2xl sm:text-4xl text-white transition-all placeholder:text-white/10 font-medium resize-none"
                placeholder="Type here..."
                value={state.productName}
                onChange={e => setState({...state, productName: e.target.value})}
              />
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto text-sm font-bold bg-white/5 border border-white/10 px-8 py-4 rounded-3xl hover:bg-white/10 transition-all text-gray-300 flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 012-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {base64Image ? 'Photo Added!' : 'Add a Photo'}
                </button>
                <button type="submit" disabled={loading || (!state.productName && !base64Image)} className="w-full sm:w-auto bg-indigo-600 text-white text-sm font-bold px-12 py-4 rounded-3xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-30">
                  {loading ? 'Working...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {(step === Step.STYLE_SELECTION || step === Step.AUDIENCE_SELECTION || step === Step.VO_TONE_SELECTION) && (
          <div className="page-transition space-y-12 py-10">
            <div className="space-y-4">
              <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">
                Step {step === Step.STYLE_SELECTION ? '2' : step === Step.AUDIENCE_SELECTION ? '3' : '4'} of 5
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white">
                {step === Step.STYLE_SELECTION ? 'Pick a Style' : step === Step.AUDIENCE_SELECTION ? 'Who is it for?' : 'Voice Tone'}
              </h2>
              <p className="text-gray-400">Our AI suggests the highlighted one.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {options.map((opt) => (
                <button 
                  key={opt.id} 
                  onClick={() => handleSelection(opt.label, step)} 
                  className={`glass card-hover text-left p-8 rounded-[32px] transition-all relative overflow-hidden group ${opt.isRecommended ? 'ring-2 ring-indigo-500 bg-indigo-500/5' : ''}`}
                >
                  {opt.isRecommended && (
                    <div className="absolute top-4 right-6 flex items-center gap-2 bg-indigo-600 px-3 py-1 rounded-full shadow-lg">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      <span className="text-[9px] font-black text-white uppercase tracking-wider">Suggested</span>
                    </div>
                  )}
                  <div className="relative z-10 space-y-3">
                    <h3 className={`text-xl font-extrabold ${opt.isRecommended ? 'text-indigo-300' : 'text-white'}`}>{opt.label}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{opt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === Step.VO_LANGUAGE_SELECTION && (
          <div className="page-transition space-y-12 py-10">
            <div className="space-y-4">
              <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Step 5 of 5</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white">Voiceover Script</h2>
              <p className="text-gray-400">Which language should the AI use for the speech?</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {['English', 'Urdu', 'Roman Urdu'].map((lang) => (
                <button 
                  key={lang} 
                  onClick={() => handleLanguageSubmit(lang)} 
                  className="glass card-hover text-left p-8 rounded-[32px] transition-all relative overflow-hidden group"
                >
                  <h3 className="text-xl font-extrabold text-white">{lang}</h3>
                </button>
              ))}
              <div className="glass p-8 rounded-[32px] transition-all relative overflow-hidden group flex flex-col gap-4">
                <h3 className="text-xl font-extrabold text-white">Others</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type language..." 
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none flex-grow"
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                  />
                  <button 
                    onClick={() => customLanguage && handleLanguageSubmit(customLanguage)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === Step.GENERATING && (
          <div className="page-transition min-h-[50vh] flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-2 border-zinc-900 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_20px_rgba(79,70,229,0.3)]" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Compiling Production Code</h3>
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Integrating visuals and voice phonetics</p>
            </div>
          </div>
        )}

        {step === Step.RESULT && (
          <div className="page-transition space-y-16 py-10 pb-40">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 border-b border-white/5 pb-12">
              <div className="space-y-4">
                <h2 className="text-5xl font-extrabold text-white tracking-tight">Your Video Plan</h2>
                <div className="flex flex-wrap gap-2">
                  {[state.selectedStyle, state.selectedAudience, state.selectedTone, state.selectedLanguage].map(tag => (
                    <span key={tag} className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-[11px] font-bold text-gray-300 uppercase">{tag}</span>
                  ))}
                </div>
              </div>
              <button onClick={reset} className="w-full sm:w-auto text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-3xl border border-white/10 transition-all">Start Over</button>
            </div>

            <div className="space-y-24">
              {state.clips.map(clip => (
                <div key={clip.clipNumber} className="relative">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Scene {clip.clipNumber}</span>
                    <div className="h-[1px] flex-grow bg-white/5" />
                    <button 
                      onClick={() => copyMasterPrompt(clip)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 uppercase"
                    >
                      Copy Scene Data
                    </button>
                  </div>

                  <div className="grid gap-8">
                    <div className="glass p-10 rounded-[40px] bg-white/5 border-white/5 relative overflow-hidden group">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-6">CGI Scene Description</label>
                      <p className="text-white text-lg sm:text-2xl font-medium leading-relaxed">
                        {clip.visualDescription}
                      </p>
                      <div className="mt-8 flex flex-wrap gap-6 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                        <span>Seed: {clip.globalSeed}</span>
                        <span>Transition: {clip.transition}</span>
                        <span className="ml-auto text-gray-600">{clip.durationSeconds} Seconds</span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="glass p-10 rounded-[40px] border-white/5">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-4">On Screen Text</label>
                        <div className="text-3xl font-extrabold text-white italic">{clip.visualTextEnglish}</div>
                      </div>
                      <div className="glass p-10 rounded-[40px] border-white/5 text-right">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-4 text-left">Voiceover Script</label>
                        <div className={`text-4xl text-white ${state.selectedLanguage.toLowerCase().includes('urdu') ? 'urdu-text' : ''}`}>
                          {clip.voScriptUrdu}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-12 text-[10px] font-bold text-white/20 uppercase tracking-[1em]">Director Pro</footer>
    </div>
  );
};

export default App;
