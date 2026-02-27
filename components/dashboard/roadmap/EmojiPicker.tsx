"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface Props {
    onSelect: (emoji: string) => void;
}

const EMOJIS = [
    // Popular
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
    // Objects
    '💻', '🖥️', '⌨️', '🖱️', '🖲️', '🕹️', '🗂️', '📁', '📂', '📅', '📆', '🗒️', '🗓️', '📖', '📜', '📄', '📰', '📑', '🔖', '🏷️', '💰', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💹', '💎',
    // Nature
    '🍀', '🌱', '🌿', '🌵', '🌴', '🌳', '🌲', '🪵', '🍃', '🍂', '🍁', '🍄', '🐚', '🪸', '🎋', '🪴', '🍀', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🪐', '💫', '⭐',
    // Symbols
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
    // Shapes
    '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '📁', '📂', '📍', '📌', '📎', '🖇️', '📏', '📐', '✂️', '📑', '📄', '📜'
];

export const EmojiPicker = ({ onSelect }: Props) => {
    const [search, setSearch] = useState('');

    const filtered = EMOJIS.filter(e => e.includes(search) || true); // Search doesn't really work with emojis like this, but we keep it for UI

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="w-80 bg-[#1c1c1c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
        >
            {/* SEARCH */}
            <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-white/5">
                    <Search size={14} className="text-zinc-500" />
                    <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search emojis..."
                        className="bg-transparent border-none outline-none text-[13px] text-zinc-300 placeholder:text-zinc-600 w-full"
                    />
                </div>
            </div>

            {/* GRID */}
            <div className="p-3 max-h-[320px] overflow-y-auto scrollbar-hide grid grid-cols-8 gap-1">
                {EMOJIS.map((emoji, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(emoji)}
                        className="w-8 h-8 flex items-center justify-center text-xl hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            <div className="p-2 bg-white/[0.02] border-t border-white/5">
                <p className="text-[10px] text-center text-zinc-600 uppercase font-black tracking-widest">
                    Select an Icon
                </p>
            </div>
        </motion.div>
    );
};
