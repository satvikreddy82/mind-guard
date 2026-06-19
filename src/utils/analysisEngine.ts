import { FullAssessment, AssessmentScores, RiskLevel, ActionPlanRecommendation, RootCausesResult } from '../types';

// Crisis Detection Keywords & Phrases
export const CRISIS_PHRASES = [
  'i want to die',
  'i don\'t want to live',
  'nobody cares about me',
  'life is meaningless',
  'i want to disappear',
  'i cannot continue',
  'kill myself',
  'suicide',
  'end my life',
  'better off dead',
  'want to end it'
];

/**
 * Scans text for any crisis keywords or phrases indicating severe emotional distress.
 */
export function detectCrisis(assessment: FullAssessment): { detected: boolean; phrase: string } {
  const textsToScan = [
    assessment.academic.academicStressDescription,
    assessment.exam.description || '',
    assessment.emotionalState.description
  ].map(t => t.toLowerCase().trim());

  for (const text of textsToScan) {
    if (!text) continue;
    for (const phrase of CRISIS_PHRASES) {
      if (text.includes(phrase)) {
        return { detected: true, phrase };
      }
    }
  }
  return { detected: false, phrase: '' };
}

/**
 * Calculates rule-based mental health scores (0-100 scale) for each segment.
 */
export function calculateScores(assessment: FullAssessment): AssessmentScores {
  const { academic, exam, sleep, physical, social, addiction, failure, emotionalState } = assessment;

  // 1. Academic Stress Score (Rating 1-10 -> 0-100 scale, with active boosters)
  let acadScore = academic.academicStressRating * 10;
  if (academic.attendancePressure) acadScore += 10;
  if (academic.assignmentPressure) acadScore += 10;
  if (academic.placementAnxiety) acadScore += 10;
  if (academic.selfStudyHours < 2) acadScore += 10;
  acadScore = Math.min(100, Math.max(0, acadScore));

  // 2. Exam Anxiety Score (Only if exams are nearby)
  let examScore = 0;
  if (exam.hasExamsNearby && exam.examStressRating) {
    examScore = exam.examStressRating * 10;
    const days = exam.daysRemaining ?? 30;
    if (days <= 7) {
      examScore += 20;
    } else if (days <= 14) {
      examScore += 10;
    }
    if (exam.reason === 'Fear Of Failure' || exam.reason === 'Family Pressure') {
      examScore += 10;
    }
  }
  examScore = Math.min(100, Math.max(0, examScore));

  // 3. Sleep Health Score (Starts at 100, drops on bad patterns)
  let sleepScore = 100;
  if (!sleep.gettingProperSleep) {
    sleepScore -= 20;
  }
  if (sleep.sleepQuality === 'Poor') sleepScore -= 30;
  if (sleep.sleepQuality === 'Average') sleepScore -= 10;
  
  sleepScore -= (sleep.reasonsForPoorSleep.length * 10);
  
  if (sleep.hoursSlept < 5) {
    sleepScore -= 20;
  } else if (sleep.hoursSlept < 7) {
    sleepScore -= 10;
  }
  sleepScore = Math.max(0, Math.min(100, sleepScore));

  // 4. Physical Wellness Score (Starts at 100, drops on active symptoms)
  let physScore = 100;
  physScore -= (physical.symptoms.length * 12);
  
  if (physical.exerciseDuration < 15) {
    physScore -= 15;
  } else if (physical.exerciseDuration < 30) {
    physScore -= 5;
  }
  physScore = Math.max(0, Math.min(100, physScore));

  // 5. Social Wellbeing Score (Starts at 100)
  let socialScore = 100;
  if (social.feelingLonely) {
    socialScore -= 30;
    if (social.lonelyReason === 'Social Anxiety' || social.lonelyReason === 'Hostel Life') {
      socialScore -= 10;
    }
  }
  // Support rating 1-10 (higher is better)
  const familyDeduct = (10 - social.familySupportRating) * 4;
  const friendDeduct = (10 - social.friendSupportRating) * 4;
  socialScore -= (familyDeduct + friendDeduct);
  socialScore = Math.max(0, Math.min(100, socialScore));

  // 6. Addiction Risk Score (Addiction categories and usage hours)
  let addScore = 0;
  if (addiction.type !== 'None') {
    addScore = addiction.hoursPerDay * 12;
    if (addiction.type === 'Gambling' || addiction.type === 'Smoking' || addiction.type === 'Alcohol') {
      addScore += 25; // Higher core risk
    }
  }
  addScore = Math.min(100, Math.max(0, addScore));

  // 7. Emotional Distress Score (Calculated from selected moods)
  let emotionalScore = 0;
  const negativeMoods = ['Stressed', 'Anxious', 'Sad', 'Angry', 'Hopeless', 'Confused'];
  const baseCount = emotionalState.moods.filter(m => negativeMoods.includes(m)).length;
  emotionalScore += (baseCount * 12);
  
  if (emotionalState.moods.includes('Hopeless')) emotionalScore += 20;
  if (emotionalState.moods.includes('Sad')) emotionalScore += 10;
  if (emotionalState.moods.includes('Anxious')) emotionalScore += 10;
  
  // Positives reduce distress
  if (emotionalState.moods.includes('Happy')) emotionalScore -= 15;
  if (emotionalState.moods.includes('Calm')) emotionalScore -= 15;
  if (emotionalState.moods.includes('Motivated')) emotionalScore -= 10;
  emotionalScore = Math.max(0, Math.min(100, emotionalScore));

  // 8. Burnout Risk Score (Synthesized from Sleep, Physical, Academic and Emotional)
  const sleepDeficit = 100 - sleepScore;
  const physicalDeficit = 100 - physScore;
  let burnoutScore = (acadScore * 0.35) + (sleepDeficit * 0.25) + (physicalDeficit * 0.20) + (emotionalScore * 0.20);
  
  if (failure.hasMajorFailureBefore && failure.howOftenThinkAboutIt === 'Daily') {
    burnoutScore += 10;
  }
  burnoutScore = Math.min(100, Math.max(0, Math.round(burnoutScore)));

  // 9. Synthesized Final Stress Index (Combined weights of factors)
  // Higher scores = higher stress.
  const sleepComponent = 100 - sleepScore;     // Low sleep score = high stress
  const physicalComponent = 100 - physScore;   // Low physical score = high stress
  const socialComponent = 100 - socialScore;     // Low social score = high stress

  let stressIndex = 
    (acadScore * 0.15) + 
    (examScore * 0.15) + 
    (sleepComponent * 0.15) + 
    (physicalComponent * 0.10) + 
    (socialComponent * 0.15) + 
    (addScore * 0.10) + 
    (emotionalScore * 0.20);
    
  stressIndex = Math.min(100, Math.max(0, Math.round(stressIndex)));

  return {
    academicStressScore: Math.round(acadScore),
    examAnxietyScore: Math.round(examScore),
    sleepHealthScore: Math.round(sleepScore),
    physicalWellnessScore: Math.round(physScore),
    socialWellbeingScore: Math.round(socialScore),
    addictionRiskScore: Math.round(addScore),
    emotionalDistressScore: Math.round(emotionalScore),
    burnoutRiskScore: Math.round(burnoutScore),
    finalStressIndex: Math.round(stressIndex)
  };
}

