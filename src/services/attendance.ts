/**
 * VerticalHR Time & Attendance Engine
 * Provides offline punch queue with idempotency, GPS Geofencing (Haversine formula),
 * Overtime & pay-policy calculation, and strict payroll timesheet locking with audited reopens.
 */

export interface WorkSiteLocation {
  id: string;
  tenantId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface AttendancePunchInput {
  tenantId: string;
  employeeId: string;
  punchType: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  punchTime: string; // ISO string
  latitude?: number;
  longitude?: number;
  deviceInfo?: string;
  isOfflineSync?: boolean;
}

export interface AttendancePunchRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  punchType: string;
  punchTime: string;
  idempotencyKey: string;
  geofenceStatus: 'inside' | 'outside' | 'bypassed' | 'unknown';
  distanceMeters?: number;
  workSiteName?: string;
  isOfflineSync: boolean;
  syncedAt: string;
}

export interface OvertimePolicyConfig {
  dailyThresholdHours: number; // e.g. 8.0 hrs
  weeklyThresholdHours: number; // e.g. 40.0 hrs
  multiplierStandard: number; // 1.5x
  multiplierSundayHoliday: number; // 2.0x
  autoBreakDeductionMinutes: number; // 30 mins
  breakTriggerHours: number; // after 5 hours
  roundingMinutes: number; // 15 mins
}

export interface ShiftCalculationResult {
  rawHours: number;
  roundedHours: number;
  breakDeductionHours: number;
  netRegularHours: number;
  netOvertimeHours: number;
  netHolidayDoubleTimeHours: number;
}

export interface TimesheetPeriod {
  id: string;
  tenantId: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  isLocked: boolean;
  lockedAt?: string;
  reopenReason?: string;
  entries: Array<{ date: string; hours: number; task: string }>;
}

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Verifies whether user coordinates fall within the configured work site geofence perimeter.
 */
export function verifyGeofence(
  userLat: number,
  userLon: number,
  site: WorkSiteLocation
): { status: 'inside' | 'outside'; distanceMeters: number } {
  const distance = calculateHaversineDistanceMeters(userLat, userLon, site.latitude, site.longitude);
  const isInside = distance <= site.radiusMeters;
  return {
    status: isInside ? 'inside' : 'outside',
    distanceMeters: distance,
  };
}

/**
 * In-memory / persistent punch synchronization store ensuring idempotent processing.
 */
class AttendancePunchProcessor {
  private processedKeys = new Set<string>();
  private punches: AttendancePunchRecord[] = [];

  public processPunch(
    input: AttendancePunchInput,
    workSites: WorkSiteLocation[] = []
  ): { punch: AttendancePunchRecord; isDuplicate: boolean } {
    // Generate deterministic idempotency key rounded to second
    const timeMs = new Date(input.punchTime).getTime();
    const roundedSeconds = Math.floor(timeMs / 1000);
    const idempotencyKey = `punch:${input.tenantId}:${input.employeeId}:${input.punchType}:${roundedSeconds}`;

    // Idempotency: exact once-and-only-once execution
    if (this.processedKeys.has(idempotencyKey)) {
      const existing = this.punches.find((p) => p.idempotencyKey === idempotencyKey)!;
      return { punch: existing, isDuplicate: true };
    }

    let geofenceStatus: AttendancePunchRecord['geofenceStatus'] = 'unknown';
    let distanceMeters: number | undefined;
    let workSiteName: string | undefined;

    if (input.latitude !== undefined && input.longitude !== undefined && workSites.length > 0) {
      // Find closest work site
      let closestDistance = Infinity;
      let closestSite = workSites[0];

      for (const site of workSites) {
        const d = calculateHaversineDistanceMeters(input.latitude, input.longitude, site.latitude, site.longitude);
        if (d < closestDistance) {
          closestDistance = d;
          closestSite = site;
        }
      }

      const check = verifyGeofence(input.latitude, input.longitude, closestSite);
      geofenceStatus = check.status;
      distanceMeters = check.distanceMeters;
      workSiteName = closestSite.name;
    } else if (input.latitude === undefined) {
      geofenceStatus = 'bypassed';
    }

    const record: AttendancePunchRecord = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      punchType: input.punchType,
      punchTime: input.punchTime,
      idempotencyKey,
      geofenceStatus,
      distanceMeters,
      workSiteName,
      isOfflineSync: input.isOfflineSync ?? false,
      syncedAt: new Date().toISOString(),
    };

