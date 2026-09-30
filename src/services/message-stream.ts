import { apiClient } from './api';
/** Authenticated SSE over fetch: bearer tokens never appear in URLs or logs. */
export function openMessageStream() {
  const controller = new AbortController();
  const stream = {onmessage: null as ((event: {data: string}) => void) | null, onerror: null as (() => void) | null, close: () => controller.abort()};
  void (async () => {
    try {
      const response = await fetch('/api/messages/stream', {headers: {Authorization: `Bearer ${apiClient.getToken() || ''}`}, signal: controller.signal});
      if (!response.ok || !response.body) throw new Error('Stream unavailable');
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = '';
      while (!controller.signal.aborted) {
        const {value, done} = await reader.read(); if (done) break;
        pending += decoder.decode(value, {stream: true}).replace(/\r\n/g, '\n');
        let end: number;
        while ((end = pending.indexOf('\n\n')) !== -1) {
          const frame = pending.slice(0,end); pending = pending.slice(end+2);
          const data = frame.split('\n').filter(s => s.startsWith('data:')).map(s => s.slice(5).trimStart()).join('\n');
          if (data) stream.onmessage?.({data});
        }
        if (pending.length > 1024*1024) throw new Error('Stream frame too large');
      }
    } catch { if (!controller.signal.aborted) stream.onerror?.(); }
  })();
  return stream;
}
