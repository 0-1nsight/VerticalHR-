export type UserRole = 'super_admin' | 'hr_admin' | 'admin' | 'hr_manager' | 'line_manager' | 'supervisor' | 'employee' | 'auditor';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  employeeId?: string;
  tenantId?: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  email?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | string;
    nationalId?: string;
    trn?: string;
    nis?: string;
    taxNumber?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    };
  };
  jobInfo: {
    jobTitle: string;
    department: string;
    reportingManager: string;
    reportsTo?: string;
    supervisorId?: string;
    employmentStatus: 'active' | 'inactive' | 'terminated' | 'resigned';
    hireDate: string;
    workLocation: string;
    employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
    salary: number;
  };
  jobHistory: JobHistoryEntry[];
  qualifications: Qualification[];
  documents: Document[];
  bankInfo?: BankInformation;
  profilePhoto?: string;
  vettingStatus: VettingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JobHistoryEntry {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  reasonForLeaving?: string;
}

export interface Qualification {
  id: string;
  name: string;
  institution: string;
  dateObtained: string;
  expiryDate?: string;
  documentUrl?: string;
  verified: boolean;
}

export interface BankInformation {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  isVerified: boolean;
}

export interface VettingStatus {
  backgroundCheckCompleted: boolean;
  backgroundCheckDate?: string;
  backgroundCheckDocument?: string;
  policeRecordCheck: boolean;
  policeRecordDate?: string;
  policeRecordDocument?: string;
  referenceChecks: ReferenceCheck[];
}

export interface ReferenceCheck {
  id: string;
  referenceName: string;
  company: string;
  position?: string;
  contactInfo?: string;
  phone?: string;
  email?: string;
  relationship?: string;
  feedback?: string;
  recommendation?: string;
  dateContacted?: string;
  checkDate?: string;
  status?: 'pending' | 'completed' | 'failed';
  notes?: string;
}

export interface ProfileChangeRequest {
  id: string;
  employeeId: string;
  requestedBy: string;
  requestType: 'personal_info' | 'contact_info' | 'emergency_contact' | 'bank_info';
  currentData: Record<string, unknown>;
  proposedData: Record<string, unknown>;
  changeData?: Record<string, unknown>;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'supervisor_approved' | 'hr_approved';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  managerId?: string;
  supervisorId?: string;
  employeeCount: number;
  maxLeavePerDay: number;
  parentDepartmentId?: string;
  createdAt: string;
}

export interface OrganizationalStructure {
  id: string;
  name: string;
  departments: Department[];
  positions: Position[];
  reportingStructure: ReportingRelationship[];
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  title: string;
  departmentId: string;
  level: number;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salaryRange: {
    min: number;
    max: number;
  };
}

export interface ReportingRelationship {
  id: string;
  subordinateId: string;
  supervisorId: string;
  relationshipType: 'direct' | 'dotted_line' | 'matrix';
}

