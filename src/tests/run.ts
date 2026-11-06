import { runPhase0Tests } from './phase0.test';
import { runPhase1Tests } from './phase1.test';
import { runPhase2Tests } from './phase2.test';
import { runPhase3Tests } from './phase3.test';
import { runPhase4Tests } from './phase4.test';
import { runPhase5Tests } from './phase5.test';
import { runPhase6Tests } from './phase6.test';
import { runPhase7Tests } from './phase7.test';
import { runPhase8Tests } from './phase8.test';
import { runPhase9Tests } from './phase9.test';

async function main() {
  console.log('====================================================');
  console.log('   VerticalHR Continuous Verification Test Runner   ');
  console.log('====================================================\n');

  console.log('--- Phase 0: Foundation & Cleanup ---');
  const p0 = await runPhase0Tests();
  p0.results.forEach((l) => console.log(`  ${l}`));
  if (!p0.passed) {
    console.error('\nPhase 0 acceptance tests FAILED.');
    process.exit(1);
  }

  console.log('\n--- Phase 1: Core HR, Documents & Workflows ---');
  const p1 = await runPhase1Tests();
  p1.results.forEach((l) => console.log(`  ${l}`));
  if (!p1.passed) {
    console.error('\nPhase 1 acceptance tests FAILED.');
    process.exit(1);
  }

  console.log('\n--- Phase 2: Leave Management & Accrual Ledger ---');
  const p2 = await runPhase2Tests();
  p2.results.forEach((l) => console.log(`  ${l}`));
  if (!p2.passed) {
    console.error('\nPhase 2 acceptance tests FAILED.');
    process.exit(1);
  }

  console.log('\n--- Phase 3: Time & Attendance, Geofencing, Overtime ---');
  const p3 = await runPhase3Tests();
  p3.results.forEach((l) => console.log(`  ${l}`));
  if (!p3.passed) {
    console.error('\nPhase 3 acceptance tests FAILED.');
    process.exit(1);
  }

  console.log('\n--- Phase 4: Jamaican Statutory Payroll Engine ---');
  const p4 = await runPhase4Tests();
  p4.results.forEach((l) => console.log(`  ${l}`));
  if (!p4.passed) {
    console.error('\nPhase 4 acceptance tests FAILED.');
    process.exit(1);
  }

  console.log('\n--- Phase 5: Performance, Talent, OKRs & Engagement ---');
  const p5 = await runPhase5Tests();
  p5.results.forEach((l) => console.log(`  ${l}`));
  if (!p5.passed) {
    console.error('\nPhase 5 acceptance tests FAILED.');
    process.exit(1);
  }

  console.log('\n--- Phase 6: Recruiting, Onboarding & Offboarding ---');
  const p6 = await runPhase6Tests();
  p6.results.forEach((l) => console.log(`  ${l}`));
  if (!p6.passed) {
    console.error('\nPhase 6 acceptance tests FAILED.');
    process.exit(1);
  }

  console.log('\n--- Phase 7: FICA & KYC Compliance Center (Financial Sector Differentiator) ---');
  const p7 = await runPhase7Tests();
  p7.results.forEach((l) => console.log(`  ${l}`));
  if (!p7.passed) {
    console.error('\nPhase 7 acceptance tests FAILED.');
    process.exit(1);
  }

  console.log('\n--- Phase 8: Platform, Billing, Integrations & AI Engine ---');
  const p8 = await runPhase8Tests();
  p8.results.forEach((l) => console.log(`  ${l}`));
  if (!p8.passed) {
    console.error('\nPhase 8 acceptance tests FAILED.');
    process.exit(1);
  }

  console.log('\n--- Phase 9: Launch Readiness, Legal, Migrations, DR & Production Audit ---');
  const p9 = await runPhase9Tests();
  p9.results.forEach((l) => console.log(`  ${l}`));
  if (!p9.passed) {
    console.error('\nPhase 9 acceptance tests FAILED.');
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log(' ALL CUMULATIVE PHASE 0 THROUGH 9 TESTS PASSED (100% COMPLETE)');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
