import fs from 'fs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType } from 'docx';

async function createTemplate(fileName, includePhone = true) {
    const manifestDoc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: includePhone ? "FLIGHT MANIFEST (OFFICE)" : "FLIGHT MANIFEST (AIRPORT)", bold: true, size: 32, color: "2563EB" })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                    children: [new TextRun({ text: "Flight Date: {flightDate}", bold: true, size: 24, color: "64748B" })],
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                createHeaderCell("No", 7),
                                createHeaderCell("NAME", includePhone ? 30 : 45),
                                createHeaderCell("F/M", 7),
                                ...(includePhone ? [createHeaderCell("PHONE", 18)] : []),
                                createHeaderCell("IFNT", 23),
                                createHeaderCell("PLACE", 15),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("{#passengers}{_index}")] })] }),
                                createDataCell("{name}"),
                                createDataCell("{gender}"),
                                ...(includePhone ? [createDataCell("{phoneNumber}")] : []),
                                createDataCell("{infants}"),
                                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("CDD-MUQ{/passengers}")] })] }),
                            ],
                        }),
                    ],
                }),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(manifestDoc);
    fs.writeFileSync(`./public/${fileName}`, buffer);
    console.log(`Success: Created ${fileName}`);
}

function createHeaderCell(text, width) {
    return new TableCell({
        width: { size: width, type: WidthType.PERCENTAGE },
        shading: { fill: "2563EB", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18 })] })],
    });
}

function createDataCell(text) {
    return new TableCell({
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, size: 18 })] })],
    });
}

// Create both templates
async function run() {
    if (!fs.existsSync('./public')) fs.mkdirSync('./public');
    await createTemplate('manifest_us.docx', true);
    await createTemplate('manifest_airport.docx', false);
}

run();
