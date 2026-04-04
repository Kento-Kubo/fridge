import type { InventoryItem, InventoryRepository } from "@fridge-inventory/shared";

function nowIso(): string {
  return new Date().toISOString();
}

export function createMemoryInventoryRepository(
  seed: InventoryItem[] = []
): InventoryRepository {
  const items = new Map<string, InventoryItem>(
    seed.map((item) => [item.id, { ...item }])
  );

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
  };
}
