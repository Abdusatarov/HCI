# Основания проектных решений

Исходная постановка пользователя сохранена в [source-brief.txt](source-brief.txt). Это основной источник требований. Нормативные и методические ссылки ниже даны для проверки подхода; новая самостоятельная юридическая экспертиза или полная проверка источников не проводилась.

| Источник | Для чего применяется |
|---|---|
| [OMG BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2/) | Типы задач, events, gateways, lanes, pools, messages, XML/DI |
| [OMG XSD](https://www.omg.org/spec/BPMN/20100501/BPMN20.xsd) | Фактически скачана и использована для валидации вместе с зависимостями |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Цель доступности: ошибки, labels, contrast, focus, reflow, target size |
| [Nielsen: 10 heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) | Видимость состояния, предотвращение ошибок, восстановление, контроль пользователя |
| [Stripe: idempotent requests](https://docs.stripe.com/api/idempotent_requests) | Модель одного payment operation ID при retry; не интеграция Stripe |
| [GOV.UK: moderated usability testing](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing) | Проверка реальными задачами без подсказок по кнопкам |
| [Mermaid](https://mermaid.js.org/) / [bpmn-js](https://bpmn.io/toolkit/bpmn-js/) | Бесплатный автоматический рендеринг исходников |

ISO 9241-210 упоминается в исходном brief как human-centred design framework. Полный платный текст стандарта не получался; соответствие ISO не заявлено. Правила продажи/рецептов/доставки зависят от страны и требуют отдельной проверки официальных нормативных источников до реального запуска.
