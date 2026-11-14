// Inject STATE from design/figma-state.json before running.
await Promise.all(['Regular','Medium','Semi Bold','Bold'].map(style=>figma.loadFontAsync({family:'Inter',style})));
const page=await figma.getNodeByIdAsync(STATE.page);await figma.setCurrentPageAsync(page);
const plannedBoards=['Mobile · основной сценарий','Mobile · ошибки и восстановление','Desktop · адаптивные примеры'];
const existingBoards=page.children.filter(n=>plannedBoards.includes(n.name));
if(existingBoards.length)throw new Error('Screen composition already exists; inspect these IDs before resuming: '+existingBoards.map(n=>n.id).join(','));
const created=[];const add=n=>{created.push(n.id);return n;};
const vars=Object.fromEntries(await Promise.all(Object.entries(STATE.variables).map(async([k,id])=>[k,await figma.variables.getVariableByIdAsync(id)])));
const space=await figma.variables.getVariableByIdAsync(STATE.space),radius=await figma.variables.getVariableByIdAsync(STATE.radius);
const paint=k=>[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',vars[k])];
const cm={};
await Promise.all(Object.entries(STATE.components).map(async([key,v])=>{cm[key]=Object.fromEntries(await Promise.all(Object.entries(v.states).map(async([state,id])=>{const node=await figma.getNodeByIdAsync(id);if(!node||node.type!=='COMPONENT')throw new Error('Missing component '+key+'/'+state+': '+id);return [state,node];})));}));
function text(p,v,style='body',tone='ink',w=350){const t=add(figma.createText());p.appendChild(t);t.fontName={family:'Inter',style:'Regular'};t.textStyleId=STATE.styles[style];t.characters=v;t.fills=paint(tone);t.textAutoResize='HEIGHT';t.resize(w,24);return t;}
function stack(p,name,w=350,fill='paper',pad=0,gap=16,dir='VERTICAL'){const f=add(figma.createAutoLayout(dir));p.appendChild(f);f.name=name;f.resize(w,100);f.primaryAxisSizingMode='AUTO';f.counterAxisSizingMode='FIXED';f.paddingTop=f.paddingBottom=f.paddingLeft=f.paddingRight=pad;f.itemSpacing=gap;f.fills=paint(fill);if(pad)f.setBoundVariable('cornerRadius',radius);return f;}
function instance(p,type,state='Default'){const c=cm[type][state]||Object.values(cm[type])[0];const i=add(c.createInstance());p.appendChild(i);return i;}
function btn(p,label,target,state='Default'){const i=instance(p,'Button',state);const nested=i.findAllWithCriteria({types:['INSTANCE']})[0];nested.setProperties({'Label#2:0':label});if(target)links.push({id:i.id,target});return i;}
function field(p,label,value,error=false){const i=instance(p,'Input',error?'Error':'Filled');const nested=i.findAllWithCriteria({types:['INSTANCE']})[0];nested.setProperties({'Label#280:41':label,'Value#630:14':value,'Has Error#72:6':error,'Error#280:44':'Уточните улицу и номер дома'});return i;}
function notice(p,title,copy,tone='warningBg'){const f=stack(p,title,350,tone,16,8);text(f,title,'label','ink',318);text(f,copy,'body','ink',318);return f;}
function summary(p){const f=stack(p,'Состав и итог',350,'paper',16,10);for(const [label,amount,strong]of [['Товары','1 200 ₸',false],['Доставка','500 ₸',false],['Итого','1 700 ₸',true]]){const row=stack(f,label,318,'paper',0,16,'HORIZONTAL');text(row,label,strong?'heading':'body','ink',200);const value=text(row,amount,strong?'heading':'body','ink',102);value.textAlignHorizontal='RIGHT';}text(f,'Без скрытых сборов','caption','muted',318);return f;}
function product(p,state='In stock'){return instance(p,'ProductCard',state);}
const links=[],screens={};
const board=stack(page,'Mobile · основной сценарий',1320,'canvas',32,24);board.x=2000;board.y=200;
text(board,'Аптека рядом','title','brand',1256);text(board,'01 / Основной путь · 390 px · Учебный интерактивный прототип','body','muted',1256);
let row;let index=0;
function screen(parent,id,title,sub=''){if(index%3===0)row=stack(parent,'Ряд '+Math.floor(index/3),1256,'canvas',0,32,'HORIZONTAL');index++;const f=stack(row,id+' · '+title,390,'paper',20,16);f.resize(390,844);f.minHeight=844;f.primaryAxisSizingMode='AUTO';f.clipsContent=false;screens[id]=f;const top=stack(f,'Навигация',350,'paper',0,8);text(top,'✚  АПТЕКА РЯДОМ','label','brand');text(top,'Доставка аптечных товаров','caption','muted');text(f,id+' / УЧЕБНЫЙ ПРОТОТИП','caption','muted');text(f,title,'title');if(sub)text(f,sub,'body','muted');return f;}
let f=screen(board,'S01','Когда нужно — рядом','Найдите нужный товар и закажите доставку домой.');field(f,'Название товара','Введите название');btn(f,'Найти товар','S02');notice(f,'Покупайте осознанно','Проверяйте форму и дозировку. Сервис не назначает лечение.','canvas');text(f,'Категории','heading');btn(f,'Аптечные товары','S30');btn(f,'Нужна помощь?','S29');
f=screen(board,'S02','Результаты поиска','По запросу «парацетамол»');field(f,'Поиск','парацетамол');product(f);btn(f,'Открыть товар','S03');btn(f,'Изменить запрос','S01');text(f,'Наличие и цена перепроверяются перед оплатой.','caption','muted');
f=screen(board,'S03','Парацетамол','500 мг · таблетки · 10 шт.');notice(f,'В наличии · 1 200 ₸','Безрецептурный товар в учебном каталоге.','canvas');text(f,'Сверьте название, форму и дозировку с назначением специалиста.','body');text(f,'Количество · 1 упаковка','label');btn(f,'Добавить в корзину','S04');btn(f,'Вернуться к результатам','S02');btn(f,'Инструкция и помощь','S29');
f=screen(board,'S04','Корзина','1 товар · актуальность проверена');instance(f,'CartItem','Normal');summary(f);btn(f,'Перейти к адресу','S05');btn(f,'Продолжить поиск','S02');btn(f,'Удалить товар','S31');
f=screen(board,'S05','Адрес доставки','Шаг 1 из 4 · данные сохранятся при ошибке');field(f,'Улица и дом','ул. Абая, 10');field(f,'Квартира · необязательно','24');field(f,'Телефон получателя','+7 700 000 00 00');text(f,'Контакт нужен для доставки. Диагноз и история болезни не запрашиваются.','caption','muted');btn(f,'Проверить адрес','S06');btn(f,'Назад в корзину','S04');
f=screen(board,'S06','Доставка','Шаг 2 из 4 · адрес подтверждён');notice(f,'ул. Абая, 10 · кв. 24','Изменение адреса потребует нового расчёта.','canvas');instance(f,'DeliverySlot','Selected');text(f,'Стоимость · 500 ₸\nОжидаемое время: сегодня, 18:00–20:00','body');btn(f,'Выбрать оплату','S07');btn(f,'Изменить адрес','S05');
f=screen(board,'S07','Способ оплаты','Шаг 3 из 4');notice(f,'◉ Банковская карта','Реквизиты вводятся на стороне платёжного сервиса.','canvas');text(f,'Мы не храним данные карты.','caption','muted');btn(f,'Проверить заказ','S08');btn(f,'Назад к доставке','S06');
f=screen(board,'S08','Проверьте заказ','Шаг 4 из 4');text(f,'Парацетамол · 500 мг · 10 шт.\n1 упаковка','label');text(f,'ул. Абая, 10 · кв. 24\nСегодня, 18:00–20:00\nОплата картой','body');summary(f);btn(f,'Оплатить 1 700 ₸','S09');btn(f,'Изменить адрес','S05');btn(f,'Отменить оформление','S04');
f=screen(board,'S09','Обрабатываем оплату','Не закрывайте страницу');instance(f,'PaymentMethod','Processing');btn(f,'Оплата обрабатывается',null,'Loading');text(f,'Повторное нажатие недоступно. Результат появится после подтверждения.','body');text(f,'Демонстрационный сценарий:','caption','muted');btn(f,'Показать подтверждение','S10');btn(f,'Ответ не получен','S11');btn(f,'Банк отклонил','S12');
f=screen(board,'S10','Заказ принят','Подтверждение в учебном сценарии');instance(f,'OrderStatus','Confirmed');summary(f);text(f,'Адрес: ул. Абая, 10\nСегодня, 18:00–20:00','body');btn(f,'Отследить заказ','S13');btn(f,'Продолжить покупки','S01');
f=screen(board,'S13','Заказ № DEMO-1042','Актуальный статус: собираем заказ');instance(f,'OrderStatus','Processing');text(f,'Принят → Собираем → В пути → Доставлен','body');btn(f,'Обновить статус','S32');btn(f,'Запросить отмену','S15');btn(f,'Связаться с поддержкой','S29');btn(f,'Показать задержку','S14');
f=screen(board,'S32','Заказ доставлен','Получение подтверждено в сценарии');instance(f,'OrderStatus','Delivered');btn(f,'На главную','S01');btn(f,'Помощь по заказу','S29');
const errorBoard=stack(page,'Mobile · ошибки и восстановление',1320,'canvas',32,24);errorBoard.x=3500;errorBoard.y=200;text(errorBoard,'02 / Альтернативы и восстановление','title','ink',1256);text(errorBoard,'Каждое состояние даёт следующий безопасный шаг. Симуляция, без реальных платежей.','body','muted',1256);index=0;
const errors=[
 ['S11','Проверяем статус оплаты','Не повторяйте платёж. Проверяем предыдущую операцию по её номеру.','PaymentMethod','Unknown','Проверить статус','S26'],
 ['S12','Оплата не прошла','Банк отклонил операцию. Заказ не оплачен. Выберите другой способ.','PaymentMethod','Declined','Выбрать оплату','S07'],
 ['S14','Доставка задерживается','Точное время уточняется. Мы покажем новый ETA, когда получим данные.','OrderStatus','Delayed','Обновить статус','S13'],
 ['S15','Отменить заказ?','Сначала проверим, можно ли остановить исполнение. Возврат требует подтверждения.','Modal','Default','Запросить отмену','S27'],
 ['S16','Ничего не нашли','Проверьте название или откройте категорию.','Search','Empty','Изменить запрос','S01'],
 ['S17','Нет соединения','Корзина сохранена на этом устройстве. Повторите запрос после подключения.','Alert','Error','Повторить поиск','S02'],
 ['S18','Сейчас нет в наличии','Не заменяем препарат автоматически. Можно вернуться в каталог или обратиться за помощью.','ProductCard','Out of stock','Вернуться в каталог','S02'],
 ['S19','Требуется рецепт','Предоставьте документ для проверки фармацевтом. До подтверждения покупка заблокирована.','ProductCard','Prescription required','Передать на проверку','S21'],
 ['S20','Документ не принят','Изображение не читается или требования не подтверждены. Исправьте документ либо уберите товар.','Alert','Error','Исправить документ','S19'],
 ['S21','Проверка ожидается','Фармацевт ещё не подтвердил документ. Это не означает разрешение продажи.','Alert','Info','Проверить статус','S20'],
 ['S22','Корзина изменилась','Доступно 2 из 3. Проверьте количество и новый итог, прежде чем продолжить.','CartItem','Partial stock','Проверить корзину','S04'],
 ['S23','Уточните адрес','Не удалось найти дом. Введённые данные сохранены.','Input','Error','Исправить адрес','S05'],
 ['S24','Доставка недоступна','Нет доступных слотов или ответа сервиса. Измените адрес либо повторите проверку.','DeliverySlot','Unavailable','Изменить адрес','S05'],
 ['S25','Сессия завершилась','Войдите снова, чтобы продолжить. Корзина сохранена.','Alert','Info','Восстановить корзину','S04'],
 ['S26','Статус не подтверждён','Операция DEMO-PAY-01. Не создавайте новый платёж. Проверка продолжится по тому же номеру.','PaymentMethod','Unknown','Проверить существующую операцию','S11'],
 ['S27','Возврат запрошен','Отмена подтверждена в сценарии. Деньги ещё не отмечены как возвращённые.','OrderStatus','Refund pending','Проверить возврат','S28'],
 ['S28','Возврат ожидается','Возврат DEMO-REF-01 ещё не завершён. Повторный запрос не нужен.','OrderStatus','Refund pending','Обновить статус возврата','S33'],
 ['S29','Мы поможем','Назовите номер заказа или операции. Не отправляйте данные карты и диагноз.','Alert','Info','К каталогу','S02'],
 ['S30','Категории','Поиск по товарам, без подбора лечения и автоматических назначений.','Search','Default','Открыть аптечные товары','S02'],
 ['S31','Корзина пуста','Найдите нужный товар, чтобы оформить доставку.','CartItem','Normal','Перейти к поиску','S01'],
 ['S33','Возврат подтверждён','Платёжный сервис подтвердил завершение возврата в учебном сценарии.','OrderStatus','Refund completed','На главную','S01']
];
for(const [id,title,copy,type,state,cta,next]of errors){const f=screen(errorBoard,id,title);text(f,copy,'body');if(id==='S31'){notice(f,'Товаров пока нет','Добавьте нужный товар из каталога.','canvas');}else if(id==='S23'){field(f,'Улица и дом','ул. Абая',true);}else{instance(f,type,state);}btn(f,cta,next);if(id==='S11'||id==='S26'){btn(f,'Поддержка по операции','S29');btn(f,'Подтверждение найдено','S10');}else if(id==='S15'){btn(f,'Продолжить ожидание','S13');}else if(id==='S19'||id==='S20'||id==='S21'){btn(f,'Убрать товар','S02');}else if(id!=='S29')btn(f,'Нужна помощь','S29');if(id==='S29')btn(f,'Вернуться к задаче','__BACK__');if(id==='S21')btn(f,'Проверка одобрена · сценарий','S04');}
const desktop=stack(page,'Desktop · адаптивные примеры',1504,'canvas',32,32);desktop.x=5000;desktop.y=200;text(desktop,'03 / Desktop · 1440 px','title','ink',1440);
const desktopScreens=[];
for(const [id,title]of [['D01','Каталог'],['D02','Оформление заказа'],['D03','Заказ принят']]){
 const d=stack(desktop,id+' · '+title,1440,'paper',48,32);d.resize(1440,900);d.primaryAxisSizingMode='FIXED';text(d,'✚  АПТЕКА РЯДОМ     Каталог     Доставка     Помощь','heading','brand',1344);text(d,title,'title','ink',1344);const columns=stack(d,'Две колонки',1344,'paper',0,48,'HORIZONTAL');const main=stack(columns,'Основное содержимое',880,'paper',0,24);const aside=stack(columns,'Итог и действие',350,'canvas',0,16);
 if(id==='D01'){field(main,'Поиск товара','парацетамол');product(main);btn(main,'Открыть товар','S03');notice(aside,'Прозрачная покупка','Цена и наличие проверяются перед оплатой.');}
 if(id==='D02'){field(main,'Адрес','ул. Абая, 10');instance(main,'DeliverySlot','Selected');text(main,'Парацетамол · 1 упаковка · 1 200 ₸','heading');summary(aside);btn(aside,'Оплатить 1 700 ₸','S09');}
 if(id==='D03'){instance(main,'OrderStatus','Confirmed');text(main,'Заказ № DEMO-1042\nул. Абая, 10 · сегодня, 18:00–20:00','heading');btn(aside,'Отследить заказ','S13');}
 desktopScreens.push({id:d.id,name:d.name});
}
const scenarios=stack(page,'Сценарии для защиты · A–H',720,'canvas',32,16);scenarios.x=2000;scenarios.y=board.y+board.height+160;text(scenarios,'Сценарии для защиты','title','ink',656);text(scenarios,'Выберите исходное состояние. Все подтверждения здесь сценарные.','body','muted',656);for(const [label,target]of [['A · Успешный заказ','S01'],['B · Товар закончился','S18'],['C · Ошибка адреса','S23'],['D · Оплата отклонена','S12'],['E · Статус оплаты неизвестен','S11'],['F · Нет соединения','S17'],['G · Проверка рецепта','S19'],['H · Доставка задерживается','S14']])btn(scenarios,label,target);
for(const l of links){const n=await figma.getNodeByIdAsync(l.id);await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:l.target==='__BACK__'?[{type:'BACK'}]:[{type:'NODE',destinationId:screens[l.target].id,navigation:'NAVIGATE',transition:null,preserveScrollPosition:false}]}]);}
const roots=[board,errorBoard,desktop,scenarios];const counts={};const imageNodes=[];let fontMismatch=0;
for(const root of roots)for(const n of root.findAll(()=>true)){counts[n.type]=(counts[n.type]||0)+1;if(n.type==='TEXT'&&n.fontName.family!=='Inter')fontMismatch++;if('fills'in n&&Array.isArray(n.fills)&&n.fills.some(f=>f.type==='IMAGE'))imageNodes.push({id:n.id,name:n.name,type:n.type,width:n.width,height:n.height});}
return {createdNodeIds:created,screens:Object.fromEntries(Object.entries(screens).map(([k,v])=>[k,{id:v.id,name:v.name,width:v.width,height:v.height}])),desktopScreens,boards:roots.map(n=>({id:n.id,name:n.name,width:n.width,height:n.height})),prototypeLinks:links.length,counts,imageNodes,fontMismatch};
