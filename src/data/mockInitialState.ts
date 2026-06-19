import { StudentUser, AdminUser, FullAssessment, JournalEntry, CriticalIncident, AuditLog, AssessmentScores } from '../types';

export const DEFAULT_STUDENTS: StudentUser[] = [
  {
    id: 'stud_john',
    username: 'john_dev',
    email: 'john.student@mit.edu',
    password: 'john123',
    role: 'student',
    profile: {
      fullName: 'Johnathan Doe',
      age: 21,
      gender: 'Male',
      college: 'School of Engineering',
      department: 'Computer Science',
      year: '3rd Year',
      profilePicture: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
    },
    trustedContacts: [
      {
        id: 'tc_1',
        type: 'Person',
        name: 'Helen Doe',
        relationship: 'Mother',
        mobileNumber: '+1 (555) 0192-332'
      },
      {
        id: 'tc_2',
        type: 'PlatformUser',
        username: 'prof_jackson',
        userId: 'admin_1'
      }
    ]
  },
  {
    id: 'stud_sarah',
    username: 'sarah_sky',
    email: 'sarah.smith@mit.edu',
    password: 'sarah123',
    role: 'student',
    profile: {
      fullName: 'Sarah Smith',
      age: 20,
      gender: 'Female',
      college: 'School of Science',
      department: 'Biotechnology',
      year: '2nd Year',
      profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
    },
    trustedContacts: [
      {
        id: 'tc_3',
        type: 'Person',
        name: 'David Smith',
        relationship: 'Father',
        mobileNumber: '+1 (555) 4381-881'
      }
    ]
  },
  {
    id: 'stud_alex',
    username: 'alex_green',
    email: 'alex.g@mit.edu',
    password: 'alex123',
    role: 'student',
    profile: {
      fullName: 'Alex Green',
      age: 22,
      gender: 'Non-binary',
      college: 'School of Arts & Design',
      department: 'Fine Arts',
      year: '4th Year',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
    },
    trustedContacts: [
      {
        id: 'tc_4',
        type: 'Person',
        name: 'Marc Green',
        relationship: 'Brother',
        mobileNumber: '+1 (555) 9021-124'
      }
    ]
  }
];

export const DEFAULT_ADMINS: AdminUser[] = [
  {
    id: 'admin_1',
    email: 'admin.wellbeing@mit.edu',
    password: 'admin123',
    institutionId: 'MIT-WELL-742',
    role: 'admin'
  }
];

// Helper to generate a date offset in days
const daysAgo = (num: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - num);
  return d.toISOString();
};

// Generates historical assessment scores
export const MOCK_HISTORICAL_DATA: { [studentId: string]: { date: string, finalStressIndex: number, burnoutRiskScore: number, sleepHealthScore: number, academicStressScore: number }[] } = {
  stud_john: [
    { date: daysAgo(30).substring(5, 10), finalStressIndex: 45, burnoutRiskScore: 40, sleepHealthScore: 75, academicStressScore: 50 },
    { date: daysAgo(25).substring(5, 10), finalStressIndex: 48, burnoutRiskScore: 43, sleepHealthScore: 70, academicStressScore: 55 },
    { date: daysAgo(20).substring(5, 10), finalStressIndex: 52, burnoutRiskScore: 48, sleepHealthScore: 65, academicStressScore: 58 },
    { date: daysAgo(15).substring(5, 10), finalStressIndex: 58, burnoutRiskScore: 54, sleepHealthScore: 60, academicStressScore: 62 },
    { date: daysAgo(10).substring(5, 10), finalStressIndex: 68, burnoutRiskScore: 65, sleepHealthScore: 50, academicStressScore: 70 },
    { date: daysAgo(5).substring(5, 10), finalStressIndex: 78, burnoutRiskScore: 74, sleepHealthScore: 40, academicStressScore: 82 },
    { date: daysAgo(0).substring(5, 10), finalStressIndex: 83, burnoutRiskScore: 79, sleepHealthScore: 35, academicStressScore: 85 }
  ],
  stud_sarah: [
    { date: daysAgo(30).substring(5, 10), finalStressIndex: 28, burnoutRiskScore: 25, sleepHealthScore: 85, academicStressScore: 30 },
    { date: daysAgo(25).substring(5, 10), finalStressIndex: 25, burnoutRiskScore: 22, sleepHealthScore: 90, academicStressScore: 25 },
    { date: daysAgo(20).substring(5, 10), finalStressIndex: 30, burnoutRiskScore: 28, sleepHealthScore: 80, academicStressScore: 35 },
    { date: daysAgo(15).substring(5, 10), finalStressIndex: 32, burnoutRiskScore: 30, sleepHealthScore: 85, academicStressScore: 38 },
    { date: daysAgo(10).substring(5, 10), finalStressIndex: 35, burnoutRiskScore: 32, sleepHealthScore: 75, academicStressScore: 42 },
    { date: daysAgo(5).substring(5, 10), finalStressIndex: 29, burnoutRiskScore: 27, sleepHealthScore: 85, academicStressScore: 35 },
    { date: daysAgo(0).substring(5, 10), finalStressIndex: 24, burnoutRiskScore: 20, sleepHealthScore: 90, academicStressScore: 28 }
  ],
  stud_alex: [
    { date: daysAgo(30).substring(5, 10), finalStressIndex: 55, burnoutRiskScore: 50, sleepHealthScore: 55, academicStressScore: 60 },
    { date: daysAgo(25).substring(5, 10), finalStressIndex: 52, burnoutRiskScore: 48, sleepHealthScore: 60, academicStressScore: 58 },
    { date: daysAgo(20).substring(5, 10), finalStressIndex: 58, burnoutRiskScore: 55, sleepHealthScore: 50, academicStressScore: 65 },
    { date: daysAgo(15).substring(5, 10), finalStressIndex: 62, burnoutRiskScore: 58, sleepHealthScore: 45, academicStressScore: 68 },
    { date: daysAgo(10).substring(5, 10), finalStressIndex: 65, burnoutRiskScore: 62, sleepHealthScore: 40, academicStressScore: 70 },
    { date: daysAgo(5).substring(5, 10), finalStressIndex: 58, burnoutRiskScore: 54, sleepHealthScore: 55, academicStressScore: 62 },
    { date: daysAgo(0).substring(5, 10), finalStressIndex: 56, burnoutRiskScore: 52, sleepHealthScore: 58, academicStressScore: 60 }
  ]
};

