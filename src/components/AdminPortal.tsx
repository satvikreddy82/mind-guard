import { useState, useMemo } from 'react';
import { AdminUser, StudentUser, FullAssessment, CriticalIncident, AuditLog } from '../types';
import { calculateScores, classifyRisk, extractRootCauses } from '../utils/analysisEngine';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Building, ShieldAlert, Award, FileSpreadsheet, Users,
  FolderTree, History, LogOut, CheckCircle, Search, HelpCircle, AlertTriangle
} from 'lucide-react';

interface AdminPortalProps {
  currentAdmin: AdminUser;
  allStudents: StudentUser[];
  allAssessments: FullAssessment[];
  criticalIncidents: CriticalIncident[];
  auditLogs: AuditLog[];
  onResolveIncident: (id: string, action: string) => void;
  onLogout: () => void;
}

export default function AdminPortal({ 
  currentAdmin, allStudents, allAssessments, criticalIncidents, 
  auditLogs, onResolveIncident, onLogout 
}: AdminPortalProps) {
  
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'critical' | 'audit'>('overview');
  const [studentSearch, setStudentSearch] = useState('');
  const [resolutionText, setResolutionText] = useState<{ [id: string]: string }>({});

  // Compute live scores for all students based on their latest assessment
  const studentMetrics = useMemo(() => {
    return allStudents.map(student => {
      const studentAsses = allAssessments.filter(a => a.studentId === student.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const latest = studentAsses[0] || null;
      if (!latest) {
        return {
          id: student.id,
          name: student.profile.fullName,
          department: student.profile.department,
          year: student.profile.year,
          riskLevel: 'Healthy' as const,
          stressIndex: 15,
          burnoutRisk: 10,
          anxietyRisk: 5,
          causes: ['No Screenings Logged']
        };
      }

      const scores = calculateScores(latest);
      const textHasCrisis = latest.academic.academicStressDescription.toLowerCase().includes('meaningless') ||
        (latest.exam.description || '').toLowerCase().includes('die') ||
        latest.emotionalState.description.toLowerCase().includes('suicide');
      
      const risk = classifyRisk(scores.finalStressIndex, textHasCrisis);
      const causeResult = extractRootCauses(latest, scores);

      return {
        id: student.id,
        name: student.profile.fullName,
        department: student.profile.department,
        year: student.profile.year,
        riskLevel: risk,
        stressIndex: scores.finalStressIndex,
        burnoutRisk: scores.burnoutRiskScore,
        anxietyRisk: scores.examAnxietyScore,
        causes: causeResult.causes
      };
    });
  }, [allStudents, allAssessments]);

  // Overall Statistics computations
  const totals = useMemo(() => {
    const counts = studentMetrics.length || 1;
    let sumStress = 0;
    let sumBurnout = 0;
    let sumAnxiety = 0;
    let criticalCount = 0;
    let highCount = 0;

    studentMetrics.forEach(m => {
      sumStress += m.stressIndex;
      sumBurnout += m.burnoutRisk;
      sumAnxiety += m.anxietyRisk;
      if (m.riskLevel === 'Critical') criticalCount++;
      if (m.riskLevel === 'High Risk') highCount++;
    });

    return {
      totalCount: allStudents.length,
      avgStress: Math.round(sumStress / counts),
      avgBurnout: Math.round(sumBurnout / counts),
      avgAnxiety: Math.round(sumAnxiety / counts),
      criticalCount,
      highCount
    };
  }, [studentMetrics, allStudents.length]);

  // Department comparative metrics mapping
  const departmentChartData = useMemo(() => {
    const deptMap: { [dept: string]: { sum: number, count: number } } = {};
    studentMetrics.forEach(m => {
      if (!deptMap[m.department]) {
        deptMap[m.department] = { sum: 0, count: 0 };
      }
      deptMap[m.department].sum += m.stressIndex;
      deptMap[m.department].count++;
    });

    return Object.keys(deptMap).map(key => ({
      name: key.length > 15 ? key.substring(0, 15) + '...' : key,
      'Average Stress Index': Math.round(deptMap[key].sum / (deptMap[key].count || 1)),
      'Students Count': deptMap[key].count
    }));
  }, [studentMetrics]);

  // Year comparative metrics mapping
  const yearChartData = useMemo(() => {
    const yearMap: { [year: string]: { sum: number, count: number } } = {};
    studentMetrics.forEach(m => {
      if (!yearMap[m.year]) {
        yearMap[m.year] = { sum: 0, count: 0 };
      }
      yearMap[m.year].sum += m.stressIndex;
      yearMap[m.year].count++;
    });

    return Object.keys(yearMap).map(key => ({
      name: key,
      'Average Stress Index': Math.round(yearMap[key].sum / (yearMap[key].count || 1)),
      'Students Count': yearMap[key].count
    }));
  }, [studentMetrics]);

  const handleResolve = (id: string) => {
    const text = resolutionText[id] || 'Counselling session arranged. Student contacts updated.';
    onResolveIncident(id, text);
  };

  const handleExportInstitutionReport = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Student ID,Department,Year,Stress Index,Burnout Risk,Anxiety Risk,Risk Level,Detected Causes\n";
    studentMetrics.forEach(m => {
      csv += `${m.id},${m.department},${m.year},${m.stressIndex},${m.burnoutRisk},${m.anxietyRisk},${m.riskLevel},${m.causes.join(' | ')}\n`;
    });
    const encoded = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `MindGuard_Institution_Wellness_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#06b6d4', '#2dd4bf', '#a855f7', '#fb7185'];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 transition-colors duration-300">
      
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 text-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm shadow-indigo-100">
              <Building size={18} />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">
                MindGuard
              </span>
              <span className="ml-2.5 px-2.5 py-0.5 text-[9px] font-bold border border-indigo-500/25 text-indigo-600 bg-indigo-50 rounded-full uppercase">
                Officer Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">
              ID: {currentAdmin.institutionId} • {currentAdmin.email}
            </span>
            <button
              id="admin-logout-btn"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="Logout Chief Console"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Admin Tab Drawer Menu */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <nav className="lg:col-span-3 space-y-1">
            <button
              id="admin-tab-btn-overview"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Building size={18} />
              <span>Overview Analytics</span>
            </button>

            <button
              id="admin-tab-btn-departments"
              onClick={() => setActiveTab('departments')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'departments'
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <FolderTree size={18} />
              <span>Department Filters</span>
            </button>

            <button
              id="admin-tab-btn-critical"
              onClick={() => setActiveTab('critical')}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'critical'
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-rose-500 bg-rose-500/5 hover:bg-slate-50 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert size={18} />
                <span>Critical Incidents</span>
              </div>
              {criticalIncidents.filter(ci => !ci.resolved).length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full animate-bounce">
                  {criticalIncidents.filter(ci => !ci.resolved).length}
                </span>
              )}
            </button>

            <button
              id="admin-tab-btn-audit"
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <History size={18} />
              <span>System Audit Trail</span>
            </button>

            {/* Privacy Shield Notice Card */}
            <div className="pt-6 border-t border-slate-200/50 mt-6 shrink-0">
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200/50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#06b6d4]">Privacy Assurance Lock</span>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Admins have full visibility of stress scales, department means, and risk categories to structure early academic relief paths, but cannot view private journal text parameters.
                </p>
              </div>
            </div>
          </nav>

          {/* Subviews Window */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* SUBVIEW 1: High level Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Statistics bento count cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="bg-white/85 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                      <Users size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students Registered</span>
                      <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">{totals.totalCount}</span>
                    </div>
                  </div>

                  <div className="bg-white/85 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Critical Alarms Active</span>
                      <span className="text-2xl font-extrabold text-red-500 mt-0.5 block">{totals.criticalCount}</span>
                    </div>
                  </div>

                  <div className="bg-white/85 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Stress Index</span>
                      <span className="text-2xl font-extrabold text-yellow-500 mt-0.5 block">{totals.avgStress} / 100</span>
                    </div>
                  </div>

                  <div className="bg-white/85 p-5 rounded-2xl border border-slate-200 flex items-center gap-4 text-left">
                    <div className="p-3 bg-teal-500/10 text-teal-500 rounded-xl">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Burnout Risk</span>
                      <span className="text-2xl font-extrabold text-teal-400 mt-0.5 block">{totals.avgBurnout}%</span>
                    </div>
                  </div>

                </div>

                {/* Simulated Alerts Panel (Missed checkins, Rapid stress increases) */}
                <div className="bg-white/85 p-6 rounded-3xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Active Early Warning Triggers</h3>
                      <p className="text-xs text-slate-400">Rule-based triggers indicating students slipping from standard routine.</p>
                    </div>
                    <button
                      id="export-inst-report"
                      onClick={handleExportInstitutionReport}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet size={13} />
                      <span>Export Wellness Report (CSV)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Alarms block 1: Rapid stress increases */}
                    <div className="p-4 rounded-2xl border border-dashed border-[#ef4444]/30 bg-[#ef4444]/5 space-y-3">
                      <div className="flex gap-2 text-rose-500 items-center font-bold text-xs">
                        <ShieldAlert size={14} />
                        <span>RAPID STRESS INCREASE ALERT (&gt;20%)</span>
                      </div>
                      
                      <div className="p-3 bg-white/50 rounded-xl border border-rose-300/10 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold">Johnathan Doe</p>
                          <p className="text-[10px] text-slate-400">Jumped from 52 to 83 Stress Index in 20 days.</p>
                        </div>
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded">Immediate action</span>
                      </div>
                    </div>

                    {/* Alarms block 2: Missed Screenings */}
                    <div className="p-4 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 space-y-3">
                      <div className="flex gap-2 text-amber-500 items-center font-bold text-xs">
                        <AlertTriangle size={14} />
                        <span>MISSED SCHEDULED CHECK-IN ALERTS (&gt;10 days)</span>
                      </div>
                      
                      <div className="p-3 bg-white/50 rounded-xl border border-amber-300/10 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold">Melvin Carter (CS • 4th Year)</p>
                          <p className="text-[10px] text-slate-400">Did not log screening for 12 days since notification.</p>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded">Reminder sent</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* List matrix of students with search */}
                <div className="bg-white/85 p-6 rounded-3xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Institution Profile Matrix</h4>
                      <p className="text-xs text-slate-400">Review stress metrics. Direct descriptive journals remain private.</p>
                    </div>

                    {/* Search bar */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        placeholder="Search student or department..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 text-xs rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="pb-3 text-left">Affiliation Label</th>
                          <th className="pb-3">Department</th>
                          <th className="pb-3">Acad Stress</th>
                          <th className="pb-3">Burnout Scale</th>
                          <th className="pb-3">Risk Level</th>
                          <th className="pb-3 text-right">Stress Index</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 border-slate-200 font-medium">
                        {studentMetrics
                          .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.department.toLowerCase().includes(studentSearch.toLowerCase()))
                          .map(stud => (
                            <tr key={stud.id} className="text-slate-800">
                              <td className="py-3.5">
                                <span className="font-bold">{stud.name}</span>
                                <span className="text-[10px] text-slate-400 font-semibold block">{stud.year}</span>
                              </td>
                              <td className="py-3.5">{stud.department}</td>
                              <td className="py-3.5">{stud.anxietyRisk}/100</td>
                              <td className="py-3.5 text-teal-500 font-bold">{stud.burnoutRisk}%</td>
                              <td className="py-3.5">
                                <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                                  stud.riskLevel === 'Healthy'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : stud.riskLevel === 'Mild Concern'
                                      ? 'bg-blue-500/10 text-blue-500'
                                      : stud.riskLevel === 'Moderate Concern'
                                        ? 'bg-amber-500/10 text-amber-500'
                                        : 'bg-rose-500/10 text-rose-500'
                                }`}>
                                  {stud.riskLevel}
                                </span>
                              </td>
                              <td className="py-3.5 text-right font-bold text-slate-900">
                                {stud.stressIndex} / 100
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* SUBVIEW 2: Department Breakdown analysis */}
            {activeTab === 'departments' && (
              <div className="space-y-6 animate-fade-in animate-slide-up">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Department comparative stress table chart */}
                  <div className="bg-white/85 p-6 rounded-3xl border border-slate-200">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Departmental Stress distribution
                    </span>

                    <div className="h-64 scale-95 origin-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={departmentChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#33415510" vertical={false} />
                          <XAxis dataKey="name" fontSize={10} stroke="#64748b" />
                          <YAxis domain={[0, 100]} fontSize={10} stroke="#64748b" />
                          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#334155' }} />
                          <Bar dataKey="Average Stress Index" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Year comparative stress table chart */}
                  <div className="bg-white/85 p-6 rounded-3xl border border-slate-200">
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Academic Year Strain indices
                    </span>

                    <div className="h-64 scale-95 origin-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={yearChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#33415510" vertical={false} />
                          <XAxis dataKey="name" fontSize={10} stroke="#64748b" />
                          <YAxis domain={[0, 100]} fontSize={10} stroke="#64748b" />
                          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#334155' }} />
                          <Bar dataKey="Average Stress Index" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Detected root causes across campuses */}
                <div className="bg-white/85 p-6 rounded-3xl border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">Aggregated Root Causes Identification</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <p className="text-2xl font-black text-rose-500">67%</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Placement Anxiety</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <p className="text-2xl font-black text-rose-500">45%</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Poor Sleep Hygiene</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <p className="text-2xl font-black text-rose-500">33%</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Fear of Failure</p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <p className="text-2xl font-black text-indigo-500">12%</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Social Isolation</p>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* SUBVIEW 3: Critical Incidents */}
            {activeTab === 'critical' && (
              <div className="space-y-6 animate-fade-in">
                
                <div className="bg-white/85 p-6 rounded-3xl border border-slate-200 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Active Distress Flags Inbox</h3>
                    <p className="text-xs text-slate-400">Trigger phrase detection engines scan and create real-time emergency intervention tickets.</p>
                  </div>

                  {criticalIncidents.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No active distress flags currently requiring attention. Excellent!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {criticalIncidents.map(inc => (
                        <div 
                          key={inc.id} 
                          className={`p-5 rounded-2xl border ${
                            inc.resolved 
                              ? 'bg-slate-100/40 border-slate-200/50' 
                              : 'bg-rose-500/5 border-rose-500/20'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${inc.resolved ? 'bg-slate-400' : 'bg-rose-500 animate-ping'}`} />
                                <h4 className="text-xs font-bold text-slate-900">
                                  {inc.studentName} ({inc.studentDepartment} • {inc.studentYear})
                                </h4>
                              </div>
                              
                              <p className="text-[10px] text-slate-400 block mt-1">
                                Flag logged: {new Date(inc.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              inc.resolved ? 'bg-zinc-200 text-zinc-600' : 'bg-rose-500 text-white'
                            }`}>
                              {inc.resolved ? 'INTERVENTION CLOSED' : 'EMERGENCY ACTIVE'}
                            </span>
                          </div>

                          {/* Audit Phrase section */}
                          <div className="py-2 px-3.5 bg-slate-100 text-[11px] rounded-xl font-mono text-rose-500 border border-slate-200/50 mt-4 leading-relaxed">
                            Detected Distress Indicator Statement: <span className="underline font-bold font-sans">"{inc.detectedTriggerPhrase}"</span>
                          </div>

                          {inc.resolved ? (
                            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10 text-xs text-slate-600 rounded-xl leading-relaxed">
                              <span className="font-bold block text-emerald-500">Action Resolution Log:</span>
                              {inc.actionTaken}
                              <span className="text-[9px] text-slate-400 font-semibold block mt-1">Closed at: {new Date(inc.resolvedAt || '').toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="mt-4 space-y-3">
                              <label className="block text-xs font-bold text-slate-500">Resolve Intervention Log comments</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={resolutionText[inc.id] || ''}
                                  onChange={e => setResolutionText(prev => ({ ...prev, [inc.id]: e.target.value }))}
                                  placeholder="Describe action taken... (e.g. Counsellor made contact, parent notified)"
                                  className="w-full pl-3 pr-4 py-2 bg-slate-100 text-xs border border-slate-200 rounded-xl outline-none"
                                />
                                <button
                                  id={`resolve-incident-${inc.id}`}
                                  onClick={() => handleResolve(inc.id)}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 font-bold text-[11px] text-white rounded-xl transition shrink-0 cursor-pointer"
                                >
                                  Close Case
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* SUBVIEW 4: Audit trail logs */}
            {activeTab === 'audit' && (
              <div className="bg-white/85 p-6 rounded-3xl border border-slate-200 space-y-4 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Institution Audit Matrix</h3>
                  <p className="text-xs text-slate-400 font-semibold">Strict audit logs trace notifications to trusted contacts and critical incidents logs.</p>
                </div>

                <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-2">
                  {auditLogs.map(log => (
                    <div 
                      key={log.id} 
                      className="p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl space-y-1 hover:border-slate-200 transition"
                    >
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          log.eventType === 'CRITICAL_PHRASE_DETECTED'
                            ? 'bg-rose-500 text-white'
                            : log.eventType === 'CONTACTS_NOTIFIED'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-200 text-slate-700'
                        }`}>
                          {log.eventType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        {log.details}
                      </p>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

        </div>
      </main>

    </div>
  );
}
