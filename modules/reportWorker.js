import { parentPort, workerData } from 'worker_threads';
import { 
    generateActiveEmployeesHTML, 
    generatePayrollDetailsHTML, 
    generateTransportAllowanceHTML, 
    generatePayrollSummaryHTML 
} from './htmlGenerator.js';

const { reportType, data } = workerData;
let htmlContent = '';

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

parentPort.postMessage(htmlContent);