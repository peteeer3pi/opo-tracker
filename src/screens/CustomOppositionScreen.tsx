import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  IconButton,
  Divider,
  HelperText,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../store/useStore";
import { useTranslation } from "react-i18next";

type Props = {
  navigation: any;
};

export default function CustomOppositionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [oppositionName, setOppositionName] = useState("");
  const [topics, setTopics] = useState<string[]>([""]);
  const [error, setError] = useState("");
  const bulkAddTopics = useStore((s) => s.bulkAddTopics);
  const setOpposition = useStore((s) => s.setOpposition);

  const addTopicField = () => {
    setTopics([...topics, ""]);
  };

  const removeTopicField = (index: number) => {
    if (topics.length === 1) return;
    setTopics(topics.filter((_, i) => i !== index));
  };

  const updateTopic = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const handleCreate = () => {
    const cleanName = oppositionName.trim();
    const cleanTopics = topics.map((t) => t.trim()).filter((t) => t.length > 0);

    if (!cleanName) {
      setError(t('opposition.nameRequired'));
      return;
    }

    if (cleanTopics.length === 0) {
      setError(t('opposition.topicRequired'));
      return;
    }

    setOpposition(cleanName);
    bulkAddTopics(cleanTopics);
    
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              {t('opposition.customTitle')}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {t('opposition.customDescription')}
            </Text>
          </View>

          <Divider style={{ marginBottom: 20 }} />

          <Card mode="elevated" style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t('opposition.name')}
              </Text>
              <TextInput
                mode="outlined"
                label={t('opposition.namePlaceholder')}
                value={oppositionName}
                onChangeText={(text) => {
                  setOppositionName(text);
                  setError("");
                }}
                style={styles.input}
                error={!!error && !oppositionName.trim()}
              />
            </Card.Content>
          </Card>

          <Card mode="elevated" style={styles.card}>
            <Card.Content>
              <View style={styles.topicsHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {t('opposition.topics')}
                </Text>
                <Button
                  mode="text"
                  icon="plus"
                  onPress={addTopicField}
                  compact
                >
                  {t('opposition.addTopic')}
                </Button>
              </View>

              {topics.map((topic, index) => (
                <View key={index} style={styles.topicRow}>
                  <TextInput
                    mode="outlined"
                    label={t('opposition.topicPlaceholder', { number: index + 1 })}
                    value={topic}
                    onChangeText={(text) => updateTopic(index, text)}
                    style={styles.topicInput}
                    dense
                  />
                  {topics.length > 1 && (
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => removeTopicField(index)}
                      iconColor="#ef4444"
                    />
                  )}
                </View>
              ))}

              <HelperText type="info" visible>
                {t('opposition.topicHint')}
              </HelperText>
            </Card.Content>
          </Card>

          {error && (
            <HelperText type="error" visible style={styles.errorText}>
              {error}
            </HelperText>
          )}

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              {t('common.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleCreate}
              style={styles.button}
              icon="check"
            >
              {t('opposition.create')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    lineHeight: 20,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#fff",
  },
  topicsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  topicInput: {
    flex: 1,
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});
