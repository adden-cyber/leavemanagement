'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDashboardCache } from '@/lib/DashboardCacheContext';

type LeaveRequest = {
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    type: string;
    managerNote?: string;
    managerSignature?: string;
    employee: { fullName: string };
};

export default function LeaveHistoryView() {
    const { data: session } = useSession();
    const { getCache, setCache, clearCache } = useDashboardCache();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const isAdmin = session?.user?.role === 'ADMIN';

    useEffect(() => {
        async function fetchLeaves() {
            try {
                setLoading(true);
                
                // Try to get from cache first
                const cachedLeaves = getCache('leaves');
                if (cachedLeaves) {
                    setLeaves(cachedLeaves);
                    setLoading(false);
                    return;
                }
                
                const res = await fetch('/api/leave');
                if (!res.ok) throw new Error('Failed to load leave history');
                const data = await res.json();
                const leavesData = Array.isArray(data) ? data : data?.leaves ?? [];
                setLeaves(leavesData);
                setCache('leaves', leavesData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaves();
    }, [refreshTrigger]);

    // Check periodically if cache was cleared and refetch if needed
    useEffect(() => {
        const interval = setInterval(() => {
            const cachedLeaves = getCache('leaves');
            if (!cachedLeaves && leaves.length > 0) {
                // Cache was cleared, trigger refetch
                setRefreshTrigger(prev => prev + 1);
            }
        }, 1000); // Check every second

        return () => clearInterval(interval);
    }, [leaves]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7559e0] border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 items-center justify-center text-red-500">
                Error loading leave history: {error}
            </div>
        );
    }

    const title = isAdmin ? 'Leave History (All Employees)' : 'My Leave History';
    const subtitle = isAdmin
        ? 'Review all leave requests across the organization.'
        : 'Track your submitted leave requests and statuses.';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
                        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Leave Requests</CardTitle>
                    <CardDescription>Showing most recent requests first</CardDescription>
                </CardHeader>
                <CardContent>
                    {leaves.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-gray-500 font-medium">No leave requests found.</p>
                            <p className="text-gray-400 text-sm">Start by submitting a leave request from the Leave tab.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {leaves.map((leave) => (
                                <div key={leave.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{leave.employee.fullName}</div>
                                            <div className="text-xs text-slate-500">{leave.type} leave</div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                                leave.status === 'APPROVED'
                                                    ? 'bg-green-100 text-green-800'
                                                    : leave.status === 'PENDING'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {leave.status}
                                            </span>
                                            {leave.managerNote && (
                                                <span className="text-xs text-slate-400">Manager note: {leave.managerNote}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 text-sm text-slate-600">
                                        {leave.reason}
                                    </div>

                                    {leave.status === 'APPROVED' && leave.managerSignature && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <p className="text-xs font-medium text-slate-600 mb-2">Approved by:</p>
                                            <img
                                                src={leave.managerSignature}
                                                alt="Manager Signature"
                                                className="h-12 border border-slate-200 rounded"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