// Full Assessments Mock Core
export const MOCK_ASSESSMENTS: FullAssessment[] = [
  {
    id: 'as_john_1',
    studentId: 'stud_john',
    createdAt: daysAgo(0),
    academic: {
      collegeStartTime: '08:30',
      collegeEndTime: '17:00',
      travelTime: 1.5,
      selfStudyHours: 1.5,
      attendancePressure: true,
      assignmentPressure: true,
      placementAnxiety: true,
      academicStressRating: 8,
      academicStressDescription: 'Struggling to keep up with competitive coding expectations and assignments while traveling 1.5 hours in crowded trains everyday. Heavy placement anxiety drives fear of missing out.'
    },
    exam: {
      hasExamsNearby: true,
      daysRemaining: 6,
      examStressRating: 9,
      reason: 'Fear Of Failure',
      description: 'I haven\'t covered even 40% of the syllabus because of daily lab work. Highly paranoid that I will fail computer systems engineering class.'
    },
    sleep: {
      hoursSlept: 4.5,
      sleepQuality: 'Poor',
      gettingProperSleep: false,
      reasonsForPoorSleep: ['Overthinking', 'Gaming', 'Academic Pressure']
    },
    physical: {
      exerciseDuration: 5,
      exerciseType: 'Walking to college transit',
      symptoms: ['Fatigue', 'Low Energy', 'Lack Of Concentration', 'Headache']
    },
    social: {
      feelingLonely: true,
      lonelyReason: 'Social Anxiety',
      familySupportRating: 6,
      friendSupportRating: 4
    },
    addiction: {
      type: 'Gaming',
      hoursPerDay: 4.5
    },
    failure: {
      hasMajorFailureBefore: true,
      failureType: 'Academic',
      howOftenThinkAboutIt: 'Daily'
    },
    primaryStress: {
      source: 'Placements',
      subOption: 'Cracking technical interview rounds'
    },
    emotionalState: {
      moods: ['Tired', 'Stressed', 'Anxious', 'Confused'],
      description: 'Feeling constantly behind and highly tense about what is ahead. It is exhausting to sustain.'
    }
  },
  {
    id: 'as_sarah_1',
    studentId: 'stud_sarah',
    createdAt: daysAgo(0),
    academic: {
      collegeStartTime: '09:00',
      collegeEndTime: '15:30',
      travelTime: 0.5,
      selfStudyHours: 4,
      attendancePressure: false,
      assignmentPressure: false,
      placementAnxiety: false,
      academicStressRating: 3,
      academicStressDescription: 'Syllabus is fine, managing coursework steadily.'
    },
    exam: {
      hasExamsNearby: false
    },
    sleep: {
      hoursSlept: 8,
      sleepQuality: 'Excellent',
      gettingProperSleep: true,
      reasonsForPoorSleep: []
    },
    physical: {
      exerciseDuration: 45,
      exerciseType: 'Jogging and Yoga',
      symptoms: []
    },
    social: {
      feelingLonely: false,
      familySupportRating: 9,
      friendSupportRating: 8
    },
    addiction: {
      type: 'None',
      hoursPerDay: 0
    },
    failure: {
      hasMajorFailureBefore: false
    },
    primaryStress: {
      source: 'Health',
      subOption: 'Planning balanced vegan nutrition'
    },
    emotionalState: {
      moods: ['Happy', 'Calm', 'Motivated'],
      description: 'Doing great! Maintaining healthy lifestyle structure, sleep routines, and daily exercise has put my mental state in a fantastic spot.'
    }
  },
  {
    id: 'as_alex_1',
    studentId: 'stud_alex',
    createdAt: daysAgo(0),
    academic: {
      collegeStartTime: '09:30',
      collegeEndTime: '16:00',
      travelTime: 0.8,
      selfStudyHours: 2,
      attendancePressure: true,
      assignmentPressure: true,
      placementAnxiety: false,
      academicStressRating: 5,
      academicStressDescription: 'Moderate level of project submissions and coursework strain.'
    },
    exam: {
      hasExamsNearby: true,
      daysRemaining: 18,
      examStressRating: 5,
      reason: 'Too Much Syllabus',
      description: 'A lot of painting projects are due along with academic research reviews.'
    },
    sleep: {
      hoursSlept: 6,
      sleepQuality: 'Average',
      gettingProperSleep: true,
      reasonsForPoorSleep: ['Social Media']
    },
    physical: {
      exerciseDuration: 20,
      exerciseType: 'Walking',
      symptoms: ['Fatigue']
    },
    social: {
      feelingLonely: true,
      lonelyReason: 'Hostel Life',
      familySupportRating: 7,
      friendSupportRating: 7
    },
    addiction: {
      type: 'Social Media',
      hoursPerDay: 3
    },
    failure: {
      hasMajorFailureBefore: true,
      failureType: 'Relationship',
      howOftenThinkAboutIt: 'Sometimes'
    },
    primaryStress: {
      source: 'Loneliness',
      subOption: 'Transitioning to hostel dorm environment'
    },
    emotionalState: {
      moods: ['Tired', 'Anxious', 'Sad'],
      description: 'Adjusting slowly, some homesick vibes in evenings but mostly trying my best.'
    }
  }
];

