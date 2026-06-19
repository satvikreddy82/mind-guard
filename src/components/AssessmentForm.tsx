import { useState, useEffect } from 'react';
import { FullAssessment, AcademicAssessment, ExamAssessment, SleepAssessment, PhysicalHealth, SocialWellbeing, AddictionAssessment, FailureAssessment, PrimaryStressAssessment, EmotionalStateAssessment } from '../types';
import { BookOpen, Calendar, HelpCircle, Activity, Heart, Shuffle, ShieldAlert, CheckCircle, ChevronLeft, ChevronRight, Sliders, ArrowRight } from 'lucide-react';

interface AssessmentFormProps {
  studentId: string;
  onComplete: (assessment: FullAssessment) => void;
  onCancel: () => void;
}

const DEFAULT_ACADEMIC: AcademicAssessment = {
  collegeStartTime: '09:00',
  collegeEndTime: '16:30',
  travelTime: 1,
  selfStudyHours: 2,
  attendancePressure: false,
  assignmentPressure: false,
  placementAnxiety: false,
  academicStressRating: 5,
  academicStressDescription: ''
};

const DEFAULT_EXAM: ExamAssessment = {
  hasExamsNearby: false,
  daysRemaining: 15,
  examStressRating: 5,
  reason: 'Too Much Syllabus',
  description: ''
};

const DEFAULT_SLEEP: SleepAssessment = {
  hoursSlept: 7,
  sleepQuality: 'Average',
  gettingProperSleep: true,
  reasonsForPoorSleep: []
};

const DEFAULT_PHYSICAL: PhysicalHealth = {
  exerciseDuration: 20,
  exerciseType: '',
  symptoms: []
};

const DEFAULT_SOCIAL: SocialWellbeing = {
  feelingLonely: false,
  lonelyReason: 'Hostel Life',
  familySupportRating: 8,
  friendSupportRating: 8
};

const DEFAULT_ADDICTION: AddictionAssessment = {
  type: 'None',
  hoursPerDay: 0
};

const DEFAULT_FAILURE: FailureAssessment = {
  hasMajorFailureBefore: false,
  failureType: 'Academic',
  howOftenThinkAboutIt: 'Never'
};

const DEFAULT_PRIMARY_STRESS: PrimaryStressAssessment = {
  source: 'Exams',
  subOption: 'Fear of failing a critical subject'
};

const DEFAULT_EMOTIONAL: EmotionalStateAssessment = {
  moods: ['Calm'],
  description: ''
};

