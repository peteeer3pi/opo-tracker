import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import {
  Button,
  ProgressBar,
  TextInput as PaperInput,
  Card,
  Checkbox,
  Portal,
  Dialog,
  IconButton,
  RadioButton,
} from "react-native-paper";
import { useStore } from "../store/useStore";
import { getEffectiveCategories } from "../store/useStore";
import { globalProgress, topicProgress, folderTotals } from "../utils/progress";

export default function TableScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    topics,
    categories,
    folders,
    folderCategories,
    folderCategoryOrder,
    folderHiddenGlobals,
    toggleCheck,
    addTopic,
    addFolder,
    moveTopicToFolder,
    resetAll,
    incrementReview,
    decrementReview,
  } = useStore();
  const [newTitle, setNewTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteToShow, setNoteToShow] = useState("");
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showMove, setShowMove] = useState(false);
  const [movingTopicId, setMovingTopicId] = useState<string | undefined>(
    undefined
  );

  const [progressFilter, setProgressFilter] = useState<string>("__global__");
  const [showProgressSelector, setShowProgressSelector] = useState(false);

  const [actionsOpen, setActionsOpen] = useState(true);

  React.useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleActions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActionsOpen((v) => !v);
  };

  const global = useMemo(
    () => globalProgress(topics, categories),
    [topics, categories]
  );
  const fade = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fade]);

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

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <Card mode="elevated" style={styles.card}>
        <Card.Title title={`Progreso global ${(global * 100).toFixed(0)}%`} />
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
                ? "Progreso global"
                : `Progreso · ${
                    categories.find((c) => c.id === progressFilter)?.name ?? ""
                  }`}
            </Text>
            <IconButton
              icon="chevron-down"
              onPress={() => setShowProgressSelector(true)}
              style={styles.actionBtn}
            />
          </View>
          {(() => {
            const perCat = categoryProgress(topics);
            const isGlobal = progressFilter === "__global__";
            const value = isGlobal ? global : perCat[progressFilter] ?? 0;
            const idx = categories.findIndex((c) => c.id === progressFilter);
            const color = isGlobal
              ? undefined
              : categoryColors[idx >= 0 ? idx % categoryColors.length : 0];
            return (
              <View style={{ marginTop: 8 }}>
                <View style={styles.catHeaderRow}>
                  <Text style={styles.catName}>Completado</Text>
                  <Text style={styles.catPercent}>{`${Math.round(
                    (value ?? 0) * 100
                  )}%`}</Text>
                </View>
                <ProgressBar
                  progress={value ?? 0}
                  color={color}
                  style={[styles.catBarProgressFull, styles.catBarTrack]}
                />
              </View>
            );
          })()}
          {actionsOpen ? (
            <View style={styles.actionsRow}>
              <Button
                mode="text"
                onPress={() => navigation.navigate("Categorías")}
                icon="tag"
                style={styles.actionBtn}
              >
                Gestionar categorías
              </Button>
              <Button
                mode="text"
                icon="plus"
                onPress={() => setShowAdd(true)}
                style={styles.actionBtn}
              >
                Añadir tema
              </Button>
              <Button
                mode="text"
                icon="folder-plus-outline"
                onPress={() => setShowAddFolder(true)}
                style={styles.actionBtn}
              >
                Nueva carpeta
              </Button>
              <Button
                mode="text"
                icon="backup-restore"
                onPress={() =>
                  Alert.alert(
                    "Reiniciar datos",
                    "Se restaurarán las categorías y temas por defecto y volverás a elegir oposición. ¿Continuar?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Reiniciar",
                        style: "destructive",
                        onPress: () => {
                          resetAll();
                          navigation.reset({
                            index: 0,
                            routes: [{ name: "Selecciona oposición" }],
                          });
                        },
                      },
                    ]
                  )
                }
                style={styles.actionBtn}
              >
                Reiniciar
              </Button>
            </View>
          ) : null}
          <View style={{ alignItems: "center", marginTop: 2 }}>
            <IconButton
              icon={actionsOpen ? "chevron-up" : "chevron-down"}
              size={40}
              onPress={toggleActions}
              style={{ margin: 0 }}
            />
          </View>
        </Card.Content>
      </Card>

      <ScrollView
        contentContainerStyle={
          topics.length === 0 ? styles.emptyContainer : styles.list
        }
      >
        {topics.length === 0 ? (
          <Text style={styles.empty}>Añade tu primer tema</Text>
        ) : (
          <>
            {folders.map((f) => {
              const sectionTopics = topics.filter((t) => t.folderId === f.id);
              const effectiveCats = getEffectiveCategories(
                categories,
                folderCategories[f.id] ?? [],
                folderCategoryOrder[f.id] ?? [],
                folderHiddenGlobals[f.id] ?? []
              );
              const prog = globalProgress(sectionTopics, effectiveCats);
              return (
                <View
                  key={f.id}
                  style={[styles.folderSection, styles.folderSectionBg]}
                >
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("Carpeta", { folderId: f.id })
                    }
                    activeOpacity={0.7}
                  >
                    <Card mode="outlined" style={styles.folderCard}>
                      <Card.Content>
                        <View style={styles.folderHeaderRow}>
                          <IconButton
                            icon="folder-outline"
                            size={18}
                            disabled
                          />
                          <Text style={styles.folderTitle}>{f.name}</Text>
                        </View>
                        <Text
                          style={styles.folderGlobalTitle}
                        >{`Progreso ${Math.round(prog * 100)}%`}</Text>
                        <ProgressBar
                          progress={prog}
                          style={styles.progressFolder}
                        />
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                </View>
              );
            })}

            {(() => {
              const sectionTopics = topics.filter((t) => !t.folderId);
              if (sectionTopics.length === 0) return null;
              const prog = globalProgress(sectionTopics, categories);
              const { done, total } = folderTotals(
                sectionTopics,
                categories,
                undefined
              );
              return (
                <View
                  key="__none__"
                  style={[styles.folderSection, styles.noFolderSectionBg]}
                >
                  {sectionTopics.map((item) => {
                    const progT = topicProgress(item, categories.length);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() =>
                          navigation.navigate("Tema", { topicId: item.id })
                        }
                      >
                        <Card mode="outlined" style={styles.rowCard}>
                          <Card.Title
                            title={item.title}
                            right={() => (
                              <View style={styles.rightIcons}>
                                <IconButton
                                  icon="folder-move-outline"
                                  size={18}
                                  onPress={() => {
                                    setMovingTopicId(item.id);
                                    setShowMove(true);
                                  }}
                                />
                                {item.note && item.note.trim().length > 0 ? (
                                  <IconButton
                                    icon="information-outline"
                                    size={16}
                                    onPress={() => {
                                      setNoteToShow(item.note as string);
                                      setShowNote(true);
                                    }}
                                  />
                                ) : null}
                              </View>
                            )}
                          />
                          <Card.Content>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                            >
                              <View style={styles.checkboxRow}>
                                {categories.map((c) => (
                                  <Pressable
                                    key={c.id}
                                    style={styles.checkboxItem}
                                    onPress={() => toggleCheck(item.id, c.id)}
                                    hitSlop={8}
                                  >
                                    <Checkbox
                                      status={
                                        item.checks[c.id]
                                          ? "checked"
                                          : "unchecked"
                                      }
                                      onPress={() => toggleCheck(item.id, c.id)}
                                    />
                                    <Text style={styles.checkboxLabel}>
                                      {c.name}
                                    </Text>
                                  </Pressable>
                                ))}
                              </View>
                            </ScrollView>
                            <ProgressBar
                              progress={progT}
                              style={styles.progressSmall}
                            />
                            {(() => {
                              const repasadoCat = categories.find(
                                (c) =>
                                  c.id === "repasado" ||
                                  c.name.toLowerCase() === "repasado"
                              );
                              const showReview = repasadoCat
                                ? !!item.checks[repasadoCat.id]
                                : false;
                              if (!showReview) return null;
                              return (
                                <View style={styles.reviewRow}>
                                  <Text style={styles.reviewLabel}>
                                    Repasos
                                  </Text>
                                  <IconButton
                                    icon="minus-circle-outline"
                                    size={18}
                                    onPress={() => decrementReview(item.id)}
                                    disabled={(item.reviewCount ?? 0) <= 0}
                                  />
                                  <Text style={styles.reviewCountText}>
                                    {item.reviewCount ?? 0}
                                  </Text>
                                  <IconButton
                                    icon="plus-circle-outline"
                                    size={18}
                                    onPress={() => incrementReview(item.id)}
                                  />
                                </View>
                              );
                            })()}
                          </Card.Content>
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })()}
          </>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={showAdd} onDismiss={() => setShowAdd(false)}>
          <Dialog.Title>Nuevo tema</Dialog.Title>
          <Dialog.Content>
            <PaperInput
              mode="outlined"
              placeholder="Título del tema"
              value={newTitle}
              onChangeText={setNewTitle}
              returnKeyType="done"
              onSubmitEditing={() => {
                const t = newTitle.trim();
                if (t) {
                  addTopic(t);
                  setNewTitle("");
                  setShowAdd(false);
                }
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAdd(false)}>Cancelar</Button>
            <Button
              onPress={() => {
                const t = newTitle.trim();
                if (t) {
                  addTopic(t);
                  setNewTitle("");
                  setShowAdd(false);
                }
              }}
              disabled={!newTitle.trim()}
            >
              Añadir
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showAddFolder}
          onDismiss={() => setShowAddFolder(false)}
        >
          <Dialog.Title>Nueva carpeta</Dialog.Title>
          <Dialog.Content>
            <PaperInput
              mode="outlined"
              placeholder="Nombre de la carpeta"
              value={newFolderName}
              onChangeText={setNewFolderName}
              returnKeyType="done"
              onSubmitEditing={() => {
                const n = newFolderName.trim();
                if (n) {
                  addFolder(n);
                  setNewFolderName("");
                  setShowAddFolder(false);
                }
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddFolder(false)}>Cancelar</Button>
            <Button
              onPress={() => {
                const n = newFolderName.trim();
                if (n) {
                  addFolder(n);
                  setNewFolderName("");
                  setShowAddFolder(false);
                }
              }}
              disabled={!newFolderName.trim()}
            >
              Crear
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showMove} onDismiss={() => setShowMove(false)}>
          <Dialog.Title>Mover a carpeta</Dialog.Title>
          <Dialog.Content>
            <View style={{ gap: 8 }}>
              <Button
                mode="outlined"
                icon="folder-remove-outline"
                onPress={() => {
                  if (movingTopicId)
                    moveTopicToFolder(movingTopicId, undefined);
                  setShowMove(false);
                }}
              >
                Sin carpeta
              </Button>
              {folders.map((f) => (
                <Button
                  key={f.id}
                  mode="contained-tonal"
                  icon="folder-outline"
                  onPress={() => {
                    if (movingTopicId) moveTopicToFolder(movingTopicId, f.id);
                    setShowMove(false);
                  }}
                >
                  {f.name}
                </Button>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowMove(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showNote} onDismiss={() => setShowNote(false)}>
          <Dialog.Title>Nota</Dialog.Title>
          <Dialog.Content>
            <Text>{noteToShow}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowNote(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showProgressSelector}
          onDismiss={() => setShowProgressSelector(false)}
        >
          <Dialog.Title>Seleccionar progreso</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={{ paddingHorizontal: 16, maxHeight: 360 }}>
              <RadioButton.Group
                onValueChange={(val) => setProgressFilter(val)}
                value={progressFilter}
              >
                <Pressable
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 6,
                  }}
                  onPress={() => setProgressFilter("__global__")}
                >
                  <RadioButton value="__global__" />
                  <Text style={{ marginLeft: 4 }}>Global</Text>
                </Pressable>
                {categories.map((c) => (
                  <Pressable
                    key={c.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 6,
                    }}
                    onPress={() => setProgressFilter(c.id)}
                  >
                    <RadioButton value={c.id} />
                    <Text style={{ marginLeft: 4 }}>{c.name}</Text>
                  </Pressable>
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowProgressSelector(false)}>
              Cerrar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#fafafa" },
  list: { paddingBottom: 100 },
  card: { marginBottom: 12 },
  progress: { height: 10, borderRadius: 8 },
  progressSmall: { height: 8, borderRadius: 8, marginTop: 8 },
  catBarsContainer: { marginTop: 10 },
  catBarsContainerFolder: { marginTop: 10 },
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
  reviewRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  reviewLabel: { color: "#555", marginRight: 6 },
  reviewCountText: { minWidth: 24, textAlign: "center", fontWeight: "600" },
  reviewChip: { alignSelf: "flex-start" },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  folderSection: { marginTop: 12 },
  folderSectionBg: { backgroundColor: "#f8fafc", padding: 8, borderRadius: 10 },
  noFolderSectionBg: {
    backgroundColor: "#f6f6f6",
    padding: 8,
    borderRadius: 10,
  },
  folderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  folderTitle: { fontSize: 16, fontWeight: "700" },
  folderMeta: { color: "#666" },
  folderGlobalTitle: {
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 1,
  },
  folderProgress: { marginBottom: 10 },
  folderProgressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  folderPercent: {
    width: 40,
    textAlign: "right",
    color: "#444",
    fontWeight: "600",
  },
  folderCard: { marginBottom: 6 },
  folderHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressFolder: { height: 10, borderRadius: 8 },
  actionBtn: { maxWidth: "100%", marginBottom: 8 },
  chips: { paddingVertical: 6 },
  chip: { marginRight: 6 },

  rowCard: { marginBottom: 10 },
  checkboxRow: { flexDirection: "row", alignItems: "center" },
  checkboxItem: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  checkboxLabel: { marginLeft: 4 },
  rightIcons: { flexDirection: "row", alignItems: "center" },

  addCard: { position: "absolute", left: 12, right: 12, bottom: 12 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addBtn: { marginLeft: 8 },

  emptyContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { color: "#666" },
});
