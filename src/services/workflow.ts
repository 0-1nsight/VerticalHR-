/**
 * VerticalHR Generic Multi-Step Workflow Engine
 * Powers approval lifecycles for profile updates, promotions, requisitions, leave, and documents.
 * Supports configurable steps, role resolution, delegation, escalation timers, and audit logging.
 */

import { computeAuditHash, AuditLogPayload } from './audit';
import { UserRole } from '../../packages/shared/src/rbac/permissions';

export interface WorkflowStepConfig {
  step: number;
  name: string;
  approverRole: UserRole;
  escalationHours?: number;
}

export interface WorkflowHistoryEntry {
  step: number;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 'submitted' | 'approved' | 'rejected' | 'delegated' | 'escalated';
  comments?: string;
  timestamp: string;
}

export interface WorkflowInstance {
  id: string;
  tenantId: string;
  entityType: 'profile_change' | 'promotion' | 'leave' | 'document' | 'travel';
  entityId: string;
  title: string;
  requesterId: string;
  requesterName: string;
  department: string;
  currentStep: number;
  totalSteps: number;
  stepsConfig: WorkflowStepConfig[];
  currentApproverRole: UserRole;
  currentApproverId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated' | 'escalated';
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  payload: Record<string, unknown>;
  history: WorkflowHistoryEntry[];
  submittedAt: string;
  dueDate: string;
  updatedAt: string;
}

/**
 * Initializes a new multi-step workflow instance with configurable approval stages.
 */
export function createWorkflowInstance(params: {
  tenantId: string;
  entityType: WorkflowInstance['entityType'];
  entityId: string;
  title: string;
  requesterId: string;
  requesterName: string;
  department: string;
  payload: Record<string, unknown>;
  stepsConfig: WorkflowStepConfig[];
  urgency?: WorkflowInstance['urgency'];
}): WorkflowInstance {
  const now = new Date().toISOString();
  const firstStep = params.stepsConfig[0];
  const defaultDueDate = new Date(Date.now() + (firstStep.escalationHours || 48) * 3600 * 1000).toISOString();

  return {
    id: `wf-${crypto.randomUUID()}`,
    tenantId: params.tenantId,
    entityType: params.entityType,
    entityId: params.entityId,
    title: params.title,
    requesterId: params.requesterId,
    requesterName: params.requesterName,
    department: params.department,
    currentStep: 1,
    totalSteps: params.stepsConfig.length,
    stepsConfig: params.stepsConfig,
    currentApproverRole: firstStep.approverRole,
    status: 'pending',
    urgency: params.urgency || 'normal',
    payload: params.payload,
    history: [
      {
        step: 1,
        actorId: params.requesterId,
        actorName: params.requesterName,
        actorRole: 'requester',
        action: 'submitted',
        comments: 'Workflow initiated and queued for approval.',
        timestamp: now,
      },
    ],
    submittedAt: now,
    dueDate: defaultDueDate,
    updatedAt: now,
  };
}

/**
 * Advances a workflow step upon approval. Finalizes status if last step is reached.
 */
export async function advanceWorkflowStep(
  wf: WorkflowInstance,
  actor: { id: string; name: string; role: string },
  comments?: string,
  prevAuditHash = '0000000000000000000000000000000000000000000000000000000000000000'
): Promise<{ updatedWorkflow: WorkflowInstance; auditEntry: AuditLogPayload }> {
  if (wf.status !== 'pending') {
    throw new Error(`Cannot approve workflow: status is already '${wf.status}'.`);
  }

  const now = new Date().toISOString();
  const currentStepNum = wf.currentStep;
  const isFinalStep = currentStepNum >= wf.totalSteps;

  const nextStepNum = isFinalStep ? currentStepNum : currentStepNum + 1;
  const nextConfig = wf.stepsConfig[nextStepNum - 1];

  const updatedHistory: WorkflowHistoryEntry[] = [
    ...wf.history,
    {
      step: currentStepNum,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'approved',
      comments: comments || 'Approved',
      timestamp: now,
    },
  ];

  const updatedWorkflow: WorkflowInstance = {
    ...wf,
    currentStep: nextStepNum,
    status: isFinalStep ? 'approved' : 'pending',
    currentApproverRole: nextConfig ? nextConfig.approverRole : wf.currentApproverRole,
    history: updatedHistory,
    updatedAt: now,
  };

  // Generate audit record
  const auditId = crypto.randomUUID();
  const auditData: Omit<AuditLogPayload, 'currentHash' | 'previousHash'> = {
    id: auditId,
    tenantId: wf.tenantId,
    actorId: actor.id,
    actorRole: actor.role,
    action: isFinalStep ? 'APPROVE' : 'UPDATE',
    entity: 'Workflow',
    entityId: wf.id,
    entityDescription: `${wf.title} - Step ${currentStepNum} approved by ${actor.name}${isFinalStep ? ' (Finalized)' : ''}`,
    changes: {
      step: currentStepNum,
      isFinalStep,
      status: updatedWorkflow.status,
      comments,
    },
    ipAddress: '127.0.0.1',
    timestamp: now,
  };

  const currentHash = await computeAuditHash(prevAuditHash, auditData);

  return {
    updatedWorkflow,
    auditEntry: {
      ...auditData,
      previousHash: prevAuditHash,
      currentHash,
    },
  };
}

