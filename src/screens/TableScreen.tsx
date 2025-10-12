import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
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
} from "react-native-paper";
import { useStore } from "../store/useStore";
import { globalProgress, topicProgress } from "../utils/progress";

export default function TableScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    topics,
    categories,
    toggleCheck,
    addTopic,
    resetAll,
    incrementReview,
    decrementReview,
  } = useStore();
  const [newTitle, setNewTitle] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteToShow, setNoteToShow] = useState("");

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
              icon="backup-restore"
              onPress={() =>
                Alert.alert(
                  "Reiniciar datos",
                  "Se restaurarán las categorías y temas por defecto. ¿Continuar?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Reiniciar",
                      style: "destructive",
                      onPress: () => resetAll(),
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

      <FlatList
        data={topics}
        keyExtractor={(t) => t.id}
        contentContainerStyle={
          topics.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Añade tu primer tema</Text>
        }
        renderItem={({ item }) => {
          const prog = topicProgress(item, categories.length);
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate("Tema", { topicId: item.id })}
            >
              <Card mode="outlined" style={styles.rowCard}>
                <Card.Title
                  title={item.title}
                  right={() => (
                    <View style={styles.rightIcons}>
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
                  <ProgressBar progress={prog} style={styles.progressSmall} />
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
                        <Chip
                          mode="outlined"
                          compact
                          icon="plus-circle"
                          accessibilityLabel="Sumar repaso (mantén pulsado para restar)"
                          onPress={() => incrementReview(item.id)}
                          onLongPress={() => decrementReview(item.id)}
                          style={styles.reviewChip}
                        >
                          {`Repasos: ${item.reviewCount ?? 0}`}
                        </Chip>
                      </View>
                    );
                  })()}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        }}
      />

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
    justifyContent: "flex-start",
    marginTop: 6,
  },
  actionBtn: { marginRight: 8, marginBottom: 6 },
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
