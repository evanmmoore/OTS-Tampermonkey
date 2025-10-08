// ==UserScript==
// @name         CS Entries & Popup
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Show filtered schedule with precise date mapping per employee, triggered by a button click, sorted & nicer UI with minimize toggle button, including notes
// @author       ChatGPT
// @match        https://otsystems.net/admin/utilities/schedule/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const employees = ['Tina T.', 'Chris W.', 'Evan M.', 'Pam I.', 'Elizabeth S.', 'Katlin T.'];

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        const mm = d.getMonth() + 1;
        const dd = d.getDate();
        const yy = d.getFullYear().toString().slice(-2);
        return `${mm}/${dd}/${yy}`;
    }

    function parseDateFromRange(dateRange) {
        let firstDatePart = dateRange.includes(' to ')
            ? dateRange.split(' to ')[0].trim()
            : dateRange.split('-')[0].trim();
        const parts = firstDatePart.split('/');
        if (parts.length !== 3) return new Date(0);
        let [mm, dd, yy] = parts;
        yy = yy.length === 2 ? '20' + yy : yy;
        return new Date(`${yy}-${mm}-${dd}`);
    }

    function getEventDetailsFromModal(alertDiv) {
        return new Promise((resolve) => {
            alertDiv.click();

            let attempts = 0;
            const maxAttempts = 50;
            const intervalId = setInterval(() => {
                attempts++;
                const modal = document.querySelector('.modal-content');
                if (modal) {
                    const dateP = Array.from(modal.querySelectorAll('p.ng-binding'))
                        .find(p => p.textContent.includes('Date(s):'));
                    const noteP = Array.from(modal.querySelectorAll('p.ng-binding'))
                        .find(p => p.textContent.trim().startsWith('Note:'));

                    if (dateP) {
                        const text = dateP.textContent.trim();
                        const match = text.match(/Date\(s\):\s*(.+)/i);
                        const dateText = match ? match[1].trim() : null;

                        let noteText = null;
                        if (noteP) {
                            noteText = noteP.textContent.replace('Note:', '').trim();
                        }

                        const closeBtn = modal.querySelector('button[ng-click="mecc.Close()"]');
                        if (closeBtn) closeBtn.click();

                        clearInterval(intervalId);
                        resolve({ dateRange: dateText, note: noteText });
                        return;
                    }
                }
                if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    resolve({ dateRange: null, note: null });
                }
            }, 100);
        });
    }

    async function parseSchedule() {
        const dateCells = document.querySelectorAll('.fc-content-skeleton thead td[data-date]');
        const skeletonDates = Array.from(dateCells).map(td => td.getAttribute('data-date'));

        const rows = document.querySelectorAll('.fc-content-skeleton tbody tr');

        const scheduleByEmployee = {};
        employees.forEach(emp => scheduleByEmployee[emp] = []);

        for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('td.fc-event-container'));
            let colIndex = 0;

            for (const cell of cells) {
                const colspan = parseInt(cell.getAttribute('colspan')) || 1;
                const alertDiv = cell.querySelector('div.alert');

                if (alertDiv) {
                    const txt = alertDiv.textContent.trim();
                    const parts = txt.split(':');
                    if (parts.length >= 2) {
                        const eventType = parts[0].trim();
                        const empPart = parts[1].trim();
                        const foundEmp = employees.find(e => empPart.includes(e));

                        if (foundEmp) {
                            let dateRange = null;
                            let note = null;

                            try {
                                const details = await getEventDetailsFromModal(alertDiv);
                                dateRange = details.dateRange;
                                note = details.note;
                            } catch {
                                dateRange = null;
                                note = null;
                            }

                            if (!dateRange) {
                                const startDate = skeletonDates[colIndex];
                                const endDate = skeletonDates[colIndex + colspan - 1] || startDate;
                                dateRange = (startDate === endDate)
                                    ? formatDate(startDate)
                                    : `${formatDate(startDate)} to ${formatDate(endDate)}`;
                            } else {
                                if (dateRange.includes('-')) {
                                    const parts = dateRange.split('-').map(p => p.trim());
                                    if (parts.length === 2) {
                                        dateRange = `${formatDate(parts[0])} to ${formatDate(parts[1])}`;
                                    }
                                } else if (dateRange.includes('to')) {
                                    const parts = dateRange.split('to').map(p => p.trim());
                                    if (parts.length === 2) {
                                        dateRange = `${formatDate(parts[0])} to ${formatDate(parts[1])}`;
                                    }
                                } else {
                                    dateRange = formatDate(dateRange);
                                }
                            }

                            scheduleByEmployee[foundEmp].push({ dateRange, eventType, note });
                        }
                    }
                }
                colIndex += colspan;
            }
        }

        for (const emp in scheduleByEmployee) {
            scheduleByEmployee[emp].sort((a, b) => parseDateFromRange(a.dateRange) - parseDateFromRange(b.dateRange));
        }

        return scheduleByEmployee;
    }

    function createPopup() {
        const existing = document.getElementById('schedule-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'schedule-popup';

        Object.assign(popup.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            maxHeight: '420px',
            overflowY: 'auto',
            backgroundColor: '#fefefe',
            border: '2px solid #FF5C00',
            borderRadius: '10px',
            boxShadow: '0 0 12px rgba(27, 96, 20, 0.7)',
            padding: '15px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: '14px',
            color: '#FF5C00',
            zIndex: 99999,
            userSelect: 'none'
        });

        const header = document.createElement('div');
        header.style.cursor = 'pointer';
        header.style.fontWeight = '700';
        header.style.marginBottom = '10px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        const toggleSymbol = document.createElement('span');
        toggleSymbol.textContent = '−';
        toggleSymbol.style.fontSize = '20px';
        toggleSymbol.style.fontWeight = '900';
        toggleSymbol.style.userSelect = 'none';
        toggleSymbol.style.marginRight = '8px';
        toggleSymbol.style.color = '#FF5C00';

        const headerText = document.createElement('span');
        headerText.textContent = 'CS Summary';
        headerText.style.flexGrow = '1';

        header.appendChild(headerText);
        header.appendChild(toggleSymbol);
        popup.appendChild(header);

        let minimized = false;

        header.addEventListener('click', () => {
            minimized = !minimized;
            if (minimized) {
                [...popup.children].forEach((c, i) => { if (i > 0) c.style.display = 'none'; });
                toggleSymbol.textContent = '+';
                popup.style.height = 'auto';
                popup.style.overflowY = 'visible';
            } else {
                [...popup.children].forEach(c => c.style.display = 'block');
                toggleSymbol.textContent = '−';
                popup.style.maxHeight = '420px';
                popup.style.overflowY = 'auto';
            }
        });

        return popup;
    }

    function showPopup(scheduleByEmployee) {
        if (!scheduleByEmployee) return;

        const popup = createPopup();

        for (const emp of employees) {
            const entries = scheduleByEmployee[emp];
            if (!entries || entries.length === 0) continue;

            const empHeader = document.createElement('h3');
            empHeader.textContent = emp;
            empHeader.style.marginBottom = '6px';
            empHeader.style.borderBottom = '2px solid #FF5C00';
            empHeader.style.paddingBottom = '4px';
            empHeader.style.color = '#FF5C00';
            empHeader.style.fontWeight = '600';
            empHeader.style.fontSize = '16px';
            popup.appendChild(empHeader);

            entries.forEach(entry => {
                const div = document.createElement('div');
                div.style.marginBottom = '8px';
                div.style.paddingLeft = '8px';
                div.style.borderLeft = '3px solid #40E0D0';
                div.style.color = '#000000';
                div.style.fontWeight = '500';
                div.textContent = `${entry.dateRange} - ${entry.eventType}`;
                popup.appendChild(div);

                if (entry.note) {
                    const noteDiv = document.createElement('div');
                    noteDiv.style.fontStyle = 'italic';
                    noteDiv.style.color = '#FF5C00';
                    noteDiv.style.paddingLeft = '24px';
                    noteDiv.style.marginTop = '-6px';
                    noteDiv.style.marginBottom = '6px';
                    noteDiv.textContent = `• ${entry.note}`;
                    popup.appendChild(noteDiv);
                }
            });
        }

        document.body.appendChild(popup);
    }

    // Create the fixed button
    function createShowButton() {
        const btn = document.createElement('button');
        btn.textContent = 'CS Entries';
        btn.id = 'show-schedule-btn';
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 99999,
            padding: '8px 14px',
            backgroundColor: '#FF5C00',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: '14px',
            boxShadow: '0 2px 6px rgba(27, 96, 20, 0.8)',
            userSelect: 'none',
        });

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = 'Loading...';

            const scheduleByEmployee = await parseSchedule();
            showPopup(scheduleByEmployee);

            btn.remove();
        });

        document.body.appendChild(btn);
    }

    // On page load, just create the button; don't run parsing automatically
    createShowButton();

})();
