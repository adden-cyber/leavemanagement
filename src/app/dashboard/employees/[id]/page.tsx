'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

type Employee = {
    id: string;
    fullName: string;
    position: string;
    status: string;
    joinDate: string;
    user: {
        username: string;
    }
};

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    // Edit form states
    const [fullName, setFullName] = useState('');
    const [position, setPosition] = useState('');
    const [status, setStatus] = useState('PERMANENT');
    const [joinDate, setJoinDate] = useState('');

    useEffect(() => {
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
                }
            } catch (error) {
                console.error("Failed to fetch employee", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
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

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this employee?")) return;
        try {
            const res = await fetch(`/api/employees/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                router.push('/dashboard/employees');
            }
        } catch (error) {
            console.error(error);
        }
    }

    if (loading) return <div>Loading...</div>;
    if (!employee) return <div>Employee not found</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-700 text-3xl font-medium">Employee Details</h3>
                <div>
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="px-4 py-2 mr-2 text-white bg-blue-600 rounded-md hover:bg-blue-500"
                        >
                            Edit
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-500"
                    >
                        Delete
                    </button>
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
                            <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-md">Save</button>
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
        </div>
    );
}
