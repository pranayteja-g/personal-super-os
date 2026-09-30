import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import type { MiniAppManifest, PageDef } from "@/types/manifest";
import { componentRegistry } from "@/runtime/registry/componentRegistry";
import { validateManifest } from "@/lib/validation/manifest";
import { scopeConfig } from "@/runtime/manifest/scope";

interface Props {
  manifest: MiniAppManifest;
  pageId?: string;
}

export function ManifestRenderer({ manifest, pageId }: Props) {
  const validation = validateManifest(manifest);
  if (!validation.ok) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorTitle}>Manifest invalid</Text>
        {validation.errors?.map((e) => <Text key={e}>{e}</Text>)}
      </View>
    );
  }

  const page: PageDef | undefined = pageId
    ? manifest.pages.find((p) => p.id === pageId)
    : manifest.pages[0];

  if (!page) return <Text>No page to render</Text>;

  return (
    <ScrollView style={styles.page}>
      {page.components.map((c) => {
        const def = componentRegistry.get(c.type);
        if (!def) {
          return (
            <View key={c.id} style={styles.unknown}>
              <Text>Unsupported component: {c.type}</Text>
            </View>
          );
        }
        const configCheck = def.validateConfig(c.config);
        if (!configCheck.ok) {
          return (
            <View key={c.id} style={styles.unknown}>
              <Text>Bad config for {c.id}: {configCheck.errors?.join(", ")}</Text>
            </View>
          );
        }
        return (
          <View key={c.id} style={styles.componentWrap}>
            {def.render({
              config: scopeConfig(manifest.appId, c.config),
              appId: manifest.appId,
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 12 },
  componentWrap: { marginBottom: 16 },
  unknown: { padding: 12, backgroundColor: "#fee", borderRadius: 8, marginBottom: 8 },
  error: { padding: 16 },
  errorTitle: { fontWeight: "700", marginBottom: 8 },
});
