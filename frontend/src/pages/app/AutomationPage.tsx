import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import api from '../../services/api';
import {
  PageHeader, ToggleSwitch, EmptyState, ErrorState, ConfirmDialog
} from '../../components/ui/index';
import type { AutomationRule, Device } from '../../types';

export function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [newRule, setNewRule] = useState({ name: '', description: '', triggerType: 'schedule', cronExpr: '0 6 * * *', entity: '', service: 'turn_off' });

  const fetch = async () => {
    try {
      const [rulesRes, devRes] = await Promise.all([
        api.get<AutomationRule[]>('/automation/rules'),
        api.get<Device[]>('/devices?is_controllable=true'),
      ]);
      setRules(rulesRes.data); setDevices(devRes.data);
    } catch { setError('Failed to load automation rules.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const toggleRule = async (id: number, current: string) => {
    await api.patch(`/automation/rules/${id}`, { status: current === 'enabled' ? 'disabled' : 'enabled' });
    fetch();
  };
  const deleteRule = async (id: number) => {
    await api.delete(`/automation/rules/${id}`);
    setConfirmDelete(null);
    fetch();
  };
  const createRule = async () => {
    await api.post('/automation/rules', {
      name: newRule.name,
      description: newRule.description,
      trigger: { type: newRule.triggerType, cron: newRule.cronExpr },
      actions: [{ service: newRule.service, entity_id: newRule.entity }],
    });
    setShowBuilder(false);
    fetch();
  };

  return (
    <div className="flex flex-col gap-xl">
      <PageHeader
        title="Automation & Control"
        subtitle="Schedule and automate device actions with safety validation."
        actions={
          <button onClick={() => setShowBuilder(true)} className="btn-primary">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Automation Rule
          </button>
        }
      />

      {error && <ErrorState message={error} onRetry={fetch} />}

      {/* Safety Notice */}
      <div className="card p-md bg-surface-container border-l-4 border-status-amber-text">
        <div className="flex items-start gap-sm">
          <span className="material-symbols-outlined text-status-amber-text text-[20px]">security</span>
          <div>
            <div className="text-label-lg text-on-surface font-semibold">Safety Guardrails Active</div>
            <p className="text-body-md text-on-surface-variant mt-2xs">
              Critical appliances (refrigerator compressor, network storage, Pi home hub) are protected from remote control.
              AI predictions will never automatically trigger consequential device actions without your explicit confirmation.
            </p>
          </div>
        </div>
      </div>

      {rules.length === 0 && !loading ? (
        <EmptyState
          icon="tune" title="No automation rules"
          description="Create rules to automatically control devices based on schedule or energy conditions."
          action={<button onClick={() => setShowBuilder(true)} className="btn-primary">Create First Rule</button>}
        />
      ) : (
        <div className="flex flex-col gap-md">
          {rules.map(rule => (
            <div key={rule.id} className="card p-lg">
              <div className="flex items-start justify-between gap-md">
                <div className="flex-1">
                  <div className="flex items-center gap-xs mb-xs flex-wrap">
                    <h3 className="text-label-lg text-on-surface font-semibold">{rule.name}</h3>
                    <span className={`chip-${rule.status === 'enabled' ? 'green' : 'neutral'}`}>
                      {rule.status}
                    </span>
                  </div>
                  {rule.description && <p className="text-body-md text-secondary mb-sm">{rule.description}</p>}
                  <div className="flex flex-wrap gap-md text-label-sm text-secondary">
                    <span>Trigger: {JSON.stringify(rule.trigger)}</span>
                    {rule.last_executed_at && (
                      <span>Last run: {format(parseISO(rule.last_executed_at), 'MMM d, HH:mm')} • {rule.last_execution_result}</span>
                    )}
                    <span>Run count: {rule.execution_count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-sm shrink-0">
                  <ToggleSwitch
                    checked={rule.status === 'enabled'}
                    onChange={() => toggleRule(rule.id, rule.status)}
                    label={`Toggle ${rule.name}`}
                  />
                  <button onClick={() => setConfirmDelete(rule.id)} className="btn-ghost p-xs text-status-red-text hover:bg-status-red-bg">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rule Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-inverse-surface/30" onClick={() => setShowBuilder(false)} />
          <div className="relative card p-xl max-w-lg w-full mx-md shadow-modal animate-fade-in">
            <h2 className="text-headline-sm text-on-surface font-semibold mb-lg">New Automation Rule</h2>
            <div className="flex flex-col gap-md">
              <div>
                <label className="text-label-md text-secondary mb-xs block">Rule Name *</label>
                <input className="input-field" placeholder="e.g. Turn off geyser at 7am"
                  value={newRule.name} onChange={e => setNewRule(r => ({...r, name: e.target.value}))} />
              </div>
              <div>
                <label className="text-label-md text-secondary mb-xs block">Description</label>
                <input className="input-field" placeholder="Optional description"
                  value={newRule.description} onChange={e => setNewRule(r => ({...r, description: e.target.value}))} />
              </div>
              <div>
                <label className="text-label-md text-secondary mb-xs block">Schedule (Cron)</label>
                <input className="input-field font-mono" placeholder="0 6 * * *"
                  value={newRule.cronExpr} onChange={e => setNewRule(r => ({...r, cronExpr: e.target.value}))} />
                <div className="text-label-sm text-secondary mt-2xs">Example: "0 6 * * *" = daily at 6 AM</div>
              </div>
              <div>
                <label className="text-label-md text-secondary mb-xs block">Target Device</label>
                <select className="input-field" value={newRule.entity} onChange={e => setNewRule(r => ({...r, entity: e.target.value}))}>
                  <option value="">Select a device…</option>
                  {devices.map(d => <option key={d.id} value={d.entity_id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-label-md text-secondary mb-xs block">Action</label>
                <select className="input-field" value={newRule.service} onChange={e => setNewRule(r => ({...r, service: e.target.value}))}>
                  <option value="turn_on">Turn On</option>
                  <option value="turn_off">Turn Off</option>
                  <option value="toggle">Toggle</option>
                </select>
              </div>
              {newRule.name && newRule.entity && (
                <div className="bg-surface-container rounded-lg p-sm text-label-sm text-on-surface">
                  <span className="font-semibold">Summary: </span>
                  {newRule.cronExpr} → {newRule.service.replace('_', ' ')} "{devices.find(d => d.entity_id === newRule.entity)?.name}"
                </div>
              )}
            </div>
            <div className="flex justify-end gap-sm mt-lg">
              <button onClick={() => setShowBuilder(false)} className="btn-secondary">Cancel</button>
              <button onClick={createRule} disabled={!newRule.name || !newRule.entity} className="btn-primary">
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Delete Automation Rule?"
        message="This action cannot be undone. The rule will be permanently removed."
        confirmLabel="Delete"
        isDangerous
        onConfirm={() => confirmDelete !== null && deleteRule(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
