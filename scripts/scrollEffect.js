// window.addEventListener('scroll', function() {
//   // Получаем количество прокрученных пикселей
//   const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
//   // Вычисляем общую высоту прокрутки (полная высота страницы минус высота окна)
//   const docHeight = document.documentElement.scrollHeight - window.innerHeight;
//   // Отношение прокрутки от 0 до 1
//   const scrollRatio = Math.min(scrollTop / docHeight, 1);
  
//   // Устанавливаем высоту темной картинки в процентах от 0 до 100%
//   const newHeight = scrollRatio * 100; // в процентах
//   document.querySelector('.dark-img').style.height = newHeight + '%';
// });
