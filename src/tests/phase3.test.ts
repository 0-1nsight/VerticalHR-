/**
 * VerticalHR Phase 3 Acceptance & Verification Test Suite
 * Validates:
 * 1. Offline Punch Queue & Idempotency (Strict duplicate suppression)
 * 2. GPS Geofencing via Haversine Formula (Inside perimeter vs outside breach)
 * 3. Daily & Weekly Overtime + Jamaican Statutory Sunday/Holiday Double-Time
 * 4. 15-minute rounding and mandatory 30-minute break deduction
 * 5. Strict Payroll Close Timesheet Lock & Audited Reopen Protection
 */

import {
  calculateHaversineDistanceMeters,
  verifyGeofence,
  punchProcessor,
  calculateShiftOvertime,
  modifyTimesheet,
  reopenLockedTimesheet,
  WorkSiteLocation,
  OvertimePolicyConfig,
  TimesheetPeriod,
} from '../services/attendance';

export async function runPhase3Tests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  let allPassed = true;

  const logResult = (name: string, success: boolean, detail?: string) => {
    if (success) {
      results.push(`PASS: ${name}`);
    } else {
      results.push(`FAIL: ${name}${detail ? ` -> ${detail}` : ''}`);
      allPassed = false;
    }
  };

  try {
    // ------------------------------------------------------------------------
    // 1. Offline Punch Queue & Idempotency Test
    // ------------------------------------------------------------------------
    const punchTime = '2026-11-06T08:00:00.123Z';
    const punchInput = {
      tenantId: 't-kingston-01',
      employeeId: 'emp-punch-001',
      punchType: 'clock_in' as const,
      punchTime,
      isOfflineSync: true,
    };

    // First punch attempt
    const res1 = punchProcessor.processPunch(punchInput);
    // Identical duplicate punch retry (simulating offline retry or double tap)
    const res2 = punchProcessor.processPunch(punchInput);

    const idempotencyPassed =
      !res1.isDuplicate &&
      res2.isDuplicate &&
      res1.punch.id === res2.punch.id &&
      res1.punch.idempotencyKey === res2.punch.idempotencyKey;

    logResult('Offline Punch Queue & Exact-Once Idempotency', idempotencyPassed);

    // ------------------------------------------------------------------------
    // 2. GPS Geofencing & Haversine Distance Test
    // ------------------------------------------------------------------------
    // Kingston Corporate HQ coordinates: 18.0179° N, 76.8099° W, radius 150m
    const kingstonHQ: WorkSiteLocation = {
      id: 'site-kingston-hq',
      tenantId: 't-kingston-01',
      name: 'Kingston Financial Centre',
      latitude: 18.0179,
      longitude: -76.8099,
      radiusMeters: 150,
    };

    // Point A: ~50 meters away (inside perimeter)
    const insideCoords = { latitude: 18.0182, longitude: -76.8097 };
    const directDistance = calculateHaversineDistanceMeters(insideCoords.latitude, insideCoords.longitude, kingstonHQ.latitude, kingstonHQ.longitude);
    const insideCheck = verifyGeofence(insideCoords.latitude, insideCoords.longitude, kingstonHQ);

    // Point B: ~550 meters away (outside perimeter)
    const outsideCoords = { latitude: 18.0225, longitude: -76.8075 };
    const outsideCheck = verifyGeofence(outsideCoords.latitude, outsideCoords.longitude, kingstonHQ);

    const geofencePassed =
      insideCheck.status === 'inside' &&
      insideCheck.distanceMeters === directDistance &&
      insideCheck.distanceMeters < 150 &&
      outsideCheck.status === 'outside' &&
      outsideCheck.distanceMeters > 150;

    logResult(
      'GPS Geofencing via Haversine Distance (Inside vs Outside Radius)',
      geofencePassed,
      `Inside dist: ${insideCheck.distanceMeters}m, Outside dist: ${outsideCheck.distanceMeters}m`
    );

    // ------------------------------------------------------------------------
    // 3. Overtime Rules, 15m Rounding & Break Deduction Test
    // ------------------------------------------------------------------------
    const standardPolicy: OvertimePolicyConfig = {
      dailyThresholdHours: 8.0,
      weeklyThresholdHours: 40.0,
      multiplierStandard: 1.5,
      multiplierSundayHoliday: 2.0,
      autoBreakDeductionMinutes: 30,
      breakTriggerHours: 5.0,
      roundingMinutes: 15,
    };

    // Case 3A: Standard 8.5h shift with 30m break deduction (09:00 to 17:30)
    // 8.5h worked - 0.5h break = exactly 8.0h regular, 0h overtime
    const standardShift = calculateShiftOvertime({
      clockInTime: '2026-11-02T09:00:00Z',
      clockOutTime: '2026-11-02T17:30:00Z',
      policy: standardPolicy,
      isSundayOrHoliday: false,
    });

    // Case 3B: Overtime shift (09:00 to 20:00 = 11.0h raw - 0.5h break = 10.5h net)
    // Net: 8.0h regular + 2.5h overtime (1.5x)
    const overtimeShift = calculateShiftOvertime({
      clockInTime: '2026-11-03T09:00:00Z',
      clockOutTime: '2026-11-03T20:00:00Z',
      policy: standardPolicy,
      isSundayOrHoliday: false,
    });

    // Case 3C: 15m interval rounding test
    // 09:00 to 17:08 = 8h 8min raw -> rounds to nearest 15m (8.25h) -> 8.25h - 0.5h break = 7.75h regular
    const roundingShift = calculateShiftOvertime({
      clockInTime: '2026-11-04T09:00:00Z',
      clockOutTime: '2026-11-04T17:08:00Z',
      policy: standardPolicy,
      isSundayOrHoliday: false,
    });

    const shiftCalcPassed =
      standardShift.netRegularHours === 8.0 &&
      standardShift.netOvertimeHours === 0 &&
      standardShift.breakDeductionHours === 0.5 &&
      overtimeShift.netRegularHours === 8.0 &&
      overtimeShift.netOvertimeHours === 2.5 &&
      roundingShift.roundedHours === 8.25 &&
      roundingShift.netRegularHours === 7.75;

    logResult('Daily Overtime & 15-Minute Rounding Step', shiftCalcPassed);

    // ------------------------------------------------------------------------
    // 4. Jamaican Statutory Sunday / Holiday Double-Time Test (2.0x)
    // ------------------------------------------------------------------------
    // Under Jamaican labor laws, work on a Sunday or statutory public holiday earns 2.0x double-time
    const sundayShift = calculateShiftOvertime({
      clockInTime: '2026-11-08T08:00:00Z',
      clockOutTime: '2026-11-08T16:30:00Z', // 8.5h - 0.5h break = 8.0h double-time
      policy: standardPolicy,
      isSundayOrHoliday: true,
    });

    const doubleTimePassed =
      sundayShift.netRegularHours === 0 &&
      sundayShift.netOvertimeHours === 0 &&
      sundayShift.netHolidayDoubleTimeHours === 8.0;

    logResult('Jamaican Statutory Sunday / Holiday Double-Time (2.0x All Hours)', doubleTimePassed);

    // ------------------------------------------------------------------------
    // 5. Timesheet Payroll Close Lock & Audited Reopen Test
    // ------------------------------------------------------------------------
    const openTimesheet: TimesheetPeriod = {
      id: 'ts-2026-w44',
      tenantId: 't-kingston-01',
      employeeId: 'emp-punch-001',
      periodStart: '2026-10-26',
      periodEnd: '2026-10-30',
      isLocked: false,
      entries: [{ date: '2026-10-26', hours: 8, task: 'General Admin' }],
    };

    // Edit open timesheet: should succeed
    const editedOpen = modifyTimesheet(openTimesheet, [
      { date: '2026-10-26', hours: 8, task: 'General Admin' },
      { date: '2026-10-27', hours: 8, task: 'HR Auditing' },
    ]);

    // Lock timesheet for payroll close
    const lockedTimesheet: TimesheetPeriod = {
      ...editedOpen,
      isLocked: true,
      lockedAt: '2026-10-31T23:59:59Z',
    };

    // Attempting to modify locked timesheet must throw Locked Period Violation
    let lockProtected = false;
    try {
      modifyTimesheet(lockedTimesheet, [{ date: '2026-10-26', hours: 10, task: 'Unauthorized edit' }]);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Locked Period Violation')) {
        lockProtected = true;
      }
    }

    // Reopen with valid audited justification
    const reopenedTimesheet = reopenLockedTimesheet(
      lockedTimesheet,
      'Director Marcus Garvey',
      'Retroactive supervisor adjustment approved by payroll director'
    );

    // Attempt reopen with invalid trivial justification (must throw)
    let trivialReopenRejected = false;
    try {
      reopenLockedTimesheet(lockedTimesheet, 'Marcus', 'xyz');
    } catch {
      trivialReopenRejected = true;
    }

    const timesheetSecurityPassed =
      editedOpen.entries.length === 2 &&
      lockProtected &&
      !reopenedTimesheet.isLocked &&
      Boolean(reopenedTimesheet.reopenReason?.includes('Marcus Garvey')) &&
      trivialReopenRejected;

    logResult('Strict Payroll Close Lock & Audited Reopen Governance', timesheetSecurityPassed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(`FATAL ERROR: ${msg}`);
    allPassed = false;
  }

  return { passed: allPassed, results };
}
