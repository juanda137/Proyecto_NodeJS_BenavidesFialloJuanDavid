// modules/reportWorker.js
import { parentPort, workerData } from 'worker_threads';
import { 
    generateActiveEmployeesHTML, 
    generatePayrollDetailsHTML, 
    generateTransportAllowanceHTML, 
    generatePayrollSummaryHTML 
} from './htmlGenerator.js';

// Recibimos los datos y el tipo de reporte desde el hilo principal
const { reportType, data } = workerData;

let htmlContent = '';

// Usamos un switch para llamar a la función generadora correcta
switch (reportType) {
    case 'activeEmployees':
        htmlContent = generateActiveEmployeesHTML(data);
        break;
    case 'payrollDetails':
        htmlContent = generatePayrollDetailsHTML(data);
        break;
    case 'transportAllowance':
        htmlContent = generateTransportAllowanceHTML(data);
        break;
    case 'payrollSummary':
        htmlContent = generatePayrollSummaryHTML(data);
        break;
    default:
        throw new Error('Tipo de reporte desconocido en el worker.');
}

// Devolvemos el HTML generado al hilo principal
parentPort.postMessage(htmlContent);