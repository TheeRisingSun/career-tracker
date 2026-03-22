import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generateLinksPdf(user, labels, groupedLinks) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(`${labels.logo} - Saved ${labels.moduleLinks}`, 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`User: ${user?.name || 'User'}`, 14, 30);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);

  let currentY = 45;

  // Iterate through groups
  // grouped: { [paper]: { [subject]: { [chapter]: { [topic]: [links] } } } }
  Object.entries(groupedLinks).forEach(([paper, subjects]) => {
    // Check for page break
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(paper, 14, currentY);
    currentY += 2;
    doc.line(14, currentY, pageW - 14, currentY);
    currentY += 8;

    Object.entries(subjects).forEach(([subj, chapters]) => {
      Object.entries(chapters).forEach(([chap, topics]) => {
        Object.entries(topics).forEach(([topic, links]) => {
          
          const rows = links.map(l => [
            l.title || 'No title',
            { content: l.url, underline: true, textColor: [0, 0, 255] }
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [[`${subj} > ${chap} > ${topic}`, 'URL']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [80, 80, 80], fontSize: 10 },
            styles: { fontSize: 9 },
            columnStyles: {
              1: { cellWidth: 100 }
            },
            didDrawCell: (data) => {
              // Make URL clickable
              if (data.section === 'body' && data.column.index === 1) {
                const link = links[data.row.index];
                if (link && link.url) {
                  doc.link(data.cell.x + 2, data.cell.y + 2, data.cell.width - 4, data.cell.height - 4, { url: link.url });
                }
              }
            },
            margin: { left: 14 }
          });

          currentY = doc.lastAutoTable.finalY + 10;
          
          if (currentY > 260) {
            doc.addPage();
            currentY = 20;
          }
        });
      });
    });
    
    currentY += 5;
  });

  const filename = `${user?.name || 'user'}-${labels.moduleLinks.replace(/\s+/g, '-')}-List.pdf`;
  doc.save(filename);
}
