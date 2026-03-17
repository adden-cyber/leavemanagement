'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDashboardCache } from '@/lib/DashboardCacheContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
    isAdmin: boolean;
    pendingLeaveRequests?: number;
    myTotalLeavesApplied?: number;
    leavesThisMonth: number;
    newHiresThisMonth: number;
    openJobs: number;
    pendingTasks: number;
    annualLeaves: number;
    unpaidLeaves: number;
    medicalLeaves: number;
    leaveData: { monthly: { period: string; count: number }[]; weekly: { period: string; count: number }[] };
    recentActivity: { id: string; user: string; action: string; time: string }[];
}

export default function AnalyticsView() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
    const { getCache, setCache } = useDashboardCache();

    useEffect(() => {
        async function fetchAnalytics() {
            // Check cache first
            const cachedData = getCache('analytics_data');
            if (cachedData) {
                setData(cachedData);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await fetch('/api/analytics');
                if (!res.ok) throw new Error('Failed to fetch analytics data');
                const json = await res.json();
                setData(json);
                setCache('analytics_data', json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7559e0] border-t-transparent"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex h-64 items-center justify-center text-red-500">
                Failed to load dashboard data: {error}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
                <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Leaves This Month</CardTitle>
                        <span className="text-xl">📄</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{data.leavesThisMonth}</div>
                        <p className="text-xs text-gray-500">
                            <span className="text-green-500 font-medium">+{data.newHiresThisMonth}</span> new hires this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">My Leaves Applied</CardTitle>
                        <span className="text-xl">🌴</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{data.myTotalLeavesApplied || 0}</div>
                        <p className="text-xs text-gray-500 cursor-pointer hover:text-[#7559e0]">View your leave history</p>
                    </CardContent>
                </Card>

                {data.isAdmin && data.pendingLeaveRequests && data.pendingLeaveRequests > 0 ? (
                    <Card className="bg-gradient-to-br from-[#7559e0] to-[#5939b8] text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-white/80">Pending Leaves</CardTitle>
                            <span className="text-xl">🔔</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.pendingLeaveRequests === 1 ? '1' : `${data.pendingLeaveRequests}`}
                            </div>
                            <Link href="/dashboard?view=leave" className="text-xs text-white/80 mt-1 cursor-pointer hover:text-white hover:underline block">
                                Review applications now
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-white/80">System Status</CardTitle>
                            <span className="text-xl">✅</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">All Good</div>
                            <p className="text-xs text-white/80 mt-1">No pending actions</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Leave Type Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Annual Leaves</CardTitle>
                        <span className="text-xl">🏖️</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{data.annualLeaves}</div>
                        <p className="text-xs text-gray-500">Total annual leave requests</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Unpaid Leaves</CardTitle>
                        <span className="text-xl">💼</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{data.unpaidLeaves}</div>
                        <p className="text-xs text-gray-500">Total unpaid leave requests</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Medical Leaves</CardTitle>
                        <span className="text-xl">🏥</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{data.medicalLeaves}</div>
                        <p className="text-xs text-gray-500">Total medical leave requests</p>
                    </CardContent>
                </Card>
            </div>

            {/* Leave Trends Chart */}
            <div className="grid gap-4 md:grid-cols-1">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Leave Trends</CardTitle>
                                <CardDescription>
                                    Number of approved leaves taken by employees {viewMode === 'monthly' ? 'each month' : 'each week'}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewMode('monthly')}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                        viewMode === 'monthly'
                                            ? 'bg-[#7559e0] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setViewMode('weekly')}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                        viewMode === 'weekly'
                                            ? 'bg-[#7559e0] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Weekly
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.leaveData[viewMode].map(item => ({
                                period: viewMode === 'monthly'
                                    ? new Date(item.period + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                    : item.period.replace(/^\d{4}-\d{2}-/, '').replace('W', 'Week '),
                                leaves: item.count
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="leaves" fill="#7559e0" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                {/* Recent Activity Feed - Admin Only */}
                {data.isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates across the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {data.recentActivity.map((activity, i) => (
                                <div key={activity.id} className="flex items-center gap-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-[#7559e0]">
                                        {activity.user.charAt(0)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{activity.user}</p>
                                        <p className="text-sm text-gray-500">{activity.action}</p>
                                    </div>
                                    <div className="text-xs text-gray-400">{activity.time}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                )}
            </div>
        </div>
    );
}
