const stepGuides = {
1: {
    title: "Крок 1: Концепт Персонажа та Кров",
    text: "Детальні інструкції для генератора персонажа (Vampire: The Masquerade 5e).\n\n" +
          "Цей посібник містить розгорнуті пояснення та правила для кожного етапу створення вашого Кревного у Світі Темряви. " +
          "Дотримуйтесь цих вказівок, щоб створити гармонійного та збалансованого персонажа відповідно до правил п'ятої редакції (V5).\n\n" +
          "Крок 1: Концепт Персонажа та Кров\n" +
          "Перший крок визначає базову ідентичність вашого вампіра, його походження та місце у суспільстві нічних хижаків.\n\n" +
          "• Концепт (Коротка фраза): Сформулюйте суть вашого персонажа одним висловлюванням. Це може бути стиль життя у минулому або головна мета в нежитті (наприклад: «Цинічний колишній папараці, що полює на таємниці Камарильї»).\n\n" +
          "• Ім'я: Офіційне ім'я або прізвисько, під яким вашого персонажа знають у світі Сородичів.\n\n" +
          "• Клан: Оберіть вашу кровну лінію. Клан визначає ваші загальні схильності, а також автоматично розкриває два важливі параметри:\n" +
          "  - Клановий примус (Clan Compulsion): Внутрішній тиск крові, що змушує вас піддаватися специфічним для клану маніям чи емоціям під час критичних невдач.\n" +
          "  - Кланове прокляття (Clan Bane): Фатальна вада, притаманна всім представникам вашого клану (наприклад, нездорова спрага, спотворення тіла чи ментальна нестабільність).\n\n" +
          "• Історія (Фон): Опишіть ключові моменти смертного життя вашого персонажа, обставини його Обіймів (Embrace), а також ваших Взірців (Touchstones) — людей або ідеалів, що прив'язують вас до залишків людяності."
},
    2: {
        title: "Крок 2: Характеристики",
        text: "Розподіліть крапки між 9 характеристиками (Фізичні, Соціальні, Ментальні). Ви можете скористатися готовим шаблоном із випадаючого меню або розподілити їх самостійно: 1 на 4, 3 на 3, 4 на 2 і 1 на 1."
    },
    3: {
        title: "Крок 3: Навички та Спеціалізації",
        text: "Оберіть метод розподілу навичок та розставте крапки. Впишіть назви спеціалізацій для Знань, Ремесла, Виступу, Науки або оберіть додаткову довільну спеціалізацію."
    },
    4: {
        title: "Крок 4: Хижацькі звички",
        text: "Оберіть свій тип хижака. Це визначить ваш стиль полювання, додасть безплатну крапку дисципліни, спеціалізацію, вплине на Людяність та надасть стартові блага чи вади."
    },
    5: {
        title: "Крок 5: Дисципліни та Здібності",
        text: "Оберіть базові дисципліни та здібності відповідного рівня згідно з правилами V5. У разі потреби ви можете додати унікальну дисципліну вручну."
    },
    6: {
        title: "Крок 6: Блага та Вади",
        text: "Налаштуйте переваги та недоліки персонажа за допомогою балової системи (витратите рівно 7 крапок на блага/надбання та 2 крапки на вади). Використовуйте фільтри за категоріями та вартістю."
    },
    7: {
        title: "Крок 7: Підсумок та Друк",
        text: "Перевірте зібрані дані вашого персонажа у єдиному зведеному вигляді перед тим, як зберегти або роздрукувати готовий аркуш."
    }
};

function showStepGuideModal(stepNumber) {
    const guide = stepGuides[stepNumber];
    if (!guide) return;

    // Перевіряємо, чи вже існує модальне вікно, якщо ні — створюємо
    let modal = document.getElementById('step-guide-modal');
    modal.addEventListener('click', (e) => {
    if (e.target === modal) closeStepGuideModal();
});
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'step-guide-modal';
        modal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-in-out]';
        modal.innerHTML = `
            <div class="bg-white max-w-3xl w-full rounded-xl shadow-2xl border-2 border-[#8b0000] overflow-hidden flex flex-col">
                <div class="bg-[#1a1a1a] text-white p-4 flex justify-between items-center border-b-4 border-[#8b0000]">
                    <h3 id="modal-title" class="font-serif font-bold text-lg uppercase tracking-wider text-red-500">Довідка</h3>
                    <button onclick="closeStepGuideModal()" class="text-gray-400 hover:text-white text-xl font-bold px-2">&times;</button>
                </div>
                <div id="modal-text" class="p-6 text-gray-700 text-sm leading-relaxed text-justify font-serif"></div>
                <div class="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                    <button onclick="closeStepGuideModal()" class="px-5 py-2 bg-[#8b0000] text-white font-bold text-xs uppercase tracking-widest rounded shadow hover:bg-red-900 transition-colors">Зрозуміло</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('modal-title').innerText = guide.title;
    document.getElementById('modal-text').innerText = guide.text;
    modal.classList.remove('hidden');
}

function closeStepGuideModal() {
    const modal = document.getElementById('step-guide-modal');
    if (modal) modal.classList.add('hidden');
}
