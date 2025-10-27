import React, { useEffect, useMemo, useState } from "react";
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
  Alert,
} from "react-native";
import { IconButton } from "react-native-paper";
import { useStore } from "../store/useStore";
import { getEffectiveCategories } from "../store/useStore";
import { useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const { folderId } = (route.params ?? {}) as { folderId?: string };
  const {
    categories,
    addCategory,
    removeCategory,
    renameCategory,
    folderCategories,
    addFolderCategory,
    removeFolderCategory,
    renameFolderCategory,
    folderCategoryOrder,
    moveFolderEffective,
    hideGlobalInFolder,
    unhideGlobalInFolder,
    folderHiddenGlobals,
  } = useStore();
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const effective = useMemo(
    () =>
      folderId
        ? getEffectiveCategories(
            categories,
            folderCategories[folderId] ?? [],
            folderCategoryOrder[folderId] ?? []
          )
        : categories,
    [categories, folderCategories, folderCategoryOrder, folderId]
  );
  const folderList = useMemo(
    () => (folderId ? folderCategories[folderId] ?? [] : []),
    [folderCategories, folderId]
  );

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
        data={effective}
        keyExtractor={(c) => c.id}
        renderItem={({ item, index }) => {
          const isFolderCat = folderId
            ? item.id.startsWith(`fcat_${folderId}_`)
            : false;
          const hiddenList = folderId
            ? folderHiddenGlobals[folderId] ?? []
            : [];
          const isHiddenGlobal =
            !!folderId && !isFolderCat && hiddenList.includes(item.id);
          const totalGlobal = categories.length;
          const moveUp = () => {
            animate();
            folderId &&
              moveFolderEffective(folderId, item.id, Math.max(0, index - 1));
          };
          const moveDown = () => {
            animate();
            folderId &&
              moveFolderEffective(
                folderId,
                item.id,
                Math.min(effective.length - 1, index + 1)
              );
          };
          return (
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
                      if (isFolderCat && folderId)
                        renameFolderCategory(folderId, item.id, name);
                      else renameCategory(item.id, name);
                    }
                    setEditing(null);
                  }}
                  autoFocus
                  returnKeyType="done"
                />
              ) : (
                <Text
                  style={[styles.name, isHiddenGlobal && { color: "#aaa" }]}
                >
                  {item.name}
                </Text>
              )}

              {editing === item.id ? (
                <>
                  <IconButton
                    icon="content-save"
                    onPress={() => {
                      const name = editingName.trim();
                      if (name) {
                        animate();
                        if (isFolderCat && folderId)
                          renameFolderCategory(folderId, item.id, name);
                        else renameCategory(item.id, name);
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
                    disabled={isHiddenGlobal}
                    onPress={() => {
                      if (isHiddenGlobal) return;
                      setEditing(item.id);
                      setEditingName(item.name);
                    }}
                  />
                  <IconButton
                    icon="arrow-up"
                    disabled={index === 0 || isHiddenGlobal}
                    onPress={moveUp}
                  />
                  <IconButton
                    icon="arrow-down"
                    disabled={index === effective.length - 1 || isHiddenGlobal}
                    onPress={moveDown}
                  />
                  {isHiddenGlobal ? (
                    <IconButton
                      icon="eye"
                      onPress={() =>
                        folderId && unhideGlobalInFolder(folderId, item.id)
                      }
                    />
                  ) : folderId && !isFolderCat ? (
                    <IconButton
                      icon="eye-off"
                      onPress={() => {
                        const name = item.name;
                        Alert.alert(
                          t('categories.hideTitle'),
                          t('categories.hideMessage', { name }),
                          [
                            { text: t('common.cancel'), style: "cancel" },
                            {
                              text: t('categories.hideButton'),
                              style: "destructive",
                              onPress: () =>
                                hideGlobalInFolder(folderId, item.id),
                            },
                          ]
                        );
                      }}
                    />
                  ) : (
                    <IconButton
                      icon="delete"
                      iconColor="#ef4444"
                      onPress={() => {
                        const name = item.name;
                        if (folderId) {
                          Alert.alert(
                            t('categories.deleteTitle'),
                            t('categories.deleteFolderMessage', { name }),
                            [
                              { text: t('common.cancel'), style: "cancel" },
                              {
                                text: t('common.delete'),
                                style: "destructive",
                                onPress: () =>
                                  removeFolderCategory(
                                    folderId as string,
                                    item.id
                                  ),
                              },
                            ]
                          );
                        } else {
                          Alert.alert(
                            t('categories.deleteTitle'),
                            t('categories.deleteMessage'),
                            [
                              { text: t('common.cancel'), style: "cancel" },
                              {
                                text: t('common.delete'),
                                style: "destructive",
                                onPress: () => removeCategory(item.id),
                              },
                            ]
                          );
                        }
                      }}
                    />
                  )}
                </>
              )}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />

      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={
            folderId ? t('categories.add') + " (carpeta)" : t('categories.add')
          }
          value={newCat}
          onChangeText={setNewCat}
          onSubmitEditing={() => {
            if (newCat.trim()) {
              if (folderId) addFolderCategory(folderId, newCat);
              else addCategory(newCat);
              setNewCat("");
            }
          }}
          returnKeyType="done"
        />
        <Pressable
          style={[styles.addBtn, !newCat.trim() && styles.addBtnDisabled]}
          onPress={() => {
            if (newCat.trim()) {
              if (folderId) addFolderCategory(folderId, newCat);
              else addCategory(newCat);
              setNewCat("");
            }
          }}
        >
          <Text style={styles.addBtnText}>{t('common.add')}</Text>
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
