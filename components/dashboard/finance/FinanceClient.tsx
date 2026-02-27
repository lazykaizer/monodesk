"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { createClient } from "@/lib/supabase/client";
import {
    LayoutGrid,
    PieChart,
    FileText,
    CreditCard,
    Plus,
    Filter,
    Download,
    Building2,
    Flame,
    Clock,
    TrendingUp,
    TrendingDown,
    Loader2,
    Trash2,
    Edit2,
    Search,
    ChevronLeft,
    ChevronRight,
    Paperclip,
    Sparkles,
    Banknote,
    Globe
} from "lucide-react";
import { Button } from "@/components/ui/core/button";
import { Card } from "@/components/ui/core/card";
import { Badge } from "@/components/ui/core/badge";
import { ScrollArea } from "@/components/ui/core/scroll-area";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/core/dialog";
import { Input } from "@/components/ui/core/input";
import { Label } from "@/components/ui/core/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/core/select";
import { Toaster, toast } from "sonner";
import { CurrencyProvider, useCurrency } from "@/components/dashboard/finance/CurrencyContext";

const supabase = createClient();

type Transaction = {
    id: string;
    user_id?: string;
    description: string;
    amount: number;
    transaction_date: string;
    category: string;
    type: 'income' | 'expense';
};

type FinanceReport = {
    id: string;
    report_name: string;
    generated_at: string;
    total_transactions: number;
    net_value: number;
    user_id?: string;
};

// Removed standalone formatCurrency, now using hook
// const formatCurrency = ... 