export const DEFAULT_JOURNALS: JournalEntry[] = [
  {
    id: 'j_1',
    studentId: 'stud_john',
    title: 'The coding fatigue',
    content: 'Felt extremely stressed today. Failed to compile the red-black tree program within lab, felt like everyone else is lightyears ahead of me. Travel back home on train was loud and hot. Spent 3 hours on Valorant to forget everything but ended up sleeping super late.',
    moodTags: ['Stressed', 'Tired'],
    createdAt: daysAgo(1)
  },
  {
    id: 'j_2',
    studentId: 'stud_sarah',
    title: 'Sunny morning run',
    content: 'Woke up at 6:30 AM, completed a 5km run at the park near my hostel. Breakfast was delicious. Prepared biotech presentation notes and went to lab. Everything felt effortless. Journaling is really helping me stay anchored!',
    moodTags: ['Happy', 'Motivated'],
    createdAt: daysAgo(1)
  },
  {
    id: 'j_3',
    studentId: 'stud_sarah',
    title: 'Reflections',
    content: 'Highly productive week. Glad to check in. Family called tonight, very comforting.',
    moodTags: ['Calm'],
    createdAt: daysAgo(3)
  }
];

export const DEFAULT_CRITICAL_INCIDENTS: CriticalIncident[] = [
  {
    id: 'ci_1',
    studentId: 'stud_john_prev',
    studentName: 'Devon Miller (Simulated)',
    studentDepartment: 'Mechanical Engineering',
    studentYear: '2nd Year',
    detectedTriggerPhrase: 'kill myself',
    createdAt: daysAgo(4),
    resolved: true,
    resolvedAt: daysAgo(4),
    actionTaken: 'Counselling department made immediate contact. Student relocated to off-campus parental residence temporarily with supportive psychological care plan.'
  }
];

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'al_1',
    timestamp: daysAgo(4),
    eventType: 'CRITICAL_PHRASE_DETECTED',
    studentId: 'stud_john_prev',
    details: 'System detected alert trigger text "kill myself" inside student Devon Miller\'s exam stress comments.'
  },
  {
    id: 'al_2',
    timestamp: daysAgo(4),
    eventType: 'CONTACTS_NOTIFIED',
    studentId: 'stud_john_prev',
    details: 'Automated distress notification dispatch sent via SMS/Email interface to student\'s trusted contacts.'
  },
  {
    id: 'al_3',
    timestamp: daysAgo(4),
    eventType: 'ADMIN_NOTIFIED',
    studentId: 'stud_john_prev',
    details: 'Institution chief well-being officer administrator alert dispatched to portal inbox.'
  }
];
