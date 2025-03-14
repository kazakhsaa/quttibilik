// Глобальные переменные для данных
let dictionaryData = [];
let graphData = []; // Ожидаем массив объектов для graph.json
let annotationText = "";

// ------------------- Загрузка JSON-файлов -------------------

// 1) Загрузка данных словаря
fetch("data/dictionary.json")
  .then(response => response.json())
  .then(data => {
    dictionaryData = data;
    console.log(`Данные словаря загружены: ${dictionaryData.length} записей`);
  })
  .catch(error => {
    console.error("Ошибка загрузки данных словаря:", error);
    const container = document.getElementById("resultContainer");
    container.innerHTML = `<div class="alert alert-danger">Не удалось загрузить данные словаря.</div>`;
  });

// 2) Загрузка аннотации
fetch("data/annotation.json")
  .then(response => response.json())
  .then(data => {
    const annotationText = data.annotation || "";
    const annotationContainer = document.getElementById("annotationContainer");
    // Выводим аннотацию как цитату с оформлением
    annotationContainer.innerHTML = `
      <blockquote class="blockquote">
        <p>${annotationText.replace(/\n/g, '<br>')}</p>
        <footer class="blockquote-footer">Ескерту: сөздіктегі тілдік фактілер мына еңбектен алынды:
Әдеби жәдігерлер. Жиырма томдық.
5-т.: Жүсіп Баласағұн. Құтты білік /Көне тілінен аударып, алғы сөзі мен түсініктерін жазған А. Қ. Егеубаев. —Алматы: «Таймас» баспа үйі, 2007. — 536 бет. — (Әдеби жәдігерлер)</footer>
      </blockquote>
    `;
  })
  .catch(error => {
    console.error("Ошибка загрузки аннотации:", error);
    document.getElementById("annotationContainer").innerHTML = `<div class="alert alert-danger">Ережені жүктеу мүмкін емес.</div>`;
  });


// 3) Загрузка данных для графа
fetch("data/graph.json")
  .then(response => response.json())
  .then(data => {
    // Ожидаем, что это массив объектов [{ verb_root: "...", verb1: "...", ... }, {...}]
    graphData = data;
    console.log("Данные графа загружены", graphData);
  })
  .catch(error => {
    console.error("Ошибка загрузки данных графа:", error);
    const graphContainer = document.getElementById("graphResultContainer");
    graphContainer.innerHTML = `<div class="alert alert-danger">Не удалось загрузить данные графа.</div>`;
  });

// ------------------- Поиск по словарю (первый поисковик) -------------------
function performSearch(query) {
  const container = document.getElementById("resultContainer");
  container.innerHTML = "";
  if (!query) {
    container.innerHTML = `<div class="text-muted">Императивті етістікті еңгізіңіз</div>`;
    return;
  }
  const normalizedQuery = query.trim().toLowerCase();
  const results = dictionaryData.filter(item => 
    item.Verb && item.Verb.trim().toLowerCase().includes(normalizedQuery)
  );
  if (results.length === 0) {
    container.innerHTML = `<div class="alert alert-warning">Слово "${query}" не найдено.</div>`;
  } else {
    results.forEach(entry => {
      const word = entry.Verb || "";
      const type = entry.Type || "";
      const dictMean = entry.Dictionary_meaning || "";
      const root = entry.Root || "";
      const model = entry.Word_formation_model || "";
      const meaning = entry.Meaning || "";
      const frequency = entry.Frequency_of_use !== undefined ? entry.Frequency_of_use : "";
      const resultHTML = `
        <div class="card mb-3"><div class="card-body">
          <p class="card-text"><strong>Етістік:</strong> ${word}</p>
          <p class="card-text"><strong>Түрі:</strong> ${type}</p>
          <p class="card-text"><strong>Сөздіктегі мағынасы:</strong> ${dictMean}</p>
          <p class="card-text"><strong>Түбір:</strong> ${root}</p>
          <p class="card-text"><strong>Сөзжасамдық модель:</strong> ${model}</p>
          <p class="card-text"><strong>Дастандағы мағынасы:</strong> ${meaning}</p>
          <p class="card-text"><strong>Қолданыс жиілігі:</strong> ${frequency}</p>
        </div></div>`;
      container.insertAdjacentHTML("beforeend", resultHTML);
    });
  }
}

// Обработчик формы поиска словаря
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
searchForm.addEventListener("submit", function(event) {
  event.preventDefault();
  const query = searchInput.value;
  performSearch(query);
});

