import type { Topic, Bulletin, Category } from "../store/useStore";
import { topicProgress, bulletinProgress } from "./progress";

export type StudyPriority = "urgent" | "high" | "medium" | "low";

export type StudyItem = {
  id: string;
  type: "topic" | "bulletin";
  title: string;
  priority: StudyPriority;
  progress: number;
  score: number;
  reason: string;
  daysWithoutUpdate: number;
};

export type StudyPlan = {
  urgent: StudyItem[];
  high: StudyItem[];
  medium: StudyItem[];
  low: StudyItem[];
  stats: {
    totalItems: number;
    avgProgress: number;
    itemsNotStarted: number;
    itemsInProgress: number;
    itemsCompleted: number;
    daysUntilExam?: number;
  };
};

function getDaysWithoutUpdate(updatedAt?: number): number {
  if (!updatedAt) return 999;
  const now = Date.now();
  const diff = now - updatedAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function calculateTopicScore(
  topic: Topic,
  categories: Category[],
  daysUntilExam?: number
): number {
  const progress = topicProgress(topic, categories.length);
  const daysWithoutUpdate = getDaysWithoutUpdate(topic.updatedAt);
  
  let score = 0;

  if (progress === 0) {
    score += 80;
  } else if (progress < 0.3) {
    score += 60;
  } else if (progress < 0.7) {
    score += 40;
  } else if (progress < 1) {
    score += 20;
  }
  if (daysWithoutUpdate > 30) score += 40;
  else if (daysWithoutUpdate > 14) score += 25;
  else if (daysWithoutUpdate > 7) score += 15;
  else if (daysWithoutUpdate > 3) score += 5;

  if (daysUntilExam !== undefined) {
    if (daysUntilExam < 14 && progress < 0.8) score += 60;
    else if (daysUntilExam < 30 && progress < 0.5) score += 45;
    else if (daysUntilExam < 60 && progress < 0.3) score += 25;
    else if (daysUntilExam < 90) score += 10;
  }

  const reviewCount = topic.reviewCount || 0;
  if (reviewCount > 0 && daysWithoutUpdate > 21) {
    score += 30;
  } else if (reviewCount > 0 && daysWithoutUpdate > 14) {
    score += 15;
  }

  if (progress > 0.8 && (!daysUntilExam || daysUntilExam > 60)) {
    score -= 20;
  }

  return Math.max(0, score);
}

function calculateBulletinScore(
  bulletin: Bulletin,
  daysUntilExam?: number
): number {
  const progress = bulletinProgress(bulletin);
  const daysWithoutUpdate = getDaysWithoutUpdate(bulletin.updatedAt);
  
  let score = 0;

  if (progress === 0) {
    score += 70;
  } else if (progress < 0.3) {
    score += 55;
  } else if (progress < 0.7) {
    score += 35;
  } else if (progress < 1) {
    score += 15;
  }
  if (daysWithoutUpdate > 30) score += 35;
  else if (daysWithoutUpdate > 14) score += 20;
  else if (daysWithoutUpdate > 7) score += 10;
  else if (daysWithoutUpdate > 3) score += 5;

  if (daysUntilExam !== undefined) {
    if (daysUntilExam < 14 && progress < 0.8) score += 50;
    else if (daysUntilExam < 30 && progress < 0.5) score += 35;
    else if (daysUntilExam < 60 && progress < 0.3) score += 20;
    else if (daysUntilExam < 90) score += 8;
  }

  if (progress > 0.8 && (!daysUntilExam || daysUntilExam > 60)) {
    score -= 15;
  }

  return Math.max(0, score);
}

function getPriorityLevel(score: number): StudyPriority {
  if (score >= 180) return "urgent";
  if (score >= 120) return "high";
  if (score >= 70) return "medium";
  return "low";
}

function getReasonForPriority(
  progress: number,
  daysWithoutUpdate: number,
  daysUntilExam?: number,
  reviewCount?: number
): string {
  const reasons: string[] = [];

  if (progress === 0) {
    reasons.push("No iniciado");
  } else if (progress < 0.3) {
    reasons.push("Progreso muy bajo");
  } else if (progress < 0.7) {
    reasons.push("Progreso medio");
  }

  if (daysWithoutUpdate > 14) {
    reasons.push(`${daysWithoutUpdate} días sin revisar`);
  } else if (daysWithoutUpdate > 7) {
    reasons.push(`${daysWithoutUpdate} días sin actualizar`);
  }

  if (daysUntilExam !== undefined && daysUntilExam < 30 && progress < 0.8) {
    reasons.push("Examen próximo");
  }

  if (reviewCount && reviewCount > 0 && daysWithoutUpdate > 14) {
    reasons.push("Necesita repaso");
  }

  return reasons.length > 0 ? reasons.join(" • ") : "Continuar progreso";
}

export function generateStudyPlan(
  topics: Topic[],
  bulletins: Bulletin[],
  categories: Category[],
  examDate?: Date
): StudyPlan {
  const now = new Date();
  const daysUntilExam = examDate
    ? Math.floor((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  const studyItems: StudyItem[] = [];

  topics.forEach((topic) => {
    const progress = topicProgress(topic, categories.length);
    const daysWithoutUpdate = getDaysWithoutUpdate(topic.updatedAt);
    const score = calculateTopicScore(topic, categories, daysUntilExam);
    const priority = getPriorityLevel(score);
    const reason = getReasonForPriority(
      progress,
      daysWithoutUpdate,
      daysUntilExam,
      topic.reviewCount
    );

    studyItems.push({
      id: topic.id,
      type: "topic",
      title: topic.title,
      priority,
      progress,
      score,
      reason,
      daysWithoutUpdate,
    });
  });

  bulletins.forEach((bulletin) => {
    const progress = bulletinProgress(bulletin);
    const daysWithoutUpdate = getDaysWithoutUpdate(bulletin.updatedAt);
    const score = calculateBulletinScore(bulletin, daysUntilExam);
    const priority = getPriorityLevel(score);
    const reason = getReasonForPriority(
      progress,
      daysWithoutUpdate,
      daysUntilExam
    );

    studyItems.push({
      id: bulletin.id,
      type: "bulletin",
      title: bulletin.title,
      priority,
      progress,
      score,
      reason,
      daysWithoutUpdate,
    });
  });

  studyItems.sort((a, b) => b.score - a.score);

  const plan: StudyPlan = {
    urgent: studyItems.filter((item) => item.priority === "urgent"),
    high: studyItems.filter((item) => item.priority === "high"),
    medium: studyItems.filter((item) => item.priority === "medium"),
    low: studyItems.filter((item) => item.priority === "low"),
    stats: {
      totalItems: studyItems.length,
      avgProgress:
        studyItems.reduce((acc, item) => acc + item.progress, 0) /
          studyItems.length || 0,
      itemsNotStarted: studyItems.filter((item) => item.progress === 0).length,
      itemsInProgress: studyItems.filter(
        (item) => item.progress > 0 && item.progress < 1
      ).length,
      itemsCompleted: studyItems.filter((item) => item.progress === 1).length,
      daysUntilExam,
    },
  };

  return plan;
}

export function getStudyRecommendation(plan: StudyPlan): string {
  const { stats } = plan;
  const recommendations: string[] = [];

  if (stats.daysUntilExam !== undefined) {
    if (stats.daysUntilExam < 30) {
      recommendations.push(
        `⚠️ Quedan ${stats.daysUntilExam} días para el examen. Enfócate en los temas urgentes.`
      );
    } else if (stats.daysUntilExam < 60) {
      recommendations.push(
        `📅 Quedan ${stats.daysUntilExam} días. Buen momento para intensificar el estudio.`
      );
    } else {
      recommendations.push(
        `📅 Tienes ${stats.daysUntilExam} días. Mantén un ritmo constante.`
      );
    }
  }

  if (plan.urgent.length > 0) {
    recommendations.push(
      `🔴 Tienes ${plan.urgent.length} tema(s) urgente(s) que requieren atención inmediata.`
    );
  }

  if (stats.itemsNotStarted > 5) {
    recommendations.push(
      `📚 Tienes ${stats.itemsNotStarted} temas sin empezar. Considera comenzar algunos.`
    );
  }

  const avgProgressPercent = Math.round(stats.avgProgress * 100);
  if (avgProgressPercent < 30) {
    recommendations.push(
      `💪 Tu progreso promedio es del ${avgProgressPercent}%. ¡Sigue adelante!`
    );
  } else if (avgProgressPercent < 70) {
    recommendations.push(
      `👍 Progreso promedio: ${avgProgressPercent}%. Vas por buen camino.`
    );
  } else {
    recommendations.push(
      `🎉 ¡Excelente! Progreso promedio: ${avgProgressPercent}%.`
    );
  }

  return recommendations.join("\n\n");
}
