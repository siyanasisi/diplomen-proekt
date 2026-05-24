import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase-client';
import { useToast } from '../context/ToastContext';
import { SignupView } from '../components/auth/SignupView';
import { isBulgarianCity } from '../lib/bulgarianCities';

export default function SignUp() {
  const navigate = useNavigate();
  const showToast = useToast();
  
  // form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [grade, setGrade] = useState('');
  const [city, setCity] = useState('');
  const [qualifications, setQualifications] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [cityError, setCityError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validateEmail = (v: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(v) ? '' : 'Моля, въведете валиден имейл адрес.';
  };

  const validatePassword = (v: string) => {
    if (v.length < 8) return 'Паролата трябва да е поне 8 символа.';
    if (!/[A-Z]/.test(v)) return 'Паролата трябва да съдържа поне една главна буква.';
    if (!/[a-z]/.test(v)) return 'Паролата трябва да съдържа поне една малка буква.';
    if (!/[0-9]/.test(v)) return 'Паролата трябва да съдържа поне една цифра.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(v)) return 'Паролата трябва да съдържа поне един специален символ.';
    return '';
  };

  // handlers
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
    if (confirmPassword && value !== confirmPassword) {
      setConfirmPasswordError('Паролите не съвпадат.');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setConfirmPasswordError(value !== password ? 'Паролите не съвпадат.' : '');
  };

  const handleRoleChange = (newRole: 'student' | 'teacher') => {
    setRole(newRole);
    // reset conditional fields
    if (newRole === 'student') {
      setQualifications('');
    } else {
      setGrade('');
    }
  };

  const validateCity = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Моля, изберете град от списъка.';
    if (!isBulgarianCity(trimmed)) return 'Моля, изберете валиден български град от списъка.';
    return '';
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    if (cityError) setCityError(validateCity(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    // Validate
    const emailErr = validateEmail(email);
    const pwErr = validatePassword(password);
    const confirmPwErr = confirmPassword !== password ? 'Паролите не съвпадат.' : '';
    const cityErr = validateCity(city);
    if (emailErr || pwErr || confirmPwErr || cityErr) {
      setEmailError(emailErr);
      setPasswordError(pwErr);
      setConfirmPasswordError(confirmPwErr);
      setCityError(cityErr);
      setLoading(false);
      return;
    }
    if (!firstName.trim()) {
      const msg = 'Моля, въведете име.';
      setFeedback({ type: 'error', message: msg });
      showToast(msg);
      setLoading(false);
      return;
    }
    if (!lastName.trim()) {
      const msg = 'Моля, въведете фамилия.';
      setFeedback({ type: 'error', message: msg });
      showToast(msg);
      setLoading(false);
      return;
    }

    try {
      const additionalData = role === 'student'
        ? {
            role,
            grade,
            city,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`,
          }
        : {
            role,
            city,
            qualifications,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`,
          };

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: additionalData,
          emailRedirectTo: window.location.origin + '/home',
        },
      });

      if (error) {
        console.error('SignUp error:', error);
        let errorMessage = error.message;
        const errorLower = error.message.toLowerCase();
        const errorStatus = (error as any).status;
        const errorCode = (error as any).code;

        // handle existing user
        if (
          errorStatus === 422 ||
          errorCode === 'user_already_registered' ||
          errorCode === 'user_already_exists' ||
          errorLower.includes('user already registered') ||
          errorLower.includes('user already exists')
        ) {
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
            if (!signInError && signInData.user) {
              setFeedback({ type: 'success', message: 'Успешно! Вие сте влезли в акаунта си.' });
              showToast('Успешно! Вие сте влезли в акаунта си.');
              setLoading(false);
              const checkSession = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) navigate('/home');
                else setTimeout(checkSession, 100);
              };
              setTimeout(checkSession, 100);
              return;
            } else if (signInError) {
              errorMessage =
                signInError.message.includes('Invalid login') || signInError.message.includes('password')
                  ? 'Този имейл адрес вече е регистриран, но паролата е неправилна.'
                  : 'Този имейл адрес вече е регистриран.';
            }
          } catch {
            errorMessage = 'Този имейл адрес вече е регистриран.';
          }
        } else if (errorLower.includes('invalid email')) {
          errorMessage = 'Невалиден имейл адрес.';
        } else if (errorLower.includes('password') && (errorLower.includes('weak') || errorLower.includes('short'))) {
          errorMessage = 'Паролата не отговаря на изискванията.';
        } else if (errorLower.includes('rate limit') || errorLower.includes('too many')) {
          errorMessage = 'Твърде много опити. Моля изчакайте.';
        } else {
          errorMessage = error.message || 'Възникна грешка при регистрация.';
        }

        const msg = `Грешка: ${errorMessage}`;
        setFeedback({ type: 'error', message: msg });
        showToast(msg);
      } else {
        // create teacher profile if needed
        if (role === 'teacher') {
          try {
            await new Promise((r) => setTimeout(r, 500));
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
              await supabase.from('teacher_profiles').insert({
                user_id: currentUser.id,
                full_name: `${firstName.trim()} ${lastName.trim()}`,
                subject: qualifications || 'Не е посочен',
                description: 'Учител в системата Матура+.',
                rating: 0,
                city: city || null,
                is_online: false,
                email: email.trim(),
                education: null,
                qualifications: qualifications || null,
                available_schedule: null,
              });
            }
          } catch (err) {
            console.error('Error creating teacher profile:', err);
          }
        }

        setFeedback({ type: 'success', message: 'Успешно! Вие сте регистриран и влезли.' });
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setCityError('');
        setGrade('');
        setCity('');
        setQualifications('');

        const checkSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) window.location.href = '/home';
          else setTimeout(checkSession, 100);
        };
        setTimeout(checkSession, 100);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Нещо се обърка!' });
      showToast('Нещо се обърка!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupView
      firstName={firstName}
      lastName={lastName}
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      role={role}
      grade={grade}
      city={city}
      qualifications={qualifications}
      loading={loading}
      emailError={emailError}
      passwordError={passwordError}
      confirmPasswordError={confirmPasswordError}
      cityError={cityError}
      feedback={feedback}
      onFirstNameChange={setFirstName}
      onLastNameChange={setLastName}
      onEmailChange={handleEmailChange}
      onPasswordChange={handlePasswordChange}
      onConfirmPasswordChange={handleConfirmPasswordChange}
      onShowPasswordToggle={() => setShowPassword((p) => !p)}
      onShowConfirmPasswordToggle={() => setShowConfirmPassword((p) => !p)}
      onRoleChange={handleRoleChange}
      onGradeChange={setGrade}
      onCityChange={handleCityChange}
      onQualificationsChange={setQualifications}
      onSubmit={handleSubmit}
    />
  );
}
