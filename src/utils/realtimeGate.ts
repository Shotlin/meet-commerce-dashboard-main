/**
 * Drops duplicate / out-of-order realtime events. The server stamps every
 * `order:status` / `refund:status` event with a strictly-increasing `seq` and
 * a unique `eventId`; applying an older one after a newer one would roll a
 * screen back. Events without a `seq` (older backend) always pass.
 */
export function createRealtimeGate(maxKeys = 500) {
  const lastSeq = new Map<string, number>(); // insertion order = cheap LRU
  const seenEventIds: string[] = [];
  const seenSet = new Set<string>();

  return {
    accept(key: string, seq?: number, eventId?: string): boolean {
      if (eventId && seenSet.has(eventId)) return false;
      if (typeof seq === 'number') {
        const last = lastSeq.get(key);
        if (last !== undefined && seq <= last) return false;
        lastSeq.delete(key);
        lastSeq.set(key, seq);
        if (lastSeq.size > maxKeys) lastSeq.delete(lastSeq.keys().next().value as string);
      }
      if (eventId) {
        seenEventIds.push(eventId);
        seenSet.add(eventId);
        if (seenEventIds.length > maxKeys) seenSet.delete(seenEventIds.shift() as string);
      }
      return true;
    },
  };
}
