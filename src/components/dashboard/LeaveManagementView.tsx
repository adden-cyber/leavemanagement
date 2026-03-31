'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Employee {
    id: string;
    fullName: string;
    position: string;
    status: string;
    annualLeaveQuota: number;
    medicalLeaveQuota: number;
    unpaidLeaveQuota: number;
    user: {
        username: string;
        role: string;
    };
}

export default function LeaveManagementView() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const response = await fetch('/api/employees');
                const data = await response.json();
                setEmployees(data);
            } catch (err) {
                setError('Failed to load employees');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadEmployees();
    }, []);

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.user?.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Exclude admins from leave management listing.
    const managedEmployees = filteredEmployees.filter(emp => (emp.user?.role ?? 'EMPLOYEE').toUpperCase() !== 'ADMIN');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-gray-500">Loading employees...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage employee leave quotas and view their usage
                </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-slate-700">
                <input
                    type="text"
                    placeholder="Search by name, username, or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
            </div>

            {/* Employee Cards Grid */}
            {managedEmployees.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-gray-400">
                        {employees.length === 0 ? 'No employees found' : 'No matching employees'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {managedEmployees.map((employee) => (
                        <div
                            key={employee.id}
                            onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                            className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700 cursor-pointer hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200"
                        >
                            {/* Employee Name & Position */}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {employee.fullName}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Role: {employee.user?.role || 'EMPLOYEE'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Position: {employee.position}
                                </p>
                                <div className="mt-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        employee.status === 'ACTIVE'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}>
                                        {employee.status}
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 dark:border-slate-700 my-4"></div>

                            {/* Leave Quotas */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Annual Leave</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                        {employee.user?.role === 'ADMIN' ? 'N/A' : `${employee.annualLeaveQuota} days`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Medical Leave</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">
                                        {employee.user?.role === 'ADMIN' ? 'N/A' : `${employee.medicalLeaveQuota} days`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Unpaid Leave</span>
                                    <span className="font-bold text-red-600 dark:text-red-400">
                                        {employee.user?.role === 'ADMIN' ? 'N/A' : `${employee.unpaidLeaveQuota} days`}
                                    </span>
                                </div>
                            </div>

                            {/* Click to Edit Note */}
                            <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300 text-center">
                                Click to edit quotas & view usage
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
