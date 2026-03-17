'use client';

import React, { createContext, useContext, useState } from 'react';

interface CacheData {
    [key: string]: {
        data: any;
        timestamp: number;
    };
}

interface DashboardCacheContextType {
    getCache: (key: string) => any;
    setCache: (key: string, data: any) => void;
    clearCache: (key?: string) => void;
}

const DashboardCacheContext = createContext<DashboardCacheContextType | undefined>(undefined);

export function DashboardCacheProvider({ children }: { children: React.ReactNode }) {
    const [cache, setCache] = useState<CacheData>({});
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const getCache = (key: string) => {
        const cached = cache[key];
        if (!cached) return null;

        // Check if cache is expired
        if (Date.now() - cached.timestamp > CACHE_DURATION) {
            setCache(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });
            return null;
        }

        return cached.data;
    };

    const setCacheData = (key: string, data: any) => {
        setCache(prev => ({
            ...prev,
            [key]: { data, timestamp: Date.now() }
        }));
    };

    const clearCache = (key?: string) => {
        if (key) {
            setCache(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });
        } else {
            setCache({});
        }
    };

    return (
        <DashboardCacheContext.Provider value={{ getCache, setCache: setCacheData, clearCache }}>
            {children}
        </DashboardCacheContext.Provider>
    );
}

export function useDashboardCache() {
    const context = useContext(DashboardCacheContext);
    if (!context) {
        throw new Error('useDashboardCache must be used within DashboardCacheProvider');
    }
    return context;
}
