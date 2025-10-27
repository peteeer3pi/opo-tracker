export const COMPLETION_MESSAGES = [
  "¡Increíble! 🎉 Has completado otro tema. ¡Sigue así!",
  "¡Enhorabuena! 🌟 Un tema más conquistado.",
  "¡Genial! 💪 Cada tema completado te acerca más a tu objetivo.",
  "¡Fantástico! 🚀 Tu esfuerzo está dando frutos.",
  "¡Bravo! 👏 Has demostrado tu dedicación una vez más.",
  "¡Excelente trabajo! ⭐ Vas por muy buen camino.",
  "¡Lo lograste! 🎯 Un paso más hacia el éxito.",
  "¡Impresionante! 💫 Tu constancia es admirable.",
  "¡Muy bien! 🏆 Cada tema cuenta, y este ya es tuyo.",
  "¡Perfecto! ✨ Sigues avanzando sin parar.",
  "¡Sigue así! 🔥 Tu progreso es imparable.",
  "¡Qué bien! 🎊 Otro tema dominado.",
  "¡Crack! 💎 Estás más cerca de tu meta.",
  "¡Eres imparable! 🌠 Tema completado con éxito.",
  "¡Bien hecho! 🎈 Tu esfuerzo vale la pena.",
  "¡Magnífico! 🌈 Cada tema es una victoria.",
  "¡Sobresaliente! 📚 Tu dedicación es inspiradora.",
  "¡Tremendo! ⚡ Vas camino al éxito.",
  "¡Espectacular! 🎭 Has completado otro tema.",
  "¡Maravilloso! 🌺 Tu progreso es notable.",
  "¡Sigue adelante! 🚶 Cada tema te hace más fuerte.",
  "¡No pares! 🏃 Estás haciendo un trabajo increíble.",
  "¡Continúa así! 💪 Tu esfuerzo será recompensado.",
  "¡Vas genial! 🌟 Tema tras tema, llegarás lejos.",
  "¡Qué progreso! 📈 Sigues sumando conocimiento.",
  "¡Ánimo! 🎯 Cada tema completado es un logro.",
  "¡Sigue brillando! ✨ Tu constancia es tu mejor arma.",
  "¡Imparable! 🔥 Otro tema más en tu haber.",
  "¡Así se hace! 👊 Vas directo a la meta.",
  "¡Fenomenal! 🎪 Tu progreso es excepcional.",
  "¡Tema completado! 📖 Cada página estudiada cuenta.",
  "¡Conseguido! 🎓 Estás construyendo tu éxito.",
  "¡Logrado! 🏅 Un tema menos, un paso más cerca.",
  "¡Hecho! ✅ Tu lista de logros sigue creciendo.",
  "¡Superado! 🎢 Cada tema es una nueva cima.",
  "¡Dominado! 🦁 Este tema ya es tuyo.",
  "¡Completado! 🎨 Pintas tu camino al éxito.",
  "¡Finalizado! 🏁 Otro hito alcanzado.",
  "¡Aprobado! 📝 Tu esfuerzo se nota.",
  "¡Conquistado! 🏰 Un tema más bajo tu control.",
  "¡Qué bien te va! 🌻 Tema completado exitosamente.",
  "¡Estás en racha! 🎰 Sigue acumulando victorias.",
  "¡Qué máquina! 🤖 No hay tema que se te resista.",
  "¡Eres grande! 🦸 Tema tras tema, imparable.",
  "¡Qué nivel! 🎮 Has subido de nivel con este tema.",
  "¡Brutal! 💥 Otro tema eliminado de la lista.",
  "¡Qué bestia! 🦄 Tu progreso es legendario.",
  "¡Qué pro! 🎯 Tema completado como un campeón.",
  "¡Qué crack! 💎 Sigues brillando con luz propia.",
  "¡Qué jefe! 👑 Dominas cada tema que tocas.",
];

export const BULLETIN_COMPLETION_MESSAGES = [
  "¡Boletín completado! 📋 Excelente práctica.",
  "¡Todos los ejercicios hechos! ✏️ Eres increíble.",
  "¡Boletín superado! 🎯 Tu práctica da resultados.",
  "¡Ejercicios completados! 💪 Sigues mejorando.",
  "¡Boletín finalizado! 🌟 Práctica perfecta.",
  "¡Qué bien! 📝 Has dominado todos los ejercicios.",
  "¡Boletín conquistado! 🏆 Tu esfuerzo se nota.",
  "¡Perfecto! ✨ Todos los ejercicios resueltos.",
  "¡Genial! 🎊 Boletín completado al 100%.",
  "¡Excelente! 🚀 Has terminado todos los ejercicios.",
  "¡Fantástico! 🎉 Boletín completado con éxito.",
  "¡Impresionante! 💫 Todos los ejercicios dominados.",
  "¡Bravo! 👏 Has completado el boletín entero.",
  "¡Sobresaliente! 📚 Práctica completada.",
  "¡Magnífico! 🌈 Boletín 100% resuelto.",
];

export const CATEGORY_CHECK_MESSAGES = [
  "¡Bien! ✓ Una categoría más marcada.",
  "¡Genial! ✓ Sigues avanzando.",
  "¡Perfecto! ✓ Cada check cuenta.",
  "¡Excelente! ✓ Vas por buen camino.",
  "¡Sigue así! ✓ Progreso constante.",
];

export function getRandomCompletionMessage(): string {
  const randomIndex = Math.floor(Math.random() * COMPLETION_MESSAGES.length);
  return COMPLETION_MESSAGES[randomIndex];
}

export function getRandomBulletinMessage(): string {
  const randomIndex = Math.floor(Math.random() * BULLETIN_COMPLETION_MESSAGES.length);
  return BULLETIN_COMPLETION_MESSAGES[randomIndex];
}

export function getRandomCategoryMessage(): string {
  const randomIndex = Math.floor(Math.random() * CATEGORY_CHECK_MESSAGES.length);
  return CATEGORY_CHECK_MESSAGES[randomIndex];
}

export function isTopicJustCompleted(
  checks: Record<string, boolean>,
  categoryId: string,
  totalCategories: number
): boolean {
  const completedCount = Object.values(checks).filter(Boolean).length;
  
  return completedCount === totalCategories;
}

export function isBulletinJustCompleted(
  completedExercises: Record<number, boolean>,
  exerciseNumber: number,
  totalExercises: number
): boolean {
  const completedCount = Object.values(completedExercises).filter(Boolean).length;
  
  return completedCount === totalExercises;
}
