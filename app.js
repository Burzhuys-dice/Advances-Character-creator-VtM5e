async function init() {
    state.archetypesData = { attributes: [], skills: [] }; // Ініціалізація стану архетипів
    state.manualDisciplines = []; // Ініціалізація ручних дисциплін
    await fetchAllData();
    
    let discKeys = Array.isArray(disciplinesData) ? disciplinesData.map(d => d.id) : Object.keys(disciplinesData);
    discKeys.forEach(d => {
        if(state.disciplines[d] === undefined) state.disciplines[d] = 0;
    });
    Object.values(attributesData).flat().forEach(a => {
        if(state.attributes[a.id] === undefined) state.attributes[a.id] = 1;
    });
    Object.values(skillsData).flat().forEach(s => {
        if(state.skills[s.id] === undefined) state.skills[s.id] = 0;
    });

    populateClanSelects();
    changeClan(Object.keys(clansData)[0] || 'unknown'); 
    renderAttributes();
    renderSkills();
    populateCustomSpecDropdown();
    updateTrackers();
    updateHumanityDisplay();
    
    updateHeaderInfo();
    document.getElementById('character-name').addEventListener('input', updateHeaderInfo);
    
    document.getElementById('loading-status').innerText = 'Крок за кроком (Дані завантажено)';
}

async function fetchAllData() {
    try {
        const [advRes, predRes, coreRes, clansRes, discRes, archRes] = await Promise.all([
            fetch('data/vtm_merits_data.json'),
            fetch('data/vtm_predator-types_1'),
            fetch('data.js'),
            fetch('data/vtm_clans'),
            fetch('data/vtm_disciplines'),
            fetch('data/vtm_archetypes.json') // Завантажуємо файл архетипів
        ]);

        if(advRes.ok) {
            state.advantagesData = await advRes.json();
            populateAdvantageCategories();
        }
        renderAvailableAdvantages();

        if(predRes.ok) state.predatorData = await predRes.json();
        renderPredatorTypes();

        if(coreRes.ok) {
            const coreData = await coreRes.json();
            if(coreData.attributes) attributesData = coreData.attributes;
            if(coreData.skills) {
                if(coreData.skills.physical) skillsData.physical = coreData.skills.physical;
                if(coreData.skills.social) skillsData.social = coreData.skills.social;
                if(coreData.skills.mental) skillsData.mental = coreData.skills.mental;
            }
        }

        if(clansRes.ok) {
            const cData = await clansRes.json();
            if (Array.isArray(cData)) {
                clansData = {};
                cData.forEach(clan => {
                    clansData[clan.id] = clan;
                });
            } else if(cData && Object.keys(cData).length > 0) {
                clansData = cData;
            }
        }

        if(discRes.ok) {
            const dJson = await discRes.json();
            
            let discKeys = Array.isArray(disciplinesData) ? disciplinesData.map(d => d.id) : Object.keys(disciplinesData);
            discKeys.forEach(k => disciplinesPowersMap[k] = []);

            let rawPowers = dJson.powers || (Array.isArray(dJson) ? dJson : []);
            if (Array.isArray(rawPowers)) {
                rawPowers.forEach(power => {
                    let dKey = power.disc;
                    if (dKey && disciplinesPowersMap[dKey]) {
                        disciplinesPowersMap[dKey].push({
                            id: power.ability_name || power.name,
                            name: power.ability_name || power.name,
                            level: Number(power.level || 1),
                            desc: power.effect_description || power.desc || '',
                            requirement: power.requirement || power.requirements || power.prerequisite || power.prerequisites || '',
                            rouseCost: power.rouse_cost || '',
                            dicePool: power.dice_pool || '',
                            resistance: power.resistance || ''
                        });
                    }
                });
            }
        }

        // Обробка архетипів
        if(archRes && archRes.ok) {
            state.archetypesData = await archRes.json();
        }
        populateArchetypes();
        populateManualDisciplineDropdown();

    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        document.getElementById('loading-status').innerText = 'Помилка завантаження даних';
    }
}

// Заповнення випадаючих списків архетипів
function populateArchetypes() {
    const attrSelect = document.getElementById('attr-archetype-select');
    const skillSelect = document.getElementById('skill-archetype-select');

    if (attrSelect && state.archetypesData.attributes) {
        let html = '<option value="">-- Вручну / Оберіть шаблон --</option>';
        state.archetypesData.attributes.forEach(a => {
            html += `<option value="${a.id}">${a.name}</option>`;
        });
        attrSelect.innerHTML = html;
    }

    if (skillSelect && state.archetypesData.skills) {
        let html = '<option value="">-- Вручну / Оберіть шаблон --</option>';
        state.archetypesData.skills.forEach(s => {
            html += `<option value="${s.id}">${s.name}</option>`;
        });
        skillSelect.innerHTML = html;
    }
}

// Застосування архетипу до характеристик
function applyAttributeArchetype(archId) {
    if (!archId) return; // Якщо обрано "Вручну", не змінюємо поточні дані
    
    const archetype = state.archetypesData.attributes.find(a => a.id === archId);
    if (!archetype) return;

    // Скидаємо всі характеристики до базового рівня (1)
    Object.keys(state.attributes).forEach(k => state.attributes[k] = 1);

    // Застосовуємо значення з архетипу
    for (const [key, val] of Object.entries(archetype.values)) {
        if (state.attributes[key] !== undefined) {
            state.attributes[key] = val;
        }
    }
    
    renderAttributes();
    updateTrackers();
}

// Застосування архетипу до навичок
function applySkillArchetype(archId) {
    if (!archId) return; // Якщо обрано "Вручну", не змінюємо поточні дані
    
    const archetype = state.archetypesData.skills.find(s => s.id === archId);
    if (!archetype) return;

    // Скидаємо всі навички до базового рівня (0)
    Object.keys(state.skills).forEach(k => state.skills[k] = 0);

    // Застосовуємо значення з архетипу
    for (const [key, val] of Object.entries(archetype.values)) {
        if (state.skills[key] !== undefined) {
            state.skills[key] = val;
        }
    }
    
    renderSkills();
    updateTrackers();
}

