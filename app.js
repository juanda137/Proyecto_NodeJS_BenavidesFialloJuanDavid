// app.js
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads'; // Importamos el Worker de Node.js
import { uploadData } from './modules/readData.js';
import { getActiveEmployeesByAreaAndPosition, getPayrollDetailsForEmployee, getEmployeesWithTransportAllowance, getPayrollSummary } from './modules/reports.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (query) => new Promise(resolve => rl.question(query, resolve));

/**
 * Función de ayuda para ejecutar el worker de reportes.
 * @param {string} reportType - El tipo de reporte a generar.
 * @param {object} data - Los datos para el reporte.
 * @returns {Promise<string>} Una promesa que se resuelve con el contenido HTML.
 */
function runReportWorker(reportType, data) {
    return new Promise((resolve, reject) => {
        // Creamos un nuevo worker, pasándole el script y los datos que necesita.
        const worker = new Worker('./modules/reportWorker.js', {
            workerData: {
                reportType: reportType,
                data: data
            }
        });

        // Escuchamos el mensaje de vuelta del worker
        worker.on('message', resolve);
        // Escuchamos por si hay errores
        worker.on('error', reject);
        // Escuchamos cuando el worker termina
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`El worker se detuvo con el código de salida ${code}`));
            }
        });
    });
}

function saveReportToFile(reportName, htmlContent) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
    }
    const filePath = path.join(reportsDir, `${reportName}.html`);
    fs.writeFileSync(filePath, htmlContent);
    console.log(`\n[DEBUG - app] ✅ ¡Reporte guardado exitosamente en: ${filePath}!\n`);
}

async function payrollMenu() {
    let keepInMenu = true;
    while (keepInMenu) {
        console.log('\n===== GENERAR REPORTES EN HTML (CON WORKERS) =====');
        console.log('1. Listar Empleados por Departamento y Cargo');
        console.log('2. Ver Detalles de Nómina de un Empleado');
        console.log('3. Listar Empleados con Auxilio de Transporte');
        console.log('4. Ver Resumen General de la Nómina');
        console.log('5. Volver al menú principal\n');

        const op = await question('Opción: ');

        switch (op) {
            case '1': {
                console.log('[DEBUG - app] Iniciando Reporte 1...');
                const data = await getActiveEmployeesByAreaAndPosition();
                console.log(`[DEBUG - app] Datos recibidos. Enviando al worker...`);
                if (data.length > 0) {
                    const html = await runReportWorker('activeEmployees', data);
                    saveReportToFile('Reporte_Empleados_Activos', html);
                } else {
                    console.log('[DEBUG - app] ❌ No se encontraron datos para generar el reporte.');
                }
                break;
            }
            case '2': {
                const employeeId = await question('ID del empleado: ');
                const payrollId = await question('Código de la nómina (ej: NOM-2025-01): ');
                console.log(`[DEBUG - app] Iniciando Reporte 2 para empleado ${employeeId}...`);
                const data = await getPayrollDetailsForEmployee(Number(employeeId), payrollId);
                console.log(`[DEBUG - app] Datos recibidos. Enviando al worker...`);
                if (data.length > 0) {
                    const html = await runReportWorker('payrollDetails', data);
                    saveReportToFile(`Detalle_Nomina_${employeeId}_${payrollId}`, html);
                } else {
                    console.log('[DEBUG - app] ❌ No se encontraron datos para la combinación de empleado y nómina.');
                }
                break;
            }
            case '3': {
                console.log('[DEBUG - app] Iniciando Reporte 3...');
                const data = await getEmployeesWithTransportAllowance();
                console.log(`[DEBUG - app] Datos recibidos. Enviando al worker...`);
                if (data.length > 0) {
                    const html = await runReportWorker('transportAllowance', data);
                    saveReportToFile('Reporte_Auxilio_Transporte', html);
                } else {
                    console.log('[DEBUG - app] ❌ No se encontraron empleados con auxilio de transporte.');
                }
                break;
            }
            case '4': {
                const payrollId = await question('Código de la nómina (ej: NOM-2025-01): ');
                console.log(`[DEBUG - app] Iniciando Reporte 4 para nómina ${payrollId}...`);
                const data = await getPayrollSummary(payrollId);
                console.log(`[DEBUG - app] Datos recibidos. Enviando al worker...`);
                if (data.length > 0) {
                    const html = await runReportWorker('payrollSummary', data);
                    saveReportToFile(`Resumen_Nomina_${payrollId}`, html);
                } else {
                    console.log('[DEBUG - app] ❌ No se encontraron datos para esa nómina.');
                }
                break;
            }
            case '5':
                keepInMenu = false;
                break;
            default:
                console.log('Opción no válida.');
                break;
        }
    }
}

async function main() {
    let keepAppRunning = true;
    while (keepAppRunning) {
        console.log('\n=== PAYROLL MANAGER ===');
        console.log('1. Cargar datos a MongoDB (con Transacción)');
        console.log('2. Generar Reportes (con Workers)');
        console.log('3. Salir\n');
        
        const op = await question('Opción: ');

        switch (op) {
            case '1':
                await uploadData();
                break;
            case '2':
                await payrollMenu();
                break;
            case '3':
                keepAppRunning = false;
                break;
            default:
                console.log('Opción no válida.');
                break;
        }
    }
    rl.close();
    console.log('¡Hasta luego!');
}

main();