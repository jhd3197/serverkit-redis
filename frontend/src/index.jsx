import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Trash2, Search, Activity, HardDrive, Users } from 'lucide-react';

const RedisManager = ({ api }) => {
    const [status, setStatus] = useState(null);
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [command, setCommand] = useState('');
    const [commandOutput, setCommandOutput] = useState('');
    const [searchPattern, setSearchPattern] = useState('*');
    const [selectedKey, setSelectedKey] = useState(null);
    const [activeTab, setActiveTab] = useState('status');
    const [error, setError] = useState(null);

    useEffect(() => { loadStatus(); }, []);

    async function loadStatus() {
        setLoading(true);
        setError(null);
        try {
            const res = await api.request('/redis/status');
            setStatus(res);
            if (res.running) loadKeys();
        } catch (err) {
            setError('Failed to load Redis status');
        }
        setLoading(false);
    }

    async function loadKeys() {
        try {
            const res = await api.request(`/redis/keys?pattern=${encodeURIComponent(searchPattern)}`);
            setKeys(res?.keys || []);
        } catch (err) {
            setError('Failed to load keys');
        }
    }

    async function runCommand() {
        if (!command.trim()) return;
        try {
            const res = await api.request('/redis/command', {
                method: 'POST',
                body: { command }
            });
            setCommandOutput(res?.output || 'No output');
        } catch (err) {
            setCommandOutput('Error: ' + err.message);
        }
    }

    async function deleteKey(key) {
        if (!confirm(`Delete key "${key}"?`)) return;
        try {
            await api.request(`/redis/keys/${encodeURIComponent(key)}`, { method: 'DELETE' });
            loadKeys();
        } catch (err) {
            setError('Failed to delete key');
        }
    }

    async function viewKey(key) {
        try {
            const res = await api.request(`/redis/keys/${encodeURIComponent(key)}`);
            setSelectedKey(res);
            setActiveTab('key-detail');
        } catch (err) {
            setError('Failed to load key');
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Loading Redis...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Redis</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
                        {status?.running ? 'Server is running' : 'Server is not running'}
                    </p>
                </div>
                <button onClick={loadStatus} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', marginBottom: '16px', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            {status?.running && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {[
                        { icon: Activity, label: 'Version', value: status.version },
                        { icon: HardDrive, label: 'Memory', value: status.used_memory },
                        { icon: Database, label: 'Total Keys', value: status.total_keys },
                        { icon: Users, label: 'Clients', value: status.connected_clients },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <Icon size={16} style={{ color: 'var(--accent)' }} />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                {['status', 'keys', 'terminal'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: activeTab === tab ? 'var(--accent)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, textTransform: 'capitalize' }}>
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'status' && status?.running && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Server Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                            { label: 'Uptime', value: `${Math.floor(status.uptime / 3600)}h ${Math.floor((status.uptime % 3600) / 60)}m` },
                            { label: 'Commands Processed', value: status.commands_processed },
                            { label: 'Cache Hit Rate', value: status.hits && status.misses ? ((parseInt(status.hits) / (parseInt(status.hits) + parseInt(status.misses)) * 100).toFixed(1) + '%') : 'N/A' },
                            { label: 'Max Memory', value: status.max_memory || 'No limit' },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
                                <div style={{ fontWeight: 600 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'keys' && (
                <div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" value={searchPattern} onChange={(e) => setSearchPattern(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadKeys()} placeholder="Search pattern (e.g., user:*)" style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text)', fontSize: '0.9rem' }} />
                        </div>
                        <button onClick={loadKeys} style={{ padding: '10px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Search</button>
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Key</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Type</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>TTL</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {keys.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.9rem' }}>{item.key}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ padding: '3px 8px', background: 'rgba(59,130,246,0.1)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--accent)' }}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.9rem' }}>
                                            {item.ttl === -1 ? 'No expiry' : `${item.ttl}s`}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button onClick={() => viewKey(item.key)} style={{ padding: '5px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '8px', fontSize: '0.8rem', fontWeight: 500 }}>
                                                View
                                            </button>
                                            <button onClick={() => deleteKey(item.key)} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', fontSize: '0.8rem', fontWeight: 500 }}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {keys.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No keys found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'terminal' && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Redis CLI</h3>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input type="text" value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runCommand()} placeholder="Enter Redis command (e.g., INFO, KEYS *, GET key)" style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'monospace' }} />
                        <button onClick={runCommand} style={{ padding: '10px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Run</button>
                    </div>
                    <pre style={{ padding: '16px', background: 'var(--bg)', borderRadius: '8px', fontSize: '0.85rem', maxHeight: '400px', overflow: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: commandOutput ? 'var(--text)' : 'var(--text-muted)' }}>
                        {commandOutput || 'Run a command to see output...'}
                    </pre>
                </div>
            )}

            {activeTab === 'key-detail' && selectedKey && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Key: {selectedKey.key}</h3>
                        <button onClick={() => setActiveTab('keys')} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Back to Keys
                        </button>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px', marginBottom: '16px' }}>
                        <span style={{ padding: '3px 8px', background: 'rgba(59,130,246,0.1)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--accent)' }}>
                            {selectedKey.type}
                        </span>
                    </div>
                    <pre style={{ padding: '16px', background: 'var(--bg)', borderRadius: '8px', fontSize: '0.85rem', maxHeight: '400px', overflow: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                        {selectedKey.value || 'No value'}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default RedisManager;

export const extension = {
    name: 'serverkit-redis',
    version: '1.0.0',
    component: RedisManager,
    nav: {
        label: 'Redis',
        icon: 'database',
        path: '/redis',
    },
};
