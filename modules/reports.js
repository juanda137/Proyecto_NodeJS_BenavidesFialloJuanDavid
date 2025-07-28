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
        console.log(`[DEBUG] Ejecutando pipeline:\n${JSON.stringify(pipeline, null, 2)}`);
        result = await collection.aggregate(pipeline).toArray();
        console.log(`[DEBUG] La consulta devolvió ${result.length} resultados.`);
    } catch (error) {
        console.error("[DEBUG] ERROR durante la agregación:", error);
    } finally {
        await client.close();
        return result;
    }
}

/**
 * REPORTE 1: CORREGIDO
 */
export async function getActiveEmployeesByAreaAndPosition() {
    const pipeline = [
        // --- LA CORRECCIÓN ESTÁ AQUÍ ---
        // Buscamos el string "true" en lugar del booleano true
        { $match: { contrato_activo: "true" } },
        { $lookup: { from: 'areas', localField: 'contrato_area_codigo', foreignField: 'codigo', as: 'areaInfo' } },
        { $lookup: { from: 'cargos', localField: 'contrato_cargo_codigo', foreignField: 'codigo', as: 'cargoInfo' } },
        { $unwind: '$areaInfo' },
        { $unwind: '$cargoInfo' },
        { $project: { _id: 0, area: { codigo: '$areaInfo.codigo', nombre: '$areaInfo.nombre' }, cargo: { codigo: '$cargoInfo.codigo', nombre: '$cargoInfo.nombre' }, tipo_identificacion: 1, numero_identificacion: 1, nombres: 1, apellidos: 1, genero: 1 } },
        { $sort: { 'area.nombre': 1, 'cargo.nombre': 1 } }
    ];
    return runAggregation('empleados', pipeline);
}

/**
 * REPORTE 2: Sin cambios, ya funciona por ID.
 */
export async function getPayrollDetailsForEmployee(employeeId, payrollId) {
    const pipeline = [
        { $match: { empleado_identificacion: employeeId, nomina_codigo: payrollId } },
        { $lookup: { from: 'empleados', localField: 'empleado_identificacion', foreignField: 'numero_identificacion', as: 'empleadoInfo' } },
        { $unwind: '$empleadoInfo' },
        { $project: { _id: 0, tipo_identificacion: '$empleadoInfo.tipo_identificacion', numero_identificacion: '$empleadoInfo.numero_identificacion', nombres: '$empleadoInfo.nombres', apellidos: '$empleadoInfo.apellidos', salario_base: 1, devengos: 1, deducciones: 1 } }
    ];
    return runAggregation('desprendibles', pipeline);
}

/**
 * REPORTE 3: CORREGIDO
 */
export async function getEmployeesWithTransportAllowance() {
    const pipeline = [
        { $match: { 'devengos.codigo': 'AUX_TRANS' } },
        { $lookup: { from: 'empleados', localField: 'empleado_identificacion', foreignField: 'numero_identificacion', as: 'empleadoInfo' } },
        { $unwind: '$empleadoInfo' },
        // --- LA CORRECCIÓN ESTÁ AQUÍ ---
        { $match: { 'empleadoInfo.contrato_activo': "true" } },
        { $lookup: { from: 'areas', localField: 'empleadoInfo.contrato_area_codigo', foreignField: 'codigo', as: 'areaInfo' } },
        { $lookup: { from: 'cargos', localField: 'empleadoInfo.contrato_cargo_codigo', foreignField: 'codigo', as: 'cargoInfo' } },
        { $unwind: '$areaInfo' },
        { $unwind: '$cargoInfo' },
        { $project: { _id: 0, area: { codigo: '$areaInfo.codigo', nombre: '$areaInfo.nombre' }, cargo: { codigo: '$cargoInfo.codigo', nombre: '$cargoInfo.nombre' }, tipo_identificacion: '$empleadoInfo.tipo_identificacion', numero_identificacion: '$empleadoInfo.numero_identificacion', nombres: '$empleadoInfo.nombres', apellidos: '$empleadoInfo.apellidos', salario_base: '$empleadoInfo.contrato_salario_base' } },
        { $sort: { 'area.nombre': 1, 'cargo.nombre': 1 } }
    ];
    return runAggregation('desprendibles', pipeline);
}

/**
 * REPORTE 4: Sin cambios, ya funciona por nómina.
 */
export async function getPayrollSummary(payrollId) {
    const pipeline = [
        { $match: { nomina_codigo: payrollId } },
        { $lookup: { from: 'empleados', localField: 'empleado_identificacion', foreignField: 'numero_identificacion', as: 'empleadoInfo' } },
        { $unwind: '$empleadoInfo' },
        { $project: { _id: 0, nomina_codigo: 1, tipo_identificacion: '$empleadoInfo.tipo_identificacion', numero_identificacion: '$empleadoInfo.numero_identificacion', nombres: '$empleadoInfo.nombres', apellidos: '$empleadoInfo.apellidos', salario_base: 1, total_deducciones: 1, total_devengos: 1, neto_pagar: 1 } },
        { $sort: { 'nombres': 1 } }
    ];
    return runAggregation('desprendibles', pipeline);
}