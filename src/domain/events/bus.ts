export type AppEvent =
  | { type: "record.created"; entityType: string; id: string }
  | { type: "record.updated"; entityType: string; id: string }
  | { type: "record.deleted"; entityType: string; id: string }
  | { type: "app.created"; id: string }
  | { type: "app.updated"; id: string }
  | { type: "app.deleted"; id: string };

type Handler = (event: AppEvent) => void;

class EventBus {
  private handlers = new Set<Handler>();

  subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  emit(event: AppEvent): void {
    for (const h of this.handlers) {
      try {
        h(event);
      } catch (err) {
        console.error("EventBus handler error:", err);
      }
    }
  }
}

export const eventBus = new EventBus();
