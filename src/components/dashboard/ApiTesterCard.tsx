import React, { useState } from 'react';
import { Terminal, Send, Check, Copy } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const ApiTesterCard: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/health');
  const [responseJson, setResponseJson] = useState<string>('Click "Execute Request" to test endpoint live.');
  const [status, setStatus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const testEndpoints = [
    { path: '/api/health', method: 'GET', description: 'Comprehensive system health & DB diagnostic' },
    { path: '/api/health/live', method: 'GET', description: 'Kubernetes / Container liveness probe' },
    { path: '/api/health/ready', method: 'GET', description: 'Subsystem readiness probe' },
    { path: '/api', method: 'GET', description: 'Root API descriptor & phase information' },
    { path: '/api/invalid-test-route', method: 'GET', description: 'Standardized 404 error handler test' },
  ];

  const handleExecute = async () => {
    setIsLoading(true);
    setStatus(null);
    try {
      const res = await fetch(selectedEndpoint, {
        headers: { Accept: 'application/json' },
      });
      setStatus(res.status);
      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      setStatus(500);
      setResponseJson(JSON.stringify({ error: (err as Error).message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(responseJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card id="api-tester-card">
      <CardHeader
        title="Interactive REST API Gateway Tester"
        subtitle="Test foundational HTTP endpoints, error wrappers, and response formats"
        icon={<Terminal className="w-4 h-4 text-emerald-500" />}
        action={
          status !== null ? (
            <Badge variant={status >= 200 && status < 300 ? 'success' : status === 404 ? 'warning' : 'error'}>
              HTTP {status}
            </Badge>
          ) : undefined
        }
      />
      <CardContent>
        <div className="space-y-4">
          {/* Endpoint selector pills */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">
              Select Endpoint to Test:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {testEndpoints.map((ep) => (
                <button
                  key={ep.path}
                  onClick={() => {
                    setSelectedEndpoint(ep.path);
                    setStatus(null);
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-all ${
                    selectedEndpoint === ep.path
                      ? 'bg-blue-50/80 border-blue-300 text-blue-800 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300 ring-1 ring-blue-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{ep.path}</span>
                    <span className="text-[10px] text-slate-400 font-sans">{ep.method}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans mt-0.5 truncate">
                    {ep.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3">
            <Button
              id="btn-execute-api"
              variant="primary"
              size="sm"
              onClick={handleExecute}
              isLoading={isLoading}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Execute Request
            </Button>
            <Button
              id="btn-copy-response"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied to Clipboard' : 'Copy JSON'}
            </Button>
            <span className="text-xs text-slate-500 font-mono">
              Target: {selectedEndpoint}
            </span>
          </div>

          {/* JSON Response console */}
          <div className="rounded-lg bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto border border-slate-800 max-h-72">
            <pre className="whitespace-pre">{responseJson}</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
