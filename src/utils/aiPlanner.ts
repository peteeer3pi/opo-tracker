import type { Topic, Bulletin, Category } from "../store/useStore";
import { topicProgress, bulletinProgress } from "./progress";

function getDaysWithoutUpdate(updatedAt?: number): number {
  if (!updatedAt) return 999;
  const now = Date.now();
  const diff = now - updatedAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export type StudyPattern = {
  averageProgressPerDay: number;
  studyFrequency: number; // días estudiados / total días
  preferredTimeOfDay?: "morning" | "afternoon" | "evening";
  averageSessionDuration: number; // minutos estimados
  consistencyScore: number; // 0-1
};

export type PerformancePrediction = {
  willFinishOnTime: boolean;
  estimatedCompletionDate: Date;
  completionPercentage: number;
  daysNeeded: number;
  recommendation: string;
  confidence: number; // 0-1
};

export type WeeklyPlan = {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  items: {
    id: string;
    type: "topic" | "bulletin";
    title: string;
    priority: number;
    reason: string;
    progress: number;
    isReview?: boolean;
  }[];
  itemCount: number;
};

export type AIRecommendation = {
  type: "warning" | "success" | "info" | "tip";
  title: string;
  message: string;
  priority: number;
  actionable: boolean;
  action?: string;
};

export function analyzeStudyPatterns(
  topics: Topic[],
  bulletins: Bulletin[]
): StudyPattern {
  const allItems = [...topics, ...bulletins];
  
  if (allItems.length === 0) {
    return {
      averageProgressPerDay: 0,
      studyFrequency: 0,
      averageSessionDuration: 0,
      consistencyScore: 0,
    };
  }

  const updateDates = allItems
    .map((item) => item.updatedAt)
    .filter((date): date is number => !!date)
    .map((timestamp) => new Date(timestamp).toDateString());
  
  const uniqueDays = new Set(updateDates);
  const totalDays = Math.max(
    1,
    Math.ceil(
      (Date.now() - Math.min(...allItems.map((i) => i.updatedAt || Date.now()))) /
        (1000 * 60 * 60 * 24)
    )
  );

  const studyFrequency = uniqueDays.size / totalDays;

  // Calcular progreso promedio por día
  const totalProgress = allItems.reduce((acc, item) => {
    if ("checks" in item) {
      return acc + Object.values(item.checks).filter(Boolean).length;
    } else {
      return (
        acc + Object.values(item.completedExercises).filter(Boolean).length
      );
    }
  }, 0);

  const averageProgressPerDay = totalProgress / Math.max(1, uniqueDays.size);

  // Estimar duración de sesión (basado en cantidad de actualizaciones)
  const averageSessionDuration = Math.min(120, averageProgressPerDay * 15); // ~15 min por item

  // Score de consistencia (qué tan regular es el estudio)
  const consistencyScore = Math.min(1, studyFrequency * 2);

  return {
    averageProgressPerDay,
    studyFrequency,
    averageSessionDuration,
    consistencyScore,
  };
}

// ============================================
// PREDICTOR DE RENDIMIENTO
// ============================================

export function predictPerformance(
  topics: Topic[],
  bulletins: Bulletin[],
  categories: Category[],
  examDate?: Date,
  patterns?: StudyPattern
): PerformancePrediction {
  const now = new Date();
  
  if (!examDate) {
    return {
      willFinishOnTime: false,
      estimatedCompletionDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      completionPercentage: 0,
      daysNeeded: 90,
      recommendation: "Configura una fecha de examen para obtener predicciones precisas.",
      confidence: 0,
    };
  }

  const daysUntilExam = Math.max(
    0,
    Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Calcular trabajo total pendiente
  const topicWork = topics.reduce((acc, topic) => {
    const progress = topicProgress(topic, categories.length);
    return acc + (1 - progress) * categories.length;
  }, 0);

  const bulletinWork = bulletins.reduce((acc, bulletin) => {
    const progress = bulletinProgress(bulletin);
    return acc + (1 - progress) * bulletin.exerciseCount;
  }, 0);

  const totalWorkRemaining = topicWork + bulletinWork;

  // Usar patrones para predecir
  const effectiveProgressRate = patterns
    ? patterns.averageProgressPerDay * patterns.consistencyScore
    : 2; // Default: 2 items/día

  const daysNeeded = Math.ceil(totalWorkRemaining / Math.max(0.5, effectiveProgressRate));
  const willFinishOnTime = daysNeeded <= daysUntilExam;

  const estimatedCompletionDate = new Date(
    now.getTime() + daysNeeded * 24 * 60 * 60 * 1000
  );

  const completionPercentage = Math.min(
    100,
    (daysUntilExam / Math.max(1, daysNeeded)) * 100
  );

  // Calcular confianza basada en datos históricos
  const confidence = patterns
    ? Math.min(1, patterns.studyFrequency * patterns.consistencyScore * 1.5)
    : 0.3;

  // Generar recomendación
  let recommendation = "";
  if (willFinishOnTime) {
    if (completionPercentage > 150) {
      recommendation = `¡Vas genial! 🎉 Llevas un ritmo excelente. Puedes tomártelo con más calma o aprovechar para profundizar en los temas más difíciles.`;
    } else {
      recommendation = `¡Perfecto! 👍 Mantienes un buen ritmo de estudio. Sigue así y llegarás preparado al examen.`;
    }
  } else {
    const itemsPerDayNeeded = Math.ceil(totalWorkRemaining / daysUntilExam);
    recommendation = `💪 Necesitas acelerar un poco el ritmo. Intenta completar unos ${itemsPerDayNeeded} items al día para llegar a tiempo. ¡Tú puedes!`;
  }

  return {
    willFinishOnTime,
    estimatedCompletionDate,
    completionPercentage,
    daysNeeded,
    recommendation,
    confidence,
  };
}

// ============================================
// GENERADOR DE PLAN SEMANAL
// ============================================

export function generateWeeklyPlan(
  topics: Topic[],
  bulletins: Bulletin[],
  categories: Category[],
  examDate?: Date,
  weeksToGenerate: number = 4
): WeeklyPlan[] {
  const now = new Date();
  const plans: WeeklyPlan[] = [];

  // Calcular semanas disponibles hasta el examen
  let weeksAvailable = weeksToGenerate;
  let weeksForReview = 0;
  
  if (examDate) {
    const daysUntilExam = Math.ceil(
      (examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalWeeks = Math.max(1, Math.ceil(daysUntilExam / 7));
    
    // Reservar tiempo para repasos según el tiempo disponible
    if (totalWeeks >= 12) {
      weeksForReview = 3; // 3 semanas de repaso si hay mucho tiempo
    } else if (totalWeeks >= 8) {
      weeksForReview = 2; // 2 semanas de repaso
    } else if (totalWeeks >= 4) {
      weeksForReview = 1; // 1 semana de repaso
    }
    
    weeksAvailable = Math.max(1, totalWeeks - weeksForReview);
  }

  // Crear lista de items con prioridad
  type WorkItem = {
    id: string;
    type: "topic" | "bulletin";
    title: string;
    progress: number;
    priority: number;
    originalIndex: number;
  };

  const topicItems: WorkItem[] = [];
  const bulletinItems: WorkItem[] = [];

  // Procesar temas
  topics.forEach((topic, index) => {
    const progress = topicProgress(topic, categories.length);
    const priority = calculateItemPriority(topic, categories, examDate);

    if (progress < 1) {
      topicItems.push({
        id: topic.id,
        type: "topic",
        title: topic.title,
        progress,
        priority,
        originalIndex: index,
      });
    }
  });

  // Procesar boletines
  bulletins.forEach((bulletin, index) => {
    const progress = bulletinProgress(bulletin);
    const priority = calculateBulletinPriority(bulletin, examDate);

    if (progress < 1) {
      bulletinItems.push({
        id: bulletin.id,
        type: "bulletin",
        title: bulletin.title,
        progress,
        priority,
        originalIndex: index,
      });
    }
  });

  // Ordenar por prioridad
  topicItems.sort((a, b) => b.priority - a.priority);
  bulletinItems.sort((a, b) => b.priority - a.priority);

  // Identificar temas ya estudiados para repaso continuo
  const reviewableTopics = topics
    .filter((t) => {
      const progress = topicProgress(t, categories.length);
      return progress >= 0.5 && progress < 1; // Temas con 50-99% de progreso
    })
    .sort((a, b) => {
      const daysA = getDaysWithoutUpdate(a.updatedAt);
      const daysB = getDaysWithoutUpdate(b.updatedAt);
      return daysB - daysA; // Más tiempo sin revisar primero
    });

  // Calcular items por semana basado en tiempo disponible
  const totalItems = topicItems.length + bulletinItems.length;
  let itemsPerWeek = Math.max(3, Math.ceil(totalItems / weeksAvailable));
  
  // Si hay tiempo suficiente, añadir espacio para repasos en cada semana
  const hasTimeForReviews = weeksAvailable >= 6;
  if (hasTimeForReviews) {
    itemsPerWeek += 1; // Añadir 1 slot para repaso por semana
  }

  // Estrategia: Intercalar temas nuevos, boletines relacionados y repasos
  const workItems: WorkItem[] = [];
  let topicIndex = 0;
  let bulletinIndex = 0;
  let reviewIndex = 0;

  while (topicIndex < topicItems.length || bulletinIndex < bulletinItems.length) {
    // Añadir 2-3 temas nuevos
    for (let i = 0; i < 2 && topicIndex < topicItems.length; i++) {
      workItems.push(topicItems[topicIndex++]);
    }

    // Añadir 1 boletín relacionado (si hay)
    if (bulletinIndex < bulletinItems.length) {
      // Buscar boletín que pueda estar relacionado con los últimos temas
      const recentTopics = workItems.slice(-2).filter((item) => item.type === "topic");
      let bestBulletinIdx = bulletinIndex;

      // Intentar encontrar un boletín con título similar a los temas recientes
      for (let i = bulletinIndex; i < Math.min(bulletinIndex + 3, bulletinItems.length); i++) {
        const bulletin = bulletinItems[i];
        const hasRelation = recentTopics.some((topic) => {
          const topicWords = topic.title.toLowerCase().split(/\s+/);
          const bulletinWords = bulletin.title.toLowerCase().split(/\s+/);
          return topicWords.some((word) =>
            word.length > 4 && bulletinWords.some((bw) => bw.includes(word) || word.includes(bw))
          );
        });
        if (hasRelation) {
          bestBulletinIdx = i;
          break;
        }
      }

      // Añadir el boletín seleccionado
      workItems.push(bulletinItems[bestBulletinIdx]);
      bulletinItems.splice(bestBulletinIdx, 1);
      if (bestBulletinIdx === bulletinIndex) bulletinIndex++;
    }

    // Añadir 1 tema de repaso si hay tiempo y temas disponibles
    if (hasTimeForReviews && reviewIndex < reviewableTopics.length) {
      const reviewTopic = reviewableTopics[reviewIndex++];
      workItems.push({
        id: reviewTopic.id,
        type: "topic",
        title: reviewTopic.title,
        progress: topicProgress(reviewTopic, categories.length),
        priority: 0,
        originalIndex: -1,
      });
    }
  }

  // Distribuir en semanas
  for (let i = 0; i < weeksAvailable && workItems.length > 0; i++) {
    const weekStart = new Date(now.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    let weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

    // Si es la última semana y hay fecha de examen, ajustar el final al día del examen
    const isLastWeek = i === weeksAvailable - 1 || workItems.length <= itemsPerWeek;
    if (isLastWeek && examDate) {
      weekEnd = examDate;
    }

    const weekItems: WeeklyPlan["items"] = [];

    // Asignar items a esta semana
    const itemsThisWeek = Math.min(itemsPerWeek, workItems.length);
    for (let j = 0; j < itemsThisWeek; j++) {
      const item = workItems.shift()!;

      // Determinar si es repaso o contenido nuevo
      const isReview = item.originalIndex === -1 && item.progress >= 0.5;
      
      weekItems.push({
        id: item.id,
        type: item.type,
        title: item.title,
        priority: item.priority,
        reason: getItemReason(item),
        progress: item.progress,
        isReview, // Añadir flag para identificar repasos
      } as any);
    }

    if (weekItems.length > 0) {
      // Ordenar items dentro de la semana: temas nuevos primero, luego repasos
      weekItems.sort((a, b) => {
        // Primero por tipo de contenido (nuevo vs repaso)
        const aIsReview = (a as any).isReview || false;
        const bIsReview = (b as any).isReview || false;
        if (aIsReview !== bIsReview) return aIsReview ? 1 : -1;
        
        // Luego por tipo (topic antes que bulletin)
        if (a.type !== b.type) return a.type === "topic" ? -1 : 1;
        
        // Finalmente por título alfabéticamente
        return a.title.localeCompare(b.title);
      });
      
      plans.push({
        weekNumber: i + 1,
        startDate: weekStart,
        endDate: weekEnd,
        items: weekItems,
        itemCount: weekItems.length,
      });
    }
  }

  // Añadir semanas de repaso al final
  if (weeksForReview > 0 && examDate) {
    // Identificar temas que necesitan repaso (ya completados o con alto progreso)
    const reviewTopics = topics
      .filter((t) => {
        const progress = topicProgress(t, categories.length);
        return progress >= 0.7; // Temas con >70% de progreso
      })
      .sort((a, b) => {
        // Priorizar por tiempo sin actualizar
        const daysA = getDaysWithoutUpdate(a.updatedAt);
        const daysB = getDaysWithoutUpdate(b.updatedAt);
        return daysB - daysA;
      })
      .slice(0, weeksForReview * 4); // ~4 temas por semana de repaso

    const reviewBulletins = bulletins
      .filter((b) => {
        const progress = bulletinProgress(b);
        return progress >= 0.7;
      })
      .sort((a, b) => {
        const daysA = getDaysWithoutUpdate(a.updatedAt);
        const daysB = getDaysWithoutUpdate(b.updatedAt);
        return daysB - daysA;
      })
      .slice(0, weeksForReview * 2); // ~2 boletines por semana de repaso

    // Crear semanas de repaso
    for (let i = 0; i < weeksForReview; i++) {
      const weekNumber = plans.length + 1;
      const weekStart = new Date(
        now.getTime() + (weeksAvailable + i) * 7 * 24 * 60 * 60 * 1000
      );
      let weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

      // Última semana termina en el examen
      if (i === weeksForReview - 1 && examDate) {
        weekEnd = examDate;
      }

      const reviewItems: WeeklyPlan["items"] = [];

      // Añadir temas de repaso
      const topicsThisWeek = reviewTopics.slice(i * 4, (i + 1) * 4);
      topicsThisWeek.forEach((topic) => {
        reviewItems.push({
          id: topic.id,
          type: "topic",
          title: topic.title,
          priority: 0,
          reason: "Repaso final",
          progress: topicProgress(topic, categories.length),
        });
      });

      // Añadir boletines de repaso
      const bulletinsThisWeek = reviewBulletins.slice(i * 2, (i + 1) * 2);
      bulletinsThisWeek.forEach((bulletin) => {
        reviewItems.push({
          id: bulletin.id,
          type: "bulletin",
          title: bulletin.title,
          priority: 0,
          reason: "Repaso final",
          progress: bulletinProgress(bulletin),
        });
      });

      if (reviewItems.length > 0) {
        plans.push({
          weekNumber,
          startDate: weekStart,
          endDate: weekEnd,
          items: reviewItems,
          itemCount: reviewItems.length,
        });
      }
    }
  }

  return plans;
}

function calculateItemPriority(
  topic: Topic,
  categories: Category[],
  examDate?: Date
): number {
  const progress = topicProgress(topic, categories.length);
  const daysWithoutUpdate = topic.updatedAt
    ? Math.floor((Date.now() - topic.updatedAt) / (1000 * 60 * 60 * 24))
    : 999;

  let priority = (1 - progress) * 100;
  if (daysWithoutUpdate > 7) priority += 30;
  if (examDate) {
    const daysUntil = Math.ceil(
      (examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 30 && progress < 0.5) priority += 50;
  }

  return priority;
}

function calculateBulletinPriority(
  bulletin: Bulletin,
  examDate?: Date
): number {
  const progress = bulletinProgress(bulletin);
  const daysWithoutUpdate = bulletin.updatedAt
    ? Math.floor((Date.now() - bulletin.updatedAt) / (1000 * 60 * 60 * 24))
    : 999;

  let priority = (1 - progress) * 100;
  if (daysWithoutUpdate > 7) priority += 30;
  if (examDate) {
    const daysUntil = Math.ceil(
      (examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 30 && progress < 0.5) priority += 50;
  }

  return priority;
}

function getItemReason(item: {
  progress: number;
  priority: number;
  type: string;
}): string {
  if (item.progress === 0) return "Sin empezar - Alta prioridad";
  if (item.progress < 0.3) return "Progreso bajo - Requiere atención";
  if (item.progress < 0.7) return "En progreso - Continuar";
  return "Casi completado - Finalizar";
}

// ============================================
// SISTEMA DE RECOMENDACIONES
// ============================================

export function generateAIRecommendations(
  topics: Topic[],
  bulletins: Bulletin[],
  categories: Category[],
  patterns: StudyPattern,
  prediction: PerformancePrediction,
  examDate?: Date
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // Recomendación sobre consistencia
  if (patterns.consistencyScore < 0.3) {
    const daysStudied = Math.round(patterns.studyFrequency * 7);
    recommendations.push({
      type: "warning",
      title: "💡 Crea una rutina de estudio",
      message: `Estudias aproximadamente ${daysStudied} ${daysStudied === 1 ? 'día' : 'días'} a la semana. La constancia es tu mejor aliada. Intenta estudiar más días, aunque sea 30 minutos, ¡verás la diferencia!`,
      priority: 90,
      actionable: true,
      action: "Crear rutina diaria",
    });
  } else if (patterns.consistencyScore > 0.7) {
    const daysStudied = Math.round(patterns.studyFrequency * 7);
    recommendations.push({
      type: "success",
      title: "🌟 ¡Eres muy constante!",
      message: `Estudias unos ${daysStudied} días a la semana. Tu rutina es excelente. La regularidad es uno de los secretos del éxito. ¡Sigue así!`,
      priority: 20,
      actionable: false,
    });
  }

  // Recomendación sobre rendimiento
  if (!prediction.willFinishOnTime && examDate) {
    recommendations.push({
      type: "warning",
      title: "⚡ Ajusta tu ritmo de estudio",
      message: prediction.recommendation,
      priority: 100,
      actionable: true,
      action: "Ver plan ajustado",
    });
  }

  // Recomendación sobre temas sin empezar
  const notStarted = [...topics, ...bulletins].filter((item) => {
    if ("checks" in item) {
      return Object.values(item.checks).every((v) => !v);
    } else {
      return Object.values(item.completedExercises).every((v) => !v);
    }
  });

  if (notStarted.length > 10) {
    recommendations.push({
      type: "info",
      title: "📚 Empieza por lo importante",
      message: `Tienes ${notStarted.length} temas sin empezar. No te agobies, ve paso a paso. Empieza por los más prioritarios y verás cómo avanzas.`,
      priority: 70,
      actionable: true,
      action: "Ver temas prioritarios",
    });
  }

  // Recomendación sobre repasos
  const needsReview = topics.filter(
    (t) => t.reviewCount > 0 && t.updatedAt && Date.now() - t.updatedAt > 14 * 24 * 60 * 60 * 1000
  );

  if (needsReview.length > 0) {
    recommendations.push({
      type: "tip",
      title: "🔄 Hora de repasar",
      message: `Tienes ${needsReview.length} temas que no revisas hace tiempo. Repasar es tan importante como estudiar nuevo contenido. ¡Refúerzalos!`,
      priority: 60,
      actionable: true,
      action: "Ver temas para repasar",
    });
  }

  // Recomendación sobre duración de sesiones
  if (patterns.averageSessionDuration < 30) {
    recommendations.push({
      type: "tip",
      title: "⏱️ Alarga tus sesiones",
      message: `Tus sesiones duran unos ${Math.round(patterns.averageSessionDuration)} minutos. Intenta llegar a 45-60 minutos para aprovechar mejor el tiempo de concentración.`,
      priority: 40,
      actionable: false,
    });
  }

  // Ordenar por prioridad
  recommendations.sort((a, b) => b.priority - a.priority);

  return recommendations.slice(0, 5); // Top 5 recomendaciones
}
