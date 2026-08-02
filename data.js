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
    "animalism": { "name": "Анімалізм (Animalism)", "desc": "Дисципліна, що дозволяє вампірам спілкуватися з тваринами..." },
    "auspex": { "name": "Ауспекс (Auspex)", "desc": "Надприродне сприйняття..." },
    "blood_sorcery": { "name": "Чари Крові (Blood Sorcery)", "desc": "Темне мистецтво..." },
    "celerity": { "name": "Стрімкість (Celerity)", "desc": "Надприродна швидкість і рефлекси..." },
    "dominate": { "name": "Домінування (Dominate)", "desc": "Здатність підпорядковувати розум інших..." },
    "fortitude": { "name": "Стійкість (Fortitude)", "desc": "Неймовірна фізична та ментальна витривалість..." },
    "obfuscate": { "name": "Затьмарення (Obfuscate)", "desc": "Містичне мистецтво ховатися на видноті..." },
    "potence": { "name": "Могутність (Potence)", "desc": "Первісна, надприродна фізична сила..." },
    "presence": { "name": "Присутність (Presence)", "desc": "Надприродна харизма та магнетизм..." },
    "protean": { "name": "Перетворення (Protean)", "desc": "Здатність маніпулювати власною фізичною формою, змінювати свою форму та зливатись з природою..." },
    "thin_blood_alchemy": { "name": "Алхімія рідкокровців (Thin-Blood Alchemy)", "desc": "Здатність змішувати віте з різними речовинами та емоціями для створення унікальних еліксирів і ефектів." }
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
