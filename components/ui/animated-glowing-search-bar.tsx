import React from 'react';

interface AnimatedGlowingSearchBarProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
    autoFocus?: boolean;
    isLoading?: boolean;
    onStop?: () => void;
    onRun?: () => void;
}

const AnimatedGlowingSearchBar: React.FC<AnimatedGlowingSearchBarProps> = ({
    value,
    onChange,
    onKeyDown,
    placeholder = "Search...",
    autoFocus = false,
    isLoading = false,
    onStop,
    onRun
}) => {
    return (
        <div className="relative flex items-center justify-center w-full"> {/* Added w-full */}
            {/* Container for the effect, needs specific width/height ratios from original design but adapted */}
            <div id="poda" className="relative flex items-center justify-center group w-full max-w-2xl"> {/* Added max-w-2xl and w-full */}

                {/* Glow Layer 1 */}
                <div className="absolute z-0 overflow-hidden h-full w-full rounded-xl blur-[3px] 
                        before:absolute before:content-[''] before:z-[-2] before:w-[200%] before:h-[200%] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-60
                        before:bg-[conic-gradient(#000,#402fb5_5%,#000_38%,#000_50%,#cf30aa_60%,#000_87%)] before:transition-all before:duration-2000
                        group-hover:before:rotate-[-120deg] group-focus-within:before:rotate-[420deg] group-focus-within:before:duration-[4000ms]">
                </div>

                {/* Glow Layer 2 */}
                <div className="absolute z-0 overflow-hidden h-full w-full rounded-xl blur-[3px] 
                        before:absolute before:content-[''] before:z-[-2] before:w-[200%] before:h-[200%] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[82deg]
                        before:bg-[conic-gradient(rgba(0,0,0,0),#18116a,rgba(0,0,0,0)_10%,rgba(0,0,0,0)_50%,#6e1b60,rgba(0,0,0,0)_60%)] before:transition-all before:duration-2000
                        group-hover:before:rotate-[-98deg] group-focus-within:before:rotate-[442deg] group-focus-within:before:duration-[4000ms]">
                </div>

                {/* Layer 3 */}
                <div className="absolute z-0 overflow-hidden h-full w-full rounded-lg blur-[2px] 
                        before:absolute before:content-[''] before:z-[-2] before:w-[200%] before:h-[200%] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-[83deg]
                        before:bg-[conic-gradient(rgba(0,0,0,0)_0%,#a099d8,rgba(0,0,0,0)_8%,rgba(0,0,0,0)_50%,#dfa2da,rgba(0,0,0,0)_58%)] before:brightness-140
                        before:transition-all before:duration-2000 group-hover:before:rotate-[-97deg] group-focus-within:before:rotate-[443deg] group-focus-within:before:duration-[4000ms]">
                </div>

                {/* Inner Content */}
                <div id="main" className="relative group w-full">
                    <input
                        placeholder={placeholder}
                        type="text"
                        name="text"
                        value={value}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        autoFocus={autoFocus}
                        className="bg-[#010201] border-none w-full h-[64px] rounded-lg text-white pl-[64px] pr-[140px] text-xl font-bold uppercase tracking-wider focus:outline-none placeholder-zinc-700 relative z-10 font-sans"
                    />





                    {/* Text Label: PRESS ENTER / STOP */}
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
                        {isLoading ? (
                            <button
                                onClick={onStop}
                                className="text-[10px] font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-full tracking-widest uppercase transition-all"
                            >
                                STOP SCAN
                            </button>
                        ) : (
                            <button
                                onClick={onRun}
                                disabled={!value.trim()}
                                className="text-[10px] font-bold bg-blue-500 text-white hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-600 px-4 py-1.5 rounded-lg tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:shadow-none"
                            >
                                Run Analysis
                            </button>
                        )}
                    </div>

                    {/* Search Icon / Loading Spinner */}
                    <div id="search-icon" className="absolute left-6 top-[20px] z-20">
                        {isLoading ? (
                            <div className="text-blue-500 animate-spin">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            </div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" height="24" fill="none" className="feather feather-search">
                                <circle stroke="url(#search)" r="8" cy="11" cx="11"></circle>
                                <line stroke="url(#searchl)" y2="16.65" y1="22" x2="16.65" x1="22"></line>
                                <defs>
                                    <linearGradient gradientTransform="rotate(50)" id="search">
                                        <stop stopColor="#f8e7f8" offset="0%"></stop>
                                        <stop stopColor="#b6a9b7" offset="50%"></stop>
                                    </linearGradient>
                                    <linearGradient id="searchl">
                                        <stop stopColor="#b6a9b7" offset="0%"></stop>
                                        <stop stopColor="#837484" offset="50%"></stop>
                                    </linearGradient>
                                </defs>
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnimatedGlowingSearchBar;
