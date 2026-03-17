'use client';

import { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/api';

interface Asset {
    id: string;
    name: string;
    category: string;
    serialNumber: string | null;
    status: string;
    employee: { fullName: string } | null;
}

interface Employee {
    id: string;
    fullName: string;
}

export default function AssetsView() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [assRes, empRes] = await Promise.all([
                fetch(apiUrl('/api/assets')),
                fetch(apiUrl('/api/directory'))
            ]);

            if (assRes.ok) setAssets(await assRes.json());
            if (empRes.ok) setEmployees(await empRes.json());

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            const res = await fetch(apiUrl('/api/assets'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData)),
            });
            if (res.ok) {
                setIsCreating(false);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Equipment & Assets</h2>
                        <p className="text-sm text-slate-500 mt-1">Track company hardware, software, and other assets.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all active:scale-[0.98] ${isCreating ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'}`}
                >
                    {isCreating ? (
                        <>Cancel Registration</>
                    ) : (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Register Asset</>
                    )}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
                        <h3 className="text-lg font-bold text-slate-900">Register New Asset</h3>
                        <p className="text-sm text-slate-500">Provide details for the new equipment or software license.</p>
                    </div>
                    <form onSubmit={handleCreate} className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Asset Name</label>
                                <input
                                    name="name"
                                    required
                                    placeholder="e.g. MacBook Pro 16"
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-all sm:text-sm outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Category</label>
                                <select
                                    name="category"
                                    required
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-all sm:text-sm outline-none appearance-none"
                                >
                                    <option value="LAPTOP">Laptop / PC</option>
                                    <option value="MONITOR">Monitor / Display</option>
                                    <option value="PHONE">Mobile Device</option>
                                    <option value="SOFTWARE">Software License</option>
                                    <option value="PERIPHERAL">Peripheral (Mouse, Keyboard)</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Serial/License Number</label>
                                <input
                                    name="serialNumber"
                                    placeholder="Optional"
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-all sm:text-sm outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Assign To (Optional)</label>
                                <select
                                    name="employeeId"
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-all sm:text-sm outline-none appearance-none"
                                >
                                    <option value="">Keep in inventory...</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button type="submit" className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Save Asset
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center justify-center animate-in fade-in">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Loading inventory...</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Asset</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Category</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Assigned To</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {assets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-1">Company inventory is empty</h3>
                                                <p className="text-slate-500 text-sm max-w-sm">There are no assets registered yet. Add equipment or software to start tracking.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    assets.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-900">{asset.name}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{asset.serialNumber || 'No Serial Number'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-600">
                                                    {asset.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-md border ${asset.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    asset.status === 'ASSIGNED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}>
                                                    {asset.status === 'AVAILABLE' ? 'In Inventory' : asset.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {asset.employee ? (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shadow-sm">
                                                            {asset.employee.fullName.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700">{asset.employee.fullName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm italic text-slate-400">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100">
                                                    Edit
                                                </button>
                                            </td>
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
