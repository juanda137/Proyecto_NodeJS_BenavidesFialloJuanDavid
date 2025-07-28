import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://juanda137:uqp14GiQqbBzOE5c@juandavidcampus.skhedga.mongodb.net/";
const client = new MongoClient(uri);
const dbName = 'payrollDB';

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
    }
    return result;
}

export async function getActiveEmployeesByAreaAndPosition() {
    const pipeline = [
        { $match: { "contrato.activo": true } },
        { $lookup: { from: 'areas', localField: 'contrato.area_codigo', foreignField: 'codigo', as: 'areaInfo' } },
        { $lookup: { from: 'cargo', localField: 'contrato.cargo_codigo', foreignField: 'codigo', as: 'cargoInfo' } },
        { $unwind: '$areaInfo' },
        { $unwind: '$cargoInfo' },
        { $project: {
            _id: 0,
            area: { codigo: '$areaInfo.codigo', nombre: '$areaInfo.nombre' },
            cargo: { codigo: '$cargoInfo.codigo', nombre: '$cargoInfo.nombre' },
            tipo_identificacion: 1,
            numero_identificacion: 1,
            nombres: 1,
            apellidos: 1,
            genero: 1
        }},
        { $sort: { 'area.nombre': 1, 'cargo.nombre': 1 } }
    ];
    return runAggregation('empleados', pipeline);
}

export async function getPayrollDetailsForEmployee(employeeId, payrollId) {
    const pipeline = [
        { $match: { empleado_identificacion: employeeId, nomina_codigo: payrollId } },
        { $lookup: { from: 'empleados', localField: 'empleado_identificacion', foreignField: 'numero_identificacion', as: 'empleadoInfo' } },
        { $unwind: '$empleadoInfo' },
        { $project: {
            _id: 0,
            tipo_identificacion: '$empleadoInfo.tipo_identificacion',
            numero_identificacion: '$empleadoInfo.numero_identificacion',
            nombres: '$empleadoInfo.nombres',
            apellidos: '$empleadoInfo.apellidos',
            salario_base: '$empleadoInfo.contrato.salario_base', 
            devengos: 1,
            deducciones: 1
        }}
    ];
    return runAggregation('desprendibles', pipeline);
}

export async function getEmployeesWithTransportAllowance() {
    const pipeline = [
        { $match: { 'devengos.codigo': 'AUX_TRANS' } },
        { $lookup: { from: 'empleados', localField: 'empleado_identificacion', foreignField: 'numero_identificacion', as: 'empleadoInfo' } },
        { $unwind: '$empleadoInfo' },
        { $match: { 'empleadoInfo.contrato.activo': true } },
        { $lookup: { from: 'areas', localField: 'empleadoInfo.contrato.area_codigo', foreignField: 'codigo', as: 'areaInfo' } },
        { $lookup: { from: 'cargo', localField: 'empleadoInfo.contrato.cargo_codigo', foreignField: 'codigo', as: 'cargoInfo' } },
        { $unwind: '$areaInfo' },
        { $unwind: '$cargoInfo' },
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

export async function getPayrollSummary(payrollId) {
    const pipeline = [
        { $match: { nomina_codigo: payrollId } },
        { $lookup: { from: 'empleados', localField: 'empleado_identificacion', foreignField: 'numero_identificacion', as: 'empleadoInfo' } },
        { $unwind: '$empleadoInfo' },
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