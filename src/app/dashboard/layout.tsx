import Sidebar from '@/components/Sidebar';
import { Suspense } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[var(--background)] overflow-hidden">
            <Suspense fallback={<div className="w-64 bg-slate-50 border-r border-slate-200 shrink-0"></div>}>
                <Sidebar />
            </Suspense>

            <div className="flex-1 flex flex-col h-full relative p-4 md:p-8 lg:p-12 bg-[#F8F9FA] dark:bg-slate-900 transition-colors">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent flex flex-col items-center">
                    <div className="max-w-4xl w-full bg-transparent p-2">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
