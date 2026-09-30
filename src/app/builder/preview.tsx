import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useBuilderStore } from "@/store/builderStore";
import { ManifestRenderer } from "@/runtime/renderer/ManifestRenderer";
import { sqliteMiniAppRepository } from "@/db/repositories/miniAppRepository";
import { useAppStore } from "@/store/appStore";

export default function BuilderPreview() {
  const router = useRouter();
  const draft = useBuilderStore((s) => s.draft);
  const clear = useBuilderStore((s) => s.clear);
  const refreshApps = useAppStore((s) => s.refresh);

  if (!draft) {
    return (
      <View style={styles.center}>
        <Text>No draft to preview.</Text>
      </View>
    );
  }

  const save = async () => {
    const now = new Date().toISOString();
    await sqliteMiniAppRepository.save({
      id: draft.appId,
      ownerId: null,
      name: draft.name,
      icon: draft.icon,
      version: draft.schemaVersion,
      manifest: draft,
      createdAt: now,
      updatedAt: now,
    });
    await refreshApps();
    clear();
    router.replace(`/apps/${draft.appId}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `Preview: ${draft.name}` }} />
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Preview — not saved yet</Text>
      </View>
      <ManifestRenderer manifest={draft} />
      <View style={styles.footer}>
        <Pressable style={styles.btnSecondary} onPress={() => router.back()}>
          <Text style={styles.btnSecondaryText}>Edit</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={save}>
          <Text style={styles.btnText}>Save & use</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  banner: { backgroundColor: "#fff3cd", padding: 8, alignItems: "center" },
  bannerText: { color: "#856404", fontSize: 12, fontWeight: "600" },
  footer: { flexDirection: "row", gap: 10, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#ddd" },
  btn: { flex: 1, backgroundColor: "#4caf50", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnSecondary: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnSecondaryText: { color: "#555", fontWeight: "600" },
});
