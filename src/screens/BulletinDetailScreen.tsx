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

export default function BulletinDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Boletín">>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { bulletinId } = route.params || {};
  const {
    bulletins,
    toggleExercise,
    renameBulletin,
    updateBulletinExerciseCount,
    removeBulletin,
  } = useStore();

  const bulletin = bulletins.find((b) => b.id === bulletinId);
  const [title, setTitle] = useState(bulletin?.title ?? "");
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
        <Text>El boletín no existe.</Text>
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
          title="Detalle del boletín"
          subtitle={`Actualizado: ${
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
                  "Eliminar boletín",
                  "¿Seguro que quieres eliminar este boletín?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar",
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
            label="Título"
            value={title}
            onChangeText={setTitle}
            onBlur={() => title.trim() && renameBulletin(bulletin.id, title)}
            returnKeyType="next"
            style={{ marginBottom: 12 }}
          />
          <TextInput
            mode="outlined"
            label="Número de ejercicios"
            value={exerciseCount}
            onChangeText={(text) => {
              // Solo permitir números
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
          <View style={{ height: 12 }} />
          <ProgressBar progress={progress} style={styles.progress} />
          <Text style={styles.progressLabel}>
            {completedCount} de {bulletin.exerciseCount} ejercicios completados
            ({(progress * 100).toFixed(0)}%)
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Ejercicios"
          subtitle="Pulsa para marcar/desmarcar como completado"
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
                <Text style={styles.exerciseNumber}>Ejercicio {num}</Text>
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
