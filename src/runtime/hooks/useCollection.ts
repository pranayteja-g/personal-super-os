import { useEffect, useState, useCallback } from "react";
import type { RecordEntity } from "@/domain/entities";
import { sqliteRecordRepository } from "@/db/repositories/recordRepository";
import { eventBus } from "@/domain/events/bus";

// Live records of one collection. Pass undefined for "no collection".
export function useCollection(collectionId?: string): RecordEntity[] {
  const [records, setRecords] = useState<RecordEntity[]>([]);

  const reload = useCallback(async () => {
    if (!collectionId) {
      setRecords([]);
      return;
    }
    setRecords(await sqliteRecordRepository.list({ collectionId }));
  }, [collectionId]);

  useEffect(() => {
    reload();
    return eventBus.subscribe((evt) => {
      if (
        (evt.type === "record.created" || evt.type === "record.updated" || evt.type === "record.deleted") &&
        evt.entityType === collectionId
      ) {
        reload();
      }
    });
  }, [reload, collectionId]);

  return records;
}
