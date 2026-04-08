import { useContext } from "react";
import { TransactionContext } from "./transactionContextBase";

export function useTransaction() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransaction must be used within TransactionProvider");
  return ctx;
}
