export const formatPrice = (price: number): string => {
  return price.toLocaleString('ru-RU') + ' ₽';
};

export const formatSearchResultsForLLM = (results: any): string => {
  if (!results.models || results.models.length === 0) {
    return 'По заданным критериям автомобилей не найдено. Попробуйте расширить критерии поиска.';
  }

  const summary = `Найдено ${results.total} автомобилей:\n\n${results.models
    .map(
      (car: any, index: number) =>
        `${index + 1}. ${car.brand} ${car.model} (${car.year})\n` +
        `   - ID: ${car.id}\n` +
        `   - Цена: ${formatPrice(car.price)}\n` +
        `   - Кузов: ${car.bodyType}\n` +
        `   - Топливо: ${car.fuelType}\n` +
        `   - Расход: ${car.fuelConsumption} л/100км\n` +
        `   - Стоимость владения в год: ${formatPrice(
          (car.insuranceCostPerYearRub || 0) +
            (car.annualTaxCostRub || 0) +
            (car.maintenanceCostPerYearRub || 0)
        )}`
    )
    .join('\n\n')}`;

  return summary;
};

export const formatComparisonForLLM = (models: any[]): string => {
  if (models.length === 0) {
    return 'Не удалось найти указанные модели для сравнения.';
  }

  const comparison = `
📊 Сравнение моделей:

${'='.repeat(80)}

${models
  .map(
    (car) => `
🚗 ${car.brand} ${car.model} (${car.year})

💰 Цена: ${formatPrice(car.price)}
📦 Кузов: ${car.bodyType} | Привод: ${car.driveType || 'н/д'} | КПП: ${car.transmission || 'н/д'}
⚡ Двигатель: ${car.engineVolumeL || 'н/д'}л, ${car.horsepower || 'н/д'} л.с.
⛽ Топливо: ${car.fuelType} | Расход: ${car.fuelConsumption || 'н/д'} л/100км

💸 Стоимость владения в год:
   - Страховка: ${formatPrice(car.insuranceCostPerYearRub || 0)}
   - Налог: ${formatPrice(car.annualTaxCostRub || 0)}
   - Обслуживание: ${formatPrice(car.maintenanceCostPerYearRub || 0)}
   - ИТОГО: ${formatPrice(
     (car.insuranceCostPerYearRub || 0) +
       (car.annualTaxCostRub || 0) +
       (car.maintenanceCostPerYearRub || 0)
   )}/год

${'-'.repeat(80)}
`
  )
  .join('\n')}

${'='.repeat(80)}
`;

  return comparison;
};

export const formatUserPreferences = (profile: any): string => {
  if (!profile) {
    return 'У пользователя нет сохранённых предпочтений.';
  }

  const prefs: string[] = [];

  if (profile.preferredBudgetMinRub || profile.preferredBudgetMaxRub) {
    prefs.push(
      `Бюджет: ${profile.preferredBudgetMinRub?.toLocaleString('ru-RU') || '...'} - ${profile.preferredBudgetMaxRub?.toLocaleString('ru-RU') || '...'} ₽`
    );
  }

  if (profile.preferredBodyType) {
    prefs.push(`Предпочитаемый тип кузова: ${profile.preferredBodyType}`);
  }

  if (profile.preferredFuelType) {
    prefs.push(`Предпочитаемый тип топлива: ${profile.preferredFuelType}`);
  }

  if (profile.city) {
    prefs.push(`Город: ${profile.city}`);
  }

  if (prefs.length === 0) {
    return 'У пользователя нет сохранённых предпочтений.';
  }

  return `Сохранённые предпочтения пользователя:\n${prefs.join('\n')}`;
};

export const ERROR_MESSAGES = {
  searchError: 'Произошла ошибка при поиске автомобилей. Попробуйте позже.',
  compareError: 'Произошла ошибка при сравнении моделей.',
  preferencesError: 'Не удалось получить предпочтения пользователя.',
  saveError: 'Не удалось сохранить результат подбора.',
  unknownTool: (name: string) => `Неизвестный инструмент: ${name}`,
  processingError: 'Извините, произошла ошибка при обработке запроса.',
  noResponse: 'Извините, не могу ответить.',
};
