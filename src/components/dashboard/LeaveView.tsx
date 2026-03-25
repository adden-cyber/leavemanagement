'use client';

import { useState, useEffect, useRef } from 'react';
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
    managerSignature?: string;
    employee: { fullName: string; icNo?: string | null };
};

type PaginationData = {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};

export default function LeaveView() {
    const { data: session } = useSession();
    const { getCache, setCache, clearCache } = useDashboardCache();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('');

    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedLeaveForApproval, setSelectedLeaveForApproval] = useState<string | null>(null);
    const [managerNoteInput, setManagerNoteInput] = useState('Approved');
    const [signatureDataUrl, setSignatureDataUrl] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Form states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [leaveType, setLeaveType] = useState('ANNUAL');

    const cacheKey = `leaves_list_${session?.user?.id || 'anon'}_${currentPage}_${statusFilter}`;

    useEffect(() => {
        const fetchLeaves = async () => {
            // Check cache first (only on initial load, not on refresh)
            if (refresh === 0) {
                const cachedLeaves = getCache(cacheKey);
                if (cachedLeaves) {
                    setLeaves(cachedLeaves.leaves || []);
                    setPagination(cachedLeaves.pagination || null);
                    setLoading(false);
                    return;
                }
            }

            try {
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: '20'
                });
                if (statusFilter) params.append('status', statusFilter);

                const res = await fetch(`/api/leave?${params}`, {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    setLeaves(data.leaves || []);
                    setPagination(data.pagination || null);
                    setCache(cacheKey, data);
                }
            } catch (error) {
                console.error("Failed to fetch leaves", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaves();
    }, [refresh, cacheKey, currentPage, statusFilter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
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
                const errorData = await res.json().catch(() => ({}));
                alert(`Failed to apply: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting leave:', error);
            alert("An error occurred while submitting your leave request. Please try again.");
        }
    };

    const handleAction = async (id: string, status: string, note: string, managerSignature?: string) => {
        try {
            const payload: any = { status, managerNote: note };
            if (managerSignature) payload.managerSignature = managerSignature;

            const res = await fetch(`/api/leave/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setRefresh(prev => prev + 1);
                clearCache('leaves');
                setShowSignatureModal(false);
                setSelectedLeaveForApproval(null);
                setSignatureDataUrl('');
                setManagerNoteInput('Approved');
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(`Failed to update leave request: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating leave request:', error);
            alert("An error occurred while updating the leave request. Please try again.");
        }
    };

    const clearSignature = () => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureDataUrl('');
    };

    const finalizeSignature = () => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        setSignatureDataUrl(canvas.toDataURL('image/png'));
    };

    const handleStartApproval = (leaveId: string, leaveNote = 'Approved') => {
        setSelectedLeaveForApproval(leaveId);
        setManagerNoteInput(leaveNote);
        setShowSignatureModal(true);
        setTimeout(() => clearSignature(), 0); // Clear canvas after modal open
    };

    const handleSubmitApproval = async () => {
        if (!selectedLeaveForApproval) return;
        if (!signatureDataUrl) {
            alert('Please sign before approving');
            return;
        }
        await handleAction(selectedLeaveForApproval, 'APPROVED', managerNoteInput || 'Approved', signatureDataUrl);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        setIsDrawing(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        finalizeSignature();
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        setIsDrawing(true);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        if (!isDrawing) return;
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const handleMouseLeave = () => {
        if (isDrawing) {
            setIsDrawing(false);
            finalizeSignature();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this leave request?")) return;
        try {
            const res = await fetch(`/api/leave/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                setRefresh(prev => prev + 1);
                alert("Leave request deleted successfully");
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(`Failed to delete leave request: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting leave request:', error);
            alert("An error occurred while deleting the leave request. Please try again.");
        }
    };


    if (loading) return <div>Loading...</div>;

    const isAdmin = session?.user?.role === 'ADMIN';
    const containerMaxWidth = isAdmin ? 'max-w-6xl' : 'max-w-7xl';

    return (
        <div className={`space-y-8 animate-in fade-in duration-500 ${containerMaxWidth} mx-auto pb-10`}>
            {showSignatureModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900">Admin Signature for Approval</h3>
                        <p className="text-sm text-slate-500 mb-4">Please sign before confirming approval.</p>

                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <canvas
                                ref={signatureCanvasRef}
                                width={600}
                                height={240}
                                className="w-full h-60 bg-slate-50 touch-none"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={() => { setIsDrawing(false); finalizeSignature(); }}
                            />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={clearSignature} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Clear</button>
                            <button type="button" onClick={handleSubmitApproval} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Confirm Approval</button>
                            <button type="button" onClick={() => setShowSignatureModal(false)} className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200">Cancel</button>
                        </div>

                        {signatureDataUrl && (
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-slate-700">Preview</h4>
                                <img src={signatureDataUrl} alt="Signature preview" className="mt-2 max-h-32 border border-slate-200" />
                            </div>
                        )}

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-600 mb-1">Manager Note</label>
                            <textarea
                                value={managerNoteInput}
                                onChange={(e) => setManagerNoteInput(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                            />
                        </div>
                    </div>
                </div>
            )}

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
                                        <td className="px-6 py-4 space-y-1">
                                            <span className="text-sm text-slate-500 italic max-w-[150px] truncate block" title={leave.managerNote || ''}>{leave.managerNote || '-'}</span>
                                            {leave.managerSignature ? (
                                                <img src={leave.managerSignature} alt="Signature" className="h-10 w-40 object-contain border border-slate-200" />
                                            ) : null}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {leave.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStartApproval(leave.id, leave.managerNote || 'Approved')}
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
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 transition-colors"
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

                {/* Pagination and Filters */}
                {pagination && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-slate-600">
                                Showing {leaves.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} requests
                            </div>
                            {isAdmin && (
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1); // Reset to first page when filter changes
                                    }}
                                    className="text-sm border border-slate-200 rounded-lg px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={!pagination.hasPrev}
                                className="px-3 py-1 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-slate-600">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={!pagination.hasNext}
                                className="px-3 py-1 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Leave History for Non-Admins */}
            {!isAdmin && leaves.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg font-semibold text-slate-900">Your Leave History</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {leaves.map((leave) => (
                            <div key={leave.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border 
                                                ${leave.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    leave.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${leave.status === 'APPROVED' ? 'bg-green-500' :
                                                    leave.status === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'
                                                    }`}></span>
                                                {leave.status}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                {leave.type}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600 mb-2">
                                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                        </div>
                                        <p className="text-sm text-slate-700">{leave.reason}</p>
                                        {leave.managerNote && (
                                            <p className="text-sm text-slate-500 italic mt-2">Note: {leave.managerNote}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination for Non-Admins */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="text-sm text-slate-600">
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={!pagination.hasPrev}
                                    className="px-3 py-1 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    disabled={!pagination.hasNext}
                                    className="px-3 py-1 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
