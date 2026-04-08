import { createContext } from "react";
import type { TransactionRecord } from "@fridge-inventory/shared";

export type TransactionContextValue = {
  records: TransactionRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addRecord: (input: Omit<TransactionRecord, "id" | "recordedAt">) => Promise<TransactionRecord>;
};

export const TransactionContext = createContext<TransactionContextValue | null>(null);
