import fs from 'fs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, PageBreak, BorderStyle } from 'docx';

const doc = new Document({
    sections: [{
        children: [
            new Paragraph({
                children: [
                    new TextRun({
                        text: "{#passengers}",
                        color: "CCCCCC",
                        size: 16,
                    }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: "FLY24 TRAVEL AGENCY",
                        bold: true,
                        size: 48,
                        color: "2563EB",
                    }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: "OFFICIAL ELECTRONIC TICKET",
                        size: 24,
                        color: "64748B",
                    }),
                ],
            }),
            new Paragraph({ spacing: { before: 400 } }),

            // Passenger Info Table
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PASSENGER NAME", bold: true, size: 20 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "{name}", size: 20 })] })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "BOOKING REF", bold: true, size: 20 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "{bookingrefrence}", size: 20 })] })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "FLIGHT NUMBER", bold: true, size: 20 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "{FlightNumber}", size: 20 })] })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TRAVEL DATE", bold: true, size: 20 })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "{Date}", size: 20 })] })] }),
                        ],
                    }),
                ],
            }),

            new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "INFANTS:", bold: true, color: "2563EB" })] }),
            new Paragraph({ children: [new TextRun({ text: "1. {IFNT1}" })] }),
            new Paragraph({ children: [new TextRun({ text: "2. {IFNT2}" })] }),
            new Paragraph({ children: [new TextRun({ text: "3. {IFNT3}" })] }),
            new Paragraph({ children: [new TextRun({ text: "4. {IFNT4}" })] }),
            new Paragraph({ children: [new TextRun({ text: "5. {IFNT5}" })] }),

            new Paragraph({ spacing: { before: 600 } }),

            // Pricing Table
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Base Fare", size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{price}", size: 18 })] })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Taxes", size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{Tax}", size: 18 })] })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Surcharge", size: 18 })] })] }),
                            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{Surcharge}", size: 18 })] })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL AMOUNT", bold: true, size: 24, color: "059669" })] })] }),
                            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "{TotalPrice}", bold: true, size: 24, color: "059669" })] })] }),
                        ],
                    }),
                ],
            }),

            new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Wish you a pleasant flight with Fly24!", italics: true, color: "64748B" })] }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: "{/passengers}",
                        color: "CCCCCC",
                        size: 16,
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
    console.log('Success: Example template created at ./public/template.docx');
});
