import { Entidad } from './Entidad.js';

export class TipoNovedad extends Entidad {
    constructor({ codigo, nombre }) {
        super({ codigo, nombre });
    }
}