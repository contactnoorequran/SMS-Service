import React, { useState } from 'react';
import { Database, Terminal, Check, Copy, Info } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export const DatabaseConfigCard: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const dockerCommand = `docker run --name sms-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sms_platform -p 5432:5432 -d postgres:16-alpine`;
  const envConfig = `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sms_platform?schema=public"`;
  const prismaCommands = `# 1. Generate Prisma Client
npx prisma generate

# 2. Push or migrate schema to PostgreSQL
npx prisma migrate dev --name init_phase_01_foundation

# 3. Inspect database schema in Prisma Studio (optional)
npx prisma studio`;

  return (
    <Card id="database-config-card">
      <CardHeader
        title="PostgreSQL & Prisma ORM Configuration Guide"
        subtitle="Step-by-step instructions for local, containerized, or cloud database provisioning"
        icon={<Database className="w-4 h-4 text-cyan-500" />}
      />
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 p-3 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div>
              <strong>Phase 01 Architecture Rule:</strong> The database connection layer is strictly decoupled from the UI and gracefully reports its status. If PostgreSQL is not yet running, the server runs in resilient diagnostic mode without throwing uncaught process errors.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Step 1: Local Docker PostgreSQL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span>1. Launch PostgreSQL (Docker Quickstart)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(dockerCommand, 'docker')}
                  leftIcon={copiedSection === 'docker' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                >
                  {copiedSection === 'docker' ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800">
                {dockerCommand}
              </pre>
            </div>

            {/* Step 2: Environment Variable */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span>2. Define DATABASE_URL in .env</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(envConfig, 'env')}
                  leftIcon={copiedSection === 'env' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                >
                  {copiedSection === 'env' ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800">
                {envConfig}
              </pre>
            </div>
          </div>

          {/* Step 3: Prisma commands */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>3. Prisma Migration & Client Workflow</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(prismaCommands, 'prisma')}
                leftIcon={copiedSection === 'prisma' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              >
                {copiedSection === 'prisma' ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800">
              {prismaCommands}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
