// models/TipoContrato.js
import { Entidad } from './Entidad.js';

// ✅ CORRECCIÓN: Se añade la palabra 'export'
export class TipoContrato extends Entidad {
    constructor({ codigo, nombre, activo }) {
        super({ codigo, nombre, activo });
    }
}