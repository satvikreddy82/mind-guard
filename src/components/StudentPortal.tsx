import React, { useState, useMemo } from 'react';
import { StudentUser, FullAssessment, JournalEntry, TrustedContact, AssessmentScores, ActionPlanRecommendation, RiskLevel } from '../types';
import { calculateScores, classifyRisk, extractRootCauses, generateActionPlans } from '../utils/analysisEngine';
import { MOCK_HISTORICAL_DATA } from '../data/mockInitialState';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import { 
  LayoutDashboard, BookHeart, TrendingUp, Users, UserCircle2, 
  Sparkles, Calendar, Plus, Trash2, Search, ArrowRight, HeartPulse,
  LogOut, ShieldCheck, Download, AlertTriangle, ShieldCheck as CheckCircle, HelpCircle
} from 'lucide-react';
import AssessmentForm from './AssessmentForm';

interface StudentPortalProps {
  currentUser: StudentUser;
  assessments: FullAssessment[];
  journals: JournalEntry[];
  onAddAssessment: (as: FullAssessment) => void;
  onAddJournal: (je: JournalEntry) => void;
  onEditJournal: (je: JournalEntry) => void;
  onDeleteJournal: (id: string) => void;
  onUpdateContacts: (contacts: TrustedContact[]) => void;
  onLogout: () => void;
  allSystemAssessments: FullAssessment[]; // to reconstruct local list
  onTriggerEmergencySupport: () => void;
}

