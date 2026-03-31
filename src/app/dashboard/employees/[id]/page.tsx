'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Employee = {
    id: string;
    fullName: string;
    position: string;
    status: string;
    joinDate: string;
    icNo?: string;
    leaveQuota?: number;
    annualLeaveQuota?: number;
    medicalLeaveQuota?: number;
    unpaidLeaveQuota?: number;
    user: {
        username: string;
        role?: string;
    }
};

type LeaveUsage = {
    annual: number;
    medical: number;
    unpaid: number;
};

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [employee, setEmployee] = useState<Employee | null>(null);
    const targetIsAdmin = employee?.user?.role === 'ADMIN';
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    const [leaveUsage, setLeaveUsage] = useState<LeaveUsage>({ annual: 0, medical: 0, unpaid: 0 });
    const [quotaForm, setQuotaForm] = useState({ leaveQuota: 38 });
    const [updatingQuotas, setUpdatingQuotas] = useState(false);
    const [message, setMessage] = useState('');

    // Edit form states
    const [fullName, setFullName] = useState('');
    const [position, setPosition] = useState('');
    const [status, setStatus] = useState('PERMANENT');
    const [joinDate, setJoinDate] = useState('');

    useEffect(() => {
        const loadData = async () => {
            const fetchEmployee = async () => {
                try {
                    const res = await fetch(`/api/employees/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setEmployee(data);
                        setFullName(data.fullName);
                        setPosition(data.position);
                        setStatus(data.status ?? 'PERMANENT');
                        setJoinDate(data.joinDate ? new Date(data.joinDate).toISOString().split('T')[0] : '');
                        setQuotaForm({
                            leaveQuota: data.leaveQuota ?? (data.annualLeaveQuota || data.medicalLeaveQuota || data.unpaidLeaveQuota || 38),
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch employee", error);
                } finally {
                    setLoading(false);
                }
            };

            const fetchLeaveSummary = async () => {
                try {
                    const res = await fetch(`/api/leave?employeeId=${id}&limit=1000`);
                    if (!res.ok) {
                        console.warn('Failed to fetch leave data', res.status);
                        return;
                    }
                    const data = await res.json();
                    const leaves = Array.isArray(data.leaves) ? data.leaves : [];
                    const summary = leaves.reduce((acc: LeaveUsage, leave: any) => {
                        if (leave.status === 'APPROVED') {
                            if (leave.type === 'ANNUAL') acc.annual += 1;
                            if (leave.type === 'MEDICAL') acc.medical += 1;
                            if (leave.type === 'UNPAID') acc.unpaid += 1;
                        }
                        return acc;
                    }, { annual: 0, medical: 0, unpaid: 0 });
                    setLeaveUsage(summary);
                } catch (error) {
                    console.error('Failed to fetch leave summary', error);
                }
            };

            await fetchEmployee();
            await fetchLeaveSummary();
        };

        void loadData();
    }, [id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Logic to update employee
            const res = await fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, position, status, joinDate }),
            });
            if (res.ok) {
                setEditing(false);
                router.refresh(); // Refresh data not actually triggering re-fetch in client component usually w/o router.refresh and server components, but here manual update
                // manually update local state for immediate feedback
                setEmployee(prev => prev ? ({ ...prev, fullName, position, status, joinDate }) : null);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateQuotas = async () => {
        if (!isAdmin || !employee) return;
        setUpdatingQuotas(true);
        try {
            const res = await fetch(`/api/employees/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: employee.user?.role,
                    position: employee.position,
                    status: employee.status,
                    fullName: employee.fullName,
                    icNo: employee.icNo,
                    leaveQuota: quotaForm.leaveQuota,
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setEmployee(updated);
                setMessage('Leave quotas updated successfully');
            } else {
                const err = await res.json();
                setMessage(err?.message || 'Failed to update quotas');
            }
        } catch (error) {
            console.error('Error updating quotas', error);
            setMessage('Error updating quotas.');
        } finally {
            setUpdatingQuotas(false);
            setTimeout(() => setMessage(''), 4000);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!employee) return <div>Employee not found</div>;

    const totalLeaveUsed = leaveUsage.annual + leaveUsage.medical + leaveUsage.unpaid;
    const totalQuota = targetIsAdmin ? 0 : (employee.leaveQuota ?? quotaForm.leaveQuota ?? 38);
    const totalRemaining = Math.max(0, totalQuota - totalLeaveUsed);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        ← Return
                    </button>
                    <h3 className="text-gray-700 text-3xl font-medium">{isAdmin ? 'Leave Management' : 'Leave Credits'}</h3>
                </div>
                <div>
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg text-white bg-blue-600 rounded-md hover:bg-blue-500"
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-md shadow-md">
                {editing ? (
                    <form onSubmit={handleUpdate}>
                        <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
                            <div>
                                <label className="text-gray-700">Full Name</label>
                                <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full mt-2 border-gray-200 rounded-md" />
                            </div>
                            <div>
                                <label className="text-gray-700">Position</label>
                                <input value={position} onChange={e => setPosition(e.target.value)} className="w-full mt-2 border-gray-200 rounded-md" />
                            </div>
                            <div>
                                <label className="text-gray-700">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full mt-2 border-gray-200 rounded-md">
                                    <option value="PERMANENT">Permanent</option>
                                    <option value="PROBATION">Probation</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-700">Join Date</label>
                                <input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} className="w-full mt-2 border-gray-200 rounded-md" />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button type="button" onClick={() => setEditing(false)} className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                            <button type="submit" className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save</button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
                        <div>
                            <label className="text-gray-700 font-bold">Full Name</label>
                            <p>{employee.fullName}</p>
                        </div>
                        <div>
                            <label className="text-gray-700 font-bold">Username</label>
                            <p>{employee.user?.username}</p>
                        </div>
                        <div>
                            <label className="text-gray-700 font-bold">Position</label>
                            <p>{employee.position}</p>
                        </div>
                        <div>
                            <label className="text-gray-700 font-bold">Status</label>
                            <p>{employee.status}</p>
                        </div>
                        <div>
                            <label className="text-gray-700 font-bold">Join Date</label>
                            <p>{new Date(employee.joinDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                )}
            </div>

            {isAdmin && !targetIsAdmin && (
                <div className="bg-white p-6 rounded-md shadow-md mt-6">
                    <h4 className="font-semibold mb-3 text-xl">Adjust leave quotas</h4>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-end gap-3">
                            <div className="flex-1 max-w-xs">
                                <label className="block text-sm text-slate-600 mb-1">Unified leave quota</label>
                                <input type="number" min={0} value={quotaForm.leaveQuota} onChange={e => setQuotaForm({ ...quotaForm, leaveQuota: Number(e.target.value) })} className="w-full rounded-md border p-2" />
                            </div>
                            <button onClick={handleUpdateQuotas} disabled={updatingQuotas} className="px-6 py-2 text-base rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap">{updatingQuotas ? 'Saving...' : 'Save quotas'}</button>
                        </div>
                        <p className="text-xs text-slate-500">This gets stored as the one global quota for the employee; leave types are tracked via requests.</p>
                        {message && <p className="text-sm text-green-600">{message}</p>}
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-md shadow-md mt-6">
                <h3 className="text-xl font-semibold mb-4">Leave Quota & Usage</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                        <p className="text-sm text-slate-500">Total leave quota</p>
                        <p className="text-2xl font-bold">{targetIsAdmin ? 'N/A' : `${totalQuota}`}</p>
                        <p className="text-xs text-slate-500">Taken: {targetIsAdmin ? 'N/A' : totalLeaveUsed}</p>
                        <p className="text-xs text-slate-500">Remaining: {targetIsAdmin ? 'N/A' : totalRemaining}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <p className="text-sm text-slate-500">Recorded leave by type</p>
                        <p className="text-xs text-slate-500">Annual: {leaveUsage.annual}</p>
                        <p className="text-xs text-slate-500">Medical: {leaveUsage.medical}</p>
                        <p className="text-xs text-slate-500">Unpaid: {leaveUsage.unpaid}</p>
                    </div>
                </div>

                {isAdmin && targetIsAdmin && (
                    <div className="mt-6 border-t pt-5">
                        <h4 className="font-semibold mb-3">Leave Quota Exempt (Admin)</h4>
                        <p className="text-sm text-slate-600">Admin accounts do not have personal leave quotas and are only used for employee leave management.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
