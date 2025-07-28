// models/EntityFactory.js

import { Empleado } from './Empleado.js';
import { Area } from './Area.js';
import { Cargo } from './Cargo.js';
import { Concepto } from './Concepto.js';
import { Desprendible } from './Desprendible.js';
import { Nomina } from './Nomina.js';
import { TipoContrato } from './TipoContrato.js';
import { TipoNovedad } from './TipoNovedad.js';
import { Entidad } from './Entidad.js';

export class EntityFactory {
    static create(collectionName, data) {
        switch (collectionName) {
            case 'empleados':
                return new Empleado(data);
            case 'areas':
                return new Area(data);
            // ✅ CORRECCIÓN: Cambiado de 'cargos' a 'cargo' para que coincida con el nombre del archivo.
            case 'cargo':
                return new Cargo(data);
            case 'conceptos':
                return new Concepto(data);
            case 'desprendibles':
                return new Desprendible(data);
            case 'nominas':
                return new Nomina(data);
            case 'tipos_contrato':
                return new TipoContrato(data);
            case 'tipos_novedad':
                return new TipoNovedad(data);
            default:
                throw new Error(`Tipo de entidad desconocido: ${collectionName}`);
        }
    }
}