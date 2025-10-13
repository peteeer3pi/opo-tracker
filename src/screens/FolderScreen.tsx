import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import {
  Card,
  Checkbox,
  ProgressBar,
  Button,
  Portal,
  Dialog,
  IconButton,
  Menu,
  TextInput as PaperInput,
} from "react-native-paper";
import { useStore } from "../store/useStore";
import { Alert } from "react-native";
import { globalProgress, topicProgress } from "../utils/progress";

export default function FolderScreen() {
  const route = useRoute<any>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { folderId } = (route.params ?? {}) as { folderId?: string };

  const {
    topics,
    folders,
    categories,
    toggleCheck,
    incrementReview,
    decrementReview,
    moveTopicToFolder,
    renameFolder,
    removeFolder,
  } = useStore();

  const sectionTopics = useMemo(() => {
    return folderId
      ? topics.filter((t) => t.folderId === folderId)
      : topics.filter((t) => !t.folderId);
  }, [topics, folderId]);

  const folderName = useMemo(() => {
    if (!folderId) return "Sin carpeta";
    const f = folders.find((x) => x.id === folderId);
    return f ? f.name : "Carpeta";
  }, [folders, folderId]);

  const prog = useMemo(
    () => globalProgress(sectionTopics, categories),
    [sectionTopics, categories]
  );

  const categoryProgress = (topicsSubset: typeof topics) => {
    const totals: Record<string, { done: number; total: number }> = {};
    categories.forEach(
      (c) => (totals[c.id] = { done: 0, total: topicsSubset.length })
    );
    topicsSubset.forEach((t) => {
      categories.forEach((c) => {
        if (t.checks[c.id]) totals[c.id].done += 1;
      });
    });
    const result: Record<string, number> = {};
    categories.forEach((c) => {
      const { done, total } = totals[c.id];
      result[c.id] = total > 0 ? done / total : 0;
    });
    return result;
  };

  const categoryColors = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f472b6",
    "#84cc16",
    "#a855f7",
    "#fb923c",
  ];

  const [showBulk, setShowBulk] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [menuVisible, setMenuVisible] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState("");

  const candidates = useMemo(() => {
    // If we are inside a folder, candidates are topics NOT in this folder.
    // If "Sin carpeta", candidates are topics currently in ANY folder (to quitar carpeta).
    return folderId
      ? topics.filter((t) => t.folderId !== folderId)
      : topics.filter((t) => !!t.folderId);
  }, [topics, folderId]);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const toggleSelect = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const clearSelection = () => setSelected({});

  const selectAll = () =>
    setSelected(Object.fromEntries(candidates.map((t) => [t.id, true])));

  const applyMove = () => {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    ids.forEach((id) => moveTopicToFolder(id, folderId));
    setShowBulk(false);
    setSelected({});
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card mode="elevated" style={styles.card}>
        <Card.Title
          title={`${folderName} · Progreso ${Math.round(prog * 100)}%`}
          right={() =>
            folderId ? (
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    setRenameFolderName(folderName);
                    setShowRenameFolder(true);
                  }}
                  title="Renombrar"
                  leadingIcon="pencil-outline"
                />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    if (!folderId) return;
                    Alert.alert(
                      "Eliminar carpeta",
                      "Los temas no se borrarán, solo quedarán sin carpeta. ¿Eliminar?",
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Eliminar",
                          style: "destructive",
                          onPress: () => {
                            removeFolder(folderId);
                            navigation.goBack();
                          },
                        },
                      ]
                    );
                  }}
                  title="Eliminar"
                  leadingIcon="delete-outline"
                />
              </Menu>
            ) : null
          }
        />
        <Card.Content>
          <ProgressBar progress={prog} style={styles.progress} />
          <View style={styles.catBarsContainer}>
            {(() => {
              const perCat = categoryProgress(sectionTopics);
              return categories.map((c, idx) => (
                <View key={c.id} style={styles.catItem}>
                  <View style={styles.catHeaderRow}>
                    <Text style={styles.catName}>{c.name}</Text>
                    <Text style={styles.catPercent}>{`${Math.round(
                      (perCat[c.id] ?? 0) * 100
                    )}%`}</Text>
                  </View>
                  <ProgressBar
                    progress={perCat[c.id] ?? 0}
                    color={categoryColors[idx % categoryColors.length]}
                    style={[styles.catBarProgressFull, styles.catBarTrack]}
                  />
                </View>
              ));
            })()}
          </View>
          <View style={styles.bulkRow}>
            <Button
              mode="contained-tonal"
              icon={folderId ? "folder-plus-outline" : "folder-remove-outline"}
              onPress={() => setShowBulk(true)}
            >
              {folderId
                ? "Añadir temas a la carpeta"
                : "Quitar temas de carpetas"}
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={showBulk} onDismiss={() => setShowBulk(false)}>
          <Dialog.Title>
            {folderId
              ? "Selecciona temas a añadir"
              : "Selecciona temas a quitar de carpeta"}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={{ paddingHorizontal: 16, maxHeight: 360 }}>
              {candidates.map((t) => (
                <Pressable
                  key={t.id}
                  style={styles.bulkItem}
                  onPress={() => toggleSelect(t.id)}
                >
                  <Checkbox
                    status={selected[t.id] ? "checked" : "unchecked"}
                    onPress={() => toggleSelect(t.id)}
                  />
                  <Text style={styles.bulkItemText}>{t.title}</Text>
                </Pressable>
              ))}
              {candidates.length === 0 ? (
                <Text style={{ color: "#666" }}>
                  {folderId
                    ? "No hay temas fuera de esta carpeta."
                    : "No hay temas en carpetas."}
                </Text>
              ) : null}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <View style={styles.actionsColumn}>
              <View style={styles.actionsSecondaryRow}>
                <Button
                  compact
                  style={styles.actionBtnSm}
                  onPress={selectAll}
                  disabled={candidates.length === 0}
                >
                  Seleccionar todo
                </Button>
                <Button
                  compact
                  style={styles.actionBtnSm}
                  onPress={clearSelection}
                >
                  Limpiar
                </Button>
                <Button
                  compact
                  style={styles.actionBtnSm}
                  onPress={() => setShowBulk(false)}
                >
                  Cancelar
                </Button>
              </View>
              <Button
                mode="contained"
                style={styles.actionPrimaryFull}
                contentStyle={{ paddingVertical: 8 }}
                onPress={applyMove}
                disabled={selectedCount === 0}
              >
                {folderId
                  ? `Mover aquí (${selectedCount})`
                  : `Quitar carpeta (${selectedCount})`}
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showRenameFolder}
          onDismiss={() => setShowRenameFolder(false)}
        >
          <Dialog.Title>Renombrar carpeta</Dialog.Title>
          <Dialog.Content>
            <PaperInput
              mode="outlined"
              placeholder="Nombre de la carpeta"
              value={renameFolderName}
              onChangeText={setRenameFolderName}
              returnKeyType="done"
              onSubmitEditing={() => {
                const n = renameFolderName.trim();
                if (n && folderId) {
                  renameFolder(folderId, n);
                  setShowRenameFolder(false);
                }
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRenameFolder(false)}>Cancelar</Button>
            <Button
              onPress={() => {
                const n = renameFolderName.trim();
                if (n && folderId) {
                  renameFolder(folderId, n);
                  setShowRenameFolder(false);
                }
              }}
              disabled={!renameFolderName.trim()}
            >
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {sectionTopics.map((item) => {
        const progT = topicProgress(item, categories.length);
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigation.navigate("Tema", { topicId: item.id })}
          >
            <Card mode="outlined" style={styles.rowCard}>
              <Card.Title title={item.title} />
              <Card.Content>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.checkboxRow}>
                    {categories.map((c) => (
                      <Pressable
                        key={c.id}
                        style={styles.checkboxItem}
                        onPress={() => toggleCheck(item.id, c.id)}
                        hitSlop={8}
                      >
                        <Checkbox
                          status={item.checks[c.id] ? "checked" : "unchecked"}
                          onPress={() => toggleCheck(item.id, c.id)}
                        />
                        <Text style={styles.checkboxLabel}>{c.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                <ProgressBar progress={progT} style={styles.progressSmall} />
                {(() => {
                  const repasadoCat = categories.find(
                    (c) =>
                      c.id === "repasado" || c.name.toLowerCase() === "repasado"
                  );
                  const showReview = repasadoCat
                    ? !!item.checks[repasadoCat.id]
                    : false;
                  if (!showReview) return null;
                  return (
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Repasos</Text>
                      <Pressable
                        onPress={() => decrementReview(item.id)}
                        disabled={(item.reviewCount ?? 0) <= 0}
                        style={{
                          opacity: (item.reviewCount ?? 0) <= 0 ? 0.4 : 1,
                          paddingHorizontal: 6,
                        }}
                      >
                        <Text style={styles.reviewButton}>−</Text>
                      </Pressable>
                      <Text style={styles.reviewCountText}>
                        {item.reviewCount ?? 0}
                      </Text>
                      <Pressable
                        onPress={() => incrementReview(item.id)}
                        style={{ paddingHorizontal: 6 }}
                      >
                        <Text style={styles.reviewButton}>+</Text>
                      </Pressable>
                    </View>
                  );
                })()}
              </Card.Content>
            </Card>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  card: { marginBottom: 12 },
  progress: { height: 10, borderRadius: 8 },
  progressSmall: { height: 8, borderRadius: 8, marginTop: 8 },
  catBarsContainer: { marginTop: 10 },
  catItem: { marginTop: 8 },
  catHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  catName: { color: "#111", fontWeight: "500" },
  catPercent: { color: "#444", fontWeight: "600" },
  catBarProgressFull: { height: 8, borderRadius: 6, marginTop: 6 },
  catBarTrack: { backgroundColor: "#e5e7eb" },
  bulkRow: { marginTop: 10 },
  rowCard: { marginBottom: 10 },
  checkboxRow: { flexDirection: "row", alignItems: "center" },
  checkboxItem: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  checkboxLabel: { marginLeft: 4 },
  reviewRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  reviewLabel: { color: "#555", marginRight: 6 },
  reviewButton: { fontSize: 18, fontWeight: "700" },
  reviewCountText: { minWidth: 24, textAlign: "center", fontWeight: "600" },
  bulkItem: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  bulkItemText: { marginLeft: 4 },
  actionsColumn: { width: "100%", gap: 8 },
  actionsSecondaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    columnGap: 8,
    rowGap: 6,
  },
  actionBtnSm: { flexShrink: 1 },
  actionPrimaryFull: { alignSelf: "stretch" },
});
