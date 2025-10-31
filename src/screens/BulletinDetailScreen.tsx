import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  Alert,
  Keyboard,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import {
  Button,
  Card,
  Checkbox,
  ProgressBar,
  TextInput,
  IconButton,
} from "react-native-paper";
import { useStore } from "../store/useStore";
import { bulletinProgress } from "../utils/progress";
import { useTranslation } from "react-i18next";

export default function BulletinDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, "Boletín">>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { bulletinId } = route.params || {};
  const {
    bulletins,
    toggleExercise,
    renameBulletin,
    setBulletinNote,
    updateBulletinExerciseCount,
    removeBulletin,
  } = useStore();

  const bulletin = bulletins.find((b) => b.id === bulletinId);
  const [title, setTitle] = useState(bulletin?.title ?? "");
  const [note, setNote] = useState(bulletin?.note ?? "");
  const [exerciseCount, setExerciseCount] = useState(
    bulletin?.exerciseCount.toString() ?? ""
  );

  const progress = useMemo(() => {
    if (!bulletin) return 0;
    const completed = Object.values(bulletin.completedExercises).filter(
      (v) => v
    ).length;
    return bulletin.exerciseCount > 0 ? completed / bulletin.exerciseCount : 0;
  }, [bulletin]);

  const completedCount = useMemo(() => {
    if (!bulletin) return 0;
    return Object.values(bulletin.completedExercises).filter((v) => v).length;
  }, [bulletin]);

  React.useEffect(() => {
    if (bulletin) {
      navigation.setOptions?.({ title: bulletin.title });
    }
  }, [bulletin, navigation]);

  if (!bulletin) {
    return (
      <View style={styles.container}>
        <Text>{t("bulletin.title")} no existe.</Text>
      </View>
    );
  }

  const exercises = Array.from(
    { length: bulletin.exerciseCount },
    (_, i) => i + 1
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={Keyboard.dismiss}>
        <Card style={styles.card}>
          <Card.Title
            title={t("bulletin.title")}
            subtitle={`${t("bulletin.updated")}: ${
              bulletin.updatedAt
                ? new Date(bulletin.updatedAt).toLocaleString()
                : "—"
            }`}
            right={(props) => (
              <IconButton
                {...props}
                icon="delete"
                iconColor="#ef4444"
                onPress={() => {
                  Alert.alert(
                    t("bulletin.deleteTitle"),
                    t("bulletin.deleteMessage"),
                    [
                      { text: t("common.cancel"), style: "cancel" },
                      {
                        text: t("common.delete"),
                        style: "destructive",
                        onPress: () => {
                          removeBulletin(bulletin.id);
                          navigation.goBack();
                        },
                      },
                    ]
                  );
                }}
              />
            )}
          />
          <Card.Content>
            <TextInput
              mode="outlined"
              label={t("bulletin.title")}
              value={title}
              onChangeText={setTitle}
              onBlur={() => title.trim() && renameBulletin(bulletin.id, title)}
              returnKeyType="next"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              mode="outlined"
              label={t("bulletin.exerciseCount")}
              value={exerciseCount}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, "");
                setExerciseCount(numericText);
              }}
              onBlur={() => {
                const count = parseInt(exerciseCount, 10);
                if (count > 0) {
                  updateBulletinExerciseCount(bulletin.id, count);
                } else {
                  setExerciseCount(bulletin.exerciseCount.toString());
                }
              }}
              keyboardType="number-pad"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              mode="outlined"
              label={t("bulletin.note")}
              placeholder={t("bulletin.notePlaceholder")}
              value={note}
              onChangeText={setNote}
              onBlur={() => setBulletinNote(bulletin.id, note)}
              multiline
              style={{ marginBottom: 12 }}
            />
            <View style={{ height: 12 }} />
            <ProgressBar progress={progress} style={styles.progress} />
            <Text style={styles.progressLabel}>
              {t("bulletin.completed")}: {completedCount} /{" "}
              {bulletin.exerciseCount}({(progress * 100).toFixed(0)}%)
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title
            title={t("bulletin.exercises")}
            subtitle={t("bulletin.checkSubtitle")}
          />
          <Card.Content>
            <View style={styles.exercisesGrid}>
              {exercises.map((num) => (
                <Pressable
                  key={num}
                  style={styles.exerciseItem}
                  onPress={() => toggleExercise(bulletin.id, num)}
                  hitSlop={8}
                >
                  <Checkbox
                    status={
                      bulletin.completedExercises[num] ? "checked" : "unchecked"
                    }
                    onPress={() => toggleExercise(bulletin.id, num)}
                  />
                  <Text style={styles.exerciseNumber}>
                    {t("bulletin.exercises")} {num}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card.Content>
        </Card>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  card: { marginBottom: 12 },
  progress: { height: 10, borderRadius: 8 },
  progressLabel: { marginTop: 6, color: "#555" },
  exercisesGrid: { gap: 8 },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  exerciseNumber: { fontSize: 16 },
});
