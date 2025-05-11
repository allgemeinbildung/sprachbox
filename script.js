// script.js - Rewritten with IIFE for Scope Isolation and Terminology Changes

(function() {
    'use strict'; // Optional: Enforces stricter parsing and error handling

    // Constants for storage keys (now local to this IIFE)
    const STORAGE_PREFIX = 'textbox-assignment_'; // 'assignment' here refers to the main item, now called "Thema"
    const SUB_STORAGE_PREFIX = 'textbox-sub_';     // 'sub' here refers to the sub-item, now called "Textsorte"
    const STEPS_PREFIX = 'textbox-steps_';         // New prefix for storing steps (formerly questions)

    // Global variable for the Quill editor (now local to this IIFE)
    let quill;

    // Markdown parsing function (now local to this IIFE)
    function parseMarkdown(text) {
        if (!text) return '';

        // Parse bold (** or __)
        text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

        // Parse italic (* or _)
        text = text.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

        return text;
    }

    // Utility functions for URL parameters (now local to this IIFE)
    function getQueryParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        for (const [key, value] of urlParams.entries()) {
            if (key === 'subIds' || key.startsWith('step')) { // Changed 'question' to 'step'
                if (!params[key]) {
                    params[key] = [];
                }
                params[key].push(value);
            } else {
                params[key] = value;
            }
        }
        return params;
    }

    function getQueryParam(param) {
        return getQueryParams()[param];
    }

    function getCurrentSubIdAndSteps() { // Renamed from getCurrentSubIdAndQuestions
        const params = getQueryParams();
        const subId = params.subIds ? params.subIds[0] : null;
        const steps = {}; // Renamed from questions
        Object.keys(params).forEach(key => {
            if (key.startsWith('step') && params[key]) { // Changed 'question' to 'step'
                steps[key] = params[key][0]; // Take the first step if multiple provided for same key
            }
        });
        return { subId, steps }; // Renamed from questions
    }

    function showSaveIndicator() {
        const saveIndicator = document.getElementById('saveIndicator');
        if (!saveIndicator) return;

        saveIndicator.style.opacity = '1';
        setTimeout(() => {
            saveIndicator.style.opacity = '0';
        }, 2000);
    }

    // Save steps to localStorage - new function (now local to this IIFE)
    function saveStepsToLocal(assignmentId, subId, steps) { // Renamed from saveQuestionsToLocal, param questions to steps
        if (!subId || Object.keys(steps).length === 0) return;

        const storageKey = `${STEPS_PREFIX}${assignmentId}_${SUB_STORAGE_PREFIX}${subId}`; // Using STEPS_PREFIX
        try {
            localStorage.setItem(storageKey, JSON.stringify(steps));
            console.log(`Steps for ${storageKey} saved`); // Updated log message
        } catch (e) {
            console.error("Error saving steps to localStorage:", e); // Updated error message
            // Handle potential storage full errors if necessary
        }
    }

    // Save text to localStorage (now local to this IIFE)
    function saveToLocal() {
        if (!quill) return; // Make sure Quill is initialized

        const htmlContent = quill.root.innerHTML;
        // Basic check for empty content (e.g., "<p><br></p>")
        if (htmlContent === '<p><br></p>' || htmlContent === '') {
            console.log("Attempted to save empty content. Skipping.");
            return;
        }

        const assignmentId = getQueryParam('assignmentId') || 'defaultAssignment';
        const { subId } = getCurrentSubIdAndSteps(); // Using renamed function
        const storageKey = subId
            ? `${STORAGE_PREFIX}${assignmentId}_${SUB_STORAGE_PREFIX}${subId}`
            : `${STORAGE_PREFIX}${assignmentId}`;

        try {
            localStorage.setItem(storageKey, htmlContent);
            console.log(`Text for ${storageKey} saved`);
            showSaveIndicator();
        } catch (e) {
            console.error("Error saving content to localStorage:", e);
            alert("Fehler beim Speichern. Möglicherweise ist der Speicherplatz voll.");
        }
    }

    function clearLocalStorage() {
        const keysToRemove = [];
        const prefix = 'textbox-'; // Clear all related keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        if (quill) quill.setText('');
        console.log("All textbox-* prefixed keys cleared from localStorage");
        alert("Alle gespeicherten Texte wurden gelöscht.");
    }

    // Print a single answer (now local to this IIFE)
    function printSingleAnswer(title, content, steps = {}) { // Renamed param questions to steps
        const existingPrintDiv = document.getElementById('printSingleContent');
        if (existingPrintDiv) {
            document.body.removeChild(existingPrintDiv);
        }

        const printDiv = document.createElement('div');
        printDiv.id = 'printSingleContent';
        printDiv.style.visibility = 'hidden';

        const titleElement = document.createElement('h2');
        titleElement.textContent = title;
        printDiv.appendChild(titleElement);

        // Add steps if they exist
        if (Object.keys(steps).length > 0) {
            const stepsElement = document.createElement('div');
            stepsElement.className = 'steps-print'; // Renamed class
            let stepsHtml = '<em>';
            Object.values(steps).forEach(step => { // Iterate over steps
                stepsHtml += `<div>- ${parseMarkdown(step)}</div>`; // Use step variable
            });
            stepsHtml += '</em>';
            stepsElement.innerHTML = stepsHtml;
            printDiv.appendChild(stepsElement);
        }

        const contentElement = document.createElement('div');
        contentElement.innerHTML = content;
        printDiv.appendChild(contentElement);

        document.body.appendChild(printDiv);
        document.body.classList.add('print-single');

        function handleAfterPrint() {
            document.body.classList.remove('print-single');
            const printDivAfter = document.getElementById('printSingleContent');
            if (printDivAfter) {
                document.body.removeChild(printDivAfter);
            }
            window.removeEventListener('afterprint', handleAfterPrint);
            window.removeEventListener('beforeprint', handleBeforePrint);
        }

        function handleBeforePrint() {
            printDiv.style.visibility = 'visible';
        }

        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);
        window.print();
    }

    function printFormattedContent(content, printWindowTitle = 'Alle Antworten') {
        const printWindow = window.open('', '', 'height=800,width=800');
        if (!printWindow) {
            alert("Bitte erlauben Sie Pop-up-Fenster, um drucken zu können.");
            return;
        }
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <title>${printWindowTitle}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h2 { color: #003f5c; margin-top: 1.5em; margin-bottom: 0.5em; }
                    h3 { color: #2f4b7c; margin-top: 1em; margin-bottom: 0.3em;}
                    hr { border: 0; border-top: 1px solid #ccc; margin: 20px 0; }
                    .steps-print { /* Renamed from .questions-print */
                        margin-bottom: 15px;
                        font-style: italic;
                        color: #333; 
                    }
                    .steps-print div { /* Renamed from .questions-print div */
                        margin-bottom: 5px;
                    }
                    ul, ol { margin-left: 20px; padding-left: 20px; }
                    li { margin-bottom: 5px; }
                    p { margin-bottom: 10px; line-height: 1.4; }
                    strong { font-weight: bold; }
                    em { font-style: italic; }
                    h2 { page-break-before: always; } 
                    h3 { page-break-after: avoid; } 
                    .sub-assignment-block { page-break-inside: avoid; } 
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    }

    // Get steps from localStorage for a specific subId (now local)
    function getStepsFromStorage(assignmentId, subId) { // Renamed from getQuestionsFromStorage
        const storageKey = `${STEPS_PREFIX}${assignmentId}_${SUB_STORAGE_PREFIX}${subId}`; // Using STEPS_PREFIX
        const storedSteps = localStorage.getItem(storageKey); // Renamed from storedQuestions

        if (storedSteps) {
            try {
                return JSON.parse(storedSteps);
            } catch (e) {
                console.error(`Error parsing steps for ${subId}:`, e); // Updated error message
                return {};
            }
        }
        return {};
    }

    // Get steps HTML from localStorage (now local)
    function getStepsHtmlFromStorage(assignmentId, subId) { // Renamed from getQuestionsHtmlFromStorage
        const steps = getStepsFromStorage(assignmentId, subId); // Using renamed function and variable

        if (Object.keys(steps).length > 0) {
            let html = '<div class="steps-print"><em>'; // Renamed class
            Object.values(steps).forEach(step => { // Iterate over steps
                html += `<div>- ${parseMarkdown(step)}</div>`; // Use step variable
            });
            html += '</em></div>';
            return html;
        }
        return '';
    }

    // Print all subIds for the current assignment (now local)
    function printAllSubIdsForAssignment() {
        const assignmentId = getQueryParam('assignmentId') || 'defaultAssignment';
        const assignmentPrefix = `${STORAGE_PREFIX}${assignmentId}_${SUB_STORAGE_PREFIX}`;
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith(assignmentPrefix));

        if (storageKeys.length === 0) {
            alert("Keine gespeicherten Textsorten für dieses Thema gefunden."); // Updated alert
            return;
        }

        const assignmentSuffix = assignmentId.includes('_') ? assignmentId.substring(assignmentId.indexOf('_') + 1) : assignmentId;
        let allContent = `<h2>Thema: ${assignmentSuffix}</h2>`; // Changed "Aufgabe" to "Thema"

        storageKeys.sort((a, b) => {
            const subIdA = a.replace(assignmentPrefix, '');
            const subIdB = b.replace(assignmentPrefix, '');
            return subIdA.localeCompare(subIdB, undefined, {numeric: true, sensitivity: 'base'});
        });

        storageKeys.forEach(key => {
            const content = localStorage.getItem(key);
            if (content) {
                const subId = key.replace(assignmentPrefix, '');
                const stepsHtml = getStepsHtmlFromStorage(assignmentId, subId); // Using renamed function

                allContent += `<div class="sub-assignment-block">`;
                allContent += `<h3>Textsorte: ${subId}</h3>`; // Changed "Thema" to "Textsorte"
                if (stepsHtml) {
                    allContent += stepsHtml; // Add steps HTML
                }
                allContent += `<div>${content}</div>`;
                allContent += `</div>`;
                allContent += `<hr>`;
            }
        });

        if (allContent.endsWith('<hr>')) {
            allContent = allContent.slice(0, -4);
        }

        printFormattedContent(allContent, `Alle Textsorten für Thema: ${assignmentSuffix}`); // Updated window title
    }

    // Update subId info in the UI (now local)
    function updateSubIdInfo() {
        const subIdInfoElement = document.getElementById('subIdInfo');
        if (!subIdInfoElement) return;

        const { subId, steps } = getCurrentSubIdAndSteps(); // Using renamed function and variable

        if (subId) {
            let html = `<h4>Textsorte: ${subId}</h4>`; // Changed "Thema" to "Textsorte"

            if (Object.keys(steps).length > 0) {
                html += '<div class="steps-container"><em>'; // Renamed class
                Object.values(steps).forEach(step => { // Iterate over steps
                    html += `<div>- ${parseMarkdown(step)}</div>`; // Use step variable
                });
                html += '</em></div>';
            }
            subIdInfoElement.innerHTML = html;
            subIdInfoElement.style.display = 'block';
        } else {
            subIdInfoElement.innerHTML = '';
            subIdInfoElement.style.display = 'none';
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    document.addEventListener("DOMContentLoaded", function() {
        const assignmentId = getQueryParam('assignmentId') || 'defaultAssignment';
        const assignmentSuffix = assignmentId.includes('_') ? assignmentId.substring(assignmentId.indexOf('_') + 1) : assignmentId;

        const assignmentInfo = document.getElementById('assignmentInfo');
        if (assignmentInfo) {
            assignmentInfo.textContent = assignmentSuffix ? `Thema: ${assignmentSuffix}` : 'Thema'; // Changed "Aufgabe" to "Thema", "Kapitel" to "Thema"
        }

        const answerBox = document.getElementById('answerBox');
        if (answerBox) {
            console.log("Initializing Quill editor");
            try {
                quill = new Quill('#answerBox', {
                    theme: 'snow',
                    placeholder: 'Gib hier deinen Text ein...',
                    modules: {
                        toolbar: [
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['clean']
                        ]
                    }
                });

                quill.root.addEventListener('paste', function(e) {
                    e.preventDefault();
                    alert("Einfügen von Inhalten ist in diesem Editor deaktiviert.");
                });

                const debouncedSave = debounce(saveToLocal, 1500);
                quill.on('text-change', function(delta, oldDelta, source) {
                    if (source === 'user') {
                        debouncedSave();
                    }
                });

                const { subId } = getCurrentSubIdAndSteps(); // Using renamed function
                const storageKey = subId
                    ? `${STORAGE_PREFIX}${assignmentId}_${SUB_STORAGE_PREFIX}${subId}`
                    : `${STORAGE_PREFIX}${assignmentId}`;
                const savedText = localStorage.getItem(storageKey);

                if (savedText) {
                    quill.root.innerHTML = savedText;
                    console.log(`Gespeicherten Text für ${storageKey} geladen`);
                } else {
                    console.log(`Kein gespeicherter Text für ${storageKey} gefunden`);
                }
            } catch (error) {
                console.error("Failed to initialize Quill:", error);
                answerBox.innerHTML = "Fehler beim Laden des Editors.";
            }
        } else {
            console.log("Element #answerBox not found. Quill not initialized.");
        }

        updateSubIdInfo();

        const { subId: currentSubId, steps: currentSteps } = getCurrentSubIdAndSteps(); // Using renamed function and variable
        if (currentSubId && Object.keys(currentSteps).length > 0) {
            saveStepsToLocal(assignmentId, currentSubId, currentSteps); // Using renamed function and variable
        }

        const downloadCurrentBtn = document.getElementById('downloadAllBtn');
        if (downloadCurrentBtn) {
            downloadCurrentBtn.textContent = 'Aktuelle Antwort drucken / als PDF speichern';
            downloadCurrentBtn.addEventListener('click', function() {
                if (!quill) {
                    alert("Editor nicht initialisiert.");
                    return;
                }
                const content = quill.root.innerHTML;
                if (content === '<p><br></p>' || content === '') {
                    alert("Kein Inhalt zum Drucken vorhanden.");
                    return;
                }

                const { subId, steps } = getCurrentSubIdAndSteps(); // Using renamed function and variable
                let title = `Thema: ${assignmentSuffix}`; // Changed "Aufgabe" to "Thema"
                if(subId) {
                    title += ` - Textsorte: ${subId}`; // Changed "Thema" to "Textsorte"
                }
                printSingleAnswer(title, content, steps); // Pass steps
            });
        }

        const buttonContainer = document.querySelector('.button-container');
        if (buttonContainer) {
            let printAllSubIdsBtn = document.getElementById('printAllSubIdsBtn');
            if (!printAllSubIdsBtn) {
                printAllSubIdsBtn = document.createElement('button');
                printAllSubIdsBtn.id = 'printAllSubIdsBtn';
                buttonContainer.appendChild(printAllSubIdsBtn);
            }
            printAllSubIdsBtn.textContent = 'Alle Textsorten dieses Themas drucken'; // Updated button text
            printAllSubIdsBtn.addEventListener('click', printAllSubIdsForAssignment);
        }
        console.log("Initialization complete (within IIFE)");
    }); // End DOMContentLoaded listener
})(); // End IIFE
