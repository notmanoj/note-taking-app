const notesTextarea = document.getElementById('notes');
const downloadButton = document.getElementById('downloadPdf');

// Load saved notes
const savedNotes = localStorage.getItem('notes');
if (savedNotes) {
    notesTextarea.value = savedNotes;
}

const hintMessage = document.getElementById('hintMessage');

function updateDownloadButton() {
    const hasText = notesTextarea.value.trim().length > 0;
    downloadButton.disabled = !hasText;
    downloadButton.style.opacity = hasText ? '1' : '0.5';
    downloadButton.title = hasText ? 'Download your notes as a PDF' : 'Note is empty — type something to enable download';

    hintMessage.textContent = hasText
        ? ''
        : 'The note is empty — type something to enable downloading a PDF.';
}

// Save notes on input + update button state
notesTextarea.addEventListener('input', function() {
    localStorage.setItem('notes', notesTextarea.value);
    updateDownloadButton();
});

// Initialize button state
updateDownloadButton();

downloadButton.addEventListener('click', function() {
    const notes = notesTextarea.value.trim();
    if (!notes) {
        alert('Please type something before downloading a PDF.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lines = notes.split('\n');

    let y = 20;
    lines.forEach(line => {
        doc.text(line, 20, y);
        y += 10;
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
    });

    doc.save('notes.pdf');
});