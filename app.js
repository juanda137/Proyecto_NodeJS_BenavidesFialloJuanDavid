import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';
import { uploadData } from './modules/readData.js';
import { getActiveEmployeesByAreaAndPosition, getPayrollDetailsForEmployee, getEmployeesWithTransportAllowance, getPayrollSummary } from './modules/reports.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (query) => new Promise(resolve => rl.question(query, resolve));

function runReportWorker(reportType, data) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./modules/reportWorker.js', {
            workerData: {
                reportType: reportType,
                data: data
            }
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Error: ${code}`));
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
    console.log(`\nReporte guardado exitosamente en: ${filePath}\n`);
}

async function payrollMenu() {
    let keepInMenu = true;
    while (keepInMenu) {
        console.log('\n===== GENERAR REPORTES EN HTML =====');
        console.log('1. Listar Empleados por Departamento y Cargo');
        console.log('2. Ver Detalles de Nómina de un Empleado');
        console.log('3. Listar Empleados con Auxilio de Transporte');
        console.log('4. Ver Resumen General de la Nómina');
        console.log('5. Volver al menú principal\n');

        const op = await question('Opción: ');

        switch (op) {
            case '1': {
                const data = await getActiveEmployeesByAreaAndPosition();
                if (data.length > 0) {
                    const html = await runReportWorker('activeEmployees', data);
                    saveReportToFile('Reporte_Empleados_Activos', html);
                } else {
                    console.log('\nNo se encontraron datos para generar el reporte');
                }
                break;
            }
            case '2': {
                const employeeId = await question('Número de identificación del empleado: ');
                const payrollId = await question('Código de la nómina (ej: NOM-2025-01): ');
                const data = await getPayrollDetailsForEmployee(Number(employeeId), payrollId);
                if (data.length > 0) {
                    const html = await runReportWorker('payrollDetails', data);
                    saveReportToFile(`Detalle_Nomina_${employeeId}_${payrollId}`, html);
                } else {
                    console.log('\nNo se encontraron datos para la combinación de empleado y nómina');
                }
                break;
            }
            case '3': {
                const data = await getEmployeesWithTransportAllowance();
                if (data.length > 0) {
                    const html = await runReportWorker('transportAllowance', data);
                    saveReportToFile('Reporte_Auxilio_Transporte', html);
                } else {
                    console.log('\nNo se encontraron empleados con auxilio de transporte');
                }
                break;
            }
            case '4': {
                const payrollId = await question('Código de la nómina (ej: NOM-2025-01): ');
                const data = await getPayrollSummary(payrollId);
                if (data.length > 0) {
                    const html = await runReportWorker('payrollSummary', data);
                    saveReportToFile(`Resumen_Nomina_${payrollId}`, html);
                } else {
                    console.log('\nNo se encontraron datos para esa nómina');
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
        console.log('1. Cargar datos a MongoDB');
        console.log('2. Generar Reportes');
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