'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Employee {
    id: string;
    fullName: string;
    username?: string;
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

interface LeaveRequest {
    id: string;
    type: 'ANNUAL' | 'MEDICAL' | 'UNPAID';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    startDate: string;
    endDate: string;
}

export default function LeaveCreditsView() {
    const { data: session } = useSession();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                if (!session?.user) return;

                // Fetch all employees and find current user's employee record
                const empResponse = await fetch('/api/employees');
                const employees = await empResponse.json();
                
                // Match by username - same logic as EmployeesView
                const currentEmp = employees.find((emp: Employee) => 
                    emp.user?.username === session.user.name || 
                    emp.user?.username === (session.user as any)?.username || 
                    emp.user?.username === session.user.email
                );

                if (currentEmp) {
                    setEmployee(currentEmp);

                    // Fetch leave history
                    const leaveResponse = await fetch(`/api/leave?employeeId=${currentEmp.id}&limit=1000`);
                    const leaveData = await leaveResponse.json();
                    setLeaves(Array.isArray(leaveData.leaves) ? leaveData.leaves : []);
                } else {
                    setError('Employee profile not found');
                }
            } catch (err) {
                setError('Failed to load leave credits');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [session]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-gray-500">Loading leave credits...</div>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-red-500">{error || 'No employee profile found'}</div>
            </div>
        );
    }

    // Calculate leave usage
    const annualTaken = leaves.filter(l => l.type === 'ANNUAL' && l.status === 'APPROVED').length;
    const medicalTaken = leaves.filter(l => l.type === 'MEDICAL' && l.status === 'APPROVED').length;
    const unpaidTaken = leaves.filter(l => l.type === 'UNPAID' && l.status === 'APPROVED').length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leave Credits</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View your available leave quota and usage
                    </p>
                </div>
            </div>

            {/* Employee Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{employee.fullName}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{employee.position}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                        <p className="text-lg font-semibold">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                employee.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                                {employee.status}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Leave Quota Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Annual Leave */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Annual Leave</h3>
                        <span className="text-2xl">📅</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Quota</span>
                            <span className="font-bold text-gray-900 dark:text-white">{employee.annualLeaveQuota} days</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Used</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400">{annualTaken} days</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(annualTaken / employee.annualLeaveQuota) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-slate-700">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</span>
                            <span className="font-bold text-green-600 dark:text-green-400">
                                {Math.max(0, employee.annualLeaveQuota - annualTaken)} days
                            </span>
                        </div>
                    </div>
                </div>

                {/* Medical Leave */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Medical Leave</h3>
                        <span className="text-2xl">🏥</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Quota</span>
                            <span className="font-bold text-gray-900 dark:text-white">{employee.medicalLeaveQuota} days</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Used</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400">{medicalTaken} days</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${(medicalTaken / employee.medicalLeaveQuota) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-slate-700">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</span>
                            <span className="font-bold text-green-600 dark:text-green-400">
                                {Math.max(0, employee.medicalLeaveQuota - medicalTaken)} days
                            </span>
                        </div>
                    </div>
                </div>

                {/* Unpaid Leave */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unpaid Leave</h3>
                        <span className="text-2xl">⏸️</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Quota</span>
                            <span className="font-bold text-gray-900 dark:text-white">{employee.unpaidLeaveQuota} days</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Used</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400">{unpaidTaken} days</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${(unpaidTaken / employee.unpaidLeaveQuota) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-slate-700">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</span>
                            <span className="font-bold text-green-600 dark:text-green-400">
                                {Math.max(0, employee.unpaidLeaveQuota - unpaidTaken)} days
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
