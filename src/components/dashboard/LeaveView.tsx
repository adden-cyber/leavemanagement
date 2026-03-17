'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboardCache } from '@/lib/DashboardCacheContext';
import { apiUrl } from '@/lib/api';

type LeaveRequest = {
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    type: string;
    managerNote?: string;
    employee: { fullName: string; icNo?: string | null };
};

export default function LeaveView() {
    const { data: session } = useSession();
    const { getCache, setCache } = useDashboardCache();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);

    // Form states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [leaveType, setLeaveType] = useState('ANNUAL');

    const cacheKey = `leaves_list_${session?.user?.id || 'anon'}`;

    useEffect(() => {
        const fetchLeaves = async () => {
            // Check cache first (only on initial load, not on refresh)
            if (refresh === 0) {
                const cachedLeaves = getCache(cacheKey);
                if (cachedLeaves) {
                    setLeaves(cachedLeaves);
                    setLoading(false);
                    return;
                }
            }

            try {
                const res = await fetch(apiUrl('/api/leave'));
                if (res.ok) {
                    const data = await res.json();
                    setLeaves(data);
                    setCache(cacheKey, data);
                }
            } catch (error) {
                console.error("Failed to fetch leaves", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaves();
    }, [refresh, cacheKey]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(apiUrl('/api/leave'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate, endDate, reason, type: leaveType }),
            });
            if (res.ok) {
                setRefresh(prev => prev + 1);
                setStartDate('');
                setEndDate('');
                setReason('');
                setLeaveType('ANNUAL');
                alert("Leave applied successfully!");
            } else {
                alert("Failed to apply");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAction = async (id: string, status: string, note: string) => {
        try {
            const res = await fetch(`/api/leave/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, managerNote: note }),
            });
            if (res.ok) {
                setRefresh(prev => prev + 1);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this leave request?")) return;
        try {
            const res = await fetch(`/api/leave/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setRefresh(prev => prev + 1);
                alert("Leave request deleted successfully");
            } else {
                alert("Failed to delete leave request");
            }
        } catch (error) {
            console.error(error);
        }
    };


    if (loading) return <div>Loading...</div>;

    const isAdmin = session?.user?.role === 'ADMIN';
    const containerMaxWidth = isAdmin ? 'max-w-6xl' : 'max-w-7xl';

    return (
        <div className={`space-y-8 animate-in fade-in duration-500 ${containerMaxWidth} mx-auto pb-10`}>
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {isAdmin ? 'Leave Management' : 'Apply for Leave'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {isAdmin ? 'Manage and review employee leave applications' : 'Submit and track your leave requests'}
                        </p>
                    </div>
                </div>

            </div>

            {/* Application Form - Hidden for Admins */}
            {!isAdmin && (
                <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                        <h3 className="text-lg font-semibold text-slate-900">New Leave Request</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Leave Type</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {['ANNUAL', 'UNPAID', 'MEDICAL'].map((type) => (
                                    <label key={type} className={`
                                        relative flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all border-2
                                        ${leaveType === type
                                            ? 'border-red-500 bg-red-50/50 text-red-700'
                                            : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                                        }
                                    `}>
                                        <input
                                            type="radio"
                                            name="leaveType"
                                            value={type}
                                            checked={leaveType === type}
                                            onChange={(e) => setLeaveType(e.target.value)}
                                            className="sr-only"
                                        />
                                        <span className="text-sm font-bold tracking-wide uppercase">
                                            {type} LEAVE
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    required
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-red-500 focus:ring focus:ring-red-500/20 transition-all sm:text-sm outline-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    required
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-red-500 focus:ring focus:ring-red-500/20 transition-all sm:text-sm outline-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                required
                                rows={4}
                                placeholder="Please provide details about your leave request..."
                                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-red-500 focus:ring focus:ring-red-500/20 transition-all sm:text-sm resize-y outline-none placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" className="flex items-center gap-2 rounded-xl bg-red-500 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition-all active:scale-[0.98] w-full md:w-auto justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                Submit Application
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Leave Requests Table - Only for Admins */}
            {isAdmin && (
                <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg font-semibold text-slate-900">Leave Requests</h3>
                    </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">IC No</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Note</th>
                                {isAdmin && <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leaves.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-sm font-medium">No leave requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                leaves.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{leave.employee.fullName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600">{leave.employee.icNo || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <span className="text-slate-900 font-medium">{new Date(leave.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                <span className="text-slate-400 text-xs flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                                    Until
                                                </span>
                                                <span className="text-slate-900 font-medium">{new Date(leave.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                {leave.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600 max-w-[200px] truncate" title={leave.reason}>
                                                {leave.reason}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border 
                                                ${leave.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    leave.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${leave.status === 'APPROVED' ? 'bg-green-500' :
                                                    leave.status === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'
                                                    }`}></span>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-500 italic max-w-[150px] truncate block" title={leave.managerNote || ''}>{leave.managerNote || '-'}</span>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {leave.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    const note = prompt("Reason for approval (optional):", "Approved");
                                                                    if (note !== null) handleAction(leave.id, 'APPROVED', note);
                                                                }}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border border-green-200 transition-colors"
                                                                title="Approve"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const note = prompt("Reason for rejection (required):");
                                                                    if (note) handleAction(leave.id, 'REJECTED', note);
                                                                }}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 border border-amber-200 transition-colors"
                                                                title="Reject"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(leave.id)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            )}
        </div>
    );
}
