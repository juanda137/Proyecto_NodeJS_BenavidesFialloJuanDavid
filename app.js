import readline from 'readline'
import { MongoClient, ObjectId } from 'mongodb'
import fs from 'fs'
import path from 'path'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

async function menu() {
    console.log('\n=== PAYROLL MANAGER ===')
    console.log('1. Read data')
    console.log('2. Reports')
    console.log('3. Exit\n')

    rl.question('Option: ', op => {
        switch (op) {
            case '1': readData(); break;
            case '2': payrollMenu(); break;
            case '3': rl.close(); break;
            default:
                console.log('Invalid option.'); menu()
        }
    })
}
async function payrollMenu() {
    console.log('\n===== PAYROLL REPORTS MENU =====');
    console.log('1. List Employees by Department and Job Title');
    console.log('2. View Employee Payroll Details');
    console.log('3. List Employees with Transportation Allowance');
    console.log('4. View General Payroll Summary');
    console.log('5. Exit\n');
    rl.question('opcion: ', op => {
        switch (op) {
            case '1':  listEmployersDepartmentJobTitle(); break;
            case '2':  employersPayrollDetail(); break;
            case '3':  listEmployersTransportAllowance(); break;
            case '4':  payrollSummary(); break;
            case '5':  menu(); break;
            default:
                console.log('Invalid option.'); payrollMenu()
        }
    })
}

function parseCSV(csvContent) {
    // Divide el contenido en líneas, ignorando la última si está vacía.
    const lines = csvContent.trim().split('\n');
    
    // La primera línea contiene los encabezados (nombres de las columnas).
    const headers = lines[0].split(',').map(header => header.trim());

    const results = [];

    // Itera sobre las líneas de datos (a partir de la segunda línea).
    for (let i = 1; i < lines.length; i++) {
        // Expresión regular para dividir por comas, excepto las que están dentro de comillas.
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        const entry = {};
        for (let j = 0; j < headers.length; j++) {
            let value = values[j] ? values[j].trim() : '';

            // Limpia las comillas del inicio y el final si existen.
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }
            entry[headers[j]] = value;
        }
        results.push(entry);
    }
    populateDatabaseFromScratch()
    return results;
}

async function populateDatabaseFromScratch() {
    const uri = "mongodb://localhost:27017"; // Reemplaza con tu URL
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const database = client.db('tuBaseDeDatos'); // Reemplaza con tu BD
        console.log('✅ Conectado a MongoDB.');

        const dataDir = path.join(__dirname, 'data');
        const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.csv'));

        for (const file of files) {
            const collectionName = path.basename(file, '.csv');
            const filePath = path.join(dataDir, file);

            // 1. Leer el archivo usando 'fs'
            const fileContent = fs.readFileSync(filePath, 'utf8');

            // 2. Procesar el contenido con nuestra función manual
            const documents = parseCSV(fileContent);

            if (documents.length > 0) {
                const collection = database.collection(collectionName);
                await collection.deleteMany({}); // Opcional: limpiar colección
                
                // 3. Insertar los documentos en MongoDB
                await collection.insertMany(documents);
                console.log(`👍 ${documents.length} documentos insertados en '${collectionName}'.`);
            }
        }

    } catch (error) {
        console.error('❌ Error durante el proceso:', error);
    } finally {
        await client.close();
        console.log('🔌 Conexión a MongoDB cerrada.');
    }
}

menu()