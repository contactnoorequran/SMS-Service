/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './context/AuthContext';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </AppErrorBoundary>
  );
}

