import { createLocalStorageTransactionRepository } from "./localStorageTransactionRepository";
import { createSheetsTransactionRepository } from "./sheetsTransactionRepository";

const sheetsApiUrl = import.meta.env.VITE_SHEETS_API_URL as string | undefined;

export const transactionRepository = sheetsApiUrl
  ? createSheetsTransactionRepository(sheetsApiUrl)
  : createLocalStorageTransactionRepository();
