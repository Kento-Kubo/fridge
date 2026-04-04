import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { InventoryItem } from "@fridge-inventory/shared";
import { createMemoryInventoryRepository } from "./src/data/memoryInventoryRepository";

export default function App() {
  const repo = useMemo(() => createMemoryInventoryRepository(), []);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await repo.list();
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repo]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>冷蔵庫在庫（MVP・手入力予定）</Text>
      {loading ? (
        <ActivityIndicator />
      ) : items.length === 0 ? (
        <Text style={styles.hint}>
          まだ在庫がありません。スプレッドシート連携・追加画面はこれから実装します。
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>×{item.quantity}</Text>
            </View>
          )}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  hint: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  rowName: { fontSize: 16 },
  rowMeta: { fontSize: 16, color: "#666" },
});
