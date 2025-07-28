// modules/readData.js (VERSIÓN DE DEPURACIÓN)
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { EntityFactory } from '../models/EntityFactory.js';

const uri = "mongodb+srv://juanda137:uqp14GiQqbBzOE5c@juandavidcampus.skhedga.mongodb.net/";
const client = new MongoClient(uri);
const dbName = 'payrollDB';

function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && !inQuotes && current === '') {
            inQuotes = true;
            continue;
        }
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else if (char === ',') {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
}

function readCsvFile(filePath, collectionName) {
    console.log(`\n[DEBUG-readData] ======================================`);
    console.log(`[DEBUG-readData] Leyendo archivo: ${path.basename(filePath)}`);
    console.log(`[DEBUG-readData] ======================================`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.replace(/\r/g, "").trim().split('\n');

    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    console.log(`[DEBUG-readData] Cabeceras detectadas:`, headers);

    return lines.slice(1).map((line, lineIndex) => {
        console.log(`\n[DEBUG-readData] ----- Procesando línea ${lineIndex + 1} -----`);
        console.log(`[DEBUG-readData] Línea cruda: "${line}"`);
        const values = parseCsvLine(line);
        console.log(`[DEBUG-readData] Valores parseados:`, values);
        
        const record = {};
        headers.forEach((header, index) => {
            let value = values[index] || '';
            // Primero, asignamos el valor crudo para depurar
            record[header] = value;
        });

        console.log(`[DEBUG-readData] Objeto crudo antes de conversión de tipos:`, record);

        // Ahora, procesamos para convertir los tipos
        headers.forEach((header, index) => {
            let value = record[header]; // Usamos el valor ya asignado
            const jsonFields = ['devengos', 'deducciones', 'novedades'];
            if (jsonFields.includes(header)) {
                try {
                    record[header] = JSON.parse(value);
                } catch (e) {
                    console.error(`[DEBUG-readData] ¡¡ERROR DE PARSEO JSON en ${header}!! Valor: "${value}"`);
                    record[header] = []; 
                }
            } else if (typeof value === 'string' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
                record[header] = (value.toLowerCase() === 'true');
            } else if (!isNaN(value) && value.trim() !== '') {
                record[header] = Number(value);
            }
        });
        
        console.log(`[DEBUG-readData] Objeto final antes de pasar a la fábrica:`, record);
        const entity = EntityFactory.create(collectionName, record);
        console.log(`[DEBUG-readData] Entidad creada por la fábrica:`, entity);
        return entity;
    });
}

// uploadData no necesita cambios de depuración significativos por ahora
export async function uploadData() {
    const session = client.startSession();
    try {
        await client.connect();
        console.log("Conexión exitosa a MongoDB.");
        const db = client.db(dbName);
        const dataDir = path.join(process.cwd(), 'data');
        const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));

        await session.withTransaction(async () => {
            console.log("\n--- Iniciando transacción de carga de datos ---");
            for (const file of files) {
                const collectionName = path.basename(file, '.csv');
                const collection = db.collection(collectionName);
                const records = readCsvFile(path.join(dataDir, file), collectionName);
                if (records.length > 0) {
                    await collection.deleteMany({}, { session });
                    const result = await collection.insertMany(records, { session });
                    console.log(`\n -> Éxito: ${result.insertedCount} documentos para '${collectionName}' insertados en la transacción.`);
                }
            }
        });
        console.log("\n--- Transacción completada con éxito. ---");
    } catch (error) {
        console.error('\n--- ERROR: La transacción ha fallado y ha sido revertida ---');
        console.error(error.message);
    } finally {
        await session.endSession();
        await client.close();
        console.log("\nConexión con MongoDB cerrada.");
    }
}