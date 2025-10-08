// ==UserScript==
// @name         Refresher Reminder. Checks ⚠️ Students 9/11/25
// @namespace    http://otsystems.net/
// @version      3.7
// @description  Checks 2024/2025 enrollments, strips version info, preserves full class names, bullets, colors, and dates, filtering by reminder page keywords. Header moved to 5th column in main table row. Includes Completed if after reminder date. Now with timeout + keyword exclusions. Updated: "Active" replaces "In Progress/Not Started" with #337ab7. Enrolled date now includes time.
// @match        https://otsystems.net/admin/utilities/refresherreminder/default2.asp
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const wait = ms => new Promise(res => setTimeout(res, ms));

    function replaceHeaderWithInternalBox() {
        const headerRow = document.querySelector('#content > div > div.box-row > div > div > div > div > div > div > div > div.tab-pane.ng-scope.active > div > table > thead > tr');
        if (!headerRow) return;
        const oldHeader = headerRow.querySelector('.col-2025-header');
        if (oldHeader) oldHeader.remove();
        const th = document.createElement('th');
        th.classList.add('col-2025-header');
        th.style.minWidth = '260px';
        th.style.fontWeight = 'bold';
        th.style.backgroundColor = '#ffffff';
        th.style.padding = '4px 6px';
        th.textContent = 'Student Account Enrollments';
        if (headerRow.children.length >= 5) {
            headerRow.insertBefore(th, headerRow.children[4]);
        } else {
            headerRow.appendChild(th);
        }
    }

    function addCells() {
        const rows = document.querySelectorAll('tr[ng-repeat="reminder in rc.Reminders"]');
        rows.forEach(row => {
            if (!row.querySelector('.col-2025-cell')) {
                const td = document.createElement('td');
                td.classList.add('col-2025-cell');
                td.style.minWidth = '260px';
                td.style.fontWeight = 'bold';
                td.style.fontSize = '12px';
                td.style.color = '#333';
                if (row.children.length >= 5) row.insertBefore(td, row.children[4]);
                else row.appendChild(td);
            }
        });
    }

    function parseEnrollmentYear(dateStr) {
        const m = dateStr.match(/Enrolled:\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (!m) return null;
        let year = m[3];
        if (year.length === 2) year = '20' + year;
        return parseInt(year, 10);
    }

    async function processRows() {
        replaceHeaderWithInternalBox();
        addCells();

        const rows = Array.from(document.querySelectorAll('tr[ng-repeat="reminder in rc.Reminders"]'));

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const cell = row.querySelector('.col-2025-cell');
            if (!cell) continue;

            cell.textContent = 'Checking...';
            cell.style.color = 'black';

            const dashboardLink = row.querySelector('a[href*="dashboard.asp"]')?.href;
            if (!dashboardLink) {
                cell.textContent = 'No dashboard link';
                cell.style.color = 'gray';
                continue;
            }

            let win;
            try { win = window.open(dashboardLink, '_blank'); }
            catch { cell.textContent = 'Popup blocked'; cell.style.color = 'red'; continue; }
            if (!win) { cell.textContent = 'Popup blocked'; cell.style.color = 'red'; continue; }

            const injectedScript = `
                (function() {
                    function send(data) { window.opener.postMessage({ type: '2025-enrollment-data', data }, '*'); }
                    function parseEnrollmentYear(dateStr) {
                        const m = dateStr.match(/Enrolled:\\s*(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2,4})/);
                        if (!m) return null;
                        let year = m[3];
                        if (year.length === 2) year = '20' + year;
                        return parseInt(year, 10);
                    }
                    function getCleanTitle(h4) {
                        const clone = h4.cloneNode(true);
                        clone.querySelectorAll('span').forEach(span => span.remove());
                        return clone.innerText.replace(/\\u00A0/g, ' ').replace(/\\s+/g, ' ').trim();
                    }
                    function switchToClassesTab() {
                        const tabs = [...document.querySelectorAll('li.uib-tab')];
                        const tab = tabs.find(t => t.textContent.includes("Classes"));
                        if (!tab) { send([]); return; }
                        const link = tab.querySelector('a.nav-link');
                        if (!link) { send([]); return; }
                        link.click();
                        waitForClassesContent();
                    }
                    function waitForClassesContent() {
                        let attempts = 0;
                        const interval = setInterval(() => {
                            attempts++;
                            const panels = document.querySelectorAll('div.panel-heading.clearfix');
                            if (panels.length > 0 || attempts > 20) {
                                clearInterval(interval);
                                checkEnrollments(panels);
                            }
                        }, 300);
                    }
                    function checkEnrollments(panels) {
                        const results = [];
                        panels.forEach(panel => {
                            const titleEl = panel.querySelector('h4.m-t-sm.ng-binding');
                            const dateEl = panel.querySelector('.panel-title.pull-right strong.m-sm.ng-binding');
                            const header = panel.closest('.panel')?.querySelector('.panel-heading');
                            let status = '';
                            if (header) {
                                const bg = getComputedStyle(header).backgroundColor;
                                if (bg.includes('92, 184, 92') || bg.includes('223, 240, 216')) status = 'Completed';
                                else if (bg.includes('51, 122, 183') || bg.includes('217, 237, 247')) status = 'Active';
                                else if (bg.includes('169, 68, 66') || bg.includes('242, 222, 222')) status = 'Payment';
                            }
                            if (titleEl && dateEl) {
                                const courseTitle = getCleanTitle(titleEl);
                                let dateText = '';
                                dateEl.childNodes.forEach(node => {
                                    if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Enrolled:')) {
                                        dateText = node.textContent.trim();
                                    }
                                });
                                const year = parseEnrollmentYear(dateText);
                                if (year === 2024 || year === 2025) {
                                    results.push({ title: courseTitle, date: dateText, status });
                                }
                            }
                        });
                        send(results);
                        setTimeout(() => window.close(), 300);
                    }
                    setTimeout(switchToClassesTab, 700);
                })();
            `;

            const tryInject = setInterval(() => {
                try {
                    if (win.document && win.document.readyState === 'complete') {
                        const scriptEl = win.document.createElement('script');
                        scriptEl.textContent = injectedScript;
                        win.document.body.appendChild(scriptEl);
                        clearInterval(tryInject);
                    }
                } catch {}
            }, 300);

            const results = await new Promise(resolve => {
                let finished = false;
                function messageHandler(e) {
                    if (e.data?.type === '2025-enrollment-data') {
                        finished = true;
                        window.removeEventListener('message', messageHandler);
                        clearTimeout(timeoutId);
                        resolve(e.data.data);
                    }
                }
                window.addEventListener('message', messageHandler);
                const timeoutId = setTimeout(() => {
                    if (!finished) {
                        window.removeEventListener('message', messageHandler);
                        resolve([]);
                        try { win.close(); } catch {}
                    }
                }, 10000);
            });

            const reminderTitle = row.querySelector('td:nth-child(3)')?.textContent?.trim() || '';
            const reminderDateEl = row.querySelector('td:nth-child(3) em.ng-binding');
            const reminderDate = reminderDateEl ? reminderDateEl.textContent.trim() : '';

            const keywords = reminderTitle
                .replace(/\b(online|osha|training|version)\b/gi, '')
                .split(/\s+/)
                .filter(w => w.length > 2)
                .map(w => w.toLowerCase());

            const filteredResults = results.filter(r => {
                const courseDate = r.date.replace(/^Enrolled:\s*/i, '');
                const reminderTime = reminderDate ? new Date(reminderDate) : null;
                const courseTime = courseDate ? new Date(courseDate) : null;

                const titleMatch = keywords.some(kw => r.title.toLowerCase().includes(kw));
                if (!titleMatch) return false;

                if (r.status === 'Completed') {
                    if (!reminderTime || !courseTime) return false;
                    return courseTime >= reminderTime;
                }

                return true;
            });

            // Display full enrolled date with time
            cell.innerHTML = '';
            if (filteredResults.length) {
                filteredResults.forEach(r => {
                    const div = document.createElement('div');
                    div.style.color = 'black';
                    const span = document.createElement('span');

                    // Keep full enrolled date including time
                    let enrolledDate = r.date ? r.date.replace(/^Enrolled:\s*/i, '') : '';

                    if (r.status === 'Completed') {
                        span.textContent = 'Enrolled: ' + enrolledDate + ' - ' + r.title + ' [Completed]';
                        span.style.color = 'green';
                    } else if (r.status === 'Active') {
                        span.textContent = 'Enrolled: ' + enrolledDate + ' - ' + r.title + ' [Active]';
                        span.style.color = 'rgb(0, 98, 183)';
                    } else if (r.status === 'Payment') {
                        span.textContent = 'Enrolled: ' + enrolledDate + ' - ' + r.title + ' [Payment]';
                        span.style.color = 'rgb(217, 83, 79)';
                    } else {
                        span.textContent = 'Enrolled: ' + enrolledDate + ' - ' + r.title + ' [' + r.status + ']';
                    }

                    div.appendChild(span);
                    cell.appendChild(div);
                });
            } else {
                cell.textContent = '❌ NO MATCHING ENROLLMENTS';
                cell.style.color = 'rgb(217, 83, 79)';
            }

            await wait(600);
        }
    }

    function addButton() {
        if (document.getElementById('check-students-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'check-students-btn';
        btn.textContent = 'Check ⚠️ Students';
        btn.style.position = 'fixed';
        btn.style.bottom = '10px';
        btn.style.left = '50%';
        btn.style.transform = 'translateX(-50%)';
        btn.style.zIndex = '10000';
        btn.style.padding = '10px 18px';
        btn.style.backgroundColor = '#FF5B00';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '5px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = 'bold';
        btn.style.fontSize = '15px';
        btn.title = 'Click to check all students for 2024/2025 enrollments';

        btn.onclick = () => {
            btn.disabled = true;
            btn.textContent = 'Checking... Please wait';
            processRows().then(() => {
                btn.textContent = 'Done! ✔️';
                setTimeout(() => {
                    btn.textContent = 'Check ⚠️ Students';
                    btn.disabled = false;
                }, 4000);
            });
        };

        document.body.appendChild(btn);
    }

    replaceHeaderWithInternalBox();
    addButton();
})();
