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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#7559e0] via-[#8b5cf6] to-[#a855f7] text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative max-w-7xl mx-auto px-6 py-16">
                    <div className="flex items-center justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">Welcome back!</h1>
                                    <p className="text-purple-100 text-lg">Here's what's happening in your organization today</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span>System Online</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="w-32 h-32 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center">
                                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Enhanced KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-12 relative z-10">
                    {/* Leaves This Month */}
                    <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:-translate-y-2">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-gray-900">{data.leavesThisMonth}</div>
                                    <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                                        +{data.newHiresThisMonth} new
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-600 mb-1">Leaves This Month</h3>
                            <p className="text-xs text-gray-500">Total leave requests processed</p>
                            <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500" style={{width: `${Math.min((data.leavesThisMonth / 50) * 100, 100)}%`}}></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Status */}
                    <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:-translate-y-2">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                    {data.isAdmin && data.pendingLeaveRequests && data.pendingLeaveRequests > 0 ? (
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <div className="text-right">
                                    {data.isAdmin && data.pendingLeaveRequests && data.pendingLeaveRequests > 0 ? (
                                        <div className="text-3xl font-bold text-orange-600">{data.pendingLeaveRequests}</div>
                                    ) : (
                                        <div className="text-3xl font-bold text-green-600">✓</div>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-600 mb-1">System Status</h3>
                            <p className="text-xs text-gray-500">
                                {data.isAdmin && data.pendingLeaveRequests && data.pendingLeaveRequests > 0
                                    ? 'Pending approvals requiring attention'
                                    : 'All systems running smoothly'
                                }
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${data.isAdmin && data.pendingLeaveRequests && data.pendingLeaveRequests > 0 ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
                                <span className="text-xs font-medium">
                                    {data.isAdmin && data.pendingLeaveRequests && data.pendingLeaveRequests > 0 ? 'Action Required' : 'All Good'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* My Leaves Applied - Only for non-admins */}
                    {!data.isAdmin && (
                        <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:-translate-y-2">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-gray-900">{data.myTotalLeavesApplied || 0}</div>
                                        <div className="text-xs text-purple-600 font-medium">this year</div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-semibold text-gray-600 mb-1">My Leave Balance</h3>
                                <p className="text-xs text-gray-500">Personal leave requests submitted</p>
                                <div className="mt-3">
                                    <button className="text-xs text-[#7559e0] hover:text-[#8b5cf6] font-medium transition-colors hover:underline">
                                        View detailed history →
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Enhanced Leave Statistics */}
                <div className="grid gap-6">
                    <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900">Leave Analytics</CardTitle>
                                    <CardDescription className="text-gray-600">Breakdown of leave types across your organization</CardDescription>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Annual</span>
                                    <div className="w-3 h-3 bg-orange-500 rounded-full ml-4"></div>
                                    <span className="text-sm text-gray-600">Unpaid</span>
                                    <div className="w-3 h-3 bg-red-500 rounded-full ml-4"></div>
                                    <span className="text-sm text-gray-600">Medical</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Mobile View */}
                            <div className="md:hidden space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">Annual Leaves</div>
                                                <div className="text-sm text-gray-600">Paid time off</div>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">{data.annualLeaves}</div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">Unpaid Leaves</div>
                                                <div className="text-sm text-gray-600">Without pay</div>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-orange-600">{data.unpaidLeaves}</div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">Medical Leaves</div>
                                                <div className="text-sm text-gray-600">Health related</div>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-red-600">{data.medicalLeaves}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop View */}
                            <div className="hidden md:grid md:grid-cols-3 gap-6">
                                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-blue-600">{data.annualLeaves}</div>
                                                <div className="text-xs text-blue-500 font-medium">requested</div>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Annual Leaves</h3>
                                        <p className="text-sm text-gray-600 mb-4">Standard paid time off requests</p>
                                        <div className="w-full bg-blue-200 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{width: `${Math.min((data.annualLeaves / Math.max(data.annualLeaves + data.unpaidLeaves + data.medicalLeaves, 1)) * 100, 100)}%`}}></div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-orange-600">{data.unpaidLeaves}</div>
                                                <div className="text-xs text-orange-500 font-medium">requested</div>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unpaid Leaves</h3>
                                        <p className="text-sm text-gray-600 mb-4">Leave without pay compensation</p>
                                        <div className="w-full bg-orange-200 rounded-full h-2">
                                            <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{width: `${Math.min((data.unpaidLeaves / Math.max(data.annualLeaves + data.unpaidLeaves + data.medicalLeaves, 1)) * 100, 100)}%`}}></div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-red-600">{data.medicalLeaves}</div>
                                                <div className="text-xs text-red-500 font-medium">requested</div>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Medical Leaves</h3>
                                        <p className="text-sm text-gray-600 mb-4">Health and medical related absences</p>
                                        <div className="w-full bg-red-200 rounded-full h-2">
                                            <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{width: `${Math.min((data.medicalLeaves / Math.max(data.annualLeaves + data.unpaidLeaves + data.medicalLeaves, 1)) * 100, 100)}%`}}></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Enhanced Chart Section */}
                <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-900">Leave Trends</CardTitle>
                                <CardDescription className="text-gray-600">
                                    Tracking leave patterns {viewMode === 'monthly' ? 'by month' : 'by week'}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('monthly')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                        viewMode === 'monthly'
                                            ? 'bg-white text-[#7559e0] shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setViewMode('weekly')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                        viewMode === 'weekly'
                                            ? 'bg-white text-[#7559e0] shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Weekly
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data.leaveData[viewMode].map(item => ({
                                        period: viewMode === 'monthly'
                                            ? new Date(item.period + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                            : item.period.replace(/^\d{4}-\d{2}-/, '').replace('W', 'Week '),
                                        leaves: item.count,
                                        fill: '#7559e0'
                                    }))}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7559e0" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="period"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                            fontSize: '14px'
                                        }}
                                        labelStyle={{ color: '#374151', fontWeight: '600' }}
                                    />
                                    <Bar
                                        dataKey="leaves"
                                        fill="url(#barGradient)"
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={1000}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Enhanced Activity Feed - Admin Only */}
                {data.isAdmin && (
                    <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#7559e0] to-[#8b5cf6] rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
                                    <CardDescription className="text-gray-600">Latest system activities and updates</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.recentActivity.map((activity, i) => (
                                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-shadow">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7559e0] to-[#8b5cf6] text-white font-semibold flex-shrink-0 shadow-lg">
                                            {activity.user.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-sm font-semibold leading-none text-gray-900 break-words">{activity.user}</p>
                                            <p className="text-sm text-gray-600 break-words">{activity.action}</p>
                                        </div>
                                        <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-full">
                                            {activity.time}
                                        </div>
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
