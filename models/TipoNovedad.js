// models/TipoNovedad.js
import { Entidad } from './Entidad.js';

// ✅ CORRECCIÓN: Se añade la palabra 'export'
export class TipoNovedad extends Entidad {
    constructor({ codigo, nombre }) {
        super({ codigo, nombre });
    }
}