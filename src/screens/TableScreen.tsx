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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import {
  Button,
  Chip,
  ProgressBar,
  TextInput as PaperInput,
  Card,
  Checkbox,
  Portal,
  Dialog,
  IconButton,
  Menu,
} from "react-native-paper";
import { useStore } from "../store/useStore";
import {
  globalProgress,
  topicProgress,
  folderProgress,
  folderTotals,
} from "../utils/progress";

export default function TableScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    topics,
    categories,
    folders,
    toggleCheck,
    addTopic,
    addFolder,
    renameFolder,
    removeFolder,
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
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [renameFolderId, setRenameFolderId] = useState<string | undefined>(
    undefined
  );
  const [folderMenuOpenId, setFolderMenuOpenId] = useState<string | undefined>(
    undefined
  );
  const [showMove, setShowMove] = useState(false);
  const [movingTopicId, setMovingTopicId] = useState<string | undefined>(
    undefined
  );

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

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <Card mode="elevated" style={styles.card}>
        <Card.Title title={`Progreso global ${(global * 100).toFixed(0)}%`} />
        <Card.Content>
          <ProgressBar
            progress={global}
            animatedValue={undefined}
            style={styles.progress}
          />
          <View style={styles.actionsRow}>
            <Button
              mode="text"
              onPress={() => navigation.navigate("Categorías")}
              icon="tune"
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {categories.map((c) => (
              <Chip key={c.id} style={styles.chip}>
                {c.name}
              </Chip>
            ))}
          </ScrollView>
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
              if (sectionTopics.length === 0) return null;
              const prog = globalProgress(sectionTopics, categories);
              const { done, total } = folderTotals(sectionTopics, categories);
              return (
                <View key={f.id} style={styles.folderSection}>
                  <View style={styles.folderHeader}>
                    <Text style={styles.folderTitle}>{f.name}</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Menu
                        visible={folderMenuOpenId === f.id}
                        onDismiss={() => setFolderMenuOpenId(undefined)}
                        anchor={
                          <IconButton
                            icon="dots-vertical"
                            size={18}
                            onPress={() => setFolderMenuOpenId(f.id)}
                          />
                        }
                      >
                        <Menu.Item
                          onPress={() => {
                            setFolderMenuOpenId(undefined);
                            setRenameFolderId(f.id);
                            setRenameFolderName(f.name);
                            setShowRenameFolder(true);
                          }}
                          title="Renombrar"
                          leadingIcon="pencil-outline"
                        />
                        <Menu.Item
                          onPress={() => {
                            setFolderMenuOpenId(undefined);
                            Alert.alert(
                              "Eliminar carpeta",
                              "Los temas no se borrarán, solo quedarán sin carpeta. ¿Eliminar?",
                              [
                                { text: "Cancelar", style: "cancel" },
                                {
                                  text: "Eliminar",
                                  style: "destructive",
                                  onPress: () => removeFolder(f.id),
                                },
                              ]
                            );
                          }}
                          title="Eliminar"
                          leadingIcon="delete-outline"
                        />
                      </Menu>
                    </View>
                  </View>
                  <Text
                    style={styles.folderGlobalTitle}
                  >{`Progreso ${Math.round(prog * 100)}%`}</Text>
                  <ProgressBar
                    progress={prog}
                    style={[styles.progress, styles.folderProgress]}
                  />
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
            })}

            {(() => {
              const sectionTopics = topics.filter((t) => !t.folderId);
              if (sectionTopics.length === 0) return null;
              const prog = folderProgress(sectionTopics, categories, undefined);
              const { done, total } = folderTotals(
                sectionTopics,
                categories,
                undefined
              );
              return (
                <View key="__none__" style={styles.folderSection}>
                  <View style={styles.folderHeader}>
                    <Text style={styles.folderTitle}>Sin carpeta</Text>
                  </View>
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
                if (n && renameFolderId) {
                  renameFolder(renameFolderId, n);
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
                if (n && renameFolderId) {
                  renameFolder(renameFolderId, n);
                  setShowRenameFolder(false);
                }
              }}
              disabled={!renameFolderName.trim()}
            >
              Guardar
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
  folderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  folderTitle: { fontSize: 16, fontWeight: "700" },
  folderMeta: { color: "#666" },
  folderGlobalTitle: { fontWeight: "700", marginTop: 6, marginBottom: 2 },
  folderProgress: { marginBottom: 10 },
  folderProgressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  folderPercent: {
    width: 40,
    textAlign: "right",
    color: "#444",
    fontWeight: "600",
  },
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
