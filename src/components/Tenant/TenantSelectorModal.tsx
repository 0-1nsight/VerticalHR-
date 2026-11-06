import React from 'react';
import { 
  Building, 
  Check, 
  Globe, 
  Clock, 
  DollarSign, 
  X, 
  ShieldCheck, 
  Lock
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface TenantSelectorModalProps {
  onClose: () => void;
}

export const TenantSelectorModal: React.FC<TenantSelectorModalProps> = ({ onClose }) => {
  const { tenants, currentTenant, setCurrentTenant } = useData();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold">Corporate Tenant & Regional Locale</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-gray-600 leading-relaxed">
            Select the active corporate entity. Multi-tenant row-level data isolation partitions employee records, statutory holiday rules, currency formatting, and FICA regulatory boundaries.
          </p>

          <div className="space-y-3">
            {tenants.map(tenant => {
              const isSelected = tenant.id === currentTenant.id;
              return (
                <div
                  key={tenant.id}
                  onClick={() => {
                    setCurrentTenant(tenant);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{tenant.name}</h4>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-gray-500 text-[11px] pt-1">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-gray-400" /> Country: {tenant.country} ({tenant.locale})
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" /> Currency: {tenant.currency} ({tenant.currencySymbol})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" /> {tenant.timezone}
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400 pt-0.5">
                      Capacity: {tenant.maxEmployees} employees · Statutory Retention: {tenant.dataRetentionYears} years
                    </div>
                  </div>

                  <div className="shrink-0 pl-3">
                    <span className="p-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg transition-colors block">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-[11px] flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Strict tenant boundary: Data, salaries, and personnel files are strictly isolated per tenant ID.</span>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
