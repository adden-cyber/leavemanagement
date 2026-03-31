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
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
                <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
            </div>

            {/* KPI cards - all three in one row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 items-start">
                <Card className="p-3">
                    <CardHeader className="flex flex-row items-center justify-between pb-1">
                        <CardTitle className="text-xs font-semibold text-gray-500">Leaves This Month</CardTitle>
                        <span className="text-sm">📄</span>
                    </CardHeader>
                    <CardContent className="p-2 pt-1">
                        <div className="text-xl font-bold text-gray-900 leading-none">{data.leavesThisMonth}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            <span className="text-green-500 font-medium">+{data.newHiresThisMonth}</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="p-3">
                    <CardHeader className="flex flex-row items-center justify-between pb-1">
                        <CardTitle className="text-xs font-semibold text-gray-500">System Status</CardTitle>
                        <span className="text-sm">✓</span>
                    </CardHeader>
                    <CardContent className="p-2 pt-1">
                        {data.isAdmin && data.pendingLeaveRequests && data.pendingLeaveRequests > 0 ? (
                            <>
                                <div className="text-xl font-bold text-gray-900 leading-none">{data.pendingLeaveRequests} pending</div>
                                <p className="text-xs text-gray-500">Pending leave approvals</p>
                            </>
                        ) : (
                            <>
                                <div className="text-xl font-bold text-green-600 leading-none">All Good</div>
                                <p className="text-xs text-gray-500">No pending actions</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {!data.isAdmin && (
                    <Card className="p-3">
                        <CardHeader className="flex flex-row items-center justify-between pb-1">
                            <CardTitle className="text-xs font-semibold text-gray-500">My Leaves Applied</CardTitle>
                            <span className="text-sm">🌴</span>
                        </CardHeader>
                        <CardContent className="p-2 pt-1">
                            <div className="text-xl font-bold text-gray-900 leading-none">{data.myTotalLeavesApplied || 0}</div>
                            <p className="text-xs text-gray-500 cursor-pointer hover:text-[#7559e0]">View history</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Leave Type Stats */}
            <div className="grid gap-4">
                <div className="md:hidden">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Leave Request Summary</CardTitle>
                            <span className="text-lg">•</span>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Annual</span>
                                    <span className="font-bold">{data.annualLeaves}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Unpaid</span>
                                    <span className="font-bold">{data.unpaidLeaves}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Medical</span>
                                    <span className="font-bold">{data.medicalLeaves}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="hidden md:grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Annual Leaves</CardTitle>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{data.annualLeaves}</div>
                            <p className="text-xs text-gray-500">Total annual leave requests</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Unpaid Leaves</CardTitle>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{data.unpaidLeaves}</div>
                            <p className="text-xs text-gray-500">Total unpaid leave requests</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Medical Leaves</CardTitle>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{data.medicalLeaves}</div>
                            <p className="text-xs text-gray-500">Total medical leave requests</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Leave Trends Chart */}
            <div className="grid gap-4 md:grid-cols-1">
                <Card>
                    <CardHeader className="pt-6">
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
                    <CardHeader className="pt-6">
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates across the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {data.recentActivity.map((activity, i) => (
                                <div key={activity.id} className="flex items-start gap-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-[#7559e0] flex-shrink-0">
                                        {activity.user.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <p className="text-sm font-medium leading-none break-words">{activity.user}</p>
                                        <p className="text-sm text-gray-500 break-words">{activity.action}</p>
                                    </div>
                                    <div className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{activity.time}</div>
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
