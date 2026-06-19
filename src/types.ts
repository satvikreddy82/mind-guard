/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RiskLevel = 'Healthy' | 'Mild Concern' | 'Moderate Concern' | 'High Risk' | 'Critical';

export interface TrustedContact {
  id: string;
  type: 'Person' | 'PlatformUser';
  name?: string;
  relationship?: string;
  mobileNumber?: string;
  username?: string;
  userId?: string;
}

export interface StudentProfile {
  fullName: string;
  age: number;
  gender: string;
  college: string;
  department: string;
  year: string;
  profilePicture?: string;
}

export interface AcademicAssessment {
  collegeStartTime: string;
  collegeEndTime: string;
  travelTime: number; // in hours or minutes
  selfStudyHours: number;
  attendancePressure: boolean;
  assignmentPressure: boolean;
  placementAnxiety: boolean;
  academicStressRating: number; // 1-10
  academicStressDescription: string;
}

export interface ExamAssessment {
  hasExamsNearby: boolean;
  daysRemaining?: number;
  examStressRating?: number; // 1-10
  reason?: 'Not Studied' | 'Failed Before' | 'Fear Of Failure' | 'Too Much Syllabus' | 'Family Pressure' | 'Lack Of Confidence' | 'Other';
  description?: string;
}

export interface SleepAssessment {
  hoursSlept: number;
  sleepQuality: 'Poor' | 'Average' | 'Good' | 'Excellent';
  gettingProperSleep: boolean;
  reasonsForPoorSleep: ('Mobile Usage' | 'Gaming' | 'Social Media' | 'Overthinking' | 'Anxiety' | 'Family Problems' | 'Relationship Problems' | 'Academic Pressure' | 'Other')[];
}

export interface PhysicalHealth {
  exerciseDuration: number; // minutes per day
  exerciseType: string;
  symptoms: ('Headache' | 'Fatigue' | 'Low Energy' | 'Lack Of Concentration' | 'Irritability' | 'Motivation Loss')[];
}

export interface SocialWellbeing {
  feelingLonely: boolean;
  lonelyReason?: 'Family' | 'Friends' | 'Relationship' | 'Hostel Life' | 'Social Anxiety' | 'New Environment' | 'Other';
  familySupportRating: number; // 1-10
  friendSupportRating: number; // 1-10
}

export interface AddictionAssessment {
  type: 'None' | 'Social Media' | 'Gaming' | 'Smoking' | 'Alcohol' | 'Gambling' | 'Other';
  hoursPerDay: number;
}

export interface FailureAssessment {
  hasMajorFailureBefore: boolean;
  failureType?: 'Academic' | 'Placement' | 'Relationship' | 'Family' | 'Personal Goal' | 'Other';
  howOftenThinkAboutIt?: 'Never' | 'Sometimes' | 'Often' | 'Daily';
}

export interface PrimaryStressAssessment {
  source: 'Exams' | 'Assignments' | 'Placements' | 'Family' | 'Friends' | 'Relationship' | 'Financial Problems' | 'Health' | 'Self Confidence' | 'Loneliness' | 'Other';
  subOption: string;
}

export interface EmotionalStateAssessment {
  moods: ('Happy' | 'Calm' | 'Tired' | 'Stressed' | 'Anxious' | 'Sad' | 'Angry' | 'Hopeless' | 'Confused' | 'Motivated')[];
  description: string;
}

export interface FullAssessment {
  id: string;
  studentId: string;
  createdAt: string; // ISO string
  academic: AcademicAssessment;
  exam: ExamAssessment;
  sleep: SleepAssessment;
  physical: PhysicalHealth;
  social: SocialWellbeing;
  addiction: AddictionAssessment;
  failure: FailureAssessment;
  primaryStress: PrimaryStressAssessment;
  emotionalState: EmotionalStateAssessment;
}

export interface AssessmentScores {
  academicStressScore: number; // 0 - 100
  examAnxietyScore: number; // 0 - 100
  sleepHealthScore: number; // 0 - 100
  physicalWellnessScore: number; // 0 - 100
  socialWellbeingScore: number; // 0 - 100
  addictionRiskScore: number; // 0 - 100
  emotionalDistressScore: number; // 0 - 100
  burnoutRiskScore: number; // 0 - 100
  finalStressIndex: number; // 0 - 100
}

export interface ActionPlanRecommendation {
  problem: string;
  detectedBecause: string;
  immediateActions: string[];
  thisWeekPlan: string[];
  longTermImprovement: string[];
}

export interface RootCausesResult {
  causes: string[];
}

export interface JournalEntry {
  id: string;
  studentId: string;
  title: string;
  content: string;
  moodTags: string[];
  createdAt: string; // ISO Date String
}

export interface StudentUser {
  id: string;
  username: string;
  email: string;
  role: 'student';
  password?: string;
  profile: StudentProfile;
  trustedContacts: TrustedContact[];
}

export interface AdminUser {
  id: string;
  email: string;
  institutionId: string;
  password?: string;
  role: 'admin';
}

export interface CriticalIncident {
  id: string;
  studentId: string;
  studentName: string;
  studentDepartment: string;
  studentYear: string;
  detectedTriggerPhrase: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  actionTaken?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: 'CRITICAL_PHRASE_DETECTED' | 'CONTACTS_NOTIFIED' | 'ADMIN_NOTIFIED' | 'ASSESSMENT_COMPLETED';
  studentId: string;
  details: string;
}

export interface WellnessReportData {
  assessmentDate: string;
  scores: AssessmentScores;
  detectedCauses: string[];
  riskLevel: RiskLevel;
}
