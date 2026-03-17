'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useDashboardCache } from '@/lib/DashboardCacheContext';
import { apiUrl } from '@/lib/api';

interface Employee {
    id: string;
    fullName: string;
    icNo?: string | null;
    position: string;
    department: string;
    joinDate: string;
    user: {
        email: string;
        role: string;
    };
}

interface LeaveRequest {
    id: string;
    startDate: string;
    endDate: string;
    type: string;
    reason: string;
    status: string;
}

export default function EmployeesView() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';
    const { getCache, setCache, clearCache } = useDashboardCache();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedEmployeeForLeaves, setSelectedEmployeeForLeaves] = useState<Employee | null>(null);
    const [employeeLeaves, setEmployeeLeaves] = useState<LeaveRequest[]>([]);
    const [leavesLoading, setLeavesLoading] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        // Check cache first
        const cachedEmployees = getCache('employees_list');
        if (cachedEmployees) {
            setEmployees(cachedEmployees);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(apiUrl('/api/employees'));
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
                setCache('employees_list', data);
            }
        } catch (error) {
            console.error('Failed to fetch employees', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeLeaves = async (employeeId: string) => {
        setLeavesLoading(true);
        try {
            const res = await fetch(`/api/leave?employeeId=${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                setEmployeeLeaves(data);
            }
        } catch (error) {
            console.error('Failed to fetch employee leaves', error);
        } finally {
            setLeavesLoading(false);
        }
    };

    const handleViewLeaves = async (employee: Employee) => {
        setSelectedEmployeeForLeaves(employee);
        await fetchEmployeeLeaves(employee.id);
    };

    const filteredEmployees = employees.filter(emp =>
        emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAdmins = filteredEmployees.filter(emp => emp.user?.role === 'ADMIN');
    const filteredStaff = filteredEmployees.filter(emp => emp.user?.role !== 'ADMIN');

    const [showAdmins, setShowAdmins] = useState(true);
    const [showStaff, setShowStaff] = useState(true);

    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [editForm, setEditForm] = useState({
        fullName: '',
        icNo: '',
        position: '',
        department: '',
        role: 'EMPLOYEE'
    });

    const handleEditClick = (employee: Employee) => {
        setEditingEmployee(employee);
        setEditForm({
            fullName: employee.fullName,
            icNo: employee.icNo ?? '',
            position: employee.position,
            department: employee.department,
            role: employee.user.role
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmployee) return;

        try {
            const res = await fetch(`/api/employees/${editingEmployee.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                alert('Employee updated successfully');
                // Update local state with new data
                const updatedEmployee = await res.json();
                setEmployees(employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
                // Clear cache so fresh data is fetched on next view
                clearCache('employees_list');
                setEditingEmployee(null);
            } else {
                alert('Failed to update employee');
            }
        } catch (error) {
            console.error('Update failed', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Account deleted successfully');
                // Update local state by removing deleted employee
                setEmployees(employees.filter(e => e.id !== id));
                // Clear cache so fresh data is fetched on next view
                clearCache('employees_list');
            } else {
                alert('Failed to delete account');
            }
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500 w-full mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admins and Employees</h1>
                    <p className="text-slate-500 mt-2 text-lg">Manage team members and their permissions.</p>
                </div>
                {isAdmin && (
                    <Link
                        href="/dashboard/employees/new"
                        className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                    >
                        Add Employee
                    </Link>
                )}
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-md flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-xl pointer-events-none">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, role, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50/50"
                        style={{ paddingLeft: '3.5rem' }}
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

            {/* Admins Table */}
            <div className="bg-white border border-slate-100 rounded-lg shadow-md overflow-hidden mt-10">
                <button
                    onClick={() => setShowAdmins(!showAdmins)}
                    className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100 focus:outline-none"
                    title="Toggle Admin Team"
                >
                    <h2 className="text-xl font-bold text-slate-900">Admin Team ({filteredAdmins.length})</h2>
                    <span className="text-slate-500 text-xl transform transition-transform duration-200" style={{ transform: showAdmins ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>
                {showAdmins && (
                    <div className="overflow-x-auto animate-in fade-in slide-in-from-top-4 duration-300">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 font-semibold text-slate-700 w-[40%]">Admin</th>
                                    <th className="px-8 py-5 font-semibold text-slate-700 w-[15%]">Role</th>
                                    <th className="px-8 py-5 font-semibold text-slate-700 w-[20%]">Department</th>
                                    <th className="px-8 py-5 font-semibold text-slate-700 w-[15%]">Joined</th>
                                    <th className="px-8 py-5 font-semibold text-slate-700 w-[10%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-500">Loading...</td></tr>
                                ) : filteredAdmins.length === 0 ? (
                                    <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-500">No admins found.</td></tr>
                                ) : (
                                    filteredAdmins.map((emp) => (
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
                                            <td className="px-8 py-5">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    {emp.user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                    {emp.department}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-slate-600">{new Date(emp.joinDate).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 flex justify-end gap-2">
                                                {(isAdmin || emp.user.email === session?.user?.email) && (
                                                    <button
                                                        onClick={() => handleEditClick(emp)}
                                                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                                        title="Edit Profile"
                                                    >
                                                        ✏️
                                                    </button>
                                                )}
                                                {isAdmin && emp.user.email !== session?.user?.email && (
                                                    <button
                                                        onClick={() => handleDelete(emp.id)}
                                                        className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                                                        title="Delete Account"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Employees Table */}
            <div className="bg-white border border-slate-100 rounded-lg shadow-md overflow-hidden mt-16">
                <button
                    onClick={() => setShowStaff(!showStaff)}
                    className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100 focus:outline-none"
                    title="Toggle Employees Team"
                >
                    <h2 className="text-xl font-bold text-slate-900">Employees Team ({filteredStaff.length})</h2>
                    <span className="text-slate-500 text-xl transform transition-transform duration-200" style={{ transform: showStaff ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>
                {showStaff && (
                    <div className="overflow-x-auto animate-in fade-in slide-in-from-top-4 duration-300">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 font-semibold text-slate-700 w-[40%]">Employee</th>
                                    <th className="px-8 py-5 font-semibold text-slate-700 w-[15%]">Role</th>
                                    <th className="px-8 py-5 font-semibold text-slate-700 w-[20%]">Department</th>
                                    <th className="px-8 py-5 font-semibold text-slate-700 w-[15%]">Joined</th>
                                    <th className="px-8 py-5 font-semibold text-slate-700 w-[10%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-500">Loading...</td></tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-500">No employees found.</td></tr>
                                ) : (
                                    filteredStaff.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <button
                                                    onClick={() => handleViewLeaves(emp)}
                                                    className="flex items-center gap-4 hover:opacity-80 transition-opacity text-left"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase">
                                                        {emp.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 hover:underline">{emp.fullName}</p>
                                                        <p className="text-sm text-slate-500">{emp.user?.email}</p>
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                    {emp.user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                    {emp.department}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-slate-600">{new Date(emp.joinDate).toLocaleDateString()}</td>
                                            <td className="px-8 py-5 flex justify-end gap-2">
                                                {(isAdmin || emp.user.email === session?.user?.email) && (
                                                    <button
                                                        onClick={() => handleEditClick(emp)}
                                                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                                        title="Edit Profile"
                                                    >
                                                        ✏️
                                                    </button>
                                                )}
                                                {isAdmin && emp.user.email !== session?.user?.email && (
                                                    <button
                                                        onClick={() => handleDelete(emp.id)}
                                                        className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                                                        title="Delete Account"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-8 transform transition-all scale-100">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit Employee</h2>
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.fullName}
                                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">IC Card Number</label>
                                <input
                                    type="text"
                                    value={editForm.icNo}
                                    onChange={e => setEditForm({ ...editForm, icNo: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. 123456789012"
                                />
                            </div>

                            {isAdmin && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                                        <select
                                            value={editForm.role}
                                            onChange={e => {
                                                const newRole = e.target.value;
                                                const newPosition = newRole === 'ADMIN' ? 'Admin' : 'Employee';
                                                setEditForm({ ...editForm, role: newRole, position: newPosition });
                                            }}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-white"
                                        >
                                            <option value="EMPLOYEE">Employee</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Position</label>
                                            <input
                                                type="text"
                                                value={editForm.position}
                                                onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                                            <input
                                                type="text"
                                                value={editForm.department}
                                                onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingEmployee(null)}
                                    className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-95"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Leave Details Modal */}
            {selectedEmployeeForLeaves && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8 transform transition-all scale-100 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase text-lg">
                                    {selectedEmployeeForLeaves.fullName.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{selectedEmployeeForLeaves.fullName}</h2>
                                    <p className="text-slate-500">{selectedEmployeeForLeaves.position}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEmployeeForLeaves(null)}
                                className="text-slate-400 hover:text-slate-600 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Leave History</h3>

                            {leavesLoading ? (
                                <div className="text-center py-8 text-slate-500">Loading leave data...</div>
                            ) : employeeLeaves.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">No leaves recorded</div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Leave Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                            <p className="text-sm font-medium text-blue-600 mb-1">Total Leaves</p>
                                            <p className="text-3xl font-bold text-blue-900">{employeeLeaves.length}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                            <p className="text-sm font-medium text-green-600 mb-1">Approved</p>
                                            <p className="text-3xl font-bold text-green-900">{employeeLeaves.filter(l => l.status === 'APPROVED').length}</p>
                                        </div>
                                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                            <p className="text-sm font-medium text-amber-600 mb-1">Pending</p>
                                            <p className="text-3xl font-bold text-amber-900">{employeeLeaves.filter(l => l.status === 'PENDING').length}</p>
                                        </div>
                                    </div>

                                    {/* Leave Types Breakdown */}
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mb-6">
                                        <h4 className="font-bold text-slate-900 mb-4">Leaves by Type</h4>
                                        <div className="space-y-2">
                                            {Object.entries(
                                                employeeLeaves.reduce((acc, leave) => {
                                                    acc[leave.type] = (acc[leave.type] || 0) + 1;
                                                    return acc;
                                                }, {} as Record<string, number>)
                                            )
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([type, count]) => (
                                                <div key={type} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-slate-100">
                                                    <span className="font-medium text-slate-900">{type}</span>
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-200 text-slate-800">
                                                        {count} leave{count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Detailed Leave List */}
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-4">Details</h4>
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {employeeLeaves
                                                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                                                .map((leave) => (
                                                <div key={leave.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{leave.type} Leave</p>
                                                            <p className="text-sm text-slate-600 mt-1">{leave.reason}</p>
                                                        </div>
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                            leave.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                            leave.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {leave.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500">
                                                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                            <button
                                type="button"
                                onClick={() => setSelectedEmployeeForLeaves(null)}
                                className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
