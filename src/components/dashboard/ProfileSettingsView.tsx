'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface EmployeeProfile {
    id: string;
    fullName: string;
    email: string;
    position: string;
    department: string;
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

    // Edit state
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editBioContent, setEditBioContent] = useState('');
    const [isEditingIc, setIsEditingIc] = useState(false);
    const [editIcContent, setEditIcContent] = useState('');

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
                setProfile(data);
                setEditBioContent(data.bio || '');
                setEditIcContent(data.icNo || '');
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveBio = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio: editBioContent }),
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(prev => prev ? { ...prev, bio: editBioContent } : null);
                setIsEditingBio(false);
            }
        } catch (error) {
            console.error('Failed to save bio:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveIc = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ icNo: editIcContent }),
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(prev => prev ? { ...prev, icNo: editIcContent } : null);
                setIsEditingIc(false);
            }
        } catch (error) {
            console.error('Failed to save IC number:', error);
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
            {/* Header / Banner Section */}
            <div className="relative h-32 md:h-40 rounded-b-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg group">
                {profile.bannerImage ? (
                    <img src={profile.bannerImage} alt="Profile Banner" className="w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 MixBlendMode-overlay"></div>
                )}

                {/* Banner Edit Button */}
                <button
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
                >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                    Change Cover
                </button>
                <input
                    type="file"
                    ref={bannerInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'banner')}
                />
            </div>

            <div className="px-8 sm:px-12 -mt-16 md:-mt-20 relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end mb-8">
                {/* Profile Picture */}
                <div className="relative group">
                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden flex items-center justify-center text-4xl font-bold text-gray-400 shrink-0">
                        {profile.profileImage ? (
                            <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                {initials}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => profileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 p-3 bg-white text-gray-700 hover:text-[#2563eb] rounded-full shadow-lg border border-gray-100 transition-transform hover:scale-105"
                    >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                    </button>
                    <input
                        type="file"
                        ref={profileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'profile')}
                    />
                </div>

                <div className="flex-1 pb-2">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{profile.fullName}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-xl text-gray-500 font-medium">{profile.position}</p>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full border border-green-200 shadow-sm">
                            {profile.workingStatus}
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>
                            Personal Information
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Email Address</p>
                                <p className="text-base text-gray-900 font-medium mt-1 truncate">{profile.email}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">Department</p>
                                <p className="text-base text-gray-900 font-medium mt-1">{profile.department}</p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-500">IC Number</p>
                                    {!isEditingIc && (
                                        <button
                                            onClick={() => setIsEditingIc(true)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                                        >
                                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13L2.25 21.25l1.59-2.29a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                                            Edit
                                        </button>
                                    )}
                                </div>
                                {isEditingIc ? (
                                    <div className="mt-2 animate-in fade-in duration-200">
                                        <input
                                            type="text"
                                            value={editIcContent}
                                            onChange={(e) => setEditIcContent(e.target.value)}
                                            placeholder="Enter your IC number"
                                            className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 bg-blue-50/30"
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => {
                                                    setIsEditingIc(false);
                                                    setEditIcContent(profile.icNo || '');
                                                }}
                                                className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveIc}
                                                disabled={isSaving}
                                                className="px-3 py-1 bg-[#2563eb] text-white text-xs font-medium rounded shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            >
                                                {isSaving && (
                                                    <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                )}
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-base text-gray-900 font-medium mt-1">{profile.icNo || 'Not provided'}</p>
                                )}
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">Date Joined</p>
                                <p className="text-base text-gray-900 font-medium mt-1">
                                    {new Date(profile.joinDate).toLocaleDateString('en-MY', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Bio */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
                                About Me
                            </h3>
                            {!isEditingBio && (
                                <button
                                    onClick={() => setIsEditingBio(true)}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13L2.25 21.25l1.59-2.29a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                                    Edit Bio
                                </button>
                            )}
                        </div>

                        {isEditingBio ? (
                            <div className="flex-1 flex flex-col pt-2 animate-in fade-in duration-200">
                                <textarea
                                    value={editBioContent}
                                    onChange={(e) => setEditBioContent(e.target.value)}
                                    placeholder="Write something about yourself..."
                                    className="w-full flex-1 p-4 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-700 bg-blue-50/30"
                                    rows={6}
                                />
                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        onClick={() => {
                                            setIsEditingBio(false);
                                            setEditBioContent(profile.bio || '');
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveBio}
                                        disabled={isSaving}
                                        className="px-6 py-2 bg-[#2563eb] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        {isSaving && (
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        )}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 text-gray-600 leading-relaxed whitespace-pre-wrap animate-in fade-in duration-200">
                                {profile.bio ? (
                                    profile.bio
                                ) : (
                                    <p className="text-gray-400 italic">No bio provided yet. Add one to let your team know more about you!</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
