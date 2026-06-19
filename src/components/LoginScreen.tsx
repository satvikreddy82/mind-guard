import React, { useState, useEffect } from 'react';
import { StudentUser, AdminUser } from '../types';
import { DEFAULT_ADMINS } from '../data/mockInitialState';
import { signInWithFirebaseEmail, createUserWithFirebaseEmail, initFirebase, isFirebaseEnabled, saveStudentProfile, getStudentProfile, getCurrentAuthUser } from '../lib/firebase';
import { ShieldAlert, BookOpen, Key, Mail, User, Building, HeartPulse } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: StudentUser | AdminUser) => void;
  allStudents: StudentUser[];
  onRegisterStudent: (newUser: StudentUser) => void;
}

export default function LoginScreen({ onLoginSuccess, allStudents, onRegisterStudent }: LoginScreenProps) {
  const [activePortal, setActivePortal] = useState<'student' | 'admin'>('student');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);

  // Student Fields
  const [studUsername, setStudUsername] = useState('');
  const [studEmail, setStudEmail] = useState('');
  const [studPassword, setStudPassword] = useState('');
  
  // Register Specific Student Fields
  const [studFullName, setStudFullName] = useState('');
  const [studAge, setStudAge] = useState('20');
  const [studGender, setStudGender] = useState('Male');
  const [studDept, setStudDept] = useState('Computer Science');
  const [studYear, setStudYear] = useState('3rd Year');

  // Admin Fields
  const [adminInstId, setAdminInstId] = useState('MIT-WELL-742');
  const [adminEmail, setAdminEmail] = useState('admin.wellbeing@mit.edu');
  const [adminPassword, setAdminPassword] = useState('');

  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Auto-Login Demo Accounts for easy testing
  const loginDemoStudent = (username: string) => {
    const student = allStudents.find(s => s.username === username);
    if (student) {
      setErrorMsg('');
      setInfoMsg('');
      onLoginSuccess(student);
    }
  };

  const loginDemoAdmin = () => {
    const defaultAdmin = DEFAULT_ADMINS[0];
    if (!defaultAdmin) return;
    setErrorMsg('');
    setInfoMsg('');
    onLoginSuccess(defaultAdmin);
  };

  const isFirebaseReady = isFirebaseEnabled();

  useEffect(() => {
    if (isFirebaseReady) {
      initFirebase();
    }
  }, [isFirebaseReady]);

  const handleStudentAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (isForgotMode) {
      if (!studEmail) {
        setErrorMsg('Please supply your registered email address.');
        return;
      }
      setInfoMsg(`A password recovery ticket has been dispatched to ${studEmail}. Check your inbox with further steps.`);
      setIsForgotMode(false);
      return;
    }

    const normalizedEmail = studEmail.trim().toLowerCase();

    if (isRegisterMode) {
      if (!studUsername || !studEmail || !studPassword || !studFullName) {
        setErrorMsg('Please fill in all mandatory profile registration inputs.');
        return;
      }
      
      const emailExists = allStudents.some(s => s.email.toLowerCase() === normalizedEmail);
      const userExists = allStudents.some(s => s.username.toLowerCase() === studUsername.toLowerCase());
      if (emailExists || userExists) {
        setErrorMsg('An account with this email/username already exists.');
        return;
      }

      let firebaseUid = '';
      if (isFirebaseReady) {
        try {
          const authUser = await createUserWithFirebaseEmail(normalizedEmail, studPassword);
          firebaseUid = authUser.uid;
        } catch (error) {
          setErrorMsg(error instanceof Error ? error.message : 'Unable to register with Firebase at this time.');
          return;
        }
      }

      const newStudent: StudentUser = {
        id: firebaseUid || `stud_${Date.now()}`,
        username: studUsername.trim().toLowerCase(),
        email: normalizedEmail,
        password: studPassword,
        role: 'student',
        profile: {
          fullName: studFullName.trim(),
          age: parseInt(studAge) || 20,
          gender: studGender,
          college: 'School of Engineering & Tech',
          department: studDept,
          year: studYear,
          profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
        },
        trustedContacts: [
          {
            id: `tc_reg_${Date.now()}`,
            type: 'Person',
            name: 'Emergency Contact Person',
            relationship: 'Guardian',
            mobileNumber: '+1 (555) 0122-884'
          }
        ]
      };

      if (isFirebaseReady && firebaseUid) {
        try {
          await saveStudentProfile(firebaseUid, newStudent);
        } catch (error) {
          setErrorMsg('Failed to save profile to Firebase.');
          return;
        }
      }

      onRegisterStudent(newStudent);
      setInfoMsg(`Registration successful! You are now logged in as ${newStudent.profile.fullName}.`);
      onLoginSuccess(newStudent);
    } else {
      if (!studEmail || !studPassword) {
        setErrorMsg('Please specify both registered Email and Password.');
        return;
      }

      let firebaseUid = '';
      if (isFirebaseReady) {
        try {
          const authUser = await signInWithFirebaseEmail(normalizedEmail, studPassword);
          firebaseUid = authUser.uid;
        } catch (error) {
          setErrorMsg(error instanceof Error ? error.message : 'Firebase authentication failed. Please verify your credentials.');
          return;
        }
      }

      let matched = allStudents.find(
        s => s.email.toLowerCase() === normalizedEmail || s.username.toLowerCase() === normalizedEmail
      );

      if (isFirebaseReady && firebaseUid && !matched) {
        try {
          const firestoreProfile = await getStudentProfile(firebaseUid);
          if (firestoreProfile) {
            matched = { ...firestoreProfile, id: firebaseUid } as StudentUser;
          }
        } catch (error) {
          console.error('Failed to fetch profile from Firestore:', error);
        }
      }

      if (!matched) {
        setErrorMsg('No student account matches that email or username.');
        return;
      }

      onLoginSuccess(matched);
    }
  };

  const handleAdminAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!adminEmail || !adminPassword || !adminInstId) {
      setErrorMsg('All Admin authentication fields are strictly mandatory.');
      return;
    }

    if (adminInstId !== 'MIT-WELL-742') {
      setErrorMsg('Invalid Institution Access ID code.');
      return;
    }

    const normalizedEmail = adminEmail.trim().toLowerCase();

    if (isFirebaseReady) {
      try {
        await signInWithFirebaseEmail(normalizedEmail, adminPassword);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : 'Firebase admin authentication failed.');
        return;
      }
    }

    const matchedAdmin = DEFAULT_ADMINS.find(
      admin =>
        admin.email.toLowerCase() === normalizedEmail &&
        admin.institutionId === adminInstId
    );

    if (!matchedAdmin || matchedAdmin.password !== adminPassword) {
      setErrorMsg('Invalid admin email, institution ID, or password.');
      return;
    }

    onLoginSuccess(matchedAdmin);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl shadow-md text-white animate-pulse">
            <HeartPulse size={28} />
          </div>
          <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            MindGuard
          </span>
        </div>
        <h2 className="text-center text-sm font-semibold max-w-xs mx-auto text-slate-500 uppercase tracking-widest leading-6 mb-8">
          Student Mental Wellness & Intervention
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg z-10 animate-fade-in">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-3xl p-6 sm:p-10">
          
          {/* Main User Choice Segments */}
          <div className="flex bg-slate-100/80 p-1 rounded-2xl mb-8 border border-slate-200/20">
            <button
              id="login-role-student"
              onClick={() => {
                setActivePortal('student');
                setErrorMsg('');
                setInfoMsg('');
                setIsRegisterMode(false);
                setIsForgotMode(false);
              }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                activePortal === 'student'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Student Portal
            </button>
            <button
              id="login-role-admin"
              onClick={() => {
                setActivePortal('admin');
                setErrorMsg('');
                setInfoMsg('');
                setIsRegisterMode(false);
                setIsForgotMode(false);
              }}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                activePortal === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Administrator Portal
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex gap-2 items-center">
              <ShieldAlert className="shrink-0" size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
              {infoMsg}
            </div>
          )}

          {activePortal === 'student' ? (
            <form onSubmit={handleStudentAction} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  {isForgotMode ? 'Forgot Password recovery' : isRegisterMode ? 'Create Student Account' : 'Welcome back'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isForgotMode 
                    ? 'Submit your email below to reset credentials' 
                    : isRegisterMode 
                      ? 'Register your profile to complete wellness screenings' 
                      : 'Sign in to monitor wellness indexes, action-plans & logs'}
                </p>
              </div>

              {isRegisterMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-dashed border-slate-200 pb-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 mandatory-field">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        required
                        value={studFullName}
                        onChange={e => setStudFullName(e.target.value)}
                        placeholder="Johnathan Doe"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      value={studAge}
                      onChange={e => setStudAge(e.target.value)}
                      placeholder="21"
                      min="15"
                      max="40"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={studGender}
                      onChange={e => setStudGender(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Department
                    </label>
                    <select
                      value={studDept}
                      onChange={e => setStudDept(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Biotechnology">Biotechnology</option>
                      <option value="Fine Arts">Fine Arts</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Business Administration">Business Administration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Year
                    </label>
                    <select
                      value={studYear}
                      onChange={e => setStudYear(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>
              )}

              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Choose Username *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      value={studUsername}
                      onChange={e => setStudUsername(e.target.value)}
                      placeholder="e.g. john_dev"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    value={studEmail}
                    onChange={e => setStudEmail(e.target.value)}
                    placeholder="john.doe@mit.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {!isForgotMode && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">
                      Password *
                    </label>
                    {!isRegisterMode && (
                      <button
                        id="forgot-password-btn"
                        type="button"
                        onClick={() => {
                          setIsForgotMode(true);
                          setErrorMsg('');
                          setInfoMsg('');
                        }}
                        className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="password"
                      required
                      value={studPassword}
                      onChange={e => setStudPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                id="student-auth-submit"
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 shadow-md transition-all cursor-pointer"
              >
                {isForgotMode ? 'Reset Credentials' : isRegisterMode ? 'Register Account' : 'Authenticate & Enter'}
              </button>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
                {isForgotMode ? (
                  <button
                    id="back-to-login"
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setErrorMsg('');
                    }}
                    className="text-emerald-500 hover:underline"
                  >
                    Back to Connection
                  </button>
                ) : (
                  <>
                    <span>
                      {isRegisterMode ? 'Already registered?' : 'First time running screenings?'}
                    </span>
                    <button
                      id="toggle-register-mode"
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(!isRegisterMode);
                        setErrorMsg('');
                        setInfoMsg('');
                      }}
                      className="text-emerald-500 hover:underline"
                    >
                      {isRegisterMode ? 'Back to sign-in' : 'Register Account'}
                    </button>
                  </>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdminAction} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Institutional Entrance
                </h3>
                <p className="text-xs text-slate-500">
                  Admins manage wellness indicators, emergency flags & department charts.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Institution ID Number
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={adminInstId}
                    onChange={e => setAdminInstId(e.target.value)}
                    placeholder="MIT-WELL-742"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Staff Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin.wellbeing@mit.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Access Keyword / Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                id="admin-auth-submit"
                type="submit"
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:opacity-90 shadow-md transition-all cursor-pointer"
              >
                Authenticate & Enter Mainframe
              </button>
            </form>
          )}

          {/* Rapid Environment Demo Pre-fill helpers */}
          <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
              Developer Quick Demonstration Preloads
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                id="demo-student-john"
                onClick={() => loginDemoStudent('john_dev')}
                className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-rose-200/50 bg-rose-50/30 hover:bg-rose-100/50 rounded-xl transition-all text-xs font-medium text-rose-700 text-left cursor-pointer"
              >
                <BookOpen size={14} className="shrink-0" />
                <div className="truncate">
                  <p className="font-bold">Student (High Risk)</p>
                  <p className="text-[10px] opacity-80">Johnathan Doe • C.S.</p>
                </div>
              </button>

              <button
                id="demo-student-sarah"
                onClick={() => loginDemoStudent('sarah_sky')}
                className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-emerald-200/50 bg-emerald-50/30 hover:bg-emerald-100/50 rounded-xl transition-all text-xs font-medium text-emerald-700 text-left cursor-pointer"
              >
                <BookOpen size={14} className="shrink-0" />
                <div className="truncate">
                  <p className="font-bold">Student (Healthy)</p>
                  <p className="text-[10px] opacity-80">Sarah Smith • Biotech</p>
                </div>
              </button>

              <button
                id="demo-admin-btn"
                col-span-1="true"
                onClick={loginDemoAdmin}
                className="sm:col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-dashed border-slate-300 bg-slate-100/50 hover:bg-slate-100 rounded-xl transition-all text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <Building size={14} className="shrink-0 text-emerald-500" />
                <span>Login as Portal Wellbeing Administrator</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