export default function AssessmentForm({ studentId, onComplete, onCancel }: AssessmentFormProps) {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 9;

  // State sections
  const [academic, setAcademic] = useState<AcademicAssessment>({ ...DEFAULT_ACADEMIC });
  const [exam, setExam] = useState<ExamAssessment>({ ...DEFAULT_EXAM });
  const [sleep, setSleep] = useState<SleepAssessment>({ ...DEFAULT_SLEEP });
  const [physical, setPhysical] = useState<PhysicalHealth>({ ...DEFAULT_PHYSICAL });
  const [social, setSocial] = useState<SocialWellbeing>({ ...DEFAULT_SOCIAL });
  const [addiction, setAddiction] = useState<AddictionAssessment>({ ...DEFAULT_ADDICTION });
  const [failure, setFailure] = useState<FailureAssessment>({ ...DEFAULT_FAILURE });
  const [primaryStress, setPrimaryStress] = useState<PrimaryStressAssessment>({ ...DEFAULT_PRIMARY_STRESS });
  const [emotionalState, setEmotionalState] = useState<EmotionalStateAssessment>({ ...DEFAULT_EMOTIONAL });

  // Dynamic Sub-options builder for stress sources
  const [availableSubOptions, setAvailableSubOptions] = useState<string[]>([]);

  useEffect(() => {
    // Generate helpful suboptions based on source
    const subOptionsMap: { [key: string]: string[] } = {
      Exams: [
        'Fear of failing a critical subject',
        'Inability to cover massive syllabus',
        'Cramming last-minute with too much tension',
        'Fear of missing minimal cutoff eligibility benchmarks'
      ],
      Assignments: [
        'Overlapping deadlines in multiple engineering labs',
        'Complex coding tasks taking all night',
        'Difficult group assignments with uncooperative peers',
        'Inability to grasp highly abstract homework concepts'
      ],
      Placements: [
        'Inability to solve competitive coding rounds under timed pressure',
        'Fear of failing group discussions in front of peers',
        'Extreme comparison with friends getting pre-placement offers',
        'Lack of technical mock interview practice'
      ],
      Family: [
        'Massive academic grade expectations from parents',
        'Frequent disharmony or arguments inside domestic quarters',
        'Direct pressure to maintain a highly-funded family lineage',
        'Lack of emotional guidance in domestic circles'
      ],
      Friends: [
        'Difficulty adjusting to new high-performing college peer groups',
        'Feeling ostracized or left out of critical social group plans',
        'Incessant comparative talk regarding high salaries and milestones',
        'Mild friction or toxic comments from long-time friends'
      ],
      Relationship: [
        'Recent emotional separation or break-up cycles',
        'Unresolved conflicts and arguments taking academic focus away',
        'Inability to find reliable connections in hostel life',
        'Long distance relationship trust challenges'
      ],
      'Financial Problems': [
        'Worrying about massive student education loans',
        'Immediate inability to pay monthly hostel board/dinings',
        'Lack of general pocket allowance for minimal recreational needs',
        'Anxiety over high tuition structures'
      ],
      Health: [
        'Frequent migraine headaches of physical origins',
        'General body fat or self-image body-esteem doubts',
        'Exhaustion from travel delays and stomach upsets',
        'Underlying chronic disease monitoring burden'
      ],
      'Self Confidence': [
        'Severe imposter syndrome in coding assignments',
        'Anxious speaking out or giving seminar questions',
        'Comparing self to outstanding classmates portfolio',
        'Feeling unfit for elite leadership options'
      ],
      Loneliness: [
        'Struggling with hostel transition blues',
        'Spending off-study nights entirely alone inside dorm boundaries',
        'Feeling nobody shares common deep personal concerns',
        'Social networking isolation blocks'
      ],
      Other: [
        'Unspecified minor daily routine friction',
        'General season or climate change low productivity periods',
        'Uncontrolled sleep lag cycles'
      ]
    };
    const opts = subOptionsMap[primaryStress.source] || ['Other miscellaneous stressors'];
    setAvailableSubOptions(opts);
    
    // Auto sync suboption if it is not in the list
    if (!opts.includes(primaryStress.subOption)) {
      setPrimaryStress(prev => ({ ...prev, subOption: opts[0] }));
    }
  }, [primaryStress.source]);

  // Handle sleeps checkboxes
  const handleSleepReasonToggle = (reason: any) => {
    setSleep(prev => {
      const active = prev.reasonsForPoorSleep.includes(reason);
      const list = active 
        ? prev.reasonsForPoorSleep.filter(r => r !== reason)
        : [...prev.reasonsForPoorSleep, reason];
      return { ...prev, reasonsForPoorSleep: list };
    });
  };

  // Handle symptoms checkboxes
  const handleSymptomToggle = (symptom: any) => {
    setPhysical(prev => {
      const active = prev.symptoms.includes(symptom);
      const list = active 
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom];
      return { ...prev, symptoms: list };
    });
  };

  // Handle moods checkboxes
  const handleMoodToggle = (mood: any) => {
    setEmotionalState(prev => {
      const active = prev.moods.includes(mood);
      const list = active 
        ? prev.moods.filter(m => m !== mood)
        : [...prev.moods, mood];
      return { ...prev, moods: list.length === 0 ? ['Tired'] : list };
    });
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    const finalAssessment: FullAssessment = {
      id: `as_${Date.now()}`,
      studentId,
      createdAt: new Date().toISOString(),
      academic,
      exam,
      sleep,
      physical,
      social,
      addiction,
      failure,
      primaryStress,
      emotionalState
    };
    onComplete(finalAssessment);
  };

  // Header helpers
  const getStepHeader = () => {
    switch (step) {
      case 1: return { title: 'Academic Routine', icon: <BookOpen className="text-indigo-600" size={20} />, text: 'Log your college routine details to calculate workload stresses.' };
      case 2: return { title: 'Exam Assessments', icon: <Calendar className="text-indigo-500" size={20} />, text: 'Map upcoming exams, grades tension, and preparation indicators.' };
      case 3: return { title: 'Sleep Mapping', icon: <Sliders className="text-indigo-500" size={20} />, text: 'Optimize sleep tracking to verify circadian or mental overthinking cycles.' };
      case 4: return { title: 'Physical Vitality', icon: <Activity className="text-rose-500" size={20} />, text: 'Analyze exercise habits alongside psychosomatic physical symptoms.' };
      case 5: return { title: 'Social Integration', icon: <Heart className="text-pink-500" size={20} />, text: 'Examine hostel loneliness triggers and support systems satisfaction.' };
      case 6: return { title: 'Habituations & Addictions', icon: <Shuffle className="text-amber-500" size={20} />, text: 'Verify time expended on social scrollings, gaming, or drinking.' };
      case 7: return { title: 'Reflecting Past Failures', icon: <ShieldAlert className="text-purple-500" size={20} />, text: 'Trace lingering thoughts around relationships or placement disappointments.' };
      case 8: return { title: 'Primary Stress Engine', icon: <HelpCircle className="text-blue-500" size={20} />, text: 'Identify your single most stressful driver and configure sub-options.' };
      case 9: return { title: 'Emotional Atmosphere & Comments', icon: <CheckCircle className="text-cyan-500" size={20} />, text: 'Finalize check-in with your active moods and precise mental diary notes.' };
      default: return { title: 'Assessment Step', icon: <BookOpen size={20} />, text: 'Please fill each item honestly.' };
    }
  };

  const header = getStepHeader();

  // Bullet warning phrases notice for demonstrator
  const isDemonstratorAlert = step === 9 || step === 1 || step === 2;

  return (
    <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300">
      
      {/* Visual Step Progress Bar */}
      <div className="w-full bg-slate-100 h-2 flex">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <div
            key={idx}
            className={`h-full transition-all duration-300 flex-1 border-r border-white ${
              idx + 1 === step 
                ? 'bg-indigo-600' 
                : idx + 1 < step 
                  ? 'bg-indigo-600/60' 
                  : 'bg-slate-200/50'
            }`}
          />
        ))}
      </div>

      <div className="p-6 sm:p-10">
        
        {/* Step Header */}
        <div className="flex items-start gap-4 mb-8 border-b border-slate-100 pb-6">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/50 shrink-0">
            {header.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full uppercase">
                Step {step} of 9
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {Math.round((step / totalSteps) * 100)}% Complete
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">
              {header.title}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {header.text}
            </p>
          </div>
        </div>

        {/* Form Inputs Container */}
        <div id={`assessment-step-${step}`} className="min-h-[280px] text-slate-700">
          
          {/* STEP 1: Academic Routine */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    College Start Time
                  </label>
                  <input
                    type="time"
                    value={academic.collegeStartTime}
                    onChange={e => setAcademic(prev => ({ ...prev, collegeStartTime: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    College End Time
                  </label>
                  <input
                    type="time"
                    value={academic.collegeEndTime}
                    onChange={e => setAcademic(prev => ({ ...prev, collegeEndTime: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Daily Commute/Travel Time (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="8"
                    value={academic.travelTime}
                    onChange={e => setAcademic(prev => ({ ...prev, travelTime: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Self Study Hours / Day
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={academic.selfStudyHours}
                    onChange={e => setAcademic(prev => ({ ...prev, selfStudyHours: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Workload Pressures */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/40 space-y-4">
                <span className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Workload & Strain Checks (Select all that apply)
                </span>
                
                <label className="flex items-center gap-3 cursor-pointer group text-sm font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={academic.attendancePressure}
                    onChange={e => setAcademic(prev => ({ ...prev, attendancePressure: e.target.checked }))}
                    className="w-5 h-5 accent-emerald-500 rounded border-slate-300"
                  />
                  <span>Feeling excessive pressure to sustain 75%+ lectures attendance requirements</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group text-sm font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={academic.assignmentPressure}
                    onChange={e => setAcademic(prev => ({ ...prev, assignmentPressure: e.target.checked }))}
                    className="w-5 h-5 accent-emerald-500 rounded border-slate-300"
                  />
                  <span>Choked with overlapping, back-to-back assignment and lab deadlines</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group text-sm font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={academic.placementAnxiety}
                    onChange={e => setAcademic(prev => ({ ...prev, placementAnxiety: e.target.checked }))}
                    className="w-5 h-5 accent-emerald-500 rounded border-slate-300"
                  />
                  <span>Experiencing job placements or future career stability anxieties</span>
                </label>
              </div>

              {/* Stress rating scale */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Academic Stress Rating ({academic.academicStressRating}/10)
                  </label>
                  <span className="text-xs font-semibold text-emerald-500">
                    {academic.academicStressRating >= 8 ? 'High Tension' : academic.academicStressRating >= 5 ? 'Moderate' : 'Manageable'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={academic.academicStressRating}
                  onChange={e => setAcademic(prev => ({ ...prev, academicStressRating: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 accent-emerald-500 rounded-lg cursor-pointer transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Describe Academic Roadblocks
                </label>
                <textarea
                  rows={2}
                  value={academic.academicStressDescription}
                  onChange={e => setAcademic(prev => ({ ...prev, academicStressDescription: e.target.value }))}
                  placeholder="e.g. Lab professors are grading very strictly, and travelling in local trains exhausts my self study hours..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Exam Assessment */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Do you have exams scheduled nearby?
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Check this option if test sessions are under 30 days away.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={exam.hasExamsNearby}
                      onChange={e => setExam(prev => ({ ...prev, hasExamsNearby: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              {exam.hasExamsNearby && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Days Remaining Until First Exam
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={exam.daysRemaining}
                        onChange={e => setExam(prev => ({ ...prev, daysRemaining: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Primary Reason of Panic Apprehension
                      </label>
                      <select
                        value={exam.reason}
                        onChange={e => setExam(prev => ({ ...prev, reason: e.target.value as any }))}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                      >
                        <option value="Not Studied">Haven't Studied / Backlogs</option>
                        <option value="Failed Before">Failed This Subject Before</option>
                        <option value="Fear Of Failure">Intense Fear of Failure</option>
                        <option value="Too Much Syllabus">Too Massive Syllabus Load</option>
                        <option value="Family Pressure">Strict Family High Grade Expectations</option>
                        <option value="Lack Of Confidence">General Lack of preparation confidence</option>
                        <option value="Other">Other Reasons</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Exam Specific Stress Rating ({exam.examStressRating}/10)
                      </label>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={exam.examStressRating}
                      onChange={e => setExam(prev => ({ ...prev, examStressRating: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 accent-emerald-500 rounded-lg cursor-pointer transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Additional Exam Context (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={exam.description}
                      onChange={e => setExam(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what exactly is worrying you about this upcoming exam paper..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {!exam.hasExamsNearby && (
                <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-slate-200/50 text-center">
                  <p className="text-slate-400 text-sm">No impending exam pressure cycles logged.</p>
                  <button
                    id="trigger-exam-on"
                    onClick={() => setExam(prev => ({ ...prev, hasExamsNearby: true }))}
                    className="text-emerald-500 font-bold text-xs hover:underline mt-2 cursor-pointer"
                  >
                    Click to toggle exam pressure active
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Sleep Assessment */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Average Daily Sleep Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="2"
                    max="14"
                    value={sleep.hoursSlept}
                    onChange={e => setSleep(prev => ({ ...prev, hoursSlept: parseFloat(e.target.value) || 7 }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Felt Sleep Quality Classification
                  </label>
                  <select
                    value={sleep.sleepQuality}
                    onChange={e => setSleep(prev => ({ ...prev, sleepQuality: e.target.value as any }))}
                    className="w-full px-3 py-3 rounded-xl border border-slate-100 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="Excellent">Excellent - Wake up fully charged</option>
                    <option value="Good">Good - Fairly rested</option>
                    <option value="Average">Average - Decent but get afternoon slumps</option>
                    <option value="Poor">Poor - Constantly fatigued / broken sleep</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Are you getting proper, uninterrupted sleep?
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle off if suffering from sleep lag, insomnia, or nightmare disturbances.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sleep.gettingProperSleep}
                    onChange={e => setSleep(prev => ({ ...prev, gettingProperSleep: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Show reasons if toggle is off */}
              {!sleep.gettingProperSleep && (
                <div className="space-y-3 bg-rose-50/10 p-5 border border-dashed border-rose-300/30 rounded-2xl animate-fade-in">
                  <span className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Primary Triggers Keeping You Awake (Select all that apply)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {['Mobile Usage', 'Gaming', 'Social Media', 'Overthinking', 'Anxiety', 'Family Problems', 'Relationship Problems', 'Academic Pressure', 'Other'].map(r => (
                      <label key={r} className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={sleep.reasonsForPoorSleep.includes(r as any)}
                          onChange={() => handleSleepReasonToggle(r)}
                          className="w-4 h-4 accent-rose-500"
                        />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Physical Health */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Daily Exercise / Active Movement (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={physical.exerciseDuration}
                    onChange={e => setPhysical(prev => ({ ...prev, exerciseDuration: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Primary Exercise Mode / Type
                  </label>
                  <input
                    type="text"
                    value={physical.exerciseType}
                    onChange={e => setPhysical(prev => ({ ...prev, exerciseType: e.target.value }))}
                    placeholder="e.g. Quick gym sprint, Badminton, brisk evening walk, none"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Physical Symptoms */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/40">
                <span className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Have you experienced any of these symptoms recently?
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {['Headache', 'Fatigue', 'Low Energy', 'Lack Of Concentration', 'Irritability', 'Motivation Loss'].map(sym => (
                    <label key={sym} className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={physical.symptoms.includes(sym as any)}
                        onChange={() => handleSymptomToggle(sym)}
                        className="w-4 h-4 accent-emerald-500"
                      />
                      <span>{sym}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Social Wellbeing */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Are you feeling lonely or socially isolated?
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle on if missing belonging, family catchups, or peer inclusions.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={social.feelingLonely}
                    onChange={e => setSocial(prev => ({ ...prev, feelingLonely: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {social.feelingLonely && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Primary Driver of Loneliness
                  </label>
                  <select
                    value={social.lonelyReason}
                    onChange={e => setSocial(prev => ({ ...prev, lonelyReason: e.target.value as any }))}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="Family">Disconnected from family support layers</option>
                    <option value="Friends">Lack of close real-time friends on campus</option>
                    <option value="Relationship">Recent relationship strain or single status</option>
                    <option value="Hostel Life">Difficulties adjusting to hostel environment</option>
                    <option value="Social Anxiety">Inherent clinical social anxieties / shyness</option>
                    <option value="New Environment">Relocated to completely unfamiliar college location</option>
                    <option value="Other">Other reasons</option>
                  </select>
                </div>
              )}

              {/* Support ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Family Support Factor ({social.familySupportRating}/10)
                    </label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={social.familySupportRating}
                    onChange={e => setSocial(prev => ({ ...prev, familySupportRating: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 accent-emerald-500 rounded-lg cursor-pointer transition-all"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Friend Support Factor ({social.friendSupportRating}/10)
                    </label>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={social.friendSupportRating}
                    onChange={e => setSocial(prev => ({ ...prev, friendSupportRating: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 accent-emerald-500 rounded-lg cursor-pointer transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Addiction Assessment */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Primary Daily Habit / Addiction Option
                  </label>
                  <select
                    value={addiction.type}
                    onChange={e => setAddiction(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="None">None - Happy with lifestyle balance</option>
                    <option value="Social Media">Social Media (Infinite Scroll, Tik-tok, Instagram)</option>
                    <option value="Gaming">Gaming (PC / Mobile esports, FPS running sessions)</option>
                    <option value="Smoking">Smoking (Tobacco / Vape inhalations)</option>
                    <option value="Alcohol">Alcohol (Parties / regular stress relieve beer glasses)</option>
                    <option value="Gambling">Gambling (Online casino stakes, crypto leverage trades)</option>
                    <option value="Other">Other options</option>
                  </select>
                </div>

                {addiction.type !== 'None' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Hours Spent Per Day on This Habit
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="18"
                      value={addiction.hoursPerDay}
                      onChange={e => setAddiction(prev => ({ ...prev, hoursPerDay: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: Failure Assessment */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Have you experienced a major failure or heavy disappointment?
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle on to explore lingering past anxieties.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={failure.hasMajorFailureBefore}
                    onChange={e => setFailure(prev => ({ ...prev, hasMajorFailureBefore: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {failure.hasMajorFailureBefore && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Nature of High Disappointment
                    </label>
                    <select
                      value={failure.failureType}
                      onChange={e => setFailure(prev => ({ ...prev, failureType: e.target.value as any }))}
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="Academic">Academic Failures / Bad GPA scores / Year drops</option>
                      <option value="Placement">Missed off-campus placement interviews</option>
                      <option value="Relationship">Romantic breakups / betrayal experiences</option>
                      <option value="Family">Domestic disputes / parental letdowns</option>
                      <option value="Personal Goal">Missed sports / startups / high expectation goals</option>
                      <option value="Other">Other personal incidents</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      How often do these past memories worry you?
                    </label>
                    <select
                      value={failure.howOftenThinkAboutIt}
                      onChange={e => setFailure(prev => ({ ...prev, howOftenThinkAboutIt: e.target.value as any }))}
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="Never">Never - Completely made peace with it</option>
                      <option value="Sometimes">Sometimes - Occasionally pops up in low mood states</option>
                      <option value="Often">Often - Dampens dynamic motivation levels</option>
                      <option value="Daily">Daily - Obsessively overthinking details</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 8: Primary Stress Source */}
          {step === 8 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Primary Active Stress Source
                  </label>
                  <select
                    value={primaryStress.source}
                    onChange={e => setPrimaryStress(prev => ({ ...prev, source: e.target.value as any }))}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="Exams">Impending College Exams</option>
                    <option value="Assignments">Hefty academic assignments / Lab project workloads</option>
                    <option value="Placements">Placements anxiety / Job interview preparations</option>
                    <option value="Family">Family domestic issues / high grade strain expectations</option>
                    <option value="Friends">Campus friend group friction / feeling ostracized</option>
                    <option value="Relationship">Romantic split-ups / heartaches</option>
                    <option value="Financial Problems">Financial obligations / Student credits burden</option>
                    <option value="Health">Physical illness / Body confidence doubts</option>
                    <option value="Self Confidence">Severe impostor syndrome / Fear of presenting</option>
                    <option value="Loneliness">Lack of deep human conversations</option>
                    <option value="Other">Other reasons</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Dynamic Sub-category Indicator
                  </label>
                  <select
                    value={primaryStress.subOption}
                    onChange={e => setPrimaryStress(prev => ({ ...prev, subOption: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-emerald-500 animate-slide-up"
                  >
                    {availableSubOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Current Emotional State & Free Comment */}
          {step === 9 && (
            <div className="space-y-6">
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                  Check all moods representing your state over the last 24-48 hours:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {['Happy', 'Calm', 'Tired', 'Stressed', 'Anxious', 'Sad', 'Angry', 'Hopeless', 'Confused', 'Motivated'].map(m => {
                    const active = emotionalState.moods.includes(m as any);
                    return (
                      <button
                        id={`mood-toggle-${m}`}
                        key={m}
                        type="button"
                        onClick={() => handleMoodToggle(m)}
                        className={`py-3 px-1 rounded-xl text-xs font-bold select-none border transition-all text-center cursor-pointer ${
                          active 
                            ? 'bg-gradient-to-tr from-emerald-500/10 to-teal-500/15 border-emerald-500 text-emerald-700 shadow-sm'
                            : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Verify or Write Final Wellness Comments (Crucial scan window)
                </label>
                <textarea
                  rows={4}
                  required
                  value={emotionalState.description}
                  onChange={e => setEmotionalState(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your mental status in detail. (Admins cannot see this text due to high confidentiality standards!). Try typing 'Life is meaningless' to test the built-in system-wide crisis trigger alarms."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100/50 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

        </div>

        {/* Dynamic Demonstrator Tip Bar */}
        {isDemonstratorAlert && (
          <div className="mt-8 p-3.5 rounded-xl border border-indigo-200/50 bg-indigo-50/30 text-[11px] font-medium leading-relaxed text-indigo-700 flex gap-2 items-start">
            <CheckCircle className="shrink-0 text-emerald-500 mt-0.5" size={14} />
            <div>
              <span className="font-bold">Prototypist Testing Notice:</span> Type distress keywords like <code className="px-1 text-rose-500 font-bold">i want to die</code>, <code className="px-1 text-rose-500 font-bold">life is meaningless</code>, or <code className="px-1 text-rose-500 font-bold">nobody cares about me</code> within description text areas to check how MindGuard triggers severe emergency workflows instantly!
            </div>
          </div>
        )}

        {/* Action Button Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
          <button
            id="assessment-cancel-btn"
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 text-xs font-semibold transition"
          >
            Cancel screening
          </button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                id="assessment-prev-btn"
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold hover:bg-slate-50 transition cursor-pointer select-none"
              >
                <ChevronLeft size={14} />
                <span>Previous Step</span>
              </button>
            )}

            {step < totalSteps ? (
              <button
                id="assessment-next-btn"
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:opacity-90 transition cursor-pointer select-none"
              >
                <span>Next Step</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                id="assessment-submit-btn"
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition animate-bounce cursor-pointer select-none shadow-md shadow-indigo-100"
              >
                <span>Compile & Finalize Screening</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
