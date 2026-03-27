'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

const Sidebar = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const currentView = searchParams.get('view') || 'analytics';
    const isAdmin = session?.user?.role === 'ADMIN';
    const leaveLabel = isAdmin ? 'Leave Approvement' : 'Leave Application';

    const navItems = [
        {
            name: 'Dashboard', view: 'analytics', href: '/dashboard?view=analytics',
            icon: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>
        },
        {
            name: 'Activities', view: 'activities', href: '/dashboard?view=activities',
            icon: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
        },
        {
            name: 'Employees', view: 'employees', href: '/dashboard?view=employees',
            icon: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
        },

        {
            name: leaveLabel, view: 'leave', href: '/dashboard?view=leave',
            icon: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
        },
        
        // Role-based leave management
        ...(isAdmin ? [{
            name: 'Leave Management', view: 'leave-management', href: '/dashboard?view=leave-management',
            icon: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 18 4.5h-2.25A2.25 2.25 0 0 0 13.5 6.75v11.25A2.25 2.25 0 0 0 15.75 20.25z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.25 2.25 0 0 1 5.25 5.25h13.5A2.25 2.25 0 0 1 21 7.5m-15 6h13.5m-13.5 3h13.5" /></svg>
        }] : [{
            name: 'Leave Credits', view: 'leave-credits', href: '/dashboard?view=leave-credits',
            icon: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 18 4.5h-2.25A2.25 2.25 0 0 0 13.5 6.75v11.25A2.25 2.25 0 0 0 15.75 20.25z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.25 2.25 0 0 1 5.25 5.25h13.5A2.25 2.25 0 0 1 21 7.5m-15 6h13.5m-13.5 3h13.5" /></svg>
        }]),

        {
            name: 'Leave History', view: 'leave-history', href: '/dashboard?view=leave-history',
            icon: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        },
        {
            name: 'Settings', view: 'settings', href: '/dashboard?view=settings',
            icon: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
        },
    ].filter(item => !(item.name === 'Activities' && !isAdmin));

    const [mobilePage, setMobilePage] = useState(0);
    const pageSize = 3;
    const totalPages = Math.max(1, Math.ceil(navItems.length / pageSize));

    const mobileItems = navItems.slice(mobilePage * pageSize, mobilePage * pageSize + pageSize);

    return (
        <>
            <aside className="hidden md:flex w-64 bg-[#2563eb] text-white flex-col h-screen transition-all duration-300 relative overflow-hidden shrink-0">
                {/* Logo Area */}
                <div className="h-20 flex items-center px-8 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#2563eb] font-bold text-sm shadow-sm">
                            RL
                        </div>
                        <span className="font-bold text-lg text-white tracking-tight">Roro Leave Management System</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto relative z-10">
                    {navItems.map((item) => {
                        const isActive = pathname === '/dashboard' && item.view === currentView;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                    ${isActive
                                        ? 'bg-white text-[#2563eb] shadow-lg shadow-black/5'
                                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                                    }
                                `}
                            >
                                <span className="text-lg flex-shrink-0">{item.icon()}</span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile / Footer */}
                <div className="p-4 border-t border-white/10 relative z-20">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/5 backdrop-blur-sm">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#2563eb] flex-shrink-0 shadow-sm">
                            {session?.user?.name?.[0] || (session?.user as any)?.username?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-white truncate">{session?.user?.name || (session?.user as any)?.username || session?.user?.email?.split('@')[0] || 'User'}</p>
                            <p className="text-xs text-blue-200 truncate">{session?.user?.role || 'Admin'}</p>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-1 rounded-md hover:bg-white/20 transition-colors duration-200"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white/70">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            <aside className="md:hidden fixed bottom-0 left-0 right-0 bg-[#2563eb] text-white border-t border-white/20 shadow-lg z-50">
                <div className="flex items-center justify-between px-2 py-2">
                    <button
                        onClick={() => setMobilePage((prev) => (prev - 1 + totalPages) % totalPages)}
                        className="text-white p-2 rounded-lg hover:bg-white/20 transition"
                        aria-label="Previous"
                    >
                        ◀
                    </button>
                    <div className="flex items-center gap-2 overflow-hidden">
                        {mobileItems.map((item) => {
                            const isActive = pathname === '/dashboard' && item.view === currentView;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center min-w-[6rem] px-3 py-2 rounded-lg transition ${isActive ? 'bg-white text-[#2563eb]' : 'text-blue-100 hover:bg-white/20 hover:text-white'}`}
                                >
                                    <span className="text-lg">{item.icon()}</span>
                                    <span className="text-xs font-medium truncate max-w-[4rem]">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setMobilePage((prev) => (prev + 1) % totalPages)}
                        className="text-white p-2 rounded-lg hover:bg-white/20 transition"
                        aria-label="Next"
                    >
                        ▶
                    </button>
                </div>
                <div className="flex justify-center items-center gap-2 px-2 pb-2">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                            key={idx}
                            aria-label={`Go to page ${idx + 1}`}
                            className={`h-2 w-2 rounded-full ${idx === mobilePage ? 'bg-white' : 'bg-white/40'}`}
                            onClick={() => setMobilePage(idx)}
                        />
                    ))}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
