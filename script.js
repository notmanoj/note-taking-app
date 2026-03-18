const editor = document.getElementById('notes');
const downloadButton = document.getElementById('downloadPdf');
const boldToggle = document.getElementById('boldToggle');
const fontSizeSelect = document.getElementById('fontSize');
const clearButton = document.getElementById('clearNotes');
const alignLeft = document.getElementById('alignLeft');
const alignCenter = document.getElementById('alignCenter');
const alignRight = document.getElementById('alignRight');

// Load saved notes
const savedNotes = localStorage.getItem('notes');
if (savedNotes) {
    editor.innerHTML = savedNotes;
}

const hintMessage = document.getElementById('hintMessage');

function updateDownloadButton() {
    const hasText = editor.textContent.trim().length > 0;
    downloadButton.disabled = !hasText;
    downloadButton.style.opacity = hasText ? '1' : '0.5';
    downloadButton.title = hasText ? 'Download your notes as a PDF' : 'Note is empty — type something to enable download';

    hintMessage.textContent = hasText
        ? ''
        : 'The note is empty — type something to enable downloading a PDF.';
}

function updateBoldButtonState() {
    if (document.queryCommandState('bold')) {
        boldToggle.classList.add('active');
    } else {
        boldToggle.classList.remove('active');
    }
}

function updateAlignmentButtons() {
    alignLeft.classList.remove('active');
    alignCenter.classList.remove('active');
    alignRight.classList.remove('active');
    
    // Check which alignment command is currently active
    const isRightJustified = document.queryCommandState('justifyRight');
    const isCenterJustified = document.queryCommandState('justifyCenter');
    const isLeftJustified = document.queryCommandState('justifyLeft');
    
    // Set active state based on actual command state
    if (isRightJustified) {
        alignRight.classList.add('active');
    } else if (isCenterJustified) {
        alignCenter.classList.add('active');
    } else if (isLeftJustified) {
        alignLeft.classList.add('active');
    }
}

// Save notes on input + update button state
editor.addEventListener('input', function() {
    localStorage.setItem('notes', editor.innerHTML);
    updateDownloadButton();
});

editor.addEventListener('mouseup', function() {
    updateBoldButtonState();
    updateAlignmentButtons();
});
editor.addEventListener('keyup', function() {
    updateBoldButtonState();
    updateAlignmentButtons();
});

// Bold toggle for selected text
boldToggle.addEventListener('click', function(e) {
    e.preventDefault();
    document.execCommand('bold', false, null);
    editor.focus();
    updateBoldButtonState();
});

// Alignment buttons
alignLeft.addEventListener('click', function(e) {
    e.preventDefault();
    document.execCommand('justifyLeft', false, null);
    editor.focus();
    updateAlignmentButtons();
});

alignCenter.addEventListener('click', function(e) {
    e.preventDefault();
    document.execCommand('justifyCenter', false, null);
    editor.focus();
    updateAlignmentButtons();
});

alignRight.addEventListener('click', function(e) {
    e.preventDefault();
    document.execCommand('justifyRight', false, null);
    editor.focus();
    updateAlignmentButtons();
});

// Font size change for selected text or default for new text
fontSizeSelect.addEventListener('change', function() {
    const size = this.value;
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    // If text is selected, apply to selected text
    if (selectedText) {
        document.execCommand('fontSize', false, '7');
        
        // Change all <font size="7"> to <span style="font-size: {size}px">
        const spans = editor.querySelectorAll('font[size="7"]');
        spans.forEach(span => {
            const newSpan = document.createElement('span');
            newSpan.style.fontSize = size + 'px';
            newSpan.innerHTML = span.innerHTML;
            span.parentNode.replaceChild(newSpan, span);
        });
        
        localStorage.setItem('notes', editor.innerHTML);
    } else {
        // If no text selected, set as default for upcoming typing
        // Map px values to HTML font size (1-7)
        let fontSize;
        if (size === '12') fontSize = '1';
        else if (size === '14') fontSize = '3';
        else if (size === '16') fontSize = '4';
        
        // Apply font size - this will be used for new text typed
        document.execCommand('fontSize', false, fontSize);
    }
    
    editor.focus();
});

// Modal elements
const confirmModal = document.getElementById('confirmModal');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

// Clear notes
clearButton.addEventListener('click', function(e) {
    e.preventDefault();
    if (editor.textContent.trim() === '') {
        alert('The note is already empty!');
        return;
    }
    
    // Show modal
    confirmModal.classList.remove('hidden');
});

// Modal confirmation buttons
confirmYes.addEventListener('click', function() {
    editor.innerHTML = '';
    localStorage.setItem('notes', '');
    updateDownloadButton();
    confirmModal.classList.add('hidden');
});

confirmNo.addEventListener('click', function() {
    confirmModal.classList.add('hidden');
});

// Close modal when clicking on overlay
const modalOverlay = document.querySelector('.modal-overlay');
modalOverlay.addEventListener('click', function() {
    confirmModal.classList.add('hidden');
});

// Initialize button state
updateDownloadButton();
updateBoldButtonState();
updateAlignmentButtons();

downloadButton.addEventListener('click', function() {
    const notes = editor.textContent.trim();
    if (!notes) {
        alert('Please type something before downloading a PDF.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Map the editor font-family to a jsPDF-safe font
    const editorStyles = window.getComputedStyle(editor);
    const family = (editorStyles.fontFamily || '').toLowerCase();
    let baseFont = 'helvetica';
    if (family.includes('courier')) baseFont = 'courier';
    else if (family.includes('times')) baseFont = 'times';

    const pageMargin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 20;
    
    // Helper function to process a node and its children
    function processNode(node, parentStyles = {}) {
        const nodes = [];
        
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                nodes.push({
                    text: text,
                    fontSize: parentStyles.fontSize || 14,
                    bold: parentStyles.bold || false,
                    align: parentStyles.align || 'left'
                });
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            const styles = window.getComputedStyle(element);
            
            // Combine parent styles with current element styles
            const currentStyles = {
                fontSize: parseInt(styles.fontSize) || (parentStyles.fontSize || 14),
                bold: (styles.fontWeight === 'bold' || parseInt(styles.fontWeight) >= 700) || parentStyles.bold || false,
                align: styles.textAlign || parentStyles.align || 'left'
            };
            
            // Process all child nodes
            Array.from(element.childNodes).forEach(child => {
                nodes.push(...processNode(child, currentStyles));
            });
        }
        
        return nodes;
    }
    
    // Extract all styled text nodes
    const styledNodes = processNode(editor);
    
    // Add text to PDF with styling
    styledNodes.forEach(nodeInfo => {
        doc.setFontSize(nodeInfo.fontSize);
        doc.setFont(baseFont, nodeInfo.bold ? 'bold' : 'normal');
        
        // Handle text alignment
        let xPos = pageMargin;
        let alignment = 'left';
        
        if (nodeInfo.align === 'center') {
            xPos = pageWidth / 2;
            alignment = 'center';
        } else if (nodeInfo.align === 'right') {
            xPos = pageWidth - pageMargin;
            alignment = 'right';
        }
        
        // Handle line breaks in text
        const lineHeight = nodeInfo.fontSize * 1.25;
        const lines = nodeInfo.text.split('\n');
        lines.forEach((line, index) => {
            if (line.trim()) {
                doc.text(line, xPos, y, { maxWidth: pageWidth - 40, align: alignment });
                y += lineHeight;
            } else if (index < lines.length - 1) {
                y += lineHeight / 2; // Small gap for empty lines
            }
            
            // Handle page breaks
            if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
            }
        });
    });

    doc.save('notes.pdf');
});