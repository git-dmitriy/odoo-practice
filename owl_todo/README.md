# OWL Todo

Учебный Odoo-модуль: односписковый todo на **OWL** с оформлением в стиле отдельного SPA (тёмная тема, системные шрифты), без канбана и без внешних шрифтов.

## Возможности

- **Client action** (`ir.actions.client`) — экран «Todo list» в бэкенде Odoo.
- **CRUD**: создание и правка в диалоге, удаление с подтверждением.
- **Фильтры**: поиск по названию и описанию, фильтр «все / активные / выполненные»; выбор сохраняется в `localStorage`.
- **Стандартные представления** Odoo (список/форма) для задач через меню «Tasks».
- **Тесты**: Python (`post_install`) и QUnit для функции фильтрации списка.

## Модель

| Модель          | Назначение |
|-----------------|------------|
| `owl_todo.task` | Задача: `name`, `description`, `is_done`, `sequence` |

Порядок записей на сервере: сначала невыполненные, затем по `sequence`, затем по `id`.

## Установка и запуск

1. Добавьте каталог с репозиторием (или только `owl_todo`) в `--addons-path` Odoo.
2. Обновите список приложений и установите модуль **OWL Todo**.
3. Откройте **OWL Todo → Todo list** (OWL-экран) или **OWL Todo → Tasks** (классический tree/form).

Требования: Odoo **17.0**, зависимости модуля: `base`, `web`.

## Структура фронтенда

- `static/src/js/app.js` — регистрация `owl_todo.client_action`.
- `static/src/js/components/board/` — корневой экран и загрузка данных.
- `static/src/js/components/toolbar/` — поиск, фильтр, обновление, кнопка добавления.
- `static/src/js/components/item/` — строка задачи.
- `static/src/js/components/task_form_dialog/` — форма создания/редактирования.
- `static/src/js/services/todo_api.js` — вызовы `orm` (`searchRead`, `create`, `write`, `unlink`).
- `static/src/js/store/todo_store.js` — начальное состояние и `filterVisibleTasks`.
- `static/src/scss/todo_board.scss` — визуальное оформление (всё под корнем `.o_owl_todo_spa`, форма диалога — `.o_owl_todo_dialog`).