// Функция поиска по verb_root и построения упрощённого горизонтального графа
// Предположим, что всё, что связано с dictionaryData, annotationText — не трогаем.
// Важно, что graphData теперь — массив, где каждый объект имеет:
// {
//   verb_root: "Бер",
//   verb_root_type: "Форма тудырушы",
//   verb_root_meaning: "...",
//   verb1: "Берген", verb1_count: 30,
//   verb2: "Беріп", verb2_count: 30,
//   ...
// }

// ------------------- Поиск по verb_root -------------------
function performGraphSearch(query) {
  const container = document.getElementById("graphResultContainer");
  container.innerHTML = "";
  
  if (!query) {
    container.innerHTML = `<div class="text-muted">Грамматикалық категориялы етістікті еңгізіңіз</div>`;
    return;
  }
  const normalizedQuery = query.trim().toLowerCase();

  // Фильтруем объекты, где verb_root (если есть) содержит запрос
  const results = graphData.filter(item => 
    item.verb_root && item.verb_root.trim().toLowerCase().includes(normalizedQuery)
  );

  if (results.length === 0) {
    container.innerHTML = `<div class="alert alert-warning">Етістік "${query}" табылмады.</div>`;
  } else {
    // Для каждого найденного объекта строим упрощённый горизонтальный граф
    results.forEach(item => {
      const graphHTML = createHorizontalGraph(item);
      container.insertAdjacentHTML("beforeend", graphHTML);
    });
  }
}


/**
 * Создаёт упрощённый горизонтальный граф внутри карточки:
 * - В шапке карточки выводятся: verb_root, verb_root_type и verb_root_meaning.
 * - Внутри карточки отображается SVG, где слева располагается verb_root,
 *   а справа – значения вида verbN-verbN_count.
 */
function createHorizontalGraph(item) {
  const root = item.verb_root || "N/A";
  const rootType = item.verb_root_type || "";
  const rootMeaning = item.verb_root_meaning || "";

  // Отбираем ключи вида verb1, verb2, ...
  const verbKeys = Object.keys(item).filter(k => /^verb\d+$/.test(k));

  // Устанавливаем адаптивную ширину для SVG
  let width = 500; // базовая ширина для десктопа
  if (window.innerWidth < 576) {
    width = 224; // для мобильных устройств, согласно требованиям
  } else if (window.innerWidth < 768) {
    width = 400;
  }

  const spacing = 40;                // расстояние между строками
  const count = verbKeys.length;     // количество verbN полей
  const height = Math.max(count * spacing + 40, 80);

  // Координаты для вывода корневого значения
  const rootX = 20;
  const rootY = height / 2;

  // Расположим остальные поля: можно задать так, чтобы они находились примерно в 50% ширины + отступ
  const fieldsX = Math.floor(width * 0.5) + 20;

  // Формируем HTML-разметку карточки
  let html = `
    <div class="card mb-3">
      <div class="card-body">
        <p class="card-text"><strong>Етістік:</strong> ${root}</p>
        <p class="card-text"><strong>Түбір:</strong> ${root}</p>
        <p class="card-text"><strong>Қосымшаның түрі:</strong> ${rootType}</p>
        <p class="card-text"><strong>Сөздіктегі мағынасы:</strong> ${rootMeaning}</p>
  `;

  // Добавляем SVG-графику с адаптивной шириной
  html += `<svg width="${width}" height="${height}">
             <text 
               x="${rootX}" 
               y="${rootY}" 
               font-weight="bold" 
               font-size="14"
               alignment-baseline="middle"
             >
               ${root}
             </text>`;

  if (count > 0) {
    const totalHeight = (count - 1) * spacing;
    const startY = rootY - totalHeight / 2;
    verbKeys.forEach((key, i) => {
      const fieldY = startY + i * spacing;
      const countKey = key + "_count";
      const verbValue = item[key] || "";
      const verbCount = item[countKey] || 0;
      const displayValue = `${verbValue}-${verbCount}`;
      html += `
            <line 
              x1="${rootX + 40}" y1="${rootY}" 
              x2="${fieldsX}" y2="${fieldY}" 
              stroke="black"
            />
            <text 
              x="${fieldsX}" 
              y="${fieldY}"
              font-size="14"
              alignment-baseline="middle"
            >
              ${displayValue}
            </text>
      `;
    });
  }
  html += `</svg></div></div>`;
  return html;
}



// ------------------- Слушатель формы -------------------
const searchGraphForm = document.getElementById("searchGraphForm");
const searchGraphInput = document.getElementById("searchGraphInput");
searchGraphForm.addEventListener("submit", function(event) {
  event.preventDefault();
  const query = searchGraphInput.value;
  performGraphSearch(query);
});