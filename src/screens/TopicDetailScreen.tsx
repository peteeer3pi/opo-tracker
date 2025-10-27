import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  Alert,
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
} from "react-native-paper";
import { useStore } from "../store/useStore";
import { topicProgress } from "../utils/progress";
import { useTranslation } from "react-i18next";

export default function TopicDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, "Tema">>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { topicId } = route.params || {};
  const {
    topics,
    categories,
    toggleCheck,
    renameTopic,
    setTopicNote,
    removeTopic,
  } = useStore();

  const topic = topics.find((t) => t.id === topicId);
  const [title, setTitle] = useState(topic?.title ?? "");
  const [note, setNote] = useState(topic?.note ?? "");
  const [titleHeight, setTitleHeight] = useState(48);

  const progress = useMemo(
    () => (topic ? topicProgress(topic, categories.length) : 0),
    [topic, categories.length]
  );

  React.useEffect(() => {
    if (topic) {
      navigation.setOptions?.({ title: topic.title });
    }
  }, [topic, navigation]);

  if (!topic) {
    return (
      <View style={styles.container}>
        <Text>{t('topic.title')} no existe.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={t('topic.title')}
          subtitle={`${t('topic.updated')}: ${
            topic.updatedAt ? new Date(topic.updatedAt).toLocaleString() : "—"
          }`}
        />
        <Card.Content>
          <TextInput
            mode="outlined"
            label={t('topic.title')}
            value={title}
            onChangeText={setTitle}
            onBlur={() => title.trim() && renameTopic(topic.id, title)}
            returnKeyType="done"
            multiline
            scrollEnabled={false}
            contentStyle={{ textAlignVertical: "top" }}
            style={{ marginBottom: 12 }}
          />
          <TextInput
            mode="outlined"
            label={t('topic.note')}
            placeholder={t('topic.notePlaceholder')}
            value={note}
            onChangeText={setNote}
            onBlur={() => setTopicNote(topic.id, note)}
            multiline
          />
          <View style={{ height: 12 }} />
          <ProgressBar progress={progress} style={styles.progress} />
          <Text style={styles.progressLabel}>
            {t('topic.progress')}: {(progress * 100).toFixed(0)}%
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title={t('categories.title')} subtitle={t('topic.checkSubtitle')} />
        <Card.Content>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              style={styles.row}
              onPress={() => toggleCheck(topic.id, c.id)}
              hitSlop={8}
            >
              <Checkbox
                status={topic.checks[c.id] ? "checked" : "unchecked"}
                onPress={() => toggleCheck(topic.id, c.id)}
              />
              <Text style={styles.catName}>{c.name}</Text>
            </Pressable>
          ))}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        buttonColor="#ef4444"
        textColor="#fff"
        onPress={() => {
          Alert.alert(
            t('topic.deleteTitle'),
            t('topic.deleteMessage'),
            [
              { text: t('common.cancel'), style: "cancel" },
              {
                text: t('common.delete'),
                style: "destructive",
                onPress: () => {
                  removeTopic(topic.id);
                  navigation.goBack();
                },
              },
            ]
          );
        }}
        style={{ alignSelf: "center", marginTop: 12 }}
      >
        {t('topic.deleteTitle')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  card: { marginBottom: 12 },
  progress: { height: 10, borderRadius: 8 },
  progressLabel: { marginTop: 6, color: "#555" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  catName: { fontSize: 16 },
});
