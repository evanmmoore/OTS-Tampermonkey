// ==UserScript==
// @name         Refresher Reminder 2025 ⚠️ Check (9/3/25)
// @namespace    http://otsystems.net/
// @version      1.5
// @description  Adds a button at bottom center to manually check and show 2025 enrollments inline next to class name on refresherreminder page.
// @match        https://otsystems.net/admin/utilities/refresherreminder/default2.asp
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Add header column "2025 Enrollment" once
    function addHeaderColumn() {
        const headerRow = document.querySelector('tr[ng-repeat="reminder in rc.Reminders"]')?.parentElement?.previousElementSibling;
        if (!headerRow) return;
        if (!headerRow.querySelector('.col-2025-header')) {
            const th = document.createElement('th');
            th.textContent = '2025 Enrollment';
            th.classList.add('col-2025-header');
            headerRow.appendChild(th);
        }
    }

    // Add empty cell for each data row
    function addCells() {
        const rows = document.querySelectorAll('tr[ng-repeat="reminder in rc.Reminders"]');
        rows.forEach(row => {
            if (!row.querySelector('.col-2025-cell')) {
                const td = document.createElement('td');
                td.classList.add('col-2025-cell');
                td.style.minWidth = '220px';
                td.style.fontWeight = 'bold';
                td.style.fontSize = '12px';
                td.style.color = '#333';
                row.appendChild(td);
            }
        });
    }

    const wait = ms => new Promise(res => setTimeout(res, ms));

    function parseEnrollmentYear(dateStr) {
        const m = dateStr.match(/Enrolled:\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (!m) return null;
        let year = m[3];
        if (year.length === 2) year = '20' + year;
        return parseInt(year, 10);
    }

    async function processRows() {
        addHeaderColumn();
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
            try {
                win = window.open(dashboardLink, '_blank');
            } catch {
                cell.textContent = 'Popup blocked';
                cell.style.color = 'red';
                continue;
            }
            if (!win) {
                cell.textContent = 'Popup blocked';
                cell.style.color = 'red';
                continue;
            }

            const injectedScript = `
                (function() {
                    function send(data) {
                        window.opener.postMessage({ type: '2025-enrollment-data', data }, '*');
                    }
                    function parseEnrollmentYear(dateStr) {
                        const m = dateStr.match(/Enrolled:\\s*(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2,4})/);
                        if (!m) return null;
                        let year = m[3];
                        if (year.length === 2) year = '20' + year;
                        return parseInt(year, 10);
                    }
                    function switchToClassesTab() {
                        const tabs = [...document.querySelectorAll('li.uib-tab')];
                        const tab = tabs.find(t => t.textContent.includes("Classes"));
                        if (!tab) {
                            send([]);
                            return;
                        }
                        const link = tab.querySelector('a.nav-link');
                        if (!link) {
                            send([]);
                            return;
                        }
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
                            const dateEl = panel.querySelector('strong.m-sm.ng-binding');
                            if (titleEl && dateEl) {
                                const title = titleEl.childNodes[0]?.textContent?.trim() || titleEl.innerText.trim();
                                const dateText = dateEl.innerText.trim();
                                const year = parseEnrollmentYear(dateText);
                                if (year === 2025) {
                                    results.push({ title, date: dateText });
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
                function messageHandler(e) {
                    if (e.data?.type === '2025-enrollment-data') {
                        window.removeEventListener('message', messageHandler);
                        resolve(e.data.data);
                    }
                }
                window.addEventListener('message', messageHandler);
            });

            if (results.length) {
                // FIXED: Remove any existing "Enrolled:" before adding it once
                const summary = results.map(r => {
                    const cleanDate = r.date.replace(/^Enrolled:\s*/i, '');
                    return `Enrolled: ${cleanDate} - ${r.title}`;
                }).join('; ');
                cell.textContent = summary;
                cell.style.color = 'green';
            } else {
                cell.textContent = '❌ No 2025 enrollments found';
                cell.style.color = 'red';
            }

            await wait(600);
        }
    }

    // Add a fixed button bottom center
    function addButton() {
        const btn = document.createElement('button');
        btn.textContent = 'Check ⚠️ Students';
        btn.style.position = 'fixed';
        btn.style.bottom = '10px';
        btn.style.left = '50%';
        btn.style.transform = 'translateX(-50%)';
        btn.style.zIndex = '10000';
        btn.style.padding = '10px 18px';
        btn.style.backgroundColor = '#FF5B00';  // Bright orange
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '5px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = 'bold';
        btn.style.fontSize = '15px';
        btn.title = 'Click to check all students for 2025 enrollments';

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

    addButton();

})();