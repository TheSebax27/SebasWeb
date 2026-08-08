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
  orden: number;
  creado_en: string;
}