/**
 * Rejects a workflow instance at the current step.
 */
export async function rejectWorkflowStep(
  wf: WorkflowInstance,
  actor: { id: string; name: string; role: string },
  reason: string,
  prevAuditHash = '0000000000000000000000000000000000000000000000000000000000000000'
): Promise<{ updatedWorkflow: WorkflowInstance; auditEntry: AuditLogPayload }> {
  const now = new Date().toISOString();

  const updatedHistory: WorkflowHistoryEntry[] = [
    ...wf.history,
    {
      step: wf.currentStep,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'rejected',
      comments: reason,
      timestamp: now,
    },
  ];

  const updatedWorkflow: WorkflowInstance = {
    ...wf,
    status: 'rejected',
    history: updatedHistory,
    updatedAt: now,
  };

  const auditId = crypto.randomUUID();
  const auditData: Omit<AuditLogPayload, 'currentHash' | 'previousHash'> = {
    id: auditId,
    tenantId: wf.tenantId,
    actorId: actor.id,
    actorRole: actor.role,
    action: 'REJECT',
    entity: 'Workflow',
    entityId: wf.id,
    entityDescription: `${wf.title} - Step ${wf.currentStep} rejected by ${actor.name}: "${reason}"`,
    changes: { reason, status: 'rejected' },
    ipAddress: '127.0.0.1',
    timestamp: now,
  };

  const currentHash = await computeAuditHash(prevAuditHash, auditData);

  return {
    updatedWorkflow,
    auditEntry: {
      ...auditData,
      previousHash: prevAuditHash,
      currentHash,
    },
  };
}

/**
 * Delegates workflow approval to an alternate user or role.
 */
export async function delegateWorkflowStep(
  wf: WorkflowInstance,
  actor: { id: string; name: string; role: string },
  targetRole: UserRole,
  targetUserId: string,
  targetUserName: string,
  reason: string,
  prevAuditHash = '0000000000000000000000000000000000000000000000000000000000000000'
): Promise<{ updatedWorkflow: WorkflowInstance; auditEntry: AuditLogPayload }> {
  const now = new Date().toISOString();

  const updatedHistory: WorkflowHistoryEntry[] = [
    ...wf.history,
    {
      step: wf.currentStep,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'delegated',
      comments: `Delegated to ${targetUserName} (${targetRole}): ${reason}`,
      timestamp: now,
    },
  ];

  const updatedWorkflow: WorkflowInstance = {
    ...wf,
    currentApproverRole: targetRole,
    currentApproverId: targetUserId,
    history: updatedHistory,
    updatedAt: now,
  };

  const auditId = crypto.randomUUID();
  const auditData: Omit<AuditLogPayload, 'currentHash' | 'previousHash'> = {
    id: auditId,
    tenantId: wf.tenantId,
    actorId: actor.id,
    actorRole: actor.role,
    action: 'DELEGATE',
    entity: 'Workflow',
    entityId: wf.id,
    entityDescription: `Delegated approval to ${targetUserName} (${targetRole})`,
    changes: { targetUserId, targetRole, reason },
    ipAddress: '127.0.0.1',
    timestamp: now,
  };

  const currentHash = await computeAuditHash(prevAuditHash, auditData);

  return {
    updatedWorkflow,
    auditEntry: {
      ...auditData,
      previousHash: prevAuditHash,
      currentHash,
    },
  };
}
