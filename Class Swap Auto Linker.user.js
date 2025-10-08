// ==UserScript==
// @name         Class Swap Auto Linker
// @namespace    http://tampermonkey.net/
// @version      1.9.8
// @description  For Spanish courses: prompt first section match, then fully link first (Link → Select → Save), then link remaining by section number / Module‑Exam. Non‑Spanish uses fuzzy matching.
// @match        https://otsystems.net/admin/students/dashboard/classes/swap/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ✅ Aesthetic replacement for `confirm()`
    function showCustomConfirm(fromName, toName) {
        const cleanForDisplay = (title) => {
            let t = title.replace(/\(\d{3,}-[A-Z]{3}-\d+\)/gi, '');
            t = t.replace(/completed on.*$/i, '');
            t = t.replace(/\b0+(\d+)\b/g, '$1');
            return t.trim();
        };
        fromName = cleanForDisplay(fromName);
        toName = cleanForDisplay(toName);

        return new Promise((resolve) => {
            const existing = document.getElementById('customConfirmModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'customConfirmModal';
            modal.style = `
                position: fixed;
                top: 0; left: 0;
                width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
            `;

            const box = document.createElement('div');
            box.style = `
                background: white;
                padding: 20px 30px 80px 30px; /* extra bottom padding */
                border-radius: 8px;
                max-width: 600px;
                width: 100%;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                font-family: Arial, sans-serif;
                position: relative; /* needed for absolute positioning */
            `;

            box.innerHTML = `
                <h2 style="margin-top: 0; font-size: 20px; font-weight: bold; text-align: center;">Do these sections match?</h2>
                <div style="margin-bottom: 12px;">
                    <strong>From Outline:</strong><br><span style="color: #333;">${fromName}</span>
                </div>
                <div style="margin-bottom: 20px;">
                    <strong>To Outline:</strong><br><span style="color: #333;">${toName}</span>
                </div>
                <div style="font-style: italic; font-size: 14px; color: #333; text-align: left;">
                         Note: Click "Link" if these sections match. Click "Ignore" if they don't.
                </div>
                <div style="position: absolute; bottom: 20px; right: 30px;">
                    <button id="cancelBtn" style="background: #d9534f; color: white; padding: 6px 12px; border: none; border-radius: 4px; margin-right: 8px;">Ignore</button>
                    <button id="okBtn" style="background: #28a745; color: white; padding: 6px 12px; border: none; border-radius: 4px;">Link</button>
                </div>
            `;

            // ✅ Add hover styles
            const hoverStyle = document.createElement('style');
            hoverStyle.textContent = `
                #okBtn:hover {
                    background-color: #218838 !important;
                    box-shadow: 0 0 5px #218838;
                     cursor: pointer;
                }
                #cancelBtn:hover {
                    background-color: #c9302c !important;
                    box-shadow: 0 0 5px #c9302c;
                    cursor: pointer;
                }
                #okBtn, #cancelBtn {
                    transition: background-color 0.2s ease-in-out;
                    cursor: pointer;
                }
            `;
            box.appendChild(hoverStyle);

            modal.appendChild(box);
            document.body.appendChild(modal);

            document.getElementById('okBtn').onclick = () => {
                modal.remove();
                resolve(true);
            };
            document.getElementById('cancelBtn').onclick = () => {
                modal.remove();
                resolve(false);
            };
        });
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function cleanTitle(title) {
        let t = title.replace(/\(\d{3,}-[A-Z]{3}-\d+\)/gi, '');
        t = t.replace(/completed on.*$/i, '');
        t = t.replace(/\b0+(\d+)\b/g, '$1');
        return t.trim().toLowerCase();
    }

    function cleanTitleForLog(title) {
        let t = title.replace(/\(\d{3,}-[A-Z]{3}-\d+\)/gi, '');
        t = t.replace(/completed on.*$/i, '');
        t = t.replace(/\b0+(\d+)\b/g, '$1');
        return t.trim();
    }

    function bigrams(str) {
        const s = str.toLowerCase();
        const v = [];
        for (let i = 0; i < s.length - 1; i++) v.push(s.slice(i, i + 2));
        return v;
    }

    function diceCoefficient(str1, str2) {
        const big1 = bigrams(str1);
        const big2 = bigrams(str2);
        if (big1.length === 0 || big2.length === 0) return 0;
        let intersection = 0;
        const map = {};
        for (const bg of big1) map[bg] = (map[bg] || 0) + 1;
        for (const bg of big2) {
            if (map[bg]) {
                intersection++;
                map[bg]--;
            }
        }
        return (2.0 * intersection) / (big1.length + big2.length);
    }

    const SIMILARITY_THRESHOLD = 0.85;

    function isSpanishCourse() {
        const fromCourseElem = document.querySelector('td strong.ng-binding');
        const toCourseElem = document.querySelector('td div strong.ng-binding');
        const fromText = fromCourseElem ? fromCourseElem.textContent.toLowerCase() : '';
        const toText = toCourseElem ? toCourseElem.textContent.toLowerCase() : '';
        return fromText.includes('spanish') || toText.includes('spanish');
    }

    function getSectionNumber(title) {
        const match = title.match(/secci[oó]n\s*(\d+)/i) || title.match(/section\s*(\d+)/i);
        return match ? match[1] : null;
    }

    async function autoLinkHandler() {
        const proceed = confirm(
            '⚠️ WARNING ⚠️\n\n' +
            'Only proceed if you know how to use this tool, especially when swapping two courses in different languages.\n\n'+
            'Click OK to proceed or Cancel to stop.'
        );
        if (!proceed) return;

        btn.disabled = true;
        btn.textContent = 'Auto‑Linking...';
        console.clear();

        try {
            const fromSections = Array.from(document.querySelectorAll('div[ng-repeat="hea in sc.FromOutline"]'));
            let completedSections = [];

            fromSections.forEach(fromSection => {
                const children = fromSection.querySelectorAll('li[ng-repeat="child in hea.Children"]');
                children.forEach(child => {
                    const completedSpan = child.querySelector('span.ng-scope small.ng-binding i.fa-check');
                    if (!completedSpan) return;
                    const linkBtn = child.querySelector('button[ng-click="sc.LinkOpen(child)"]');
                    if (!linkBtn || linkBtn.disabled) return;
                    const rawTitleElem = child.querySelector('div.col-md-6.ng-binding');
                    if (!rawTitleElem) return;
                    completedSections.push({
                        child: child,
                        linkBtn: linkBtn,
                        rawTitle: rawTitleElem.textContent.trim()
                    });
                });
            });

            if (completedSections.length === 0) {
                alert('No completed sections available to link.');
                return;
            }

            const hasSpanish = isSpanishCourse();

            if (hasSpanish) {
                const firstSec = completedSections[0];
                const fromName = firstSec.rawTitle;

                firstSec.linkBtn.click();
                await delay(150);

                let modal = null;
                for (let i = 0; i < 30; i++) {
                    modal = document.querySelector('div.modal.fade.ng-isolate-scope.sizeModal60.in');
                    if (modal) break;
                    await delay(50);
                }
                if (!modal) {
                    alert('Could not open first section modal after clicking Link.');
                    return;
                }

                const toRows = Array.from(modal.querySelectorAll('tr[ng-repeat^="child in hea.Children"]'));
                let firstToName = 'Unknown';
                if (toRows.length > 0) {
                    const firstToTitleElem = toRows[0].querySelector('td small.ng-binding');
                    if (firstToTitleElem) firstToName = firstToTitleElem.textContent.trim();
                }

                const cancelBtnModal = modal.querySelector('button.btn-default[ng-click="mml.Cancel()"]');
                if (cancelBtnModal) {
                    cancelBtnModal.click();
                    await delay(100);
                }

                const userConfirmed = await showCustomConfirm(fromName, firstToName);

                if (userConfirmed) {
                    firstSec.linkBtn.click();
                    await delay(100);

                    modal = null;
                    for (let i = 0; i < 60; i++) {
                        modal = document.querySelector('div.modal.fade.ng-isolate-scope.sizeModal60.in');
                        if (modal) break;
                        await delay(15);
                    }
                    if (modal && toRows.length > 0) {
                        const firstRow = modal.querySelector('tr[ng-repeat^="child in hea.Children"]');
                        if (firstRow) {
                            const selectBtn = firstRow.querySelector('button[ng-click^="mml.SelectEntry"]');
                            if (selectBtn && !selectBtn.disabled) {
                                selectBtn.click();
                                await delay(50);
                                const finalLinkBtn = modal.querySelector('button.btn-primary[ng-click="mml.Save()"]');
                                if (finalLinkBtn && !finalLinkBtn.disabled) {
                                    finalLinkBtn.click();
                                    await delay(100);
                                    console.log(`Fully linked first section: "${cleanTitleForLog(fromName)}"`);
                                }
                            }
                        }
                    }
                } else {
                    const ignoreBtn = firstSec.child.querySelector('button.btn-danger[ng-click="sc.IgnoreLink(child)"]');
                    if (ignoreBtn && !ignoreBtn.disabled) {
                        ignoreBtn.click();
                        console.log(`Ignored first section: "${cleanTitleForLog(fromName)}"`);
                        await delay(50);
                    }
                }

                for (let i = 1; i < completedSections.length; i++) {
                    const sec = completedSections[i];
                    if (!sec.linkBtn || sec.linkBtn.disabled) continue;

                    sec.linkBtn.click();
                    await delay(100);

                    let modal2 = null;
                    for (let j = 0; j < 60; j++) {
                        modal2 = document.querySelector('div.modal.fade.ng-isolate-scope.sizeModal60.in');
                        if (modal2) break;
                        await delay(40);
                    }
                    if (!modal2) continue;

                    const toRows2 = Array.from(modal2.querySelectorAll('tr[ng-repeat^="child in hea.Children"]'));
                    let matchedRow = null;
                    const fromNum = getSectionNumber(sec.rawTitle);

                    for (const row of toRows2) {
                        const toElem = row.querySelector('td small.ng-binding');
                        if (!toElem) continue;
                        const toTxt = toElem.textContent.trim();
                        const toNum = getSectionNumber(toTxt);

                        if (toNum && fromNum && toNum === fromNum) {
                            matchedRow = row;
                            break;
                        }

                        const lower = toTxt.toLowerCase();
                        const lowerFrom = sec.rawTitle.toLowerCase();
                        const moduleRegex = /module\s*(\d+)/i;
                        const examenRegex = /examen módulo\s*(\d+)/i;
                        const matchMod = lowerFrom.match(moduleRegex) || lowerFrom.match(examenRegex);
                        const matchToMod = lower.match(moduleRegex) || lower.match(examenRegex);
                        if (matchMod && matchToMod && matchMod[1] === matchToMod[1]) {
                            matchedRow = row;
                            break;
                        }
                    }

                    if (!matchedRow) {
                        const cancelBtn2 = modal2.querySelector('button.btn-default[ng-click="mml.Cancel()"]');
                        if (cancelBtn2) cancelBtn2.click();
                        await delay(40);
                        const ignoreBtn2 = sec.child.querySelector('button.btn-danger[ng-click="sc.IgnoreLink(child)"]');
                        if (ignoreBtn2 && !ignoreBtn2.disabled) {
                            ignoreBtn2.click();
                            console.log(`Ignored section (no match for): "${cleanTitleForLog(sec.rawTitle)}"`);
                        }
                        await delay(80);
                        continue;
                    }

                    const selectBtn2 = matchedRow.querySelector('button[ng-click^="mml.SelectEntry"]');
                    if (!selectBtn2 || selectBtn2.disabled) {
                        const cancelBtn2 = modal2.querySelector('button.btn-default[ng-click="mml.Cancel()"]');
                        if (cancelBtn2) cancelBtn2.click();
                        await delay(40);
                        const ignoreBtn2 = sec.child.querySelector('button.btn-danger[ng-click="sc.IgnoreLink(child)"]');
                        if (ignoreBtn2 && !ignoreBtn2.disabled) {
                            ignoreBtn2.click();
                            console.log(`Ignored section (select not available): "${cleanTitleForLog(sec.rawTitle)}"`);
                        }
                        await delay(80);
                        continue;
                    }

                    selectBtn2.click();
                    await delay(40);
                    const finalSave2 = modal2.querySelector('button.btn-primary[ng-click="mml.Save()"]');
                    if (finalSave2 && !finalSave2.disabled) {
                        finalSave2.click();
                        await delay(100);
                        console.log(`Linked section: "${cleanTitleForLog(sec.rawTitle)}"`);
                    }
                }

                alert('Auto‑linking complete.');
                return;
            }

            // NON‑SPANISH logic remains unchanged
            let nonSpanishIndices = completedSections.map((_, i) => i);

            for (const idx of nonSpanishIndices) {
                const sec = completedSections[idx];
                if (!sec.linkBtn || sec.linkBtn.disabled) continue;

                sec.linkBtn.click();
                await delay(150);

                let modal3 = null;
                for (let k = 0; k < 60; k++) {
                    modal3 = document.querySelector('div.modal.fade.ng-isolate-scope.sizeModal60.in');
                    if (modal3) break;
                    await delay(50);
                }
                if (!modal3) continue;

                const toRows3 = Array.from(modal3.querySelectorAll('tr[ng-repeat^="child in hea.Children"]'));
                let matchedRow3 = null;
                const fromClean = cleanTitle(sec.rawTitle);

                for (const row of toRows3) {
                    const toElem = row.querySelector('td small.ng-binding');
                    if (!toElem) continue;
                    const toTxt = toElem.textContent.trim();
                    const toClean = cleanTitle(toTxt);
                    const similarity = diceCoefficient(fromClean, toClean);
                    if (similarity >= SIMILARITY_THRESHOLD) {
                        matchedRow3 = row;
                        break;
                    }
                }

                if (!matchedRow3) {
                    const cancelBtn3 = modal3.querySelector('button.btn-default[ng-click="mml.Cancel()"]');
                    if (cancelBtn3) cancelBtn3.click();
                    await delay(50);
                    const ignoreBtn3 = sec.child.querySelector('button.btn-danger[ng-click="sc.IgnoreLink(child)"]');
                    if (ignoreBtn3 && !ignoreBtn3.disabled) {
                        ignoreBtn3.click();
                        console.log(`Ignored section (non‑spanish, no fuzzy match): "${sec.rawTitle}"`);
                    }
                    await delay(100);
                    continue;
                }

                const selectBtn3 = matchedRow3.querySelector('button[ng-click^="mml.SelectEntry"]');
                if (!selectBtn3 || selectBtn3.disabled) {
                    const cancelBtn3 = modal3.querySelector('button.btn-default[ng-click="mml.Cancel()"]');
                    if (cancelBtn3) cancelBtn3.click();
                    await delay(50);
                    const ignoreBtn3 = sec.child.querySelector('button.btn-danger[ng-click="sc.IgnoreLink(child)"]');
                    if (ignoreBtn3 && !ignoreBtn3.disabled) {
                        ignoreBtn3.click();
                        console.log(`Ignored section (non‑spanish, select not available): "${sec.rawTitle}"`);
                    }
                    await delay(100);
                    continue;
                }

                selectBtn3.click();
                await delay(40);
                const finalSave3 = modal3.querySelector('button.btn-primary[ng-click="mml.Save()"]');
                if (finalSave3 && !finalSave3.disabled) {
                    finalSave3.click();
                    await delay(150);
                    console.log(`Linked section: "${sec.rawTitle}"`);
                }
            }

            alert('Auto‑linking complete.');

        } catch (err) {
            console.error('Error in autoLinkHandler:', err);
            alert('An error occurred during auto‑linking. See console for details.');
        } finally {
            btn.disabled = true;
            btn.textContent = 'Start Auto‑Link';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-default');
            btn.style.backgroundColor = '#DDDDDD';
            btn.style.cursor = 'not-allowed';
            selectToClassClicked = false;
        }
    }

    const btn = document.createElement('button');
    btn.textContent = 'Start Auto‑Link';
    btn.className = 'btn btn-default';
    btn.style.marginLeft = '12px';
    btn.style.cursor = 'not-allowed';
    btn.disabled = true;
    btn.id = 'autoLinkBtn';

    let selectToClassClicked = false;

    const intervalId = setInterval(() => {
        const selectBtn = document.querySelector('button[ng-click="sc.ChangeToClass()"]');
        if (selectBtn && !document.querySelector('#autoLinkBtn')) {
            selectBtn.parentElement.appendChild(btn);
            clearInterval(intervalId);
        }
    }, 200);

    document.addEventListener('click', e => {
        if (e.target.matches('button[ng-click="sc.ChangeToClass()"]')) {
            selectToClassClicked = true;
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            btn.classList.remove('btn-default');
            btn.classList.add('btn-success');
            btn.style.backgroundColor = '#28a745';
        }
    });

    btn.addEventListener('click', autoLinkHandler);

})();