    this.processedKeys.add(idempotencyKey);
    this.punches.push(record);

    return { punch: record, isDuplicate: false };
  }

  public getPunches(employeeId?: string): AttendancePunchRecord[] {
    if (!employeeId) return [...this.punches];
    return this.punches.filter((p) => p.employeeId === employeeId);
  }
}

export const punchProcessor = new AttendancePunchProcessor();

/**
 * Calculates working hours, overtime hours, and statutory double-time according to configured policy.
 */
export function calculateShiftOvertime(params: {
  clockInTime: string; // ISO
  clockOutTime: string; // ISO
  policy: OvertimePolicyConfig;
  isSundayOrHoliday?: boolean;
}): ShiftCalculationResult {
  const { clockInTime, clockOutTime, policy, isSundayOrHoliday = false } = params;

  const startMs = new Date(clockInTime).getTime();
  const endMs = new Date(clockOutTime).getTime();

  if (startMs >= endMs) {
    throw new Error('Clock-out time must be after clock-in time.');
  }

  // 1. Raw Duration in hours
  const rawHours = (endMs - startMs) / (1000 * 3600);

  // 2. Rounding intervals (e.g. 15 minutes = 0.25h)
  const roundingStep = policy.roundingMinutes / 60;
  const roundedHours = Math.round(rawHours / roundingStep) * roundingStep;

  // 3. Unpaid break deduction (e.g. 30 mins if shift > 5 hours)
  let breakDeductionHours = 0;
  if (roundedHours >= policy.breakTriggerHours) {
    breakDeductionHours = policy.autoBreakDeductionMinutes / 60;
  }

  const netWorkedHours = Math.max(0, roundedHours - breakDeductionHours);

  // 4. Overtime / Double-Time categorization
  if (isSundayOrHoliday) {
    // All hours on Sunday/Public Holiday earn double-time (2.0x) under Jamaican labor practice
    return {
      rawHours,
      roundedHours,
      breakDeductionHours,
      netRegularHours: 0,
      netOvertimeHours: 0,
      netHolidayDoubleTimeHours: netWorkedHours,
    };
  }

  // Standard weekday
  const netRegularHours = Math.min(netWorkedHours, policy.dailyThresholdHours);
  const netOvertimeHours = Math.max(0, netWorkedHours - policy.dailyThresholdHours);

  return {
    rawHours,
    roundedHours,
    breakDeductionHours,
    netRegularHours: Math.round(netRegularHours * 100) / 100,
    netOvertimeHours: Math.round(netOvertimeHours * 100) / 100,
    netHolidayDoubleTimeHours: 0,
  };
}

/**
 * Validates timesheet modifications against payroll close locks.
 * Throws an error if timesheet period is closed, requiring an audited reopen.
 */
export function modifyTimesheet(
  timesheet: TimesheetPeriod,
  newEntries: TimesheetPeriod['entries']
): TimesheetPeriod {
  if (timesheet.isLocked) {
    throw new Error(
      'Locked Period Violation: This timesheet has been closed for payroll processing and cannot be edited without an audited administrative reopen.'
    );
  }

  return {
    ...timesheet,
    entries: newEntries,
  };
}

/**
 * Unlocks a closed timesheet with a mandatory justification reason and audit trail.
 */
export function reopenLockedTimesheet(
  timesheet: TimesheetPeriod,
  actorName: string,
  reason: string
): TimesheetPeriod {
  if (!reason || reason.trim().length < 5) {
    throw new Error('A mandatory justification reason of at least 5 characters is required to reopen a closed timesheet.');
  }

  return {
    ...timesheet,
    isLocked: false,
    reopenReason: `Reopened by ${actorName}: ${reason.trim()} on ${new Date().toISOString()}`,
  };
}
