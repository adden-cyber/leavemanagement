'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDashboardCache } from '@/lib/DashboardCacheContext';

interface Activity {
    id: string;
    user: string;
    action: string;
    time: string;
    date: Date;
}

interface AnalyticsData {
    recentActivity: { id: string; user: string; action: string; time: string }[];
}

export default function ActivityView() {
    const { getCache, setCache } = useDashboardCache();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // pagination state
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(0);
    const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));

    useEffect(() => {
        // if activities list changes (e.g. refresh) go back to first page
        setPage(0);

        async function fetchActivities() {
            // Check cache first
            const cachedActivities = getCache('activities_list');
            if (cachedActivities) {
                setActivities(cachedActivities);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await fetch('/api/activities');
                if (!res.ok) throw new Error('Failed to fetch activities');
                const json = await res.json();

                // Map API response to local Activity type
                const mapped = json.map((a: any) => ({
                    id: a.id,
                    user: a.userName || (a.userId ? a.userId : 'System'),
                    action: a.action,
                    time: new Date(a.createdAt).toLocaleString(),
                    date: new Date(a.createdAt),
                }));

                setActivities(mapped);
                setCache('activities_list', mapped);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchActivities();
    }, []);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarColor = (name: string) => {
        const colors = ['#7559e0', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7559e0] border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 items-center justify-center text-red-500">
                Failed to load activities: {error}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 w-full mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activity Feed</h1>
                    <p className="text-slate-500 mt-2 text-lg">Monitor all user activities and system events in real-time.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
                        title="Refresh activities"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Activity Stats */}
            {activities.length > 0 && (
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-semibold text-blue-700">Total Activities</CardTitle>
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-900">{activities.length}</div>
                            <p className="text-sm text-blue-600 mt-1">System activities logged</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-semibold text-green-700">Active Users</CardTitle>
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-900">{new Set(activities.map(a => a.user)).size}</div>
                            <p className="text-sm text-green-600 mt-1">Unique users with activity</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-semibold text-purple-700">Latest Activity</CardTitle>
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold text-purple-900">{activities[0] ? formatTimeAgo(activities[0].date) : 'N/A'}</div>
                            <p className="text-sm text-purple-600 mt-1">Most recent event</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Activities Feed */}
            <Card className="bg-white border border-slate-100 shadow-lg">
                <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Recent Activities</CardTitle>
                            <CardDescription className="text-slate-500 mt-1">All system activities and user interactions</CardDescription>
                        </div>
                        <div className="text-sm text-slate-500">
                            Page {page + 1} of {totalPages}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="text-slate-500 font-semibold text-lg">No activities yet</p>
                            <p className="text-slate-400 text-sm mt-1 max-w-md">Activities will appear here as users interact with the system. Check back later for updates.</p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-slate-100">
                                {activities
                                    .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
                                    .map((activity, index) => (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-4 p-6 hover:bg-slate-50/50 transition-all duration-200 group"
                                        >
                                            {/* Timeline indicator */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-3 h-3 bg-[#7559e0] rounded-full shadow-sm flex-shrink-0 mt-2"></div>
                                                {index < activities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).length - 1 && (
                                                    <div className="w-px h-full bg-slate-200 mt-2"></div>
                                                )}
                                            </div>

                                            {/* Avatar */}
                                            <div
                                                className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold text-sm flex-shrink-0 shadow-sm ring-2 ring-white"
                                                style={{ backgroundColor: getAvatarColor(activity.user) }}
                                            >
                                                {getInitials(activity.user)}
                                            </div>

                                            {/* Activity Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <p className="text-sm font-bold text-slate-900 group-hover:text-[#7559e0] transition-colors">
                                                                {activity.user}
                                                            </p>
                                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                                                {formatTimeAgo(activity.date)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed break-words">{activity.action}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {/* Enhanced Pagination */}
                            {totalPages > 1 && (
                                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <button
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => setPage(p => Math.max(p - 1, 0))}
                                            disabled={page === 0}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Previous
                                        </button>

                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const startPage = Math.max(0, Math.min(totalPages - 5, page - 2));
                                                const endPage = Math.min(totalPages - 1, startPage + 4);

                                                return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                                                    const pageNum = startPage + i;
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setPage(pageNum)}
                                                            className={`px-4 py-2 text-base font-semibold rounded-lg transition-all ${
                                                                page === pageNum
                                                                    ? 'bg-[#7559e0] text-white shadow-sm'
                                                                    : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            {pageNum + 1}
                                                        </button>
                                                    );
                                                });
                                            })()}
                                        </div>

                                        <button
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
                                            disabled={page >= totalPages - 1}
                                        >
                                            Next
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
