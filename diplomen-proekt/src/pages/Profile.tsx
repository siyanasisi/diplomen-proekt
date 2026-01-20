import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase, ensureValidSession } from "../supabase-client";
import { useNavigate } from "react-router-dom";

export const Profile = () => {
    const { user, role, signOut, loading } = useAuth();
    const navigate = useNavigate();

    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [totalEvents, setTotalEvents] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [monthlyEvents, setMonthlyEvents] = useState<{ [key: string]: number }>({});
    const [editMode, setEditMode] = useState(false);
    const [editedFirstName, setEditedFirstName] = useState('');
    const [editedLastName, setEditedLastName] = useState('');
    const [editedCity, setEditedCity] = useState('');
    const [editedQualifications, setEditedQualifications] = useState('');
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [showAllEvents, setShowAllEvents] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // show notification and hide after 3s
    const showNotification = useCallback((type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => {
            setNotification((prev) => {
                // Only clear if this is still the current notification
                if (prev?.type === type && prev?.message === message) {
                    return null;
                }
                return prev;
            });
        }, 3000);
    }, []);

    const loadUserData = useCallback(async () => {
        if (!user) return;
 
        try {
            // ensure we have a valid access token before making request
            await ensureValidSession();
        
        const { data: statsData, error: statsError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (statsError) {
            console.warn('Could not load user stats:', statsError);
            setCurrentStreak(0);
            setLongestStreak(0);
            setEarnedPoints(0);
        } else if (statsData) {

            setCurrentStreak(statsData.current_streak || 0);
            setLongestStreak(statsData.longest_streak || 0);
            setEarnedPoints(statsData.earned_points || 0);
        } else {
            // no stats row exists - create one with defaults
            const { error: insertError } = await supabase
                .from('user_stats')
                .insert({
                    user_id: user.id,
                    current_streak: 0,
                    longest_streak: 0,
                    earned_points: 0
                });

            if (insertError) {
                console.warn('Could not create user stats:', insertError);
            }
            
            setCurrentStreak(0);
            setLongestStreak(0);
            setEarnedPoints(0);
        }

        // Load events
        const { data: eventsData, count } = await supabase
            .from('calendar_events')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('date', { ascending: true });

        setTotalEvents(count || 0);

        if (eventsData) {
            setAllEvents(eventsData);
            
            // calculate monthly events
            const monthly: { [key: string]: number } = {};
            eventsData.forEach(event => {
                const [year, month] = event.date.split('-').slice(0, 2);
                const monthKey = `${year}-${month}`;
                monthly[monthKey] = (monthly[monthKey] || 0) + 1;
            });
            setMonthlyEvents(monthly);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get upcoming events
            const upcoming = eventsData
                .filter(event => {
                    const [year, month, day] = event.date.split('-').map(Number);
                    const eventDate = new Date(year, month - 1, day);
                    return eventDate >= today;
                })
                .slice(0, role === 'teacher' ? 10 : 3);

            setUpcomingEvents(upcoming);

            // get recent activity (only for students)
            if (role === 'student') {
                const recent = eventsData
                    .filter(event => {
                        const [year, month, day] = event.date.split('-').map(Number);
                        const eventDate = new Date(year, month - 1, day);
                        return eventDate < today;
                    })
                    .slice(-5)
                    .reverse();

                setRecentActivity(recent);
            }
        }
        } catch (error) {
            console.error('Error in loadUserData:', error);
            // Set defaults on error to prevent blank page
            setCurrentStreak(0);
            setLongestStreak(0);
            setEarnedPoints(0);
            setTotalEvents(0);
            setUpcomingEvents([]);
            setRecentActivity([]);
            setAllEvents([]);
            setMonthlyEvents({});
        }
    }, [user, role]);

    useEffect(() => {
        let isMounted = true;
        
        if (user) {
            setIsLoadingData(true);
            loadUserData()
                .then(() => {
                    if (isMounted) {
                        setIsLoadingData(false);
                        //load avatar URL from user metadata
                        const userMetadata = user.user_metadata as any;
                        if (userMetadata?.avatar_url) {
                            setAvatarUrl(userMetadata.avatar_url);
                        } else {
                            setAvatarUrl(null);
                        }
                    }
                })
                .catch((error) => {
                    console.error('Error loading user data:', error);
                    if (isMounted) {
                        setIsLoadingData(false);
                    }
                });
        } else if (!user && !loading) {
            // only redirect if we're sure the user is not logged in (not just loading)
            // Add a small delay to prevent flash of blank page
            const redirectTimeout = setTimeout(() => {
                if (isMounted) {
                    navigate("/login");
                }
            }, 100);
            
            return () => {
                isMounted = false;
                clearTimeout(redirectTimeout);
            };
        }
        
        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, navigate, loading]); // loadUserData is stable (useCallback with user, role deps)

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        if (!deletePassword) {
            alert('Моля въведете паролата си за потвърждение');
            return;
        }
        if (deleteConfirmText !== 'ИЗТРИЙ') {
            alert('Моля напишете "ИЗТРИЙ" за потвърждение');
            return;
        }

        if (!user.email) {
            alert('Email не е наличен');
            return;
        }

        setDeletingAccount(true);

        try {
            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: deletePassword,
            });

            if (verifyError) {
                showNotification('error', 'Паролата е неправилна. Моля опитайте отново.');
                setDeletingAccount(false);
                return;
            }

            const { error: eventsError } = await supabase
                .from('calendar_events')
                .delete()
                .eq('user_id', user.id);

            if (eventsError) {
                console.error('Error deleting events:', eventsError);
            }

            const { error: statsError } = await supabase
                .from('user_stats')
                .delete()
                .eq('user_id', user.id);

            if (statsError) {
                console.error('Error deleting stats:', statsError);
            }

            // delete profile picture from storage
            const userMetadata = user.user_metadata as any;
            const avatarUrl = userMetadata?.avatar_url;
            if (avatarUrl) {
                try {
                    const urlParts = avatarUrl.split('/');
                    const filePath = urlParts.slice(-2).join('/');
                    await supabase.storage
                        .from('profile-pictures')
                        .remove([filePath]);
                } catch (storageError) {
                    console.error('Error deleting avatar:', storageError);
                }
            }


            alert('Акаунтът ви е изтрит успешно. Всички ваши данни са премахнати.');
            


            await signOut();
            navigate("/");
        } catch (error: any) {
            console.error('Error deleting account:', error);
            alert(`Грешка при изтриване на акаунта: ${error.message}`);
        } finally {
            setDeletingAccount(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
    };

    const formatFullDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setLoadingUpdate(true);

        try {
            const updates: any = {};
            if (editedFirstName) updates.first_name = editedFirstName.trim();
            if (editedLastName) updates.last_name = editedLastName.trim();
            if (editedCity) updates.city = editedCity.trim();
            if (role === 'teacher' && editedQualifications) updates.qualifications = editedQualifications.trim();
            if (editedFirstName || editedLastName) {
                updates.full_name = `${editedFirstName.trim()} ${editedLastName.trim()}`.trim();
            }

            const { error } = await supabase.auth.updateUser({
                data: updates
            });

            if (error) {
                console.error('Error updating profile:', error);
                showNotification('error', 'Грешка при обновяване на профила');
            } else {
                // wait for auth state change to propagate (onAuthStateChange in AuthContext will update user)
                // then reload our local data without full page reload
                await new Promise(resolve => setTimeout(resolve, 300));
                await loadUserData();
                setEditMode(false);
                showNotification('success', 'Профилът е обновен успешно!');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('error', 'Грешка при обновяване на профила');
        } finally {
            setLoadingUpdate(false);
        }
    };

    const handleDeleteEvent = useCallback(async (eventId: string) => {
        if (!confirm('Сигурни ли сте, че искате да изтриете това събитие?')) return;

        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', eventId);

        if (error) {
            console.error('Error deleting event:', error);
            showNotification('error', 'Грешка при изтриване на събитието');
        } else {
            showNotification('success', 'Събитието е изтрито успешно');
            loadUserData();
        }
    }, [showNotification, loadUserData]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        
        if (!file.type.startsWith('image/')) {
            alert('Моля изберете валиден файл (изображение)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('Файлът е твърде голям. Моля изберете изображение под 2MB');
            return;
        }

        setUploadingAvatar(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/avatar.${fileExt}`;
            const filePath = `${fileName}`;


            const oldAvatar = (user.user_metadata as any)?.avatar_url;
            if (oldAvatar) {
                const oldPath = oldAvatar.split('/').slice(-2).join('/'); // Get user_id/avatar.ext
                await supabase.storage.from('profile-pictures').remove([oldPath]);
            }

            // upload new avatar
            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                throw uploadError;
            }

            // get public URL
            const { data } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(filePath);

            const publicUrl = data.publicUrl;

            // update user metadata with new avatar URL
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) {
                throw updateError;
            }

            // update local state immediately
            setAvatarUrl(publicUrl);
            
            // wait for auth state change listener to update the user object
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await loadUserData();
            
            showNotification('success', 'Профилната снимка е обновена успешно!');
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            showNotification('error', `Грешка при качване на снимката: ${error.message}`);
        } finally {
            setUploadingAvatar(false);
            event.target.value = '';
        }
    };

    const validatePassword = (password: string) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return `Паролата трябва да е поне ${minLength} символа.`;
        }
        if (!hasUpperCase) {
            return 'Паролата трябва да съдържа поне една главна буква. ';
        }
        if (!hasLowerCase) {
            return 'Паролата трябва да съдържа поне една малка буква.';
        }
        if (!hasNumber) {
            return 'Паролата трябва да съдържа поне една цифра.';
        }
        if (!hasSpecialChar) {
            return 'Паролата трябва да съдържа поне един специален символ. ';
        }
        return '';
    };

    const handleChangePassword = async () => {
       
        setPasswordError('');

        if (!currentPassword) {
            setPasswordError('Моля въведете текущата парола');
            return;
        }

        // validate new password using same constraints as signup
        const passwordValidationError = validatePassword(newPassword);
        if (passwordValidationError) {
            setPasswordError(passwordValidationError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Новата парола и потвърждението не съвпадат');
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError('Новата парола трябва да бъде различна от текущата');
            return;
        }

        setChangingPassword(true);

        try {
            //first verify the current password by attempting to sign in
            if (!user?.email) {
                throw new Error('Email не е наличен');
            }

            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (verifyError) {
                setPasswordError('Текущата парола е неправилна');
                setChangingPassword(false);
                return;
            }

            // update pass
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                throw updateError;
            }

            showNotification('success', 'Паролата е променена успешно!');
            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
        } catch (error: any) {
            console.error('Error changing password:', error);
            setPasswordError(error.message || 'Грешка при промяна на паролата');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!user || !confirm('Сигурни ли сте, че искате да премахнете профилната си снимка?')) return;

        try {
            const userMetadata = user.user_metadata as any;
            const avatarUrl = userMetadata?.avatar_url;

            if (avatarUrl) {
                // extract path from URL
                const urlParts = avatarUrl.split('/');
                const filePath = urlParts.slice(-2).join('/'); 

                // delete from storage
                const { error: deleteError } = await supabase.storage
                    .from('profile-pictures')
                    .remove([filePath]);

                if (deleteError) {
                    console.error('Error deleting avatar:', deleteError);
                }
            }

            // remove avatar_url from user metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: null }
            });

            if (updateError) {
                throw updateError;
            }

            setAvatarUrl(null);
            
            // wait for auth state change listener to update the user object
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // refresh user data to ensure everything is in sync
            await loadUserData();
            
            alert('Профилната снимка е премахната успешно!');
        } catch (error: any) {
            console.error('Error removing avatar:', error);
            alert(`Грешка при премахване на снимката: ${error.message}`);
        }
    };

    const getLastMonths = () => {
        const months: string[] = [];
        const monthNames = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
        const today = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push(`${monthNames[date.getMonth()]} ${date.getFullYear()}`);
        }
        return months;
    };

    const last6Months = getLastMonths();
    const monthlyValues = Object.values(monthlyEvents);
    const maxMonthlyEvents = monthlyValues.length > 0 ? Math.max(...monthlyValues, 1) : 1;

    // memoize computed values 
    const userMetadata = useMemo(() => {
        if (!user?.user_metadata) return {};
        return (user.user_metadata as any) || {};
    }, [user]);
    
    const displayName = useMemo(() => {
        if (!user) return 'Потребител';
        const firstName = userMetadata?.first_name;
        const lastName = userMetadata?.last_name;
        const fullName = userMetadata?.full_name || (firstName && lastName ? `${firstName} ${lastName}` : null);
        return fullName || user.email?.split('@')[0] || (role === 'teacher' ? 'Учител' : 'Студент');
    }, [userMetadata, user?.email, role]);
    
    const memberSince = useMemo(() => {
        if (!user?.created_at) return '';
        try {
            return new Date(user.created_at).toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' });
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    }, [user?.created_at]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <svg className="animate-spin w-12 h-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-600 font-medium">Зареждане...</p>
                </div>
            </div>
        );
    }
    
    if (!user) return null;

    const firstName = userMetadata?.first_name;
    const lastName = userMetadata?.last_name;
    const roleLabel = role === 'student' ? 'Ученик' : role === 'teacher' ? 'Учител' : null;
    const grade = userMetadata?.grade;
    const city = userMetadata?.city;
    const qualifications = userMetadata?.qualifications;
    
    // use avatarUrl state or fallback to user metadata
    const currentAvatarUrl = avatarUrl || userMetadata?.avatar_url || null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            {/* notification toast */}
            {notification && (
                <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5 duration-300">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 flex items-center gap-3 ${
                        notification.type === 'success' 
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' 
                            : 'bg-red-50/90 border-red-200 text-red-800'
                    }`}>
                        {notification.type === 'success' ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        )}
                        <p className="font-semibold text-sm">{notification.message}</p>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-2 p-1 rounded-lg hover:bg-black/10 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* loading overlay */}
            {isLoadingData && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl">
                        <div className="flex flex-col items-center gap-4">
                            <svg className="animate-spin w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm font-semibold text-slate-700">Зареждане на данни...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* header */}
            <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-pink-500/20 blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
                <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-16">
                    <button
                        onClick={() => navigate("/home")}
                        className="text-white/70 hover:text-white flex items-center gap-2 mb-10 transition-all duration-200 text-sm font-medium group"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Назад към начало</span>
                    </button>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-3 tracking-tight leading-tight">Моят профил</h1>
                            <p className="text-white/70 text-base font-medium">Управление на акаунта и настройки</p>
                        </div>
                        {role === 'student' && (
                            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300">
                                <div className="text-3xl">🔥</div>
                                <div>
                                    <div className="text-3xl font-bold text-white leading-none tabular-nums">{currentStreak}</div>
                                    <div className="text-xs text-white/70 font-medium mt-0.5">дни серия</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 -mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* profile card */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-slate-50/50 rounded-3xl shadow-2xl border border-slate-200/60 hover:shadow-3xl transition-all duration-500">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-100/30 to-rose-100/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                            
                            <div className="relative p-8 md:p-12">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12 mb-8">
                                    {/* Avatar Section */}
                                    <div className="relative group flex-shrink-0">
                                        <div className="relative">
                                            {currentAvatarUrl ? (
                                                <img 
                                                    src={currentAvatarUrl} 
                                                    alt={displayName}
                                                    className="w-36 h-36 md:w-40 md:h-40 rounded-3xl object-cover shadow-2xl ring-4 ring-white/80 transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div 
                                                    className="w-36 h-36 md:w-40 md:h-40 rounded-3xl flex items-center justify-center text-white text-6xl font-bold shadow-2xl ring-4 ring-white/80 transition-transform duration-300 group-hover:scale-105"
                                                    style={{ 
                                                        background: role === 'teacher' 
                                                            ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                                                            : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                                                    }}
                                                >
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {/* Online status badge */}
                                            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white bg-gradient-to-br from-emerald-400 to-emerald-600">
                                                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                        {/* Upload overlay */}
                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/90 via-black/70 to-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-md">
                                            <div className="flex flex-col items-center gap-3">
                                                <label className="cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleAvatarUpload}
                                                        className="hidden"
                                                        disabled={uploadingAvatar}
                                                    />
                                                    <div className="flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold bg-white/25 hover:bg-white/35 backdrop-blur-md transition-all duration-200 hover:scale-110 border-2 border-white/40 shadow-xl">
                                                        {uploadingAvatar ? (
                                                            <>
                                                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Качване...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {currentAvatarUrl ? 'Смени' : 'Добави'}
                                                            </>
                                                        )}
                                                    </div>
                                                </label>
                                                {currentAvatarUrl && (
                                                    <button
                                                        onClick={handleRemoveAvatar}
                                                        className="px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-red-500/90 hover:bg-red-600/90 backdrop-blur-md transition-all duration-200 hover:scale-110 border-2 border-red-400/50 shadow-lg"
                                                        disabled={uploadingAvatar}
                                                    >
                                                        Премахни
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profile Info Section */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                                                        {displayName}
                                                    </h2>
                                                    {roleLabel && (
                                                        <span 
                                                            className="px-5 py-2 text-sm font-bold rounded-full text-white shadow-lg transform hover:scale-105 transition-transform"
                                                            style={{ 
                                                                background: role === 'teacher' 
                                                                    ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                                                                    : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                                                            }}
                                                        >
                                                            {roleLabel}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-600 font-medium flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Активен профил
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setEditMode(true);
                                                    setEditedFirstName(firstName || '');
                                                    setEditedLastName(lastName || '');
                                                    setEditedCity(city || '');
                                                    setEditedQualifications(qualifications || '');
                                                }}
                                                className="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105 border-2 flex items-center gap-2 shadow-lg hover:shadow-xl bg-gradient-to-r from-slate-50 to-white border-slate-300 text-slate-800 hover:from-slate-100 hover:to-slate-50 whitespace-nowrap"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Редактирай профил
                                            </button>
                                        </div>

                                        {/* Info Cards Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 border-2 border-blue-200/50 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Имейл</p>
                                                        <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {city && (
                                                <div className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-200/50 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Град</p>
                                                            <p className="text-sm font-bold text-slate-800">
                                                                {city}
                                                                {role === 'student' && grade && <span className="text-emerald-600"> • {grade} клас</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {role === 'teacher' && qualifications && (
                                                <div className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 border-2 border-purple-200/50 hover:border-purple-300 transition-all duration-300 hover:shadow-lg sm:col-span-2">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Квалификации</p>
                                                            <p className="text-sm font-bold text-slate-800">{qualifications}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="group relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-200/50 hover:border-amber-300 transition-all duration-300 hover:shadow-lg sm:col-span-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Член от</p>
                                                        <p className="text-sm font-bold text-slate-800">{memberSince}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* stats grid - only for students */}
                            {role === 'student' && (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                                        <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-100 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                                            <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">🔥</div>
                                            <div className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{currentStreak}</div>
                                            <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Текуща серия</div>
                                        </div>
                                        <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-100 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                                            <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">🏆</div>
                                            <div className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{longestStreak}</div>
                                            <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Най-дълга серия</div>
                                        </div>
                                        <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                                            <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">⭐</div>
                                            <div className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{earnedPoints}</div>
                                            <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Точки</div>
                                        </div>
                                        <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                                            <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">📝</div>
                                            <div className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{totalEvents}</div>
                                            <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Събития</div>
                                        </div>
                                    </div>

                                    {/* monthly activity chart */}
                                    {Object.keys(monthlyEvents).length > 0 && (
                                        <div className="mt-8 pt-8 border-t-2 border-slate-200">
                                            <h4 className="text-xl font-extrabold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Месечна активност</h4>
                                            <div className="space-y-4">
                                                {last6Months.map((monthLabel, index) => {
                                                    const today = new Date();
                                                    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
                                                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                                    const count = monthlyEvents[monthKey] || 0;
                                                    const percentage = maxMonthlyEvents > 0 ? (count / maxMonthlyEvents) * 100 : 0;
                                                    
                                                    return (
                                                        <div key={monthKey} className="flex items-center gap-4">
                                                            <div className="w-24 text-sm font-bold text-slate-700">
                                                                {monthLabel}
                                                            </div>
                                                            <div className="flex-1 h-8 rounded-full overflow-hidden bg-slate-100 shadow-inner">
                                                                <div 
                                                                    className="h-full rounded-full transition-all duration-700 ease-out shadow-lg"
                                                                    style={{ 
                                                                        width: `${percentage}%`,
                                                                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <div className="w-10 text-sm font-extrabold text-right text-slate-900">
                                                                {count}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* upcoming events */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-extrabold flex items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                    <div 
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" 
                                        style={{ 
                                            background: role === 'teacher' 
                                                ? 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)'
                                                : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                                        }}
                                    >
                                        <svg 
                                            className="w-6 h-6" 
                                            style={{ color: role === 'teacher' ? '#ec4899' : '#3b82f6' }} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span>{role === 'teacher' ? 'Събития' : 'Предстоящи събития'}</span>
                                    {role === 'teacher' && allEvents.length > 0 && (
                                        <span className="px-3 py-1 text-xs font-bold rounded-full text-white shadow-md" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }}>
                                            {allEvents.length}
                                        </span>
                                    )}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {role === 'teacher' && allEvents.length > 0 && (
                                        <button
                                            onClick={() => setShowAllEvents(!showAllEvents)}
                                            className="text-sm font-semibold transition-colors px-3 py-1.5 rounded-lg"
                                            style={{ 
                                                backgroundColor: showAllEvents ? '#ffe6f1' : 'transparent',
                                                color: '#fb0473'
                                            }}
                                        >
                                            {showAllEvents ? 'Предстоящи' : 'Всички'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate("/home")}
                                        className="text-sm font-semibold transition-colors flex items-center gap-1"
                                        style={{ 
                                            color: role === 'teacher' ? '#fb0473' : '#5094af'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = role === 'teacher' ? '#c9035c' : '#40768c'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = role === 'teacher' ? '#fb0473' : '#5094af'}
                                    >
                                        {role === 'teacher' ? 'Добави' : 'Виж всички'}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {(role === 'teacher' && showAllEvents ? allEvents : upcomingEvents).length > 0 ? (
                                <div className="space-y-3">
                                    {(role === 'teacher' && showAllEvents ? allEvents : upcomingEvents).map((event, index) => {
                                        const [year, month, day] = event.date.split('-').map(Number);
                                        const eventDate = new Date(year, month - 1, day);
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const isPast = eventDate < today;
                                        
                                        return (
                                            <div 
                                                key={event.id || index} 
                                                className="flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group backdrop-blur-sm"
                                                style={{ 
                                                    background: isPast 
                                                        ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                                                        : index % 2 === 0 
                                                            ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                                                            : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                                    borderColor: isPast ? '#bbf7d0' : (index % 2 === 0 ? '#86efac' : '#93c5fd'),
                                                    opacity: isPast ? 0.8 : 1
                                                }}
                                            >
                                                <div 
                                                    className="flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white shadow-xl ring-4 ring-white/50"
                                                    style={{ 
                                                        background: isPast 
                                                            ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                                                            : index % 2 === 0 
                                                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                                : role === 'teacher'
                                                                    ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                                                                    : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                                                    }}
                                                >
                                                    <div className="text-xs font-bold uppercase tracking-wider">{formatDate(event.date).split(' ')[1]}</div>
                                                    <div className="text-3xl font-extrabold leading-none">{formatDate(event.date).split(' ')[0]}</div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-bold mb-1.5 text-slate-900">{event.event_text}</p>
                                                    <p className="text-xs font-medium text-slate-600">{formatFullDate(event.date)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteEvent(event.id);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2.5 rounded-xl hover:scale-110 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                                                        title="Изтрий събитие"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                    <svg className="w-6 h-6 flex-shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f2faeb' }}>
                                        <svg className="w-8 h-8" style={{ color: '#80cc33' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium mb-2" style={{ color: '#40768c' }}>
                                        {showAllEvents ? 'Няма събития' : 'Няма предстоящи събития'}
                                    </p>
                                    <button
                                        onClick={() => navigate("/home")}
                                        className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
                                        style={{ backgroundColor: role === 'teacher' ? '#fb0473' : '#5094af' }}
                                    >
                                        Добави събитие
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* recent activity - only for students */}
                        {role === 'student' && (
                            <div className="bg-white rounded-2xl p-6 shadow-xl border" style={{ borderColor: '#dceaef' }}>
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: '#203b46' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f0f4f1' }}>
                                        <svg className="w-5 h-5" style={{ color: '#6c9370' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    Последна активност
                                </h3>

                                {recentActivity.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentActivity.map((event, index) => (
                                            <div 
                                                key={index} 
                                                className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:scale-[1.02]"
                                                style={{ 
                                                    backgroundColor: '#f2faeb',
                                                    borderColor: '#e6f5d6'
                                                }}
                                            >
                                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#80cc33' }}></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold mb-1" style={{ color: '#203b46' }}>{event.event_text}</p>
                                                    <p className="text-xs" style={{ color: '#40768c' }}>{formatDate(event.date)}</p>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f2faeb' }}>
                                                    <svg className="w-5 h-5" style={{ color: '#80cc33' }} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#f0f4f1' }}>
                                            <svg className="w-8 h-8" style={{ color: '#6c9370' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium" style={{ color: '#40768c' }}>Все още няма активност</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* right column */}
                    <div className="space-y-8">
                        {/* quick actions */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-300">
                            <h3 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Бързи действия</h3>
                            <div className="space-y-4">
                                <button
                                    onClick={() => navigate("/home")}
                                    className="w-full px-6 py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-xl"
                                    style={{ 
                                        background: role === 'teacher' 
                                            ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                                            : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                                    }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Добави събитие
                                </button>
                                {role === 'student' && (
                                    <>
                                        <button
                                            onClick={() => navigate("/home")}
                                            className="w-full px-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 border-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 shadow-md hover:shadow-lg"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Виж статистики
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditMode(true);
                                                setEditedFirstName(firstName || '');
                                                setEditedLastName(lastName || '');
                                                setEditedCity(city || '');
                                            }}
                                            className="w-full px-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 border-2 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 text-slate-700 hover:from-slate-100 hover:to-slate-200 shadow-md hover:shadow-lg"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Редактирай профил
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* account info  */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl border" style={{ borderColor: '#dceaef' }}>
                            <h3 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Информация за акаунта</h3>
                            <div className="space-y-5">
                                {(firstName || lastName) && (
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#ffe6f1' }}>
                                        <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#c9035c' }}>ИМЕ</label>
                                        <p className="text-sm font-semibold" style={{ color: '#203b46' }}>
                                            {firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName}
                                        </p>
                                    </div>
                                )}
                                <div className="p-4 rounded-xl" style={{ backgroundColor: '#eef4f7' }}>
                                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#40768c' }}>ИМЕЙЛ АДРЕС</label>
                                    <p className="text-sm font-semibold" style={{ color: '#203b46' }}>{user.email}</p>
                                </div>
                                <div className="p-4 rounded-xl" style={{ backgroundColor: role === 'teacher' ? '#ffe6f1' : '#eef4f7' }}>
                                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#40768c' }}>РОЛЯ</label>
                                    {roleLabel ? (
                                        <span 
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full text-white"
                                            style={{ 
                                                backgroundColor: role === 'teacher' ? '#fb0473' : '#5094af'
                                            }}
                                        >
                                            {roleLabel}
                                        </span>
                                    ) : (
                                        <span className="text-sm" style={{ color: '#40768c' }}>Не е зададена</span>
                                    )}
                                </div>
                                {city && (
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#f0f4f1' }}>
                                        <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#577559' }}>ГРАД</label>
                                        <p className="text-sm font-semibold" style={{ color: '#203b46' }}>
                                            {city}
                                            {role === 'student' && grade && ` • ${grade} клас`}
                                        </p>
                                    </div>
                                )}
                                {role === 'teacher' && qualifications && (
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#f2faeb' }}>
                                        <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#66a329' }}>КВАЛИФИКАЦИИ</label>
                                        <p className="text-sm font-semibold" style={{ color: '#203b46' }}>{qualifications}</p>
                                    </div>
                                )}
                                <div className="p-4 rounded-xl" style={{ backgroundColor: '#f2faeb' }}>
                                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#66a329' }}>СТАТУС</label>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: '#80cc33' }}>
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Активен
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl" style={{ backgroundColor: '#eef4f7' }}>
                                    <label className="block text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: '#40768c' }}>РЕГИСТРИРАН</label>
                                    <p className="text-sm font-semibold" style={{ color: '#203b46' }}>
                                        {new Date(user.created_at).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* settings */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-300">
                            <h3 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Настройки</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowChangePassword(true)}
                                    className="w-full px-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 border-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 shadow-md hover:shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    Смени парола
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full px-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 border-2 bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700 hover:from-red-100 hover:to-rose-100 shadow-md hover:shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Изход от профил
                                </button>
                                <button
                                    onClick={() => setShowDeleteAccount(true)}
                                    className="w-full px-6 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 border-2 bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Изтрий акаунт
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* change password modal */}
            {showChangePassword && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold" style={{ color: '#203b46' }}>Смени парола</h3>
                            <button
                                onClick={() => {
                                    setShowChangePassword(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setPasswordError('');
                                }}
                                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-5">
                            {passwordError && (
                                <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
                                    <p className="text-sm font-semibold text-red-700">{passwordError}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#40768c' }}>Текуща парола</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:outline-none transition-all focus:ring-blue-300"
                                    style={{ borderColor: '#dceaef' }}
                                    placeholder="Въведете текущата парола"
                                    required
                                    disabled={changingPassword}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#40768c' }}>Нова парола</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                
                                        if (e.target.value) {
                                            setPasswordError(validatePassword(e.target.value));
                                        } else {
                                            setPasswordError('');
                                        }
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:outline-none transition-all focus:ring-blue-300"
                                    style={{ borderColor: passwordError && newPassword ? '#f3d8d8' : '#dceaef' }}
                                    placeholder="Минимум 8 символа, главна буква, малка буква, цифра, специален символ"
                                    required
                                    disabled={changingPassword}
                                    minLength={8}
                                />
                                {!passwordError && newPassword && (
                                    <p className="mt-2 text-xs" style={{ color: '#80cc33' }}>
                                        ✓ Паролата отговаря на изискванията
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#40768c' }}>Потвърди нова парола</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (e.target.value && e.target.value !== newPassword) {
                                            setPasswordError('Паролите не съвпадат');
                                        } else if (e.target.value && e.target.value === newPassword) {
                                            // if passwords match, check if new password is valid
                                            const validationError = validatePassword(newPassword);
                                            setPasswordError(validationError);
                                        } else {
                                            // if confirm field is empty validate new password instead
                                            const validationError = validatePassword(newPassword);
                                            setPasswordError(validationError);
                                        }
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:outline-none transition-all focus:ring-blue-300"
                                    style={{ borderColor: passwordError && confirmPassword && confirmPassword !== newPassword ? '#f3d8d8' : '#dceaef' }}
                                    placeholder="Повтори новата парола"
                                    required
                                    disabled={changingPassword}
                                    minLength={8}
                                />
                                {confirmPassword && confirmPassword === newPassword && !passwordError && (
                                    <p className="mt-2 text-xs" style={{ color: '#80cc33' }}>
                                        ✓ Паролите съвпадат
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowChangePassword(false);
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setPasswordError('');
                                    }}
                                    className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 border-2"
                                    style={{ 
                                        backgroundColor: '#eef4f7',
                                        borderColor: '#dceaef',
                                        color: '#40768c'
                                    }}
                                    disabled={changingPassword}
                                >
                                    Откажи
                                </button>
                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ 
                                        background: 'linear-gradient(135deg, #5094af 0%, #40768c 100%)'
                                    }}
                                >
                                    {changingPassword ? 'Запазване...' : 'Смени парола'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* delete account modal */}
            {showDeleteAccount && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border-2 border-red-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-extrabold text-red-600">Изтрий акаунт</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDeleteAccount(false);
                                    setDeletePassword('');
                                    setDeleteConfirmText('');
                                }}
                                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                                disabled={deletingAccount}
                            >
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200">
                                <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Внимание: Това действие е необратимо!</p>
                                <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                                    <li>Всички ваши събития ще бъдат изтрити</li>
                                    <li>Всички статистики ще бъдат загубени</li>
                                    <li>Профилната ви снимка ще бъде премахната</li>
                                    <li>Няма да можете да възстановите акаунта си</li>
                                </ul>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-slate-700">Потвърди с парола</label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-red-200 focus:ring-4 focus:ring-red-300 focus:outline-none transition-all"
                                    placeholder="Въведете паролата си"
                                    required
                                    disabled={deletingAccount}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-slate-700">
                                    Напишете <span className="font-extrabold text-red-600">ИЗТРИЙ</span> за потвърждение
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-red-200 focus:ring-4 focus:ring-red-300 focus:outline-none transition-all uppercase"
                                    placeholder="ИЗТРИЙ"
                                    required
                                    disabled={deletingAccount}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteAccount(false);
                                        setDeletePassword('');
                                        setDeleteConfirmText('');
                                    }}
                                    className="flex-1 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 border-2 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 text-slate-700 hover:from-slate-100 hover:to-slate-200"
                                    disabled={deletingAccount}
                                >
                                    Откажи
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    disabled={deletingAccount || deleteConfirmText !== 'ИЗТРИЙ' || !deletePassword}
                                    className="flex-1 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    style={{ 
                                        background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                                    }}
                                >
                                    {deletingAccount ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Изтриване...
                                        </span>
                                    ) : (
                                        'Изтрий завинаги'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* edit profile */}
            {editMode && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" style={{ borderColor: '#dceaef' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold" style={{ color: '#203b46' }}>Редактирай профил</h3>
                            <button
                                onClick={() => {
                                    setEditMode(false);
                                }}
                                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#40768c' }}>Име</label>
                                            <input
                                                type="text"
                                                value={editedFirstName}
                                                onChange={(e) => setEditedFirstName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:outline-none transition-all focus:ring-blue-300"
                                                style={{ borderColor: '#dceaef' }}
                                                placeholder="Име"
                                                required
                                            />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#40768c' }}>Фамилия</label>
                                            <input
                                                type="text"
                                                value={editedLastName}
                                                onChange={(e) => setEditedLastName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:outline-none transition-all focus:ring-blue-300"
                                                style={{ borderColor: '#dceaef' }}
                                                placeholder="Фамилия"
                                                required
                                            />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#40768c' }}>Град</label>
                                    <input
                                        type="text"
                                        value={editedCity}
                                        onChange={(e) => setEditedCity(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:outline-none transition-all focus:ring-blue-300"
                                        style={{ borderColor: '#dceaef' }}
                                        placeholder="Град"
                                    />
                            </div>

                            {role === 'teacher' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#40768c' }}>Квалификации</label>
                                    <input
                                        type="text"
                                        value={editedQualifications}
                                        onChange={(e) => setEditedQualifications(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:outline-none transition-all focus:ring-blue-300"
                                        style={{ borderColor: '#dceaef' }}
                                        placeholder="Математика, Физика..."
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditMode(false);
                                    }}
                                    className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 border-2"
                                    style={{ 
                                        backgroundColor: '#eef4f7',
                                        borderColor: '#dceaef',
                                        color: '#40768c'
                                    }}
                                >
                                    Откажи
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingUpdate}
                                    className="flex-1 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ 
                                        background: role === 'teacher' 
                                            ? 'linear-gradient(135deg, #fb0473 0%, #c9035c 100%)'
                                            : 'linear-gradient(135deg, #5094af 0%, #40768c 100%)'
                                    }}
                                >
                                    {loadingUpdate ? 'Запазване...' : 'Запази'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