function populateManualDisciplineDropdown() {
    const select = document.getElementById('manual-disc-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Оберіть дисципліну --</option>';
    
    let options = [];
    if (Array.isArray(disciplinesData)) {
        options = disciplinesData.map(d => ({ id: d.id, name: d.name || d.id }));
    } else {
        options = Object.keys(disciplinesData).map(k => ({ id: k, name: disciplinesData[k].name || k }));
    }

    options.sort((a, b) => a.name.localeCompare(b.name));

    options.forEach(opt => {
        if(opt.id) select.innerHTML += `<option value="${opt.id}">${opt.name}</option>`;
    });
}

function addManualDisciplineFromSelect() {
    const select = document.getElementById('manual-disc-select');
    const discId = select.value;
    if (!discId) return;

    if (!state.manualDisciplines) state.manualDisciplines = [];
    
    let availableDisc = [...(clansData[state.clan]?.disciplines || [])];
    if (state.predatorChoices && state.predatorChoices.discipline) {
        availableDisc.push(state.predatorChoices.discipline);
    }

    if (!availableDisc.includes(discId) && !state.manualDisciplines.includes(discId)) {
        state.manualDisciplines.push(discId);
        if (state.disciplines[discId] === undefined) {
            state.disciplines[discId] = 0;
        }
        renderDisciplines();
    }
    
    select.value = ""; 
}

function getDisciplineInfo(discKey) {
    if (Array.isArray(disciplinesData)) {
        return disciplinesData.find(d => d.id === discKey) || { name: discKey, desc: 'Опис відсутній' };
    }
    return disciplinesData[discKey] || { name: discKey, desc: 'Опис відсутній' };
}

function renderPredatorTypes() {
    const grid = document.getElementById('predator-grid');
    if (state.predatorData.length === 0) return;

    let html = '';
    state.predatorData.forEach(predator => {
        const isSelected = state.selectedPredator === predator.id;
        
        let optionsHtml = '';
        if (isSelected) {
            let discOpts = (predator.discipline_options || []).map(opt => `
                <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded border border-transparent hover:border-gray-200 transition-colors" onclick="event.stopPropagation()">
                    <input type="radio" name="pred_disc" value="${opt.id}" 
                        onchange="setPredatorChoice('discipline', '${opt.id}')"
                        ${state.predatorChoices.discipline === opt.id ? 'checked' : ''} class="accent-[#4b0082]">
                    ${opt.name}
                </label>
            `).join('');

            let skillOpts = (predator.skill_options || []).map(opt => `
                <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded border border-transparent hover:border-gray-200 transition-colors" onclick="event.stopPropagation()">
                    <input type="radio" name="pred_skill" value="${opt.id}" 
                        onchange="setPredatorChoice('skill', '${opt.id}', '${opt.spec}')"
                        ${state.predatorChoices.skill === opt.id && state.predatorChoices.specName === opt.spec ? 'checked' : ''} class="accent-[#4b0082]">
                    ${opt.name}
                </label>
            `).join('');

            optionsHtml = `
                <div class="mt-4 pt-4 border-t border-purple-100 animate-[fadeIn_0.3s_ease-in-out]">
                    <div class="mb-3">
                        <span class="block text-[11px] font-bold text-[#4b0082] uppercase tracking-widest mb-1">Оберіть дисципліну (+1 крапка)</span>
                        <div class="flex flex-col gap-1">${discOpts}</div>
                    </div>
                    <div>
                        <span class="block text-[11px] font-bold text-[#4b0082] uppercase tracking-widest mb-1">Оберіть спеціалізацію (+1 крапка)</span>
                        <div class="flex flex-col gap-1">${skillOpts}</div>
                    </div>
                </div>
            `;
        }

        const modifierSymbol = (predator.humanity_modifier > 0) ? '+' : '';
        const modifierText = predator.humanity_modifier !== 0 ? `Людяність ${modifierSymbol}${predator.humanity_modifier}` : 'Людяність незмінна';

        let advantagesDisplay = '';
        if (predator.advantages_text || predator.advantages_text_full) {
            advantagesDisplay = `<div class="bg-purple-50 p-2 rounded text-indigo-800 border border-purple-100 flex flex-col gap-1">`;
            if (predator.advantages_text) {
                advantagesDisplay += `<span class="text-[11px] font-bold">${predator.advantages_text}</span>`;
            }
            if (predator.advantages_text_full) {
                advantagesDisplay += `<span class="text-[10px] leading-snug opacity-90">${predator.advantages_text_full}</span>`;
            }
            advantagesDisplay += `</div>`;
        } else {
            advantagesDisplay = `<div class="bg-purple-50 p-2 rounded text-[11px] font-bold text-indigo-800 border border-purple-100">Немає додаткових благ/вад</div>`;
        }

        html += `
            <div class="predator-card flex flex-col bg-white p-5 rounded-xl shadow-sm cursor-pointer ${isSelected ? 'selected' : 'border-gray-200 hover:border-gray-300'}" 
                 onclick="selectPredator('${predator.id}')">
                <div class="flex justify-between items-start mb-3 gap-2">
                    <h3 class="font-serif font-bold text-lg text-[#1a1a1a] leading-tight">${predator.name}</h3>
                    <span class="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-700 min-w-max text-right">${modifierText}</span>
                </div>
                <p class="text-xs text-gray-600 mb-3 flex-grow text-justify">${predator.description}</p>
                ${advantagesDisplay}
                ${optionsHtml}
            </div>
        `;
    });
    grid.innerHTML = html;
}

function selectPredator(id) {
    if (state.selectedPredator !== id) {
        state.selectedPredator = id;
        state.predatorChoices = { discipline: null, skill: null, specName: null };
        
        const predator = state.predatorData.find(p => p.id === id);
        if (predator) {
            if (predator.discipline_options && predator.discipline_options.length > 0) {
                state.predatorChoices.discipline = predator.discipline_options[0].id;
            }
            if (predator.skill_options && predator.skill_options.length > 0) {
                state.predatorChoices.skill = predator.skill_options[0].id;
                state.predatorChoices.specName = predator.skill_options[0].spec;
            }
        }
        
        renderPredatorTypes();
        applyPredatorGlobalUpdates();
    }
}

function setPredatorChoice(type, id, specName = null) {
    if (type === 'discipline') state.predatorChoices.discipline = id;
    if (type === 'skill') {
        state.predatorChoices.skill = id;
        state.predatorChoices.specName = specName;
    }
    if (event) event.stopPropagation();
    applyPredatorGlobalUpdates();
}

function applyPredatorGlobalUpdates() {
    updateHumanityDisplay();
    renderDisciplines();
    renderSkills();
    renderPredatorAdvantagesInfo();
    
    const specDisplay = document.getElementById('predator-spec-display');
    if (state.selectedPredator && state.predatorChoices.specName) {
        specDisplay.innerText = `Спеціалізація хижака: ${state.predatorChoices.specName}`;
        specDisplay.classList.remove('hidden');
    } else {
        specDisplay.classList.add('hidden');
    }
}

function renderPredatorAdvantagesInfo() {
    const infoDiv = document.getElementById('predator-adv-info');
    if (!infoDiv) return;
    
    if (state.selectedPredator) {
        const predator = state.predatorData.find(p => p.id === state.selectedPredator);
        if (predator && predator.advantages_text) {
            infoDiv.innerHTML = `
                <div class="bg-[#f8f5ff] border-l-4 border-[#4b0082] text-indigo-900 p-4 rounded shadow-sm">
                    <h4 class="font-bold text-sm uppercase tracking-widest mb-1 flex items-center gap-2">
                        <span class="w-2 h-2 bg-[#4b0082] rounded-full inline-block"></span> Бонус вашого хижака
                    </h4>
                    <p class="text-sm font-medium">${predator.advantages_text}</p>
                    <p class="text-xs opacity-70 mt-1">Оберіть відповідні блага/вади зі списку нижче вручну, враховуючи цю вимогу.</p>
                </div>
            `;
            infoDiv.classList.remove('hidden');
        } else {
            infoDiv.classList.add('hidden');
        }
    } else {
        infoDiv.classList.add('hidden');
    }
}

function updateHumanityDisplay() {
    let currentHumanity = 7;
    if (state.selectedPredator) {
        const predator = state.predatorData.find(p => p.id === state.selectedPredator);
        if (predator && predator.humanity_modifier) {
            currentHumanity += predator.humanity_modifier;
        }
    }
    document.getElementById('humanity-display').innerText = currentHumanity;
}

function createDotsHTML(type, id, baseValue, maxDots = 5, bonusValue = 0) {
    let html = '<div class="dot-container">';
    let totalValue = baseValue + bonusValue;
    if (totalValue > maxDots) totalValue = maxDots; 
    
    for (let i = 1; i <= maxDots; i++) {
        let dotClass = '';
        if (i <= baseValue) dotClass = 'filled';
        else if (i <= totalValue) dotClass = 'predator';
        
        const min = type === 'attribute' ? 1 : 0;
        html += `<div class="dot ${dotClass}" onclick="handleDotClick('${type}', '${id}', ${i}, ${baseValue}, ${min})"></div>`;
    }
    html += '</div>';
    return html;
}

function handleDotClick(type, id, clickedIndex, baseValue, min) {
    let newValue = clickedIndex;
    if (clickedIndex === baseValue && baseValue > min) {
        newValue = clickedIndex - 1;
    }
    
    if (type === 'attribute') {
        state.attributes[id] = newValue;
        renderAttributes();
        document.getElementById('attr-archetype-select').value = ""; // Скидаємо селект при ручній зміні
    } else if (type === 'skill') {
        state.skills[id] = newValue;
        renderSkills();
        document.getElementById('skill-archetype-select').value = ""; // Скидаємо селект при ручній зміні
    } else if (type === 'discipline') {
        state.disciplines[id] = newValue;
        renderDisciplines();
    }
    updateTrackers();
}

function renderDisciplines() {
    const grid = document.getElementById('disciplines-grid');
    let availableDisc = [...(clansData[state.clan]?.disciplines || [])];
    
    if (state.predatorChoices.discipline && !availableDisc.includes(state.predatorChoices.discipline)) {
        availableDisc.push(state.predatorChoices.discipline);
    }
    
    if (state.manualDisciplines) {
        state.manualDisciplines.forEach(d => {
            if (!availableDisc.includes(d)) availableDisc.push(d);
        });
    }
    
    let html = '<div class="space-y-6 bg-white p-6 border border-gray-200 rounded-lg">';
    
    if(availableDisc.length === 0) {
        html += '<p class="text-gray-500">Для цього клану немає доступних дисциплін у базі.</p>';
    }

    availableDisc.forEach(discKey => {
        const discInfo = getDisciplineInfo(discKey);
        const ukrName = discInfo.name || discKey; 
        let bonus = (state.predatorChoices.discipline === discKey) ? 1 : 0;
        let baseDots = state.disciplines[discKey] || 0;
        let totalDots = baseDots + bonus;
        
        if(!state.disciplinePowers[discKey]) state.disciplinePowers[discKey] = {};

        html += `
            <div class="group border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-serif text-xl font-bold text-gray-800 group-hover:text-[#8b0000] transition-colors">${ukrName}</span>
                    ${createDotsHTML('discipline', discKey, baseDots, 5, bonus)}
                </div>
                <p class="text-sm text-gray-500 text-justify leading-relaxed mb-4">${discInfo.desc || ''}</p>
        `;

        if (totalDots > 0) {
            html += `<div class="bg-gray-50 border-l-2 border-[#8b0000] p-4 rounded-r-lg space-y-4">
                        <h4 class="text-xs font-bold uppercase tracking-widest text-gray-800">Вибір здібностей</h4>`;
            
            let powersList = disciplinesPowersMap[discKey] || [];

            for (let dotLevel = 1; dotLevel <= totalDots; dotLevel++) {
                let availablePowers = powersList.filter(p => Number(p.level) <= totalDots);
                
                let optionsHtml = `<option value="">-- Оберіть здібність (макс. рівень ${totalDots}) --</option>`;
                availablePowers.forEach(p => {
                    let isSelected = state.disciplinePowers[discKey][dotLevel] === p.id;
                    let reqText = (p.requirement && String(p.requirement).trim().toLowerCase() !== 'немає' && String(p.requirement).trim() !== '') ? ` [Вимога: ${p.requirement}]` : '';
                    optionsHtml += `<option value="${p.id}" ${isSelected ? 'selected' : ''}>Рівень ${p.level}: ${p.name}${reqText}</option>`;
                });

                let selectedDesc = '';
                let selectedPowerId = state.disciplinePowers[discKey][dotLevel];
                if (selectedPowerId) {
                    let foundPower = availablePowers.find(p => p.id === selectedPowerId);
                    if (foundPower) {
                        selectedDesc = `
                            <div class="mt-2 text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-100 space-y-1">
                                <p class="italic leading-snug">${foundPower.desc}</p>
                                ${(foundPower.requirement && String(foundPower.requirement).trim().toLowerCase() !== 'немає' && String(foundPower.requirement).trim() !== '') ? `<p><strong>Вимога:</strong> ${foundPower.requirement}</p>` : ''}
                                ${(foundPower.rouseCost && String(foundPower.rouseCost).trim().toLowerCase() !== 'немає' && String(foundPower.rouseCost).trim() !== '') ? `<p><strong>Збурення:</strong> ${foundPower.rouseCost}</p>` : ''}
                                ${(foundPower.dicePool && String(foundPower.dicePool).trim().toLowerCase() !== 'немає' && String(foundPower.dicePool).trim() !== '') ? `<p><strong>Пул кубиків:</strong> ${foundPower.dicePool}</p>` : ''}
                                ${(foundPower.resistance && String(foundPower.resistance).trim().toLowerCase() !== 'немає' && String(foundPower.resistance).trim() !== '') ? `<p><strong>Опір:</strong> ${foundPower.resistance}</p>` : ''}
                            </div>
                        `;
                    }
                }

                html += `
                    <div class="bg-white p-3 rounded border border-gray-200 shadow-sm">
                        <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Здібність за ${dotLevel}-ю крапку</label>
                        <select onchange="setDisciplinePower('${discKey}', ${dotLevel}, this.value)" class="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm font-semibold text-gray-800 outline-none focus:border-[#8b0000]">
                            ${optionsHtml}
                        </select>
                        ${selectedDesc}
                    </div>
                `;
            }
            html += `</div>`;
        }
        
        html += `</div>`;
    });
    html += '</div>';
    grid.innerHTML = html;
}

function setDisciplinePower(discKey, dotLevel, powerId) {
    if(!state.disciplinePowers[discKey]) state.disciplinePowers[discKey] = {};
    state.disciplinePowers[discKey][dotLevel] = powerId;
    renderDisciplines();
}

function renderAttributes() {
    const grid = document.getElementById('attributes-grid');
    grid.innerHTML = '';
    const categories = [
        { key: 'physical', label: 'Фізичні' },
        { key: 'social', label: 'Соціальні' },
        { key: 'mental', label: 'Ментальні' }
    ];
    categories.forEach(cat => {
        let colHTML = `<div><h3 class="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-wider">${cat.label}</h3><div class="space-y-5">`;
        (attributesData[cat.key] || []).forEach(attr => {
            colHTML += `
                <div class="flex flex-col">
                    <div class="flex justify-between items-center">
                        <span class="font-serif text-lg font-bold text-gray-800">${attr.name}</span>
                        ${createDotsHTML('attribute', attr.id, state.attributes[attr.id], 5, 0)}
                    </div>
                    ${attr.desc ? `
                    <p class="text-[11px] text-gray-500 leading-snug mt-1.5 pr-2 text-justify">
                        ${attr.desc}
                    </p>
                    ` : ''}
                </div>
            `;
        });
        colHTML += `</div></div>`;
        grid.innerHTML += colHTML;
    });
}

function renderSkills() {
    const grid = document.getElementById('skills-grid');
    grid.innerHTML = '';
    const categories = [
        { key: 'physical', label: 'Фізичні' },
        { key: 'social', label: 'Соціальні' },
        { key: 'mental', label: 'Ментальні' }
    ];
    categories.forEach(cat => {
        let colHTML = `<div><h3 class="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-wider">${cat.label}</h3><div class="space-y-3">`;
        (skillsData[cat.key] || []).forEach(skill => {
            let bonus = (state.predatorChoices.skill === skill.id) ? 1 : 0;
            
            colHTML += `
                <div class="flex justify-between items-center group">
                    <span class="font-serif text-base text-gray-700 group-hover:text-[#8b0000] transition-colors">${skill.name}</span>
                    ${createDotsHTML('skill', skill.id, state.skills[skill.id], 5, bonus)}
                </div>
            `;
        });
        colHTML += `</div></div>`;
        grid.innerHTML += colHTML;
    });
}

function parseDotOptions(costStr) {
    const str = String(costStr).trim();
    
    if (str.includes(',') || str.includes('/')) {
        return str.split(/[,/]/).map(part => part.replace(/[^•]/g, '').length).filter(n => n > 0);
    }
    
    if (str.includes('-')) {
        const parts = str.split('-');
        let min = parts[0].replace(/[^•]/g, '').length;
        let max = parts[parts.length - 1].replace(/[^•]/g, '').length;
        let res = [];
        for(let i = min; i <= max; i++) res.push(i);
        return res;
    } 
    
    if (str.includes('+')) {
        let min = str.replace(/[^•]/g, '').length;
        let res = [];
        for(let i = min; i <= 5; i++) res.push(i); 
        return res;
    }
    
    let count = str.replace(/[^•]/g, '').length;
    return [count > 0 ? count : 1];
}

function populateAdvantageCategories() {
    const select = document.getElementById('adv-category-filter');
    if (!select || !state.advantagesData) return;
    
    // Дістаємо всі унікальні категорії і сортуємо за алфавітом
    const categories = [...new Set(state.advantagesData.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    
    let html = '<option value="all">Всі категорії</option>';
    categories.forEach(cat => {
        html += `<option value="${cat}">${cat}</option>`;
    });
    select.innerHTML = html;
}

function renderAvailableAdvantages() {
    const container = document.getElementById('available-advantages');
    if (state.advantagesData.length === 0) return;

    const searchQuery = document.getElementById('adv-search').value.toLowerCase();
    const filterType = document.getElementById('adv-type-filter').value;
    const filterCat = document.getElementById('adv-category-filter')?.value || 'all';
    const filterDots = document.getElementById('adv-dots-filter')?.value || 'all';

    const filtered = state.advantagesData.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery) || item.desc.toLowerCase().includes(searchQuery);
        const matchesType = filterType === 'all' || item.type === filterType;
        const matchesCat = filterCat === 'all' || item.category === filterCat;
        
        let matchesDots = true;
        if (filterDots !== 'all') {
            const options = parseDotOptions(item.cost);
            matchesDots = options.includes(parseInt(filterDots));
        }

        return matchesSearch && matchesType && matchesCat && matchesDots;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-gray-400 text-center py-4">Нічого не знайдено...</div>`;
        return;
    }

    let html = '';
    filtered.forEach(item => {
        let badgeClass = 'bg-gray-100 text-gray-700';
        let titleColor = 'text-gray-800';
        let typeLabel = 'Благо';
        if (item.type === 'merit') { badgeClass = 'bg-red-100 text-red-800'; titleColor = 'text-red-800'; typeLabel = 'Чеснота'; } 
        else if (item.type === 'flaw') { badgeClass = 'bg-gray-800 text-white'; titleColor = 'text-gray-900'; typeLabel = 'Вада'; } 
        else if (item.type === 'background') { badgeClass = 'bg-blue-100 text-blue-800'; titleColor = 'text-blue-800'; typeLabel = 'Надбання'; }

        const options = parseDotOptions(item.cost);
        let actionButtons = '';
        options.forEach(cost => {
            const isAlreadySelected = state.selectedAdvantages.some(s => s.id === item.id && s.cost === cost);
            actionButtons += `
                <button onclick="addAdvantage(${item.id}, ${cost})" 
                    class="px-2 py-1 text-xs font-bold rounded border transition-colors 
                    ${isAlreadySelected ? 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-300 hover:bg-gray-100'}">
                    + ${cost} ⬤
                </button>
            `;
        });

        html += `
            <div class="border-b border-gray-100 pb-4 last:border-0">
                <div class="flex justify-between items-start mb-1 gap-2">
                    <div>
                        <span class="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeClass}">${typeLabel} | ${item.category}</span>
                        <h4 class="font-serif font-bold text-base ${titleColor} mt-1">${item.name}</h4>
                    </div>
                    <div class="flex flex-wrap gap-1 justify-end min-w-max">
                        ${actionButtons}
                    </div>
                </div>
                <p class="text-xs text-gray-600 leading-snug">${item.desc}</p>
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderSelectedAdvantages() {
    const container = document.getElementById('selected-advantages');
    if (state.selectedAdvantages.length === 0) {
        container.innerHTML = `<div class="text-gray-400 text-center py-10">Ви ще не обрали жодного блага чи вади.</div>`;
        return;
    }

    let html = '';
    state.selectedAdvantages.forEach((sel, index) => {
        let badgeClass = sel.type === 'flaw' ? 'bg-gray-800 text-white' : 'bg-red-100 text-red-800';
        
        html += `
            <div class="bg-white border border-gray-200 p-3 rounded-lg shadow-sm flex justify-between items-center animate-[fadeIn_0.3s_ease-in-out]">
                <div>
                    <span class="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeClass}">
                        ${sel.type === 'flaw' ? 'Вада' : 'Благо'}
                    </span>
                    <h4 class="font-serif font-bold text-sm text-gray-800 mt-1">${sel.name}</h4>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-bold text-sm text-gray-700">${sel.cost} ⬤</span>
                    <button onclick="removeAdvantage(${index})" class="text-red-500 hover:text-red-700 p-1 font-bold text-lg leading-none">&times;</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function addAdvantage(id, cost) {
    const item = state.advantagesData.find(i => i.id === id);
    if (!item) return;
    if (state.selectedAdvantages.some(s => s.id === id && s.cost === cost)) return;

    state.selectedAdvantages.push({ id: item.id, name: item.name, type: item.type, cost: cost });
    renderAvailableAdvantages(); 
    renderSelectedAdvantages();
    updateTrackers();
}

function removeAdvantage(index) {
    state.selectedAdvantages.splice(index, 1);
    renderAvailableAdvantages();
    renderSelectedAdvantages();
    updateTrackers();
}

function populateClanSelects() {
    let optionsHTML = '';
    for (const [key, data] of Object.entries(clansData)) {
        optionsHTML += `<option value="${key}">${data.name}</option>`;
    }
    document.getElementById('clan-select-1').innerHTML = optionsHTML;
    document.getElementById('clan-select-4').innerHTML = optionsHTML;
}

function changeClan(clanId) {
    state.clan = clanId;
    document.getElementById('clan-select-1').value = clanId;
    document.getElementById('clan-select-4').value = clanId;
    
    const clanInfo = clansData[clanId] || {};
    document.getElementById('clan-desc-1').innerText = clanInfo.desc || '';
    
    const compulsionContainer = document.getElementById('clan-compulsion-container');
    const compulsionText = document.getElementById('clan-compulsion-text');
    if (compulsionContainer && compulsionText) {
        if (clanInfo.clan_compultion && clanInfo.clan_compultion.trim().toLowerCase() !== "відсутнє") {
            compulsionText.innerText = clanInfo.clan_compultion;
            compulsionContainer.classList.remove('hidden');
        } else {
            compulsionContainer.classList.add('hidden');
        }
    }

    const baneContainer = document.getElementById('clan-bane-container');
    const baneText = document.getElementById('clan-bane-text');
    if (baneContainer && baneText) {
        if (clanInfo.clan_bane && clanInfo.clan_bane.trim().toLowerCase() !== "відсутнє") {
            baneText.innerText = clanInfo.clan_bane;
            baneContainer.classList.remove('hidden');
        } else {
            baneContainer.classList.add('hidden');
        }
    }
    
    Object.keys(state.disciplines).forEach(k => state.disciplines[k] = 0);
    state.disciplinePowers = {}; 
    state.manualDisciplines = []; // Скидаємо вручну додані дисципліни при зміні клану

    renderDisciplines();
    updateTrackers();
    updateHeaderInfo();
}

function updateHeaderInfo() {
    const nameInput = document.getElementById('character-name').value;
    const displayName = nameInput.trim() !== '' ? nameInput : 'Безіменний';
    const clanName = clansData[state.clan]?.name || 'Невідомо';
    
    const headerName = document.getElementById('header-char-name');
    const headerClan = document.getElementById('header-char-clan');
    
    if (headerName) headerName.innerText = displayName;
    if (headerClan) headerClan.innerText = clanName;
}

function populateCustomSpecDropdown() {
    const select = document.getElementById('spec-custom-skill');
    select.innerHTML = '<option value="">-- Оберіть навичку --</option>';
    let allSkills = [];
    Object.values(skillsData).forEach(arr => { allSkills = allSkills.concat(arr); });
    allSkills.sort((a, b) => a.name.localeCompare(b.name));
    allSkills.forEach(skill => {
        select.innerHTML += `<option value="${skill.id}">${skill.name}</option>`;
    });
}

function goToStep(step) {
    if (step === 7) {
        finishGen();
    }
    document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');

    [1, 2, 3, 4, 5, 6, 7].forEach(i => {
        const btn = document.getElementById(`nav-step-${i}`);
        if(btn) {
            if (i === step) {
                btn.classList.add('bg-[#8b0000]', 'text-white');
                btn.classList.remove('text-gray-500', 'hover:bg-gray-100');
            } else {
                btn.classList.remove('bg-[#8b0000]', 'text-white');
                btn.classList.add('text-gray-500', 'hover:bg-gray-100');
            }
        }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateTrackers() {
    const discCounts = { 2: 0, 1: 0 };
    Object.values(state.disciplines).forEach(val => {
        if (val === 2) discCounts[2]++;
        else if (val === 1) discCounts[1]++;
        else if (val > 2) discCounts[2]++;
    });
    const discTracker = document.getElementById('disc-tracker');
    discTracker.innerHTML = [2, 1].map(val => {
        const current = discCounts[val];
        const target = 1;
        let badgeClass = current === target ? 'valid' : (current > target ? 'exceeded' : 'invalid');
        return `<div class="px-3 py-1 rounded border tracker-badge ${badgeClass}">
            ${val} ⬤ : ${current} / ${target}
        </div>`;
    }).join('');

    const attrCounts = { 4: 0, 3: 0, 2: 0, 1: 0 };
    Object.values(state.attributes).forEach(val => {
        if (val >= 1 && val <= 4) attrCounts[val]++;
    });
    const attrTracker = document.getElementById('attr-tracker');
    attrTracker.innerHTML = [4, 3, 2].map(val => {
        const current = attrCounts[val];
        const target = attrTarget[val];
        let badgeClass = current === target ? 'valid' : (current > target ? 'exceeded' : 'invalid');
        return `<div class="px-3 py-1 rounded border tracker-badge ${badgeClass}">
            ${val} ⬤ : ${current} / ${target}
        </div>`;
    }).join('');

    const skillCounts = { 4: 0, 3: 0, 2: 0, 1: 0 };
    Object.values(state.skills).forEach(val => {
        if (val >= 1 && val <= 4) skillCounts[val]++;
    });
    const target = skillTargets[state.distribution];
    const skillTracker = document.getElementById('skill-tracker');
    let skillHtml = '';
    [4, 3, 2, 1].forEach(val => {
        const targetVal = target[val] || 0;
        const current = skillCounts[val];
        if (targetVal > 0 || current > 0) {
            let badgeClass = current === targetVal ? 'valid' : (current > targetVal ? 'exceeded' : 'invalid');
            skillHtml += `<div class="px-3 py-1 rounded border tracker-badge ${badgeClass}">
                ${val} ⬤ : ${current} / ${targetVal}
            </div>`;
        }
    });
    skillTracker.innerHTML = skillHtml;

    let totalMeritsDots = 0;
    let totalFlawsDots = 0;
    state.selectedAdvantages.forEach(adv => {
        if (adv.type === 'flaw') totalFlawsDots += adv.cost;
        else totalMeritsDots += adv.cost; 
    });
    const meritsEl = document.getElementById('merits-tracker');
    const flawsEl = document.getElementById('flaws-tracker');

    meritsEl.innerText = `${totalMeritsDots} / 7 ⬤`;
    flawsEl.innerText = `${totalFlawsDots} / 2 ⬤`;
    
    meritsEl.className = `px-3 py-1 text-sm font-bold rounded border tracker-badge ${totalMeritsDots === 7 ? 'valid' : (totalMeritsDots > 7 ? 'exceeded' : 'invalid')}`;
    flawsEl.className = `px-3 py-1 text-sm font-bold rounded border tracker-badge ${totalFlawsDots === 2 ? 'valid' : (totalFlawsDots > 2 ? 'exceeded' : 'invalid')}`;
}

function changeSkillDistribution() {
    state.distribution = document.getElementById('skill-distribution').value;
    updateTrackers();
}

function finishGen() {
    const name = document.getElementById('character-name').value || 'Безіменний Кревний';
    const concept = document.getElementById('concept-phrase').value || 'Невідомий концепт';
    const backgroundText = document.getElementById('concept-bg').value || 'Історія персонажа відсутня.';
    const clanInfo = clansData[state.clan] || {};
    const clanName = clanInfo.name || 'Невідомо';
    const clanCompulsion = clanInfo.clan_compultion && clanInfo.clan_compultion.trim().toLowerCase() !== "відсутнє" ? clanInfo.clan_compultion : 'Немає';
    const clanBane = clanInfo.clan_bane && clanInfo.clan_bane.trim().toLowerCase() !== "відсутнє" ? clanInfo.clan_bane : 'Немає';
    
    const predator = state.selectedPredator ? state.predatorData.find(p => p.id === state.selectedPredator) : null;
    const predatorName = predator ? predator.name : 'Не обрано';
    const predatorDesc = predator ? predator.description : '';
    
    let currentHumanity = 7;
    if (predator && predator.humanity_modifier) currentHumanity += predator.humanity_modifier;

    document.getElementById('summary-name').innerText = name;
    document.getElementById('summary-concept').innerText = `${concept} | ${clanName} | ${predatorName}`;
    document.getElementById('summary-humanity').innerText = currentHumanity;

    let summaryHTML = '';
    const cats = [{ key: 'physical', label: 'Фізичні' }, { key: 'social', label: 'Соціальні' }, { key: 'mental', label: 'Ментальні' }];

    // СЕКЦІЯ 1: КОНЦЕПТ ТА КЛАН (Вкладка 1)
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">1. Концепт та Кров</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                    <p class="mb-2"><strong class="text-gray-700 uppercase text-xs tracking-wider block">Концепт:</strong> <span class="text-gray-900 font-serif text-base">${concept}</span></p>
                    <p class="mb-2"><strong class="text-gray-700 uppercase text-xs tracking-wider block">Клан:</strong> <span class="text-gray-900 font-serif text-base">${clanName}</span></p>
                    <p class="mb-2"><strong class="text-gray-700 uppercase text-xs tracking-wider block">Історія / Фон:</strong> <span class="text-gray-700 font-serif italic block mt-1">${backgroundText}</span></p>
                </div>
                <div class="space-y-3 bg-white p-4 rounded border border-gray-100 print:border-gray-200">
                    <div><strong class="text-[#8b0000] uppercase text-[10px] tracking-widest block">Клановий примус:</strong> <p class="text-xs text-gray-800 leading-snug">${clanCompulsion}</p></div>
                    <div><strong class="text-red-700 uppercase text-[10px] tracking-widest block">Кланове прокляття:</strong> <p class="text-xs text-gray-800 leading-snug">${clanBane}</p></div>
                </div>
            </div>
        </div>
    `;

    // СЕКЦІЯ 2: ХАРАКТЕРИСТИКИ (Вкладка 2)
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">2. Характеристики</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    `;
    cats.forEach(cat => {
        summaryHTML += `<div><h4 class="font-bold text-xs text-gray-400 uppercase mb-3">${cat.label}</h4><div class="space-y-2">`;
        (attributesData[cat.key] || []).forEach(attr => {
            summaryHTML += `<div class="flex justify-between items-center text-sm border-b border-gray-100 pb-1"><span class="font-serif font-bold text-gray-800">${attr.name}</span> <span>${createSummaryDots(state.attributes[attr.id])}</span></div>`;
        });
        summaryHTML += `</div></div>`;
    });
    summaryHTML += `</div></div>`;

    // СЕКЦІЯ 3: НАВИЧКИ ТА СПЕЦІАЛІЗАЦІЇ (Вкладка 3)
    let specAcademics = document.getElementById('spec-academics')?.value || '';
    let specCraft = document.getElementById('spec-craft')?.value || '';
    let specPerformance = document.getElementById('spec-performance')?.value || '';
    let specScience = document.getElementById('spec-science')?.value || '';
    let customSpecName = document.getElementById('spec-custom-name')?.value || '';
    let customSpecSkill = document.getElementById('spec-custom-skill')?.value || '';

    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">3. Навички та Спеціалізації</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    `;
    cats.forEach(cat => {
        summaryHTML += `<div><h4 class="font-bold text-xs text-gray-400 uppercase mb-3">${cat.label}</h4><div class="space-y-2">`;
        (skillsData[cat.key] || []).forEach(skill => {
            let totalDots = state.skills[skill.id] + (state.predatorChoices.skill === skill.id ? 1 : 0);
            if (totalDots > 0) {
                let specText = (state.predatorChoices.skill === skill.id && state.predatorChoices.specName) ? ` <span class="text-[10px] text-gray-500 font-normal">(${state.predatorChoices.specName})</span>` : '';
                summaryHTML += `<div class="flex justify-between items-center text-sm border-b border-gray-100 pb-1"><span class="font-serif font-bold text-gray-800">${skill.name}${specText}</span> <span>${createSummaryDots(totalDots)}</span></div>`;
            }
        });
        summaryHTML += `</div></div>`;
    });
    summaryHTML += `</div>`;

    // Виведення спеціалізацій
    summaryHTML += `
        <div class="border-t border-gray-200 pt-4 text-xs text-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
            ${specAcademics ? `<div><strong>Знання:</strong> ${specAcademics}</div>` : ''}
            ${specCraft ? `<div><strong>Ремесло:</strong> ${specCraft}</div>` : ''}
            ${specPerformance ? `<div><strong>Виступ:</strong> ${specPerformance}</div>` : ''}
            ${specScience ? `<div><strong>Наука:</strong> ${specScience}</div>` : ''}
            ${customSpecName ? `<div class="col-span-full"><strong>Додаткова спец. (${customSpecSkill}):</strong> ${customSpecName}</div>` : ''}
            ${state.predatorChoices.specName ? `<div class="col-span-full text-indigo-800"><strong>Спеціалізація хижака:</strong> ${state.predatorChoices.specName}</div>` : ''}
        </div>
    </div>`;

    // СЕКЦІЯ 4: ХИЖАЦЬКІ ЗВИЧКИ (Вкладка 4)
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">4. Хижацькі звички</h3>
            <div class="text-sm space-y-2">
                <p><strong>Обраний тип хижака:</strong> <span class="font-serif font-bold text-lg text-[#8b0000]">${predatorName}</span></p>
                ${predatorDesc ? `<p class="text-gray-600 text-xs italic">${predatorDesc}</p>` : ''}
                ${predator && predator.advantages_text ? `<p class="mt-2 text-xs bg-indigo-50 p-2.5 rounded border border-indigo-100 text-indigo-900"><strong>Бонуси хижака:</strong> ${predator.advantages_text}</p>` : ''}
            </div>
        </div>
    `;

    // СЕКЦІЯ 5: ДИСЦИПЛІНИ ТА ЗДІБНОСТІ (Вкладка 5)
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">5. Дисципліни та Здібності</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    `;
    
    let availableDisc = [...(clansData[state.clan]?.disciplines || [])];
    if (state.predatorChoices.discipline && !availableDisc.includes(state.predatorChoices.discipline)) {
        availableDisc.push(state.predatorChoices.discipline);
    }
    if (state.manualDisciplines) {
        state.manualDisciplines.forEach(d => {
            if (!availableDisc.includes(d)) availableDisc.push(d);
        });
    }

    let hasDisciplines = false;
    availableDisc.forEach(discKey => {
        let totalDots = (state.disciplines[discKey] || 0) + (state.predatorChoices.discipline === discKey ? 1 : 0);
        if (totalDots > 0) {
            hasDisciplines = true;
            const discInfo = getDisciplineInfo(discKey);
            const discName = discInfo.name || discKey;
            
            summaryHTML += `
                <div class="bg-white p-4 rounded-lg border border-gray-200 print:border-gray-300 print:bg-transparent shadow-sm">
                    <div class="flex justify-between items-center mb-3">
                        <span class="font-serif font-bold text-lg text-[#8b0000] uppercase tracking-wider">${discName}</span> 
                        <span>${createSummaryDots(totalDots)}</span>
                    </div>
                    <ul class="space-y-2">
            `;

            for (let i = 1; i <= totalDots; i++) {
                let powerId = state.disciplinePowers[discKey]?.[i];
                if (powerId) {
                    let powerInfo = disciplinesPowersMap[discKey]?.find(p => p.id === powerId);
                    if (powerInfo) {
                        summaryHTML += `
                            <li class="text-sm border-t border-gray-100 pt-2 print:border-gray-200">
                                <div class="font-bold text-gray-800 mb-1">Рівень ${i}: ${powerInfo.name}</div>
                                <p class="text-xs text-gray-600 leading-snug text-justify mb-2">${powerInfo.desc}</p>
                                <div class="text-[11px] text-gray-500 space-y-0.5">
                                    ${(powerInfo.requirement && String(powerInfo.requirement).trim().toLowerCase() !== 'немає' && String(powerInfo.requirement).trim() !== '') ? `<p><span class="font-bold text-gray-700">Вимога:</span> ${powerInfo.requirement}</p>` : ''}
                                    ${(powerInfo.rouseCost && String(powerInfo.rouseCost).trim().toLowerCase() !== 'немає' && String(powerInfo.rouseCost).trim() !== '') ? `<p><span class="font-bold text-gray-700">Збурення:</span> ${powerInfo.rouseCost}</p>` : ''}
                                    ${(powerInfo.dicePool && String(powerInfo.dicePool).trim().toLowerCase() !== 'немає' && String(powerInfo.dicePool).trim() !== '') ? `<p><span class="font-bold text-gray-700">Пул:</span> ${powerInfo.dicePool}</p>` : ''}
                                </div>
                            </li>
                        `;
                    }
                }
            }
            summaryHTML += `</ul></div>`;
        }
    });

    if (!hasDisciplines) {
        summaryHTML += `<p class="text-sm text-gray-500 italic col-span-full">Персонаж ще не опанував жодних дисциплін.</p>`;
    }
    summaryHTML += `</div></div>`;

    // СЕКЦІЯ 6: БЛАГА ТА ВАДИ (Вкладка 6)
    summaryHTML += `
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300">
            <h3 class="text-xl font-bold text-[#8b0000] border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-widest vtm-font">6. Блага та Вади</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    `;
    
    if (state.selectedAdvantages.length === 0) {
        summaryHTML += `<p class="text-sm text-gray-500 italic col-span-full">Переваги чи недоліки відсутні.</p>`;
    } else {
        state.selectedAdvantages.forEach(adv => {
            let badgeClass = adv.type === 'flaw' ? 'bg-gray-800 text-white' : 'bg-red-100 text-red-800';
            let label = adv.type === 'flaw' ? 'Вада' : 'Благо';
            summaryHTML += `
                <div class="flex justify-between items-center bg-white p-3 rounded border border-gray-200 print:border-gray-300 print:bg-transparent">
                    <div>
                        <span class="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeClass} print:border print:border-gray-300 print:bg-transparent print:text-black">${label}</span>
                        <span class="font-serif font-bold text-gray-800 ml-2">${adv.name}</span>
                    </div>
                    <span class="font-bold text-sm text-gray-700">${adv.cost} ⬤</span>
                </div>
            `;
        });
    }
    summaryHTML += `</div></div>`;

    document.getElementById('summary-content').innerHTML = summaryHTML;
}

function createSummaryDots(count, max = 5) {
    let html = '<div class="flex gap-1">';
    for (let i = 1; i <= max; i++) {
        html += `<div class="w-2.5 h-2.5 rounded-full border border-[#1a1a1a] ${i <= count ? 'bg-[#8b0000] border-[#8b0000]' : 'bg-transparent'}"></div>`;
    }
    html += '</div>';
    return html;
}

window.addEventListener('DOMContentLoaded', init);
