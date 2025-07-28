// models/Nomina.js

// ✅ CORRECCIÓN: Se añade la palabra 'export'
export class Nomina {
    constructor({ codigo, fecha_inicial, fecha_final }) {
        this.codigo = codigo;
        this.fecha_inicial = fecha_inicial;
        this.fecha_final = fecha_final;
    }
}