const getCategoryStyle = (category: string) => {
    switch (category.toLowerCase()) {
        case 'software': return { icon: <Building2 size={18} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20 shadow-cyan-500/10' };
        case 'marketing': return { icon: <PieChart size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20 shadow-amber-500/10' };
        case 'salary': return { icon: <CreditCard size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20 shadow-emerald-500/10' };
        case 'rent': return { icon: <Building2 size={18} />, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20 shadow-rose-500/10' };
        case 'saas': return { icon: <LayoutGrid size={18} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20 shadow-indigo-500/10' };
        case 'infra': return { icon: <Building2 size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20 shadow-blue-500/10' };
        case 'operations': return { icon: <Filter size={18} />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20 shadow-orange-500/10' };
        default: return { icon: <CreditCard size={18} />, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20 shadow-zinc-500/10' };
    }
};

const getCategoryIcon = (category: string) => getCategoryStyle(category).icon;

// Memoized Sub-components
const CashFlowChart = React.memo(({ transactions, view, currentDate }: { transactions: Transaction[], view: 'monthly' | 'yearly', currentDate: Date }) => {
    const { convert, format, currency } = useCurrency();
    const chartData = useMemo(() => {
        const now = currentDate;
        const data = [];

        // Calculate starting balance by summing all transactions BEFORE this month/year
        const startOfPeriod = view === 'monthly'
            ? new Date(now.getFullYear(), now.getMonth(), 1)
            : new Date(now.getFullYear(), 0, 1);

        const initialBalance = transactions
            .filter(t => new Date(t.transaction_date) < startOfPeriod)
            .reduce((sum, t) => t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount), 0);

        let runningBalance = initialBalance;

        if (view === 'monthly') {
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(now.getFullYear(), now.getMonth(), day);
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const dayTransactions = transactions.filter(t => t.transaction_date === dateStr);

                const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
                const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

                const open = runningBalance;
                const close = open + income - expense;

                data.push({
                    displayLabel: day.toString(),
                    income,
                    expense,
                    open,
                    close,
                    date
                });

                runningBalance = close;
            }
        } else {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            for (let i = 0; i < 12; i++) {
                const monthTransactions = transactions.filter(t => {
                    const d = new Date(t.transaction_date);
                    return d.getMonth() === i && d.getFullYear() === now.getFullYear();
                });

                const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
                const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

                // Convert values here for chart consistency
                const open = convert(runningBalance, 'USD');
                const close = open + convert(income, 'USD') - convert(expense, 'USD');

                data.push({
                    displayLabel: months[i],
                    income: convert(income, 'USD'),
                    expense: convert(expense, 'USD'),
                    open,
                    close,
                    date: new Date(now.getFullYear(), i, 1)
                });

                runningBalance = initialBalance + transactions
                    .filter(t => new Date(t.transaction_date) < new Date(now.getFullYear(), i + 1, 1))
                    .reduce((sum, t) => t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount), 0);
            }
        }
        return data.map(d => ({
            ...d,
            income: d.income,
            expense: d.expense,
            open: d.open,
            close: d.close
        }));
    }, [transactions, view, currentDate, convert]);

    const allValues = chartData.flatMap(d => [d.open, d.close]);
    const minVal = Math.min(...allValues, 0);
    const maxVal = Math.max(...allValues, 100);
    const range = Math.max(maxVal - minVal, 1);

    return (
        <div className="relative w-full h-full min-h-[400px] flex flex-col p-4 pb-2">
            {transactions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em]">No Live Data</div>
            ) : (
                <>
                    {/* Chart Area */}
                    <div className="relative flex-1 mb-4 min-h-0">
                        <div className="absolute inset-0 z-0 opacity-[0.03] border-b border-white/10"
                            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                        />

                        {view === 'yearly' ? (
                            // Yearly View: Smooth Area Graph & Interactive Overlay
                            <div className="absolute inset-0 z-10">
                                {/* SVG for Paths Only */}
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Area Path */}
                                    <path
                                        d={`
                                            M0,${100 - ((chartData[0].close - minVal) / range) * 100}
                                            ${chartData.map((d, i) => `L${(i / (chartData.length - 1)) * 100},${100 - ((d.close - minVal) / range) * 100}`).join(" ")}
                                            L100,100 L0,100 Z
                                        `}
                                        fill="url(#areaGradient)"
                                    />
                                    {/* Line Path */}
                                    <path
                                        d={`
                                            M0,${100 - ((chartData[0].close - minVal) / range) * 100}
                                            ${chartData.map((d, i) => `L${(i / (chartData.length - 1)) * 100},${100 - ((d.close - minVal) / range) * 100}`).join(" ")}
                                        `}
                                        fill="none"
                                        stroke="#3b82f6"
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </svg>

                                {/* HTML Overlay for Tooltips (No SVG Scaling) */}
                                <div className="absolute inset-0 z-20">
                                    {chartData.map((d, i) => (
                                        <div
                                            key={i}
                                            className="absolute group"
                                            style={{
                                                left: `${(i / (chartData.length - 1)) * 100}%`,
                                                top: `${100 - ((d.close - minVal) / range) * 100}%`
                                            }}
                                        >
                                            {/* Interactive Point */}
                                            <div className="w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0b0c15] border-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-[0_0_10px_#3b82f6]" />

                                            {/* Hit Area */}
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 cursor-pointer z-10" />

                                            {/* HTML Tooltip */}
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/90 p-3 rounded-xl border border-white/10 whitespace-nowrap z-50 shadow-2xl pointer-events-none min-w-[140px] backdrop-blur-sm scale-95 group-hover:scale-100 origin-bottom">
                                                <div className="text-[10px] font-bold text-white mb-2 pb-2 border-b border-white/10 uppercase tracking-wider">{d.displayLabel} Summary</div>
                                                <div className="flex justify-between gap-6 text-[10px] mb-1.5">
                                                    <span className="text-zinc-400 font-medium">Income</span>
                                                    <span className="text-emerald-400 font-mono font-bold">+{format(d.income)}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 text-[10px] mb-1.5">
                                                    <span className="text-zinc-400 font-medium">Expense</span>
                                                    <span className="text-red-400 font-mono font-bold">-{format(d.expense)}</span>
                                                </div>
                                                <div className="flex justify-between gap-6 text-[10px] pt-2 border-t border-white/5 border-dashed">
                                                    <span className="text-zinc-300 font-bold uppercase tracking-wider">Closing</span>
                                                    <span className="text-white font-mono font-bold">{format(d.close)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Monthly View: Bar/Candlestick Chart
                            <div className="absolute inset-0 z-10 flex items-end justify-around gap-1 px-4">
                                {chartData.map((d: any, i) => {
                                    const low = Math.min(d.open, d.close);
                                    const height = (Math.abs(d.close - d.open) / range) * 100;
                                    const bottom = ((low - minVal) / range) * 100;
                                    const isPositive = d.close >= d.open;
                                    const hasActivity = d.income > 0 || d.expense > 0;

                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center group relative h-full">
                                            {hasActivity ? (
                                                <div
                                                    className={cn(
                                                        "w-full max-w-[8px] rounded-sm transition-all duration-500 absolute",
                                                        isPositive ? "bg-emerald-500/80 group-hover:bg-emerald-400 group-hover:shadow-[0_0_15px_#10b98144]" : "bg-red-500/80 group-hover:bg-red-400 group-hover:shadow-[0_0_15px_#f43f5e44]"
                                                    )}
                                                    style={{
                                                        height: `${Math.max(height, 2)}%`,
                                                        bottom: `${bottom}%`
                                                    }}
                                                >
                                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 p-2 rounded border border-white/10 whitespace-nowrap z-30 shadow-2xl pointer-events-none">
                                                        <div className="text-[10px] font-bold text-white mb-1">{d.displayLabel}</div>
                                                        {d.income > 0 && <div className="text-[8px] text-emerald-400">Income: +{format(d.income)}</div>}
                                                        {d.expense > 0 && <div className="text-[8px] text-red-500">Expense: -{format(d.expense)}</div>}
                                                        <div className="text-[9px] font-mono text-zinc-400 mt-1 pt-1 border-t border-white/5">Balance: {format(d.close)}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-1 h-1 bg-zinc-800 rounded-full absolute"
                                                    style={{ bottom: `${bottom}%` }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* X-Axis Area (Numbers) */}
                    <div className="h-4 flex items-center justify-around gap-1 px-4 mt-1">
                        {chartData.map((d: any, i) => (
                            <div key={i} className="flex-1 text-center">
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-tighter transition-all",
                                    view === 'yearly' ? "text-zinc-500" : "text-zinc-500 opacity-80"
                                )}>
                                    {d.displayLabel}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
});



const SimpleTransactionRow = React.memo(({ tx, onEdit, onDelete, format }: { tx: Transaction, onEdit: () => void, onDelete: () => void, format: (n: number) => string }) => (
    <div className="bg-[#11121b] border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-white/10 transition-all">
        <div className="flex items-center gap-4">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                {tx.type === 'income' ? <TrendingUp size={18} /> : <CreditCard size={18} />}
            </div>
            <div>
                <h4 className="font-bold text-sm text-white">{tx.description}</h4>
                <p className="text-xs text-zinc-500">{tx.category} • {tx.transaction_date}</p>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <span className={cn("font-bold font-mono", tx.type === 'income' ? "text-emerald-400" : "text-red-400")}>{tx.type === 'income' ? "+" : ""}{format(tx.amount)}</span>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={onEdit}><Edit2 size={14} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/50 hover:text-red-400" onClick={onDelete}><Trash2 size={14} /></Button>
            </div>
        </div>
    </div>
));

const ReportRow = React.memo(({ report, onDownload, format }: { report: FinanceReport, onDownload: () => void, format: (n: number) => string }) => (
    <div className="bg-[#11121b]/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 hover:bg-blue-500/[0.02] transition-all">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <FileText size={20} />
            </div>
            <div>
                <h4 className="font-bold text-[15px] text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight truncate max-w-[300px]">{report.report_name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(report.generated_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span className="text-[10px] text-zinc-600 font-bold">• {report.total_transactions} ITEMS</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-10">
            <div className="text-right">
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-0.5 opacity-50">Net Flow</p>
                <span className={cn("font-bold font-mono text-lg", report.net_value >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {format(Number(report.net_value))}
                </span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="h-10 px-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/5 transition-all"
                onClick={onDownload}
            >
                <Download size={14} className="mr-2" /> Download Again
            </Button>
        </div>
    </div>
));

const TransactionRow = React.memo(({ tx, onEdit, onDelete, onClick, format }: { tx: Transaction, onEdit: () => void, onDelete: () => void, onClick: () => void, format: (n: number) => string }) => {
    const style = getCategoryStyle(tx.category);
    return (
        <div
            onClick={onClick}
            className="group relative bg-[#11121b]/40 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between hover:border-blue-500/30 hover:bg-blue-500/[0.04] transition-all duration-500 cursor-pointer overflow-hidden hover:scale-[1.01] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] active:scale-[0.99]"
        >
            {/* Animated Flow Line on Hover */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Moving Glow Mesh */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/[0.01] to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="flex items-center gap-6 relative z-10">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 border",
                    style.bg, style.color, style.border
                )}>
                    {style.icon}
                </div>
                <div>
                    <h4 className="font-black text-lg text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight leading-none mb-2">{tx.description}</h4>
                    <div className="flex items-center gap-3">
                        <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border", style.bg, style.color, style.border.split(' ')[0])}>
                            {tx.category}
                        </span>
                        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                            <Clock size={10} className="text-zinc-500" />
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(tx.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-10 relative z-10">
                <div className="text-right flex flex-col items-end">
                    <span className={cn(
                        "font-black font-mono text-2xl tracking-tighter transition-all duration-500 group-hover:scale-110 origin-right",
                        tx.type === 'income' ? "text-emerald-400 drop-shadow-[0_0_10px_#10b98144]" : "text-red-400 drop-shadow-[0_0_10px_#f43f5e44]"
                    )}>
                        {tx.type === 'income' ? "+" : ""}{format(tx.amount)}
                    </span>
                    <div className="flex items-center gap-2 mt-1 px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/5 opacity-40 group-hover:opacity-100 transition-all">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em]">Verified</span>
                    </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10 transition-all"
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    >
                        <Edit2 size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-red-500/40 hover:text-red-400 hover:bg-red-500/5 rounded-2xl border border-transparent hover:border-red-500/10 transition-all"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
});

export default function FinanceClient() {
    return (
        <CurrencyProvider>
            <FinanceContent />
        </CurrencyProvider>
    );
}

function FinanceContent() {
    const { currency, setCurrency, format, convert } = useCurrency();
    const [mounted, setMounted] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'reports'>('overview');
    const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly');
    const [chartDate, setChartDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        description: "",
        amount: "",
        transaction_date: "", // Start empty to avoid mismatch
        category: "Software",
        type: 'expense'
    });
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [reportsHistory, setReportsHistory] = useState<FinanceReport[]>([]);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        setFormData((prev: any) => ({ ...prev, transaction_date: new Date().toISOString().split('T')[0] }));

        const fetchTransactions = async () => {
            const { data } = await supabase.from('finance_records').select('*').order('transaction_date', { ascending: false });
            setTransactions(data || []);
        };
        const fetchReports = async () => {
            const { data } = await supabase.from('finance_reports').select('*').order('generated_at', { ascending: false });
            setReportsHistory(data || []);
        };
        fetchTransactions();
        fetchReports();

        const channel = supabase.channel('finance_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_records' }, (p) => {
                if (p.eventType === 'INSERT') setTransactions(prev => [p.new as Transaction, ...prev]);
                else if (p.eventType === 'UPDATE') setTransactions(prev => prev.map(t => t.id === p.new.id ? p.new as Transaction : t));
                else if (p.eventType === 'DELETE') setTransactions(prev => prev.filter(t => t.id !== p.old.id));
            }).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const metrics = useMemo(() => {
        const totalBalance = transactions.reduce((sum, t) => t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount), 0);
        const currentMonthBurn = Math.abs(transactions.filter(t => t.type === 'expense' && t.transaction_date.startsWith(new Date().toISOString().slice(0, 7))).reduce((sum, t) => sum + Number(t.amount), 0));
        return { totalBalance, currentMonthBurn, runway: currentMonthBurn > 0 ? (totalBalance / currentMonthBurn).toFixed(1) : "Inf" };
    }, [transactions]);

    const handleSave = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error("Login required");
        const tx = { ...formData, amount: Number(formData.amount), user_id: user.id };
        if (editingId) await supabase.from('finance_records').update(tx).eq('id', editingId);
        else await supabase.from('finance_records').insert([tx]);
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ description: "", amount: "", transaction_date: new Date().toISOString().split('T')[0], category: "Software", type: 'expense' });
    }, [formData, editingId]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("Delete transaction?")) return;
        await supabase.from('finance_records').delete().eq('id', id);
        toast.success("Deleted");
    }, []);

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return toast.error("Login required");

            const doc = new jsPDF();

            // Branding
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("MONODESK", 14, 20);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100);
            doc.text(`Financial Audit Report - ${new Date().toLocaleDateString()}`, 14, 28);
            doc.text(`Generated by: ${user.email || user.id}`, 14, 33);

            const tableBody = transactions.map(t => [
                new Date(t.transaction_date).toLocaleDateString(),
                t.description.toUpperCase(),
                t.category.toUpperCase(),
                `${t.type === 'income' ? '+' : '-'} ${currency} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(convert(t.amount))}`
            ]);

            autoTable(doc, {
                startY: 40,
                head: [['DATE', 'DESCRIPTION', 'CATEGORY', 'AMOUNT']],
                body: tableBody,
                headStyles: { fillColor: [11, 12, 21], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 3) {
                        const amountStr = data.cell.raw as string;
                        if (amountStr.startsWith('+')) {
                            data.cell.styles.textColor = [16, 185, 129]; // Emerald
                        } else {
                            data.cell.styles.textColor = [244, 63, 94]; // Red
                        }
                    }
                }
            });

            const netValue = transactions.reduce((sum, t) => t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount), 0);
            const reportName = `Monodesk_Audit_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}`;

            // Save metadata to DB for History
            const { error: dbError } = await supabase.from('finance_reports').insert([{
                user_id: user.id,
                report_name: reportName,
                total_transactions: transactions.length,
                net_value: netValue
            }]);

            if (dbError) throw dbError;

            doc.save(`${reportName}.pdf`);
            toast.success("Report Generated & Saved to History");

            // Refresh history list
            const { data: historyData } = await supabase.from('finance_reports').select('*').order('generated_at', { ascending: false });
            setReportsHistory(historyData || []);

        } catch (e) {
            console.error(e);
            toast.error("Report Generation Failed");
        } finally {
            setIsGeneratingReport(false);
        }
    };


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Frontend validation
        if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
            toast.error("Invalid file type. Only JPG, PNG, WEBP, and PDF allowed.");
            return;
        }

        setIsAnalyzingReceipt(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch('/api/finance/analyze', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Analysis failed");
            }

            const data = await response.json();

            setFormData({
                description: data.description || "Receipt Scan",
                amount: data.amount || "",
                transaction_date: data.transaction_date || new Date().toISOString().split('T')[0],
                category: data.category || "Software",
                type: data.type || "expense"
            });
            setEditingId(null);
            setIsModalOpen(true);
            toast.success("Receipt Analyzed Successfully!");

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to analyze receipt");
        } finally {
            setIsAnalyzingReceipt(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex min-h-screen w-full bg-[#0b0c15] text-white font-sans pt-4">
            <aside className="w-72 bg-[#08080c] border-r border-white/5 p-6 flex flex-col gap-8 sticky top-0 h-[calc(100vh-64px)] overflow-y-auto">
                <nav className="space-y-1">
                    {['overview', 'transactions', 'reports'].map(tab => (
                        <div key={tab} onClick={() => setActiveTab(tab as any)} className={cn("px-3 py-2 rounded-lg cursor-pointer transition-all capitalize", activeTab === tab ? "bg-blue-600/10 text-blue-400 font-bold" : "text-zinc-500 hover:text-white")}>{tab}</div>
                    ))}
                </nav>
                <div className="mt-auto space-y-4">
                    <Card className="bg-[#11121b] border-white/5 p-4"><p className="text-xs text-zinc-500">Total Balance</p><h2 className="text-xl font-bold">{format(metrics.totalBalance)}</h2></Card>
                    <Card className="bg-[#11121b] border-white/5 p-4"><p className="text-xs text-zinc-500">Monthly Burn</p><h2 className="text-xl font-bold text-red-400">{format(metrics.currentMonthBurn)}</h2></Card>
                    <Card className="bg-[#11121b] border-white/5 p-4"><p className="text-xs text-zinc-500">Runway</p><h2 className="text-xl font-bold">{metrics.runway} Mo</h2></Card>
                </div>
            </aside>
            <main className="flex-1 flex flex-col">
                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-[#0b0c15]/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            onChange={handleFileUpload}
                        />
                        <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
                            <SelectTrigger className="w-[100px] bg-[#11121b] border-white/5 text-xs font-bold h-9">
                                <Globe size={14} className="mr-2 text-blue-500" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#11121b] border-white/10 test-class-for-selection">
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                <SelectItem value="INR">INR (₹)</SelectItem>
                                <SelectItem value="JPY">JPY (¥)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isAnalyzingReceipt}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border border-white/5 shadow-lg transition-all"
                        >
                            {isAnalyzingReceipt ? <Loader2 className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2 text-indigo-400" size={16} />}
                            {isAnalyzingReceipt ? "Analyzing..." : "Scan Receipt"}
                        </Button>
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all font-bold">
                                    <Plus size={16} className="mr-2" /> New Transaction
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#0f101a] border-white/10 text-white max-w-md p-0 overflow-hidden rounded-3xl">
                                <div className="bg-gradient-to-br from-blue-600/20 to-transparent p-8 pb-4">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                                                <Plus size={20} />
                                            </div>
                                            {editingId ? "Edit" : "New"} Entry
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-500 mt-2">
                                            Log your cash flow with precision. All data syncs in real-time.
                                        </DialogDescription>
                                    </DialogHeader>
                                </div>

                                <div className="p-8 pt-4 space-y-6">
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/5 rounded-2xl">
                                        <button
                                            onClick={() => setFormData({ ...formData, type: 'income' })}
                                            className={cn(
                                                "py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                                formData.type === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            <TrendingUp size={14} />
                                            Income
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, type: 'expense' })}
                                            className={cn(
                                                "py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                                formData.type === 'expense' ? "bg-red-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            <TrendingDown size={14} />
                                            Expense
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Description</Label>
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                                                <Input
                                                    placeholder="e.g. Server Hosting, Client Payment..."
                                                    value={formData.description}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                    className="h-12 pl-11 bg-black/40 border-white/5 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Amount ($)</Label>
                                                <div className="relative group">
                                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={formData.amount}
                                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                        className="h-12 pl-11 bg-black/40 border-white/5 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl transition-all font-mono font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Category</Label>
                                                <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                                    <SelectTrigger className="h-12 bg-black/40 border-white/5 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl transition-all">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#11121b] border-white/10 text-zinc-300">
                                                        {['Software', 'Marketing', 'Salary', 'Rent', 'SaaS', 'Misc', 'Infra', 'Operations'].map(cat => (
                                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Transaction Date</Label>
                                            <div className="relative group">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                                                <Input
                                                    type="date"
                                                    value={formData.transaction_date}
                                                    onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                                                    className="h-12 pl-11 bg-black/40 border-white/5 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 pt-0 bg-gradient-to-t from-black/40 to-transparent">
                                    <DialogFooter>
                                        <Button
                                            onClick={handleSave}
                                            className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(37,99,235,0.3)] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {editingId ? "Update" : "Confirm"} Record
                                        </Button>
                                    </DialogFooter>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </header>
                <div className="flex-1 p-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="bg-[#0e0f16] border border-white/5 rounded-2xl overflow-hidden p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Cash Flow Analysis</h3>
                                        <p className="text-[10px] text-zinc-500 font-medium">Real-time forensic tracking of your runway.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-black/40 border border-white/5 rounded-xl p-1 gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/5"
                                                onClick={() => {
                                                    const d = new Date(chartDate);
                                                    d.setDate(1);
                                                    if (chartView === 'monthly') d.setMonth(d.getMonth() - 1);
                                                    else d.setFullYear(d.getFullYear() - 1);
                                                    setChartDate(d);
                                                }}
                                            >
                                                <ChevronLeft size={14} />
                                            </Button>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 min-w-[100px] text-center">
                                                {chartView === 'monthly'
                                                    ? chartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                                    : chartDate.getFullYear()}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/5"
                                                onClick={() => {
                                                    const d = new Date(chartDate);
                                                    d.setDate(1);
                                                    if (chartView === 'monthly') d.setMonth(d.getMonth() + 1);
                                                    else d.setFullYear(d.getFullYear() + 1);
                                                    setChartDate(d);
                                                }}
                                            >
                                                <ChevronRight size={14} />
                                            </Button>
                                        </div>
                                        <div className="flex p-1 bg-black/40 border border-white/5 rounded-xl">
                                            <button
                                                onClick={() => setChartView('monthly')}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                    chartView === 'monthly' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"
                                                )}
                                            >
                                                Monthly
                                            </button>
                                            <button
                                                onClick={() => setChartView('yearly')}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                    chartView === 'yearly' ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"
                                                )}
                                            >
                                                Yearly
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-zinc-400">
                                    <span>Total Transaction Value</span>
                                    <span className="text-white font-mono">{format(Number(formData.amount || 0))}</span>
                                </div>
                                <div className="h-[400px] w-full">
                                    <CashFlowChart transactions={transactions} view={chartView} currentDate={chartDate} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {transactions.slice(0, 5).map(tx => (
                                    <SimpleTransactionRow
                                        key={tx.id}
                                        tx={tx}
                                        onEdit={() => { setFormData(tx); setEditingId(tx.id); setIsModalOpen(true); }}
                                        onDelete={() => handleDelete(tx.id)}
                                        format={format}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'transactions' && (
                        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-500">
                            {transactions.map(tx => (
                                <TransactionRow
                                    key={tx.id}
                                    tx={tx}
                                    onClick={() => setSelectedTransaction(tx)}
                                    onEdit={() => { setFormData(tx); setEditingId(tx.id); setIsModalOpen(true); }}
                                    onDelete={() => handleDelete(tx.id)}
                                    format={format}
                                />
                            ))}
                        </div>
                    )}
                    {activeTab === 'reports' && mounted && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Audit History</h3>
                                    <p className="text-sm text-zinc-500">View and download your persistent financial audits.</p>
                                </div>
                                <Button
                                    onClick={handleGenerateReport}
                                    disabled={isGeneratingReport}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 px-6 rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.2)] transition-all"
                                >
                                    {isGeneratingReport ? <Loader2 className="animate-spin mr-2" /> : <FileText className="mr-2" />}
                                    Generate New Audit
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {reportsHistory.length === 0 ? (
                                    <div className="border border-dashed border-white/10 rounded-3xl p-12 text-center">
                                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No reports generated yet</p>
                                    </div>
                                ) : (
                                    reportsHistory.map(report => (
                                        <ReportRow
                                            key={report.id}
                                            report={report}
                                            onDownload={() => { /* Logic to re-download if needed, requires recreating PDF content which isn't stored. For now just placeholder or re-gen logic needed */ toast.info("Re-download feature coming soon") }}
                                            format={format}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </main>

            {/* Transaction Detail Dialog (Receipt Style) */}
            <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
                <DialogContent className="bg-[#0b0c15] border-white/10 p-0 overflow-hidden max-w-md rounded-[2.5rem] shadow-2xl">
                    <div className="p-8 pb-4">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={cn(
                                "w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3",
                                selectedTransaction?.type === 'income' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                            )}>
                                {selectedTransaction && getCategoryIcon(selectedTransaction.category)}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">{selectedTransaction?.description}</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{selectedTransaction?.category} • TRANSACTION ID: {selectedTransaction?.id.slice(0, 8)}</p>
                            </div>
                        </div>

                        <div className="mt-8 relative pt-8 border-t border-dashed border-white/10">
                            {/* Receipt Decorative Circles */}
                            <div className="absolute top-[-10px] left-[-40px] w-5 h-5 bg-[#0b0c15] rounded-full" />
                            <div className="absolute top-[-10px] right-[-40px] w-5 h-5 bg-[#0b0c15] rounded-full" />

                            <div className="flex flex-col items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-2">Amount Settled</span>
                                <h2 className={cn(
                                    "text-5xl font-black font-mono tracking-tighter mb-8",
                                    selectedTransaction?.type === 'income' ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {selectedTransaction && format(selectedTransaction.amount)}
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Method</p>
                                    <p className="text-sm font-bold text-white flex items-center gap-2 italic">
                                        <CreditCard size={14} className="text-zinc-400" /> Digital Ledger
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-sm font-bold text-white">Settled</p>
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Date</p>
                                    <p className="text-sm font-bold text-zinc-300">{selectedTransaction && new Date(selectedTransaction.transaction_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Tax Index</p>
                                    <p className="text-sm font-bold text-zinc-300">#MTX-{(Math.random() * 9000 + 1000).toFixed(0)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pt-4 flex gap-3 bg-gradient-to-t from-white/[0.02] to-transparent">
                        <Button className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5">
                            <Download size={16} className="mr-2" /> Export
                        </Button>
                        <Button
                            onClick={() => setSelectedTransaction(null)}
                            className="flex-1 h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)]"
                        >
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Toaster />
        </div>
    );
}