/**
 * Maps the final stress index and crisis detection to a RiskLevel classification.
 */
export function classifyRisk(finalStressIndex: number, crisisDetected: boolean): RiskLevel {
  if (crisisDetected) return 'Critical';
  
  if (finalStressIndex < 35) return 'Healthy';
  if (finalStressIndex < 55) return 'Mild Concern';
  if (finalStressIndex < 72) return 'Moderate Concern';
  if (finalStressIndex < 85) return 'High Risk';
  return 'Critical';
}

/**
 * Extracts distinct root causes of wellness concerns based on rules.
 */
export function extractRootCauses(assessment: FullAssessment, scores: AssessmentScores): RootCausesResult {
  const causes: string[] = [];

  if (scores.academicStressScore > 65) {
    causes.push('Academic Burnout');
  }
  if (assessment.academic.placementAnxiety) {
    causes.push('Placement Anxiety');
  }
  if (assessment.exam.hasExamsNearby && (scores.examAnxietyScore > 55)) {
    causes.push('Exam Anxiety');
  }
  if (assessment.exam.reason === 'Fear Of Failure' || (assessment.failure.howOftenThinkAboutIt && ['Daily', 'Often'].includes(assessment.failure.howOftenThinkAboutIt))) {
    causes.push('Fear of Failure');
  }
  if (scores.sleepHealthScore < 50) {
    causes.push('Poor Sleep Hygiene');
  }
  if (assessment.sleep.reasonsForPoorSleep.includes('Overthinking') || assessment.emotionalState.moods.includes('Confused')) {
    causes.push('Mental Overthinking');
  }
  if (assessment.exam.reason === 'Family Pressure' || assessment.sleep.reasonsForPoorSleep.includes('Family Problems') || assessment.social.lonelyReason === 'Family') {
    causes.push('Family Expectations Pressure');
  }
  if (assessment.social.feelingLonely) {
    causes.push('Social Isolation');
  }
  if (assessment.social.lonelyReason === 'Social Anxiety') {
    causes.push('Social Anxiety');
  }
  if (scores.addictionRiskScore > 45) {
    causes.push(`Excessive Digital Addiction (${assessment.addiction.type})`);
  }
  if (scores.burnoutRiskScore > 70) {
    causes.push('Critical Academic Burnout Risk');
  }
  if (scores.physicalWellnessScore < 50) {
    causes.push('Physical Fatigue and Exhaustion');
  }

  // Fallback
  if (causes.length === 0) {
    if (scores.finalStressIndex > 40) {
      causes.push('General Lifestyle Strain');
    } else {
      causes.push('No Significant Concern');
    }
  }

  return { causes };
}

