import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Employee, 
  Department, 
  LeaveType, 
  LeaveRequest, 
  LeaveBalance,
  ProfileChangeRequest,
  PerformanceReview,
  JobPosting,
  PolicyDocument,
  PolicyAcknowledgment,
  Notification,
  CareerMovement,
  OrganizationalStructure,
  AttendanceRecord,
  TimesheetRecord,
  TrainingCourse,
  CourseMaterial,
  CertificationRecord,
  GoalRecord,
  SystemSettings,
  Document,
  FicaComplianceRecord,
  FicaRequirement,
  Tenant,
  AuditLogEntry,
  WorkflowApprovalItem,
  JobRequisition,
  Candidate,
  OnboardingTask,
  ExitClearance,
  HRCase,
  KnowledgeBaseArticle,
  PayrollExportSummary
} from '../types';

interface DataContextType {
  employees: Employee[];
  departments: Department[];
  leaveTypes: LeaveType[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  profileChangeRequests: ProfileChangeRequest[];
  performanceReviews: PerformanceReview[];
  jobPostings: JobPosting[];
  policyDocuments: PolicyDocument[];
  policyAcknowledgments: PolicyAcknowledgment[];
  notifications: Notification[];
  careerMovements: CareerMovement[];
  organizationalStructure: OrganizationalStructure | null;
  attendanceRecords: AttendanceRecord[];
  timesheets: TimesheetRecord[];
  trainingCourses: TrainingCourse[];
  certifications: CertificationRecord[];
  goals: GoalRecord[];
  systemSettings: SystemSettings;
  documents: Document[];
  ficaRecords: FicaComplianceRecord[];
  tenants: Tenant[];
  currentTenant: Tenant;
  setCurrentTenant: (tenant: Tenant) => void;
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'tenantId'>) => void;
  workflowApprovals: WorkflowApprovalItem[];
  approveWorkflowItem: (id: string, approverName: string, comments?: string) => void;
  rejectWorkflowItem: (id: string, approverName: string, comments?: string) => void;
  delegateWorkflowItem: (id: string, delegatedTo: string, approverName: string) => void;
  jobRequisitions: JobRequisition[];
  addJobRequisition: (req: Omit<JobRequisition, 'id' | 'createdAt' | 'tenantId'>) => void;
  candidates: Candidate[];
  addCandidate: (cand: Omit<Candidate, 'id' | 'appliedDate' | 'tenantId'>) => void;
  updateCandidateStage: (id: string, stage: Candidate['stage'], feedback?: string) => void;
  convertCandidateToEmployee: (candidateId: string) => Employee;
  onboardingTasks: OnboardingTask[];
  updateOnboardingTask: (id: string, status: OnboardingTask['status']) => void;
  exitClearances: ExitClearance[];
  updateExitClearanceItem: (clearanceId: string, department: string, cleared: boolean, notes?: string) => void;
  hrCases: HRCase[];
  addHRCase: (hrCase: Omit<HRCase, 'id' | 'caseNumber' | 'createdAt' | 'tenantId' | 'replies'>) => void;
  addCaseReply: (caseId: string, reply: { sender: string; message: string; isInternal: boolean }) => void;
  updateCaseStatus: (caseId: string, status: HRCase['status']) => void;
  knowledgeBase: KnowledgeBaseArticle[];
  bulkImportEmployees: (importedEmployees: Record<string, string>[]) => { successCount: number; errors: string[] };
  getPayrollExport: (month: string) => PayrollExportSummary;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addDepartment: (department: Omit<Department, 'id' | 'createdAt'>) => void;
  updateDepartment: (id: string, department: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  addLeaveType: (leaveType: Omit<LeaveType, 'id'>) => void;
  updateLeaveType: (id: string, leaveType: Partial<LeaveType>) => void;
  deleteLeaveType: (id: string) => void;
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLeaveRequest: (id: string, request: Partial<LeaveRequest>) => void;
  updateLeaveBalance: (employeeId: string, leaveTypeId: string, balance: Partial<LeaveBalance>) => void;
  addProfileChangeRequest: (request: Omit<ProfileChangeRequest, 'id' | 'createdAt'>) => void;
  updateProfileChangeRequest: (id: string, request: Partial<ProfileChangeRequest>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
  addPerformanceReview: (review: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePerformanceReview: (id: string, review: Partial<PerformanceReview>) => void;
  addJobPosting: (posting: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateJobPosting: (id: string, posting: Partial<JobPosting>) => void;
  deleteJobPosting: (id: string) => void;
  addCareerMovement: (movement: Omit<CareerMovement, 'id' | 'createdAt'>) => void;
  updateOrganizationalStructure: (structure: Partial<OrganizationalStructure>) => void;
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => void;
  updateAttendanceRecord: (id: string, record: Partial<AttendanceRecord>) => void;
  clockIn: (employeeId: string) => void;
  clockOut: (employeeId: string) => void;
  addTimesheet: (timesheet: Omit<TimesheetRecord, 'id'>) => void;
  updateTimesheet: (id: string, timesheet: Partial<TimesheetRecord>) => void;
  addTrainingCourse: (course: Omit<TrainingCourse, 'id'>) => void;
  updateTrainingCourse: (id: string, course: Partial<TrainingCourse>) => void;
  enrollInCourse: (courseId: string, employeeId: string) => void;
  addCourseMaterial: (courseId: string, material: Omit<CourseMaterial, 'id' | 'uploadedAt'>) => void;
  deleteCourseMaterial: (courseId: string, materialId: string) => void;
  updateCourseProgress: (courseId: string, employeeId: string, completionRate: number) => void;
  addCertification: (cert: Omit<CertificationRecord, 'id'>) => void;
  updateCertification: (id: string, cert: Partial<CertificationRecord>) => void;
  addGoal: (goal: Omit<GoalRecord, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<GoalRecord>) => void;
  deleteGoal: (id: string) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  addPolicyDocument: (policy: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  acknowledgePolicy: (policyId: string, employeeId: string) => void;
  addDocument: (doc: Omit<Document, 'id' | 'uploadDate'>) => Document;
  deleteDocument: (id: string) => void;
  verifyDocument: (id: string, status: 'verified' | 'rejected', notes?: string, verifiedBy?: string) => void;
  signDocument: (documentId: string, signerName: string) => void;
  submitProfileUpdateRequest: (employeeId: string, updateData: { phone?: string; address?: Employee['personalInfo']['address']; emergencyContact?: Employee['personalInfo']['emergencyContact']; bankInfo?: Employee['bankInfo'] }, requiresApproval: boolean) => void;
  updateFicaRecord: (employeeId: string, updates: Partial<FicaComplianceRecord>) => void;
  verifyFicaRequirement: (employeeId: string, requirementId: string, status: 'compliant' | 'rejected', notes?: string, expiryDate?: string, officerName?: string) => void;
  submitFicaRequirementDocument: (employeeId: string, requirementType: FicaRequirement['type'], docData: { name: string; fileData?: string; type: string; size: number }) => void;
  getEmployeesByDepartment: (departmentName: string) => Employee[];
  getLeaveRequestsByEmployee: (employeeId: string) => LeaveRequest[];
  getLeaveBalance: (employeeId: string, leaveTypeId: string) => LeaveBalance | undefined;
  getPendingProfileChangeRequests: () => ProfileChangeRequest[];
  getNotificationsByUser: (userId: string) => Notification[];
  getUnreadNotificationCount: (userId: string) => number;
  getDocumentsByEmployee: (employeeId: string) => Document[];
  getFicaRecordByEmployee: (employeeId: string) => FicaComplianceRecord | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Default data
const defaultDepartments: Department[] = [
  {
    id: '1',
    name: 'Human Resources',
    description: 'Manages employee relations and policies',
    employeeCount: 5,
    maxLeavePerDay: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Engineering',
    description: 'Software development and technical operations',
    employeeCount: 25,
    maxLeavePerDay: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Marketing',
    description: 'Brand promotion and customer acquisition',
    employeeCount: 8,
    maxLeavePerDay: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Finance',
    description: 'Financial planning, accounting, and compliance',
    employeeCount: 6,
    maxLeavePerDay: 2,
    createdAt: new Date().toISOString(),
  },
];

const defaultLeaveTypes: LeaveType[] = [
  {
    id: '1',
    name: 'Annual Leave',
    allowance: 25,
    carryOver: true,
    carryOverLimit: 5,
    accrualRate: 2.08,
    description: 'Yearly vacation allowance',
    requiresApproval: true,
    maxConsecutiveDays: 10,
  },
  {
    id: '2',
    name: 'Sick Leave',
    allowance: 10,
    carryOver: false,
    accrualRate: 0.83,
    description: 'Medical leave for illness',
    requiresApproval: true,
    maxConsecutiveDays: 5,
  },
  {
    id: '3',
    name: 'Personal Leave',
    allowance: 5,
    carryOver: false,
    accrualRate: 0.42,
    description: 'Personal time off',
    requiresApproval: true,
    maxConsecutiveDays: 3,
  },
];

const defaultEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      phone: '+1-555-0123',
      dateOfBirth: '1990-05-15',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+1-555-0124',
      },
    },
    jobInfo: {
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      reportingManager: 'Alice Johnson',
      employmentStatus: 'active',
      hireDate: '2022-01-15',
      workLocation: 'New York Office',
      employmentType: 'full_time',
      salary: 85000,
    },
    jobHistory: [
      {
        id: '1',
        company: 'Tech Startup Inc.',
        position: 'Junior Developer',
        startDate: '2020-06-01',
        endDate: '2021-12-31',
        description: 'Developed web applications using React and Node.js',
        reasonForLeaving: 'Career advancement'
      }
    ],
    qualifications: [
      {
        id: '1',
        name: 'Bachelor of Computer Science',
        institution: 'State University',
        dateObtained: '2020-05-15',
        verified: true
      }
    ],
    documents: [],
    vettingStatus: {
      backgroundCheckCompleted: true,
      backgroundCheckDate: '2022-01-10',
      policeRecordCheck: true,
      policeRecordDate: '2022-01-10',
      referenceChecks: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    employeeId: 'EMP002',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    personalInfo: {
      firstName: 'Sarah',
      lastName: 'Smith',
      email: 'sarah.smith@company.com',
      phone: '+1-555-0125',
      dateOfBirth: '1988-08-22',
      address: {
        street: '456 Oak Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA',
      },
      emergencyContact: {
        name: 'Mike Smith',
        relationship: 'Spouse',
        phone: '+1-555-0126',
      },
    },
    jobInfo: {
      jobTitle: 'HR Manager',
      department: 'Human Resources',
      reportingManager: 'CEO',
      employmentStatus: 'active',
      hireDate: '2021-03-10',
      workLocation: 'New York Office',
      employmentType: 'full_time',
      salary: 75000,
    },
    jobHistory: [
      {
        id: '1',
        company: 'Previous Corp',
        position: 'HR Specialist',
        startDate: '2019-01-01',
        endDate: '2021-02-28',
        description: 'Managed recruitment and employee relations',
        reasonForLeaving: 'Better opportunity'
      }
    ],
    qualifications: [
      {
        id: '1',
        name: 'Master of Human Resources',
        institution: 'Business School',
        dateObtained: '2018-12-15',
        verified: true
      }
    ],
    documents: [],
    vettingStatus: {
      backgroundCheckCompleted: true,
      backgroundCheckDate: '2021-03-05',
      policeRecordCheck: true,
      policeRecordDate: '2021-03-05',
      referenceChecks: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultDocuments: Document[] = [
  {
    id: 'doc-1',
    employeeId: '1',
    name: 'Bachelor of Computer Science Degree',
    fileName: 'JohnDoe_BSc_Degree_Certificate.pdf',
    type: 'application/pdf',
    size: 2450000,
    uploadDate: '2022-01-16T10:00:00Z',
    category: 'qualification',
    uploadedBy: 'John Doe',
    isConfidential: false,
    accessLevel: 'employee_and_hr',
    verificationStatus: 'verified',
    verifiedBy: 'Sarah Smith (HR)',
    verifiedAt: '2022-01-18T14:20:00Z',
    verificationNotes: 'Official university transcripts and degree certificate confirmed.'
  },
  {
    id: 'doc-2',
    employeeId: '1',
    name: 'AWS Solutions Architect Certificate',
    fileName: 'AWS_Solutions_Architect_Certificate.pdf',
    type: 'application/pdf',
    size: 1820000,
    uploadDate: '2024-02-12T09:30:00Z',
    category: 'certification',
    uploadedBy: 'John Doe',
    isConfidential: false,
    accessLevel: 'employee_and_hr',
    verificationStatus: 'verified',
    verifiedBy: 'Sarah Smith (HR)',
    verifiedAt: '2024-02-14T11:00:00Z',
    expiryDate: '2027-02-10'
  },
  {
    id: 'doc-3',
    employeeId: '1',
    name: 'Official Employee Profile Photo',
    fileName: 'john_doe_headshot_2026.png',
    type: 'image/png',
    size: 980000,
    uploadDate: '2026-01-10T12:00:00Z',
    category: 'photo',
    uploadedBy: 'John Doe',
    isConfidential: false,
    accessLevel: 'public',
    verificationStatus: 'verified',
    fileData: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'doc-4',
    employeeId: '1',
    name: 'National Passport / ID Document (FICA Verified)',
    fileName: 'JohnDoe_National_ID_Passport.pdf',
    type: 'application/pdf',
    size: 3100000,
    uploadDate: '2026-01-10T11:15:00Z',
    category: 'fica_id',
    uploadedBy: 'John Doe',
    isConfidential: true,
    accessLevel: 'hr_only',
    verificationStatus: 'verified',
    verifiedBy: 'Compliance Officer (M. Venter)',
    verifiedAt: '2026-01-12T16:00:00Z',
    expiryDate: '2030-05-20',
    verificationNotes: 'Certified copy matches Department of Home Affairs records.'
  },
  {
    id: 'doc-5',
    employeeId: '1',
    name: 'FICA Proof of Residential Address (Utility Statement)',
    fileName: 'UtilityBill_ProofOfAddress_Oct2026.pdf',
    type: 'application/pdf',
    size: 1450000,
    uploadDate: '2026-10-15T08:00:00Z',
    category: 'fica_proof_of_address',
    uploadedBy: 'John Doe',
    isConfidential: true,
    accessLevel: 'hr_only',
    verificationStatus: 'verified',
    verifiedBy: 'Compliance Officer (M. Venter)',
    verifiedAt: '2026-10-16T10:30:00Z',
    expiryDate: '2027-01-15',
    verificationNotes: 'Statement dated within last 3 months (strictly under 90 days required by FICA).'
  },
  {
    id: 'doc-6',
    employeeId: '1',
    name: 'Stamped Bank Account Confirmation Letter',
    fileName: 'FNB_BankConfirmation_Letter.pdf',
    type: 'application/pdf',
    size: 890000,
    uploadDate: '2026-01-12T14:00:00Z',
    category: 'fica_bank_statement',
    uploadedBy: 'John Doe',
    isConfidential: true,
    accessLevel: 'hr_only',
    verificationStatus: 'verified',
    verifiedBy: 'Sarah Smith (HR)',
    verifiedAt: '2026-01-13T09:00:00Z',
    verificationNotes: 'Official bank stamp verified; matches payroll direct deposit.'
  },
  {
    id: 'doc-7',
    employeeId: '2',
    name: 'Master of Human Resource Management Diploma',
    fileName: 'SarahSmith_MHR_Degree.pdf',
    type: 'application/pdf',
    size: 2750000,
    uploadDate: '2021-03-12T09:00:00Z',
    category: 'qualification',
    uploadedBy: 'Sarah Smith',
    isConfidential: false,
    accessLevel: 'employee_and_hr',
    verificationStatus: 'verified',
    verifiedBy: 'Admin User',
    verifiedAt: '2021-03-14T11:00:00Z'
  },
  {
    id: 'doc-8',
    employeeId: '2',
    name: 'SHRM-CP Professional Human Resources Credential',
    fileName: 'SHRM_Certified_Professional_Badge.pdf',
    type: 'application/pdf',
    size: 1620000,
    uploadDate: '2023-04-14T10:00:00Z',
    category: 'certification',
    uploadedBy: 'Sarah Smith',
    isConfidential: false,
    accessLevel: 'public',
    verificationStatus: 'verified',
    expiryDate: '2026-04-12'
  },
  {
    id: 'doc-9',
    employeeId: '2',
    name: 'Sarah Smith Professional Profile Photo',
    fileName: 'sarah_smith_headshot.jpg',
    type: 'image/jpeg',
    size: 1100000,
    uploadDate: '2025-06-01T08:00:00Z',
    category: 'photo',
    uploadedBy: 'Sarah Smith',
    isConfidential: false,
    accessLevel: 'public',
    verificationStatus: 'verified',
    fileData: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'doc-10',
    employeeId: '2',
    name: 'Smart National ID Card (FICA Compliance)',
    fileName: 'SarahSmith_SmartID_Card.pdf',
    type: 'application/pdf',
    size: 2200000,
    uploadDate: '2026-02-10T09:00:00Z',
    category: 'fica_id',
    uploadedBy: 'Sarah Smith',
    isConfidential: true,
    accessLevel: 'hr_only',
    verificationStatus: 'verified',
    verifiedBy: 'Compliance Officer (M. Venter)',
    verifiedAt: '2026-02-12T14:00:00Z'
  },
  {
    id: 'doc-11',
    employeeId: '2',
    name: 'Municipal Rates & Taxes Statement (Proof of Address)',
    fileName: 'Municipal_Rates_Account_Oct2026.pdf',
    type: 'application/pdf',
    size: 1350000,
    uploadDate: '2026-10-20T11:00:00Z',
    category: 'fica_proof_of_address',
    uploadedBy: 'Sarah Smith',
    isConfidential: true,
    accessLevel: 'hr_only',
    verificationStatus: 'verified',
    verifiedBy: 'Compliance Officer (M. Venter)',
    verifiedAt: '2026-10-21T15:00:00Z',
    expiryDate: '2027-01-20',
    verificationNotes: 'Fresh municipal rates statement; 88 days validity remaining.'
  },
  {
    id: 'doc-sign-1',
    employeeId: '1',
    name: 'Annual Corporate Code of Conduct & Ethics Sign-Off (2026)',
    fileName: 'Code_of_Conduct_Acknowledgment_2026.pdf',
    type: 'application/pdf',
    size: 540000,
    uploadDate: '2026-10-01T09:00:00Z',
    category: 'policy',
    uploadedBy: 'Compliance Department',
    isConfidential: false,
    accessLevel: 'employee_and_hr',
    verificationStatus: 'pending',
    requiresSignature: true
  },
  {
    id: 'doc-sign-2',
    employeeId: '1',
    name: 'Information Security, Remote Work & Confidentiality Agreement',
    fileName: 'InfoSec_RemoteWork_Agreement.pdf',
    type: 'application/pdf',
    size: 780000,
    uploadDate: '2026-10-15T11:00:00Z',
    category: 'contract',
    uploadedBy: 'IT Security Operations',
    isConfidential: true,
    accessLevel: 'employee_and_hr',
    verificationStatus: 'pending',
    requiresSignature: true
  },
  {
    id: 'doc-sign-3',
    employeeId: '1',
    name: 'FICA Statutory PEP & Sanctions Screening Self-Declaration',
    fileName: 'FICA_PEP_Declaration_2026.pdf',
    type: 'application/pdf',
    size: 420000,
    uploadDate: '2026-01-12T14:30:00Z',
    category: 'fica_id',
    uploadedBy: 'Compliance Office',
    isConfidential: true,
    accessLevel: 'employee_and_hr',
    verificationStatus: 'verified',
    requiresSignature: true,
    signature: {
      signed: true,
      signedByName: 'John Doe',
      signedAt: '2026-01-12T14:35:00Z',
      signatureType: 'digital_acceptance'
    }
  }
];

const defaultPerformanceReviews: PerformanceReview[] = [
  {
    id: 'pr-oct-2026',
    employeeId: '1',
    reviewType: 'monthly',
    cycleName: 'October 2026 Monthly Performance Sprint',
    reviewPeriod: {
      startDate: '2026-10-01',
      endDate: '2026-10-31'
    },
    status: 'employee_submitted',
    overallScore: 4.5,
    goals: [
      {
        id: 'g-m1',
        title: 'Deliver Row-Level Security & Context Isolation',
        description: 'Ensure employee profile data is scoped strictly to the employee persona, redacting sensitive salary & PII.',
        targetDate: '2026-10-25',
        status: 'completed',
        progress: 100,
        weight: 40,
        measurableOutcomes: ['Scoped employee views', 'Verified manager hierarchy filtering'],
        selfScore: 5,
        selfComments: 'Implemented strict role-based views. Sensitive fields hidden from unprivileged viewers.',
        managerScore: 5,
        managerComments: 'Exceptional attention to privacy and enterprise authorization.'
      },
      {
        id: 'g-m2',
        title: 'Employee Self-Service Review & Sign Workflow',
        description: 'Enable employees to review policies, sign agreements electronically, and submit profile changes with automated approval tracking.',
        targetDate: '2026-10-30',
        status: 'completed',
        progress: 100,
        weight: 35,
        measurableOutcomes: ['Electronic signature audit log', 'Profile change approval workflow'],
        selfScore: 4,
        selfComments: 'Completed document signing and request submission components.',
        managerScore: 4,
        managerComments: 'Clean UX and responsive modal forms.'
      },
      {
        id: 'g-m3',
        title: 'Monthly Sprint Code Reviews & Mentorship',
        description: 'Participate actively in peer pull request reviews and mentor junior developers.',
        targetDate: '2026-10-31',
        status: 'completed',
        progress: 90,
        weight: 25,
        measurableOutcomes: ['Reviewed 15+ PRs', 'Zero blocker bugs introduced'],
        selfScore: 4,
        selfComments: 'Conducted regular architecture reviews and pair-programming sessions.',
        managerScore: 4,
        managerComments: 'Consistently helpful and thorough in technical feedback.'
      }
    ],
    competencies: [
      {
        competencyId: 'comp-1',
        name: 'Technical & Role Competency',
        category: 'Execution',
        description: 'Job knowledge, code quality, TypeScript precision, architectural scalability.',
        currentLevel: 4,
        targetLevel: 5,
        selfRating: 5,
        selfComments: 'Applied clean React patterns and maintained strict TypeScript compliance.',
        supervisorRating: 5,
        supervisorComments: 'Very high code standard; zero lint or compile errors.',
        developmentActions: ['Explore GraphQL / pgvector advanced indexing']
      },
      {
        competencyId: 'comp-2',
        name: 'Collaboration & Communication',
        category: 'Teamwork',
        description: 'Effective cross-team alignment, active listening, transparent sprint communication.',
        currentLevel: 4,
        targetLevel: 4,
        selfRating: 4,
        selfComments: 'Communicated daily sprint progress and coordinated with HR and managers.',
        supervisorRating: 4,
        supervisorComments: 'Proactive communicator; always dependable.',
        developmentActions: ['Lead monthly technical brown-bag session']
      },
      {
        competencyId: 'comp-3',
        name: 'Problem Solving & Innovation',
        category: 'Initiative',
        description: 'Analytical depth, innovative architectural solutions, resolving blockers independently.',
        currentLevel: 4,
        targetLevel: 5,
        selfRating: 4,
        selfComments: 'Engineered multi-tier approval routing and immutable diff audits.',
        supervisorRating: 5,
        supervisorComments: 'Quickly solves edge cases and complex user authorization rules.',
        developmentActions: ['Document architectural decision records (ADRs)']
      },
      {
        competencyId: 'comp-4',
        name: 'Accountability & Delivery',
        category: 'Execution',
        description: 'Delivering sprint commitments on time, taking ownership, maintaining high reliability.',
        currentLevel: 5,
        targetLevel: 5,
        selfRating: 5,
        selfComments: 'All sprint deliverables achieved prior to deadline.',
        supervisorRating: 5,
        supervisorComments: 'Reliable and punctual with all commitments.',
        developmentActions: ['Maintain consistent sprint velocity']
      },
      {
        competencyId: 'comp-5',
        name: 'Ethics, Security & Compliance',
        category: 'Governance',
        description: 'Strict adherence to statutory FICA regulations, data privacy, and corporate ethics.',
        currentLevel: 5,
        targetLevel: 5,
        selfRating: 5,
        selfComments: 'All security policies and compliance audits reviewed and signed.',
        supervisorRating: 5,
        supervisorComments: 'Exemplary compliance record and adherence to security guidelines.',
        developmentActions: ['Participate in annual ISO audit committee']
      }
    ],
    selfAssessment: {
      ratings: [],
      overallComments: 'Proud of our October progress in refining employee self-service and row-level security.',
      strengths: ['Architecture design', 'Independent problem solving', 'Security-first mindset'],
      areasForImprovement: ['More automated E2E test coverage'],
      submittedAt: '2026-10-31T17:30:00Z'
    },
    employeeSignature: {
      signed: true,
      signedByName: 'John Doe',
      signedAt: '2026-10-31T17:35:00Z'
    },
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-31T17:35:00Z'
  },
  {
    id: 'pr-q3-2026',
    employeeId: '1',
    reviewType: 'quarterly',
    cycleName: 'Q3 2026 Quarterly Performance Review',
    reviewPeriod: {
      startDate: '2026-07-01',
      endDate: '2026-09-30'
    },
    status: 'completed',
    overallScore: 4.7,
    goals: [
      {
        id: 'g-q3-1',
        title: 'Core HR & Personnel Management Foundation',
        description: 'Build core employee registry, document vault, and organizational hierarchy.',
        targetDate: '2026-08-31',
        status: 'completed',
        progress: 100,
        weight: 50,
        measurableOutcomes: ['Full employee lifecycle statuses', 'Role-based access'],
        selfScore: 5,
        selfComments: 'All core models and storage established.',
        managerScore: 5,
        managerComments: 'Great work executing on the initial platform requirements.'
      },
      {
        id: 'g-q3-2',
        title: 'Time & Attendance Module with Geofencing',
        description: 'Implement check-in/out, shift rules, and timesheet logs.',
        targetDate: '2026-09-30',
        status: 'completed',
        progress: 100,
        weight: 50,
        measurableOutcomes: ['Daily muster report', 'Payroll-ready export integration'],
        selfScore: 4,
        selfComments: 'Integrated payroll reconciliation and attendance tracking.',
        managerScore: 4,
        managerComments: 'Solid execution. Attendance logs are robust.'
      }
    ],
    competencies: [
      {
        competencyId: 'comp-1',
        name: 'Technical & Role Competency',
        category: 'Execution',
        currentLevel: 4,
        targetLevel: 5,
        selfRating: 5,
        supervisorRating: 5,
        developmentActions: []
      },
      {
        competencyId: 'comp-2',
        name: 'Collaboration & Communication',
        category: 'Teamwork',
        currentLevel: 4,
        targetLevel: 4,
        selfRating: 4,
        supervisorRating: 4,
        developmentActions: []
      },
      {
        competencyId: 'comp-3',
        name: 'Problem Solving & Innovation',
        category: 'Initiative',
        currentLevel: 5,
        targetLevel: 5,
        selfRating: 5,
        supervisorRating: 5,
        developmentActions: []
      },
      {
        competencyId: 'comp-4',
        name: 'Accountability & Delivery',
        category: 'Execution',
        currentLevel: 5,
        targetLevel: 5,
        selfRating: 5,
        supervisorRating: 5,
        developmentActions: []
      },
      {
        competencyId: 'comp-5',
        name: 'Ethics, Security & Compliance',
        category: 'Governance',
        currentLevel: 5,
        targetLevel: 5,
        selfRating: 5,
        supervisorRating: 5,
        developmentActions: []
      }
    ],
    selfAssessment: {
      ratings: [],
      overallComments: 'High impact quarter building foundational enterprise modules.',
      strengths: ['Speed of execution', 'Code reliability'],
      areasForImprovement: ['Refining manager delegation flows'],
      submittedAt: '2026-09-28T16:00:00Z'
    },
    supervisorAssessment: {
      ratings: [],
      overallComments: 'Outstanding quarterly performance. Demonstrated clear readiness for senior technical leadership.',
      strengths: ['Architectural clarity', 'Team reliability'],
      areasForImprovement: ['Lead larger multi-team initiatives'],
      submittedAt: '2026-10-02T10:00:00Z'
    },
    employeeSignature: {
      signed: true,
      signedByName: 'John Doe',
      signedAt: '2026-09-28T16:05:00Z'
    },
    managerSignature: {
      signed: true,
      signedByName: 'David Chen',
      signedAt: '2026-10-02T10:15:00Z'
    },
    developmentPlan: 'Promote to Tech Lead in Q1 2027; sponsor advanced cloud security training.',
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-10-02T10:15:00Z'
  },
  {
    id: 'pr-annual-2026',
    employeeId: '1',
    reviewType: 'annual',
    cycleName: '2026 Annual Comprehensive Performance & Leadership Review',
    reviewPeriod: {
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    },
    status: 'draft',
    goals: [
      {
        id: 'g-ann-1',
        title: 'Maintain 99.9% Uptime on Core People Operations Platform',
        description: 'Zero critical downtime incidents across payroll, attendance, and employee authentication services.',
        targetDate: '2026-12-31',
        status: 'in_progress',
        progress: 88,
        weight: 35,
        measurableOutcomes: ['SLA uptime targets met', 'Automated health monitoring']
      },
      {
        id: 'g-ann-2',
        title: 'Digital Employee Self-Service Adoption',
        description: 'Drive complete adoption of online profile updates, digital document signing, and leave requests.',
        targetDate: '2026-12-31',
        status: 'in_progress',
        progress: 92,
        weight: 35,
        measurableOutcomes: ['Zero manual paper forms', '100% policy sign-off rate']
      },
      {
        id: 'g-ann-3',
        title: 'Statutory FICA & Security Audit Excellence',
        description: 'Complete all anti-money laundering, PEP screenings, and address verifications with zero non-conformances.',
        targetDate: '2026-12-31',
        status: 'in_progress',
        progress: 95,
        weight: 30,
        measurableOutcomes: ['Passed internal audit with distinction', 'Complete audit log traceability']
      }
    ],
    competencies: [
      {
        competencyId: 'comp-1',
        name: 'Technical & Role Competency',
        category: 'Execution',
        description: 'Mastery of full-stack TypeScript, data modeling, secure API design, and performance tuning.',
        currentLevel: 4,
        targetLevel: 5,
        developmentActions: ['Complete Cloud Architecture master certification']
      },
      {
        competencyId: 'comp-2',
        name: 'Collaboration & Teamwork',
        category: 'Teamwork',
        description: 'Open communication, proactive feedback, helping teammates succeed, and building inclusive culture.',
        currentLevel: 4,
        targetLevel: 5,
        developmentActions: ['Host quarterly engineering showcases']
      },
      {
        competencyId: 'comp-3',
        name: 'Problem Solving & Innovation',
        category: 'Initiative',
        description: 'Identifying systemic challenges, proposing scalable architectures, and navigating ambiguity.',
        currentLevel: 5,
        targetLevel: 5,
        developmentActions: ['Author system architecture guide']
      },
      {
        competencyId: 'comp-4',
        name: 'Accountability & Delivery',
        category: 'Execution',
        description: 'Honoring commitments, delivering high-stakes features on schedule, and taking full ownership.',
        currentLevel: 5,
        targetLevel: 5,
        developmentActions: ['Coach new team members on sprint velocity']
      },
      {
        competencyId: 'comp-5',
        name: 'Leadership, Ethics & Compliance',
        category: 'Governance',
        description: 'Role model for ethical conduct, FICA compliance, and mentoring junior engineers.',
        currentLevel: 5,
        targetLevel: 5,
        developmentActions: ['Join institutional risk & governance working group']
      }
    ],
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

const defaultFicaRecords: FicaComplianceRecord[] = [
  {
    id: 'fica-1',
    employeeId: '1',
    status: 'compliant',
    riskRating: 'low',
    lastAuditedAt: '2026-10-16T10:30:00Z',
    auditedBy: 'Compliance Officer (M. Venter)',
    isPep: false,
    pepDetails: 'Negative declaration signed. No political exposure or public office relationships.',
    sanctionScreeningPassed: true,
    sanctionScreeningDate: '2026-10-16T10:00:00Z',
    complianceOfficerNotes: 'All FICA statutory requirements satisfied for financial institution operations. Utility proof valid until Jan 2027.',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-10-16T10:30:00Z',
    requirements: [
      {
        id: 'req-1-1',
        type: 'id_document',
        title: 'Certified National Identity / Passport',
        description: 'Certified copy of National ID card (both sides) or valid Passport.',
        status: 'compliant',
        documentId: 'doc-4',
        documentName: 'JohnDoe_National_ID_Passport.pdf',
        verifiedBy: 'Compliance Officer (M. Venter)',
        verifiedAt: '2026-01-12T16:00:00Z',
        expiryDate: '2030-05-20',
        notes: 'Identity confirmed via official government verification.'
      },
      {
        id: 'req-1-2',
        type: 'proof_of_address',
        title: 'Proof of Residential Address (< 3 Months Old)',
        description: 'Utility bill, rates tax notice, or formal lease strictly under 90 days old.',
        status: 'compliant',
        documentId: 'doc-5',
        documentName: 'UtilityBill_ProofOfAddress_Oct2026.pdf',
        verifiedBy: 'Compliance Officer (M. Venter)',
        verifiedAt: '2026-10-16T10:30:00Z',
        expiryDate: '2027-01-15',
        notes: 'Utility statement dated within 90 days. Next review scheduled for Jan 2027.'
      },
      {
        id: 'req-1-3',
        type: 'bank_confirmation',
        title: 'Bank Account Confirmation Letter (< 3 Months)',
        description: 'Official bank confirmation letter or stamped statement from registered financial institution.',
        status: 'compliant',
        documentId: 'doc-6',
        documentName: 'FNB_BankConfirmation_Letter.pdf',
        verifiedBy: 'Sarah Smith (HR)',
        verifiedAt: '2026-01-13T09:00:00Z',
        notes: 'Direct deposit bank verification cleared.'
      },
      {
        id: 'req-1-4',
        type: 'tax_number',
        title: 'Official Tax Number Verification (SARS / IRS)',
        description: 'Revenue authority tax registration confirmation notice.',
        status: 'compliant',
        documentName: 'Tax_Registration_Notice.pdf',
        verifiedBy: 'Compliance Officer',
        verifiedAt: '2026-01-12T16:00:00Z',
        notes: 'Tax verification matched to employee personal profile.'
      },
      {
        id: 'req-1-5',
        type: 'pep_declaration',
        title: 'Politically Exposed Person (PEP) Declaration',
        description: 'Statutory self-declaration of public prominence, state procurement links, or political exposure.',
        status: 'compliant',
        verifiedBy: 'Compliance Officer (M. Venter)',
        verifiedAt: '2026-10-16T10:15:00Z',
        notes: 'Clear PEP declaration signed digitally.'
      },
      {
        id: 'req-1-6',
        type: 'criminal_clearance',
        title: 'Criminal Record & Financial Fit-and-Proper Clearance',
        description: 'National police clearance certificate & credit fitness check for regulated roles.',
        status: 'compliant',
        verifiedBy: 'Compliance Officer (M. Venter)',
        verifiedAt: '2026-01-10T12:00:00Z',
        expiryDate: '2027-01-10',
        notes: 'Clean record. FAIS fit and proper criteria fulfilled.'
      }
    ]
  },
  {
    id: 'fica-2',
    employeeId: '2',
    status: 'compliant',
    riskRating: 'low',
    lastAuditedAt: '2026-10-21T15:00:00Z',
    auditedBy: 'Compliance Officer (M. Venter)',
    isPep: false,
    pepDetails: 'Non-PEP confirmed.',
    sanctionScreeningPassed: true,
    sanctionScreeningDate: '2026-10-21T14:30:00Z',
    complianceOfficerNotes: 'All financial institution compliance requirements up to date. Verified proof of address valid until late Jan 2027.',
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-10-21T15:00:00Z',
    requirements: [
      {
        id: 'req-2-1',
        type: 'id_document',
        title: 'Certified National Identity / Passport',
        description: 'Certified copy of National ID card or Passport.',
        status: 'compliant',
        documentId: 'doc-10',
        documentName: 'SarahSmith_SmartID_Card.pdf',
        verifiedBy: 'Compliance Officer (M. Venter)',
        verifiedAt: '2026-02-12T14:00:00Z',
        notes: 'Smart ID card verified.'
      },
      {
        id: 'req-2-2',
        type: 'proof_of_address',
        title: 'Proof of Residential Address (< 3 Months Old)',
        description: 'Utility bill, rates tax notice, or formal lease under 90 days old.',
        status: 'compliant',
        documentId: 'doc-11',
        documentName: 'Municipal_Rates_Account_Oct2026.pdf',
        verifiedBy: 'Compliance Officer (M. Venter)',
        verifiedAt: '2026-10-21T15:00:00Z',
        expiryDate: '2027-01-20',
        notes: 'Valid municipal bill provided.'
      },
      {
        id: 'req-2-3',
        type: 'bank_confirmation',
        title: 'Bank Account Confirmation Letter (< 3 Months)',
        description: 'Official bank confirmation letter or stamped statement from registered bank.',
        status: 'compliant',
        documentName: 'StandardBank_Confirmation.pdf',
        verifiedBy: 'Compliance Officer',
        verifiedAt: '2026-02-12T14:30:00Z',
        notes: 'Corporate payroll account verified.'
      },
      {
        id: 'req-2-4',
        type: 'tax_number',
        title: 'Official Tax Number Verification (SARS / IRS)',
        description: 'Revenue authority tax registration confirmation notice.',
        status: 'compliant',
        documentName: 'SARS_Notice_of_Registration.pdf',
        verifiedBy: 'Compliance Officer',
        verifiedAt: '2026-02-12T14:30:00Z',
        notes: 'Tax number verified on SARS eFiling system.'
      },
      {
        id: 'req-2-5',
        type: 'pep_declaration',
        title: 'Politically Exposed Person (PEP) Declaration',
        description: 'Statutory self-declaration of political exposure or public prominence.',
        status: 'compliant',
        verifiedBy: 'Compliance Officer (M. Venter)',
        verifiedAt: '2026-10-21T14:45:00Z',
        notes: 'Signed PEP questionnaire on file.'
      },
      {
        id: 'req-2-6',
        type: 'criminal_clearance',
        title: 'Criminal Record & Financial Fit-and-Proper Clearance',
        description: 'Police clearance certificate & credit fitness check.',
        status: 'compliant',
        verifiedBy: 'Compliance Officer (M. Venter)',
        verifiedAt: '2026-02-10T11:00:00Z',
        expiryDate: '2027-02-10',
        notes: 'Clean record.'
      }
    ]
  }
];

const defaultLeaveBalances: LeaveBalance[] = [
  { employeeId: '1', leaveTypeId: '1', allocated: 25, used: 5, pending: 2, available: 18, carriedForward: 0, year: 2026 },
  { employeeId: '1', leaveTypeId: '2', allocated: 10, used: 2, pending: 0, available: 8, carriedForward: 0, year: 2026 },
  { employeeId: '1', leaveTypeId: '3', allocated: 5, used: 1, pending: 0, available: 4, carriedForward: 0, year: 2026 },
  { employeeId: '2', leaveTypeId: '1', allocated: 25, used: 7, pending: 0, available: 18, carriedForward: 2, year: 2026 },
  { employeeId: '2', leaveTypeId: '2', allocated: 10, used: 1, pending: 0, available: 9, carriedForward: 0, year: 2026 },
  { employeeId: '2', leaveTypeId: '3', allocated: 5, used: 0, pending: 0, available: 5, carriedForward: 0, year: 2026 },
];

const defaultAttendance: AttendanceRecord[] = [
  { id: 'att-1', employeeId: '1', date: new Date().toISOString().split('T')[0], clockIn: '08:55 AM', clockOut: '05:05 PM', status: 'present', workingHours: 8.1, notes: 'On-time' },
  { id: 'att-2', employeeId: '2', date: new Date().toISOString().split('T')[0], clockIn: '09:02 AM', clockOut: '05:15 PM', status: 'present', workingHours: 8.2, notes: 'On-time' },
  { id: 'att-3', employeeId: '1', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], clockIn: '09:15 AM', clockOut: '05:30 PM', status: 'late', workingHours: 8.25, notes: 'Transit delay' },
  { id: 'att-4', employeeId: '2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], clockIn: '08:50 AM', clockOut: '05:00 PM', status: 'present', workingHours: 8.1, notes: 'On-time' },
];

const defaultTimesheets: TimesheetRecord[] = [
  {
    id: 'ts-1',
    employeeId: '1',
    weekStartDate: '2026-10-26',
    weekEndDate: '2026-10-30',
    entries: [
      { id: 'e1', day: 'Monday', date: '2026-10-26', project: 'HR Platform Core', task: 'Employee directory API & UI', hours: 8 },
      { id: 'e2', day: 'Tuesday', date: '2026-10-27', project: 'HR Platform Core', task: 'Leave balances & approval flow', hours: 8 },
      { id: 'e3', day: 'Wednesday', date: '2026-10-28', project: 'Internal Tools', task: 'Attendance & time punch module', hours: 8 },
      { id: 'e4', day: 'Thursday', date: '2026-10-29', project: 'Security Audit', task: 'RBAC verification & tests', hours: 8 },
      { id: 'e5', day: 'Friday', date: '2026-10-30', project: 'Support & Ops', task: 'Code review and release', hours: 8 },
    ],
    totalHours: 40,
    status: 'submitted',
    submittedAt: '2026-10-28T10:00:00Z',
    comments: 'All weekly sprint objectives completed on schedule.'
  }
];

const defaultGoals: GoalRecord[] = [
  {
    id: 'g-1',
    category: 'company',
    title: 'Scale Digital HR Self-Service to 100% of Staff',
    description: 'Empower all employees to submit profile changes, leave requests, and training enrollments digitally with automated workflows.',
    targetDate: '2026-12-31',
    status: 'in_progress',
    progress: 75,
    measurableOutcomes: ['Complete employee portal roll-out', 'Reduce HR administrative processing time by 40%', 'Achieve 95%+ employee satisfaction score']
  },
  {
    id: 'g-2',
    department: 'Engineering',
    category: 'department',
    title: 'Zero High-Severity Security Findings in Q4',
    description: 'Enforce strict access control, audit logs, and SOC-2 compliant policies across all internal systems.',
    targetDate: '2026-11-30',
    status: 'in_progress',
    progress: 85,
    measurableOutcomes: ['Quarterly penetration testing passed', 'All staff completed cybersecurity course', 'Enforce multi-factor and session timeouts']
  },
  {
    id: 'g-3',
    employeeId: '1',
    category: 'individual',
    title: 'Complete Cloud Architecture Certification',
    description: 'Advance technical leadership capability through professional cloud certification and scalable system design.',
    targetDate: '2026-11-15',
    status: 'in_progress',
    progress: 90,
    measurableOutcomes: ['Score above 85% on practice exams', 'Present architecture brown-bag to team']
  },
  {
    id: 'g-4',
    employeeId: '2',
    category: 'individual',
    title: 'Modernize Employee Performance Review Cadence',
    description: 'Shift from static annual reviews to continuous quarterly feedback and objective tracking.',
    targetDate: '2026-12-15',
    status: 'completed',
    progress: 100,
    measurableOutcomes: ['Draft review guidelines', 'Conduct manager training sessions', 'Collect initial feedback from pilot department']
  }
];

const defaultTrainingCourses: TrainingCourse[] = [
  {
    id: 'c-1',
    code: 'SEC-101',
    title: 'Information Security & Data Privacy',
    category: 'Compliance',
    instructor: 'IT Security Team',
    durationHours: 4,
    description: 'Essential practices for handling personnel data, confidentiality, password management, and phishing prevention.',
    status: 'in_progress',
    enrolledEmployeeIds: ['1', '2'],
    completionRate: 65,
    materials: [
      {
        id: 'mat-1-1',
        title: 'Video Lecture: Enterprise Cybersecurity & Phishing Defense',
        type: 'video',
        urlOrData: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        durationMinutes: 22,
        description: 'Comprehensive overview of social engineering attacks, credential safety, and reportable suspicious activities.',
        uploadedAt: '2026-02-01T10:00:00Z',
        isRequired: true
      },
      {
        id: 'mat-1-2',
        title: 'PDF Guide: SOC-2 Information Security Policy & Data Classification',
        type: 'pdf',
        urlOrData: '#soc2-handbook-pdf',
        fileName: 'SOC2_Security_Classification_Manual_v4.pdf',
        fileSize: '2.4 MB',
        description: 'Mandatory reading on handling Confidential vs Public records, customer PII encryption, and access controls.',
        uploadedAt: '2026-02-01T10:15:00Z',
        isRequired: true
      },
      {
        id: 'mat-1-3',
        title: 'PPT Presentation: Incident Response & Escalation Framework',
        type: 'ppt',
        urlOrData: '#incident-slides-ppt',
        fileName: 'Incident_Response_Executive_Brief.pptx',
        fileSize: '4.8 MB',
        description: 'Slides outlining the 5-stage triage workflow, emergency breach notifications, and leadership chain of command.',
        uploadedAt: '2026-02-01T10:30:00Z',
        isRequired: false
      }
    ]
  },
  {
    id: 'c-2',
    code: 'FIN-301',
    title: 'Financial Institutions AML, FICA & Sanctions Compliance',
    category: 'Compliance',
    instructor: 'Chief Compliance Officer',
    durationHours: 6,
    description: 'Statutory compliance for financial services personnel under the Financial Intelligence Centre Act (FICA), Anti-Money Laundering (AML), and Counter-Terrorist Financing.',
    status: 'in_progress',
    enrolledEmployeeIds: ['1', '2'],
    completionRate: 50,
    materials: [
      {
        id: 'mat-2-1',
        title: 'Video: FICA & Customer Due Diligence (CDD) in Banking',
        type: 'video',
        urlOrData: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        durationMinutes: 28,
        description: 'Detailed analysis of verifying client identities, detecting Politically Exposed Persons (PEPs), and reporting Suspicious Transaction Reports (STRs).',
        uploadedAt: '2026-03-01T09:00:00Z',
        isRequired: true
      },
      {
        id: 'mat-2-2',
        title: 'PDF: Statutory FICA Compliance & Verification Handbook',
        type: 'pdf',
        urlOrData: '#fica-compliance-handbook',
        fileName: 'FICA_Institutional_Compliance_Manual_2026.pdf',
        fileSize: '3.6 MB',
        description: 'Official guidelines covering proof of address 90-day validity, certified ID inspections, and sanction screening obligations.',
        uploadedAt: '2026-03-01T09:30:00Z',
        isRequired: true
      },
      {
        id: 'mat-2-3',
        title: 'PPT: Recognizing Money Laundering Red Flags in Transactions',
        type: 'ppt',
        urlOrData: '#aml-redflags-ppt',
        fileName: 'AML_Red_Flags_and_Audit_Protocols.pptx',
        fileSize: '5.2 MB',
        description: 'Interactive slide deck illustrating structuring, smurfing, shell companies, and high-risk jurisdictions.',
        uploadedAt: '2026-03-01T10:00:00Z',
        isRequired: true
      }
    ]
  },
  {
    id: 'c-3',
    code: 'MGT-201',
    title: 'HR Leadership & Conflict Resolution',
    category: 'Management',
    instructor: 'People Operations Lead',
    durationHours: 8,
    description: 'Techniques for modern team management, active listening, constructive feedback, and workplace harmony.',
    status: 'upcoming',
    enrolledEmployeeIds: ['2'],
    completionRate: 20,
    materials: [
      {
        id: 'mat-3-1',
        title: 'Video: Empathetic Leadership in High-Performing Teams',
        type: 'video',
        urlOrData: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        durationMinutes: 32,
        description: 'Practical approaches to 1-on-1 coaching, de-escalation, and inclusive communication.',
        uploadedAt: '2026-02-15T11:00:00Z',
        isRequired: true
      },
      {
        id: 'mat-3-2',
        title: 'PPT Presentation: Conflict Resolution Matrix & Manager Playbook',
        type: 'ppt',
        urlOrData: '#conflict-playbook-ppt',
        fileName: 'Conflict_Resolution_Playbook.pptx',
        fileSize: '4.1 MB',
        description: 'Step-by-step facilitation guide for navigating team grievances constructively.',
        uploadedAt: '2026-02-15T11:30:00Z',
        isRequired: false
      }
    ]
  },
  {
    id: 'c-4',
    code: 'SAF-100',
    title: 'Workplace Safety & Ergonomics',
    category: 'Health & Safety',
    instructor: 'Facilities Team',
    durationHours: 2,
    description: 'Ergonomic workstation setup, emergency evacuation protocols, and physical wellness.',
    status: 'completed',
    enrolledEmployeeIds: ['1', '2'],
    completionRate: 100,
    materials: [
      {
        id: 'mat-4-1',
        title: 'PDF: Ergonomic Workstation Optimization & Posture Guide',
        type: 'pdf',
        urlOrData: '#ergonomics-pdf',
        fileName: 'Workstation_Ergonomics_Guide.pdf',
        fileSize: '1.8 MB',
        description: 'Adjusting chair heights, display monitor angles, and keyboard placement for optimal musculoskeletal health.',
        uploadedAt: '2026-01-20T08:00:00Z',
        isRequired: true
      }
    ]
  }
];

const defaultCertifications: CertificationRecord[] = [
  {
    id: 'cert-1',
    employeeId: '2',
    name: 'SHRM-CP (Certified Professional)',
    issuingOrganization: 'Society for Human Resource Management',
    issueDate: '2023-04-12',
    expiryDate: '2026-04-12',
    credentialId: 'SHRM-994821',
    status: 'active'
  },
  {
    id: 'cert-2',
    employeeId: '1',
    name: 'AWS Certified Solutions Architect',
    issuingOrganization: 'Amazon Web Services',
    issueDate: '2024-02-10',
    expiryDate: '2027-02-10',
    credentialId: 'AWS-ARCH-88219',
    status: 'active'
  }
];

const defaultJobPostings: JobPosting[] = [
  {
    id: 'jp-1',
    title: 'Senior Software Engineer (Full Stack)',
    departmentId: '2',
    positionId: 'pos-1',
    description: 'We are looking for an experienced full-stack engineer to lead core application architecture and mentor team members.',
    requirements: ['5+ years React and TypeScript experience', 'Solid understanding of REST & SQL databases', 'Strong communication skills'],
    responsibilities: ['Architect scalable services', 'Review code and guide juniors', 'Collaborate with product and design'],
    salaryRange: { min: 125000, max: 155000 },
    applicationDeadline: '2026-11-30',
    status: 'published',
    postedBy: 'Sarah Smith',
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z',
  },
  {
    id: 'jp-2',
    title: 'HR Talent Acquisition Specialist',
    departmentId: '1',
    positionId: 'pos-2',
    description: 'Drive high-volume recruiting, coordinate technical screenings, and provide seamless onboarding experiences.',
    requirements: ['3+ years in tech recruiting', 'Experience with modern ATS platforms', 'Great interpersonal abilities'],
    responsibilities: ['Source qualified candidates', 'Coordinate interviews with hiring managers', 'Lead new hire welcome cohorts'],
    salaryRange: { min: 72000, max: 88000 },
    applicationDeadline: '2026-11-20',
    status: 'published',
    postedBy: 'Sarah Smith',
    createdAt: '2026-10-18T11:00:00Z',
    updatedAt: '2026-10-18T11:00:00Z',
  }
];

const defaultCareerMovements: CareerMovement[] = [
  {
    id: 'cm-1',
    employeeId: '1',
    movementType: 'promotion',
    fromPosition: { title: 'Junior Developer', department: 'Engineering', level: 1 },
    toPosition: { title: 'Software Engineer', department: 'Engineering', level: 2 },
    effectiveDate: '2023-01-15',
    reason: 'Exceeded performance goals and demonstrated exceptional architectural contributions.',
    approvedBy: 'Alice Johnson',
    salaryChange: { previousSalary: 70000, newSalary: 85000, changePercentage: 21.4 },
    createdAt: '2023-01-10T12:00:00Z'
  }
];

const defaultPolicyDocuments: PolicyDocument[] = [
  {
    id: 'pol-1',
    title: 'Code of Business Conduct & Ethics',
    description: 'Standards for professional integrity, anti-corruption, conflict of interest, and fair competition.',
    category: 'code_of_conduct',
    documentUrl: '#',
    version: '2026.1',
    isRequired: true,
    minimumReadTime: 120,
    effectiveDate: '2026-01-01',
    createdBy: 'HR Department',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'pol-2',
    title: 'Information Security & Data Protection Policy',
    description: 'Mandatory guidelines for safeguarding proprietary company assets, employee records, and customer confidentiality.',
    category: 'confidentiality',
    documentUrl: '#',
    version: '3.0',
    isRequired: true,
    minimumReadTime: 90,
    effectiveDate: '2026-03-01',
    createdBy: 'IT Security',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'pol-3',
    title: 'Equal Opportunity, Anti-Harassment & Diversity Policy',
    description: 'Zero-tolerance policy against discrimination, harassment, and retaliation with clear reporting mechanisms.',
    category: 'safety',
    documentUrl: '#',
    version: '2.4',
    isRequired: true,
    minimumReadTime: 60,
    effectiveDate: '2026-01-15',
    createdBy: 'HR Department',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z'
  }
];

const defaultSystemSettings: SystemSettings = {
  id: 'sys-1',
  companyName: 'VerticalHRM Global Inc.',
  companyAddress: '100 Technology Plaza, Suite 400, New York, NY 10001',
  companyPhone: '+1 (555) 234-5678',
  companyEmail: 'hr@verticalhrm.com',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  workingHours: { start: '09:00', end: '17:00' },
  timeZone: 'America/New_York (EST)',
  dateFormat: 'YYYY-MM-DD',
  currency: 'USD ($)',
  leaveYearStart: '01-01',
  probationPeriod: 3,
  notificationSettings: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
  },
  securitySettings: {
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
  }
};

const defaultTenants: Tenant[] = [
  {
    id: 'tenant-jm-main',
    name: 'Apex Financial Holdings (Kingston HQ)',
    subdomain: 'apex-jm',
    country: 'JM',
    locale: 'en-JM',
    currency: 'JMD',
    currencySymbol: 'J$',
    timezone: 'America/Jamaica',
    fiscalYearStartMonth: 1,
    isActive: true,
    maxEmployees: 500,
    dataRetentionYears: 7
  },
  {
    id: 'tenant-us-intl',
    name: 'Apex Global Financial Inc. (North America)',
    subdomain: 'apex-us',
    country: 'US',
    locale: 'en-US',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/New_York',
    fiscalYearStartMonth: 1,
    isActive: true,
    maxEmployees: 250,
    dataRetentionYears: 7
  }
];

const defaultAuditLogs: AuditLogEntry[] = [
  {
    id: 'aud-001',
    tenantId: 'tenant-jm-main',
    actorId: 'usr-admin-1',
    actorName: 'Marcus Sterling',
    actorRole: 'hr_admin',
    action: 'APPROVE',
    entity: 'FicaRecord',
    entityId: 'fica-1',
    entityDescription: 'Approved FICA 90-day utility proof of address for Marcus Sterling',
    previousValue: 'Status: Pending Verification',
    newValue: 'Status: Compliant (Expires in 85 days)',
    ipAddress: '196.21.144.12',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'aud-002',
    tenantId: 'tenant-jm-main',
    actorId: 'usr-admin-1',
    actorName: 'Marcus Sterling',
    actorRole: 'hr_admin',
    action: 'UPDATE',
    entity: 'Salary',
    entityId: 'emp-2',
    entityDescription: 'Annual merit pay adjustment for Priya Sharma',
    previousValue: 'Salary: $115,000 / JMD',
    newValue: 'Salary: $128,000 / JMD',
    ipAddress: '196.21.144.12',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'aud-003',
    tenantId: 'tenant-jm-main',
    actorId: 'usr-mgr-1',
    actorName: 'Priya Sharma',
    actorRole: 'line_manager',
    action: 'APPROVE',
    entity: 'LeaveRequest',
    entityId: 'leave-102',
    entityDescription: 'Approved 3 days Annual Leave for Thabo Mokoena',
    previousValue: 'Status: Pending Supervisor Approval',
    newValue: 'Status: Supervisor Approved',
    ipAddress: '196.21.144.45',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'aud-004',
    tenantId: 'tenant-jm-main',
    actorId: 'usr-auditor-1',
    actorName: 'Helena Vance',
    actorRole: 'auditor',
    action: 'EXPORT',
    entity: 'FicaRecord',
    entityId: 'report-fica-q4',
    entityDescription: 'Exported Institutional FICA Compliance Audit Certificate Roster',
    newValue: 'Generated Certificate FIC-AUD-2026',
    ipAddress: '196.21.144.98',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

const defaultWorkflowApprovals: WorkflowApprovalItem[] = [
  {
    id: 'wf-101',
    tenantId: 'tenant-jm-main',
    type: 'leave',
    title: 'Annual Vacation Leave (5 Days)',
    requesterId: 'EMP002',
    requesterName: 'Priya Sharma',
    department: 'Engineering',
    currentStep: 1,
    totalSteps: 2,
    currentApproverRole: 'line_manager',
    status: 'pending',
    urgency: 'normal',
    submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 48).toISOString(),
    details: {
      leaveType: 'Annual Leave',
      startDate: '2026-11-20',
      endDate: '2026-11-25',
      days: 5,
      reason: 'Family recharge trip. All sprint commitments delegated to lead dev.'
    },
    auditTrail: [
      {
        step: 0,
        approverName: 'Priya Sharma',
        action: 'submitted',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        comments: 'Submitted through employee portal'
      }
    ]
  },
  {
    id: 'wf-102',
    tenantId: 'tenant-jm-main',
    type: 'promotion',
    title: 'Promotion: Senior Risk Analyst -> Lead Compliance Officer',
    requesterId: 'EMP005',
    requesterName: 'Thabo Mokoena',
    department: 'Risk & Compliance',
    currentStep: 2,
    totalSteps: 2,
    currentApproverRole: 'hr_admin',
    status: 'pending',
    urgency: 'high',
    submittedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 24).toISOString(),
    details: {
      proposedTitle: 'Lead Compliance Officer',
      currentSalary: 95000,
      proposedSalary: 112000,
      effectiveDate: '2026-12-01',
      justification: 'Exemplary performance leading FICA institutional audit inspection with zero infractions.'
    },
    auditTrail: [
      {
        step: 1,
        approverName: 'Patricia Sterling',
        action: 'approved',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        comments: 'Department head recommendation endorsed.'
      }
    ]
  },
  {
    id: 'wf-103',
    tenantId: 'tenant-jm-main',
    type: 'profile_change',
    title: 'Bank Account & Residential Address Change',
    requesterId: 'EMP003',
    requesterName: 'Patricia Sterling',
    department: 'Human Resources',
    currentStep: 1,
    totalSteps: 1,
    currentApproverRole: 'hr_admin',
    status: 'pending',
    urgency: 'normal',
    submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 72).toISOString(),
    details: {
      field: 'bankInfo',
      newBankName: 'National Commercial Bank',
      newAccountType: 'Checking',
      documentAttached: 'Stamped Bank Letter Dec 2026'
    },
    auditTrail: []
  },
  {
    id: 'wf-104',
    tenantId: 'tenant-jm-main',
    type: 'profile_change',
    title: 'Direct Deposit Account Update: John Doe',
    requesterId: 'EMP001',
    requesterName: 'John Doe',
    department: 'Engineering',
    currentStep: 1,
    totalSteps: 2,
    currentApproverRole: 'line_manager',
    status: 'pending',
    urgency: 'normal',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    dueDate: new Date(Date.now() + 3600000 * 48).toISOString(),
    details: {
      field: 'bankInfo',
      newBankName: 'National Commercial Bank',
      newAccountType: 'Checking',
      newAccountNumber: '•••• •••• 4492',
      reason: 'Updated payroll direct deposit account details'
    },
    auditTrail: [
      {
        step: 0,
        approverName: 'John Doe',
        action: 'submitted',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        comments: 'Submitted via Employee Self-Service Portal'
      }
    ]
  }
];

const defaultJobRequisitions: JobRequisition[] = [
  {
    id: 'req-001',
    tenantId: 'tenant-jm-main',
    title: 'Senior AML & Regulatory Compliance Analyst',
    department: 'Risk & Compliance',
    hiringManager: 'Marcus Sterling',
    location: 'Kingston Corporate Office',
    headcount: 2,
    employmentType: 'full_time',
    salaryBudget: {
      min: 90000,
      max: 115000,
      currency: 'JMD'
    },
    urgency: 'urgent',
    status: 'open',
    targetStartDate: '2027-01-15',
    jobDescription: 'Lead regulatory transaction surveillance, FICA/AML statutory filings, and customer due diligence audits.',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 'req-002',
    tenantId: 'tenant-jm-main',
    title: 'Full-Stack Fintech Systems Architect',
    department: 'Engineering',
    hiringManager: 'Priya Sharma',
    location: 'Remote / Kingston Hub',
    headcount: 1,
    employmentType: 'full_time',
    salaryBudget: {
      min: 130000,
      max: 160000,
      currency: 'JMD'
    },
    urgency: 'normal',
    status: 'open',
    targetStartDate: '2027-02-01',
    jobDescription: 'Architect resilient multi-tenant banking APIs and transactional processing backends.',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString()
  }
];

const defaultCandidates: Candidate[] = [
  {
    id: 'cand-1',
    tenantId: 'tenant-jm-main',
    requisitionId: 'req-001',
    jobTitle: 'Senior AML & Regulatory Compliance Analyst',
    name: 'Camille Campbell',
    email: 'c.campbell@example.com',
    phone: '+1 (876) 555-0192',
    stage: 'interview',
    score: 4.8,
    appliedDate: '2026-10-28',
    resumeFileName: 'Camille_Campbell_Compliance_Resume.pdf',
    notes: '7 years commercial banking compliance experience. ACAMS certified.',
    interviewerFeedback: 'Demonstrated deep mastery of FICA statutory requirements and risk assessments.',
    source: 'LinkedIn'
  },
  {
    id: 'cand-2',
    tenantId: 'tenant-jm-main',
    requisitionId: 'req-001',
    jobTitle: 'Senior AML & Regulatory Compliance Analyst',
    name: 'Devon Watson',
    email: 'devon.w@example.com',
    phone: '+1 (876) 555-0143',
    stage: 'offer',
    score: 4.9,
    appliedDate: '2026-10-24',
    resumeFileName: 'Devon_Watson_AML_Executive.pdf',
    notes: 'Offer package sent for formal sign-off.',
    interviewerFeedback: 'Exceptional forensic accounting and sanctions screening track record.',
    source: 'Referral'
  },
  {
    id: 'cand-3',
    tenantId: 'tenant-jm-main',
    requisitionId: 'req-002',
    jobTitle: 'Full-Stack Fintech Systems Architect',
    name: 'Alexander Chen',
    email: 'alex.chen@example.com',
    phone: '+1 (876) 555-0188',
    stage: 'screening',
    score: 4.5,
    appliedDate: '2026-11-01',
    resumeFileName: 'Alex_Chen_Fintech_Architect.pdf',
    notes: 'High-volume transaction processing background.',
    source: 'Careers Portal'
  }
];

const defaultOnboardingTasks: OnboardingTask[] = [
  {
    id: 'onb-1',
    tenantId: 'tenant-jm-main',
    employeeId: '1',
    employeeName: 'Marcus Sterling',
    department: 'Human Resources',
    title: 'Submit Certified Identity & 90-Day Proof of Address',
    category: 'compliance_training',
    assignedTo: 'Marcus Sterling',
    dueDate: '2026-11-15',
    status: 'completed',
    requiredDocumentCategory: 'fica_proof_of_address'
  },
  {
    id: 'onb-2',
    tenantId: 'tenant-jm-main',
    employeeId: '2',
    employeeName: 'Priya Sharma',
    department: 'Engineering',
    title: 'IT Hardware & Encrypted YubiKey Provisioning',
    category: 'it_setup',
    assignedTo: 'IT Operations Team',
    dueDate: '2026-11-20',
    status: 'completed'
  },
  {
    id: 'onb-3',
    tenantId: 'tenant-jm-main',
    employeeId: '3',
    employeeName: 'Thabo Mokoena',
    department: 'Risk & Compliance',
    title: '30-Day Manager Check-in & Probation Assessment',
    category: 'manager_checkin',
    assignedTo: 'Marcus Sterling',
    dueDate: '2026-12-05',
    status: 'in_progress'
  }
];

const defaultExitClearances: ExitClearance[] = [
  {
    id: 'exit-001',
    tenantId: 'tenant-jm-main',
    employeeId: 'emp-exit-sample',
    employeeName: 'Julian Blackwood',
    department: 'Treasury & Investment',
    resignationDate: '2026-10-15',
    finalWorkingDay: '2026-11-30',
    reason: 'Relocating overseas to pursue graduate studies',
    status: 'clearance_in_progress',
    items: [
      { department: 'IT Equipment', cleared: true, clearedBy: 'IT Lead', clearedAt: '2026-11-01', notes: 'MacBook Pro and hardware token returned.' },
      { department: 'Finance / Travel Float', cleared: true, clearedBy: 'Finance Controller', clearedAt: '2026-11-02', notes: 'Corporate card cancelled; zero balance outstanding.' },
      { department: 'Security Badge', cleared: false, notes: 'Physical card to be surrendered on final day.' },
      { department: 'Knowledge Transfer', cleared: true, clearedBy: 'Priya Sharma', clearedAt: '2026-11-03', notes: 'Handover documentation completed and archived.' }
    ]
  }
];

const defaultHRCases: HRCase[] = [
  {
    id: 'case-1001',
    tenantId: 'tenant-jm-main',
    caseNumber: 'HRC-2026-089',
    employeeId: '2',
    employeeName: 'Priya Sharma',
    department: 'Engineering',
    category: 'benefits',
    priority: 'medium',
    status: 'in_progress',
    subject: 'Health Insurance Family Dependent Enrollment',
    description: 'Requesting enrollment documentation for my newborn dependent under corporate medical policy.',
    slaDueAt: new Date(Date.now() + 3600000 * 24).toISOString(),
    assignedTo: 'Marcus Sterling',
    createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
    replies: [
      {
        id: 'rep-1',
        sender: 'Marcus Sterling (HR Admin)',
        message: 'Congratulations Priya! Please upload the birth certificate to your Document Vault so we can attach it to the insurer rider.',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        isInternal: false
      }
    ]
  },
  {
    id: 'case-1002',
    tenantId: 'tenant-jm-main',
    caseNumber: 'HRC-2026-090',
    employeeId: '3',
    employeeName: 'Thabo Mokoena',
    department: 'Risk & Compliance',
    category: 'payroll',
    priority: 'high',
    status: 'new',
    subject: 'Discrepancy in Overtime Hours for Financial Quarter Close',
    description: 'My weekend overtime hours for October 24-25 were recorded as regular hours instead of 1.5x weekend multiplier.',
    slaDueAt: new Date(Date.now() + 3600000 * 8).toISOString(),
    assignedTo: 'Payroll Specialist',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    replies: []
  }
];

const defaultKnowledgeBase: KnowledgeBaseArticle[] = [
  {
    id: 'kb-1',
    tenantId: 'tenant-jm-main',
    title: 'Statutory FICA & Proof of Address 90-Day Policy',
    category: 'Compliance & Regulations',
    summary: 'Guidelines on acceptable residential address proof and the mandatory 90-day renewal cycle.',
    content: 'Under statutory anti-money laundering frameworks, all accountable financial institution personnel and clients must maintain residential address proofs issued within the preceding 90 days. Acceptable documents include municipal utility accounts, registered lease agreements, and stamped bank statements.',
    views: 342,
    helpfulCount: 48
  },
  {
    id: 'kb-2',
    tenantId: 'tenant-jm-main',
    title: 'Leave Policy: Accrual, Carry-Forward & Encashment',
    category: 'Leave & Absence',
    summary: 'Understanding annual leave day calculations, carry-forward limits, and manager blackout rules.',
    content: 'Employees accrue annual leave monthly based on contractual entitlements. A maximum of 5 days may be carried forward into the subsequent calendar year. Leave requests exceeding 3 consecutive days require supervisor approval at least 14 days in advance.',
    views: 521,
    helpfulCount: 89
  },
  {
    id: 'kb-3',
    tenantId: 'tenant-jm-main',
    title: 'Standard Overtime Calculation & Weekend Rates',
    category: 'Payroll & Compensation',
    summary: 'Thresholds for overtime eligibility, approval chains, and multiplier tiers.',
    content: 'Non-exempt personnel working beyond 40 standard weekly hours qualify for overtime compensation at 1.5x standard hourly rate. Work conducted on designated national public holidays or Sundays qualifies for 2.0x standard rate.',
    views: 290,
    helpfulCount: 39
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [profileChangeRequests, setProfileChangeRequests] = useState<ProfileChangeRequest[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocument[]>([]);
  const [policyAcknowledgments, setPolicyAcknowledgments] = useState<PolicyAcknowledgment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [careerMovements, setCareerMovements] = useState<CareerMovement[]>([]);
  const [organizationalStructure, setOrganizationalStructure] = useState<OrganizationalStructure | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>([]);
  const [certifications, setCertifications] = useState<CertificationRecord[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ficaRecords, setFicaRecords] = useState<FicaComplianceRecord[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>(defaultTenants);
  const [currentTenant, setCurrentTenantState] = useState<Tenant>(defaultTenants[0]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [workflowApprovals, setWorkflowApprovals] = useState<WorkflowApprovalItem[]>([]);
  const [jobRequisitions, setJobRequisitions] = useState<JobRequisition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([]);
  const [exitClearances, setExitClearances] = useState<ExitClearance[]>([]);
  const [hrCases, setHrCases] = useState<HRCase[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseArticle[]>([]);

  useEffect(() => {
    // Helper to safely load or fallback
    const loadFromStorage = <T,>(key: string, fallback: T): T => {
      const saved = localStorage.getItem(key);
      if (!saved) return fallback;
      try {
        return JSON.parse(saved);
      } catch {
        return fallback;
      }
    };

    setEmployees(loadFromStorage('hrm_employees', defaultEmployees));
    setDepartments(loadFromStorage('hrm_departments', defaultDepartments));
    setLeaveTypes(loadFromStorage('hrm_leave_types', defaultLeaveTypes));
    setLeaveRequests(loadFromStorage('hrm_leave_requests', []));
    setLeaveBalances(loadFromStorage('hrm_leave_balances', defaultLeaveBalances));
    setProfileChangeRequests(loadFromStorage('hrm_profile_change_requests', []));
    const loadedReviews = loadFromStorage('hrm_performance_reviews', defaultPerformanceReviews);
    setPerformanceReviews(loadedReviews.length > 0 ? loadedReviews : defaultPerformanceReviews);
    setJobPostings(loadFromStorage('hrm_job_postings', defaultJobPostings));
    setPolicyDocuments(loadFromStorage('hrm_policy_documents', defaultPolicyDocuments));
    setPolicyAcknowledgments(loadFromStorage('hrm_policy_acknowledgments', []));
    setNotifications(loadFromStorage('hrm_notifications', []));
    setCareerMovements(loadFromStorage('hrm_career_movements', defaultCareerMovements));
    setOrganizationalStructure(loadFromStorage('hrm_organizational_structure', null));
    setAttendanceRecords(loadFromStorage('hrm_attendance', defaultAttendance));
    setTimesheets(loadFromStorage('hrm_timesheets', defaultTimesheets));
    setTrainingCourses(loadFromStorage('hrm_training_courses', defaultTrainingCourses));
    setCertifications(loadFromStorage('hrm_certifications', defaultCertifications));
    setGoals(loadFromStorage('hrm_goals', defaultGoals));
    setSystemSettings(loadFromStorage('hrm_system_settings', defaultSystemSettings));
    setDocuments(loadFromStorage('hrm_documents', defaultDocuments));
    setFicaRecords(loadFromStorage('hrm_fica_records', defaultFicaRecords));
    setTenants(loadFromStorage('hrm_tenants', defaultTenants));
    setCurrentTenantState(loadFromStorage('hrm_current_tenant', defaultTenants[0]));
    setAuditLogs(loadFromStorage('hrm_audit_logs', defaultAuditLogs));
    const rawApprovals = loadFromStorage('hrm_workflow_approvals', defaultWorkflowApprovals);
    const sanitizedApprovals = rawApprovals.map(item => {
      if (item.id === 'wf-103' && item.requesterName !== 'John Doe') {
        return { ...item, requesterId: 'EMP003', requesterName: 'Patricia Sterling' };
      }
      return item;
    });
    if (!sanitizedApprovals.some(a => a.id === 'wf-104')) {
      const johnWf = defaultWorkflowApprovals.find(a => a.id === 'wf-104');
      if (johnWf) sanitizedApprovals.push(johnWf);
    }
    setWorkflowApprovals(sanitizedApprovals);
    localStorage.setItem('hrm_workflow_approvals', JSON.stringify(sanitizedApprovals));
    setJobRequisitions(loadFromStorage('hrm_job_requisitions', defaultJobRequisitions));
    setCandidates(loadFromStorage('hrm_candidates', defaultCandidates));
    setOnboardingTasks(loadFromStorage('hrm_onboarding_tasks', defaultOnboardingTasks));
    setExitClearances(loadFromStorage('hrm_exit_clearances', defaultExitClearances));
    setHrCases(loadFromStorage('hrm_cases', defaultHRCases));
    setKnowledgeBase(loadFromStorage('hrm_knowledge_base', defaultKnowledgeBase));

    // Persist defaults on first boot if not set
    if (!localStorage.getItem('hrm_employees')) localStorage.setItem('hrm_employees', JSON.stringify(defaultEmployees));
    if (!localStorage.getItem('hrm_departments')) localStorage.setItem('hrm_departments', JSON.stringify(defaultDepartments));
    if (!localStorage.getItem('hrm_leave_types')) localStorage.setItem('hrm_leave_types', JSON.stringify(defaultLeaveTypes));
    if (!localStorage.getItem('hrm_leave_balances')) localStorage.setItem('hrm_leave_balances', JSON.stringify(defaultLeaveBalances));
    if (!localStorage.getItem('hrm_job_postings')) localStorage.setItem('hrm_job_postings', JSON.stringify(defaultJobPostings));
    if (!localStorage.getItem('hrm_career_movements')) localStorage.setItem('hrm_career_movements', JSON.stringify(defaultCareerMovements));
    if (!localStorage.getItem('hrm_policy_documents')) localStorage.setItem('hrm_policy_documents', JSON.stringify(defaultPolicyDocuments));
    if (!localStorage.getItem('hrm_attendance')) localStorage.setItem('hrm_attendance', JSON.stringify(defaultAttendance));
    if (!localStorage.getItem('hrm_timesheets')) localStorage.setItem('hrm_timesheets', JSON.stringify(defaultTimesheets));
    if (!localStorage.getItem('hrm_training_courses')) localStorage.setItem('hrm_training_courses', JSON.stringify(defaultTrainingCourses));
    if (!localStorage.getItem('hrm_certifications')) localStorage.setItem('hrm_certifications', JSON.stringify(defaultCertifications));
    if (!localStorage.getItem('hrm_goals')) localStorage.setItem('hrm_goals', JSON.stringify(defaultGoals));
    if (!localStorage.getItem('hrm_documents')) localStorage.setItem('hrm_documents', JSON.stringify(defaultDocuments));
    if (!localStorage.getItem('hrm_fica_records')) localStorage.setItem('hrm_fica_records', JSON.stringify(defaultFicaRecords));
    if (!localStorage.getItem('hrm_tenants')) localStorage.setItem('hrm_tenants', JSON.stringify(defaultTenants));
    if (!localStorage.getItem('hrm_current_tenant')) localStorage.setItem('hrm_current_tenant', JSON.stringify(defaultTenants[0]));
    if (!localStorage.getItem('hrm_audit_logs')) localStorage.setItem('hrm_audit_logs', JSON.stringify(defaultAuditLogs));
    if (!localStorage.getItem('hrm_workflow_approvals')) localStorage.setItem('hrm_workflow_approvals', JSON.stringify(defaultWorkflowApprovals));
    if (!localStorage.getItem('hrm_job_requisitions')) localStorage.setItem('hrm_job_requisitions', JSON.stringify(defaultJobRequisitions));
    if (!localStorage.getItem('hrm_candidates')) localStorage.setItem('hrm_candidates', JSON.stringify(defaultCandidates));
    if (!localStorage.getItem('hrm_onboarding_tasks')) localStorage.setItem('hrm_onboarding_tasks', JSON.stringify(defaultOnboardingTasks));
    if (!localStorage.getItem('hrm_exit_clearances')) localStorage.setItem('hrm_exit_clearances', JSON.stringify(defaultExitClearances));
    if (!localStorage.getItem('hrm_cases')) localStorage.setItem('hrm_cases', JSON.stringify(defaultHRCases));
    if (!localStorage.getItem('hrm_knowledge_base')) localStorage.setItem('hrm_knowledge_base', JSON.stringify(defaultKnowledgeBase));
    if (!localStorage.getItem('hrm_performance_reviews')) localStorage.setItem('hrm_performance_reviews', JSON.stringify(defaultPerformanceReviews));
  }, []);

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedEmployees = [...employees, newEmployee];
    setEmployees(updatedEmployees);
    localStorage.setItem('hrm_employees', JSON.stringify(updatedEmployees));

    // Auto-provision default leave balances
    const newBalances: LeaveBalance[] = leaveTypes.map(lt => ({
      employeeId: newEmployee.id,
      leaveTypeId: lt.id,
      allocated: lt.allowance,
      used: 0,
      pending: 0,
      available: lt.allowance,
      carriedForward: 0,
      year: new Date().getFullYear(),
    }));
    const updatedBalances = [...leaveBalances, ...newBalances];
    setLeaveBalances(updatedBalances);
    localStorage.setItem('hrm_leave_balances', JSON.stringify(updatedBalances));

    // Auto-provision initial FICA compliance record
    const newFica: FicaComplianceRecord = {
      id: `fica-${Date.now()}`,
      employeeId: newEmployee.id,
      status: 'pending_verification',
      riskRating: 'medium',
      isPep: false,
      sanctionScreeningPassed: false,
      complianceOfficerNotes: 'New employee onboarded. Statutory FICA documentation pending submission.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requirements: [
        {
          id: `req-${Date.now()}-1`,
          type: 'id_document',
          title: 'Certified National Identity / Passport',
          description: 'Certified copy of National ID card or Passport.',
          status: 'missing'
        },
        {
          id: `req-${Date.now()}-2`,
          type: 'proof_of_address',
          title: 'Proof of Residential Address (< 3 Months Old)',
          description: 'Utility bill, rates tax notice, or lease strictly under 90 days old.',
          status: 'missing'
        },
        {
          id: `req-${Date.now()}-3`,
          type: 'bank_confirmation',
          title: 'Bank Account Confirmation Letter (< 3 Months)',
          description: 'Official bank letter or stamped statement from registered bank.',
          status: 'missing'
        },
        {
          id: `req-${Date.now()}-4`,
          type: 'tax_number',
          title: 'Official Tax Number Verification (SARS / IRS)',
          description: 'Revenue authority tax registration confirmation notice.',
          status: 'missing'
        },
        {
          id: `req-${Date.now()}-5`,
          type: 'pep_declaration',
          title: 'Politically Exposed Person (PEP) Declaration',
          description: 'Statutory self-declaration of public prominence or political exposure.',
          status: 'missing'
        },
        {
          id: `req-${Date.now()}-6`,
          type: 'criminal_clearance',
          title: 'Criminal Record & Financial Fit-and-Proper Clearance',
          description: 'Police clearance certificate & credit fitness check.',
          status: 'missing'
        }
      ]
    };
    const updatedFica = [...ficaRecords, newFica];
    setFicaRecords(updatedFica);
    localStorage.setItem('hrm_fica_records', JSON.stringify(updatedFica));
  };

  const updateEmployee = (id: string, employeeData: Partial<Employee>) => {
    const updatedEmployees = employees.map(emp => 
      emp.id === id 
        ? { ...emp, ...employeeData, updatedAt: new Date().toISOString() }
        : emp
    );
    setEmployees(updatedEmployees);
    localStorage.setItem('hrm_employees', JSON.stringify(updatedEmployees));
  };

  const deleteEmployee = (id: string) => {
    const updatedEmployees = employees.filter(emp => emp.id !== id);
    setEmployees(updatedEmployees);
    localStorage.setItem('hrm_employees', JSON.stringify(updatedEmployees));
  };

  const addDepartment = (departmentData: Omit<Department, 'id' | 'createdAt'>) => {
    const newDepartment: Department = {
      ...departmentData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedDepartments = [...departments, newDepartment];
    setDepartments(updatedDepartments);
    localStorage.setItem('hrm_departments', JSON.stringify(updatedDepartments));
  };

  const updateDepartment = (id: string, departmentData: Partial<Department>) => {
    const updatedDepartments = departments.map(dept => 
      dept.id === id ? { ...dept, ...departmentData } : dept
    );
    setDepartments(updatedDepartments);
    localStorage.setItem('hrm_departments', JSON.stringify(updatedDepartments));
  };

  const deleteDepartment = (id: string) => {
    const updatedDepartments = departments.filter(dept => dept.id !== id);
    setDepartments(updatedDepartments);
    localStorage.setItem('hrm_departments', JSON.stringify(updatedDepartments));
  };

  const addLeaveType = (leaveTypeData: Omit<LeaveType, 'id'>) => {
    const newType: LeaveType = {
      ...leaveTypeData,
      id: Date.now().toString(),
    };
    const updated = [...leaveTypes, newType];
    setLeaveTypes(updated);
    localStorage.setItem('hrm_leave_types', JSON.stringify(updated));
  };

  const updateLeaveType = (id: string, leaveTypeData: Partial<LeaveType>) => {
    const updated = leaveTypes.map(lt => (lt.id === id ? { ...lt, ...leaveTypeData } : lt));
    setLeaveTypes(updated);
    localStorage.setItem('hrm_leave_types', JSON.stringify(updated));
  };

  const deleteLeaveType = (id: string) => {
    const updated = leaveTypes.filter(lt => lt.id !== id);
    setLeaveTypes(updated);
    localStorage.setItem('hrm_leave_types', JSON.stringify(updated));
  };

  const addLeaveRequest = (requestData: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRequest: LeaveRequest = {
      ...requestData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedRequests = [...leaveRequests, newRequest];
    setLeaveRequests(updatedRequests);
    localStorage.setItem('hrm_leave_requests', JSON.stringify(updatedRequests));

    // Update pending balance
    const currentBalance = leaveBalances.find(
      b => b.employeeId === requestData.employeeId && b.leaveTypeId === requestData.leaveTypeId
    );
    if (currentBalance) {
      updateLeaveBalance(requestData.employeeId, requestData.leaveTypeId, {
        pending: currentBalance.pending + requestData.days,
        available: Math.max(0, currentBalance.allocated - (currentBalance.used + currentBalance.pending + requestData.days))
      });
    }

    const emp = employees.find(e => e.id === requestData.employeeId || e.employeeId === requestData.employeeId);
    const leaveType = leaveTypes.find(lt => lt.id === requestData.leaveTypeId);
    const newWorkflowItem: WorkflowApprovalItem = {
      id: `wf-leave-${newRequest.id}`,
      tenantId: currentTenant?.id || 'tenant-jm-main',
      type: 'leave',
      title: `${leaveType?.name || 'Leave'} Request (${requestData.days} Day${requestData.days > 1 ? 's' : ''})`,
      requesterId: emp?.employeeId || requestData.employeeId,
      requesterName: emp ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : 'Employee',
      department: emp?.jobInfo.department || 'Operations',
      currentStep: 1,
      totalSteps: 2,
      currentApproverRole: 'line_manager',
      status: 'pending',
      urgency: 'normal',
      submittedAt: newRequest.createdAt,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      details: {
        leaveRequestId: newRequest.id,
        leaveType: leaveType?.name || 'Leave',
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        days: requestData.days,
        reason: requestData.reason
      },
      auditTrail: [
        {
          step: 0,
          approverName: emp ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : 'Employee',
          action: 'submitted',
          timestamp: newRequest.createdAt,
          comments: requestData.reason || 'Leave request submitted via portal'
        }
      ]
    };
    setWorkflowApprovals(prev => [newWorkflowItem, ...prev]);
    localStorage.setItem('hrm_workflow_approvals', JSON.stringify([newWorkflowItem, ...workflowApprovals]));
  };

  const updateLeaveRequest = (id: string, requestData: Partial<LeaveRequest>) => {
    const prevRequest = leaveRequests.find(req => req.id === id);
    const updatedRequests = leaveRequests.map(req => 
      req.id === id 
        ? { ...req, ...requestData, updatedAt: new Date().toISOString() }
        : req
    );
    setLeaveRequests(updatedRequests);
    localStorage.setItem('hrm_leave_requests', JSON.stringify(updatedRequests));
    
    // Balance adjustments on status changes
    if (prevRequest && requestData.status && prevRequest.status !== requestData.status) {
      const balance = leaveBalances.find(
        b => b.employeeId === prevRequest.employeeId && b.leaveTypeId === prevRequest.leaveTypeId
      );
      if (balance) {
        if (requestData.status === 'hr_approved') {
          updateLeaveBalance(prevRequest.employeeId, prevRequest.leaveTypeId, {
            pending: Math.max(0, balance.pending - prevRequest.days),
            used: balance.used + prevRequest.days,
            available: Math.max(0, balance.allocated - (balance.used + prevRequest.days))
          });
        } else if (requestData.status === 'rejected') {
          updateLeaveBalance(prevRequest.employeeId, prevRequest.leaveTypeId, {
            pending: Math.max(0, balance.pending - prevRequest.days),
            available: Math.min(balance.allocated, balance.available + prevRequest.days)
          });
        }
      }

      const employee = employees.find(emp => emp.id === prevRequest.employeeId);
      if (employee) {
        addNotification({
          userId: employee.id,
          title: 'Leave Request Update',
          message: `Your leave request has been ${requestData.status.replace('_', ' ')}`,
          type: requestData.status === 'hr_approved' ? 'success' : 
                requestData.status === 'rejected' ? 'error' : 'info',
          read: false,
          actionRequired: false,
          relatedEntityId: id,
          relatedEntityType: 'leave_request'
        });
      }
    }
  };

  const updateLeaveBalance = (employeeId: string, leaveTypeId: string, balanceData: Partial<LeaveBalance>) => {
    const existing = leaveBalances.find(b => b.employeeId === employeeId && b.leaveTypeId === leaveTypeId);
    let updated: LeaveBalance[];
    if (existing) {
      updated = leaveBalances.map(b => 
        (b.employeeId === employeeId && b.leaveTypeId === leaveTypeId) ? { ...b, ...balanceData } : b
      );
    } else {
      updated = [...leaveBalances, {
        employeeId,
        leaveTypeId,
        allocated: 20,
        used: 0,
        pending: 0,
        available: 20,
        carriedForward: 0,
        year: new Date().getFullYear(),
        ...balanceData
      }];
    }
    setLeaveBalances(updated);
    localStorage.setItem('hrm_leave_balances', JSON.stringify(updated));
  };

  const addProfileChangeRequest = (requestData: Omit<ProfileChangeRequest, 'id' | 'createdAt'>) => {
    const newRequest: ProfileChangeRequest = {
      ...requestData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedRequests = [...profileChangeRequests, newRequest];
    setProfileChangeRequests(updatedRequests);
    localStorage.setItem('hrm_profile_change_requests', JSON.stringify(updatedRequests));
  };

  const updateProfileChangeRequest = (id: string, requestData: Partial<ProfileChangeRequest>) => {
    const updatedRequests = profileChangeRequests.map(req => 
      req.id === id ? { ...req, ...requestData } : req
    );
    setProfileChangeRequests(updatedRequests);
    localStorage.setItem('hrm_profile_change_requests', JSON.stringify(updatedRequests));
    
    if (requestData.status === 'approved') {
      const request = profileChangeRequests.find(req => req.id === id);
      if (request) {
        updateEmployee(request.employeeId, request.proposedData as Partial<Employee>);
      }
    }
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedNotifications = [...notifications, newNotification];
    setNotifications(updatedNotifications);
    localStorage.setItem('hrm_notifications', JSON.stringify(updatedNotifications));
  };

  const markNotificationAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('hrm_notifications', JSON.stringify(updatedNotifications));
  };

  const addPerformanceReview = (reviewData: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReview: PerformanceReview = {
      ...reviewData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedReviews = [...performanceReviews, newReview];
    setPerformanceReviews(updatedReviews);
    localStorage.setItem('hrm_performance_reviews', JSON.stringify(updatedReviews));
  };

  const updatePerformanceReview = (id: string, reviewData: Partial<PerformanceReview>) => {
    const updatedReviews = performanceReviews.map(review => 
      review.id === id 
        ? { ...review, ...reviewData, updatedAt: new Date().toISOString() }
        : review
    );
    setPerformanceReviews(updatedReviews);
    localStorage.setItem('hrm_performance_reviews', JSON.stringify(updatedReviews));
  };

  const addJobPosting = (postingData: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPosting: JobPosting = {
      ...postingData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedPostings = [...jobPostings, newPosting];
    setJobPostings(updatedPostings);
    localStorage.setItem('hrm_job_postings', JSON.stringify(updatedPostings));
  };

  const updateJobPosting = (id: string, postingData: Partial<JobPosting>) => {
    const updatedPostings = jobPostings.map(posting => 
      posting.id === id 
        ? { ...posting, ...postingData, updatedAt: new Date().toISOString() }
        : posting
    );
    setJobPostings(updatedPostings);
    localStorage.setItem('hrm_job_postings', JSON.stringify(updatedPostings));
  };

  const deleteJobPosting = (id: string) => {
    const updatedPostings = jobPostings.filter(p => p.id !== id);
    setJobPostings(updatedPostings);
    localStorage.setItem('hrm_job_postings', JSON.stringify(updatedPostings));
  };

  const addCareerMovement = (movementData: Omit<CareerMovement, 'id' | 'createdAt'>) => {
    const newMovement: CareerMovement = {
      ...movementData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedMovements = [...careerMovements, newMovement];
    setCareerMovements(updatedMovements);
    localStorage.setItem('hrm_career_movements', JSON.stringify(updatedMovements));

    const emp = employees.find(e => e.id === movementData.employeeId);
    if (emp) {
      updateEmployee(emp.id, {
        jobInfo: {
          ...emp.jobInfo,
          jobTitle: movementData.toPosition.title,
          department: movementData.toPosition.department,
          salary: movementData.salaryChange?.newSalary ?? emp.jobInfo.salary
        }
      });
    }
  };

  const updateOrganizationalStructure = (structureData: Partial<OrganizationalStructure>) => {
    const updatedStructure = organizationalStructure 
      ? { ...organizationalStructure, ...structureData, updatedAt: new Date().toISOString() }
      : {
          id: Date.now().toString(),
          name: 'Company Structure',
          departments: departments,
          positions: [],
          reportingStructure: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...structureData
        };
    setOrganizationalStructure(updatedStructure);
    localStorage.setItem('hrm_organizational_structure', JSON.stringify(updatedStructure));
  };

  const addAttendanceRecord = (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: Date.now().toString(),
    };
    const updated = [newRecord, ...attendanceRecords];
    setAttendanceRecords(updated);
    localStorage.setItem('hrm_attendance', JSON.stringify(updated));
  };

  const updateAttendanceRecord = (id: string, recordData: Partial<AttendanceRecord>) => {
    const updated = attendanceRecords.map(r => r.id === id ? { ...r, ...recordData } : r);
    setAttendanceRecords(updated);
    localStorage.setItem('hrm_attendance', JSON.stringify(updated));
  };

  const clockIn = (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const existing = attendanceRecords.find(r => r.employeeId === employeeId && r.date === today);

    if (existing) {
      updateAttendanceRecord(existing.id, { clockIn: timeStr, status: 'present' });
    } else {
      addAttendanceRecord({
        employeeId,
        date: today,
        clockIn: timeStr,
        status: 'present',
        workingHours: 0,
        notes: 'Punched in online'
      });
    }
  };

  const clockOut = (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const existing = attendanceRecords.find(r => r.employeeId === employeeId && r.date === today);

    if (existing) {
      updateAttendanceRecord(existing.id, { clockOut: timeStr, workingHours: 8.0 });
    } else {
      addAttendanceRecord({
        employeeId,
        date: today,
        clockOut: timeStr,
        status: 'present',
        workingHours: 8.0,
        notes: 'Clocked out'
      });
    }
  };

  const addTimesheet = (timesheetData: Omit<TimesheetRecord, 'id'>) => {
    const newTs: TimesheetRecord = {
      ...timesheetData,
      id: Date.now().toString(),
    };
    const updated = [newTs, ...timesheets];
    setTimesheets(updated);
    localStorage.setItem('hrm_timesheets', JSON.stringify(updated));
  };

  const updateTimesheet = (id: string, timesheetData: Partial<TimesheetRecord>) => {
    const updated = timesheets.map(t => t.id === id ? { ...t, ...timesheetData } : t);
    setTimesheets(updated);
    localStorage.setItem('hrm_timesheets', JSON.stringify(updated));
  };

  const addTrainingCourse = (courseData: Omit<TrainingCourse, 'id'>) => {
    const newCourse: TrainingCourse = {
      ...courseData,
      id: Date.now().toString(),
      materials: courseData.materials || []
    };
    const updated = [...trainingCourses, newCourse];
    setTrainingCourses(updated);
    localStorage.setItem('hrm_training_courses', JSON.stringify(updated));
  };

  const updateTrainingCourse = (id: string, courseData: Partial<TrainingCourse>) => {
    const updated = trainingCourses.map(c => c.id === id ? { ...c, ...courseData } : c);
    setTrainingCourses(updated);
    localStorage.setItem('hrm_training_courses', JSON.stringify(updated));
  };

  const enrollInCourse = (courseId: string, employeeId: string) => {
    const course = trainingCourses.find(c => c.id === courseId);
    if (course && !course.enrolledEmployeeIds.includes(employeeId)) {
      updateTrainingCourse(courseId, {
        enrolledEmployeeIds: [...course.enrolledEmployeeIds, employeeId]
      });
    }
  };

  const addCourseMaterial = (courseId: string, materialData: Omit<CourseMaterial, 'id' | 'uploadedAt'>) => {
    const newMaterial: CourseMaterial = {
      ...materialData,
      id: `mat-${Date.now()}`,
      uploadedAt: new Date().toISOString()
    };
    const updated = trainingCourses.map(c => {
      if (c.id === courseId) {
        const existingMaterials = c.materials || [];
        return {
          ...c,
          materials: [...existingMaterials, newMaterial]
        };
      }
      return c;
    });
    setTrainingCourses(updated);
    localStorage.setItem('hrm_training_courses', JSON.stringify(updated));
  };

  const deleteCourseMaterial = (courseId: string, materialId: string) => {
    const updated = trainingCourses.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          materials: (c.materials || []).filter(m => m.id !== materialId)
        };
      }
      return c;
    });
    setTrainingCourses(updated);
    localStorage.setItem('hrm_training_courses', JSON.stringify(updated));
  };

  const updateCourseProgress = (courseId: string, _employeeId: string, completionRate: number) => {
    updateTrainingCourse(courseId, {
      completionRate: Math.min(100, Math.max(0, completionRate)),
      status: completionRate >= 100 ? 'completed' : 'in_progress'
    });
  };

  const addCertification = (certData: Omit<CertificationRecord, 'id'>) => {
    const newCert: CertificationRecord = {
      ...certData,
      id: Date.now().toString(),
    };
    const updated = [...certifications, newCert];
    setCertifications(updated);
    localStorage.setItem('hrm_certifications', JSON.stringify(updated));
  };

  const updateCertification = (id: string, certData: Partial<CertificationRecord>) => {
    const updated = certifications.map(c => c.id === id ? { ...c, ...certData } : c);
    setCertifications(updated);
    localStorage.setItem('hrm_certifications', JSON.stringify(updated));
  };

  const addGoal = (goalData: Omit<GoalRecord, 'id'>) => {
    const newGoal: GoalRecord = {
      ...goalData,
      id: Date.now().toString(),
    };
    const updated = [...goals, newGoal];
    setGoals(updated);
    localStorage.setItem('hrm_goals', JSON.stringify(updated));
  };

  const updateGoal = (id: string, goalData: Partial<GoalRecord>) => {
    const updated = goals.map(g => g.id === id ? { ...g, ...goalData } : g);
    setGoals(updated);
    localStorage.setItem('hrm_goals', JSON.stringify(updated));
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    localStorage.setItem('hrm_goals', JSON.stringify(updated));
  };

  const updateSystemSettings = (settingsData: Partial<SystemSettings>) => {
    const updated = { ...systemSettings, ...settingsData };
    setSystemSettings(updated);
    localStorage.setItem('hrm_system_settings', JSON.stringify(updated));
  };

  const addPolicyDocument = (policyData: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPolicy: PolicyDocument = {
      ...policyData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...policyDocuments, newPolicy];
    setPolicyDocuments(updated);
    localStorage.setItem('hrm_policy_documents', JSON.stringify(updated));
  };

  const acknowledgePolicy = (policyId: string, employeeId: string) => {
    const existing = policyAcknowledgments.find(
      a => a.policyDocumentId === policyId && a.employeeId === employeeId
    );
    if (!existing) {
      const newAck: PolicyAcknowledgment = {
        id: Date.now().toString(),
        employeeId,
        policyDocumentId: policyId,
        readStartTime: new Date().toISOString(),
        readEndTime: new Date().toISOString(),
        timeSpentReading: 120,
        acknowledged: true,
        acknowledgedAt: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        deviceInfo: 'Web Browser Client'
      };
      const updated = [...policyAcknowledgments, newAck];
      setPolicyAcknowledgments(updated);
      localStorage.setItem('hrm_policy_acknowledgments', JSON.stringify(updated));
    }
  };

  // --- Document Storage & Management ---
  const addDocument = (docData: Omit<Document, 'id' | 'uploadDate'>): Document => {
    const newDoc: Document = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString(),
      verificationStatus: docData.verificationStatus || 'pending'
    };
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem('hrm_documents', JSON.stringify(updated));

    // If it's a photo, sync profilePhoto if specified
    if (docData.category === 'photo' && docData.employeeId && docData.fileData) {
      updateEmployee(docData.employeeId, { profilePhoto: docData.fileData });
    }

    return newDoc;
  };

  const deleteDocument = (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    localStorage.setItem('hrm_documents', JSON.stringify(updated));
  };

  const verifyDocument = (id: string, status: 'verified' | 'rejected', notes?: string, verifiedBy?: string) => {
    const updated = documents.map(d => {
      if (d.id === id) {
        return {
          ...d,
          verificationStatus: status,
          verifiedBy: verifiedBy || 'HR Compliance Officer',
          verifiedAt: new Date().toISOString(),
          verificationNotes: notes || (status === 'verified' ? 'Document verified and approved.' : 'Rejected.')
        };
      }
      return d;
    });
    setDocuments(updated);
    localStorage.setItem('hrm_documents', JSON.stringify(updated));
  };

  const signDocument = (documentId: string, signerName: string) => {
    const updated = documents.map(d => {
      if (d.id === documentId) {
        return {
          ...d,
          verificationStatus: 'verified' as const,
          signature: {
            signed: true,
            signedByName: signerName,
            signedAt: new Date().toISOString(),
            signatureType: 'digital_acceptance' as const
          }
        };
      }
      return d;
    });
    setDocuments(updated);
    localStorage.setItem('hrm_documents', JSON.stringify(updated));

    addAuditLog({
      actorId: signerName,
      actorName: signerName,
      actorRole: 'employee',
      action: 'SIGN',
      entity: 'Document',
      entityId: documentId,
      entityDescription: `Electronically reviewed and signed document '${documents.find(d => d.id === documentId)?.name || documentId}'`,
      previousValue: 'signed: false',
      newValue: `signed: true, signedByName: ${signerName}`,
      ipAddress: '127.0.0.1'
    });
  };

  const submitProfileUpdateRequest = (
    employeeId: string, 
    updateData: { 
      phone?: string; 
      address?: Employee['personalInfo']['address']; 
      emergencyContact?: Employee['personalInfo']['emergencyContact']; 
      bankInfo?: Employee['bankInfo'];
    },
    requiresApproval: boolean
  ) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    if (!requiresApproval) {
      updateEmployee(employeeId, {
        personalInfo: {
          ...emp.personalInfo,
          phone: updateData.phone || emp.personalInfo.phone,
          address: updateData.address || emp.personalInfo.address,
          emergencyContact: updateData.emergencyContact || emp.personalInfo.emergencyContact,
        },
        bankInfo: updateData.bankInfo || emp.bankInfo
      });
      addAuditLog({
        actorId: emp.employeeId,
        actorName: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        actorRole: 'employee',
        action: 'UPDATE',
        entity: 'Employee',
        entityId: employeeId,
        entityDescription: 'Updated personal contact details via Employee Self-Service',
        previousValue: JSON.stringify({ phone: emp.personalInfo.phone, address: emp.personalInfo.address }),
        newValue: JSON.stringify(updateData),
        ipAddress: '127.0.0.1'
      });
    } else {
      const newReq: ProfileChangeRequest = {
        id: `pcr-${Date.now()}`,
        employeeId,
        requestedBy: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        requestType: updateData.bankInfo ? 'bank_info' : 'personal_info',
        currentData: {
          phone: emp.personalInfo.phone,
          address: emp.personalInfo.address,
          bankInfo: emp.bankInfo
        },
        proposedData: updateData,
        reason: 'Employee self-service update request submitted for HR validation',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      const updatedReqs = [newReq, ...profileChangeRequests];
      setProfileChangeRequests(updatedReqs);
      localStorage.setItem('hrm_profile_change_requests', JSON.stringify(updatedReqs));

      const newApproval: WorkflowApprovalItem = {
        id: `wf-pcr-${Date.now()}`,
        tenantId: currentTenant.id,
        title: `Profile Information Change: ${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        type: 'profile_change',
        requesterId: emp.employeeId,
        requesterName: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        department: emp.jobInfo.department,
        currentStep: 1,
        totalSteps: 2,
        currentApproverRole: 'line_manager',
        currentApproverId: emp.jobInfo.reportingManager,
        assignedRole: 'line_manager',
        assignedTo: emp.jobInfo.reportingManager,
        status: 'pending',
        urgency: 'normal',
        submittedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        details: {
          proposedData: updateData,
          reason: 'Employee self-service profile update'
        },
        auditTrail: [{
          step: 1,
          approverName: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
          action: 'submitted',
          timestamp: new Date().toISOString(),
          comments: 'Submitted update request for approval'
        }],
        history: [{
          step: 1,
          approverName: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
          action: 'submitted',
          timestamp: new Date().toISOString(),
          comments: 'Submitted update request for approval'
        }]
      };
      setWorkflowApprovals(prev => [newApproval, ...prev]);
      localStorage.setItem('hrm_workflow_approvals', JSON.stringify([newApproval, ...workflowApprovals]));

      addAuditLog({
        actorId: emp.employeeId,
        actorName: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        actorRole: 'employee',
        action: 'CREATE',
        entity: 'Workflow',
        entityId: newReq.id,
        entityDescription: 'Submitted profile change request for managerial and HR approval',
        previousValue: undefined,
        newValue: JSON.stringify(updateData),
        ipAddress: '127.0.0.1'
      });
    }
  };

  // --- FICA & Regulatory Compliance Management ---
  const updateFicaRecord = (employeeId: string, updates: Partial<FicaComplianceRecord>) => {
    const existing = ficaRecords.find(r => r.employeeId === employeeId);
    let updatedRecords: FicaComplianceRecord[];
    if (existing) {
      updatedRecords = ficaRecords.map(r => 
        r.employeeId === employeeId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      );
    } else {
      const newRec: FicaComplianceRecord = {
        id: `fica-${Date.now()}`,
        employeeId,
        status: 'pending_verification',
        riskRating: 'medium',
        isPep: false,
        sanctionScreeningPassed: false,
        requirements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updates
      };
      updatedRecords = [...ficaRecords, newRec];
    }
    setFicaRecords(updatedRecords);
    localStorage.setItem('hrm_fica_records', JSON.stringify(updatedRecords));
  };

  const verifyFicaRequirement = (
    employeeId: string, 
    requirementId: string, 
    status: 'compliant' | 'rejected', 
    notes?: string, 
    expiryDate?: string, 
    officerName?: string
  ) => {
    const record = ficaRecords.find(r => r.employeeId === employeeId);
    if (!record) return;

    const updatedRequirements = record.requirements.map(req => {
      if (req.id === requirementId) {
        return {
          ...req,
          status,
          verifiedBy: officerName || 'Compliance Officer (M. Venter)',
          verifiedAt: new Date().toISOString(),
          notes: notes || (status === 'compliant' ? 'Statutory requirement verified.' : 'Discrepancy identified.'),
          expiryDate: expiryDate || req.expiryDate
        };
      }
      return req;
    });

    // Compute overall status
    const allCompliant = updatedRequirements.every(r => r.status === 'compliant');
    const hasRejected = updatedRequirements.some(r => r.status === 'rejected');
    const newStatus: FicaComplianceRecord['status'] = allCompliant 
      ? 'compliant' 
      : hasRejected 
        ? 'non_compliant' 
        : 'partially_compliant';

    updateFicaRecord(employeeId, {
      requirements: updatedRequirements,
      status: newStatus,
      lastAuditedAt: new Date().toISOString(),
      auditedBy: officerName || 'Compliance Officer (M. Venter)'
    });
  };

  const submitFicaRequirementDocument = (
    employeeId: string, 
    requirementType: FicaRequirement['type'], 
    docData: { name: string; fileData?: string; type: string; size: number }
  ) => {
    // 1. Add to central documents
    const newDoc = addDocument({
      employeeId,
      name: docData.name,
      fileName: docData.name,
      type: docData.type,
      size: docData.size,
      category: requirementType === 'id_document' ? 'fica_id' : 
                requirementType === 'proof_of_address' ? 'fica_proof_of_address' : 
                requirementType === 'bank_confirmation' ? 'fica_bank_statement' : 
                requirementType === 'tax_number' ? 'tax_document' : 'other',
      uploadedBy: 'Employee Self-Service',
      isConfidential: true,
      accessLevel: 'hr_only',
      fileData: docData.fileData,
      verificationStatus: 'pending'
    });

    // 2. Link to FICA requirement
    const record = ficaRecords.find(r => r.employeeId === employeeId);
    if (record) {
      const updatedReqs = record.requirements.map(req => {
        if (req.type === requirementType) {
          return {
            ...req,
            status: 'pending_review' as const,
            documentId: newDoc.id,
            documentName: newDoc.name,
            fileData: docData.fileData,
            uploadedAt: new Date().toISOString(),
            notes: 'New document submitted by employee. Pending compliance review.'
          };
        }
        return req;
      });
      updateFicaRecord(employeeId, {
        requirements: updatedReqs,
        status: 'pending_verification'
      });
    }
  };

  const getPendingProfileChangeRequests = () => {
    return profileChangeRequests.filter(req => req.status === 'pending');
  };

  const getNotificationsByUser = (userId: string) => {
    return notifications.filter(notif => notif.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getUnreadNotificationCount = (userId: string) => {
    return notifications.filter(notif => notif.userId === userId && !notif.read).length;
  };

  const getEmployeesByDepartment = (departmentName: string) => {
    return employees.filter(emp => emp.jobInfo.department === departmentName);
  };

  const getLeaveRequestsByEmployee = (employeeId: string) => {
    return leaveRequests.filter(req => req.employeeId === employeeId);
  };

  const getLeaveBalance = (employeeId: string, leaveTypeId: string) => {
    return leaveBalances.find(
      balance => balance.employeeId === employeeId && balance.leaveTypeId === leaveTypeId
    );
  };

  const getDocumentsByEmployee = (employeeId: string) => {
    return documents.filter(doc => doc.employeeId === employeeId);
  };

  const getFicaRecordByEmployee = (employeeId: string) => {
    return ficaRecords.find(rec => rec.employeeId === employeeId);
  };

  const setCurrentTenant = (tenant: Tenant) => {
    setCurrentTenantState(tenant);
    localStorage.setItem('hrm_current_tenant', JSON.stringify(tenant));
    addAuditLog({
      actorId: 'system',
      actorName: 'Active User',
      actorRole: 'admin',
      action: 'UPDATE',
      entity: 'Setting',
      entityId: tenant.id,
      entityDescription: `Switched active corporate tenant to ${tenant.name} (${tenant.country})`,
      ipAddress: '127.0.0.1'
    });
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'tenantId'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: currentTenant.id,
      timestamp: new Date().toISOString()
    };
    const updated = [newEntry, ...auditLogs];
    setAuditLogs(updated);
    localStorage.setItem('hrm_audit_logs', JSON.stringify(updated));
  };

  const approveWorkflowItem = (id: string, approverName: string, comments?: string) => {
    const target = workflowApprovals.find(i => i.id === id);
    if (!target) return;
    const isFinalStep = target.currentStep >= target.totalSteps;
    const nextStatus = isFinalStep ? 'approved' : 'pending';
    const nextStep = isFinalStep ? target.currentStep : target.currentStep + 1;

    const updated = workflowApprovals.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: nextStatus as WorkflowApprovalItem['status'],
          currentStep: nextStep,
          auditTrail: [
            ...item.auditTrail,
            {
              step: item.currentStep,
              approverName,
              action: 'approved' as const,
              comments: comments || 'Approved in accordance with company policy',
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return item;
    });
    setWorkflowApprovals(updated);
    localStorage.setItem('hrm_workflow_approvals', JSON.stringify(updated));

    addAuditLog({
      actorId: 'approver',
      actorName: approverName,
      actorRole: 'manager',
      action: 'APPROVE',
      entity: 'Workflow',
      entityId: id,
      entityDescription: `Approved workflow item: ${target.title} (Step ${target.currentStep} of ${target.totalSteps})`,
      previousValue: target.status,
      newValue: nextStatus,
      ipAddress: '196.21.144.12'
    });
  };

  const rejectWorkflowItem = (id: string, approverName: string, comments?: string) => {
    const target = workflowApprovals.find(i => i.id === id);
    if (!target) return;

    const updated = workflowApprovals.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'rejected' as const,
          auditTrail: [
            ...item.auditTrail,
            {
              step: item.currentStep,
              approverName,
              action: 'rejected' as const,
              comments: comments || 'Declined during review',
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return item;
    });
    setWorkflowApprovals(updated);
    localStorage.setItem('hrm_workflow_approvals', JSON.stringify(updated));

    addAuditLog({
      actorId: 'approver',
      actorName: approverName,
      actorRole: 'manager',
      action: 'REJECT',
      entity: 'Workflow',
      entityId: id,
      entityDescription: `Rejected workflow item: ${target.title}`,
      previousValue: target.status,
      newValue: 'rejected',
      ipAddress: '196.21.144.12'
    });
  };

  const delegateWorkflowItem = (id: string, delegatedTo: string, approverName: string) => {
    const updated = workflowApprovals.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'delegated' as const,
          auditTrail: [
            ...item.auditTrail,
            {
              step: item.currentStep,
              approverName,
              action: 'delegated' as const,
              comments: `Delegated approval responsibility to ${delegatedTo}`,
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return item;
    });
    setWorkflowApprovals(updated);
    localStorage.setItem('hrm_workflow_approvals', JSON.stringify(updated));
  };

  const addJobRequisition = (reqData: Omit<JobRequisition, 'id' | 'createdAt' | 'tenantId'>) => {
    const newReq: JobRequisition = {
      ...reqData,
      id: `req-${Date.now()}`,
      tenantId: currentTenant.id,
      createdAt: new Date().toISOString()
    };
    const updated = [newReq, ...jobRequisitions];
    setJobRequisitions(updated);
    localStorage.setItem('hrm_job_requisitions', JSON.stringify(updated));
  };

  const addCandidate = (candData: Omit<Candidate, 'id' | 'appliedDate' | 'tenantId'>) => {
    const newCand: Candidate = {
      ...candData,
      id: `cand-${Date.now()}`,
      tenantId: currentTenant.id,
      appliedDate: new Date().toISOString().split('T')[0]
    };
    const updated = [newCand, ...candidates];
    setCandidates(updated);
    localStorage.setItem('hrm_candidates', JSON.stringify(updated));
  };

  const updateCandidateStage = (id: string, stage: Candidate['stage'], feedback?: string) => {
    const updated = candidates.map(c => {
      if (c.id === id) {
        return {
          ...c,
          stage,
          interviewerFeedback: feedback ? `${c.interviewerFeedback || ''} [${new Date().toLocaleDateString()}]: ${feedback}` : c.interviewerFeedback
        };
      }
      return c;
    });
    setCandidates(updated);
    localStorage.setItem('hrm_candidates', JSON.stringify(updated));
  };

  const convertCandidateToEmployee = (candidateId: string): Employee => {
    const cand = candidates.find(c => c.id === candidateId);
    if (!cand) throw new Error('Candidate not found');

    const names = cand.name.split(' ');
    const firstName = names[0] || 'New';
    const lastName = names.slice(1).join(' ') || 'Employee';
    const generatedEmployeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEmp: Employee = {
      id: Date.now().toString(),
      employeeId: generatedEmployeeId,
      personalInfo: {
        firstName,
        lastName,
        email: cand.email,
        phone: cand.phone || '+1 (876) 555-0100',
        dateOfBirth: '1995-05-15',
        address: {
          street: '12 Trafalgar Road',
          city: 'Kingston',
          state: 'St. Andrew',
          zipCode: 'JMAKN05',
          country: currentTenant.country
        },
        emergencyContact: {
          name: 'Primary Contact',
          relationship: 'Next of Kin',
          phone: cand.phone || '+1 (876) 555-0101'
        }
      },
      jobInfo: {
        jobTitle: cand.jobTitle,
        department: 'Operations',
        reportingManager: 'Marcus Sterling',
        employmentStatus: 'active',
        hireDate: new Date().toISOString().split('T')[0],
        workLocation: `${currentTenant.name} HQ`,
        employmentType: 'full_time',
        salary: 85000
      },
      jobHistory: [],
      qualifications: [],
      documents: [],
      vettingStatus: {
        backgroundCheckCompleted: true,
        backgroundCheckDate: new Date().toISOString(),
        policeRecordCheck: true,
        referenceChecks: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedEmployees = [...employees, newEmp];
    setEmployees(updatedEmployees);
    localStorage.setItem('hrm_employees', JSON.stringify(updatedEmployees));

    // Update candidate stage to hired
    updateCandidateStage(candidateId, 'hired', `Successfully converted to Employee record ${generatedEmployeeId}`);

    // Create onboarding checklist
    const newOnboarding: OnboardingTask[] = [
      {
        id: `onb-${Date.now()}-1`,
        tenantId: currentTenant.id,
        employeeId: newEmp.id,
        employeeName: `${firstName} ${lastName}`,
        department: newEmp.jobInfo.department,
        title: 'Sign Employment Contract & Tax Declaration',
        category: 'hr_paperwork',
        assignedTo: 'HR Operations',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        status: 'pending'
      },
      {
        id: `onb-${Date.now()}-2`,
        tenantId: currentTenant.id,
        employeeId: newEmp.id,
        employeeName: `${firstName} ${lastName}`,
        department: newEmp.jobInfo.department,
        title: 'Submit 90-Day FICA Proof of Address & Certified ID',
        category: 'compliance_training',
        assignedTo: `${firstName} ${lastName}`,
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        status: 'pending'
      }
    ];
    const updatedTasks = [...onboardingTasks, ...newOnboarding];
    setOnboardingTasks(updatedTasks);
    localStorage.setItem('hrm_onboarding_tasks', JSON.stringify(updatedTasks));

    addAuditLog({
      actorId: 'recruitment',
      actorName: 'Talent Acquisition Team',
      actorRole: 'hr_admin',
      action: 'CREATE',
      entity: 'Employee',
      entityId: newEmp.id,
      entityDescription: `Converted Candidate ${cand.name} to Core HR Employee (${newEmp.employeeId})`,
      newValue: `Role: ${newEmp.jobInfo.jobTitle}`,
      ipAddress: '127.0.0.1'
    });

    return newEmp;
  };

  const updateOnboardingTask = (id: string, status: OnboardingTask['status']) => {
    const updated = onboardingTasks.map(t => (t.id === id ? { ...t, status } : t));
    setOnboardingTasks(updated);
    localStorage.setItem('hrm_onboarding_tasks', JSON.stringify(updated));
  };

  const updateExitClearanceItem = (clearanceId: string, department: string, cleared: boolean, notes?: string) => {
    const updated = exitClearances.map(c => {
      if (c.id === clearanceId) {
        const updatedItems = c.items.map(it => {
          if (it.department === department) {
            return {
              ...it,
              cleared,
              clearedBy: 'Department Officer',
              clearedAt: new Date().toISOString(),
              notes: notes || it.notes
            };
          }
          return it;
        });
        const allCleared = updatedItems.every(i => i.cleared);
        return {
          ...c,
          items: updatedItems,
          status: (allCleared ? 'settlement_ready' : 'clearance_in_progress') as ExitClearance['status']
        };
      }
      return c;
    });
    setExitClearances(updated);
    localStorage.setItem('hrm_exit_clearances', JSON.stringify(updated));
  };

  const addHRCase = (hrCaseData: Omit<HRCase, 'id' | 'caseNumber' | 'createdAt' | 'tenantId' | 'replies'>) => {
    const caseNumber = `HRC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newCase: HRCase = {
      ...hrCaseData,
      id: `case-${Date.now()}`,
      caseNumber,
      tenantId: currentTenant.id,
      createdAt: new Date().toISOString(),
      replies: []
    };
    const updated = [newCase, ...hrCases];
    setHrCases(updated);
    localStorage.setItem('hrm_cases', JSON.stringify(updated));
  };

  const addCaseReply = (caseId: string, replyData: { sender: string; message: string; isInternal: boolean }) => {
    const updated = hrCases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          status: replyData.isInternal ? c.status : ('in_progress' as HRCase['status']),
          replies: [
            ...c.replies,
            {
              id: `rep-${Date.now()}`,
              ...replyData,
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return c;
    });
    setHrCases(updated);
    localStorage.setItem('hrm_cases', JSON.stringify(updated));
  };

  const updateCaseStatus = (caseId: string, status: HRCase['status']) => {
    const updated = hrCases.map(c => (c.id === caseId ? { ...c, status } : c));
    setHrCases(updated);
    localStorage.setItem('hrm_cases', JSON.stringify(updated));
  };

  const bulkImportEmployees = (importedEmployees: Record<string, string>[]): { successCount: number; errors: string[] } => {
    const errors: string[] = [];
    const validToAdd: Employee[] = [];
    const existingEmails = new Set(employees.map(e => e.personalInfo.email.toLowerCase()));
    const existingEmpIds = new Set(employees.map(e => e.employeeId.toUpperCase()));

    importedEmployees.forEach((item, index) => {
      const rowNum = index + 1;
      const email = (item.email || '').trim().toLowerCase();
      const firstName = (item.firstName || '').trim();
      const lastName = (item.lastName || '').trim();
      const jobTitle = (item.jobTitle || 'Staff Member').trim();
      const department = (item.department || 'Operations').trim();
      const salary = Number(item.salary) || 60000;
      let empId = (item.employeeId || '').trim().toUpperCase();

      if (!email || !email.includes('@')) {
        errors.push(`Row #${rowNum}: Invalid or missing email address`);
        return;
      }
      if (existingEmails.has(email)) {
        errors.push(`Row #${rowNum}: Duplicate email ${email} already registered`);
        return;
      }
      if (!firstName || !lastName) {
        errors.push(`Row #${rowNum}: Missing mandatory first or last name`);
        return;
      }

      if (!empId || existingEmpIds.has(empId)) {
        empId = `EMP-${Math.floor(2000 + Math.random() * 8000)}`;
      }

      existingEmails.add(email);
      existingEmpIds.add(empId);

      const parsedEmpType: Employee['jobInfo']['employmentType'] = 
        item.employmentType === 'part_time' ? 'part_time' :
        item.employmentType === 'contract' ? 'contract' :
        item.employmentType === 'intern' ? 'intern' : 'full_time';

      const newEmp: Employee = {
        id: `emp-bulk-${Date.now()}-${index}`,
        employeeId: empId,
        personalInfo: {
          firstName,
          lastName,
          email,
          phone: item.phone || '+1 (876) 555-0100',
          dateOfBirth: item.dateOfBirth || '1992-06-15',
          address: {
            street: item.street || 'Corporate Boulevard',
            city: item.city || 'Kingston',
            state: item.state || 'St. Andrew',
            zipCode: item.zipCode || 'JMAKN01',
            country: currentTenant.country
          },
          emergencyContact: {
            name: item.emergencyContactName || 'Family Member',
            relationship: 'Relative',
            phone: item.emergencyContactPhone || '+1 (876) 555-0101'
          }
        },
        jobInfo: {
          jobTitle,
          department,
          reportingManager: 'Marcus Sterling',
          employmentStatus: 'active',
          hireDate: item.hireDate || new Date().toISOString().split('T')[0],
          workLocation: item.workLocation || `${currentTenant.name} Main Office`,
          employmentType: parsedEmpType,
          salary
        },
        jobHistory: [],
        qualifications: [],
        documents: [],
        vettingStatus: {
          backgroundCheckCompleted: true,
          backgroundCheckDate: new Date().toISOString(),
          policeRecordCheck: true,
          referenceChecks: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      validToAdd.push(newEmp);
    });

    if (validToAdd.length > 0) {
      const updated = [...employees, ...validToAdd];
      setEmployees(updated);
      localStorage.setItem('hrm_employees', JSON.stringify(updated));

      addAuditLog({
        actorId: 'admin',
        actorName: 'System HR Admin',
        actorRole: 'hr_admin',
        action: 'CREATE',
        entity: 'Employee',
        entityId: `bulk-${validToAdd.length}`,
        entityDescription: `Bulk imported ${validToAdd.length} personnel records via CSV upload`,
        newValue: `${validToAdd.length} records added`,
        ipAddress: '127.0.0.1'
      });
    }

    return {
      successCount: validToAdd.length,
      errors
    };
  };

  const getPayrollExport = (month: string): PayrollExportSummary => {
    const records = employees.map(emp => {
      const empLeaves = leaveRequests.filter(l => l.employeeId === emp.id && l.status === 'hr_approved');
      const paidLeaveDays = empLeaves.reduce((acc, l) => acc + l.days, 0);
      const unpaidLeaveDays = 0;
      const standardDays = 22;
      const daysWorked = Math.max(0, standardDays - unpaidLeaveDays);

      const empTimesheets = timesheets.filter(t => t.employeeId === emp.id);
      const overtimeHours = empTimesheets.reduce((acc, t) => acc + Math.max(0, t.totalHours - 40), 0);
      const hourlyRate = (emp.jobInfo.salary / 12) / 160;
      const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5);
      const monthlyBase = Math.round(emp.jobInfo.salary / 12);
      const grossPayEstimate = monthlyBase + overtimePay;

      return {
        employeeId: emp.employeeId,
        employeeName: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        department: emp.jobInfo.department,
        salary: emp.jobInfo.salary,
        daysWorked,
        paidLeaveDays,
        unpaidLeaveDays,
        overtimeHours,
        overtimePay,
        grossPayEstimate
      };
    });

    return {
      periodMonth: month || new Date().toISOString().slice(0, 7),
      totalEmployees: records.length,
      totalBillableDays: records.reduce((acc, r) => acc + r.daysWorked, 0),
      totalLeaveDays: records.reduce((acc, r) => acc + r.paidLeaveDays, 0),
      totalUnpaidLeaveDays: 0,
      totalOvertimeHours: records.reduce((acc, r) => acc + r.overtimeHours, 0),
      currency: currentTenant.currency,
      records
    };
  };

  return (
    <DataContext.Provider value={{
      employees,
      departments,
      leaveTypes,
      leaveRequests,
      leaveBalances,
      profileChangeRequests,
      performanceReviews,
      jobPostings,
      policyDocuments,
      policyAcknowledgments,
      notifications,
      careerMovements,
      organizationalStructure,
      attendanceRecords,
      timesheets,
      trainingCourses,
      certifications,
      goals,
      systemSettings,
      documents,
      ficaRecords,
      tenants,
      currentTenant,
      setCurrentTenant,
      auditLogs,
      addAuditLog,
      workflowApprovals,
      approveWorkflowItem,
      rejectWorkflowItem,
      delegateWorkflowItem,
      jobRequisitions,
      addJobRequisition,
      candidates,
      addCandidate,
      updateCandidateStage,
      convertCandidateToEmployee,
      onboardingTasks,
      updateOnboardingTask,
      exitClearances,
      updateExitClearanceItem,
      hrCases,
      addHRCase,
      addCaseReply,
      updateCaseStatus,
      knowledgeBase,
      bulkImportEmployees,
      getPayrollExport,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      addLeaveType,
      updateLeaveType,
      deleteLeaveType,
      addLeaveRequest,
      updateLeaveRequest,
      updateLeaveBalance,
      addProfileChangeRequest,
      updateProfileChangeRequest,
      addNotification,
      markNotificationAsRead,
      addPerformanceReview,
      updatePerformanceReview,
      addJobPosting,
      updateJobPosting,
      deleteJobPosting,
      addCareerMovement,
      updateOrganizationalStructure,
      addAttendanceRecord,
      updateAttendanceRecord,
      clockIn,
      clockOut,
      addTimesheet,
      updateTimesheet,
      addTrainingCourse,
      updateTrainingCourse,
      enrollInCourse,
      addCourseMaterial,
      deleteCourseMaterial,
      updateCourseProgress,
      addCertification,
      updateCertification,
      addGoal,
      updateGoal,
      deleteGoal,
      updateSystemSettings,
      addPolicyDocument,
      acknowledgePolicy,
      addDocument,
      deleteDocument,
      verifyDocument,
      signDocument,
      submitProfileUpdateRequest,
      updateFicaRecord,
      verifyFicaRequirement,
      submitFicaRequirementDocument,
      getEmployeesByDepartment,
      getLeaveRequestsByEmployee,
      getLeaveBalance,
      getPendingProfileChangeRequests,
      getNotificationsByUser,
      getUnreadNotificationCount,
      getDocumentsByEmployee,
      getFicaRecordByEmployee,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};