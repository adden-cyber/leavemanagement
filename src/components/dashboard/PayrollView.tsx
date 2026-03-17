'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
interface Employee {
    id: string;
    fullName: string;
    position: string;
    department: string;
    salary?: {
        baseSalary: number;
        allowance: number;
    };
}

interface Payroll {
    id: string;
    employeeId: string;
    month: number;
    year: number;
    basicPay: number;
    allowance: number;
    deductions: number;
    netPay: number;
    status: string;
    paymentDate: string | null;
    employee: Employee;
}

export default function PayrollView() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [activeTab, setActiveTab] = useState<'salaries' | 'history'>('salaries');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

    // Form state
    const [salaryForm, setSalaryForm] = useState({ baseSalary: 0, allowance: 0 });
    const [payrollForm, setPayrollForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), deductions: 0 });

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees');
            if (res.ok) {
                const emps = await res.json();

                // Fetch salaries to attach to employees
                const salRes = await fetch('/api/salary');
                if (salRes.ok) {
                    const salaries = await salRes.json();
                    const empsWithSalaries = emps.map((emp: any) => ({
                        ...emp,
                        salary: salaries.find((s: any) => s.employeeId === emp.id)
                    }));
                    setEmployees(empsWithSalaries);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPayrolls = async () => {
        try {
            const res = await fetch('/api/payroll');
            if (res.ok) {
                setPayrolls(await res.json());
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchEmployees(), fetchPayrolls()]);
            setLoading(false);
        };
        init();
    }, []);

    const handleSaveSalary = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        try {
            const res = await fetch('/api/salary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmployee.id,
                    baseSalary: salaryForm.baseSalary,
                    allowance: salaryForm.allowance
                })
            });

            if (res.ok) {
                setIsSalaryModalOpen(false);
                fetchEmployees();
            }
        } catch (error) {
            console.error("Failed to save salary", error);
        }
    };

    const handleGeneratePayroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        try {
            const res = await fetch('/api/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmployee.id,
                    month: payrollForm.month,
                    year: payrollForm.year,
                    deductions: payrollForm.deductions
                })
            });

            if (res.ok) {
                setIsPayrollModalOpen(false);
                fetchPayrolls();
                setActiveTab('history');
            } else {
                const err = await res.json();
                alert(err.message || "Failed to generate payroll");
            }
        } catch (error) {
            console.error("Failed to generate payroll", error);
        }
    };

    const handleMarkPaid = async (payrollId: string) => {
        try {
            const res = await fetch('/api/payroll', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: payrollId,
                    status: 'PAID',
                    paymentDate: new Date().toISOString()
                })
            });
            if (res.ok) {
                fetchPayrolls();
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    if (loading) return <div className="text-center py-10">Loading payroll data...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Payroll & Compensation</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage employee salaries and monthly payroll generation.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0">
                    <button
                        onClick={() => setActiveTab('salaries')}
                        className={`flex-1 px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'salaries' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                    >
                        Employee Salaries
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'history' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                    >
                        Payroll History
                    </button>
                </div>
            </div>

            {activeTab === 'salaries' && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Base Salary</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Allowance</th>
                                    {isAdmin && <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-slate-900 truncate max-w-[200px]">{emp.fullName}</div>
                                            <div className="text-sm font-medium text-slate-500 mt-0.5">{emp.position}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">{emp.department}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {emp.salary ? <span className="font-medium text-slate-900">${emp.salary.baseSalary.toFixed(2)}</span> : <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider border border-red-100">Not set</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-600">
                                            {emp.salary ? `$${emp.salary.allowance.toFixed(2)}` : '-'}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedEmployee(emp);
                                                        setSalaryForm({
                                                            baseSalary: emp.salary?.baseSalary || 0,
                                                            allowance: emp.salary?.allowance || 0
                                                        });
                                                        setIsSalaryModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-all"
                                                >
                                                    {emp.salary ? 'Edit Salary' : 'Set Salary'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedEmployee(emp);
                                                        setPayrollForm(prev => ({ ...prev, deductions: 0 }));
                                                        setIsPayrollModalOpen(true);
                                                    }}
                                                    disabled={!emp.salary}
                                                    className={`inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm transition-all ${emp.salary ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]' : 'bg-slate-100 text-slate-400 cursor-not-allowed hidden group-hover:inline-flex'}`}
                                                >
                                                    Generate
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Payroll Period</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Net Pay</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payrolls.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No payroll records found for this period.</td>
                                    </tr>
                                ) : payrolls.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                                            {new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">{p.employee?.fullName || 'Unknown'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600">
                                            ${p.netPay.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {p.status === 'DRAFT' && isAdmin && (
                                                <button
                                                    onClick={() => handleMarkPaid(p.id)}
                                                    className="inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-all"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Salary Modal */}
            {isSalaryModalOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Set Salary</h3>
                            <p className="text-sm text-slate-500 mt-1">For <span className="font-semibold text-slate-700">{selectedEmployee.fullName}</span></p>
                        </div>
                        <form onSubmit={handleSaveSalary} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary ($)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={salaryForm.baseSalary}
                                    onChange={e => setSalaryForm({ ...salaryForm, baseSalary: Number(e.target.value) })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500/20 transition-all sm:text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Allowance ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={salaryForm.allowance}
                                    onChange={e => setSalaryForm({ ...salaryForm, allowance: Number(e.target.value) })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500/20 transition-all sm:text-sm outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsSalaryModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all">Save Salary</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Payroll Modal */}
            {isPayrollModalOpen && selectedEmployee && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Generate Payroll</h3>
                            <p className="text-sm text-slate-500 mt-1">For <span className="font-semibold text-slate-700">{selectedEmployee.fullName}</span></p>
                        </div>

                        <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="text-slate-500 font-medium">Basic Salary</span>
                                <span className="text-slate-900 font-semibold">${selectedEmployee.salary?.baseSalary.toFixed(2) || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">Allowance</span>
                                <span className="text-slate-900 font-semibold">+ ${selectedEmployee.salary?.allowance.toFixed(2) || 0}</span>
                            </div>
                        </div>

                        <form onSubmit={handleGeneratePayroll} className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Month (1-12)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1" max="12"
                                        value={payrollForm.month}
                                        onChange={e => setPayrollForm({ ...payrollForm, month: Number(e.target.value) })}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500/20 transition-all sm:text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                                    <input
                                        type="number"
                                        required
                                        min="2000"
                                        value={payrollForm.year}
                                        onChange={e => setPayrollForm({ ...payrollForm, year: Number(e.target.value) })}
                                        className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500/20 transition-all sm:text-sm outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Deductions (e.g. Leave, Tax) ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={payrollForm.deductions}
                                    onChange={e => setPayrollForm({ ...payrollForm, deductions: Number(e.target.value) })}
                                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:bg-white shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-500/20 transition-all sm:text-sm outline-none"
                                />
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
                                <span className="font-semibold text-emerald-800 text-sm">Estimated Net Pay</span>
                                <span className="text-xl font-black text-emerald-600">
                                    ${((selectedEmployee.salary?.baseSalary || 0) + (selectedEmployee.salary?.allowance || 0) - payrollForm.deductions).toFixed(2)}
                                </span>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsPayrollModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Generate Draft
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