/**
 * Non-generic recommendation builder relying directly on specific answer values.
 */
export function generateActionPlans(assessment: FullAssessment, scores: AssessmentScores, causes: string[]): ActionPlanRecommendation[] {
  const plans: ActionPlanRecommendation[] = [];

  // Plan 1: Academic Stress & Burnout
  if (causes.includes('Academic Burnout') || causes.includes('Critical Academic Burnout Risk')) {
    plans.push({
      problem: 'Academic Exhaustion & Burnout',
      detectedBecause: `You reported academic stress of ${assessment.academic.academicStressRating}/10, average self-study of ${assessment.academic.selfStudyHours} hrs/day, and high academic strain features.`,
      immediateActions: [
        'Break down active syllabus topics into ultra-small 25-minute Pomodoro sections.',
        'Explicitly close all academic materials by 8:00 PM tonight for full neural rest.',
        'Refuse taking additional optional workloads or leadership assignments this week.'
      ],
      thisWeekPlan: [
        'Set up a fixed study agenda maxed at 3 hours of self-study outside of lectures.',
        'Create a visual checklist of sub-tasks to gamify regular homework and reduce study piling.',
        'Initiate a 5-minute dialogue with a departmental study assistant or classmate to distribute study workload.'
      ],
      longTermImprovement: [
        'Engage directly with the campus counselor to restructure study prioritization expectations.',
        'Redefine personal success parameters outside of pure GPA grades to minimize persistent negative comparisons.'
      ]
    });
  }

  // Plan 2: Exam Stress
  if (causes.includes('Exam Anxiety') || causes.includes('Fear of Failure')) {
    const days = assessment.exam.daysRemaining ?? 'few';
    plans.push({
      problem: 'Acute Exam Anxiety & Panic Apprehension',
      detectedBecause: `You rated your exam anxiety at ${assessment.exam.examStressRating || 7}/10 with exams coming up in exactly ${days} days, triggered due to "${assessment.exam.reason || 'Syllabus Load'}".`,
      immediateActions: [
        'Stop marathon revisions immediately; perform 4-4-4 deep breathing for 3 minutes.',
        'Draft an immediate list of key high-yield topics (80/20 rule) to study instead of tackling the entire textbook.',
        'Remove active alarm stress cycles by mapping daily revision routines cleanly.'
      ],
      thisWeekPlan: [
        'Dedicate 1 hour daily exclusively to practicing mock test series under simulated conditions to build confidence.',
        'Collaborate with a highly calm classmate to study high-yield areas together.',
        'Ensure an absolute minimum of 7.5 hours of solid sleep during high exam preparation days.'
      ],
      longTermImprovement: [
        'Adopt spacing and active recall paradigms throughout the semester to eliminate stressful exam-eve cramming sessions.',
        'Frame failures as informative neural data points that guide better preparation rather than personal value deficits.'
      ]
    });
  }

  // Plan 3: Sleep Hygiene
  if (causes.includes('Poor Sleep Hygiene') || causes.includes('Mental Overthinking')) {
    plans.push({
      problem: 'Disrupted Circadian Rhythm & Overthinking Sleep Lag',
      detectedBecause: `You log ${assessment.sleep.hoursSlept} hours slept on average, with sleep quality classified as "${assessment.sleep.sleepQuality}", primarily impacted by ${assessment.sleep.reasonsForPoorSleep.join(', ') || 'anxiety'}.`,
      immediateActions: [
        'Commit to setting down all digital glowing screens at minimum 45 minutes prior to turning off lights.',
        'Consume a hot decaffeinated herbal infusion or water and avoid eating after 8:30 PM.',
        'Write down all pressing tomorrow conflicts on emergency scratch paper to physically purge overthinking cycles.'
      ],
      thisWeekPlan: [
        'Strictly synchronize your alarms so you get up at exactly the same hour daily, including on weekends.',
        'Reposition any smartphone chargers entirely across the physical bedroom to prevent late midnight scrolling.',
        'Practice a 10-minute guided mindfulness session or physical body scan directly inside your bed layout.'
      ],
      longTermImprovement: [
        'Designate your bed entirely for resting cycles (no studies, laptops, or food on sheets).',
        'Spend 15 minutes in ambient direct morning sunlight immediately upon waking up to optimize natural melatonin cycles.'
      ]
    });
  }

  // Plan 4: Social Needs
  if (causes.includes('Social Isolation') || causes.includes('Social Anxiety')) {
    plans.push({
      problem: 'Aloneness and Social Connection Deficit',
      detectedBecause: `You expressed feeling isolated with primary isolation factors reported as "${assessment.social.lonelyReason || 'social anxiety'}" and support metrics needing assistance.`,
      immediateActions: [
        'Reach back out to one long-distance trusted childhood friend or reliable relative today with a simple hello note.',
        'Sit down in standard communal study lounges or dining layouts rather than completely isolated behind closed quarters.',
        'Write down three micro qualities you sincerely appreciate about yourself to stabilize confidence.'
      ],
      thisWeekPlan: [
        'Identify and register to attend one interesting casual campus club or society meeting (even if just listening in).',
        'Schedule a 20-minute physical dinner or coffee catchup session with a trusted classmate.',
        'Practice active listening during interactive classes; offer one positive comment to a peer.'
      ],
      longTermImprovement: [
        'Confront anxiety cycles incrementally by slowly enrolling in interesting collaborative group workshop activities.',
        'Dedicate 1 hour per week volunteering for a charitable interest group to build deeply meaningful value relationships.'
      ]
    });
  }

  // Plan 5: Addiction Concerns
  if (causes.includes(`Excessive Digital Addiction (${assessment.addiction.type})`) || scores.addictionRiskScore > 45) {
    plans.push({
      problem: `High Risk Habit Patterns: Digital Overuse (${assessment.addiction.type})`,
      detectedBecause: `You spend approximately ${assessment.addiction.hoursPerDay} hours daily engaging in ${assessment.addiction.type}, leading to routine disruption.`,
      immediateActions: [
        'Use native device settings to set an absolute hard limit of 30 minutes for gaming/social media applications today.',
        'Uninstall the primary offending application from your immediate home view screen and hide access shortcuts.',
        'Take a 30-minute physical walk outdoors completely isolated from any digital distraction or headphone feeds.'
      ],
      thisWeekPlan: [
        'Establish a digital-free dining rule during all main daily meals to increase mindful eating.',
        'Engage in 1 full day of a digital detox cycle, substituting technology with tangible books or field activities.',
        'Set app-blocker triggers with a trusted peer acting as the password guardian.'
      ],
      longTermImprovement: [
        'Invest in developing off-screen hobbies such as running, sketching, physical crafts, or playing instruments.',
        'Examine and solve the root anxiety triggers causing you to escape consistently into virtual spaces.'
      ]
    });
  }

  // Fallback default plan
  if (plans.length === 0) {
    plans.push({
      problem: 'Constructive Wellness Maintenance',
      detectedBecause: 'Your stress scores indicate a sound baseline. These suggestions support continued mental excellence.',
      immediateActions: [
        'Take brief 5-minute gratitude journaling intervals to note three active positives in your environment.',
        'Encourage and check in on a classmate who seems quiet or under immediate strain.'
      ],
      thisWeekPlan: [
        'Sustain your excellent sleep cycle (aiming for 7.5 to 8 hours daily).',
        'Sample one new physical activity style or take a nature trail trek.'
      ],
      longTermImprovement: [
        'Formulate a master personal journal habit to reflect and analyze your emotional trends regularly.',
        'Cultivate a robust balance between social life, physical activity, and academic drive.'
      ]
    });
  }

  return plans;
}
