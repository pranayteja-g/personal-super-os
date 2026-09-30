import { useSyncExternalStore, useCallback } from "react";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository } from "@/db/repositories/recordRepository";

const EMPTY_RECORDS: RecordEntity[] = [];

/**
 * High-performance reactive hook powered by useSyncExternalStore.
 * Returns referentially-stable snapshots of collection records with O(1) retrieval.
 */
export function useCollection(collectionId?: string): RecordEntity[] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!collectionId) return () => {};
      return sqliteRecordRepository.subscribe(collectionId, onStoreChange);
    },
    [collectionId]
  );

  const getSnapshot = useCallback((): RecordEntity[] => {
    if (!collectionId) return EMPTY_RECORDS;
    return sqliteRecordRepository.getCollectionSnapshot(collectionId);
  }, [collectionId]);

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_RECORDS);
}
