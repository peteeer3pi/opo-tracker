import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  Platform,
  Animated,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import {
  Card,
  Button,
  ProgressBar,
  IconButton,
  Portal,
  Dialog,
  Chip,
} from "react-native-paper";
import { useStore } from "../store/useStore";
import { generateStudyPlan, getStudyRecommendation } from "../utils/planner";
import type { StudyItem } from "../utils/planner";
import {
  analyzeStudyPatterns,
  predictPerformance,
  generateWeeklyPlan,
  generateAIRecommendations,
} from "../utils/aiPlanner";
import type { AIRecommendation, WeeklyPlan } from "../utils/aiPlanner";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";

export default function PlannerScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { topics, bulletins, categories, examDate, setExamDate } = useStore();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(
    examDate ? new Date(examDate) : new Date()
  );
  const [showFullPlan, setShowFullPlan] = useState(false);

  React.useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const togglePlan = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFullPlan(!showFullPlan);
  };

  const plan = useMemo(() => {
    const examDateObj = examDate ? new Date(examDate) : undefined;
    return generateStudyPlan(topics, bulletins, categories, examDateObj);
  }, [topics, bulletins, categories, examDate]);

  const recommendation = useMemo(() => getStudyRecommendation(plan), [plan]);

  const patterns = useMemo(
    () => analyzeStudyPatterns(topics, bulletins),
    [topics, bulletins]
  );

  const prediction = useMemo(() => {
    const examDateObj = examDate ? new Date(examDate) : undefined;
    return predictPerformance(
      topics,
      bulletins,
      categories,
      examDateObj,
      patterns
    );
  }, [topics, bulletins, categories, examDate, patterns]);

  const weeklyPlan = useMemo(() => {
    const examDateObj = examDate ? new Date(examDate) : undefined;
    const defaultWeeks = 8;
    return generateWeeklyPlan(
      topics,
      bulletins,
      categories,
      examDateObj,
      defaultWeeks
    );
  }, [topics, bulletins, categories, examDate]);

  const aiRecommendations = useMemo(() => {
    const examDateObj = examDate ? new Date(examDate) : undefined;
    return generateAIRecommendations(
      topics,
      bulletins,
      categories,
      patterns,
      prediction,
      examDateObj
    );
  }, [topics, bulletins, categories, patterns, prediction, examDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === "android") {
        setExamDate(selectedDate.toISOString());
      }
    }
  };

  const confirmDate = () => {
    setExamDate(tempDate.toISOString());
    setShowDatePicker(false);
  };

  const clearDate = () => {
    setExamDate(undefined);
    setShowDatePicker(false);
  };

  const renderStudyItem = (item: StudyItem) => {
    const priorityColors = {
      urgent: "#ef4444",
      high: "#f97316",
      medium: "#eab308",
      low: "#22c55e",
    };

    const priorityLabels = {
      urgent: t('planner.priorityUrgent'),
      high: t('planner.priorityHigh'),
      medium: t('planner.priorityMedium'),
      low: t('planner.priorityLow'),
    };

    return (
      <Pressable
        key={item.id}
        onPress={() => {
          if (item.type === "topic") {
            navigation.navigate("Tema", { topicId: item.id });
          } else {
            navigation.navigate("Boletín", { bulletinId: item.id });
          }
        }}
      >
        <Card mode="outlined" style={styles.itemCard}>
          <Card.Content>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.itemTitleRow}>
                  <IconButton
                    icon={
                      item.type === "topic"
                        ? "book-outline"
                        : "file-document-outline"
                    }
                    size={18}
                    style={{ margin: 0 }}
                  />
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
                <Text style={styles.itemReason}>{item.reason}</Text>
              </View>
              <Chip
                mode="flat"
                style={{
                  backgroundColor: priorityColors[item.priority],
                }}
                textStyle={{ color: "#fff", fontSize: 11, fontWeight: "600" }}
              >
                {priorityLabels[item.priority]}
              </Chip>
            </View>
            <ProgressBar
              progress={item.progress}
              style={styles.itemProgress}
              color={priorityColors[item.priority]}
            />
            <Text style={styles.itemProgressText}>
              {(item.progress * 100).toFixed(0)}% completado
            </Text>
          </Card.Content>
        </Card>
      </Pressable>
    );
  };

  const renderPrioritySection = (
    title: string,
    items: StudyItem[],
    icon: string,
    color: string
  ) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconButton icon={icon} size={20} iconColor={color} />
          <Text style={[styles.sectionTitle, { color }]}>
            {title} ({items.length})
          </Text>
        </View>
        {items.slice(0, 5).map(renderStudyItem)}
        {items.length > 5 && (
          <Text style={styles.moreText}>Y {items.length - 5} más...</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card mode="elevated" style={styles.card}>
        <Card.Title
          title={t('planner.smartTitle')}
          subtitle={t('planner.subtitle')}
          left={(props) => <IconButton {...props} icon="brain" />}
        />
        <Card.Content>
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>{t('planner.examDate')}:</Text>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              {examDate
                ? new Date(examDate).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Configurar fecha"}
            </Button>
          </View>

          {plan.stats.daysUntilExam !== undefined && (
            <View style={styles.daysCard}>
              <Text style={styles.daysNumber}>{plan.stats.daysUntilExam}</Text>
              <Text style={styles.daysLabel}>días hasta el examen</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card mode="elevated" style={styles.card}>
        <Card.Title title="Estadísticas" />
        <Card.Content>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{plan.stats.totalItems}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: "#ef4444" }]}>
                {plan.stats.itemsNotStarted}
              </Text>
              <Text style={styles.statLabel}>Sin empezar</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: "#f97316" }]}>
                {plan.stats.itemsInProgress}
              </Text>
              <Text style={styles.statLabel}>En progreso</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: "#22c55e" }]}>
                {plan.stats.itemsCompleted}
              </Text>
              <Text style={styles.statLabel}>Completados</Text>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <Text style={styles.avgProgressLabel}>Progreso promedio</Text>
            <ProgressBar
              progress={plan.stats.avgProgress}
              style={styles.avgProgress}
            />
            <Text style={styles.avgProgressText}>
              {(plan.stats.avgProgress * 100).toFixed(0)}%
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Predicción */}
      <Card mode="elevated" style={styles.card}>
        <Card.Title
          title="Análisis de tu progreso"
          subtitle="Basado en tu ritmo de estudio"
          left={(props) => <IconButton {...props} icon="chart-line" />}
        />
        <Card.Content>
          <View
            style={[
              styles.predictionCard,
              {
                backgroundColor: prediction.willFinishOnTime
                  ? "#dcfce7"
                  : "#fee2e2",
              },
            ]}
          >
            <IconButton
              icon={
                prediction.willFinishOnTime ? "check-circle" : "alert-circle"
              }
              iconColor={prediction.willFinishOnTime ? "#16a34a" : "#ef4444"}
              size={32}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.predictionTitle,
                  {
                    color: prediction.willFinishOnTime ? "#16a34a" : "#ef4444",
                  },
                ]}
              >
                {prediction.willFinishOnTime
                  ? t('planner.onTrack')
                  : t('planner.needsAdjustment')}
              </Text>
              <Text style={styles.predictionText}>
                {prediction.recommendation}
              </Text>
              <Text style={styles.predictionDetail}>
                {t('planner.estimatedCompletion')}:{" "}
                {prediction.estimatedCompletionDate.toLocaleDateString(
                  "es-ES",
                  {
                    day: "numeric",
                    month: "long",
                  }
                )}
              </Text>
            </View>
          </View>

          <View style={styles.patternsSection}>
            <Text style={styles.sectionSubtitle}>{t('planner.studyPatterns')}:</Text>
            <View style={styles.patternRow}>
              <Text style={styles.patternLabel}>{t('planner.consistency')}:</Text>
              <ProgressBar
                progress={patterns.consistencyScore}
                style={styles.patternBar}
                color={
                  patterns.consistencyScore > 0.7
                    ? "#22c55e"
                    : patterns.consistencyScore > 0.4
                    ? "#eab308"
                    : "#ef4444"
                }
              />
              <Text style={styles.patternValue}>
                {(patterns.consistencyScore * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.patternRow}>
              <Text style={styles.patternLabel}>{t('planner.frequency')}:</Text>
              <Text style={styles.patternValue}>
                {Math.round(patterns.studyFrequency * 7)} {t('planner.daysPerWeek')}
              </Text>
            </View>
            <View style={styles.patternRow}>
              <Text style={styles.patternLabel}>{t('planner.progressPerDay')}:</Text>
              <Text style={styles.patternValue}>
                {patterns.averageProgressPerDay.toFixed(1)} {t('planner.items')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card mode="elevated" style={styles.card}>
        <Card.Title
          title={t('planner.personalizedTips')}
          subtitle={t('planner.suggestions', { count: aiRecommendations.length })}
          left={(props) => <IconButton {...props} icon="lightbulb-on" />}
        />
        <Card.Content>
          {aiRecommendations.map((rec, index) => {
            const iconMap = {
              warning: "alert",
              success: "check-circle",
              info: "information",
              tip: "lightbulb",
            };
            const colorMap = {
              warning: "#f97316",
              success: "#22c55e",
              info: "#3b82f6",
              tip: "#eab308",
            };
            return (
              <View key={index} style={styles.recommendationItem}>
                <IconButton
                  icon={iconMap[rec.type]}
                  iconColor={colorMap[rec.type]}
                  size={20}
                  style={{ margin: 0 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                  <Text style={styles.recMessage}>{rec.message}</Text>
                </View>
              </View>
            );
          })}
        </Card.Content>
      </Card>

      {/* Plan Semanal */}
      {weeklyPlan.length > 0 && (
        <Card mode="elevated" style={styles.card}>
          <Card.Title
            title={t('planner.studyPlan')}
            subtitle={t('planner.weeklyPlan', { count: weeklyPlan.length })}
            left={(props) => <IconButton {...props} icon="calendar-month" />}
          />
          <Card.Content>
            <>
              {(showFullPlan ? weeklyPlan : weeklyPlan.slice(0, 2)).map(
                (week) => (
                  <View key={week.weekNumber} style={styles.weekCard}>
                    <View style={styles.weekHeader}>
                      <Text style={styles.weekTitle}>
                        {t('planner.week', { number: week.weekNumber })}
                      </Text>
                      <Text style={styles.weekDate}>
                        {week.startDate.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        -{" "}
                        {week.endDate.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                    </View>
                    <Text style={styles.weekHours}>
                      {t('planner.suggestedTopics', { count: week.itemCount })}
                    </Text>
                    {week.items.map((item, idx) => {
                      const isReview = (item as any).isReview || false;
                      return (
                        <Pressable
                          key={idx}
                          style={[
                            styles.weekItem,
                            isReview && styles.weekItemReview,
                          ]}
                          onPress={() => {
                            if (item.type === "topic") {
                              navigation.navigate("Tema", {
                                topicId: item.id,
                              });
                            } else {
                              navigation.navigate("Boletín", {
                                bulletinId: item.id,
                              });
                            }
                          }}
                        >
                          <IconButton
                            icon={
                              isReview
                                ? "refresh"
                                : item.type === "topic"
                                ? "book-outline"
                                : "file-document-outline"
                            }
                            size={16}
                            style={{ margin: 0 }}
                            iconColor={isReview ? "#2563eb" : undefined}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={styles.weekItemTitle}
                              numberOfLines={1}
                            >
                              {item.title}
                            </Text>
                            <Text style={styles.weekItemReason}>
                              {isReview ? "Repaso" : item.reason}
                            </Text>
                          </View>
                          <ProgressBar
                            progress={item.progress}
                            style={styles.weekItemProgress}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )
              )}

              {/* Botón para expandir/colapsar */}
              {weeklyPlan.length > 2 && (
                <Button
                  mode="text"
                  icon={showFullPlan ? "chevron-up" : "chevron-down"}
                  onPress={togglePlan}
                  style={styles.expandButton}
                >
                  {showFullPlan
                    ? t('planner.showLess')
                    : t('planner.showMore', { count: weeklyPlan.length - 2 })}
                </Button>
              )}
            </>
          </Card.Content>
        </Card>
      )}

      <Card mode="elevated" style={styles.card}>
        <Card.Title title={t('planner.recommendations')} />
        <Card.Content>
          <Text style={styles.recommendation}>{recommendation}</Text>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
        >
          <Dialog.Title>{t('planner.examDate')}</Dialog.Title>
          <Dialog.Content>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={clearDate}>{t('planner.clearDate')}</Button>
            <Button onPress={() => setShowDatePicker(false)}>{t('common.cancel')}</Button>
            {Platform.OS === "ios" && (
              <Button onPress={confirmDate}>{t('common.confirm')}</Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, paddingBottom: 40 },
  card: { marginBottom: 12 },
  dateSection: { marginBottom: 12 },
  dateLabel: { fontSize: 14, color: "#666", marginBottom: 8 },
  dateButton: { alignSelf: "flex-start" },
  daysCard: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  daysNumber: {
    fontSize: 48,
    fontWeight: "700",
    color: "#2563eb",
  },
  daysLabel: {
    fontSize: 14,
    color: "#1e40af",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  avgProgressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
  },
  avgProgress: {
    height: 10,
    borderRadius: 8,
  },
  avgProgressText: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    textAlign: "right",
  },
  recommendation: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemCard: {
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    flex: 1,
  },
  itemReason: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    marginLeft: 34,
  },
  itemProgress: {
    height: 6,
    borderRadius: 4,
    marginTop: 8,
  },
  itemProgressText: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  moreText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  predictionCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  predictionText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  predictionDetail: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  patternsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
  },
  patternRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  patternLabel: {
    fontSize: 13,
    color: "#666",
    width: 100,
  },
  patternBar: {
    flex: 1,
    height: 6,
    borderRadius: 4,
  },
  patternValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
    width: 80,
    textAlign: "right",
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  recMessage: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  weekCard: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  weekTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  weekDate: {
    fontSize: 12,
    color: "#666",
  },
  weekHours: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 8,
  },
  weekItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 6,
  },
  weekItemReview: {
    backgroundColor: "#eff6ff",
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
  },
  weekItemTitle: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  weekItemReason: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  weekItemProgress: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },
  weekMore: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  expandButton: {
    marginTop: 12,
    alignSelf: "center",
  },
});
