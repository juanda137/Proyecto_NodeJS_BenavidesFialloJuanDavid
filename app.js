import readline from 'readline'
import { MongoClient, ObjectId } from 'mongodb'
import fs, { read } from 'fs'
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

function readData() {
    try {
        const data = fs.readFileSync('', 'utf-8');

        const lines = data.trim().split('\n');

        if (lines.length <= 1) {
            return [];
        }

        const headers = lines[0].split(',').map(header => header.trim());

        const registros = lines.slice(1).map(line => {
            const values = line.split(',').map(value => value.trim());
            const record = {};
            
            headers.forEach((header, index) => {
                record[header] = values[index];
            });

            return record;
        });

        console.log(data)
        console.log(registros)
        
        return registros;

    } catch (error) {
        console.error("Error al leer el archivo datos.csv:", error);
    }
}

menu()