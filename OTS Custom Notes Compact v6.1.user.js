// ==UserScript==
// @name         OTS Custom Notes Compact v6.1
// @namespace    https://otsystems.net/
// @version      6.1
// @description  Custom notes UI with inline edit of short and long note fields at the same time, no help button, hover effect on Save button, plus predefined notes.
// @match        https://otsystems.net/admin/students/dashboard/?student_number=*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'ots_custom_notes_v4';

    function loadNotes() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveNotes(notes) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }

    function waitForElement(selector, callback, timeout = 10000) {
        const start = Date.now();
        const interval = setInterval(() => {
            const el = document.querySelector(selector);
            if (el) {
                clearInterval(interval);
                callback(el);
            } else if (Date.now() - start > timeout) {
                clearInterval(interval);
                console.warn('[Tampermonkey] Timeout waiting for', selector);
            }
        }, 300);
    }

    waitForElement('#addnotebutton button.btn-primary', (addBtn) => {
        addBtn.addEventListener('click', () => {
            waitForElement('body > div.modal.sizeModal40.fade.in', (modal) => {
                waitForElement('div.modal iframe', (iframe) => {
                    if (modal.querySelector('.compact-notes-wrapper')) return;

                    const wrapper = document.createElement('div');
                    wrapper.className = 'compact-notes-wrapper';
                    wrapper.style.marginTop = '10px';
                    wrapper.style.padding = '8px';
                    wrapper.style.border = '1px solid #ccc';
                    wrapper.style.borderRadius = '4px';
                    wrapper.style.background = '#f9f9f9';

                    // Search bar
                    const searchInput = document.createElement('input');
                    searchInput.type = 'text';
                    searchInput.placeholder = 'Search saved notes...';
                    searchInput.className = 'form-control';
                    searchInput.style.marginBottom = '8px';

                    // Container for saved note buttons
                    const noteList = document.createElement('div');
                    noteList.style.display = 'flex';
                    noteList.style.flexWrap = 'wrap';
                    noteList.style.gap = '6px';

                    // New note inputs
                    const shortInput = document.createElement('input');
                    shortInput.className = 'form-control';
                    shortInput.placeholder = 'Add Personal Note Title (button text/saved locally)';
                    shortInput.style.marginTop = '12px';

                    const longInput = document.createElement('textarea');
                    longInput.className = 'form-control';
                    longInput.rows = 3;
                    longInput.placeholder = 'Add Personal Note Content (content saved locally)';

                    const addNoteBtn = document.createElement('button');
                    addNoteBtn.className = 'btn btn-sm';
                    addNoteBtn.textContent = 'Save Personal Note';

                    // Base orange color
                    addNoteBtn.style.backgroundColor = '#FF5C00';
                    addNoteBtn.style.borderColor = '#FF5C00';
                    addNoteBtn.style.color = '#fff';
                    addNoteBtn.style.transition = 'background-color 0.3s ease';

                    // Hover effect for Save button
                    addNoteBtn.addEventListener('mouseenter', () => {
                        addNoteBtn.style.backgroundColor = '#e04b00'; // darker shade
                        addNoteBtn.style.borderColor = '#e04b00';
                    });
                    addNoteBtn.addEventListener('mouseleave', () => {
                        addNoteBtn.style.backgroundColor = '#FF5C00';
                        addNoteBtn.style.borderColor = '#FF5C00';
                    });

                    // No help button (removed)

                    const buttonsContainer = document.createElement('div');
                    buttonsContainer.style.marginTop = '6px';
                    buttonsContainer.appendChild(addNoteBtn);

                    function renderNotes(filter = '') {
                        const savedNotes = loadNotes();

                        // Combine predefined notes + saved notes
                        const allNotes = predefinedNotes.concat(savedNotes);

                        noteList.innerHTML = '';

                        allNotes.forEach((note, idx) => {
                            if (
                                filter &&
                                !note.short.toLowerCase().includes(filter.toLowerCase()) &&
                                !note.long.toLowerCase().includes(filter.toLowerCase())
                            ) {
                                return;
                            }

                            const item = document.createElement('div');
                            item.className = 'note-button-wrapper';
                            item.draggable = idx >= predefinedNotes.length; // Only saved notes draggable/editable/deletable
                            item.style.display = 'flex';
                            item.style.alignItems = 'center';
                            item.style.gap = '4px';
                            item.style.background = '#fff';
                            item.style.border = '1px solid #ccc';
                            item.style.borderRadius = '4px';
                            item.style.padding = '2px 4px';
                            item.style.cursor = idx >= predefinedNotes.length ? 'grab' : 'default';

                            // Hover highlight
                            item.addEventListener('mouseenter', () => {
                                item.style.background = '#d6eaff';
                            });
                            item.addEventListener('mouseleave', () => {
                                item.style.background = '#fff';
                            });

                            const btn = document.createElement('button');
                            btn.textContent = note.short;
                            btn.className = 'btn btn-xs btn-outline-secondary';
                            btn.title = note.long;
                            btn.style.fontSize = '0.8em';
                            btn.style.padding = '2px 6px';

                            btn.addEventListener('click', () => {
                                const editorBody = iframe.contentDocument.querySelector('body');
                                if (editorBody) {
                                    const paragraph = `<p>${note.long}</p>`;
                                    if (
                                        editorBody.innerHTML.trim() === '' ||
                                        editorBody.innerHTML.trim() === '<div><br></div>'
                                    ) {
                                        editorBody.innerHTML = paragraph;
                                    } else {
                                        editorBody.innerHTML += paragraph;
                                    }

                                    editorBody.focus();
                                    const sel = iframe.contentWindow.getSelection();
                                    const range = iframe.contentDocument.createRange();
                                    range.setStart(editorBody, 0);
                                    range.collapse(true);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                }
                            });

                            item.appendChild(btn);

                            // Only saved notes get edit & delete buttons + drag/drop
                            if (idx >= predefinedNotes.length) {
                                const savedIdx = idx - predefinedNotes.length;

                                const edit = document.createElement('span');
                                edit.textContent = '✎';
                                edit.title = 'Edit';
                                edit.style.cursor = 'pointer';
                                edit.style.fontSize = '14px';
                                edit.style.color = '#007bff';
                                edit.addEventListener('click', () => {
                                    const modalEdit = document.createElement('div');
                                    modalEdit.style.position = 'fixed';
                                    modalEdit.style.top = '50%';
                                    modalEdit.style.left = '50%';
                                    modalEdit.style.transform = 'translate(-50%, -50%)';
                                    modalEdit.style.zIndex = '9999';
                                    modalEdit.style.background = '#fff';
                                    modalEdit.style.border = '1px solid #ccc';
                                    modalEdit.style.padding = '16px';
                                    modalEdit.style.borderRadius = '6px';
                                    modalEdit.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                    modalEdit.style.minWidth = '320px';

                                    const shortInputEdit = document.createElement('input');
                                    shortInputEdit.className = 'form-control';
                                    shortInputEdit.value = note.short;
                                    shortInputEdit.placeholder = 'Short label';
                                    shortInputEdit.style.marginBottom = '8px';

                                    const longInputEdit = document.createElement('textarea');
                                    longInputEdit.className = 'form-control';
                                    longInputEdit.value = note.long;
                                    longInputEdit.rows = 4;
                                    longInputEdit.placeholder = 'Full note content';
                                    longInputEdit.style.marginBottom = '8px';

                                    const saveBtn = document.createElement('button');
                                    saveBtn.textContent = 'Save Changes';
                                    saveBtn.className = 'btn btn-sm btn-success';
                                    saveBtn.style.marginRight = '8px';

                                    const cancelBtn = document.createElement('button');
                                    cancelBtn.textContent = 'Cancel';
                                    cancelBtn.className = 'btn btn-sm btn-secondary';

                                    saveBtn.addEventListener('click', () => {
                                        const newShort = shortInputEdit.value.trim();
                                        const newLong = longInputEdit.value.trim();
                                        if (!newShort || !newLong) {
                                            alert('Both fields are required.');
                                            return;
                                        }
                                        const notes = loadNotes();
                                        notes[savedIdx] = { short: newShort, long: newLong };
                                        saveNotes(notes);
                                        document.body.removeChild(modalEdit);
                                        renderNotes(searchInput.value);
                                    });

                                    cancelBtn.addEventListener('click', () => {
                                        document.body.removeChild(modalEdit);
                                    });

                                    modalEdit.appendChild(shortInputEdit);
                                    modalEdit.appendChild(longInputEdit);
                                    modalEdit.appendChild(saveBtn);
                                    modalEdit.appendChild(cancelBtn);
                                    document.body.appendChild(modalEdit);
                                });

                                const del = document.createElement('span');
                                del.textContent = '×';
                                del.title = 'Delete';
                                del.style.cursor = 'pointer';
                                del.style.fontSize = '16px';
                                del.style.color = 'red';
                                del.addEventListener('click', () => {
                                    if (
                                        confirm(
                                            `Are you sure you want to delete:\n\n"${note.short}"?\n\n"${note.long}"`
                                        )
                                    ) {
                                        const notes = loadNotes();
                                        notes.splice(savedIdx, 1);
                                        saveNotes(notes);
                                        renderNotes(searchInput.value);
                                    }
                                });

                                // Drag & drop events
                                item.addEventListener('dragstart', (e) => {
                                    e.dataTransfer.setData('text/plain', savedIdx);
                                    item.style.opacity = '0.5';
                                });
                                item.addEventListener('dragend', () => {
                                    item.style.opacity = '1';
                                });
                                item.addEventListener('dragover', (e) => {
                                    e.preventDefault();
                                    item.style.background = '#e0f0ff';
                                });
                                item.addEventListener('dragleave', () => {
                                    item.style.background = '#fff';
                                });
                                item.addEventListener('drop', (e) => {
                                    e.preventDefault();
                                    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                                    const toIdx = savedIdx;
                                    const notes = loadNotes();
                                    const moved = notes.splice(fromIdx, 1)[0];
                                    notes.splice(toIdx, 0, moved);
                                    saveNotes(notes);
                                    renderNotes(searchInput.value);
                                });

                                item.appendChild(edit);
                                item.appendChild(del);
                            }

                            noteList.appendChild(item);
                        });
                    }

                    addNoteBtn.addEventListener('click', () => {
                        const s = shortInput.value.trim();
                        const l = longInput.value.trim();
                        if (!s || !l) return alert('Both short and long notes are required.');
                        const notes = loadNotes();
                        notes.push({ short: s, long: l });
                        saveNotes(notes);
                        shortInput.value = '';
                        longInput.value = '';
                        renderNotes(searchInput.value);
                    });

                    searchInput.addEventListener('input', () => {
                        renderNotes(searchInput.value);
                    });

                    renderNotes();

                    wrapper.appendChild(searchInput);
                    wrapper.appendChild(noteList);
                    wrapper.appendChild(shortInput);
                    wrapper.appendChild(longInput);
                    wrapper.appendChild(buttonsContainer);

                    modal.querySelector('.modal-body')?.appendChild(wrapper);
                });
            });
        });
    });
})();