export default function StudentPortal({ 
  currentUser, assessments, journals, onAddAssessment, 
  onAddJournal, onEditJournal, onDeleteJournal, onUpdateContacts, onLogout, allSystemAssessments, onTriggerEmergencySupport 
}: StudentPortalProps) {
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assessment' | 'journal' | 'analytics' | 'contacts' | 'profile'>('dashboard');
  const [isAddingAssessment, setIsAddingAssessment] = useState(false);
  
  // Journal states
  const [journalSearch, setJournalSearch] = useState('');
  const [isEditingJournal, setIsEditingJournal] = useState(false);
  const [activeJournalId, setActiveJournalId] = useState<string | null>(null);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState('Stressed');

  // Contact States
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactUsername, setContactUsername] = useState('');
  const [contactId, setContactId] = useState('');
  const [contactType, setContactType] = useState<'Person' | 'PlatformUser'>('Person');

  // Filter student-specific data
  const studentAssessments = useMemo(() => {
    return allSystemAssessments.filter(a => a.studentId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allSystemAssessments, currentUser.id]);

  const studentJournals = useMemo(() => {
    return journals.filter(j => j.studentId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [journals, currentUser.id]);

  const latestAssessment = studentAssessments[0] || null;

  // Compute live scores based on latest completed assessment
  const currentScores: AssessmentScores | null = useMemo(() => {
    if (!latestAssessment) return null;
    return calculateScores(latestAssessment);
  }, [latestAssessment]);

  const rootCauses = useMemo(() => {
    if (!latestAssessment || !currentScores) return [];
    return extractRootCauses(latestAssessment, currentScores).causes;
  }, [latestAssessment, currentScores]);

  const actionPlans = useMemo(() => {
    if (!latestAssessment || !currentScores || rootCauses.length === 0) return [];
    return generateActionPlans(latestAssessment, currentScores, rootCauses);
  }, [latestAssessment, currentScores, rootCauses]);

  const activeRiskLevel: RiskLevel = useMemo(() => {
    if (!currentScores) return 'Healthy';
    // Match any crisis text inside database
    const textHasCrisis = latestAssessment ? (
      latestAssessment.academic.academicStressDescription.toLowerCase().includes('meaningless') ||
      (latestAssessment.exam.description || '').toLowerCase().includes('die') ||
      latestAssessment.emotionalState.description.toLowerCase().includes('suicide')
    ) : false;
    return classifyRisk(currentScores.finalStressIndex, textHasCrisis);
  }, [currentScores, latestAssessment]);

  // Analytics tab 7 / 30 / 90 days selector
  const [analyticsRange, setAnalyticsRange] = useState<'7' | '30' | '90'>('7');

  const trendChartData = useMemo(() => {
    // Generate static historical dates + inject current if completed today
    const baseMockHistory = MOCK_HISTORICAL_DATA[currentUser.id] || MOCK_HISTORICAL_DATA['stud_john'];
    
    if (analyticsRange === '7') {
      return baseMockHistory.slice(-7);
    } else if (analyticsRange === '30') {
      return baseMockHistory;
    } else {
      // simulate 90 days by expanding range
      return [
        { date: 'Month-1', finalStressIndex: 40, burnoutRiskScore: 35, sleepHealthScore: 80, academicStressScore: 45 },
        { date: 'Month-2', finalStressIndex: 55, burnoutRiskScore: 50, sleepHealthScore: 60, academicStressScore: 60 },
        ...baseMockHistory
      ];
    }
  }, [analyticsRange, currentUser.id]);

  // Actions
  const handleAddNewAssessmentComplete = (as: FullAssessment) => {
    onAddAssessment(as);
    setIsAddingAssessment(false);
    setActiveTab('dashboard');
  };

  const handleCreateOrEditJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle || !journalContent) return;

    if (isEditingJournal && activeJournalId) {
      const updatedEntry: JournalEntry = {
        id: activeJournalId,
        studentId: currentUser.id,
        title: journalTitle,
        content: journalContent,
        moodTags: [journalMood],
        createdAt: new Date().toISOString()
      };
      onEditJournal(updatedEntry);
    } else {
      const newEntry: JournalEntry = {
        id: `j_${Date.now()}`,
        studentId: currentUser.id,
        title: journalTitle,
        content: journalContent,
        moodTags: [journalMood],
        createdAt: new Date().toISOString()
      };
      onAddJournal(newEntry);
    }

    // Reset journal form
    setJournalTitle('');
    setJournalContent('');
    setIsEditingJournal(false);
    setActiveJournalId(null);
  };

  const triggerJournalEditInit = (entry: JournalEntry) => {
    setJournalTitle(entry.title);
    setJournalContent(entry.content);
    setJournalMood(entry.moodTags[0] || 'Stressed');
    setIsEditingJournal(true);
    setActiveJournalId(entry.id);
  };

  const handleAddNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    let newContact: TrustedContact;

    if (contactType === 'Person') {
      if (!contactName || !contactRelation || !contactPhone) return;
      newContact = {
        id: `tc_${Date.now()}`,
        type: 'Person',
        name: contactName,
        relationship: contactRelation,
        mobileNumber: contactPhone
      };
    } else {
      if (!contactUsername || !contactId) return;
      newContact = {
        id: `tc_${Date.now()}`,
        type: 'PlatformUser',
        username: contactUsername,
        userId: contactId
      };
    }

    onUpdateContacts([...currentUser.trustedContacts, newContact]);

    // reset fields
    setContactName('');
    setContactRelation('');
    setContactPhone('');
    setContactUsername('');
    setContactId('');
  };

  const deleteContact = (id: string) => {
    const list = currentUser.trustedContacts.filter(c => c.id !== id);
    onUpdateContacts(list);
  };

  // CSV Export helper
  const handleExportCSV = () => {
    if (studentAssessments.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date Completed,Final Stress Index,Academic Stress,Sleep Health,Social Wellbeing,Burnout Risk,Risk Classification\n";
    
    studentAssessments.forEach(as => {
      const score = calculateScores(as);
      const risk = classifyRisk(score.finalStressIndex, false);
      csvContent += `${as.createdAt.substring(0, 10)},${score.finalStressIndex},${score.academicStressScore},${score.sleepHealthScore},${score.socialWellbeingScore},${score.burnoutRiskScore},${risk}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentUser.username}_wellness_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter journals dynamically
  const filteredJournals = studentJournals.filter(j => 
    j.title.toLowerCase().includes(journalSearch.toLowerCase()) || 
    j.content.toLowerCase().includes(journalSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 transition-colors duration-300">
      
      {/* Upper Brand Branding Banner Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm shadow-indigo-100">
              <HeartPulse size={18} />
            </div>
            <span className="text-lg font-bold text-slate-900">
              MindGuard
            </span>
            <span className="px-2 py-0.5 text-[9px] font-bold border border-indigo-500/25 text-indigo-600 bg-indigo-50 rounded-full">
              STUDENT FRAME
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Profile Pill */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 pr-3 rounded-full border border-slate-200/50 text-xs font-semibold">
              <img 
                src={currentUser.profile.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt="Profile"
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="truncate max-w-[125px] text-slate-700">
                {currentUser.profile.fullName}
              </span>
            </div>

            <button
              id="student-logout-btn"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="Log out of application"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Navigation Sidebar Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <nav className="lg:col-span-3 space-y-1">
            <button
              id="tab-btn-dashboard"
              onClick={() => { setActiveTab('dashboard'); setIsAddingAssessment(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer select-none ${
                activeTab === 'dashboard' && !isAddingAssessment
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={18} />
              <span>Wellness Center</span>
            </button>

            <button
              id="tab-btn-assessment"
              onClick={() => { setActiveTab('assessment'); setIsAddingAssessment(true); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer select-none ${
                isAddingAssessment
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <HeartPulse size={18} />
                <span>Screening Engine</span>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
                LIVE
              </span>
            </button>

            <button
              id="tab-btn-journal"
              onClick={() => { setActiveTab('journal'); setIsAddingAssessment(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer select-none ${
                activeTab === 'journal' && !isAddingAssessment
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BookHeart size={18} />
              <span>Private Diaries</span>
            </button>

            <button
              id="tab-btn-analytics"
              onClick={() => { setActiveTab('analytics'); setIsAddingAssessment(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer select-none ${
                activeTab === 'analytics' && !isAddingAssessment
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <TrendingUp size={18} />
              <span>Interactive Trends</span>
            </button>

            <button
              id="tab-btn-contacts"
              onClick={() => { setActiveTab('contacts'); setIsAddingAssessment(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer select-none ${
                activeTab === 'contacts' && !isAddingAssessment
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users size={18} />
              <span>Trusted Contacts</span>
            </button>

            <button
              id="tab-btn-profile"
              onClick={() => { setActiveTab('profile'); setIsAddingAssessment(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer select-none ${
                activeTab === 'profile' && !isAddingAssessment
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <UserCircle2 size={18} />
              <span>Guardian File / Profile</span>
            </button>

            {/* Emergency Hotline Sidebar box */}
            <div className="pt-6 border-t border-slate-200/50 mt-6 shrink-0">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 shadow-sm text-slate-800">
                <div className="flex gap-2 text-orange-600 items-center font-bold text-xs uppercase tracking-wider mb-1">
                  <AlertTriangle size={14} />
                  <span>Emergency Hotline</span>
                </div>
                <p className="text-xs text-orange-800 leading-tight mb-2.5">
                  Feeling overwhelmed? Connect to support immediately.
                </p>
                <button
                  id="direct-emergency-btn"
                  onClick={onTriggerEmergencySupport}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition duration-250 cursor-pointer shadow-sm shadow-orange-200/50"
                >
                  Get Help Now
                </button>
              </div>
            </div>
          </nav>

          {/* Actual Subviews Display Window */}
          <div className="lg:col-span-9 space-y-6">

            {isAddingAssessment ? (
              <AssessmentForm
                studentId={currentUser.id}
                onComplete={handleAddNewAssessmentComplete}
                onCancel={() => setIsAddingAssessment(false)}
              />
            ) : (
              <>
                {/* SUBVIEW 1: Wellness Dashboard */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Welcome Jumbotron Banner */}
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 sm:p-8 rounded-2xl relative overflow-hidden shadow-sm shadow-indigo-100">
                      <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-indigo-700/40 px-3 py-1 rounded-full w-fit">
                            <Sparkles size={12} />
                            <span>System Status Secure</span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
                            Hi, {currentUser.profile.fullName}!
                          </h2>
                          <p className="text-sm text-indigo-100/90 mt-1 max-w-lg leading-relaxed">
                            {latestAssessment 
                              ? `Your latest wellness check-in completed on ${new Date(latestAssessment.createdAt).toLocaleDateString()}. Let's analyze your parameters below.`
                              : "No wellness screening completed yet. Launch your first rule-based baseline check to formulate your custom wellness index!"}
                          </p>
                        </div>

                        {!latestAssessment ? (
                          <button
                            id="dashboard-start-screening"
                            onClick={() => setIsAddingAssessment(true)}
                            className="px-5 py-3 rounded-xl bg-white text-indigo-600 font-bold text-xs hover:bg-indigo-50 hover:scale-105 active:scale-95 transition cursor-pointer animate-pulse"
                          >
                            Launch First Screening
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              id="dashboard-re-screening"
                              onClick={() => setIsAddingAssessment(true)}
                              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition cursor-pointer"
                            >
                              New Screening
                            </button>
                            <button
                              id="export-csv-btn"
                              onClick={handleExportCSV}
                              className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                              title="Export assessments to CSV"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {latestAssessment && currentScores ? (
                      <>
                        {/* Overall Metrics Bento Rows */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          
                          {/* Final Stress Index Indicator */}
                          <div className="md:col-span-2 bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
                            <div>
                              <div className="flex justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  Final Stress Index
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  activeRiskLevel === 'Healthy' 
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : activeRiskLevel === 'Mild Concern'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : activeRiskLevel === 'Moderate Concern'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {activeRiskLevel}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-2 mt-4">
                                <span className="text-5xl font-black text-slate-800 tracking-tight">
                                  {currentScores.finalStressIndex}
                                </span>
                                <span className="text-sm font-semibold text-slate-400">/ 100</span>
                              </div>
                            </div>

                            <div className="mt-6 space-y-2">
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    currentScores.finalStressIndex < 35 
                                      ? 'bg-emerald-500'
                                      : currentScores.finalStressIndex < 55
                                        ? 'bg-blue-400'
                                        : currentScores.finalStressIndex < 72
                                          ? 'bg-amber-400'
                                          : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${currentScores.finalStressIndex}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-slate-400 leading-relaxed block">
                                Generated systematically via non-AI weighting algorithms.
                              </span>
                            </div>
                          </div>

                          {/* Burnout risk gauge */}
                          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                                Burnout Pressure
                              </span>
                              <div className="flex items-baseline gap-1 mt-4">
                                <span className="text-4xl font-extrabold text-slate-800 tracking-tight">
                                  {currentScores.burnoutRiskScore}%
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                                {currentScores.burnoutRiskScore > 70 
                                  ? 'Exacting high fatigue. Needs systematic workload pruning immediately.'
                                  : 'Within manageable physiological recovery limits.'}
                              </p>
                            </div>

                            <div className="mt-4">
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-teal-500 rounded-full"
                                  style={{ width: `${currentScores.burnoutRiskScore}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Sleep efficiency block */}
                          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                                sleep health score
                              </span>
                              <div className="flex items-baseline gap-1 mt-4">
                                <span className="text-4xl font-extrabold text-slate-800 tracking-tight text-indigo-500">
                                  {currentScores.sleepHealthScore}%
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                                {currentScores.sleepHealthScore < 50 
                                  ? 'Disrupted circadian rhythm. Electronic device emission curfew recommended.'
                                  : 'Sound sleep hygiene pattern detected.'}
                              </p>
                            </div>

                            <div className="mt-4">
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${currentScores.sleepHealthScore}%` }}
                                />
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Bento Row 2: Graph analysis or Root Causes */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* Left: Identified Root Causes */}
                          <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-sm">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                              Detected Root wellness Concerns
                            </span>

                            <div className="space-y-3">
                              {rootCauses.length === 0 ? (
                                <p className="text-xs text-slate-400">No active root cause red flags detected.</p>
                              ) : (
                                rootCauses.map(cause => (
                                  <div 
                                    key={cause} 
                                    className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-center justify-between text-xs font-semibold"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 select-none" />
                                      <span className="text-slate-800">{cause}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-rose-500 uppercase">Active Concern</span>
                                  </div>
                                ))
                              )}
                            </div>

                            <p className="text-[10px] text-slate-400 mt-6 leading-relaxed">
                              * MindGuard respects your privacy. Root concerns and general risk level metrics are readable by administrators to enable protective institution monitoring, but your descriptive text notes or private journals remain 100% hidden.
                            </p>
                          </div>

                          {/* Right: Scores breakdown barchart */}
                          <div className="lg:col-span-7 bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-sm">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                              Parameter Breakdown Chart
                            </span>
                            
                            <div className="h-64 scale-95 origin-center">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={[
                                    { name: 'Acad', Value: currentScores.academicStressScore, fill: '#34d399' },
                                    { name: 'Exam', Value: currentScores.examAnxietyScore, fill: '#2dd4bf' },
                                    { name: 'Sleep', Value: 100 - currentScores.sleepHealthScore, fill: '#6366f1' },
                                    { name: 'Phys', Value: 100 - currentScores.physicalWellnessScore, fill: '#f43f5e' },
                                    { name: 'Social', Value: 100 - currentScores.socialWellbeingScore, fill: '#ec4899' },
                                    { name: 'Addict', Value: currentScores.addictionRiskScore, fill: '#f59e0b' },
                                    { name: 'Emo', Value: currentScores.emotionalDistressScore, fill: '#06b6d4' }
                                  ]}
                                  margin={{ left: -25, right: 0 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415515" />
                                  <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                                  <YAxis domain={[0, 100]} fontSize={11} stroke="#64748b" />
                                  <Tooltip 
                                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                                    formatter={(value: any) => [`${value}/100`, 'Strain Factor']}
                                  />
                                  <Bar dataKey="Value" radius={[6, 6, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                        </div>

                        {/* Interactive Personal Action Plan recommendations list */}
                        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="text-emerald-500" />
                            <span>Actionable early-intervention wellness recommendation engine</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Specific protocols synthesized systematically based on your exact checklist answers.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            {actionPlans.map((plan, idx) => (
                              <div 
                                key={idx}
                                className="bg-slate-50/50 border border-slate-200/50 p-5 rounded-2xl space-y-4"
                              >
                                <div>
                                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                    Target Area
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900 mt-1">{plan.problem}</h4>
                                  <p className="text-[11px] text-slate-400 italic mt-1">{plan.detectedBecause}</p>
                                </div>

                                <div className="space-y-2.5">
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase text-rose-500">Immediate Actions</span>
                                    <ul className="list-disc pl-4 text-xs mt-1 space-y-1">
                                      {plan.immediateActions.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                  </div>

                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase text-amber-500">This Week's Plan</span>
                                    <ul className="list-disc pl-4 text-xs mt-1 space-y-1">
                                      {plan.thisWeekPlan.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                  </div>

                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase text-teal-400">Long-term Strategy</span>
                                    <ul className="list-disc pl-4 text-xs mt-1 space-y-1">
                                      {plan.longTermImprovement.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-12 rounded-3xl text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <HelpCircle className="text-slate-400" size={24} />
                        </div>
                        <h4 className="text-base font-bold text-slate-800">Run your first early screening</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          Take a quick 5-minute survey to populate wellness trends, stress diagnostics, and receive protective personalized action-plans of physical activities or sleep routines.
                        </p>
                        <button
                          id="no-assessment-screen-btn"
                          onClick={() => setIsAddingAssessment(true)}
                          className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow transition cursor-pointer"
                        >
                          Begin screening survey now
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {/* SUBVIEW 2: Private Diaries (Journals) */}
                {activeTab === 'journal' && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Header bar information about extreme confidential security */}
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 flex gap-2 items-center">
                      <ShieldCheck size={18} className="shrink-0" />
                      <div>
                        <span className="font-bold">Privacy Matrix Lock Active:</span> Private diaries are kept strictly separated. Campus wellbeing administrators cannot read any journal entries or custom text commentaries under any conditions.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      
                      {/* Left Side: Create / Edit Diary form */}
                      <form onSubmit={handleCreateOrEditJournal} className="md:col-span-5 bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-900">
                          {isEditingJournal ? 'Refine Active Entry' : 'Log New Private Journal'}
                        </h3>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={journalTitle}
                            onChange={e => setJournalTitle(e.target.value)}
                            placeholder="e.g. Lab stress analysis notes"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            Mood Tag Descriptor
                          </label>
                          <select
                            value={journalMood}
                            onChange={e => setJournalMood(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-indigo-500"
                          >
                            <option value="Happy">Happy - Flow state</option>
                            <option value="Calm">Calm - Anchored and quiet</option>
                            <option value="Tired">Tired - Travel exhaustion</option>
                            <option value="Stressed">Stressed - Backed up with assignments</option>
                            <option value="Anxious">Anxious - Future placements lag</option>
                            <option value="Sad">Sad - Missing family support</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            Private Content Diary *
                          </label>
                          <textarea
                            rows={5}
                            required
                            value={journalContent}
                            onChange={e => setJournalContent(e.target.value)}
                            placeholder="Pen down your honest unfiltered thoughts here..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            id="journal-save-btn"
                            type="submit"
                            className="flex-1 py-2.5 text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                          >
                            {isEditingJournal ? 'Apply Changes' : 'Save Secure Entry'}
                          </button>
                          {isEditingJournal && (
                            <button
                              id="journal-cancel-edit-btn"
                              type="button"
                              onClick={() => {
                                setIsEditingJournal(false);
                                setJournalTitle('');
                                setJournalContent('');
                              }}
                              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Right Side: History entries logs block */}
                      <div className="md:col-span-7 bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            Historic Logs ({filteredJournals.length})
                          </h3>

                          {/* Search bar */}
                          <div className="relative w-full sm:w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input
                              type="text"
                              value={journalSearch}
                              onChange={e => setJournalSearch(e.target.value)}
                              placeholder="Search diaries..."
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 text-xs rounded-xl border-none outline-none"
                            />
                          </div>
                        </div>

                        {filteredJournals.length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-xs">
                            No diary logs found matching search or filters.
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
                            {filteredJournals.map(entry => (
                              <div 
                                key={entry.id} 
                                className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl relative space-y-2 hover:border-slate-300 transition"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-950">{entry.title}</h4>
                                    <span className="text-[9px] text-slate-400 font-semibold block">
                                      {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-slate-200 text-slate-600">
                                      {entry.moodTags[0]}
                                    </span>
                                    <button
                                      id={`edit-journal-btn-${entry.id}`}
                                      onClick={() => triggerJournalEditInit(entry)}
                                      className="p-1 px-2 border border-slate-200 text-[10px] font-semibold text-emerald-500 rounded-md hover:bg-white transition"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      id={`del-journal-btn-${entry.id}`}
                                      onClick={() => onDeleteJournal(entry.id)}
                                      className="p-1 text-slate-400 hover:text-rose-500 transition"
                                      title="Delete journal"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                  {entry.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Calendar View representation for student */}
                        <div className="border-t border-dashed border-slate-200 pt-4 mt-4">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Check-in Calendar Grid (Heatmap simulation)
                          </span>
                          <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-slate-400 font-semibold">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <span key={i}>{day}</span>)}
                            {Array.from({ length: 28 }).map((_, i) => {
                              // randomly highlight days with entries
                              const active = i === 27 || i === 26 || i === 24 || i === 15;
                              return (
                                <span 
                                  key={i} 
                                  className={`aspect-square w-full rounded-md flex items-center justify-center font-bold ${
                                    active 
                                      ? 'bg-emerald-500 text-white shadow-sm' 
                                      : 'bg-slate-100'
                                  }`}
                                >
                                  {i + 1}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                )}

                {/* SUBVIEW 3: Analytics Trend panel */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6 animate-fade-in">
                    
                    <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-sm">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Trend Chronology View</h3>
                        <p className="text-xs text-slate-400">Track final stress indicators and physical recovery over time periods.</p>
                      </div>

                      <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/20 text-xs">
                        {(['7', '30', '90'] as const).map(range => (
                          <button
                            id={`analytics-range-${range}`}
                            key={range}
                            onClick={() => setAnalyticsRange(range)}
                            className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                              analyticsRange === range 
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {range === '7' ? '7 Days' : range === '30' ? '30 Days' : '90 Days'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chart cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Stress Index Line Chart */}
                      <div className="bg-white/80 border border-slate-200 p-6 rounded-3xl shadow-sm">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                          Final Stress Index Trend
                        </span>
                        
                        <div className="h-64 scale-95 origin-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendChartData}>
                              <defs>
                                <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415510" />
                              <XAxis dataKey="date" fontSize={11} stroke="#64748b" />
                              <YAxis domain={[0, 100]} fontSize={11} stroke="#64748b" />
                              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#334155' }} />
                              <Area type="monotone" dataKey="finalStressIndex" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStress)" name="Stress Index" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Burnout vs Sleep Index multi lines chart */}
                      <div className="bg-white/80 border border-slate-200 p-6 rounded-3xl shadow-sm">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                          Burnout vs Sleep Health Index
                        </span>
                        
                        <div className="h-64 scale-95 origin-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendChartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415510" />
                              <XAxis dataKey="date" fontSize={11} stroke="#64748b" />
                              <YAxis domain={[0, 100]} fontSize={11} stroke="#64748b" />
                              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#334155' }} />
                              <Legend wrapperStyle={{ fontSize: '11px' }} />
                              <Line type="monotone" dataKey="burnoutRiskScore" stroke="#eab308" strokeWidth={2} name="Burnout Risk" />
                              <Line type="monotone" dataKey="sleepHealthScore" stroke="#6366f1" strokeWidth={2} name="Sleep Score" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                    </div>

                    {/* Historic Assessments Table logs */}
                    <div className="bg-white/80 border border-slate-200 p-6 rounded-3xl shadow-sm">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Assessment History Log
                      </span>

                      {studentAssessments.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">No assessments completed yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                <th className="pb-3 text-left">Date</th>
                                <th className="pb-3">Academic Score</th>
                                <th className="pb-3">Sleep Quality</th>
                                <th className="pb-3">Primary Stressor</th>
                                <th className="pb-3">Burnout Risk</th>
                                <th className="pb-3 text-right">Stress Index</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {studentAssessments.map(as => {
                                const scoreObj = calculateScores(as);
                                return (
                                  <tr key={as.id} className="text-slate-700">
                                    <td className="py-3.5">{new Date(as.createdAt).toLocaleDateString()}</td>
                                    <td className="py-3.5">{scoreObj.academicStressScore}/100</td>
                                    <td className="py-3.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                        as.sleep.sleepQuality === 'Excellent' || as.sleep.sleepQuality === 'Good'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-rose-100 text-rose-700'
                                      }`}>
                                        {as.sleep.sleepQuality}
                                      </span>
                                    </td>
                                    <td className="py-3.5 font-bold">{as.primaryStress.source}</td>
                                    <td className="py-3.5 text-amber-500">{scoreObj.burnoutRiskScore}%</td>
                                    <td className="py-3.5 text-right font-black text-slate-900">{scoreObj.finalStressIndex}/100</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* SUBVIEW 4: Trusted Contacts settings */}
                {activeTab === 'contacts' && (
                  <div className="space-y-6 animate-fade-in animate-slide-up">
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      
                      {/* Left Side: Create Contact Form */}
                      <form onSubmit={handleAddNewContact} className="md:col-span-5 bg-white/80 border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-900">
                          Enlist Trusted Contact
                        </h3>
                        <p className="text-xs text-slate-400">
                          These contacts are automatically alerted in severe crisis triggers or missed check-ins.
                        </p>

                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button
                            id="contact-type-btn-person"
                            type="button"
                            onClick={() => setContactType('Person')}
                            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition ${
                              contactType === 'Person'
                                ? 'bg-white text-slate-950 shadow-xs'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Trusted Person
                          </button>
                          <button
                            id="contact-type-btn-platform"
                            type="button"
                            onClick={() => setContactType('PlatformUser')}
                            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition ${
                              contactType === 'PlatformUser'
                                ? 'bg-white text-slate-950 shadow-xs'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            Platform Student/Mentor
                          </button>
                        </div>

                        {contactType === 'Person' ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                              <input
                                type="text"
                                required
                                value={contactName}
                                onChange={e => setContactName(e.target.value)}
                                placeholder="Martha Doe"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Relationship</label>
                              <input
                                type="text"
                                required
                                value={contactRelation}
                                onChange={e => setContactRelation(e.target.value)}
                                placeholder="e.g. Mother, Uncle, Friend"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Number</label>
                              <input
                                type="tel"
                                required
                                value={contactPhone}
                                onChange={e => setContactPhone(e.target.value)}
                                placeholder="+1 (555) 0122-384"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Username</label>
                              <input
                                type="text"
                                required
                                value={contactUsername}
                                onChange={e => setContactUsername(e.target.value)}
                                placeholder="e.g. prof_jackson"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">User ID</label>
                              <input
                                type="text"
                                required
                                value={contactId}
                                onChange={e => setContactId(e.target.value)}
                                placeholder="e.g. admin_1"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        )}

                        <button
                          id="contact-save-btn"
                          type="submit"
                          className="w-full py-2.5 text-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          Enlist Trusted Link
                        </button>
                      </form>

                      {/* Right Side: Listed Contacts Grid */}
                      <div className="md:col-span-7 bg-white/80 border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-900">Active Trusted Circles</h3>
                        
                        {currentUser.trustedContacts.length === 0 ? (
                          <p className="text-xs text-slate-400 py-6 text-center">No trusted contacts configured. Minimum 1 highly recommended.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {currentUser.trustedContacts.map(con => (
                              <div key={con.id} className="p-4 bg-slate-100/50 border border-slate-200/50 rounded-2xl relative space-y-1.5 hover:border-slate-300 transition">
                                <button
                                  id={`delete-contact-btn-${con.id}`}
                                  onClick={() => deleteContact(con.id)}
                                  className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                                  title="Remove contact"
                                >
                                  <Trash2 size={13} />
                                </button>

                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                                  con.type==='Person'? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                  {con.type === 'Person' ? 'Trusted Person' : 'Platform Node'}
                                </span>

                                {con.type === 'Person' ? (
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900">{con.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-semibold">{con.relationship} • {con.mobileNumber}</p>
                                  </div>
                                ) : (
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900">@{con.username}</h4>
                                    <p className="text-[10px] text-slate-400 font-semibold">User Node ID: {con.userId}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                )}

                {/* SUBVIEW 5: Profile view mapping */}
                {activeTab === 'profile' && (
                  <div className="bg-white/80 border border-slate-200 p-6 sm:p-10 rounded-3xl shadow-sm space-y-8 animate-fade-in">
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                      <img 
                        src={currentUser.profile.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                        alt="Avatar bigger"
                        className="w-24 h-24 rounded-3xl object-cover shadow-md shrink-0 border-2 border-emerald-500/20"
                      />

                      <div className="text-center sm:text-left space-y-1">
                        <h3 className="text-2xl font-black text-slate-900">{currentUser.profile.fullName}</h3>
                        <p className="text-xs text-slate-400 font-semibold">{currentUser.profile.year} student • {currentUser.profile.department}</p>
                        <span className="inline-block px-3 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">
                          Account UUID: {currentUser.id}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-200/40">
                        <span className="text-[10px] uppercase font-bold text-slate-400">College Affiliate</span>
                        <p className="text-xs font-bold text-slate-800">{currentUser.profile.college || 'School of Engineering'}</p>
                      </div>

                      <div className="space-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-200/40">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Contact Address</span>
                        <p className="text-xs font-bold text-slate-800">{currentUser.email}</p>
                      </div>

                      <div className="space-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-200/40">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Affiliation Year</span>
                        <p className="text-xs font-bold text-slate-800">{currentUser.profile.year || '3rd Year'}</p>
                      </div>

                      <div className="space-y-1 bg-slate-50/50 p-4 rounded-xl border border-slate-200/40">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Demographics info</span>
                        <p className="text-xs font-bold text-slate-800">{currentUser.profile.gender} • {currentUser.profile.age} Years of Age</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 text-xs leading-relaxed text-slate-500 col-span-2">
                      <span className="font-bold text-slate-700 block mb-1">Standard Policy & Disclaimers:</span>
                      MindGuard compiles screenings systematically using custom weighted mathematical formulas to highlight potential strains. This tool does not provide medical advice or substitute professional therapeutic care. In event of emergency, please access direct local counseling assets immediately.
                    </div>

                  </div>
                )}

              </>
            )}

          </div>

        </div>
      </main>

    </div>
  );
}
