// ==UserScript==
// @name         GTR Auto Credit Multiple Students (Skip TES Sections) (Keep)
// @namespace    http://otsystems.net/
// @version      1.1
// @description  Auto-credits sections for multiple students, skipping exams and TES-style entries
// @match        https://otsystems.net/admin/students/dashboard/*
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';

    const studentNumbers = [
        525514,
        462095,
        485989,
        525516,
        584679,
        248439,
        525503,
        412213,
        462090,
        449383,
        462087,
        479079,
        525517
        // Add more student numbers here
    ];

    const courseName = "8 Hour HAZWOPER Refresher Online Version 2 (Mobile Ready) - Includes: Toxicology and Waste Site Operations";  // Adjust course name
    const sectionsToComplete = 18;  // Adjust number of sections to credit

    // Suppress alert popups
    window.alert = function (msg) {
        console.warn("⚠️ Auto-dismissed alert:", msg);
    };

    function waitForElement(selector, timeout = 8000) {
        return new Promise((resolve, reject) => {
            const interval = 100;
            let elapsed = 0;
            const check = setInterval(() => {
                const el = document.querySelector(selector);
                if (el) {
                    clearInterval(check);
                    resolve(el);
                } else if (elapsed >= timeout) {
                    clearInterval(check);
                    reject(new Error("Timeout waiting for " + selector));
                }
                elapsed += interval;
            }, interval);
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const currentStudent = urlParams.get('student_number');
    const currentIndex = studentNumbers.indexOf(Number(currentStudent));

    if (!currentStudent || currentIndex === -1) {
        window.location.href = `https://otsystems.net/admin/students/dashboard/?student_number=${studentNumbers[0]}`;
        return;
    }

    async function clickClassesTab() {
        const tab = Array.from(document.querySelectorAll('li[ng-class] a')).find(a =>
            a.textContent.trim().startsWith('Classes')
        );
        if (tab) {
            tab.click();
            console.log("✅ Clicked 'Classes' tab");
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    async function clickGearAndManageProgressByText(targetText) {
        try {
            await waitForElement('div.panel.panel-primary', 10000);
        } catch {
            throw new Error("⚠️ No class panels found.");
        }

        const panels = Array.from(document.querySelectorAll('div.panel.panel-primary'));

        for (const panel of panels) {
            const panelHeading = panel.querySelector('.panel-heading.clearfix');
            if (!panelHeading) continue;

            const headingText = panelHeading.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
            if (!headingText.includes(targetText.toLowerCase())) continue;

            const gearBtn = panelHeading.querySelector('button.btn.btn-sm.btn-primary > i.fa.fa-cog')?.parentElement;
            if (!gearBtn) continue;

            gearBtn.click();
            console.log("✅ Clicked gear icon");
            await new Promise(r => setTimeout(r, 500));

            const manageLink = Array.from(panelHeading.querySelectorAll('ul.dropdown-menu li a')).find(a =>
                a.textContent.trim().toLowerCase().includes('manage progress')
            );
            if (!manageLink) throw new Error("⚠️ 'Manage Progress' link not found.");

            manageLink.click();
            console.log("✅ Clicked 'Manage Progress'");
            await new Promise(r => setTimeout(r, 1200));
            return;
        }

        throw new Error(`❌ Course panel not found for: "${targetText}"`);
    }

    async function completeSections(maxSections) {
        const buttons = Array.from(document.querySelectorAll('button.popover-button')).filter(btn => {
            const hasPencil = btn.querySelector('.fa-pencil');
            const title = btn.getAttribute('popover-title') || '';
            const isExam = /module exam/i.test(title);
            const isTES = /\d+-TES-\d+/i.test(title);  // skip titles like 123-TES-456
            return hasPencil && !isExam && !isTES;
        });

        if (buttons.length === 0) {
            console.warn("⚠️ No eligible sections found.");
            return;
        }

        let completed = 0;

        for (let btn of buttons) {
            if (completed >= maxSections) break;

            try {
                const title = btn.getAttribute('popover-title') || 'Untitled';
                btn.click();
                console.log(`🔘 Opened: ${title}`);

                const completeSpan = await waitForElement('button.btn-info span.ng-scope', 4000);
                if (completeSpan.textContent.trim() === 'Complete') {
                    completeSpan.parentElement.click();
                    console.log(`✅ Completed: ${title}`);
                    completed++;
                } else {
                    throw new Error("Not a valid section (probably an exam or blocked)");
                }
                await new Promise(r => setTimeout(r, 1200));
            } catch (err) {
                console.warn(`⚠️ Skipping: ${err.message}`);
                const cancel = document.querySelector('button.btn.btn-default[ng-click="cancel()"]');
                if (cancel) {
                    cancel.click();
                    console.log("❌ Canceled and continued.");
                }
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        console.log(`🎯 Completed ${completed}/${maxSections} sections.`);
    }

    // Run the process
    try {
        await clickClassesTab();
        await clickGearAndManageProgressByText(courseName);
        await completeSections(sectionsToComplete);
    } catch (err) {
        console.error("❌ Error:", err.message);
    }

    // Move to next student
    const delay = 4000;
    if (currentIndex < studentNumbers.length - 1) {
        const nextStudent = studentNumbers[currentIndex + 1];
        console.log(`⏭ Moving to next student: ${nextStudent} in ${delay / 1000}s`);
        setTimeout(() => {
            window.location.href = `https://otsystems.net/admin/students/dashboard/?student_number=${nextStudent}`;
        }, delay);
    } else {
        console.log("✅ All students processed.");
    }

})();