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
  RadioButton,
  TextInput as PaperInput,
} from "react-native-paper";
import { useStore, getEffectiveCategories } from "../store/useStore";
import { Alert } from "react-native";
import {
  globalProgress,
  topicProgress,
  folderProgressWithBulletins,
  bulletinsOnlyProgress,
} from "../utils/progress";
import { useTranslation } from "react-i18next";

export default function FolderScreen() {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { folderId } = (route.params ?? {}) as { folderId?: string };

  const {
    topics,
    bulletins,
    folders,
    categories,
    folderCategories,
    folderCategoryOrder,
    folderHiddenGlobals,
    toggleCheck,
    incrementReview,
    decrementReview,
    moveTopicToFolder,
    moveBulletinToFolder,
    renameFolder,
    removeFolder,
  } = useStore();

  const sectionTopics = useMemo(() => {
    return folderId
      ? topics.filter((t) => t.folderId === folderId)
      : topics.filter((t) => !t.folderId);
  }, [topics, folderId]);

  const sectionBulletins = useMemo(() => {
    return folderId
      ? bulletins.filter((b) => b.folderId === folderId)
      : bulletins.filter((b) => !b.folderId);
  }, [bulletins, folderId]);

  const folderName = useMemo(() => {
    if (!folderId) return "Sin carpeta";
    const f = folders.find((x) => x.id === folderId);
    return f ? f.name : "Carpeta";
  }, [folders, folderId]);

  const effectiveCategories = useMemo(
    () =>
      folderId
        ? getEffectiveCategories(
            categories,
            folderCategories[folderId] ?? [],
            folderCategoryOrder[folderId] ?? [],
            folderHiddenGlobals[folderId] ?? []
          )
        : categories,
    [
      categories,
      folderCategories,
      folderCategoryOrder,
      folderHiddenGlobals,
      folderId,
    ]
  );

  const prog = useMemo(
    () =>
      folderProgressWithBulletins(
        sectionTopics,
        effectiveCategories,
        sectionBulletins,
        folderId
      ),
    [sectionTopics, effectiveCategories, sectionBulletins, folderId]
  );

  const bulletinsProgress = useMemo(
    () => bulletinsOnlyProgress(sectionBulletins),
    [sectionBulletins]
  );

  const categoryProgress = (topicsSubset: typeof topics) => {
    const totals: Record<string, { done: number; total: number }> = {};
    effectiveCategories.forEach(
      (c) => (totals[c.id] = { done: 0, total: topicsSubset.length })
    );
    topicsSubset.forEach((t) => {
      effectiveCategories.forEach((c) => {
        if (t.checks[c.id]) totals[c.id].done += 1;
      });
    });
    const result: Record<string, number> = {};
    effectiveCategories.forEach((c) => {
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

  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState("");

  const [progressFilter, setProgressFilter] = useState<string>("__global__");
  const [showProgressSelector, setShowProgressSelector] = useState(false);

  const candidates = useMemo(() => {
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
          title={`${folderName} · ${t("folder.progress")} ${Math.round(
            prog * 100
          )}%`}
          right={() =>
            folderId ? (
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => {
                  Alert.alert(t("folder.actions"), folderName, [
                    {
                      text: t("folder.renameButton"),
                      onPress: () => {
                        setRenameFolderName(folderName);
                        setShowRenameFolder(true);
                      },
                    },
                    {
                      text: t("folder.deleteButton"),
                      style: "destructive",
                      onPress: () => {
                        if (!folderId) return;
                        Alert.alert(
                          t("folder.deleteTitle"),
                          t("folder.deleteMessage"),
                          [
                            { text: t("common.cancel"), style: "cancel" },
                            {
                              text: t("folder.deleteButton"),
                              style: "destructive",
                              onPress: () => {
                                removeFolder(folderId);
                                navigation.goBack();
                              },
                            },
                          ]
                        );
                      },
                    },
                    { text: t("common.cancel"), style: "cancel" },
                  ]);
                }}
              />
            ) : null
          }
        />
        <Card.Content>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={styles.catName}>
              {progressFilter === "__global__"
                ? t("folder.globalProgress")
                : progressFilter === "__bulletins__"
                ? "Progreso de Boletines"
                : `${t("folder.progressBy")} · ${
                    categories.find((c) => c.id === progressFilter)?.name ?? ""
                  }`}
            </Text>
            <IconButton
              icon="chevron-down"
              onPress={() => setShowProgressSelector(true)}
            />
          </View>
          {(() => {
            const perCat = categoryProgress(sectionTopics);
            const isGlobal = progressFilter === "__global__";
            const isBulletins = progressFilter === "__bulletins__";
            let value = 0;
            if (isGlobal) {
              value = prog;
            } else if (isBulletins) {
              value = bulletinsProgress;
            } else {
              value = perCat[progressFilter] ?? 0;
            }
            const idx = effectiveCategories.findIndex(
              (c) => c.id === progressFilter
            );
            const color =
              isGlobal || isBulletins
                ? undefined
                : categoryColors[idx >= 0 ? idx % categoryColors.length : 0];
            return (
              <View style={{ marginTop: 8 }}>
                <View style={styles.catHeaderRow}>
                  <Text style={styles.catName}>{t("folder.completed")}</Text>
                  <Text style={styles.catPercent}>
                    {`${Math.round((value ?? 0) * 100)}%`}
                  </Text>
                </View>
                <ProgressBar
                  progress={value ?? 0}
                  color={color}
                  style={[styles.catBarProgressFull, styles.catBarTrack]}
                />
              </View>
            );
          })()}
          <View
            style={[
              styles.bulkRow,
              {
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                columnGap: 8,
                rowGap: 6,
              },
            ]}
          >
            <Button
              mode="text"
              compact
              icon={folderId ? "folder-plus-outline" : "folder-remove-outline"}
              onPress={() => setShowBulk(true)}
              style={styles.actionBtnSm}
            >
              {folderId ? t("folder.addTopics") : t("folder.removeTopics")}
            </Button>
            {folderId ? (
              <Button
                mode="text"
                compact
                icon="tag"
                onPress={() => navigation.navigate("Categorías", { folderId })}
                style={styles.actionBtnSm}
              >
                {t("folder.manageCategories")}
              </Button>
            ) : null}
          </View>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={showBulk} onDismiss={() => setShowBulk(false)}>
          <Dialog.Title>
            {folderId ? t("folder.selectToAdd") : t("folder.selectToRemove")}
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
                  {t("common.selectAll")}
                </Button>
                <Button
                  compact
                  style={styles.actionBtnSm}
                  onPress={clearSelection}
                >
                  {t("common.clear")}
                </Button>
                <Button
                  compact
                  style={styles.actionBtnSm}
                  onPress={() => setShowBulk(false)}
                >
                  {t("common.cancel")}
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
                  ? `${t("common.move")} (${selectedCount})`
                  : `${t("folder.removeTopics")} (${selectedCount})`}
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showRenameFolder}
          onDismiss={() => setShowRenameFolder(false)}
        >
          <Dialog.Title>{t("folder.rename")}</Dialog.Title>
          <Dialog.Content>
            <PaperInput
              mode="outlined"
              placeholder={t("folder.name")}
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
            <Button onPress={() => setShowRenameFolder(false)}>
              {t("common.cancel")}
            </Button>
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
              {t("common.save")}
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={showProgressSelector}
          onDismiss={() => setShowProgressSelector(false)}
        >
          <Dialog.Title>{t("folder.progress")}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={{ paddingHorizontal: 16, maxHeight: 360 }}>
              <RadioButton.Group
                onValueChange={(val) => setProgressFilter(val)}
                value={progressFilter}
              >
                <Pressable
                  style={styles.bulkItem}
                  onPress={() => setProgressFilter("__global__")}
                >
                  <RadioButton value="__global__" />
                  <Text style={styles.bulkItemText}>Global</Text>
                </Pressable>
                {categories.map((c) => (
                  <Pressable
                    key={c.id}
                    style={styles.bulkItem}
                    onPress={() => setProgressFilter(c.id)}
                  >
                    <RadioButton value={c.id} />
                    <Text style={styles.bulkItemText}>{c.name}</Text>
                  </Pressable>
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowProgressSelector(false)}>
              {t("common.close")}
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={showProgressSelector}
          onDismiss={() => setShowProgressSelector(false)}
        >
          <Dialog.Title>{t("folder.progress")}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={{ paddingHorizontal: 16, maxHeight: 360 }}>
              <RadioButton.Group
                onValueChange={(val) => setProgressFilter(val)}
                value={progressFilter}
              >
                <Pressable
                  style={styles.bulkItem}
                  onPress={() => setProgressFilter("__global__")}
                >
                  <RadioButton value="__global__" />
                  <Text style={styles.bulkItemText}>Global</Text>
                </Pressable>
                <Pressable
                  style={styles.bulkItem}
                  onPress={() => setProgressFilter("__bulletins__")}
                >
                  <RadioButton value="__bulletins__" />
                  <Text style={styles.bulkItemText}>Boletines</Text>
                </Pressable>
                {effectiveCategories.map((c) => (
                  <Pressable
                    key={c.id}
                    style={styles.bulkItem}
                    onPress={() => setProgressFilter(c.id)}
                  >
                    <RadioButton value={c.id} />
                    <Text style={styles.bulkItemText}>{c.name}</Text>
                  </Pressable>
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowProgressSelector(false)}>
              {t("common.close")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {sectionBulletins.map((bulletin) => {
        const completed = Object.values(bulletin.completedExercises).filter(
          (v) => v
        ).length;
        const progB =
          bulletin.exerciseCount > 0 ? completed / bulletin.exerciseCount : 0;
        return (
          <TouchableOpacity
            key={bulletin.id}
            onPress={() =>
              navigation.navigate("Boletín", { bulletinId: bulletin.id })
            }
          >
            <Card mode="outlined" style={styles.rowCard}>
              <Card.Title
                title={bulletin.title}
                subtitle={`${completed} de ${bulletin.exerciseCount} ejercicios`}
                left={(props) => (
                  <IconButton
                    {...props}
                    icon="file-document-outline"
                    size={20}
                  />
                )}
                right={() =>
                  folderId ? (
                    <IconButton
                      icon="folder-remove-outline"
                      size={18}
                      onPress={() => {
                        Alert.alert(
                          "Quitar de la carpeta",
                          "Este boletín pasará a estar fuera de la carpeta. ¿Confirmar?",
                          [
                            { text: "Cancelar", style: "cancel" },
                            {
                              text: "Quitar",
                              onPress: () =>
                                moveBulletinToFolder(bulletin.id, undefined),
                            },
                          ]
                        );
                      }}
                    />
                  ) : null
                }
              />
              <Card.Content>
                <ProgressBar progress={progB} style={styles.progressSmall} />
                <Text style={styles.progressLabel}>
                  {(progB * 100).toFixed(0)}% completado
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        );
      })}

      {sectionTopics.map((item) => {
        const progT = topicProgress(item, effectiveCategories.length);
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigation.navigate("Tema", { topicId: item.id })}
          >
            <Card mode="outlined" style={styles.rowCard}>
              <Card.Title
                title={item.title}
                right={() =>
                  folderId ? (
                    <IconButton
                      icon="folder-remove-outline"
                      size={18}
                      onPress={() => {
                        Alert.alert(
                          "Quitar de la carpeta",
                          "Este tema pasará a estar fuera de la carpeta. ¿Confirmar?",
                          [
                            { text: "Cancelar", style: "cancel" },
                            {
                              text: "Quitar",
                              onPress: () =>
                                moveTopicToFolder(item.id, undefined),
                            },
                          ]
                        );
                      }}
                    />
                  ) : null
                }
              />
              <Card.Content>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.checkboxRow}>
                    {effectiveCategories.map((c) => (
                      <Pressable
                        key={c.id}
                        style={styles.checkboxItem}
                        onPress={() =>
                          toggleCheck(item.id, c.id, effectiveCategories.length)
                        }
                        hitSlop={8}
                      >
                        <Checkbox
                          status={item.checks[c.id] ? "checked" : "unchecked"}
                          onPress={() =>
                            toggleCheck(
                              item.id,
                              c.id,
                              effectiveCategories.length
                            )
                          }
                        />
                        <Text style={styles.checkboxLabel}>{c.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                <ProgressBar progress={progT} style={styles.progressSmall} />
                {(() => {
                  const repasadoCat = effectiveCategories.find(
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
  progressLabel: { marginTop: 6, color: "#555", fontSize: 12 },
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
