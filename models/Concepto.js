// models/Concepto.js
import { Entidad } from './Entidad.js';

// ✅ CORRECCIÓN: Se añade la palabra 'export'
export class Concepto extends Entidad {
    constructor({ codigo, nombre, activo, tipo, porcentaje }) {
        super({ codigo, nombre, activo });
        this.tipo = tipo; 
        this.porcentaje = porcentaje;
    }
}