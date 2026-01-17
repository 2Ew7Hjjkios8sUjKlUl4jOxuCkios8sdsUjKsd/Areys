
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, PageBreak } = require('docx');

const doc = new Document({
    sections: [{
        children: [
            new Paragraph({
                children: [
                    new TextRun({
                        text: "{#passengers}",
                    }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: "TRAVEL AGENCY TICKET",
                        bold: true,
                        size: 48,
                        color: "2563EB",
                    }),
                ],
            }),
            new Paragraph({ spacing: { before: 400 } }),
            new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Passenger Name:", bold: true })] })],
                            }),
                            new TableCell({
                                children: [new Paragraph("{name}")],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Ticket Type:", bold: true })] })],
                            }),
                            new TableCell({
                                children: [new Paragraph("{type}")],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Ticket Number:", bold: true })] })],
                            }),
                            new TableCell({
                                children: [new Paragraph("{ticketNumber}")],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Travel Date:", bold: true })] })],
                            }),
                            new TableCell({
                                children: [new Paragraph("{date}")],
                            }),
                        ],
                    }),
                ],
            }),
            new Paragraph({
                spacing: { before: 1000 },
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: "Thank you for choosing our Travel Agency!",
                        italics: true,
                        color: "64748B",
                    }),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: "{/passengers}",
                    }),
                    new PageBreak(),
                ],
            }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    if (!fs.existsSync('./public')) {
        fs.mkdirSync('./public');
    }
    fs.writeFileSync('./public/template.docx', buffer);
    console.log('Template created successfully at ./public/template.docx');
});
