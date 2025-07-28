// modules/readData.js
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const uri = "mongodb+srv://juanda137:uqp14GiQqbBzOE5c@juandavidcampus.skhedga.mongodb.net/";
const client = new MongoClient(uri);
const dbName = 'payrollDB';

// Un parser de CSV robusto que maneja campos entrecomillados.
function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes) {
            inQuotes = false;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
}

function readCsvFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const jsonFields = ['devengos', 'deducciones', 'novedades'];

    return lines.slice(1).map(line => {
        const values = parseCsvLine(line);
        const record = {};
        headers.forEach((header, index) => {
            let value = values[index] || '';

            if (jsonFields.includes(header)) {
                // Ahora podemos confiar en que es un JSON válido
                try {
                    record[header] = JSON.parse(value);
                } catch {
                    record[header] = [];
                }
            } else if (value === 'true' || value === 'false') {
                record[header] = (value === 'true');
            } else if (!isNaN(value) && value.trim() !== '') {
                record[header] = Number(value);
            } else {
                record[header] = value;
            }
        });
        return record;
    });
}

export async function uploadData() {
    try {
        await client.connect();
        console.log("Conexión exitosa a MongoDB.");
        const db = client.db(dbName);
        const dataDir = path.join(process.cwd(), 'data');
        const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));

        for (const file of files) {
            const collectionName = path.basename(file, '.csv');
            console.log(`\nProcesando: ${collectionName}...`);
            const records = readCsvFile(path.join(dataDir, file));

            if (records.length > 0) {
                await db.collection(collectionName).deleteMany({});
                const result = await db.collection(collectionName).insertMany(records);
                console.log(` -> Éxito: ${result.insertedCount} documentos insertados.`);
            }
        }
    } catch (error) {
        console.error('ERROR EN LA CARGA DE DATOS:', error);
    } finally {
        await client.close();
        console.log("\nConexión con MongoDB cerrada.");
    }
}