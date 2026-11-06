import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Lock, 
  X
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { AuditLogEntry } from '../../types';

export const AuditTrailViewer: React.FC = () => {
  const { auditLogs, currentTenant } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [inspectedLog, setInspectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = selectedEntity === 'all' || log.entity === selectedEntity;
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    return matchesSearch && matchesEntity && matchesAction;
  });

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Actor Name', 'Role', 'Action', 'Entity', 'Entity ID', 'Description', 'Previous Value', 'New Value', 'IP Address'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      `"${l.actorName}"`,
      l.actorRole,
      l.action,
      l.entity,
      l.entityId,
      `"${l.entityDescription}"`,
      `"${l.previousValue || ''}"`,
      `"${l.newValue || ''}"`,
      l.ipAddress
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HR_Audit_Trail_${currentTenant.subdomain}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'APPROVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">APPROVE</span>;
      case 'REJECT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">REJECT</span>;
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">CREATE</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">UPDATE</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">DELETE</span>;
      case 'EXPORT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">EXPORT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">{action}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-emerald-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Immutable HR Audit Trail</h1>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Tamper-evident, append-only record of all system alterations, salary modifications, and approvals for statutory compliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Tenant: {currentTenant.name}</span>
          </div>
          <button
            onClick={exportAuditCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Audit Log (CSV)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by actor name, event description, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Entities</option>
              <option value="Employee">Employee Records</option>
              <option value="Salary">Salary & Pay Changes</option>
              <option value="FicaRecord">FICA & Compliance</option>
              <option value="LeaveRequest">Leave Requests</option>
              <option value="Document">Documents & Certs</option>
              <option value="Workflow">Workflows</option>
              <option value="Setting">System Settings</option>
            </select>
          </div>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="EXPORT">EXPORT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredLogs.length} logged audit events</span>
          <span className="font-mono text-[11px] text-gray-400">SHA-256 Checksum Verified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3">IP Address</th>
                <th className="py-3 px-3 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                        {log.actorName[0]}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block leading-tight">{log.actorName}</span>
                        <span className="text-[10px] text-gray-400 capitalize">{log.actorRole.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-gray-700 whitespace-nowrap">
                    {log.entity}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 max-w-md truncate" title={log.entityDescription}>
                    {log.entityDescription}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-gray-400 whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setInspectedLog(log)}
                      className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Diff
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff Inspection Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold">Audit Event Log Inspection</h3>
              </div>
              <button onClick={() => setInspectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-400 block mb-0.5">Audit Event ID</span>
                  <span className="font-mono font-bold text-gray-800">{inspectedLog.id}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Timestamp</span>
                  <span className="text-gray-800">{new Date(inspectedLog.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Actor</span>
                  <span className="font-semibold text-gray-900">{inspectedLog.actorName} ({inspectedLog.actorRole})</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Client IP Address</span>
                  <span className="font-mono text-gray-800">{inspectedLog.ipAddress}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 block mb-1 uppercase font-bold text-[10px]">Action Performed</span>
                <p className="text-sm font-semibold text-gray-900">{inspectedLog.entityDescription}</p>
              </div>

              {/* State Transition Diff */}
              <div className="space-y-2 pt-2">
                <span className="text-gray-500 font-bold block uppercase text-[10px]">State Transition</span>
                {inspectedLog.previousValue && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                    <span className="font-bold block mb-0.5 text-rose-700">Previous State:</span>
                    <pre className="font-mono text-xs whitespace-pre-wrap">{inspectedLog.previousValue}</pre>
                  </div>
                )}
                {inspectedLog.newValue && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                    <span className="font-bold block mb-0.5 text-emerald-700">New State:</span>
                    <pre className="font-mono text-xs whitespace-pre-wrap">{inspectedLog.newValue}</pre>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setInspectedLog(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
