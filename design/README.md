# Figma и макеты · пункт 4

**Статус: частично готово, заблокировано лимитом Figma Starter MCP.**

[Файл Figma](https://www.figma.com/design/eCPOhPRPZCemoEinfGuRh4) создан. В нём создана библиотека из 18 семейств компонентов с вариантами, локальные цветовые токены и текстовые стили. Использованы доступные Simple Design System Button/Input, spacing, background и Body Base. Исходники Code Connect в исходном репозитории отсутствовали.

Сборка экранов `screens.js` не выполнилась: Figma вернула “You've reached the Figma MCP tool call limit on the Starter plan”. Поэтому нативные экраны, интерактивные связи, Figma screenshot/visual review и проверка итоговой композиции **не завершены**. Существование файла/компонентов подтверждено успешными ответами инструмента; визуальная проверка этих компонентов пока не выполнена. Не загружать PNG всего интерфейса вместо редактируемых экранов.

## Что доступно сейчас

- [Статичный HTML-прототип](preview.html) — скачать вместе с репозиторием и открыть локально. Переходы выполнены ссылками по ID; реального каталога/корзины/ввода/оплаты нет.
- [12 основных мобильных макетов](exports/mobile-main.png), [21 альтернативное состояние](exports/mobile-recovery.png).
- Десктопные макеты: [каталог](exports/D01.png), [checkout](exports/D02.png), [подтверждение](exports/D03.png). Они также сгенерированы локально.
- [Low-fi wireframes](exports/wireframes.svg) — 8 основных шагов до оплаты.
- Отдельные мобильные PNG `exports/S01.png` … `S33.png`, всего 33 состояния.
- [Машиночитаемая спецификация](screen-specs.json) и [карта экранов](../docs/screen-map.md).
- [Состояние Figma и реальные ID](figma-state.json); генераторы [foundations.js](foundations.js) и [screens.js](screens.js).

Локальные PNG созданы отдельным генератором `scripts/design-preview.mjs`, не экспортированы из Figma. Они показывают визуальное направление и контент, но не доказывают совпадение с нативными слоями. Основной шрифт Figma — Inter; локальный просмотр использует доступный DejaVu Sans (замена явно ограничена локальными материалами).

## Дизайн-система и scope

Основные цвета: текст #16332E, вторичный #526A64, CTA #146858 на белом; предупреждения и ошибки имеют явный текст. Основной body 16 px, заголовок 28 px, основной CTA минимум 48 px, радиус 16 px, spacing из библиотеки. Полный mobile flow — приоритет, desktop — 3 репрезентативные композиции 1440 px в подготовленном генераторе.

| Компонент | Созданные варианты |
|---|---|
| Button | Default, Hover, Focus, Pressed, Disabled, Loading |
| Input | Default, Focus, Filled, Error, Success, Disabled |
| Search | Default, Focus, Loading, Empty, Error, Disabled |
| Select, Checkbox, Radio | Default, Hover, Focus, Pressed, Disabled, Loading |
| Toast | Info, Success, Error |
| Alert | Info, Warning, Error, Success |
| Modal, BottomSheet | Default, Focus, Disabled, Loading |
| ProductCard | In stock, Low stock, Out of stock, Prescription required, Unavailable, Loading, Error |
| CartItem | Normal, Quantity updated, Item unavailable, Price changed, Partial stock, Loading, Error |
| PriceSummary | Default |
| DeliverySlot | Default, Selected, Unavailable, Loading, Error |
| PaymentMethod | Idle, Selected, Processing, Success, Declined, Cancelled, Unknown, Service error |
| OrderStatus | Processing, Confirmed, Delayed, Delivered, Cancelled, Refund pending, Refund completed |
| Stepper, Skeleton | Default / Loading |

Button/Input построены как локальные wrappers над экземплярами библиотеки. Остальные — исходные редактируемые компоненты с текстовыми состояниями. Нужна визуальная доработка и проверка деталей controls (в частности Checkbox/Radio/Select), когда доступ к Figma восстановится. Заявлять библиотеку полностью принятой и пункт 4 законченным нельзя.

## Как автономно продолжить

1. После восстановления лимита подключить этот же файл; открыть `figma-state.json`, проверить существующие ID. Файл и библиотеку повторно не создавать.
2. Через `use_figma` передать `const STATE = <foundations из figma-state.json>;` и содержимое `screens.js`. Скрипт рассчитан на 33 мобильных и 3 десктопных экрана, экземпляры компонентов и переходы. Он подготовлен, но его выполнение в Figma ещё не проверено.
3. Сохранить реальные возвращённые ID экранов в state ledger; проверить узлы, image fills (целые UI-скриншоты недопустимы), шрифт, clipping и размеры.
4. Получить screenshot композиции, устранить выявленные дефекты, проверить сценарии A–H и отредактировать controls. Только после этого закрыть пункт 4.

Для локального воспроизведения: `npm run design:export`. Ручное рисование или взаимодействие с онлайн-редактором не требуется. Лимит внешнего сервиса остаётся единственным блокером нативного завершения Figma; не требуется покупать инструменты для генерации диаграмм.
