# Модуль "Website Custom Modal"

Модуль `website_custom_modal` добавляет на сайт переиспользуемый сниппет кнопки с модальным окном и расширенные настройки popup в Website Builder.

## Функциональность

- Сниппет "Button + Popup (Custom Modal)" для Website Builder.
- Настройки отображения popup:
  - `onClick` (по ссылке/hash);
  - `afterDelay`;
  - `mouseExit`.
- Гибкие настройки триггера:
  - режим `button`/`link`;
  - variant/size/shape/width;
  - underline/weight/text-size;
  - align.
- Настройки размеров модального окна:
  - preset width/height;
  - custom width/height.
- Поддержка editor preview и корректная обработка iframe-видео при открытии/закрытии модалки.

## Системные требования

- Odoo 17

## Модульные зависимости

- `website`

## Python-зависимости

Дополнительные Python-библиотеки для данного модуля не требуются.  
Файл `requirements.txt` не используется.

## Установка

1. Скопировать модуль `website_custom_modal` в директорию `addons`.
2. Перезапустить сервис Odoo.
3. Включить debug режим:
   - `http://<host>:8069/web?debug=true`
4. Перейти в "Приложения", обновить список приложений.
5. Установить модуль `website_custom_modal`.
6. При обновлениях кода выполнить обновление модуля:
   - `-u website_custom_modal`

## Использование

### Добавление сниппета

- В Website Builder открыть панель сниппетов.
- Добавить сниппет `custom modal`.
- Сниппет создает кнопку-триггер и модальное окно с редактируемым контентом.

### Настройки popup

- В snippet options доступны:
  - позиция popup (`Top`/`Middle`/`Bottom`);
  - backdrop и цвет;
  - режим показа (`Delay`, `On Exit`, `On Click`);
  - время задержки и период повторного показа (`Hide For`).

### Настройки триггера и размеров

- Trigger Mode: `Button` или `Link`.
- Для кнопки: variant/size/shape/width.
- Для ссылки: color/underline/weight/size.
- Для модалки: preset и custom режимы width/height.

## Лицензия

Используется лицензия `LGPL-3`.  
Подробности указаны в `__manifest__.py`.
