import type {
  InventoryItem,
  InventoryMovement,
  InventoryRepository,
} from "@fridge-inventory/shared";

function nowIso(): string {
  return new Date().toISOString();
}

export function createMemoryInventoryRepository(
  seed: InventoryItem[] = []
): InventoryRepository {
  const items = new Map<string, InventoryItem>(
    seed.map((item) => [item.id, { ...item }])
  );
  const movements = new Map<string, InventoryMovement>();

  return {
    async list() {
      return [...items.values()].sort((a, b) =>
        a.name.localeCompare(b.name, "ja")
      );
    },
    async upsert(input) {
      const id = input.id ?? `local-${Date.now()}`;
      const row: InventoryItem = {
        ...input,
        id,
        updatedAt: nowIso(),
        source: input.source ?? "manual",
      };
      items.set(id, row);
      return { ...row };
    },
    async remove(id) {
      items.delete(id);
    },
    async listMovements() {
      return [...movements.values()].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
    },
    async upsertMovement(input) {
      const id = input.id ?? `mv-${Date.now()}`;
      const row: InventoryMovement = {
        ...input,
        id,
        updatedAt: nowIso(),
      };
      movements.set(id, row);
      return { ...row };
    },
    async removeMovement(id) {
      movements.delete(id);
    },
  };
}
