import React, { useState } from 'react';
import { 
  Building, 
  Clock, 
  Shield, 
  FileText, 
  CheckCircle2, 
  Save
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export const SystemSettingsManager: React.FC = () => {
  const { systemSettings, updateSystemSettings, policyDocuments, policyAcknowledgments, acknowledgePolicy, employees } = useData();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'policies' | 'security'>('general');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formState, setFormState] = useState({
    companyName: systemSettings.companyName,
    companyAddress: systemSettings.companyAddress,
    companyPhone: systemSettings.companyPhone,
    companyEmail: systemSettings.companyEmail,
    timeZone: systemSettings.timeZone,
    currency: systemSettings.currency,
    workingDays: [...systemSettings.workingDays],
    workStart: systemSettings.workingHours.start,
    workEnd: systemSettings.workingHours.end,
    sessionTimeout: systemSettings.securitySettings.sessionTimeout,
    passwordMinLength: systemSettings.securitySettings.passwordMinLength,
  });

  const allWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleToggleDay = (day: string) => {
    if (formState.workingDays.includes(day)) {
      setFormState({
        ...formState,
        workingDays: formState.workingDays.filter(d => d !== day)
      });
    } else {
      setFormState({
        ...formState,
        workingDays: [...formState.workingDays, day]
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      companyName: formState.companyName,
      companyAddress: formState.companyAddress,
      companyPhone: formState.companyPhone,
      companyEmail: formState.companyEmail,
      timeZone: formState.timeZone,
      currency: formState.currency,
      workingDays: formState.workingDays,
      workingHours: {
        start: formState.workStart,
        end: formState.workEnd
      },
      securitySettings: {
        ...systemSettings.securitySettings,
        sessionTimeout: Number(formState.sessionTimeout),
        passwordMinLength: Number(formState.passwordMinLength)
      }
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const currentEmpId = user?.employeeId || employees[0]?.id || '1';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization & System Configuration</h1>
          <p className="text-gray-600 text-sm mt-1">Global enterprise parameters, working schedules, and statutory policy documents</p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Settings saved successfully!
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        {[
          { id: 'general', label: 'Company Profile', icon: <Building className="w-4 h-4" /> },
          { id: 'schedule', label: 'Working Hours & Schedule', icon: <Clock className="w-4 h-4" /> },
          { id: 'policies', label: 'Policies & Compliance Documents', icon: <FileText className="w-4 h-4" /> },
          { id: 'security', label: 'Security & Access Rules', icon: <Shield className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Corporate Profile</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  value={formState.companyName}
                  onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Corporate Contact Email</label>
                <input
                  type="email"
                  required
                  value={formState.companyEmail}
                  onChange={(e) => setFormState({ ...formState, companyEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Headquarters Phone</label>
                <input
                  type="text"
                  value={formState.companyPhone}
                  onChange={(e) => setFormState({ ...formState, companyPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={formState.timeZone}
                  onChange={(e) => setFormState({ ...formState, timeZone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/New_York (EST)">America/New_York (EST)</option>
                  <option value="America/Chicago (CST)">America/Chicago (CST)</option>
                  <option value="America/Denver (MST)">America/Denver (MST)</option>
                  <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                  <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Registered Corporate Address</label>
              <textarea
                rows={2}
                value={formState.companyAddress}
                onChange={(e) => setFormState({ ...formState, companyAddress: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Operational Working Days</h3>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Standard Active Workdays</label>
              <div className="flex flex-wrap gap-2">
                {allWeekDays.map(day => {
                  const isSelected = formState.workingDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => handleToggleDay(day)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Standard Shift Start</label>
                <input
                  type="time"
                  value={formState.workStart}
                  onChange={(e) => setFormState({ ...formState, workStart: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Standard Shift End</label>
                <input
                  type="time"
                  value={formState.workEnd}
                  onChange={(e) => setFormState({ ...formState, workEnd: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: POLICIES */}
        {activeTab === 'policies' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Mandatory Corporate Policies</h3>
                <p className="text-xs text-gray-500 mt-0.5">Documents required for all personnel compliance onboarding</p>
              </div>
            </div>

            <div className="space-y-4">
              {policyDocuments.map(policy => {
                const isAcknowledged = policyAcknowledgments.some(
                  a => a.policyDocumentId === policy.id && a.employeeId === currentEmpId
                );
                return (
                  <div key={policy.id} className="p-4 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">{policy.title}</h4>
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                          v{policy.version}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 max-w-xl">{policy.description}</p>
                      <p className="text-[11px] text-gray-400 mt-2">
                        Effective date: {policy.effectiveDate} · Min review time: {policy.minimumReadTime}s
                      </p>
                    </div>

                    <div>
                      {isAcknowledged ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Acknowledged
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => acknowledgePolicy(policy.id, currentEmpId)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                        >
                          Sign & Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Session & Password Governance</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Session Inactivity Timeout (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={formState.sessionTimeout}
                  onChange={(e) => setFormState({ ...formState, sessionTimeout: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Password Length</label>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={formState.passwordMinLength}
                  onChange={(e) => setFormState({ ...formState, passwordMinLength: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'policies' && (
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              Save System Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
