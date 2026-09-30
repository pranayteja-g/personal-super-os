import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "@/store/appStore";

export default function Home() {
  const apps = useAppStore((s) => s.apps);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Your Mini-Apps</Text>
        <Pressable style={styles.createBtn} onPress={() => router.push("/builder")}>
          <Text style={styles.createBtnText}>+ New</Text>
        </Pressable>
      </View>
      <FlatList
        data={apps}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/apps/${item.id}`)}>
            <Text style={styles.cardTitle}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  header: { fontSize: 22, fontWeight: "700" },
  createBtn: { backgroundColor: "#4caf50", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { color: "#fff", fontWeight: "700" },
  card: { padding: 16, backgroundColor: "#f2f2f2", borderRadius: 10, marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: "600" },
});
