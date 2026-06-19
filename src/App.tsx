import { useState, useEffect } from 'react';
import { StudentUser, AdminUser, FullAssessment, JournalEntry, CriticalIncident, AuditLog, TrustedContact } from './types';
import { detectCrisis } from './utils/analysisEngine';
import { 
  DEFAULT_STUDENTS, MOCK_ASSESSMENTS, 
  DEFAULT_JOURNALS, DEFAULT_CRITICAL_INCIDENTS, DEFAULT_AUDIT_LOGS 
} from './data/mockInitialState';
import { initFirebase, getCollectionDocs, syncCollection, isFirebaseEnabled, onAuthStateChangedListener, signOutFirebase, getStudentProfile, getAdminProfile, saveAssessment, saveJournalEntry, saveCriticalIncident, saveAuditLog } from './lib/firebase';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import LoginScreen from './components/LoginScreen';
import StudentPortal from './components/StudentPortal';
import AdminPortal from './components/AdminPortal';
import EmergencyModal from './components/EmergencyModal';
import { HeartPulse, RefreshCw, Sun, Moon, Sparkles } from 'lucide-react';

type Theme = 'light' | 'dark' | 'calm';

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('mindguard_theme') as Theme) || 'light';
  });

  const [currentUser, setCurrentUser] = useState<StudentUser | AdminUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [firestoreEnabled, setFirestoreEnabled] = useState<boolean>(() => isFirebaseEnabled());

  useEffect(() => {
    if (!isFirebaseEnabled()) {
      setIsAuthLoading(false);
      const saved = localStorage.getItem('mindguard_session');
      if (saved) { try { setCurrentUser(JSON.parse(saved)); } catch { } }
      return;
    }

    const unsubscribe = onAuthStateChangedListener(async (authUser) => {
      if (authUser) {
        try {
          const studentProfile = await getStudentProfile(authUser.uid);
          if (studentProfile) {
            setCurrentUser({ ...studentProfile, id: authUser.uid } as StudentUser);
          } else {
            const adminProfile = await getAdminProfile(authUser.uid);
            if (adminProfile) {
              setCurrentUser({ ...adminProfile, id: authUser.uid } as AdminUser);
            }
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const [allStudents, setAllStudents] = useState<StudentUser[]>(() => {
    const saved = localStorage.getItem('mindguard_students');
    if (saved) { try { return JSON.parse(saved); } catch { return DEFAULT_STUDENTS; } }
    return DEFAULT_STUDENTS;
  });

  const [allAssessments, setAllAssessments] = useState<FullAssessment[]>(() => {
    const saved = localStorage.getItem('mindguard_assessments');
    if (saved) { try { return JSON.parse(saved); } catch { return MOCK_ASSESSMENTS; } }
    return MOCK_ASSESSMENTS;
  });

  const [journals, setJournals] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('mindguard_journals');
    if (saved) { try { return JSON.parse(saved); } catch { return DEFAULT_JOURNALS; } }
    return DEFAULT_JOURNALS;
  });

  const [criticalIncidents, setCriticalIncidents] = useState<CriticalIncident[]>(() => {
    const saved = localStorage.getItem('mindguard_incidents');
    if (saved) { try { return JSON.parse(saved); } catch { return DEFAULT_CRITICAL_INCIDENTS; } }
    return DEFAULT_CRITICAL_INCIDENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('mindguard_audit');
    if (saved) { try { return JSON.parse(saved); } catch { return DEFAULT_AUDIT_LOGS; } }
    return DEFAULT_AUDIT_LOGS;
  });

  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mindguard_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!firestoreEnabled) return;

    const loadFirebaseData = async () => {
      try {
        initFirebase();
        const [students, assessments, journals, incidents, auditLogs] = await Promise.all([
          getCollectionDocs<StudentUser>('students'),
          getCollectionDocs<FullAssessment>('assessments'),
          getCollectionDocs<JournalEntry>('journals'),
          getCollectionDocs<CriticalIncident>('incidents'),
          getCollectionDocs<AuditLog>('auditLogs')
        ]);

        if (students.length) setAllStudents(students);
        if (assessments.length) setAllAssessments(assessments);
        if (journals.length) setJournals(journals);
        if (incidents.length) setCriticalIncidents(incidents);
        if (auditLogs.length) setAuditLogs(auditLogs);
      } catch (error) {
        console.error('Firebase load error:', error);
      }
    };

    loadFirebaseData();
  }, [firestoreEnabled]);

  useEffect(() => { localStorage.setItem('mindguard_students', JSON.stringify(allStudents)); if (firestoreEnabled) syncCollection('students', allStudents); }, [allStudents, firestoreEnabled]);
  useEffect(() => { localStorage.setItem('mindguard_assessments', JSON.stringify(allAssessments)); if (firestoreEnabled) syncCollection('assessments', allAssessments); }, [allAssessments, firestoreEnabled]);
  useEffect(() => { localStorage.setItem('mindguard_journals', JSON.stringify(journals)); if (firestoreEnabled) syncCollection('journals', journals); }, [journals, firestoreEnabled]);
  useEffect(() => { localStorage.setItem('mindguard_incidents', JSON.stringify(criticalIncidents)); if (firestoreEnabled) syncCollection('incidents', criticalIncidents); }, [criticalIncidents, firestoreEnabled]);
  useEffect(() => { localStorage.setItem('mindguard_audit', JSON.stringify(auditLogs)); if (firestoreEnabled) syncCollection('auditLogs', auditLogs); }, [auditLogs, firestoreEnabled]);

  const handleLoginSuccess = (user: StudentUser | AdminUser) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    if (isFirebaseEnabled()) {
      await signOutFirebase();
    }
  };

  const handleRegisterStudent = (newUser: StudentUser) => {
    setAllStudents(prev => [...prev, newUser]);
  };

  const handleAddAssessment = async (as: FullAssessment) => {
    setAllAssessments(prev => [as, ...prev]);

    if (isFirebaseEnabled()) {
      try {
        await saveAssessment(as);
      } catch (error) {
        console.error('Failed to save assessment to Firestore:', error);
      }
    }

    const crisisScan = detectCrisis(as);
    const matchedStudent = allStudents.find(s => s.id === as.studentId);
    const name = matchedStudent ? matchedStudent.profile.fullName : 'Student Name';
    const dept = matchedStudent ? matchedStudent.profile.department : 'Computer Science';
    const yr = matchedStudent ? matchedStudent.profile.year : '1st Year';

    const timestamp = new Date().toISOString();
    const cleanLog: AuditLog = {
      id: `al_${Date.now()}_com`, timestamp,
      eventType: 'ASSESSMENT_COMPLETED', studentId: as.studentId,
      details: `Student ${name} successfully compiled routine wellness check-in.`
    };
    setAuditLogs(prev => [cleanLog, ...prev]);
    
    if (isFirebaseEnabled()) {
      try {
        await saveAuditLog(cleanLog);
      } catch (error) {
        console.error('Failed to save audit log:', error);
      }
    }

    if (crisisScan.detected) {
      const newIncident: CriticalIncident = {
        id: `ci_${Date.now()}`, studentId: as.studentId, studentName: name,
        studentDepartment: dept, studentYear: yr,
        detectedTriggerPhrase: crisisScan.phrase, createdAt: timestamp, resolved: false
      };
      setCriticalIncidents(prev => [newIncident, ...prev]);

      if (isFirebaseEnabled()) {
        try {
          await saveCriticalIncident(newIncident);
        } catch (error) {
          console.error('Failed to save critical incident:', error);
        }
      }

      const newLogs: AuditLog[] = [
        { id: `al_${Date.now()}_phr`, timestamp, eventType: 'CRITICAL_PHRASE_DETECTED', studentId: as.studentId, details: `Triggers Scan: Word query match "${crisisScan.phrase}" detected inside Student ${name}'s assessments comments.` },
        { id: `al_${Date.now()}_con`, timestamp, eventType: 'CONTACTS_NOTIFIED', studentId: as.studentId, details: `Distress alert successfully dispatched to registered trusted persons list of student: ${name}.` },
        { id: `al_${Date.now()}_adm`, timestamp, eventType: 'ADMIN_NOTIFIED', studentId: as.studentId, details: `Urgent wellness officer flag raised for chief administrators dashboard.` },
      ];
      setAuditLogs(prev => [...newLogs, ...prev]);

      if (isFirebaseEnabled()) {
        for (const log of newLogs) {
          try {
            await saveAuditLog(log);
          } catch (error) {
            console.error('Failed to save audit log:', error);
          }
        }
      }

      setIsEmergencyOpen(true);
    }
  };

  const handleAddJournal = async (je: JournalEntry) => {
    setJournals(prev => [je, ...prev]);
    
    if (isFirebaseEnabled()) {
      try {
        await saveJournalEntry(je);
      } catch (error) {
        console.error('Failed to save journal entry:', error);
      }
    }
  };

  const handleEditJournal = async (je: JournalEntry) => {
    setJournals(prev => prev.map(item => item.id === je.id ? je : item));
    
    if (isFirebaseEnabled()) {
      try {
        await saveJournalEntry(je);
      } catch (error) {
        console.error('Failed to update journal entry:', error);
      }
    }
  };

  const handleDeleteJournal = async (id: string) => {
    setJournals(prev => prev.filter(item => item.id !== id));
    
    if (isFirebaseEnabled()) {
      try {
        const docRef = await getDoc(doc(getFirestore(), 'journals', id));
        if (docRef.exists()) {
          await setDoc(docRef.ref, { ...docRef.data(), deleted: true, deletedAt: new Date().toISOString() });
        }
      } catch (error) {
        console.error('Failed to delete journal entry:', error);
      }
    }
  };

  const handleUpdateContacts = async (contacts: TrustedContact[]) => {
    if (!currentUser || currentUser.role !== 'student') return;
    const updatedUser: StudentUser = { ...(currentUser as StudentUser), trustedContacts: contacts };
    setCurrentUser(updatedUser);
    setAllStudents(prev => prev.map(s => s.id === currentUser.id ? updatedUser : s));
    
    if (isFirebaseEnabled()) {
      try {
        const { saveStudentProfile } = await import('./lib/firebase');
        await saveStudentProfile(currentUser.id, updatedUser);
      } catch (error) {
        console.error('Failed to update contacts:', error);
      }
    }
  };

  const handleResolveIncident = async (incId: string, actionText: string) => {
    setCriticalIncidents(prev => prev.map(inc =>
      inc.id === incId ? { ...inc, resolved: true, resolvedAt: new Date().toISOString(), actionTaken: actionText } : inc
    ));
    const matchedInc = criticalIncidents.find(i => i.id === incId);
    const timestamp = new Date().toISOString();
    
    const resolutionLog: AuditLog = {
      id: `al_${Date.now()}_res`, timestamp,
      eventType: 'ASSESSMENT_COMPLETED', studentId: matchedInc ? matchedInc.studentId : 'stud_unknown',
      details: `Resolution Action closed for student ${matchedInc?.studentName || 'Student'}. Action notes: "${actionText}"`
    };
    setAuditLogs(prev => [resolutionLog, ...prev]);

    if (isFirebaseEnabled()) {
      try {
        const incident = matchedInc ? { ...matchedInc, resolved: true, resolvedAt: timestamp, actionTaken: actionText } : null;
        if (incident) {
          await saveCriticalIncident(incident);
        }
        await saveAuditLog(resolutionLog);
      } catch (error) {
        console.error('Failed to resolve incident:', error);
      }
    }
  };

  const handleDeveloperReset = async () => {
    ['mindguard_students','mindguard_assessments','mindguard_journals','mindguard_incidents','mindguard_audit']
      .forEach(k => localStorage.removeItem(k));
    if (isFirebaseEnabled()) {
      await signOutFirebase();
    }
    window.location.reload();
  };

  const studentUser = currentUser?.role === 'student' ? currentUser as StudentUser : null;

  const themeButtons: { key: Theme; icon: React.ReactNode; label: string; active: string; inactive: string }[] = [
    {
      key: 'light',
      icon: <Sun size={12} />,
      label: 'Light',
      active: 'bg-amber-100 text-amber-600 border-amber-200',
      inactive: 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
    },
    {
      key: 'dark',
      icon: <Moon size={12} />,
      label: 'Dark',
      active: 'bg-slate-700 text-slate-100 border-slate-600',
      inactive: 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
    },
    {
      key: 'calm',
      icon: <Sparkles size={12} />,
      label: 'Calm',
      active: 'bg-violet-100 text-violet-600 border-violet-200',
      inactive: 'text-slate-400 hover:text-violet-500 hover:bg-violet-50'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-slate-50 transition-colors duration-300">

      {/* Top utility bar */}
      <div className="bg-white border-b border-slate-200 text-slate-600 text-xs py-2 px-4 shadow-sm z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          
          <div className="flex items-center gap-1.5 shrink-0">
            <HeartPulse className="text-emerald-500 shrink-0" size={14} />
            <span className="font-extrabold text-slate-800">MindGuard Workspace Portal</span>
            <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">• Rule-Based Assessment Analytics</span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">

            {/* Theme Selector */}
            <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
              {themeButtons.map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setTheme(btn.key)}
                  title={`${btn.label} theme`}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all border cursor-pointer select-none ${
                    theme === btn.key ? btn.active : `border-transparent ${btn.inactive}`
                  }`}
                >
                  {btn.icon}
                  <span className="hidden sm:inline">{btn.label}</span>
                </button>
              ))}
            </div>

            {currentUser && (
              <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                Logged in: <span className="text-slate-700 font-bold">
                  {currentUser.role === 'admin' ? 'Admin Officer' : studentUser?.profile.fullName}
                </span>
              </span>
            )}

            <button
              id="dev-hard-reset-btn"
              onClick={handleDeveloperReset}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-bold tracking-wider text-slate-500 transition-all flex items-center gap-1 cursor-pointer select-none border border-slate-200"
              title="Reset Simulated Database back to defaults"
            >
              <RefreshCw size={10} />
              <span>Full DB Seed Reset</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {isAuthLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <HeartPulse className="text-emerald-500 mx-auto mb-4 animate-pulse" size={48} />
              <p className="text-slate-600 font-semibold">Loading authentication...</p>
            </div>
          </div>
        ) : !currentUser ? (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            allStudents={allStudents}
            onRegisterStudent={handleRegisterStudent}
          />
        ) : currentUser.role === 'admin' ? (
          <AdminPortal
            currentAdmin={currentUser as import('./types').AdminUser}
            allStudents={allStudents}
            allAssessments={allAssessments}
            criticalIncidents={criticalIncidents}
            auditLogs={auditLogs}
            onResolveIncident={handleResolveIncident}
            onLogout={handleLogout}
          />
        ) : (
          <StudentPortal
            currentUser={currentUser as StudentUser}
            assessments={allAssessments}
            journals={journals}
            onAddAssessment={handleAddAssessment}
            onAddJournal={handleAddJournal}
            onEditJournal={handleEditJournal}
            onDeleteJournal={handleDeleteJournal}
            onUpdateContacts={handleUpdateContacts}
            onLogout={handleLogout}
            allSystemAssessments={allAssessments}
            onTriggerEmergencySupport={() => setIsEmergencyOpen(true)}
          />
        )}
      </div>

      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        studentName={studentUser?.profile.fullName || 'Student'}
      />

      <footer className="py-3 bg-white text-center text-[10px] text-slate-400 font-semibold select-none border-t border-slate-100 flex items-center justify-center shrink-0 transition-colors duration-300">
        MindGuard Multi-Role Dashboard Screenings Framework &nbsp;•&nbsp; HIPAA-compliant system-wide audit logs
      </footer>
    </div>
  );
}
