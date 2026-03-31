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
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Activities</h2>
                <p className="text-sm text-gray-500 mt-1">Monitor all user activities and actions across the system</p>
            </div>

            {/* Activity Stats - Moved to Top */}
            {activities.length > 0 && (
                <>
                    <div className="grid gap-4 md:hidden">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Activity Summary</CardTitle>
                                <span className="text-lg">📈</span>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Total Activities</span>
                                        <span className="font-bold">{activities.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Active Users</span>
                                        <span className="font-bold">{new Set(activities.map(a => a.user)).size}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Most Recent</span>
                                        <span className="font-bold">{activities[0]?.time || 'N/A'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="hidden md:grid md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Total Activities</CardTitle>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{activities.length}</div>
                                <p className="text-xs text-gray-500">Recent system activities</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Active Users</CardTitle>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{new Set(activities.map(a => a.user)).size}</div>
                                <p className="text-xs text-gray-500">Unique users with activity</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Most Recent</CardTitle>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-gray-900">{activities[0]?.time || 'N/A'}</div>
                                <p className="text-xs text-gray-500">Latest activity</p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* Activities Grid */}
            <div className="grid gap-4 md:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activities</CardTitle>
                        <CardDescription>All activities from the last updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="text-4xl mb-4">📭</div>
                                <p className="text-gray-500 font-medium">No activities yet</p>
                                <p className="text-gray-400 text-sm">Activities will appear here as users interact with the system</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {activities
                                        .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
                                        .map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-[#7559e0] hover:bg-gray-50 transition-all duration-200 group"
                                    >
                                        {/* Status Indicator */}
                                        <div className="flex h-3 w-3 rounded-full bg-green-400 flex-shrink-0 shadow-sm"></div>

                                        {/* Avatar */}
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold text-xs flex-shrink-0 shadow-sm"
                                            style={{ backgroundColor: getAvatarColor(activity.user) }}
                                        >
                                            {getInitials(activity.user)}
                                        </div>

                                        {/* Activity Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-[#7559e0] transition-colors">
                                                    {activity.user}
                                                </p>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                    {activity.time}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 break-words">{activity.action}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                                {/* pagination controls */}
                                <div className="flex justify-between mt-4">
                                    <button
                                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                                        onClick={() => setPage(p => Math.max(p - 1, 0))}
                                        disabled={page === 0}
                                    >
                                        &larr; Back
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                                        onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
                                        disabled={page >= totalPages - 1}
                                    >
                                        Next &rarr;
                                    </button>
                                </div>

                                {/* dot indicators below */}
                                <div className="mt-3 flex justify-center gap-2">
                                    {Array.from({ length: totalPages }, (_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setPage(idx)}
                                            className={`h-2.5 w-2.5 rounded-full ${page === idx ? 'bg-[#7559e0]' : 'bg-slate-300 hover:bg-slate-400'}`}
                                            aria-label={`Go to page ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
