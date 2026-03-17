'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';

interface Employee {
    id: string;
    fullName: string;
    position: string;
    department: string;
    joinDate: string;
    user: {
        email: string;
        role: string;
    };
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch(apiUrl('/api/employees'));
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error('Failed to fetch employees', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employees</h1>
                    <p className="text-slate-500 mt-2 text-lg">Manage your team members and their permissions.</p>
                </div>
                <Link
                    href="/dashboard/employees/new"
                    className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                >
                    Add Employee
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-md flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, role, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50/50"
                    />
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all">
                        Filter
                    </button>
                    <button className="px-5 py-2.5 font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all">
                        Export
                    </button>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white border border-slate-100 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 font-semibold text-slate-700">Employee</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Role</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Department</th>
                                <th className="px-8 py-5 font-semibold text-slate-700">Joined</th>
                                <th className="px-8 py-5 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-500">Loading...</td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-500">No employees found.</td></tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase">
                                                    {emp.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{emp.fullName}</p>
                                                    <p className="text-sm text-slate-500">{emp.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-slate-600">{emp.position}</td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                {emp.department}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-slate-600">{new Date(emp.joinDate).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                                                <span className="sr-only">Edit</span>
                                                ✏️
                                            </button>
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
