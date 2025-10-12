import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useStore } from "../store/useStore";

export default function CategoriesScreen() {
  const {
    categories,
    addCategory,
    removeCategory,
    renameCategory,
    moveCategory,
  } = useStore();
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            {editing === item.id ? (
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={editingName}
                onChangeText={setEditingName}
                onSubmitEditing={() => {
                  const name = editingName.trim();
                  if (name) {
                    animate();
                    renameCategory(item.id, name);
                  }
                  setEditing(null);
                }}
                autoFocus
                returnKeyType="done"
              />
            ) : (
              <Text style={styles.name}>{item.name}</Text>
            )}

            {editing === item.id ? (
              <>
                <IconButton
                  icon="content-save"
                  onPress={() => {
                    const name = editingName.trim();
                    if (name) {
                      animate();
                      renameCategory(item.id, name);
                    }
                    setEditing(null);
                  }}
                />
                <IconButton icon="close" onPress={() => setEditing(null)} />
              </>
            ) : (
              <>
                <IconButton
                  icon="pencil"
                  onPress={() => {
                    setEditing(item.id);
                    setEditingName(item.name);
                  }}
                />
                <IconButton
                  icon="arrow-up"
                  disabled={index === 0}
                  onPress={() => {
                    animate();
                    moveCategory(item.id, Math.max(0, index - 1));
                  }}
                />
                <IconButton
                  icon="arrow-down"
                  disabled={index === categories.length - 1}
                  onPress={() => {
                    animate();
                    moveCategory(item.id, index + 1);
                  }}
                />
                <IconButton
                  icon="delete"
                  iconColor="#ef4444"
                  onPress={() => {
                    animate();
                    removeCategory(item.id);
                  }}
                />
              </>
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />

      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Nueva categoría..."
          value={newCat}
          onChangeText={setNewCat}
          onSubmitEditing={() => {
            if (newCat.trim()) {
              addCategory(newCat);
              setNewCat("");
            }
          }}
          returnKeyType="done"
        />
        <Pressable
          style={[styles.addBtn, !newCat.trim() && styles.addBtnDisabled]}
          onPress={() => {
            if (newCat.trim()) {
              addCategory(newCat);
              setNewCat("");
            }
          }}
        >
          <Text style={styles.addBtnText}>Añadir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#fff" },
  row: { flexDirection: "row", alignItems: "center" },
  name: { flex: 1, fontSize: 16 },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#eee",
    marginVertical: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  addRow: { flexDirection: "row", gap: 8, marginTop: 12 },

  btn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  edit: { backgroundColor: "#4b5563" },
  delete: { backgroundColor: "#ef4444" },
  save: { backgroundColor: "#16a34a" },
  btnText: { color: "#fff", fontWeight: "600" },

  addBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  addBtnDisabled: { backgroundColor: "#9cb9f3" },
  addBtnText: { color: "#fff", fontWeight: "600" },
});
