'use client';

import { useState, useEffect } from 'react';

interface Benefit {
    id: string;
    type: string;
    provider: string | null;
    coverage: string | null;
    cost: number;
    startDate: string;
    status: string;
    employee: { fullName: string };
}

interface Employee {
    id: string;
    fullName: string;
}

export default function BenefitsView() {
    const [benefits, setBenefits] = useState<Benefit[]>([]);
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
            const [benRes, empRes] = await Promise.all([
                fetch('/api/benefits'),
                fetch('/api/directory')
            ]);

            if (benRes.ok) setBenefits(await benRes.json());
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
            const res = await fetch('/api/benefits', {
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
                    <div className="p-3 bg-rose-500/10 rounded-xl">
                        <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Benefits Administration</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage employee health insurance, wellness, and perks.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all active:scale-[0.98] ${isCreating ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20'}`}
                >
                    {isCreating ? (
                        <>Cancel Registration</>
                    ) : (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Enroll Employee</>
                    )}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
                        <h3 className="text-lg font-bold text-slate-900">New Benefit Enrollment</h3>
                        <p className="text-sm text-slate-500">Provide details for the new health or wellness package.</p>
                    </div>
                    <form onSubmit={handleCreate} className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Employee</label>
                                <select
                                    name="employeeId"
                                    required
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-rose-500 focus:ring focus:ring-rose-500/20 transition-all sm:text-sm outline-none appearance-none"
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Benefit Type</label>
                                <select
                                    name="type"
                                    required
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-rose-500 focus:ring focus:ring-rose-500/20 transition-all sm:text-sm outline-none appearance-none"
                                >
                                    <option value="HEALTH_INSURANCE">Health Insurance</option>
                                    <option value="DENTAL_VISION">Dental & Vision</option>
                                    <option value="GYM_MEMBERSHIP">Gym Membership</option>
                                    <option value="WELLNESS_STIPEND">Wellness Stipend</option>
                                    <option value="401K_MATCH">Retirement Match</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Provider Name</label>
                                <input
                                    name="provider"
                                    placeholder="e.g. BlueCross, PlanetFitness"
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-rose-500 focus:ring focus:ring-rose-500/20 transition-all sm:text-sm outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Coverage Level</label>
                                <select
                                    name="coverage"
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-rose-500 focus:ring focus:ring-rose-500/20 transition-all sm:text-sm outline-none appearance-none"
                                >
                                    <option value="INDIVIDUAL">Individual</option>
                                    <option value="FAMILY">Family Coverage</option>
                                    <option value="N/A">Not Applicable</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Monthly Cost ($)</label>
                                <input
                                    name="cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    defaultValue="0"
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-rose-500 focus:ring focus:ring-rose-500/20 transition-all sm:text-sm outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Start Date</label>
                                <input
                                    name="startDate"
                                    type="date"
                                    required
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-rose-500 focus:ring focus:ring-rose-500/20 transition-all sm:text-sm outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button type="submit" className="px-6 py-3 text-sm font-semibold text-white bg-rose-600 rounded-xl shadow-sm shadow-rose-500/20 hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Complete Enrollment
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center justify-center animate-in fade-in">
                    <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Loading benefit packages...</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Employee</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Benefit Plan</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Coverage</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">Monthly Cost</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {benefits.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-1">No active benefit enrollments</h3>
                                                <p className="text-slate-500 text-sm max-w-sm">No employees are currently enrolled in any benefit packages. Create an enrollment to start tracking.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    benefits.map((benefit) => (
                                        <tr key={benefit.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold shadow-sm">
                                                        {benefit.employee.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{benefit.employee.fullName}</div>
                                                        <div className="text-xs text-slate-500 font-medium">{new Date(benefit.startDate).getFullYear()} Plan</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-900 font-bold capitalize">{benefit.type.replace('_', ' ').toLowerCase()}</div>
                                                <div className="text-xs text-slate-500 font-medium">{benefit.provider || 'Company Provided'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-600">
                                                    {benefit.coverage || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold">
                                                ${benefit.cost.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`px-2.5 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-md border ${benefit.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}>
                                                    {benefit.status}
                                                </span>
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
