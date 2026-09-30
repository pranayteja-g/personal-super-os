import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { buildSimpleListManifest, buildHabitManifest, buildLoggerManifest } from "@/runtime/manifest/templates";
import { useBuilderStore } from "@/store/builderStore";
import { validateManifest } from "@/lib/validation/manifest";
import { sqliteMiniAppRepository } from "@/db/repositories/miniAppRepository";
import { useAppStore } from "@/store/appStore";

type Pattern = "list" | "habit" | "logger";

const PATTERNS: { id: Pattern; label: string; hint: string }[] = [
  { id: "list", label: "Task List", hint: "Add items, mark done, see a streak (like Day Planner)" },
  { id: "habit", label: "Habit Tracker", hint: "Several habits, checked per day (like Habit Hub)" },
  { id: "logger", label: "Numeric Log", hint: "Log a number per item per day (like Workout Tracker)" },
];

export default function BuilderScreen() {
  const router = useRouter();
  const setDraft = useBuilderStore((s) => s.setDraft);
  const refreshApps = useAppStore((s) => s.refresh);

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [itemLabel, setItemLabel] = useState("");
  const [valueLabel, setValueLabel] = useState("Value");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canContinue = name.trim().length > 0 && pattern !== null;
  const canBuild = itemLabel.trim().length > 0;

  const buildManifest = () => {
    const meta = { name: name.trim() };
    if (pattern === "list") return buildSimpleListManifest(meta, itemLabel.trim());
    if (pattern === "habit") return buildHabitManifest(meta, itemLabel.trim());
    return buildLoggerManifest(meta, itemLabel.trim(), valueLabel.trim() || "Value", unit.trim() || undefined);
  };

  const preview = () => {
    if (!canBuild) return;
    const manifest = buildManifest();
    const check = validateManifest(manifest);
    if (!check.ok) {
      setError(check.errors?.join(", ") ?? "Invalid manifest");
      return;
    }
    setError(null);
    setDraft(manifest);
    router.push("/builder/preview");
  };

  const saveDirect = async () => {
    if (!canBuild) return;
    const manifest = buildManifest();
    const check = validateManifest(manifest);
    if (!check.ok) {
      setError(check.errors?.join(", ") ?? "Invalid manifest");
      return;
    }
    const now = new Date().toISOString();
    await sqliteMiniAppRepository.save({
      id: manifest.appId,
      ownerId: null,
      name: manifest.name,
      icon: manifest.icon,
      version: manifest.schemaVersion,
      manifest,
      createdAt: now,
      updatedAt: now,
    });
    await refreshApps();
    router.replace(`/apps/${manifest.appId}`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create Mini-App</Text>

      {step === 1 && (
        <>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Meal Planner" />

          <Text style={styles.label}>What kind of app?</Text>
          {PATTERNS.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.card, pattern === p.id && styles.cardActive]}
              onPress={() => setPattern(p.id)}
            >
              <Text style={styles.cardTitle}>{p.label}</Text>
              <Text style={styles.cardHint}>{p.hint}</Text>
            </Pressable>
          ))}

          <Pressable
            style={[styles.btn, !canContinue && styles.btnOff]}
            disabled={!canContinue}
            onPress={() => setStep(2)}
          >
            <Text style={styles.btnText}>Continue</Text>
          </Pressable>
        </>
      )}

      {step === 2 && pattern && (
        <>
          <Text style={styles.label}>
            {pattern === "list" ? "What are you tracking? (e.g. Task)" : "What are you tracking? (e.g. Habit, Exercise)"}
          </Text>
          <TextInput style={styles.input} value={itemLabel} onChangeText={setItemLabel} placeholder="e.g. Habit" />

          {pattern === "logger" && (
            <>
              <Text style={styles.label}>What number are you logging? (e.g. Weight, Pages)</Text>
              <TextInput style={styles.input} value={valueLabel} onChangeText={setValueLabel} placeholder="Value" />
              <Text style={styles.label}>Unit (optional)</Text>
              <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="e.g. kg" />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.row}>
            <Pressable style={styles.btnSecondary} onPress={() => setStep(1)}>
              <Text style={styles.btnSecondaryText}>Back</Text>
            </Pressable>
            <Pressable style={[styles.btn, !canBuild && styles.btnOff]} disabled={!canBuild} onPress={preview}>
              <Text style={styles.btnText}>Preview</Text>
            </Pressable>
          </View>
          <Pressable style={[styles.btnOutline, !canBuild && styles.btnOff]} disabled={!canBuild} onPress={saveDirect}>
            <Text style={styles.btnOutlineText}>Save without preview</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 14, color: "#555", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  card: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 8 },
  cardActive: { borderColor: "#4caf50", backgroundColor: "#f1f8f2" },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardHint: { fontSize: 13, color: "#888", marginTop: 2 },
  row: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: { flex: 1, backgroundColor: "#4caf50", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  btnOff: { backgroundColor: "#bbb" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnSecondary: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnSecondaryText: { color: "#555", fontWeight: "600" },
  btnOutline: { borderWidth: 1, borderColor: "#4caf50", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  btnOutlineText: { color: "#4caf50", fontWeight: "600" },
  error: { color: "#c62828", marginTop: 8 },
});
