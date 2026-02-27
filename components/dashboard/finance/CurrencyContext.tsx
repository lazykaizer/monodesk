"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (c: Currency) => void;
    convert: (amount: number, from?: Currency) => number;
    format: (amount: number) => string;
    rates: Record<string, number>;
    isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<Currency>('USD');
    const [rates, setRates] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                // Fetch rates based on USD
                const res = await fetch('https://api.frankfurter.app/latest?from=USD');
                const data = await res.json();
                setRates(data.rates);
                setIsLoading(false);
            } catch (error) {
                console.error("Failed to fetch rates:", error);
                // Fallback rates if API fails
                setRates({ EUR: 0.92, GBP: 0.79, INR: 83.50, JPY: 151.20 });
                setIsLoading(false);
            }
        };
        fetchRates();
    }, []);

    const convert = (amount: number, from: Currency = 'USD') => {
        if (from === currency) return amount;

        // Convert 'from' to USD first (if not USD)
        let amountInUSD = amount;
        if (from !== 'USD') {
            const rateToUSD = rates[from];
            if (rateToUSD) amountInUSD = amount / rateToUSD;
        }

        // Convert USD to target currency
        if (currency === 'USD') return amountInUSD;
        const rateFromUSD = rates[currency];
        return amountInUSD * (rateFromUSD || 1);
    };

    const format = (amount: number) => {
        const converted = convert(amount);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, rates, isLoading }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
