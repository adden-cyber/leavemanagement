'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type LeaveRequest = {
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    type: string;
    managerNote?: string;
    employee: { fullName: string };
};

export default function LeavePage() {
    const { data: session } = useSession();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);

    // Form states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [leaveType, setLeaveType] = useState('ANNUAL');
    const [isLeaveTypeExpanded, setIsLeaveTypeExpanded] = useState(false);

    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                const res = await fetch('/api/leave');
                if (res.ok) {
                    const data = await res.json();
                    const leavesData = Array.isArray(data) ? data : data?.leaves ?? [];
                    setLeaves(leavesData);
                } else {
                    console.error('Failed to fetch leaves:', res.status, await res.text());
                }
            } catch (error) {
                console.error("Failed to fetch leaves", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaves();
    }, [refresh]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/leave', {
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
    const formContainerMaxWidth = isAdmin ? 'max-w-5xl' : 'max-w-7xl';

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Apply for a Leave</h1>
                </div>
            </div>

            {/* Application Form */}
            <div className={`bg-white p-10 md:p-14 rounded-lg border border-slate-100 shadow-xl shadow-slate-200/50 ${formContainerMaxWidth} mx-auto backdrop-blur-sm bg-white/90`}>
                <form onSubmit={handleSubmit} className="space-y-10">

                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700 tracking-wide">LEAVE TYPE</label>
                        
                        {/* Mobile collapsible dropdown */}
                        <div className="md:hidden">
                            <button
                                type="button"
                                onClick={() => setIsLeaveTypeExpanded(!isLeaveTypeExpanded)}
                                className="w-full px-6 py-5 border-2 border-slate-200 bg-white rounded-lg text-left flex items-center justify-between hover:border-slate-300 transition-all"
                            >
                                <span className="text-base font-medium text-slate-900">
                                    {leaveType} LEAVE
                                </span>
                                <svg
                                    className={`w-5 h-5 text-slate-500 transition-transform ${isLeaveTypeExpanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {isLeaveTypeExpanded && (
                                <div className="mt-2 border border-slate-200 rounded-lg bg-white shadow-lg">
                                    {['ANNUAL', 'UNPAID', 'MEDICAL'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setLeaveType(type);
                                                setIsLeaveTypeExpanded(false);
                                            }}
                                            className="w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-slate-100 last:border-b-0"
                                        >
                                            <span className="text-base font-medium text-slate-900">{type} LEAVE</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Desktop radio buttons */}
                        <div className="hidden md:grid md:grid-cols-3 gap-6">
                            {['ANNUAL', 'UNPAID', 'MEDICAL'].map((type) => (
                                <label key={type} className={`
                                    relative flex items-center justify-center gap-3 px-6 py-5 rounded-lg cursor-pointer transition-all border-2
                                    ${leaveType === type
                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20 transform scale-[1.02]'
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
                                    <span className="text-sm font-bold tracking-wide">
                                        {type} LEAVE
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700 tracking-wide">START DATE</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                required
                                className="md:w-full w-48 px-8 py-6 border-0 bg-white rounded-lg text-lg text-slate-900 font-medium shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700 tracking-wide">END DATE</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                required
                                className="md:w-full w-48 px-8 py-6 border-0 bg-white rounded-lg text-lg text-slate-900 font-medium shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700 tracking-wide">REASON</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            required
                            rows={4}
                            placeholder="Please provide details about your leave request..."
                            className="w-full px-6 py-4 border-0 bg-white rounded-lg text-base text-slate-900 font-medium shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all resize-none placeholder:text-slate-300"
                        ></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-14 py-7 bg-slate-900 text-white text-xl font-bold rounded-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] w-full md:w-auto">
                            Submit Application
                        </button>
                    </div>
                </form>
            </div>

            {/* Leave Requests Table */}
            <div className="bg-white border border-slate-100 rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-900">Leave History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 font-semibold text-slate-700">Name</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Date</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Type</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Reason</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Status</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Note</th>
                                <th className="px-8 py-5 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leaves.length === 0 ? (
                                <tr><td colSpan={7} className="px-8 py-12 text-center text-slate-500">No leave requests found.</td></tr>
                            ) : (
                                leaves.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 font-medium text-slate-900">{leave.employee.fullName}</td>
                                        <td className="px-8 py-5 text-slate-600 text-sm">
                                            {new Date(leave.startDate).toLocaleDateString()} <br />
                                            <span className="text-slate-400">to</span> <br />
                                            {new Date(leave.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
                                                {leave.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-slate-600 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-slate-500 italic text-sm">{leave.managerNote || '-'}</td>
                                        <td className="px-8 py-5 text-right">
                                            {isAdmin && (
                                                <div className="flex flex-col gap-2 items-end">
                                                    {leave.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    const note = prompt("Reason for approval (optional):", "Approved");
                                                                    if (note !== null) handleAction(leave.id, 'APPROVED', note);
                                                                }}
                                                                className="text-white text-xs font-bold bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors w-24 text-center"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const note = prompt("Reason for rejection (required):");
                                                                    if (note) handleAction(leave.id, 'REJECTED', note);
                                                                }}
                                                                className="text-white text-xs font-bold bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors w-24 text-center"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(leave.id)}
                                                        className="text-white text-xs font-bold bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors w-24 text-center"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
