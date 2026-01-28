import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase-client';


interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
}

const InputField = ({ id, label, type, value, onChange, placeholder, error }: InputFieldProps) => (
  <div className="relative">
    <label htmlFor={id} className="block text-lg font-medium text-gray-700 mb-4">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full pl-14 pr-6 py-4 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white`}
    />
    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
  </div>
);

export default function SignUp() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [grade, setGrade] = useState('');
  const [city, setCity] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? '' : 'Моля, въведете валиден имейл адрес.';
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const emailValidationError = validateEmail(email);
    const passwordValidationError = validatePassword(password);

    if (emailValidationError || passwordValidationError) {
      setEmailError(emailValidationError);
      setPasswordError(passwordValidationError);
      setLoading(false);
      return;
    }

    // validate name fields
    if (!firstName.trim()) {
      setMessage('Моля, въведете име.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!lastName.trim()) {
      setMessage('Моля, въведете фамилия.');
      setMessageType('error');
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
            full_name: `${firstName.trim()} ${lastName.trim()}`
          }
        : { 
            role, 
            city, 
            qualifications, 
            first_name: firstName.trim(), 
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`
          };

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { 
          data: additionalData,
          emailRedirectTo: window.location.origin + '/home'
        },
      });

      if (error) {
        // log error for debugging
        console.error('SignUp error:', error);
        console.error('Error message:', error.message);
        console.error('Error status:', (error as any).status);
        console.error('Error code:', (error as any).code);
        
        let errorMessage = error.message;
        const errorLower = error.message.toLowerCase();
        const errorStatus = (error as any).status;
        const errorCode = (error as any).code;
        
        // check if user_already_exists error  verify if account is usable
        if (
          errorStatus === 422 || 
          errorCode === 'user_already_registered' ||
          errorCode === 'user_already_exists' ||
          (errorLower.includes('user already registered') || errorLower.includes('user already exists'))
        ) {
          // try to check if the user can sign in
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password,
            });
            
            if (!signInError && signInData.user) {
              setMessage('Успешно! Вие сте влезли в акаунта си.');
              setMessageType('success');
              setLoading(false);
              
              const checkSession = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                  navigate('/home');
                } else {
                  setTimeout(checkSession, 100);
                }
              };
              setTimeout(checkSession, 100);
              return;
            } else if (signInError) {
              if (signInError.message.includes('Invalid login') || signInError.message.includes('password')) {
                errorMessage = 'Този имейл адрес вече е регистриран, но паролата е неправилна. Моля опитайте да влезете или използвайте "Забравена парола".';
              } else {
                errorMessage = 'Този имейл адрес вече е регистриран. Моля опитайте да влезете в акаунта си.';
              }
            }
          } catch (checkError) {
            errorMessage = 'Този имейл адрес вече е регистриран. Моля опитайте да влезете в акаунта си или използвайте друг имейл.';
          }
        } else if (errorLower.includes('invalid email') || errorLower.includes('email format')) {
          errorMessage = 'Невалиден имейл адрес. Моля проверете имейла си.';
        } else if (errorLower.includes('password') && (errorLower.includes('weak') || errorLower.includes('short'))) {
          errorMessage = 'Паролата не отговаря на изискванията. Моля проверете изискванията.';
        } else if (errorLower.includes('rate limit') || errorLower.includes('too many')) {
          errorMessage = 'Твърде много опити. Моля изчакайте малко и опитайте отново.';
        } else {
          errorMessage = error.message || 'Възникна грешка при регистрация. Моля опитайте отново.';
        }
        
        setMessage(`Грешка: ${errorMessage}`);
        setMessageType('error');
      } else {

        if (role === 'teacher') {
          try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (currentUser) {
              // create teacher profile entry
              const { error: profileError } = await supabase
                .from('teacher_profiles')
                .insert({
                  user_id: currentUser.id,
                  full_name: `${firstName.trim()} ${lastName.trim()}`,
                  subject: qualifications || 'Не е посочен', // use qualifications as subject for now
                  description: 'Учител в системата Матура+. Моля, попълнете профила си за да се покажете в списъка с учители.',
                  rating: 0,
                  city: city || null,
                  is_online: false,
                  email: email.trim(),
                  education: null,
                  qualifications: qualifications || null,
                  available_schedule: null
                });

              if (profileError) {
                console.error('Error creating teacher profile:', profileError);
              }
            }
          } catch (profileCreationError) {
            console.error('Error creating teacher profile:', profileCreationError);
          }
        }

        setMessage('Успешно! Вие сте регистриран и влезли.');
        setMessageType('success');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setEmailError('');
        setPasswordError('');
        setGrade('');
        setCity('');
        setQualifications('');
        
        // wait for session to be established then redirect
        const checkSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            window.location.href = '/home';
          } else {
            // retry after a short delay
            setTimeout(checkSession, 100);
          }
        };
        setTimeout(checkSession, 100);
      }
    } catch (error) {
      setMessage('Нещо се обърка!');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-rose-50 px-6 py-16">
      <div className="w-full max-w-xl">
        {/* main  */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100/50 overflow-hidden">
          
          {/* header */}
          <div className="pt-16 pb-12 px-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30 mb-8">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Регистрация
            </h1>
            <p className="text-gray-500 text-base">
              Създайте своя нов акаунт
            </p>
          </div>

          {/* divider */}
          <div className="px-10">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
          </div>

          {/* form */}
          <div className="px-10 pt-12 pb-10">
            <form onSubmit={handleSignUp} className="space-y-8">
              
              {/* name fields */}
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  id="firstName"
                  label="Име"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Иван"
                />
                <InputField
                  id="lastName"
                  label="Фамилия"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Иванов"
                />
              </div>

              {/* email field */}
              <InputField
                id="email"
                label="Имейл адрес"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(validateEmail(e.target.value));
                }}
                placeholder="example@email.com"
                error={emailError}
              />

              {/* password field*/}
              <InputField
                id="password"
                label="Парола"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(validatePassword(e.target.value));
                }}
                placeholder="Минимум 8 символа"
                error={passwordError}
              />

              {/*role selection */}
              <div className="relative">
                <label htmlFor="role" className="block text-lg font-medium text-gray-700 mb-4">
                  Роля
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                >
                  <option value="student">Ученик</option>
                  <option value="teacher">Учител</option>
                </select>
              </div>

              {/*fields for students */}
              {role === 'student' && (
                <>
                  <div className="relative">
                    <label htmlFor="grade" className="block text-lg font-medium text-gray-700 mb-4">
                      Клас
                    </label>
                    <select
                      id="grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    >
                      <option value="">Изберете клас</option>
                      <option value="11">11 клас</option>
                      <option value="12">12 клас</option>
                    </select>
                  </div>
                  <InputField
                    id="city"
                    label="Град"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Пример: София"
                  />
                </>
              )}

              {/*fields for teachers */}
              {role === 'teacher' && (
                <>
                  <InputField
                    id="city"
                    label="Град"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Пример: София"
                  />
                  <InputField
                    id="qualifications"
                    label="Квалификации"
                    type="text"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="Пример: Математика, Физика"
                  />
                </>
              )}

              {/* submit button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-4 px-6 bg-gradient-to-r from-rose-600 to-rose-600 hover:from-rose-700 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/25 hover:shadow-xl hover:shadow-rose-600/40 focus:outline-none focus:ring-4 focus:ring-rose-600/30 transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-lg"
                >
                  <span className="flex items-center justify-center">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Регистриране...
                      </>
                    ) : (
                      <>
                        Регистрирай се
                        <svg className="ml-2 -mr-1 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>

            {/* message */}
            {message && (
              <div className="mt-8 animate-fade-in">
                <div 
                  className={`p-5 rounded-xl border-2 ${
                    messageType === 'success' 
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                      : 'bg-red-50/50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      {messageType === 'success' ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* divider*/}
          <div className="px-10">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
          </div>

          {/* footer */}
          <div className="px-10 py-8 text-center">
            <p className="text-sm text-gray-600">
              Вече имате акаунт? {' '}
              <a 
                href="/login" 
                className="font-semibold text-rose-600 hover:text-rose-700 transition-colors duration-200 hover:underline underline-offset-4"
              >
                Влезте тук
              </a>
            </p>
          </div>
        </div>

        {/* terms */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Регистрирайки се, вие приемате нашите{' '}
            <a 
              href="#" 
              className="font-medium text-rose-600 hover:text-rose-700 transition-colors duration-200 hover:underline underline-offset-4"
            >
              Условия за ползване
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}