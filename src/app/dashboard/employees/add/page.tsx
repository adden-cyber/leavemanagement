'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddEmployeePage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [position, setPosition] = useState('');
    const [status, setStatus] = useState('PERMANENT');
    const [joinDate, setJoinDate] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, username, position, status, joinDate, role }),
            });

            if (res.ok) {
                router.push('/dashboard/employees');
                router.refresh();
            } else {
                alert('Failed to add employee');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-gray-700 text-3xl font-medium mb-6">Add Employee</h3>
            <div className="bg-white p-6 rounded-md shadow-md">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
                        <div>
                            <label className="text-gray-700" htmlFor="fullName">Full Name</label>
                            <input
                                id="fullName"
                                type="text"
                                className="w-full mt-2 border-gray-200 rounded-md focus:border-indigo-600 focus:ring focus:ring-opacity-40 focus:ring-indigo-500"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-gray-700" htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                className="w-full mt-2 border-gray-200 rounded-md focus:border-indigo-600 focus:ring focus:ring-opacity-40 focus:ring-indigo-500"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-gray-700" htmlFor="position">Position</label>
                            <input
                                id="position"
                                type="text"
                                className="w-full mt-2 border-gray-200 rounded-md focus:border-indigo-600 focus:ring focus:ring-opacity-40 focus:ring-indigo-500"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-gray-700" htmlFor="status">Status</label>
                            <select
                                id="status"
                                className="w-full mt-2 border-gray-200 rounded-md focus:border-indigo-600 focus:ring focus:ring-opacity-40 focus:ring-indigo-500"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="PERMANENT">Permanent</option>
                                <option value="PROBATION">Probation</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-gray-700" htmlFor="joinDate">Join Date</label>
                            <input
                                id="joinDate"
                                type="date"
                                className="w-full mt-2 border-gray-200 rounded-md focus:border-indigo-600 focus:ring focus:ring-opacity-40 focus:ring-indigo-500"
                                value={joinDate}
                                onChange={(e) => setJoinDate(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-gray-700" htmlFor="role">Role</label>
                            <select
                                id="role"
                                className="w-full mt-2 border-gray-200 rounded-md focus:border-indigo-600 focus:ring focus:ring-opacity-40 focus:ring-indigo-500"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="EMPLOYEE">Employee</option>
                                <option value="PROBATION">Probation</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    </div>

                                    <div className="flex justify-end mt-4">
                        <button
                            type="submit"
                            className="px-6 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-500 focus:outline-none focus:bg-indigo-500"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
