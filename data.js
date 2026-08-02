const defaultSkillsData = {
    physical: [
        { id: 'athletics', name: 'Атлетика' }, 
        { id: 'brawl', name: 'Боротьба' }, 
        { id: 'survival', name: 'Виживання' }, 
        { id: 'drive', name: 'Керування' }, 
        { id: 'larceny', name: 'Крадійство' }, 
        { id: 'stealth', name: 'Непомітність' }, 
        { id: 'craft', name: 'Ремесло' }, 
        { id: 'melee', name: 'Рукопашний бій' }, 
        { id: 'firearms', name: 'Стрільба' }
    ],
    social: [
        { id: 'performance', name: 'Виступ' }, 
        { id: 'streetwise', name: 'Вуличний досвід' }, 
        { id: 'etiquette', name: 'Етикет' }, 
        { id: 'intimidation', name: 'Залякування' }, 
        { id: 'leadership', name: 'Лідерство' }, 
        { id: 'persuasion', name: 'Переконливість' }, 
        { id: 'insight', name: 'Проникливість' }, 
        { id: 'animalKen', name: 'Розуміння тварин' }, 
        { id: 'subterfuge', name: 'Хитрість' }
    ],
    mental: [
        { id: 'academics', name: 'Знання' }, 
        { id: 'medicine', name: 'Медицина' }, 
        { id: 'science', name: 'Наука' }, 
        { id: 'occult', name: 'Окультизм' }, 
        { id: 'politics', name: 'Політика' }, 
        { id: 'investigation', name: 'Розслідування' }, 
        { id: 'awareness', name: 'Спостережливість' }, 
        { id: 'technology', name: 'Технології' }, 
        { id: 'finance', name: 'Фінанси' }
    ]
};

const defaultAttributesData = {
    physical: [{ id: 'strength', name: 'Міць' }, { id: 'dexterity', name: 'Спритність' }, { id: 'stamina', name: 'Витривалість' }],
    social: [{ id: 'charisma', name: 'Харизма' }, { id: 'manipulation', name: 'Маніпуляція' }, { id: 'composure', name: 'Витримка' }],
    mental: [{ id: 'intelligence', name: 'Інтелект' }, { id: 'wits', name: 'Кмітливість' }, { id: 'resolve', name: 'Рішучість' }]
};

let clansData = {
    "unknown": { name: "Невідомо (Каїтиф)", desc: "Ви не знаєте свого походження...", disciplines: ["animalism", "auspex", "blood_sorcery", "celerity", "dominate", "fortitude", "obfuscate", "potence", "presence", "protean"] }
};

let disciplinesData = {
    "animalism": { "name": "Анімалізм (Animalism)", "desc": "Дарує надприродний зв’язок із тваринами та внутрішнім Звіром. Кревний може закликати звірів, спілкуватися з ними, використовувати їх як шпигунів або навіть вгамовувати шаленство інших." },
    "auspex": { "name": "Ауспекс (Auspex)", "desc": "Загострює відчуття Кревного до надприродного рівня. Ця дисципліна дає змогу бачити крізь ілюзії, відчувати аури, читати думки та розрізняти відбитки подій на предметах" },
    "blood_sorcery": { "name": "Чари Крові (Blood Sorcery)", "desc": "Темне мистецтво використання крові для магічних маніпуляцій і ритуалів. Вони дають змогу перетворювати кров на отруту, викрадати її на відстані та здійснювати складні чародійні обряди" },
    "celerity": { "name": "Стрімкість (Celerity)", "desc": "Забезпечує надприродну швидкість і рефлекси. Вампір може ухилятися від куль, атакувати швидше за блискавку або виконувати складні дії за лічені миті" },
    "dominate": { "name": "Домінування (Dominate)", "desc": "Дає змогу контролювати розум і дії інших через зоровий контакт. Майстри цієї сили можуть віддавати миттєві накази, змінювати спогади та пригнічувати чужу свободу волі" },
    "fortitude": { "name": "Стійкість (Fortitude)", "desc": "Надає Кревному монструозну витривалість до фізичних і ментальних атак. Вона дозволяє ігнорувати біль, витримувати вогонь і сонячне світло, а також зміцнювати свій розум" },
    "obfuscate": { "name": "Затьмарення (Obfuscate)", "desc": "Мистецтво ставати невидимим, впливаючи на розум спостерігачів. Вампір може зливатися з тінями, змінювати вигляд або зникати з-під погляду, поки не видасть себе агресією" },
    "potence": { "name": "Могутність (Potence)", "desc": "Дарує фізичну силу, що значно перевищує людські та вампірські межі. Носій може здійснювати великі стрибки, розривати сталь і завдавати нищівних ударів голіруч." },
    "presence": { "name": "Присутність (Presence)", "desc": "Маніпулює емоційним станом тих, хто знаходиться поруч із вампіром. Вона дає змогу вселяти жах, викликати захоплення або змушувати натовп підкорятися величі каїніта" },
    "protean": { "name": "Перетворення (Protean)", "desc": "Дає змогу фізично змінювати форму власного немертвого тіла. Кревний може відрощувати кігті, перетворюватися на звірів, розчинятися в землі або набувати форми туману." },
    "oblivion": { "name": "Забуття (Oblivion)", "desc": "Забуття — це дисципліна, яка дозволяє використовувати дещо абсолютно надприродне; викликати надприродну темряву з Безодні та поневолювати привидів з Підземного світу."},
    "thin_blood_alchemy": { "name": "Алхімія рідкокровців (Thin-Blood Alchemy)", "desc": "Здатність рідкокровців змішувати віте з різними речовинами та емоціями для створення унікальних еліксирів і ефектів." }
};

let disciplinesPowersMap = {}; 
let attributesData = defaultAttributesData;
let skillsData = defaultSkillsData;

const state = {
    clan: 'unknown',
    disciplines: {}, 
    disciplinePowers: {}, 
    attributes: {}, 
    skills: {},     
    distribution: 'balanced',
    advantagesData: [],
    selectedAdvantages: [],
    predatorData: [],
    selectedPredator: null,
    predatorChoices: { discipline: null, skill: null, specName: null },
    humanity: 7 
};

const attrTarget = { 4: 1, 3: 3, 2: 4, 1: 1 };
const skillTargets = {
    jack: { 3: 1, 2: 8, 1: 10, 4: 0 },
    balanced: { 3: 3, 2: 5, 1: 7, 4: 0 },
    specialist: { 4: 1, 3: 3, 2: 3, 1: 3 }
};
