import React, { useState } from 'react';
import { 
  Lightbulb, 
  CheckCircle2
} from 'lucide-react';

export const StrategicHRGuide: React.FC = () => {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set(['audit-1', 'audit-3']));

  const toggleCheck = (id: string) => {
    const updated = new Set(completedItems);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setCompletedItems(updated);
  };

  const opportunities = [
    {
      id: 'opp-1',
      title: 'Automated 30-60-90 Day Onboarding Workflows',
      category: 'Talent Acquisition & Retention',
      impact: 'High',
      effort: 'Medium',
      description: 'Replace fragmented manual emails with automated milestone check-ins, IT hardware provisioning tasks, and peer buddy assignments.',
      actionItems: [
        { id: 'act-1', text: 'Create standardized first-week compliance document packet' },
        { id: 'act-2', text: 'Automate 30-day feedback check-in notification for new hires' },
        { id: 'act-3', text: 'Assign mandatory cybersecurity and safety training on day 1' }
      ]
    },
    {
      id: 'opp-2',
      title: 'Continuous 360° Peer Feedback & Agile OKRs',
      category: 'Performance Management',
      impact: 'High',
      effort: 'Low',
      description: 'Transition from high-friction annual appraisals to quarterly micro-reviews and continuous recognition to boost engagement and prevent surprise resignations.',
      actionItems: [
        { id: 'act-4', text: 'Introduce quarterly goal calibration meetings between managers & teams' },
        { id: 'act-5', text: 'Enable anonymous peer kudos and performance inputs' },
        { id: 'act-6', text: 'Link individual milestones directly to departmental OKRs' }
      ]
    },
    {
      id: 'opp-3',
      title: 'Integrated Compensation & Payroll Benchmarking',
      category: 'Compensation & Benefits',
      impact: 'High',
      effort: 'High',
      description: 'Connect internal job level salary bands against real-time industry compensation survey percentiles (25th, 50th, 75th) to maintain pay equity.',
      actionItems: [
        { id: 'act-7', text: 'Audit gender and departmental pay equity ratios' },
        { id: 'act-8', text: 'Establish transparent salary progression bands for all job levels' },
        { id: 'act-9', text: 'Connect direct payroll disbursement API connectors' }
      ]
    },
    {
      id: 'opp-4',
      title: 'Predictive Flight-Risk & Retention Analytics',
      category: 'People Analytics',
      impact: 'Medium',
      effort: 'Medium',
      description: 'Leverage attendance anomalies, unutilized PTO accruals, and review sentiment scores to proactively identify employee burnout before turnover occurs.',
      actionItems: [
        { id: 'act-10', text: 'Monitor excessive overtime hours and consecutive shift fatigue' },
        { id: 'act-11', text: 'Flag employees with 0 taken PTO days in the preceding 6 months' },
        { id: 'act-12', text: 'Conduct structured stay-interviews for key talent' }
      ]
    },
    {
      id: 'opp-5',
      title: 'Legally-Compliant E-Signatures & Document Vault',
      category: 'HR Compliance & Governance',
      impact: 'High',
      effort: 'Low',
      description: 'Centralize encrypted offer letters, non-disclosure agreements, and right-to-work certifications with tamper-evident audit timestamps and IP verification.',
      actionItems: [
        { id: 'act-13', text: 'Enforce annual policy re-acknowledgment cadence' },
        { id: 'act-14', text: 'Store emergency contact and bank information with restricted access levels' },
        { id: 'act-15', text: 'Enable self-service address and tax withholding updates' }
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">HR Modernization & Opportunities Guide</h1>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
              Strategic Roadmap
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Expert recommendations for scaling human resource operations, employee retention, and workflow automation
          </p>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-6 shadow-md flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Lightbulb className="w-6 h-6 text-amber-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Key Transformation Pillars for VerticalHRM</h2>
          <p className="text-slate-300 text-xs mt-1 leading-relaxed max-w-3xl">
            Modern HR departments spend over 60% of their bandwidth on transactional paperwork.
            By adopting digital self-service for leave, automated time punch records, structured OKRs, and proactive career advancement tracking, your HR team can transition from administrative support to a high-impact strategic business partner.
          </p>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="grid grid-cols-1 gap-6">
        {opportunities.map((opp) => (
          <div key={opp.id} className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 hover:border-blue-200 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-blue-600">
                  {opp.category}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{opp.title}</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed max-w-3xl">
                  {opp.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700">
                  Impact: {opp.impact}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700">
                  Effort: {opp.effort}
                </span>
              </div>
            </div>

            {/* Action Items Checklist */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-700 block mb-2">Recommended Implementation Steps:</span>
              <div className="space-y-2">
                {opp.actionItems.map(item => {
                  const isChecked = completedItems.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked 
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className={isChecked ? 'line-through text-gray-500' : 'font-medium'}>
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
