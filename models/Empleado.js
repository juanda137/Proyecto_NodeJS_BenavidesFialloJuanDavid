export class Empleado {
    constructor({
        tipo_identificacion, numero_identificacion, nombres, apellidos, genero, activo,
        direccion_descripcion, direccion_ciudad, direccion_departamento,
        contrato_fecha_inicio, contrato_salario_base, contrato_activo,
        contrato_tipo_codigo, contrato_cargo_codigo, contrato_area_codigo
    }) {
        this.tipo_identificacion = tipo_identificacion;
        this.numero_identificacion = numero_identificacion;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.genero = genero;
        this.activo = activo;
        this.direccion = {
            descripcion: direccion_descripcion,
            ciudad: direccion_ciudad,
            departamento: direccion_departamento
        };
        this.contrato = {
            fecha_inicio: contrato_fecha_inicio,
            salario_base: contrato_salario_base,
            activo: contrato_activo,
            tipo_codigo: contrato_tipo_codigo,
            cargo_codigo: contrato_cargo_codigo,
            area_codigo: contrato_area_codigo
        };
    }

    getFullName() {
        return `${this.nombres} ${this.apellidos}`;
    }
}