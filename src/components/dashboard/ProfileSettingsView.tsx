'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface EmployeeProfile {
    id: string;
    fullName: string;
    username?: string;
    email?: string;
    position: string;
    status: string;
    icNo: string | null;
    joinDate: string;
    workingStatus: string;
    bio: string | null;
    profileImage: string | null;
    bannerImage: string | null;
    role: string;
}

export default function ProfileSettingsView() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        icNo: '',
        bio: ''
    });

    // Image refs
    const profileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                console.log('Fetched profile:', data);
                setProfile(data);
                setFormData({
                    icNo: data.icNo || '',
                    bio: data.bio || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = () => {
        setFormData({
            icNo: profile?.icNo ?? '',
            bio: profile?.bio ?? ''
        });
        setSaveError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSaveError(null);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            const payload = {
                icNo: formData.icNo.trim(),
                bio: formData.bio.trim(),
            };
            console.log('Saving with data:', payload);
            
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            console.log('Response status:', res.status);
            const responseData = await res.json();
            console.log('Response data:', responseData);

            if (!res.ok) {
                setSaveError(responseData.error || 'Failed to save changes');
                return;
            }

            // Update profile and form state with the response
            if (responseData.employee) {
                const updatedProfile = { ...profile, ...responseData.employee } as EmployeeProfile;
                console.log('Updated profile:', updatedProfile);
                setProfile(updatedProfile);
                setFormData({
                    icNo: updatedProfile.icNo ?? '',
                    bio: updatedProfile.bio ?? ''
                });
            }

            // refresh from server to avoid stale state. This is especially helpful for icNo updates.
            await fetchProfile();

            closeModal();
        } catch (error) {
            console.error('Error saving:', error);
            setSaveError('An error occurred while saving. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Convert to base64 for simple storage
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;

            try {
                const payload = type === 'profile'
                    ? { profileImage: base64String }
                    : { bannerImage: base64String };

                const res = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    setProfile(prev => prev ? {
                        ...prev,
                        profileImage: type === 'profile' ? base64String : prev.profileImage,
                        bannerImage: type === 'banner' ? base64String : prev.bannerImage
                    } : null);
                }
            } catch (error) {
                console.error(`Failed to upload ${type} image:`, error);
            }
        };
        reader.readAsDataURL(file);
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]"></div>
            </div>
        );
    }

    if (!profile) {
        return <div className="p-8">Error loading profile data.</div>;
    }

    const initials = profile.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

    return (
        <div className="max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Simple Header with Edit Button */}
            <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage your app preferences and account settings.</p>
                    </div>
                </div>
                <button
                    onClick={openModal}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13L2.25 21.25l1.59-2.29a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                    Edit
                </button>
            </div>

            {/* Modal Dialog */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 animate-in zoom-in-95 duration-200">
                        <h2 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h2>

                        {/* Error Message */}
                        {saveError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-sm text-red-700">{saveError}</p>
                            </div>
                        )}

                        {/* Form Fields */}
                        <div className="space-y-6">
                            {/* Name (Read-only) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={profile?.fullName || ''}
                                    disabled
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                />
                            </div>

                            {/* Username (Read-only) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={profile?.username || ''}
                                    disabled
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                />
                            </div>

                            {/* IC Card Number (Editable) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">IC Card Number</label>
                                <input
                                    type="text"
                                    value={formData.icNo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, icNo: e.target.value }))}
                                    placeholder="e.g., 123456-78-9012"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700"
                                />
                                <p className="text-xs text-gray-500 mt-1">Your identification number</p>
                            </div>

                            {/* Role (Read-only) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                <input
                                    type="text"
                                    value={profile?.role || ''}
                                    disabled
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                />
                            </div>

                            {/* Bio (Editable) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">About Me</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Write something about yourself..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 resize-none"
                                    rows={4}
                                />
                            </div>

                            {/* Department and Position */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <input
                                        type="text"
                                        value={profile?.status || ''}
                                        disabled
                                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                                    <input
                                        type="text"
                                        value={profile?.position || ''}
                                        disabled
                                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Status and Join Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <input
                                        type="text"
                                        value={profile?.workingStatus || ''}
                                        disabled
                                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Join Date</label>
                                    <input
                                        type="text"
                                        value={profile ? new Date(profile.joinDate).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                        disabled
                                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
                            <button
                                onClick={closeModal}
                                disabled={isSaving}
                                className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSaving && (
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                )}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
