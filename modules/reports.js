// modules/reports.js
import { MongoClient } from 'mongodb';

// Mantenemos tu URI de Atlas
const uri = "mongodb+srv://juanda137:uqp14GiQqbBzOE5c@juandavidcampus.skhedga.mongodb.net/";
const client = new MongoClient(uri);
const dbName = 'payrollDB';

// La función de abajo no cambia, solo las consultas de los reportes
async function runAggregation(collectionName, pipeline) {
    let result = [];
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        result = await collection.aggregate(pipeline).toArray();
        console.log(`[INFO] La consulta en '${collectionName}' devolvió ${result.length} resultados.`);
    } catch (error) {
        console.error(`[ERROR] Durante la agregación en ${collectionName}:`, error);
    } finally {
        await client.close();
        return result;
    }
}

/**
 * REPORTE 1: Listado de empleados activos por área y cargo.
 */
export async function getActiveEmployeesByAreaAndPosition() {
    const pipeline = [
        // 1. Filtra solo los empleados cuyo contrato esté activo
        { $match: { "contrato.activo": true } },
        // 2. Une con la colección 'areas' usando el código del contrato
        { $lookup: { from: 'areas', localField: 'contrato.area_codigo', foreignField: 'codigo', as: 'areaInfo' } },
        // 3. Une con la colección 'cargos' usando el código del contrato
        { $lookup: { from: 'cargos', localField: 'contrato.cargo_codigo', foreignField: 'codigo', as: 'cargoInfo' } },
        // 4. Descomprime los resultados de los lookups
        { $unwind: '$areaInfo' },
        { $unwind: '$cargoInfo' },
        // 5. Proyecta y formatea los campos finales requeridos
        { $project: {
            _id: 0,
            area: { codigo: '$areaInfo.codigo', nombre: '$areaInfo.nombre' },
            cargo: { codigo: '$cargoInfo.codigo', nombre: '$cargoInfo.nombre' },
            tipo_identificacion: 1,
            numero_identificacion: 1,
            nombres: 1,
            apellidos: 1,
            genero: 1 // Incluimos el género como se pedía
        }},
        // 6. Ordena el resultado
        { $sort: { 'area.nombre': 1, 'cargo.nombre': 1 } }
    ];
    return runAggregation('empleados', pipeline);
}

/**
 * REPORTE 2: Detalle de nómina para un empleado específico.
 */
export async function getPayrollDetailsForEmployee(employeeId, payrollId) {
    const pipeline = [
        // 1. Busca el desprendible específico por ID de empleado y nómina
        { $match: { empleado_identificacion: employeeId, nomina_codigo: payrollId } },
        // 2. Une con la colección 'empleados' para obtener los datos personales
        { $lookup: { from: 'empleados', localField: 'empleado_identificacion', foreignField: 'numero_identificacion', as: 'empleadoInfo' } },
        { $unwind: '$empleadoInfo' },
        // 3. Proyecta y formatea los campos finales
        { $project: {
            _id: 0,
            tipo_identificacion: '$empleadoInfo.tipo_identificacion',
            numero_identificacion: '$empleadoInfo.numero_identificacion',
            nombres: '$empleadoInfo.nombres',
            apellidos: '$empleadoInfo.apellidos',
            // Usa la ruta anidada correcta para el salario base
            salario_base: '$empleadoInfo.contrato.salario_base', 
            devengos: 1, // El array de devengos del desprendible
            deducciones: 1 // El array de deducciones del desprendible
        }}
    ];
    return runAggregation('desprendibles', pipeline);
}

/**
 * REPORTE 3: Empleados activos con derecho a auxilio de transporte.
 */
export async function getEmployeesWithTransportAllowance() {
    const pipeline = [
        // 1. Primero, busca los desprendibles que incluyan el auxilio de transporte
        { $match: { 'devengos.codigo': 'AUX_TRANS' } },
        // 2. Une con la colección de empleados
        { $lookup: { from: 'empleados', localField: 'empleado_identificacion', foreignField: 'numero_identificacion', as: 'empleadoInfo' } },
        { $unwind: '$empleadoInfo' },
        // 3. De esos resultados, filtra solo los que tengan contrato activo
        { $match: { 'empleadoInfo.contrato.activo': true } },
        // 4. Une con áreas y cargos
        { $lookup: { from: 'areas', localField: 'empleadoInfo.contrato.area_codigo', foreignField: 'codigo', as: 'areaInfo' } },
        { $lookup: { from: 'cargos', localField: 'empleadoInfo.contrato.cargo_codigo', foreignField: 'codigo', as: 'cargoInfo' } },
        { $unwind: '$areaInfo' },
        { $unwind: '$cargoInfo' },
        // 5. Proyecta y formatea los campos finales
        { $project: {
            _id: 0,
            area: { codigo: '$areaInfo.codigo', nombre: '$areaInfo.nombre' },
            cargo: { codigo: '$cargoInfo.codigo', nombre: '$cargoInfo.nombre' },
            tipo_identificacion: '$empleadoInfo.tipo_identificacion',
            numero_identificacion: '$empleadoInfo.numero_identificacion',
            nombres: '$empleadoInfo.nombres',
            apellidos: '$empleadoInfo.apellidos',
            salario_base: '$empleadoInfo.contrato.salario_base'
        }},
        { $sort: { 'area.nombre': 1, 'cargo.nombre': 1 } }
    ];
    return runAggregation('desprendibles', pipeline);
}

/**
 * REPORTE 4: Resumen de una nómina específica.
 */
export async function getPayrollSummary(payrollId) {
    const pipeline = [
        // 1. Busca todos los desprendibles de una nómina
        { $match: { nomina_codigo: payrollId } },
        // 2. Une con empleados para obtener sus nombres
        { $lookup: { from: 'empleados', localField: 'empleado_identificacion', foreignField: 'numero_identificacion', as: 'empleadoInfo' } },
        { $unwind: '$empleadoInfo' },
        // 3. Proyecta los campos requeridos. 'salario_base' viene del desprendible, lo cual es correcto aquí.
        { $project: {
            _id: 0,
            nomina_codigo: 1,
            tipo_identificacion: '$empleadoInfo.tipo_identificacion',
            numero_identificacion: '$empleadoInfo.numero_identificacion',
            nombres: '$empleadoInfo.nombres',
            apellidos: '$empleadoInfo.apellidos',
            salario_base: 1,
            total_deducciones: 1,
            total_devengos: 1,
            neto_pagar: 1
        }},
        { $sort: { 'nombres': 1 } }
    ];
    return runAggregation('desprendibles', pipeline);
}