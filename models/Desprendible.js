// models/Desprendible.js

// ✅ CORRECCIÓN: Se añade la palabra 'export'
export class Desprendible {
    constructor({
        nomina_codigo, empleado_identificacion, salario_base, dias_liquidados,
        total_devengos, total_deducciones, neto_pagar,
        devengos, deducciones, novedades
    }) {
        this.nomina_codigo = nomina_codigo;
        this.empleado_identificacion = empleado_identificacion;
        this.salario_base = salario_base;
        this.dias_liquidados = dias_liquidados;
        this.total_devengos = total_devengos;
        this.total_deducciones = total_deducciones;
        this.neto_pagar = neto_pagar;
        this.devengos = devengos;
        this.deducciones = deducciones;
        this.novedades = novedades;
    }
}