'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Employee {
    id: string;
    fullName: string;
    department: string;
}

interface ExpenseClaim {
    id: string;
    employeeId: string;
    date: string;
    type: string;
    amount: number;
    description: string;
    receiptUrl: string | null;
    status: string;
    managerNote: string | null;
    createdAt: string;
    employee?: Employee;
}

export default function ClaimsView() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<'my-claims' | 'all-claims'>('my-claims');
    const [claims, setClaims] = useState<ExpenseClaim[]>([]);
    const [loading, setLoading] = useState(true);

    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<ExpenseClaim | null>(null);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'TRAVEL',
        amount: 0,
        description: '',
        receiptUrl: ''
    });

    const [reviewForm, setReviewForm] = useState({
        status: 'APPROVED',
        managerNote: ''
    });

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/claims');
            if (res.ok) {
                const data = await res.json();
                setClaims(data);
            }
        } catch (error) {
            console.error("Failed to fetch claims", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
        if (isAdmin) {
            setActiveTab('all-claims');
        }
    }, [isAdmin]);

    const handleSubmitClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: Number(form.amount)
                })
            });
            if (res.ok) {
                setIsSubmitModalOpen(false);
                setForm({ date: new Date().toISOString().split('T')[0], type: 'TRAVEL', amount: 0, description: '', receiptUrl: '' });
                fetchClaims();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to submit claim");
            }
        } catch (error) {
            console.error("Submit error", error);
        }
    };

    const handleDeleteClaim = async (id: string) => {
        if (!confirm("Are you sure you want to delete this pending claim?")) return;
        try {
            const res = await fetch(`/api/claims?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchClaims();
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const handleReviewClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClaim) return;
        try {
            const res = await fetch('/api/claims', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedClaim.id,
                    status: reviewForm.status,
                    managerNote: reviewForm.managerNote
                })
            });
            if (res.ok) {
                setIsReviewModalOpen(false);
                fetchClaims();
            }
        } catch (error) {
            console.error("Review error", error);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'TRAVEL': return 'bg-blue-100 text-blue-800';
            case 'MEDICAL': return 'bg-red-100 text-red-800';
            case 'MEALS': return 'bg-orange-100 text-orange-800';
            case 'SUPPLIES': return 'bg-teal-100 text-teal-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    // Filter logic
    const displayedClaims = isAdmin && activeTab === 'all-claims'
        ? claims
        : claims; // In non-admin mode, the API only returns their own claims anyway

    if (loading) return <div className="text-center py-10 text-gray-500">Loading claims...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Expense & Claim Management</h2>
                        <p className="text-sm text-slate-500 mt-1">Submit, track, and manage employee expenses.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0">
                            <button
                                onClick={() => setActiveTab('my-claims')}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'my-claims' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
                            >
                                My Claims
                            </button>
                            <button
                                onClick={() => setActiveTab('all-claims')}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'all-claims' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
                            >
                                Company Claims
                            </button>
                        </div>
                    )}

                    {!isAdmin && (
                        <button
                            onClick={() => setIsSubmitModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Submit Claim
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                {isAdmin && <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Employee</th>}
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Type & Description</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayedClaims.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-slate-500 font-medium">No claims found.</td>
                                </tr>
                            ) : displayedClaims.map(claim => (
                                <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                                        {new Date(claim.date).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-slate-900">{claim.employee?.fullName || 'Unknown'}</div>
                                            <div className="text-sm font-medium text-slate-500 mt-0.5">{claim.employee?.department || '-'}</div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`px-2.5 py-1 inline-flex text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg border ${getTypeColor(claim.type)}`}>
                                                {claim.type}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-slate-700 truncate max-w-xs">{claim.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-slate-900">
                                        ${claim.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${getStatusColor(claim.status)}`}>
                                            {claim.status}
                                        </span>
                                        {claim.managerNote && (
                                            <p className="text-xs font-medium text-slate-500 mt-1.5 truncate max-w-[150px]" title={claim.managerNote}>
                                                <span className="text-slate-400">Note:</span> {claim.managerNote}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {isAdmin && claim.status === 'PENDING' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedClaim(claim);
                                                    setReviewForm({ status: 'APPROVED', managerNote: '' });
                                                    setIsReviewModalOpen(true);
                                                }}
                                                className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                Review
                                            </button>
                                        )}
                                        {!isAdmin && claim.status === 'PENDING' && (
                                            <button
                                                onClick={() => handleDeleteClaim(claim.id)}
                                                className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-50 hover:ring-red-300 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Submit Modal (Employee) */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Submit Expense Claim</h3>
                            <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-500 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitClaim} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date Incurred</label>
                                <input
                                    type="date" required
                                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-all sm:text-sm outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expense Type</label>
                                    <select
                                        value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-all sm:text-sm outline-none"
                                    >
                                        <option value="TRAVEL">Travel</option>
                                        <option value="MEDICAL">Medical</option>
                                        <option value="MEALS">Meals</option>
                                        <option value="SUPPLIES">Supplies</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                                    <input
                                        type="number" required min="0.01" step="0.01"
                                        value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-all sm:text-sm outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description / Reason</label>
                                <textarea
                                    required rows={3}
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-all sm:text-sm outline-none resize-none"
                                    placeholder="e.g. Client lunch with XYZ Corp"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsSubmitModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all">Submit Claim</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Modal (Admin) */}
            {isReviewModalOpen && selectedClaim && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Review Claim</h3>
                            <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-slate-500 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-6 text-sm space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Employee</span>
                                <span className="font-bold text-slate-900">{selectedClaim.employee?.fullName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Amount</span>
                                <span className="font-black text-slate-900 text-base">${selectedClaim.amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Type</span>
                                <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-md border ${getTypeColor(selectedClaim.type)}`}>{selectedClaim.type}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3 mt-3">
                                <span className="text-slate-500 font-medium block mb-1">Description</span>
                                <p className="text-slate-700">{selectedClaim.description}</p>
                            </div>
                        </div>
                        <form onSubmit={handleReviewClaim} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Decision</label>
                                <select
                                    value={reviewForm.status} onChange={e => setReviewForm({ ...reviewForm, status: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-all sm:text-sm outline-none"
                                >
                                    <option value="APPROVED">Approve Claim</option>
                                    <option value="REJECTED">Reject Claim</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Manager Note (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={reviewForm.managerNote} onChange={e => setReviewForm({ ...reviewForm, managerNote: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-all sm:text-sm outline-none resize-none"
                                    placeholder="Leave a note for the employee..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsReviewModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm active:scale-[0.98] transition-all flex items-center gap-2 ${reviewForm.status === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                    {reviewForm.status === 'APPROVED' ? (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Confirm Approval</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Confirm Rejection</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