export interface JobPosting {
  id: string;
  title: string;
  departmentId: string;
  positionId: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salaryRange?: {
    min: number;
    max: number;
  };
  applicationDeadline: string;
  status: 'draft' | 'published' | 'closed';
  postedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveType {
  id: string;
  name: string;
  allowance: number;
  daysAllowed?: number;
  carryOver: boolean;
  carryOverLimit?: number;
  accrualRate: number;
  description: string;
  requiresApproval: boolean;
  maxConsecutiveDays?: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'supervisor_approved' | 'hr_approved' | 'rejected' | 'approved';
  approverComments?: string;
  supervisorApproval?: ApprovalStep;
  hrApproval?: ApprovalStep;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStep {
  approverId: string;
  approvedAt: string;
  comments?: string;
  status: 'approved' | 'rejected';
}

export interface LeaveBalance {
  employeeId: string;
  leaveTypeId: string;
  allocated: number;
  used: number;
  pending: number;
  available: number;
  carriedForward: number;
  year: number;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewPeriod: {
    startDate: string;
    endDate: string;
  };
  reviewType: 'monthly' | 'quarterly' | 'annual' | 'semi_annual' | 'probationary';
  cycleName?: string; // e.g. "October 2026 Monthly Review", "Q3 2026 Quarterly Evaluation", "2026 Annual Review"
  selfAssessment?: PerformanceAssessment;
  supervisorAssessment?: PerformanceAssessment;
  overallScore?: number;
  finalScore?: number;
  reviewerId?: string;
  feedback?: string;
  status: 'draft' | 'employee_submitted' | 'supervisor_review' | 'in_progress' | 'completed';
  goals: PerformanceGoal[];
  competencies: CompetencyRating[];
  developmentPlan?: string;
  employeeSignature?: {
    signed: boolean;
    signedByName: string;
    signedAt: string;
  };
  managerSignature?: {
    signed: boolean;
    signedByName: string;
    signedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceAssessment {
  ratings: {
    category: string;
    score: number;
    comments: string;
  }[];
  overallComments: string;
  strengths: string[];
  areasForImprovement: string[];
  submittedAt: string;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  weight?: number; // e.g. 25%
  measurableOutcomes: string[];
  selfScore?: number; // 1 to 5
  selfComments?: string;
  managerScore?: number; // 1 to 5
  managerComments?: string;
}

export interface CompetencyRating {
  competencyId: string;
  name?: string;
  category?: string;
  description?: string;
  currentLevel: number;
  targetLevel: number;
  selfRating?: number; // 1 to 5
  selfComments?: string;
  supervisorRating?: number; // 1 to 5
  supervisorComments?: string;
  developmentActions: string[];
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
  levels: CompetencyLevel[];
}

export interface CompetencyLevel {
  level: number;
  name: string;
  description: string;
  behaviors: string[];
}

export interface CareerMovement {
  id: string;
  employeeId: string;
  movementType: 'promotion' | 'transfer' | 'demotion' | 'lateral_move';
  fromPosition: {
    title: string;
    department: string;
    level: number;
  };
  toPosition: {
    title: string;
    department: string;
    level: number;
  };
  effectiveDate: string;
  reason: string;
  approvedBy: string;
  salaryChange?: {
    previousSalary: number;
    newSalary: number;
    changePercentage: number;
  };
  createdAt: string;
}

export interface PolicyDocument {
  id: string;
  title: string;
  description: string;
  category: 'confidentiality' | 'fraud' | 'safety' | 'code_of_conduct' | 'other';
  documentUrl: string;
  version: string;
  isRequired: boolean;
  minimumReadTime: number; // in seconds
  effectiveDate: string;
  expiryDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyAcknowledgment {
  id: string;
  employeeId: string;
  policyDocumentId: string;
  readStartTime: string;
  readEndTime?: string;
  timeSpentReading: number; // in seconds
  acknowledged: boolean;
  acknowledgedAt?: string;
  ipAddress: string;
  deviceInfo: string;
}

export interface Document {
  id: string;
  employeeId?: string;
  name: string;
  fileName?: string;
  type: string;
  size: number;
  uploadDate: string;
  isCompanyWide?: boolean;
  category: 'qualification' | 'certification' | 'photo' | 'identity' | 'fica_proof_of_address' | 'fica_id' | 'fica_bank_statement' | 'tax_document' | 'contract' | 'performance' | 'personal' | 'vetting' | 'policy' | 'other';
  uploadedBy: string;
  isConfidential: boolean;
  accessLevel: 'public' | 'hr_only' | 'supervisor_and_hr' | 'employee_and_hr';
  fileData?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  expiryDate?: string;
  requiresSignature?: boolean;
  signature?: {
    signed: boolean;
    signedByName: string;
    signedAt: string;
    signatureType: 'digital_acceptance' | 'drawn';
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'leave_request' | 'profile_change' | 'birthday' | 'anniversary';
  read: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  recordId: string;
  changes: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface SystemSettings {
  id: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string;
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  timeZone: string;
  dateFormat: string;
  currency: string;
  leaveYearStart: string; // MM-DD format
  probationPeriod: number; // in months
  notificationSettings: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  securitySettings: {
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    sessionTimeout: number; // in minutes
    maxLoginAttempts: number;
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  workingHours: number;
  notes?: string;
}

export interface TimesheetEntry {
  id: string;
  day: string;
  date: string;
  project: string;
  task: string;
  hours: number;
}

export interface TimesheetRecord {
  id: string;
  employeeId: string;
  weekStartDate: string;
  weekEndDate: string;
  entries: TimesheetEntry[];
  totalHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  comments?: string;
  submittedAt?: string;
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'ppt' | 'doc' | 'link';
  urlOrData: string;
  fileName?: string;
  description?: string;
  durationMinutes?: number;
  fileSize?: string;
  uploadedAt: string;
  isRequired?: boolean;
}

export interface TrainingCourse {
  id: string;
  title: string;
  code: string;
  category: string;
  instructor: string;
  durationHours: number;
  description: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  enrolledEmployeeIds: string[];
  completionRate: number;
  materials?: CourseMaterial[];
}

export interface CertificationRecord {
  id: string;
  employeeId: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  status: 'active' | 'expiring_soon' | 'expired';
}

export interface GoalRecord {
  id: string;
  employeeId?: string;
  department?: string;
  category: 'individual' | 'department' | 'company';
  title: string;
  description: string;
  targetDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  measurableOutcomes: string[];
}

export interface FicaRequirement {
  id: string;
  type: 'id_document' | 'proof_of_address' | 'bank_confirmation' | 'tax_number' | 'pep_declaration' | 'criminal_clearance';
  title: string;
  description: string;
  status: 'compliant' | 'pending_review' | 'rejected' | 'expired' | 'missing';
  documentId?: string;
  documentName?: string;
  fileData?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  expiryDate?: string; // e.g. proof of address valid max 90 days in financial sector
  notes?: string;
}

export interface FicaComplianceRecord {
  id: string;
  employeeId: string;
  status: 'compliant' | 'partially_compliant' | 'pending_verification' | 'non_compliant';
  riskRating: 'low' | 'medium' | 'high';
  lastAuditedAt?: string;
  auditedBy?: string;
  requirements: FicaRequirement[];
  isPep: boolean; // Politically Exposed Person declaration
  pepDetails?: string;
  sanctionScreeningPassed: boolean;
  sanctionScreeningDate?: string;
  complianceOfficerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  country: string;
  locale: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  fiscalYearStartMonth: number;
  isActive: boolean;
  maxEmployees: number;
  dataRetentionYears: number;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT' | 'LOGIN' | 'DELEGATE' | 'SIGN' | string;
  entity: 'Employee' | 'LeaveRequest' | 'Salary' | 'Document' | 'FicaRecord' | 'JobPosting' | 'Promotion' | 'Workflow' | 'Setting' | 'EMPLOYEE_PROFILE' | 'PROFILE_CHANGE_REQUEST' | 'DOCUMENT' | string;
  entityId: string;
  entityDescription: string;
  previousValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
}

export interface WorkflowApprovalItem {
  id: string;
  tenantId: string;
  type: 'leave' | 'profile_change' | 'promotion' | 'requisition' | 'document' | 'travel';
  title: string;
  requesterId: string;
  requesterName: string;
  department: string;
  currentStep: number;
  totalSteps: number;
  currentApproverRole: UserRole;
  currentApproverId?: string;
  assignedRole?: UserRole;
  assignedTo?: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated';
  urgency: 'low' | 'normal' | 'high';
  submittedAt: string;
  dueDate: string;
  details: Record<string, unknown>;
  history?: {
    step: number;
    approverName: string;
    action: string;
    comments?: string;
    timestamp: string;
  }[];
  auditTrail: {
    step: number;
    approverName: string;
    action: 'approved' | 'rejected' | 'delegated' | 'submitted';
    comments?: string;
    timestamp: string;
  }[];
}

export interface JobRequisition {
  id: string;
  tenantId: string;
  title: string;
  department: string;
  hiringManager: string;
  location: string;
  headcount: number;
  employmentType: 'full_time' | 'part_time' | 'contract';
  salaryBudget: {
    min: number;
    max: number;
    currency: string;
  };
  urgency: 'normal' | 'urgent';
  status: 'draft' | 'pending_approval' | 'approved' | 'open' | 'closed';
  targetStartDate: string;
  jobDescription: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  tenantId: string;
  requisitionId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  score: number; // 1 to 5
  appliedDate: string;
  resumeFileName?: string;
  notes?: string;
  interviewerFeedback?: string;
  source: 'LinkedIn' | 'Careers Portal' | 'Referral' | 'Recruiter';
}

export interface OnboardingTask {
  id: string;
  tenantId?: string;
  employeeId?: string;
  employeeName?: string;
  candidateId?: string;
  candidateName?: string;
  jobTitle?: string;
  department?: string;
  title: string;
  category: 'it_setup' | 'hr_paperwork' | 'compliance_training' | 'manager_checkin';
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  requiredDocumentCategory?: string;
}

export interface ExitClearance {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  resignationDate: string;
  finalWorkingDay: string;
  reason: string;
  status: 'notice_period' | 'clearance_in_progress' | 'settlement_ready' | 'archived';
  items: {
    department: 'IT Equipment' | 'Finance / Travel Float' | 'Security Badge' | 'Knowledge Transfer';
    cleared: boolean;
    clearedBy?: string;
    clearedAt?: string;
    notes?: string;
  }[];
}

export interface HRCase {
  id: string;
  tenantId: string;
  caseNumber: string;
  employeeId: string;
  employeeName: string;
  department: string;
  category: 'payroll' | 'benefits' | 'grievance' | 'policy' | 'it' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'waiting_employee' | 'resolved' | 'closed';
  subject: string;
  description: string;
  slaDueAt: string;
  assignedTo: string;
  createdAt: string;
  replies: {
    id: string;
    sender: string;
    message: string;
    timestamp: string;
    isInternal: boolean;
  }[];
}

export interface KnowledgeBaseArticle {
  id: string;
  tenantId: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  views: number;
  helpfulCount: number;
}

export interface HRLetterTemplate {
  id: string;
  name: string;
  type: 'employment_verification' | 'salary_confirmation' | 'visa_support' | 'probation_confirmation';
  subject: string;
  bodyTemplate: string;
}

export interface PayrollExportSummary {
  periodMonth: string;
  totalEmployees: number;
  totalBillableDays: number;
  totalLeaveDays: number;
  totalUnpaidLeaveDays: number;
  totalOvertimeHours: number;
  currency: string;
  records: {
    employeeId: string;
    employeeName: string;
    department: string;
    salary: number;
    daysWorked: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    overtimeHours: number;
    overtimePay: number;
    grossPayEstimate: number;
  }[];
}