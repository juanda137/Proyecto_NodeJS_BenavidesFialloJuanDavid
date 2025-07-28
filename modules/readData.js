// modules/readData.js
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { EntityFactory } from '../models/EntityFactory.js';

const uri = "mongodb+srv://juanda137:uqp14GiQqbBzOE5c@juandavidcampus.skhedga.mongodb.net/";
const client = new MongoClient(uri);
const dbName = 'payrollDB';

// La función parseCsvLine está bien, el problema no está aquí.
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
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // ✅ CORRECCIÓN DEFINITIVA: Eliminamos TODOS los caracteres de retorno de carro (\r)
    // antes de dividir el archivo en líneas. Esto normaliza los saltos de línea.
    const lines = fileContent.replace(/\r/g, "").trim().split('\n');

    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const jsonFields = ['devengos', 'deducciones', 'novedades'];

    return lines.slice(1).map(line => {
        const values = parseCsvLine(line);
        const record = {};
        headers.forEach((header, index) => {
            let value = values[index] || '';

            if (jsonFields.includes(header)) {
                try {
                    record[header] = JSON.parse(value);
                } catch {
                    record[header] = [];
                }
            } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                // Ahora la comparación funcionará porque 'true\r' ya no existe.
                record[header] = (value.toLowerCase() === 'true');
            } else if (!isNaN(value) && value.trim() !== '') {
                record[header] = Number(value);
            } else {
                record[header] = value;
            }
        });

        return EntityFactory.create(collectionName, record);
    });
}

// La función de carga se mantiene igual.
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
                    console.log(` -> Éxito: ${result.insertedCount} documentos para '${collectionName}' insertados.`);
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