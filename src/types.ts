export type Rol = 'admin' | 'visualizador';

export interface Perfil {
  id: string;
  email: string;
  nombre: string | null;
  rol: Rol;
  activo: boolean;
  creado_en: string;
}

export interface Modulo {
  id: string;
  nombre: string;
  descripcion: string | null;
  drive_folder_id: string;
  creado_por: string;
  creado_en: string;
  actualizado_en: string;
}

export interface ModuloFoto {
  id: string;
  modulo_id: string;
  drive_file_id: string;
  url_publica: string | null;
  descripcion: string | null;
  orden: number;
  creado_en: string;
}

// Finanzas
export type TipoTransaccion = 'ingreso' | 'gasto';

export interface CategoriaFinanzas {
  id: string;
  nombre: string;
  tipo: 'ingreso' | 'gasto' | 'ambos';
  emoji: string | null;
  creado_en: string;
}

export interface Transaccion {
  id: string;
  tipo: TipoTransaccion;
  categoria_id: string | null;
  monto: number;
  descripcion: string | null;
  fecha: string;
  creado_en: string;
  categorias_finanzas?: CategoriaFinanzas | null;
}

// Metas
export interface Meta {
  id: string;
  titulo: string;
  descripcion: string | null;
  valor_meta: number | null;
  valor_actual: number;
  fecha_limite: string | null;
  completada: boolean;
  creado_en: string;
}

// Gym
export interface Rutina {
  id: string;
  nombre: string;
  descripcion: string | null;
  creado_en: string;
}

export interface DiaRutina {
  id: string;
  rutina_id: string;
  nombre: string;
  orden: number;
}

export interface EjercicioRutina {
  id: string;
  dia_id: string;
  nombre: string;
  series: number;
  reps: string;
  peso_kg: number | null;
  notas: string | null;
  orden: number;
}

// Notas
export interface Nota {
  id: string;
  titulo: string;
  contenido: string | null;
  color: string;
  creado_en: string;
  actualizado_en: string;
}

// Entretenimiento
export type TipoEntretenimiento = 'pelicula' | 'serie' | 'juego';
export type EstadoEntretenimiento = 'visto' | 'quiero' | 'en_progreso';

export interface EntretenimientoItem {
  id: string;
  titulo: string;
  tipo: TipoEntretenimiento;
  estado: EstadoEntretenimiento;
  rating: number | null;
  notas: string | null;
  creado_en: string;
}
