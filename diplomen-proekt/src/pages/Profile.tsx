import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase, ensureValidSession } from "../supabase-client";
import { useNavigate } from "react-router-dom";
import { TeacherAvailabilityForm } from "../components/teacher-availability/TeacherAvailabilityForm";
import type {
    TeacherAvailabilityRow,
    TeacherBookingSettingsRow,
    TeacherBlockedSlotRow,
    TeacherScheduleExceptionRow,
} from "../types/teacher";
import type { TeacherAvailabilityFormData } from "../components/teacher-availability/TeacherAvailabilityForm";

export const Profile = () => {
    const { user, role, signOut, loading, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const showToast = useToast();

    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [totalEvents, setTotalEvents] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
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
    const [teacherProfile, setTeacherProfile] = useState<{
        hourly_rate: number | null;
        price_note: string | null;
        offers_online_lessons: boolean;
        description: string;
    } | null>(null);
    const [editedHourlyRate, setEditedHourlyRate] = useState('');
    const [editedPriceNote, setEditedPriceNote] = useState('');
    const [editedOffersOnline, setEditedOffersOnline] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [priceNegotiable, setPriceNegotiable] = useState(false);
    const [teacherAvailability, setTeacherAvailability] = useState<TeacherAvailabilityRow[]>([]);
    const [teacherBookingSettings, setTeacherBookingSettings] = useState<TeacherBookingSettingsRow | null>(null);
    const [teacherBlockedSlots, setTeacherBlockedSlots] = useState<TeacherBlockedSlotRow[]>([]);
    const [teacherExceptions, setTeacherExceptions] = useState<TeacherScheduleExceptionRow[]>([]);
    const [savingAvailability, setSavingAvailability] = useState(false);
    const [pendingBookings, setPendingBookings] = useState<{
        id: string;
        lesson_date: string;
        lesson_time: string;
        message: string | null;
        student_id: string;
        student_name?: string;
    }[]>([]);
    const [studentUpcomingBookings, setStudentUpcomingBookings] = useState<{
        id: string;
        lesson_date: string;
        lesson_time: string;
        status: string;
        teacher_name: string;
        teacher_profile_id: string;
        teacher_id: string;
    }[]>([]);
    const [actingOnBookingId, setActingOnBookingId] = useState<string | null>(null);

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

        if (role === 'student') {
            const todayKey = new Date().toISOString().slice(0, 10);
            const { data: myBookings } = await supabase
                .from('bookings')
                .select('id, lesson_date, lesson_time, status, teacher_profile_id')
                .eq('student_id', user.id)
                .in('status', ['pending', 'confirmed'])
                .gte('lesson_date', todayKey)
                .order('lesson_date', { ascending: true })
                .order('lesson_time', { ascending: true });
            const list = (myBookings ?? []) as { id: string; lesson_date: string; lesson_time: string; status: string; teacher_profile_id: string }[];
            if (list.length > 0) {
                const profileIds = [...new Set(list.map((b) => b.teacher_profile_id))];
                const { data: tpData } = await supabase.from('teacher_profiles').select('id, full_name, user_id').in('id', profileIds);
                const nameMap = new Map((tpData ?? []).map((p: { id: string; full_name: string | null; user_id: string }) => [p.id, { name: p.full_name ?? 'Учител', userId: p.user_id }]));
                setStudentUpcomingBookings(list.map((b) => {
                    const t = nameMap.get(b.teacher_profile_id);
                    return { ...b, teacher_name: t?.name ?? 'Учител', teacher_id: t?.userId ?? '' };
                }));
            } else {
                setStudentUpcomingBookings([]);
            }
        } else {
            setStudentUpcomingBookings([]);
        }

        if (role === 'teacher') {
            const { data: tp } = await supabase
                .from('teacher_profiles')
                .select('hourly_rate, price_note, offers_online_lessons, description')
                .eq('user_id', user.id)
                .maybeSingle();
            if (tp) {
                setTeacherProfile({
                    hourly_rate: tp.hourly_rate ?? null,
                    price_note: tp.price_note ?? null,
                    offers_online_lessons: tp.offers_online_lessons ?? false,
                    description: (tp as { description?: string | null }).description ?? '',
                });
            } else {
                setTeacherProfile(null);
            }
            const [avRes, setRes, blockRes, excRes] = await Promise.all([
                supabase.from('teacher_availability').select('*').eq('teacher_id', user.id).order('day_of_week'),
                supabase.from('teacher_booking_settings').select('*').eq('teacher_id', user.id).maybeSingle(),
                supabase.from('teacher_blocked_slots').select('*').eq('teacher_id', user.id),
                supabase.from('teacher_schedule_exceptions').select('*').eq('teacher_id', user.id).order('exception_date'),
            ]);
            setTeacherAvailability((avRes.data as TeacherAvailabilityRow[]) ?? []);
            setTeacherBookingSettings((setRes.data as TeacherBookingSettingsRow | null) ?? null);
            setTeacherBlockedSlots((blockRes.data as TeacherBlockedSlotRow[]) ?? []);
            setTeacherExceptions((excRes.data as TeacherScheduleExceptionRow[]) ?? []);
            const { data: pendingData } = await supabase
                .from('bookings')
                .select('id, lesson_date, lesson_time, message, student_id')
                .eq('teacher_id', user.id)
                .eq('status', 'pending')
                .order('lesson_date', { ascending: true })
                .order('lesson_time', { ascending: true });
            const list = (pendingData ?? []) as { id: string; lesson_date: string; lesson_time: string; message: string | null; student_id: string }[];
            if (list.length > 0) {
                const ids = [...new Set(list.map((b) => b.student_id))];
                const { data: profilesData } = await supabase.from('profiles').select('id, full_name').in('id', ids);
                const nameMap = new Map((profilesData ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name ?? 'Ученик']));
                setPendingBookings(list.map((b) => ({ ...b, student_name: nameMap.get(b.student_id) ?? 'Ученик' })));
            } else {
                setPendingBookings([]);
            }
        } else {
            setTeacherProfile(null);
            setTeacherAvailability([]);
            setTeacherBookingSettings(null);
            setTeacherBlockedSlots([]);
            setTeacherExceptions([]);
            setPendingBookings([]);
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
        }
    }, [user, role]);

    useEffect(() => {
        let isMounted = true;
        
        if (user) {
            setIsLoadingData(true);
            loadUserData()
                .then(async () => {
                    if (isMounted) {
                        setIsLoadingData(false);
                        const userMetadata = user.user_metadata as any;
                        if (userMetadata?.avatar_url) {
                            setAvatarUrl(userMetadata.avatar_url);
                            // синхронизация в profiles – за чат/навбар (ако още не е записано)
                            await supabase.from("profiles").update({ avatar_url: userMetadata.avatar_url }).eq("id", user.id);
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
            showToast('Моля въведете паролата си за потвърждение');
            return;
        }
        if (deleteConfirmText !== 'ИЗТРИЙ') {
            showToast('Моля напишете "ИЗТРИЙ" за потвърждение');
            return;
        }

        if (!user.email) {
            showToast('Email не е наличен');
            return;
        }

        setDeletingAccount(true);

        try {
            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: deletePassword,
            });

            if (verifyError) {
                showToast('Паролата е неправилна. Моля опитайте отново.');
                setDeletingAccount(false);
                return;
            }

            await ensureValidSession();

            const tablesToDelete: Array<{ table: string; column: string }> = [
                { table: 'user_hidden_messages', column: 'user_id' },
                { table: 'hidden_conversations', column: 'user_id' },
                { table: 'blocked_users', column: 'blocker_id' },
                { table: 'blocked_users', column: 'blocked_id' },
                { table: 'study_plans', column: 'user_id' },
                { table: 'calendar_events', column: 'user_id' },
                { table: 'user_stats', column: 'user_id' },
            ];
            for (const { table, column } of tablesToDelete) {
                const { error } = await supabase.from(table).delete().eq(column, user.id);
                if (error) console.warn(`Error deleting from ${table}:`, error);
            }
            await supabase.from('bookings').delete().eq('student_id', user.id);
            await supabase.from('bookings').delete().eq('teacher_id', user.id);

            // Messages (student or teacher)
            await supabase.from('messages').delete().eq('student_id', user.id);
            await supabase.from('messages').delete().eq('teacher_id', user.id);

            if (role === 'teacher') {
                const { data: tp } = await supabase.from('teacher_profiles').select('id').eq('user_id', user.id).maybeSingle();
                if (tp?.id) {
                    await supabase.from('teacher_reviews').delete().eq('teacher_id', tp.id);
                    await supabase.from('teacher_profiles').delete().eq('id', tp.id);
                }
                await supabase.from('teacher_availability').delete().eq('teacher_id', user.id);
                await supabase.from('teacher_booking_settings').delete().eq('teacher_id', user.id);
                await supabase.from('teacher_blocked_slots').delete().eq('teacher_id', user.id);
                await supabase.from('teacher_schedule_exceptions').delete().eq('teacher_id', user.id);
            } else {
                await supabase.from('teacher_profiles').delete().eq('user_id', user.id);
            }

            await supabase.from('profiles').delete().eq('id', user.id);

            const userMetadata = user.user_metadata as { avatar_url?: string };
            const avatarUrl = userMetadata?.avatar_url;
            if (avatarUrl) {
                try {
                    const urlParts = avatarUrl.split('/');
                    const filePath = urlParts.slice(-2).join('/');
                    await supabase.storage.from('profile-pictures').remove([filePath]);
                } catch (storageError) {
                    console.warn('Error deleting avatar:', storageError);
                }
            }


            const { error: deleteAuthError } = await supabase.rpc('delete_user_account', { user_id_to_delete: user.id });
            if (deleteAuthError) {
                console.error('Delete user error:', deleteAuthError);
                showToast(`Грешка при изтриване на акаунта: ${deleteAuthError.message}`);
            } else {
                showToast('Акаунтът ви е изтрит успешно. Всички ваши данни са премахнати.');
            }

            await signOut();
            navigate("/");
        } catch (error: unknown) {
            console.error('Error deleting account:', error);
            showToast(`Грешка при изтриване на акаунта: ${error instanceof Error ? error.message : 'Неизвестна грешка'}`);
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
            const firstName = editedFirstName.trim();
            const lastName = editedLastName.trim();
            const city = editedCity.trim();
            const qualifications = role === 'teacher' ? editedQualifications.trim() : undefined;
            const fullName = `${firstName} ${lastName}`.trim() || null;

            const profileUpdates: Record<string, string | null> = {
                first_name: firstName || null,
                last_name: lastName || null,
                city: city || null,
            };
            if (role === 'teacher' && qualifications !== undefined) {
                profileUpdates.qualifications = qualifications || null;
            }
            const { error: profileError } = await supabase
                .from('profiles')
                .update(profileUpdates)
                .eq('id', user.id);

            if (profileError) {
                console.error('Error updating profiles table:', profileError);
                showToast('Грешка при обновяване на профила');
                setLoadingUpdate(false);
                return;
            }
            const authUpdates: Record<string, string | null> = {
                first_name: firstName || null,
                last_name: lastName || null,
                city: city || null,
                full_name: fullName,
            };
            if (role === 'teacher' && qualifications !== undefined) {
                authUpdates.qualifications = qualifications || null;
            }
            const { error: authError } = await supabase.auth.updateUser({ data: authUpdates });
            if (authError) {
                console.error('Error updating auth metadata:', authError);
            }

            if (role === 'teacher') {
                const hourlyRateNum = priceNegotiable ? null : (editedHourlyRate.trim() ? Number(editedHourlyRate.trim()) : null);
                const priceNoteVal = priceNegotiable ? 'По договаряне' : (editedPriceNote.trim() || null);
                const descriptionVal = editedDescription.trim() || 'Учител в системата Матура+. Моля, попълнете профила си за да се покажете в списъка с учители.';
                const { error: tpError } = await supabase
                    .from('teacher_profiles')
                    .update({
                        full_name: fullName || undefined,
                        hourly_rate: hourlyRateNum,
                        price_note: priceNoteVal,
                        offers_online_lessons: editedOffersOnline,
                        description: descriptionVal,
                    })
                    .eq('user_id', user.id);
                if (tpError) {
                    console.error('Error updating teacher profile:', tpError);
                    showToast('Профилът е обновен, но данните за цена/онлайн не са запазени.');
                }
            }

            await new Promise(resolve => setTimeout(resolve, 300));
            await refreshProfile();
            await loadUserData();
            setEditMode(false);
            showToast('Профилът е обновен успешно!');
        } catch (error) {
            console.error('Error:', error);
            showToast('Грешка при обновяване на профила');
        } finally {
            setLoadingUpdate(false);
        }
    };

    const handleSaveAvailability = useCallback(async (data: TeacherAvailabilityFormData) => {
        if (!user || role !== 'teacher') return;
        setSavingAvailability(true);
        try {
            await ensureValidSession();
            await supabase.from('teacher_availability').delete().eq('teacher_id', user.id);
            if (data.availability.length > 0) {
                await supabase.from('teacher_availability').insert(
                    data.availability.map((a) => ({
                        teacher_id: user.id,
                        day_of_week: a.day_of_week,
                        start_time: a.start_time,
                        end_time: a.end_time,
                    }))
                );
            }
            await supabase.from('teacher_booking_settings').upsert(
                {
                    teacher_id: user.id,
                    lesson_duration_minutes: data.settings.lesson_duration_minutes,
                    buffer_minutes: data.settings.buffer_minutes,
                    auto_accept_bookings: data.settings.auto_accept_bookings,
                },
                { onConflict: 'teacher_id' }
            );
            await supabase.from('teacher_blocked_slots').delete().eq('teacher_id', user.id);
            if (data.blockedSlots.length > 0) {
                await supabase.from('teacher_blocked_slots').insert(
                    data.blockedSlots.map((b) => ({
                        teacher_id: user.id,
                        day_of_week: b.day_of_week,
                        start_time: b.start_time,
                        end_time: b.end_time,
                    }))
                );
            }
            await supabase.from('teacher_schedule_exceptions').delete().eq('teacher_id', user.id);
            if (data.exceptions.length > 0) {
                await supabase.from('teacher_schedule_exceptions').insert(
                    data.exceptions.map((e) => ({
                        teacher_id: user.id,
                        exception_date: e.exception_date,
                        is_fully_unavailable: e.is_fully_unavailable,
                        override_start_time: e.override_start_time,
                        override_end_time: e.override_end_time,
                    }))
                );
            }
            await loadUserData();
            showToast('Наличността е запазена успешно!');
        } catch (error) {
            console.error('Error saving availability:', error);
            showToast('Грешка при запазване на наличността');
        } finally {
            setSavingAvailability(false);
        }
    }, [user, role, loadUserData, showToast]);

    const formatBookingDateTime = (lessonDate: string, lessonTime: string) => {
        const timeStr = String(lessonTime).slice(0, 5);
        try {
            const d = new Date(lessonDate + 'T12:00:00');
            return d.toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' в ' + timeStr + ' ч.';
        } catch {
            return lessonDate + ' в ' + timeStr + ' ч.';
        }
    };

    const handleConfirmBooking = useCallback(async (bookingId: string, studentId: string, lessonDate: string, lessonTime: string) => {
        if (!user) return;
        setActingOnBookingId(bookingId);
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'confirmed' })
                .eq('id', bookingId)
                .eq('teacher_id', user.id);
            if (error) throw error;

            const dateTimeText = formatBookingDateTime(lessonDate, lessonTime);
            await supabase.from('messages').insert({
                student_id: studentId,
                teacher_id: user.id,
                message: `Вашият час в ${dateTimeText} е потвърден. До скоро!`,
                is_from_student: false,
            });

            showToast('Часът е потвърден. Ученикът ще получи съобщение в чата.');
            await loadUserData();
        } catch (e) {
            console.error('Error confirming booking:', e);
            showToast('Грешка при потвърждаване.');
        } finally {
            setActingOnBookingId(null);
        }
    }, [user, loadUserData, showToast]);

    const handleCancelBooking = useCallback(async (bookingId: string, studentId: string, lessonDate: string, lessonTime: string) => {
        if (!user || !confirm('Сигурни ли сте, че искате да откажете този час?')) return;
        setActingOnBookingId(bookingId);
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId)
                .eq('teacher_id', user.id);
            if (error) throw error;

            const dateTimeText = formatBookingDateTime(lessonDate, lessonTime);
            await supabase.from('messages').insert({
                student_id: studentId,
                teacher_id: user.id,
                message: `Съжалявам, часът в ${dateTimeText} е отменен. Можете да запишете друг час.`,
                is_from_student: false,
            });

            showToast('Часът е отказен. Ученикът ще получи съобщение в чата.');
            await loadUserData();
        } catch (e) {
            console.error('Error cancelling booking:', e);
            showToast('Грешка при отказ.');
        } finally {
            setActingOnBookingId(null);
        }
    }, [user, loadUserData, showToast]);

    const handleCancelMyBooking = useCallback(async (bookingId: string, teacherId: string, lessonDate: string, lessonTime: string) => {
        if (!user || !confirm('Сигурни ли сте, че искате да откажете този час?')) return;
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId)
                .eq('student_id', user.id);
            if (error) throw error;
            const dateTimeText = formatBookingDateTime(lessonDate, lessonTime);
            if (teacherId) {
                await supabase.from('messages').insert({
                    student_id: user.id,
                    teacher_id: teacherId,
                    message: `Отмених записания час на ${dateTimeText}.`,
                    is_from_student: true,
                });
            }
            showToast('Часът е отменен.');
            await loadUserData();
        } catch (e) {
            console.error('Error cancelling booking:', e);
            showToast('Грешка при отказ.');
        }
    }, [user, loadUserData, showToast]);

    const handleDeleteEvent = useCallback(async (eventId: string) => {
        if (!confirm('Сигурни ли сте, че искате да изтриете това събитие?')) return;

        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', eventId);

        if (error) {
            console.error('Error deleting event:', error);
            showToast('Грешка при изтриване на събитието');
        } else {
            showToast('Събитието е изтрито успешно');
            loadUserData();
        }
    }, [showToast, loadUserData]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        
        if (!file.type.startsWith('image/')) {
            showToast('Моля изберете валиден файл (изображение)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast('Файлът е твърде голям. Моля изберете изображение под 2MB');
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


            const { error: profileErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
            if (profileErr) console.warn("Профил: не може да се запише avatar_url в profiles", profileErr.message);

            // update local state immediately
            setAvatarUrl(publicUrl);
            
            // wait for auth state change listener to update the user object
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await loadUserData();
            await refreshProfile();
            showToast('Профилната снимка е обновена успешно!');
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            showToast(`Грешка при качване на снимката: ${error.message}`);
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

            showToast('Паролата е променена успешно!');
            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
        } catch (error: any) {
            console.error('Error changing password:', error);
            const errMsg = error.message || 'Грешка при промяна на паролата';
            setPasswordError(errMsg);
            showToast(errMsg);
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


            const { error: profileErr } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
            if (profileErr) console.warn("Профил: не може да се изтрие avatar_url в profiles", profileErr.message);

            setAvatarUrl(null);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadUserData();
            await refreshProfile();
            showToast('Профилната снимка е премахната успешно!');
        } catch (error: any) {
            console.error('Error removing avatar:', error);
            showToast(`Грешка при премахване на снимката: ${error.message}`);
        }
    };

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
        return fullName || user.email?.split('@')[0] || (role === 'teacher' ? 'Учител' : 'Ученик');
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

    const futurePendingBookings = useMemo(
        () =>
            pendingBookings.filter(
                (b) => new Date(b.lesson_date + 'T' + (b.lesson_time?.slice(0, 5) || '00:00')) > new Date()
            ),
        [pendingBookings]
    );

    useEffect(() => {
        if (loading || isLoadingData || !user) return;
        if (window.location.hash === '#my-bookings') {
            const el = document.getElementById('my-bookings');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [loading, isLoadingData, user, studentUpcomingBookings.length]);

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${role === 'teacher' ? 'bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10' : 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50'}`}>
                <div className="text-center">
                    <svg className="animate-spin w-12 h-12 text-purple-900 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
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
        <div className={`min-h-screen ${role === 'teacher' ? 'bg-gradient-to-br from-slate-50 via-purple-50/20 to-blue-50/10' : 'bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50'} relative overflow-x-hidden`}>
            {/* background*/}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/30 via-purple-100/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-200/20 via-purple-100/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-purple-100/10 via-transparent to-transparent rounded-full blur-3xl"></div>
            </div>
            {/* loading overlay */}
            {isLoadingData && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200/60">
                        <div className="flex flex-col items-center gap-4">
                            <svg className="animate-spin w-12 h-12 text-purple-900" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm font-semibold text-slate-700">Зареждане на данни...</p>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-8 py-16 relative z-10">
                {/* header */}
                <div className="mb-16">
                    <button
                        onClick={() => navigate("/home")}
                        className="text-slate-600 hover:text-purple-900 flex items-center gap-2 mb-10 transition-all duration-500 text-sm font-semibold group hover:gap-3 px-4 py-2 rounded-xl hover:bg-white/60 backdrop-blur-sm hover:shadow-lg"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Назад към начало</span>
                    </button>
                    <div className="flex items-center justify-between gap-8 mb-4">
                        <div className="space-y-2">
                            <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-4 bg-gradient-to-r from-slate-900 via-purple-900 via-purple-800 to-slate-900 bg-clip-text text-transparent leading-tight">
                                Профил
                            </h1>
                            <p className="text-lg font-medium text-slate-600">Управление на акаунта и настройки</p>
                        </div>
                        {role === 'student' && (
                            <div className="flex items-center gap-5 px-10 py-6 rounded-3xl bg-white/90 backdrop-blur-2xl border-2 border-purple-200/80 shadow-2xl shadow-purple-900/15 hover:shadow-purple-900/25 transition-all duration-700 hover:scale-110 hover:rotate-1 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="text-5xl animate-pulse group-hover:scale-125 transition-transform duration-700 relative z-10">🔥</div>
                                <div className="relative z-10">
                                    <div className="text-4xl font-black text-purple-900 leading-none tabular-nums group-hover:scale-110 transition-transform duration-700">{currentStreak}</div>
                                    <div className="text-xs text-purple-700 font-bold mt-1.5 uppercase tracking-widest">дни серия</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* profile card */}
                        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 overflow-hidden relative group">
                            {/* gradient overlays */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30 pointer-events-none"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                            <div className="relative p-12">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
                                    {/* avatar section */}
                                    <div className="relative group/avatar flex-shrink-0">
                                        <div className="relative">
                                            {/* glow effect */}
                                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-400/30 to-purple-600/30 blur-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700 -z-10"></div>
                                            {currentAvatarUrl ? (
                                                <img 
                                                    src={currentAvatarUrl} 
                                                    alt={displayName}
                                                    className="w-36 h-36 rounded-3xl object-cover shadow-2xl ring-4 ring-purple-200/60 transition-all duration-700 group-hover/avatar:scale-110 group-hover/avatar:ring-purple-400/80 group-hover/avatar:shadow-purple-900/40 group-hover/avatar:rotate-2"
                                                />
                                            ) : (
                                                <div className="w-36 h-36 rounded-3xl flex items-center justify-center text-white text-6xl font-black shadow-2xl ring-4 ring-purple-200/60 transition-all duration-700 group-hover/avatar:scale-110 group-hover/avatar:ring-purple-400/80 group-hover/avatar:shadow-purple-900/40 group-hover/avatar:rotate-2 bg-gradient-to-br from-purple-900 via-purple-800 via-purple-700 to-purple-900">
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {/* status indicator */}
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 border-4 border-white shadow-2xl ring-2 ring-emerald-200/60 animate-pulse"></div>
                                        </div>
                                        {/* upload overlay */}
                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/90 via-black/70 to-black/50 opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4 cursor-pointer backdrop-blur-xl">
                                            <label className="cursor-pointer transform hover:scale-110 transition-transform duration-300">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                    className="hidden"
                                                    disabled={uploadingAvatar}
                                                />
                                                <div className="px-6 py-3 rounded-2xl text-white text-sm font-bold bg-white/30 backdrop-blur-xl hover:bg-white/40 transition-all hover:scale-110 border-2 border-white/40 shadow-2xl">
                                                    {uploadingAvatar ? (
                                                        <div className="flex items-center gap-2">
                                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Качване...
                                                        </div>
                                                    ) : currentAvatarUrl ? 'Смени' : 'Добави'}
                                                </div>
                                            </label>
                                            {currentAvatarUrl && (
                                                <button
                                                    onClick={handleRemoveAvatar}
                                                    className="px-6 py-3 rounded-2xl text-white text-sm font-bold bg-red-500/95 hover:bg-red-600 backdrop-blur-xl transition-all hover:scale-110 border-2 border-red-400/60 shadow-2xl"
                                                    disabled={uploadingAvatar}
                                                >
                                                    Премахни
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                   {/* Profile Info Section */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-6 mb-10">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-4 mb-4 flex-wrap">
                                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                                        {displayName}
                                                    </h2>
                                                    {roleLabel && (
                                                        <span className="px-4 py-1.5 text-xs font-black text-purple-900 bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 rounded-2xl uppercase tracking-widest border-2 border-purple-300/60 shadow-lg shadow-purple-900/10">
                                                            {roleLabel.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-lg font-semibold text-slate-700 flex items-center gap-3 group/email">
                                                    <svg className="w-5 h-5 text-purple-600 group-hover/email:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">{user.email}</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setEditMode(true);
                                                    setEditedFirstName(firstName || '');
                                                    setEditedLastName(lastName || '');
                                                    setEditedCity(city || '');
                                                    setEditedQualifications(qualifications || '');
                                                    if (role === 'teacher' && teacherProfile) {
                                                        setEditedHourlyRate(teacherProfile.hourly_rate != null ? String(teacherProfile.hourly_rate) : '');
                                                        setEditedPriceNote(teacherProfile.price_note || '');
                                                        setEditedOffersOnline(teacherProfile.offers_online_lessons);
                                                        setPriceNegotiable(teacherProfile.price_note === 'По договаряне');
                                                        setEditedDescription(teacherProfile.description || '');
                                                    } else if (role === 'teacher') {
                                                        setEditedHourlyRate('');
                                                        setEditedPriceNote('');
                                                        setEditedOffersOnline(false);
                                                        setPriceNegotiable(false);
                                                        setEditedDescription('');
                                                    }
                                                }}
                                                className="px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 hover:from-purple-700 hover:via-purple-800 hover:to-purple-700 text-white rounded-2xl font-bold transition-all duration-500 flex items-center gap-3 border-2 border-purple-500/50 hover:border-purple-400/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/40 hover:scale-105 shadow-xl shadow-purple-900/30 group"
                                            >
                                                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Редактирай
                                            </button>
                                        </div>

                                        {/* profile details */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 border-t-2 border-gradient-to-r from-transparent via-purple-200/40 to-transparent">
                                            {city && (
                                                <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-6 border-2 border-purple-200/40 hover:border-purple-300/60 transition-all duration-500 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 group relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    <p className="text-xs font-black text-purple-600 mb-3 uppercase tracking-widest relative z-10">Град</p>
                                                    <p className="text-lg font-bold text-slate-900 relative z-10">
                                                        {city}
                                                        {role === 'student' && grade && <span className="text-slate-600 font-semibold"> • {grade} клас</span>}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-6 border-2 border-purple-200/40 hover:border-purple-300/60 transition-all duration-500 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                <p className="text-xs font-black text-purple-600 mb-3 uppercase tracking-widest relative z-10">Член от</p>
                                                <p className="text-lg font-bold text-slate-900 relative z-10">{memberSince}</p>
                                            </div>
                                            {role === 'teacher' && qualifications && (
                                                <div className="sm:col-span-2 bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-6 border-2 border-purple-200/40 hover:border-purple-300/60 transition-all duration-500 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 group relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    <p className="text-xs font-black text-purple-600 mb-3 uppercase tracking-widest relative z-10">Квалификации</p>
                                                    <p className="text-lg font-bold text-slate-900 relative z-10">{qualifications}</p>
                                                </div>
                                            )}
                                            {role === 'teacher' && teacherProfile && (teacherProfile.hourly_rate != null || teacherProfile.price_note || teacherProfile.offers_online_lessons) && (
                                                <div className="sm:col-span-2 bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl p-6 border-2 border-purple-200/40 hover:border-purple-300/60 transition-all duration-500 hover:shadow-xl hover:shadow-purple-900/10 hover:-translate-y-1 group relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    <p className="text-xs font-black text-purple-600 mb-3 uppercase tracking-widest relative z-10">Цена и онлайн уроци</p>
                                                    <div className="relative z-10 space-y-1">
                                                        {teacherProfile.hourly_rate != null && (
                                                            <p className="text-lg font-bold text-slate-900">Цена за час: {teacherProfile.hourly_rate} €</p>
                                                        )}
                                                        {teacherProfile.price_note && (
                                                            <p className="text-slate-700">{teacherProfile.price_note}</p>
                                                        )}
                                                        {teacherProfile.offers_online_lessons && (
                                                            <p className="text-sm font-semibold text-emerald-700">Предлага онлайн уроци</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {role === 'teacher' && (
                                <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-8 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                        Кога съм на разположение
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-6">
                                        Настройте работните си дни и часове, продължителност на урок и почивки. Учениците ще виждат само свободни слотове.
                                    </p>
                                    <TeacherAvailabilityForm
                                        initialAvailability={teacherAvailability}
                                        initialSettings={teacherBookingSettings}
                                        initialBlocked={teacherBlockedSlots}
                                        initialExceptions={teacherExceptions}
                                        onSave={handleSaveAvailability}
                                        saving={savingAvailability}
                                    />
                                </div>
                            )}

                            {role === 'teacher' && futurePendingBookings.length > 0 && (
                                <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-8 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                        Чакащи часове за потвърждение
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Потвърдете или откажете записаните от учениците часове.
                                    </p>
                                    <ul className="space-y-3">
                                        {futurePendingBookings.map((b) => (
                                                <li
                                                    key={b.id}
                                                    className="flex flex-wrap items-center gap-3 rounded-xl border border-purple-200/60 bg-purple-50/40 p-4"
                                                >
                                                    <span className="font-semibold text-slate-800">
                                                        {b.lesson_date} {String(b.lesson_time).slice(0, 5)}
                                                    </span>
                                                    <span className="text-slate-600">{b.student_name}</span>
                                                    {b.message && (
                                                        <span className="text-sm text-slate-500 truncate max-w-xs" title={b.message}>
                                                            {b.message}
                                                        </span>
                                                    )}
                                                    <div className="ml-auto flex gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={actingOnBookingId !== null}
                                                            onClick={() => handleConfirmBooking(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                                            className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-sm font-medium hover:bg-purple-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            {actingOnBookingId === b.id ? '...' : 'Потвърди'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={actingOnBookingId !== null}
                                                            onClick={() => handleCancelBooking(b.id, b.student_id, b.lesson_date, b.lesson_time)}
                                                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            {actingOnBookingId === b.id ? '...' : 'Откажи'}
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}
                            
                            {/* stats section for students */}
                            {role === 'student' && (
                                <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-10 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 relative overflow-hidden group">
                                    {/* gradient overlays */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30 pointer-events-none"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                    <div className="relative">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-10 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Статистика</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="bg-gradient-to-br from-white via-purple-50/40 to-white backdrop-blur-sm rounded-2xl p-7 border-2 border-purple-200/50 hover:border-purple-400/70 hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-700 hover:-translate-y-3 hover:scale-110 group/stat relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-200/50 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-700"></div>
                                                <div className="flex flex-col items-center text-center relative z-10">
                                                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-purple-900 via-purple-800 via-purple-700 to-purple-900 shadow-2xl shadow-purple-900/50 group-hover/stat:scale-125 group-hover/stat:rotate-6 transition-all duration-700">
                                                        <span className="text-4xl group-hover/stat:scale-110 transition-transform duration-700">🔥</span>
                                                    </div>
                                                    <p className="text-4xl font-black text-slate-900 mb-2 group-hover/stat:scale-110 transition-transform duration-700">{currentStreak}</p>
                                                    <p className="text-xs font-black text-purple-600 uppercase tracking-widest">Текуща серия</p>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-white via-purple-50/40 to-white backdrop-blur-sm rounded-2xl p-7 border-2 border-purple-200/50 hover:border-purple-400/70 hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-700 hover:-translate-y-3 hover:scale-110 group/stat relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-200/50 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-700"></div>
                                                <div className="flex flex-col items-center text-center relative z-10">
                                                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-purple-900 via-purple-800 via-purple-700 to-purple-900 shadow-2xl shadow-purple-900/50 group-hover/stat:scale-125 group-hover/stat:rotate-6 transition-all duration-700">
                                                        <span className="text-4xl group-hover/stat:scale-110 transition-transform duration-700">🏆</span>
                                                    </div>
                                                    <p className="text-4xl font-black text-slate-900 mb-2 group-hover/stat:scale-110 transition-transform duration-700">{longestStreak}</p>
                                                    <p className="text-xs font-black text-purple-600 uppercase tracking-widest">Най-дълга серия</p>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-white via-purple-50/40 to-white backdrop-blur-sm rounded-2xl p-7 border-2 border-purple-200/50 hover:border-purple-400/70 hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-700 hover:-translate-y-3 hover:scale-110 group/stat relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-200/50 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-700"></div>
                                                <div className="flex flex-col items-center text-center relative z-10">
                                                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-purple-900 via-purple-800 via-purple-700 to-purple-900 shadow-2xl shadow-purple-900/50 group-hover/stat:scale-125 group-hover/stat:rotate-6 transition-all duration-700">
                                                        <span className="text-4xl group-hover/stat:scale-110 transition-transform duration-700">⭐</span>
                                                    </div>
                                                    <p className="text-4xl font-black text-slate-900 mb-2 group-hover/stat:scale-110 transition-transform duration-700">{earnedPoints}</p>
                                                    <p className="text-xs font-black text-purple-600 uppercase tracking-widest">Точки</p>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-br from-white via-purple-50/40 to-white backdrop-blur-sm rounded-2xl p-7 border-2 border-purple-200/50 hover:border-purple-400/70 hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-700 hover:-translate-y-3 hover:scale-110 group/stat relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-200/50 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-700"></div>
                                                <div className="flex flex-col items-center text-center relative z-10">
                                                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br from-purple-900 via-purple-800 via-purple-700 to-purple-900 shadow-2xl shadow-purple-900/50 group-hover/stat:scale-125 group-hover/stat:rotate-6 transition-all duration-700">
                                                        <svg className="w-10 h-10 text-white group-hover/stat:scale-110 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-4xl font-black text-slate-900 mb-2 group-hover/stat:scale-110 transition-transform duration-700">{totalEvents}</p>
                                                    <p className="text-xs font-black text-purple-600 uppercase tracking-widest">Събития</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {role === 'student' && studentUpcomingBookings.length > 0 && (
                                <div id="my-bookings" className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-8 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 scroll-mt-6">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                        Моите записани часове
                                    </h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Тук виждате записаните от вас часове. Ще получите съобщение в чата, когато учителят потвърди или откаже.
                                    </p>
                                    <ul className="space-y-3">
                                        {studentUpcomingBookings.map((b) => {
                                            const timeStr = String(b.lesson_time).slice(0, 5);
                                            const dateStr = (() => {
                                                try {
                                                    return new Date(b.lesson_date + 'T12:00').toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                                                } catch {
                                                    return b.lesson_date;
                                                }
                                            })();
                                            const isPending = b.status === 'pending';
                                            return (
                                                <li
                                                    key={b.id}
                                                    className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${
                                                        isPending ? 'border-amber-200/80 bg-amber-50/50' : 'border-emerald-200/60 bg-emerald-50/40'
                                                    }`}
                                                >
                                                    <span className="font-semibold text-slate-800">
                                                        {dateStr} в {timeStr} ч.
                                                    </span>
                                                    <span className="text-slate-600">{b.teacher_name}</span>
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold ${
                                                            isPending
                                                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        }`}
                                                    >
                                                        {isPending ? (
                                                            <>⏳ Чака потвърждение</>
                                                        ) : (
                                                            <>✓ Потвърден</>
                                                        )}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelMyBooking(b.id, b.teacher_id, b.lesson_date, b.lesson_time)}
                                                        className="ml-auto px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-100 hover:border-red-200 hover:text-red-700"
                                                    >
                                                        Откажи час
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {/* settings */}
                            <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-10 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30 pointer-events-none"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                <div className="relative">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Настройки</h3>
                                    <div className="space-y-5">
                                        <button
                                            onClick={() => setShowChangePassword(true)}
                                            className="w-full px-8 py-5 bg-gradient-to-br from-white via-slate-50 to-white hover:from-purple-50 hover:via-purple-100/50 hover:to-purple-50 text-slate-700 hover:text-purple-900 rounded-2xl font-bold transition-all duration-700 flex items-center justify-center gap-3 text-base border-2 border-slate-200/60 hover:border-purple-300/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/20 group/btn"
                                        >
                                            <svg className="w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                            Смени парола
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full px-8 py-5 bg-gradient-to-br from-white via-slate-50 to-white hover:from-slate-100 hover:via-slate-50 hover:to-slate-100 text-slate-700 rounded-2xl font-bold transition-all duration-700 flex items-center justify-center gap-3 text-base border-2 border-slate-200/60 hover:border-slate-300/60 hover:-translate-y-2 hover:shadow-2xl group/btn"
                                        >
                                            <svg className="w-6 h-6 group-hover/btn:-translate-x-1 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Изход от профил
                                        </button>
                                    </div>
                                    
                                    {/* destructive actions */}
                                    <div className="mt-10 pt-10 border-t-2 border-gradient-to-r from-transparent via-red-200/40 to-transparent">
                                        <button
                                            onClick={() => setShowDeleteAccount(true)}
                                            className="w-full px-8 py-5 rounded-2xl font-black text-sm text-white transition-all duration-700 flex items-center justify-center gap-3 shadow-2xl hover:shadow-red-900/40 hover:scale-110 bg-gradient-to-r from-red-600 via-red-700 via-red-800 to-red-600 hover:from-red-700 hover:via-red-900 hover:to-red-700 group/btn relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                                            <svg className="w-6 h-6 group-hover/btn:rotate-12 transition-transform duration-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span className="relative z-10">Изтрий акаунт</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* right column */}
                    <div className="space-y-6">
                        {/* quick actions */}
                        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-10 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30 pointer-events-none"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                            <div className="relative">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-8 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Бързи действия</h3>
                                <div className="space-y-5">
                                    <button
                                        onClick={() => navigate("/home")}
                                        className="w-full px-8 py-5 rounded-2xl font-black transition-all duration-700 ease-out flex items-center justify-center gap-3 text-base shadow-2xl shadow-purple-900/40 hover:shadow-purple-900/50 hover:-translate-y-3 hover:scale-110 bg-gradient-to-r from-purple-900 via-purple-800 via-purple-700 to-purple-900 text-white group/btn relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                                        <svg className="w-6 h-6 group-hover/btn:rotate-180 transition-transform duration-700 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="relative z-10">Добави събитие</span>
                                    </button>
                                    {role === 'student' && (
                                        <button
                                            onClick={() => navigate("/home")}
                                            className="w-full px-8 py-5 bg-gradient-to-br from-white via-slate-50 to-white hover:from-purple-50 hover:via-purple-100/50 hover:to-purple-50 text-slate-700 hover:text-purple-900 rounded-2xl font-bold transition-all duration-700 flex items-center justify-center gap-3 text-base border-2 border-slate-200/60 hover:border-purple-300/60 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/20 group/btn"
                                        >
                                            <svg className="w-6 h-6 group-hover/btn:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Виж статистики
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* upcoming events */}
                        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-900/10 border-2 border-purple-200/40 p-10 hover:shadow-purple-900/20 hover:border-purple-300/60 transition-all duration-700 relative overflow-hidden group">
                            {/* gradient overlays */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-purple-50/30 pointer-events-none"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                                        {role === 'teacher' ? 'Събития' : 'Предстоящи събития'}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        {role === 'teacher' && allEvents.length > 0 && (
                                            <button
                                                onClick={() => setShowAllEvents(!showAllEvents)}
                                                className="text-sm font-bold text-slate-700 hover:text-purple-900 transition-all px-5 py-2.5 rounded-2xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 border-2 border-slate-200/60 hover:border-purple-300/60 hover:shadow-lg hover:-translate-y-0.5"
                                            >
                                                {showAllEvents ? 'Предстоящи' : 'Всички'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => navigate("/home")}
                                            className="text-sm font-bold text-slate-700 hover:text-purple-900 transition-all flex items-center gap-2.5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 px-5 py-2.5 rounded-2xl border-2 border-slate-200/60 hover:border-purple-300/60 hover:shadow-lg hover:-translate-y-0.5 group/btn"
                                        >
                                            {role === 'teacher' ? 'Добави' : 'Виж всички'}
                                            <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                            {(role === 'teacher' && showAllEvents ? allEvents : upcomingEvents).length > 0 ? (
                                <div className="space-y-3">
                                    {(role === 'teacher' && showAllEvents ? allEvents : upcomingEvents).map((event, index) => {
                                        return (
                                            <div 
                                                key={event.id || index} 
                                                className="group/event bg-gradient-to-br from-white via-purple-50/50 to-white backdrop-blur-sm hover:from-purple-100/70 hover:via-purple-50/40 hover:to-white border-2 border-purple-200/50 hover:border-purple-400/70 rounded-2xl p-6 transition-all duration-700 cursor-pointer hover:shadow-2xl hover:shadow-purple-900/25 hover:-translate-y-2 hover:scale-[1.03] relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/0 to-purple-200/40 opacity-0 group-hover/event:opacity-100 transition-opacity duration-700"></div>
                                                <div className="flex items-center gap-6 relative z-10">
                                                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-black shadow-2xl bg-gradient-to-br from-purple-900 via-purple-800 via-purple-700 to-purple-900 group-hover/event:scale-125 group-hover/event:rotate-3 transition-all duration-700">
                                                        <span className="uppercase leading-tight text-[10px]">
                                                            {formatDate(event.date).split(' ')[1]}
                                                        </span>
                                                        <span className="text-xl font-black leading-none mt-0.5">{formatDate(event.date).split(' ')[0]}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-6">
                                                        <p className="text-xs font-black text-purple-600 mb-2 uppercase tracking-widest">
                                                            {formatFullDate(event.date)}
                                                        </p>
                                                        <p className="text-lg font-bold text-slate-900 group-hover/event:text-purple-900 transition-colors duration-300 break-words leading-relaxed">
                                                            {event.event_text}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteEvent(event.id);
                                                        }}
                                                        className="opacity-0 group-hover/event:opacity-100 transition-all duration-500 p-3 rounded-2xl hover:bg-red-50 text-red-600 hover:scale-125 hover:rotate-12 border-2 border-transparent hover:border-red-200/60 flex-shrink-0"
                                                        title="Изтрий събитие"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-200/60">
                                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-normal text-slate-500 mb-4">
                                        {showAllEvents ? 'Няма събития' : 'Няма предстоящи събития'}
                                    </p>
                                    <button
                                        onClick={() => navigate("/home")}
                                        className="px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 ease-out flex items-center gap-2.5 text-base shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-900/40 hover:-translate-y-1 hover:scale-[1.02] bg-gradient-to-r from-purple-900 to-purple-800 text-white mx-auto"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Добави събитие
                                    </button>
                                </div>
                            )}
                            </div>
                        </div>

                        {/* recent activity for students */}
                        {role === 'student' && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-purple-900/5 border border-slate-200/60 p-8 hover:shadow-2xl hover:shadow-purple-900/10 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-transparent to-purple-50/10 pointer-events-none"></div>
                                <div className="relative">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-8">Последна активност</h3>

                                    {recentActivity.length > 0 ? (
                                        <div className="space-y-4">
                                            {recentActivity.map((event, index) => (
                                                <div 
                                                    key={index} 
                                                    className="group bg-gradient-to-br from-slate-50/60 to-white backdrop-blur-sm hover:from-slate-100/60 hover:to-slate-50/30 border border-slate-200/60 rounded-2xl p-5 transition-all duration-500 cursor-pointer hover:shadow-xl hover:border-slate-300/80 hover:-translate-y-1 hover:scale-[1.02]"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold shadow-xl bg-gradient-to-br from-slate-500 via-slate-600 to-slate-500 group-hover:scale-110 transition-transform duration-500">
                                                            <span className="uppercase leading-tight text-[10px]">
                                                                {formatDate(event.date).split(' ')[1]}
                                                            </span>
                                                            <span className="text-lg font-black leading-none mt-0.5">{formatDate(event.date).split(' ')[0]}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-6">
                                                            <p className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                                                                {formatDate(event.date)}
                                                            </p>
                                                            <p className="text-base font-semibold text-slate-900 break-words leading-relaxed">
                                                                {event.event_text}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200/60 shadow-lg">
                                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-normal text-slate-500">Все още няма активност</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* change password modal */}
            {showChangePassword && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-10 max-w-lg w-full shadow-2xl shadow-purple-900/30 animate-in zoom-in-95 duration-500 border-2 border-purple-200/60 relative overflow-hidden">
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-purple-50/20 pointer-events-none"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Смени парола</h3>
                                <button
                                    onClick={() => {
                                        setShowChangePassword(false);
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setPasswordError('');
                                    }}
                                    className="p-2.5 rounded-2xl hover:bg-slate-100 transition-all duration-300 hover:scale-110 hover:rotate-90 border-2 border-transparent hover:border-slate-200/60"
                                >
                                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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
                                <label className="block text-sm font-medium text-slate-700 mb-2">Текуща парола</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                    placeholder="Въведете текущата парола"
                                    required
                                    disabled={changingPassword}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Нова парола</label>
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
                                    className={`w-full px-5 py-4 border-2 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 ${passwordError && newPassword ? 'border-red-200 focus:border-red-300' : 'border-slate-200 focus:border-purple-900'}`}
                                    placeholder="Минимум 8 символа, главна буква, малка буква, цифра, специален символ"
                                    required
                                    disabled={changingPassword}
                                    minLength={8}
                                />
                                {!passwordError && newPassword && (
                                    <p className="mt-2 text-xs text-emerald-600">
                                        ✓ Паролата отговаря на изискванията
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Потвърди нова парола</label>
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
                                    className={`w-full px-5 py-4 border-2 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 ${passwordError && confirmPassword && confirmPassword !== newPassword ? 'border-red-200 focus:border-red-300' : 'border-slate-200 focus:border-purple-900'}`}
                                    placeholder="Повтори новата парола"
                                    required
                                    disabled={changingPassword}
                                    minLength={8}
                                />
                                {confirmPassword && confirmPassword === newPassword && !passwordError && (
                                    <p className="mt-2 text-xs text-emerald-600">
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
                                    className="flex-1 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300"
                                    disabled={changingPassword}
                                >
                                    Откажи
                                </button>
                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="flex-1 px-6 py-3 text-sm font-semibold bg-purple-900 hover:bg-purple-800 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {changingPassword ? 'Запазване...' : 'Смени парола'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}


            {/* delete account modal */}
            {showDeleteAccount && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-10 max-w-lg w-full shadow-2xl shadow-red-900/30 animate-in zoom-in-95 duration-500 border-2 border-red-200/60 relative overflow-hidden">
                        {/* gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-transparent to-red-50/20 pointer-events-none"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-3xl font-black text-red-900 tracking-tight">Изтрий акаунт</h3>
                                <button
                                    onClick={() => {
                                        setShowDeleteAccount(false);
                                        setDeletePassword('');
                                        setDeleteConfirmText('');
                                    }}
                                    className="p-2.5 rounded-2xl hover:bg-slate-100 transition-all duration-300 hover:scale-110 hover:rotate-90 border-2 border-transparent hover:border-slate-200/60"
                                    disabled={deletingAccount}
                                >
                                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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
                                <label className="block text-sm font-medium text-slate-700 mb-2">Потвърди с парола</label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className="w-full px-5 py-4 border-2 border-red-200 focus:border-red-300 rounded-2xl text-base focus:ring-4 focus:ring-red-300/20 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                    placeholder="Въведете паролата си"
                                    required
                                    disabled={deletingAccount}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Напишете <span className="font-bold text-red-600">ИЗТРИЙ</span> за потвърждение
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full px-5 py-4 border-2 border-red-200 focus:border-red-300 rounded-2xl text-base focus:ring-4 focus:ring-red-300/20 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 uppercase"
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
                                    className="flex-1 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300"
                                    disabled={deletingAccount}
                                >
                                    Откажи
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    disabled={deletingAccount || deleteConfirmText !== 'ИЗТРИЙ' || !deletePassword}
                                    className="flex-1 px-6 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
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
                </div>
            )}

            {/* edit profile */}
            {editMode && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-10 max-w-lg w-full shadow-2xl shadow-purple-900/30 animate-in zoom-in-95 duration-500 border-2 border-purple-200/60 max-h-[90vh] overflow-y-auto relative">
                        {/* gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-purple-50/20 pointer-events-none"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">Редактирай профил</h3>
                                <button
                                    onClick={() => {
                                        setEditMode(false);
                                    }}
                                    className="p-2.5 rounded-2xl hover:bg-slate-100 transition-all duration-300 hover:scale-110 hover:rotate-90 border-2 border-transparent hover:border-slate-200/60"
                                >
                                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Име</label>
                                    <input
                                        type="text"
                                        value={editedFirstName}
                                        onChange={(e) => setEditedFirstName(e.target.value)}
                                        className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                        placeholder="Име"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Фамилия</label>
                                    <input
                                        type="text"
                                        value={editedLastName}
                                        onChange={(e) => setEditedLastName(e.target.value)}
                                        className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                        placeholder="Фамилия"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Град</label>
                                <input
                                    type="text"
                                    value={editedCity}
                                    onChange={(e) => setEditedCity(e.target.value)}
                                    className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                    placeholder="Град"
                                />
                            </div>

                                            {role === 'teacher' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Квалификации</label>
                                    <input
                                        type="text"
                                        value={editedQualifications}
                                        onChange={(e) => setEditedQualifications(e.target.value)}
                                        className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                        placeholder="Математика, Физика..."
                                    />
                                </div>
                            )}

                            {role === 'teacher' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Биография / Описание</label>
                                    <textarea
                                        value={editedDescription}
                                        onChange={(e) => setEditedDescription(e.target.value)}
                                        rows={5}
                                        className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400 resize-y"
                                        placeholder="Кратко представяне за учениците: опит, подход, за какво преподавате..."
                                    />
                                </div>
                            )}

                            {role === 'teacher' && (
                                <>
                                    <div className="border-t border-slate-200 pt-5 mt-2">
                                        <p className="text-sm font-bold text-purple-700 mb-3">Цена и онлайн уроци</p>
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={priceNegotiable}
                                                    onChange={(e) => {
                                                        setPriceNegotiable(e.target.checked);
                                                        if (e.target.checked) setEditedHourlyRate('');
                                                    }}
                                                    className="w-5 h-5 rounded border-2 border-slate-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-slate-700 font-medium">По договаряне</span>
                                            </label>
                                            {!priceNegotiable && (
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Цена за час (€)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={editedHourlyRate}
                                                        onChange={(e) => setEditedHourlyRate(e.target.value)}
                                                        className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                                        placeholder="напр. 25"
                                                    />
                                                </div>
                                            )}
                                            {!priceNegotiable && (
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Бележка за цената (по избор)</label>
                                                    <input
                                                        type="text"
                                                        value={editedPriceNote}
                                                        onChange={(e) => setEditedPriceNote(e.target.value)}
                                                        className="w-full px-5 py-4 border-2 border-slate-200 focus:border-purple-900 rounded-2xl text-base focus:ring-4 focus:ring-purple-900/10 outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                                        placeholder="напр. При пакет 10 урока - отстъпка"
                                                    />
                                                </div>
                                            )}
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={editedOffersOnline}
                                                    onChange={(e) => setEditedOffersOnline(e.target.checked)}
                                                    className="w-5 h-5 rounded border-2 border-slate-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-slate-700 font-medium">Предлагам онлайн уроци</span>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditMode(false);
                                    }}
                                    className="flex-1 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300"
                                >
                                    Откажи
                                </button>
                                <button
                                    type="submit"
                                    disabled={loadingUpdate}
                                    className="flex-1 px-6 py-3 text-sm font-semibold bg-purple-900 hover:bg-purple-800 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30 hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingUpdate ? 'Запазване...' : 'Запази'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
